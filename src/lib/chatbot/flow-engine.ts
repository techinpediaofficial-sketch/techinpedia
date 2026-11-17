import { db } from '@/lib/db';
import { sendWhatsAppTextMessage, sendWhatsAppTemplateMessage } from '@/lib/whatsapp_service';
import { canSendWhatsAppMessage } from '@/lib/whatsapp-eligibility';
import { AIEngine } from '@/lib/ai/ai-engine';
import { executeHumanHandoff } from '@/lib/ai/handoff-engine';
import { FlowNode, FlowEdge } from './flow-validator';

export interface ChatbotExecutionResult {
  sessionId: string;
  botId: string;
  status: string;
  currentNodeId: string;
  messagesSent: string[];
  handoffTriggered?: boolean;
  handoffReason?: string;
}

export class ChatbotEngine {
  /**
   * Starts a new chatbot session from the entry node
   */
  static async startSession(params: {
    botId: string;
    companyId: string;
    contactId?: string;
    conversationId?: string;
    initialVariables?: Record<string, any>;
  }): Promise<ChatbotExecutionResult> {
    const { botId, companyId, contactId, conversationId, initialVariables = {} } = params;

    const bot = await db.whatsappChatbot.findFirst({
      where: {
        id: botId,
        companyId,
        status: { in: ['ACTIVE', 'DRAFT'] },
      },
    });

    if (!bot) throw new Error('Chatbot not found or inactive');

    const rawNodes = bot.publishedNodesJson || bot.nodesJson;
    const rawEdges = bot.publishedEdgesJson || bot.edgesJson || '[]';

    const nodes: FlowNode[] = JSON.parse(rawNodes);
    const edges: FlowEdge[] = JSON.parse(rawEdges);

    const entryNode = nodes.find(n => n.type === 'entry' || n.type === 'trigger');
    if (!entryNode) throw new Error('No entry node found in chatbot flow');

    // Create session in DB
    const session = await db.chatbotSession.create({
      data: {
        botId: bot.id,
        companyId,
        contactId,
        conversationId,
        currentNodeId: entryNode.id,
        variablesJson: JSON.stringify(initialVariables),
        status: 'ACTIVE',
      },
    });

    // Link conversation to session
    if (conversationId) {
      await db.whatsappConversation.update({
        where: { id: conversationId },
        data: {
          activeChatbotId: bot.id,
          activeChatbotSessionId: session.id,
        },
      });
    }

    // Advance flow starting immediately after entry node
    const outgoingEdge = edges.find(e => e.source === entryNode.id);
    if (!outgoingEdge) {
      await db.chatbotSession.update({
        where: { id: session.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      return {
        sessionId: session.id,
        botId: bot.id,
        status: 'COMPLETED',
        currentNodeId: entryNode.id,
        messagesSent: [],
      };
    }

    return this.runNodeSequence({
      sessionId: session.id,
      botId: bot.id,
      companyId,
      conversationId,
      contactId,
      startNodeId: outgoingEdge.target,
      nodes,
      edges,
      variables: initialVariables,
    });
  }

  /**
   * Resumes an existing waiting chatbot session upon receiving customer input
   */
  static async resumeSession(params: {
    conversationId: string;
    userMessage: string;
    buttonId?: string;
  }): Promise<ChatbotExecutionResult | null> {
    const { conversationId, userMessage, buttonId } = params;

    // Concurrency & Idempotency check: Find active waiting session
    const session = await db.chatbotSession.findFirst({
      where: {
        conversationId,
        status: 'WAITING_FOR_USER',
      },
      include: {
        bot: true,
      },
    });

    if (!session || !session.bot) return null;

    const rawNodes = session.bot.publishedNodesJson || session.bot.nodesJson;
    const rawEdges = session.bot.publishedEdgesJson || session.bot.edgesJson || '[]';
    const nodes: FlowNode[] = JSON.parse(rawNodes);
    const edges: FlowEdge[] = JSON.parse(rawEdges);

    const currentNode = nodes.find(n => n.id === session.currentNodeId);
    let variables: Record<string, any> = {};
    try {
      variables = JSON.parse(session.variablesJson || '{}');
    } catch {}

    let nextNodeId: string | null = null;

    // 1. Process current waiting node input
    if (currentNode?.type === 'question') {
      const varName = currentNode.data?.variableName;
      if (varName) {
        variables[varName] = userMessage;
      }

      // If mapped to contact field
      const contactField = currentNode.data?.contactField;
      if (contactField && session.contactId) {
        if (contactField === 'name') {
          await db.contact.update({ where: { id: session.contactId }, data: { name: userMessage } });
        } else if (contactField === 'email') {
          await db.contact.update({ where: { id: session.contactId }, data: { email: userMessage } });
        } else {
          // Store in customFields JSON
          const contact = await db.contact.findUnique({ where: { id: session.contactId } });
          let cf: Record<string, any> = {};
          try { cf = JSON.parse(contact?.customFields || '{}'); } catch {}
          cf[contactField] = userMessage;
          await db.contact.update({
            where: { id: session.contactId },
            data: { customFields: JSON.stringify(cf) },
          });
        }
      }

      const nextEdge = edges.find(e => e.source === currentNode.id);
      nextNodeId = nextEdge ? nextEdge.target : null;
    } else if (currentNode?.type === 'buttons') {
      const selectedChoice = buttonId || userMessage;
      variables[currentNode.data?.variableName || 'selectedButton'] = selectedChoice;

      // Match edge by handle or fallback to default
      const matchedEdge =
        edges.find(e => e.source === currentNode.id && e.sourceHandle === selectedChoice) ||
        edges.find(e => e.source === currentNode.id);
      nextNodeId = matchedEdge ? matchedEdge.target : null;
    } else {
      const nextEdge = edges.find(e => e.source === session.currentNodeId);
      nextNodeId = nextEdge ? nextEdge.target : null;
    }

    if (!nextNodeId) {
      await db.chatbotSession.update({
        where: { id: session.id },
        data: {
          status: 'COMPLETED',
          variablesJson: JSON.stringify(variables),
          completedAt: new Date(),
        },
      });
      return {
        sessionId: session.id,
        botId: session.botId,
        status: 'COMPLETED',
        currentNodeId: session.currentNodeId,
        messagesSent: [],
      };
    }

    // Update session to ACTIVE before progressing
    await db.chatbotSession.update({
      where: { id: session.id },
      data: {
        status: 'ACTIVE',
        variablesJson: JSON.stringify(variables),
        lastStepAt: new Date(),
      },
    });

    return this.runNodeSequence({
      sessionId: session.id,
      botId: session.botId,
      companyId: session.companyId || '',
      conversationId: session.conversationId || undefined,
      contactId: session.contactId || undefined,
      startNodeId: nextNodeId,
      nodes,
      edges,
      variables,
    });
  }

  /**
   * Executes continuous sequence of nodes until stopping condition
   */
  private static async runNodeSequence(params: {
    sessionId: string;
    botId: string;
    companyId: string;
    conversationId?: string;
    contactId?: string;
    startNodeId: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
    variables: Record<string, any>;
  }): Promise<ChatbotExecutionResult> {
    const { sessionId, botId, companyId, conversationId, contactId, nodes, edges } = params;
    let currentNodeId: string | null = params.startNodeId;
    const variables = { ...params.variables };
    const messagesSent: string[] = [];

    // Max 10 sequential execution steps per inbound invocation to prevent infinite loops
    let stepCount = 0;
    const maxSteps = 10;

    // Fetch conversation details if available
    let conversationPhone = '';
    if (conversationId) {
      const conv = await db.whatsappConversation.findUnique({ where: { id: conversationId } });
      if (conv) conversationPhone = conv.waNumber;
    }

    while (currentNodeId && stepCount < maxSteps) {
      stepCount++;
      const node = nodes.find(n => n.id === currentNodeId);
      if (!node) break;

      // Update current node pointer in session
      await db.chatbotSession.update({
        where: { id: sessionId },
        data: {
          currentNodeId: node.id,
          variablesJson: JSON.stringify(variables),
          lastStepAt: new Date(),
        },
      });

      // 1. Send Message Node
      if (node.type === 'send_message') {
        const msgType = node.data?.messageType || 'text';
        let textToSend = node.data?.text || '';

        // Variable interpolation: {{varName}}
        textToSend = textToSend.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_: string, k: string) => {
          return variables[k] !== undefined ? String(variables[k]) : '';
        });

        if (conversationPhone && textToSend) {
          // Check compliance eligibility
          const eligibility = await canSendWhatsAppMessage({
            companyId,
            phone: conversationPhone,
            isMarketing: false,
            isTemplate: msgType === 'template',
            templateName: node.data?.templateName,
          });

          if (eligibility.allowed) {
            if (msgType === 'template' && node.data?.templateName) {
              await sendWhatsAppTemplateMessage(
                conversationPhone,
                node.data.templateName,
                'en_US',
                [],
                undefined,
                { companyId }
              );
            } else {
              await sendWhatsAppTextMessage(conversationPhone, textToSend, { companyId });
            }
            messagesSent.push(textToSend);
          }
        }

        const nextEdge = edges.find(e => e.source === node.id);
        currentNodeId = nextEdge ? nextEdge.target : null;
        continue;
      }

      // 2. Question / User Input Node
      if (node.type === 'question') {
        const questionText = node.data?.questionText || 'Please reply:';
        if (conversationPhone) {
          await sendWhatsAppTextMessage(conversationPhone, questionText, { companyId });
          messagesSent.push(questionText);
        }

        // Stop and wait for user response!
        await db.chatbotSession.update({
          where: { id: sessionId },
          data: { status: 'WAITING_FOR_USER' },
        });

        return {
          sessionId,
          botId,
          status: 'WAITING_FOR_USER',
          currentNodeId: node.id,
          messagesSent,
        };
      }

      // 3. Interactive Buttons Node
      if (node.type === 'buttons') {
        const bodyText = node.data?.bodyText || 'Please select an option:';
        if (conversationPhone) {
          await sendWhatsAppTextMessage(conversationPhone, bodyText, { companyId });
          messagesSent.push(bodyText);
        }

        await db.chatbotSession.update({
          where: { id: sessionId },
          data: { status: 'WAITING_FOR_USER' },
        });

        return {
          sessionId,
          botId,
          status: 'WAITING_FOR_USER',
          currentNodeId: node.id,
          messagesSent,
        };
      }

      // 4. Condition Branching Node
      if (node.type === 'condition') {
        const field = node.data?.field;
        const operator = node.data?.operator || 'equals';
        const expectedValue = node.data?.value;
        const actualValue = variables[field];

        let isTrue = false;
        if (operator === 'equals') isTrue = String(actualValue).toLowerCase() === String(expectedValue).toLowerCase();
        if (operator === 'contains') isTrue = String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
        if (operator === 'exists') isTrue = actualValue !== undefined && actualValue !== null && actualValue !== '';

        const branchHandle = isTrue ? 'true' : 'false';
        const branchEdge =
          edges.find(e => e.source === node.id && e.sourceHandle === branchHandle) ||
          edges.find(e => e.source === node.id);

        currentNodeId = branchEdge ? branchEdge.target : null;
        continue;
      }

      // 5. Add / Remove Tag Node
      if (node.type === 'add_tag' && contactId) {
        const tag = node.data?.tagName;
        if (tag) {
          const contact = await db.contact.findUnique({ where: { id: contactId } });
          let tags: string[] = [];
          try { tags = JSON.parse(contact?.tags || '[]'); } catch {}
          if (!tags.includes(tag)) {
            tags.push(tag);
            await db.contact.update({ where: { id: contactId }, data: { tags: JSON.stringify(tags) } });
          }
        }
        const nextEdge = edges.find(e => e.source === node.id);
        currentNodeId = nextEdge ? nextEdge.target : null;
        continue;
      }

      // 6. Assign Employee Node
      if (node.type === 'assign_employee' && conversationId) {
        const targetUserId = node.data?.userId;
        await db.whatsappConversation.update({
          where: { id: conversationId },
          data: {
            assignedUserId: targetUserId || undefined,
            assignedAt: new Date(),
            assignmentAcceptedAt: null, // Reset SLA timer
          },
        });
        const nextEdge = edges.find(e => e.source === node.id);
        currentNodeId = nextEdge ? nextEdge.target : null;
        continue;
      }

      // 7. Central AI Response Node
      if (node.type === 'ai_response') {
        const prompt = node.data?.prompt || variables.lastUserMessage || 'How can I help you?';
        const aiRes = await AIEngine.generateReply({
          companyId,
          conversationId,
          contactId,
          feature: 'CHATBOT',
          messages: [{ role: 'user', content: prompt }],
        });

        if (conversationPhone && aiRes.reply) {
          await sendWhatsAppTextMessage(conversationPhone, aiRes.reply, { companyId });
          messagesSent.push(aiRes.reply);
        }

        if (aiRes.handoffRecommended && conversationId) {
          await executeHumanHandoff({
            companyId,
            conversationId,
            reason: aiRes.handoffReason || 'AI Response Recommendation',
          });
          return {
            sessionId,
            botId,
            status: 'HANDED_OFF',
            currentNodeId: node.id,
            messagesSent,
            handoffTriggered: true,
            handoffReason: aiRes.handoffReason,
          };
        }

        const nextEdge = edges.find(e => e.source === node.id);
        currentNodeId = nextEdge ? nextEdge.target : null;
        continue;
      }

      // 8. Human Handoff Node
      if (node.type === 'human_handoff') {
        const reason = node.data?.reason || 'Bot flow reached human handoff node';
        if (conversationId) {
          await executeHumanHandoff({
            companyId,
            conversationId,
            reason,
            targetUserId: node.data?.userId,
          });
        }

        await db.chatbotSession.update({
          where: { id: sessionId },
          data: {
            status: 'HANDED_OFF',
            handoffReason: reason,
            completedAt: new Date(),
          },
        });

        return {
          sessionId,
          botId,
          status: 'HANDED_OFF',
          currentNodeId: node.id,
          messagesSent,
          handoffTriggered: true,
          handoffReason: reason,
        };
      }

      // 9. End Flow Node
      if (node.type === 'end') {
        await db.chatbotSession.update({
          where: { id: sessionId },
          data: {
            status: 'COMPLETED',
            variablesJson: JSON.stringify(variables),
            completedAt: new Date(),
          },
        });

        if (conversationId) {
          await db.whatsappConversation.update({
            where: { id: conversationId },
            data: {
              activeChatbotId: null,
              activeChatbotSessionId: null,
            },
          });
        }

        return {
          sessionId,
          botId,
          status: 'COMPLETED',
          currentNodeId: node.id,
          messagesSent,
        };
      }

      // Fallback: move to next edge
      const fallbackEdge = edges.find(e => e.source === node.id);
      currentNodeId = fallbackEdge ? fallbackEdge.target : null;
    }

    // Reached end of connected path
    await db.chatbotSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        variablesJson: JSON.stringify(variables),
        completedAt: new Date(),
      },
    });

    return {
      sessionId,
      botId,
      status: 'COMPLETED',
      currentNodeId: currentNodeId || '',
      messagesSent,
    };
  }
}
