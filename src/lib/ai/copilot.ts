import { db } from '@/lib/db';
import { AIEngine, AiChatMessage } from './ai-engine';
import { retrieveRelevantKnowledge } from './knowledge-retrieval';

export class AiCopilot {
  /**
   * Suggest 2-3 potential responses for an employee handling a chat
   */
  static async suggestReplies(params: {
    companyId: string;
    conversationId: string;
  }): Promise<{ suggestions: string[] }> {
    const { companyId, conversationId } = params;

    const messages = await db.whatsappMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    const conversationHistory: AiChatMessage[] = messages.reverse().map(m => ({
      role: m.direction === 'INBOUND' ? 'user' : 'assistant',
      content: m.textBody || `[${m.type} message]`,
    }));

    const lastInbound = messages.filter(m => m.direction === 'INBOUND').pop()?.textBody || '';
    const knowledgeMatch = await retrieveRelevantKnowledge({ companyId, query: lastInbound, maxChunks: 2 });

    const promptMessages: AiChatMessage[] = [
      ...conversationHistory,
      {
        role: 'user',
        content: `Based on our company's knowledge and recent messages, provide exactly 3 concise, friendly suggested replies an employee can send next. Output each suggestion on a separate line starting with a bullet ("- "). Do not include commentary.`,
      },
    ];

    const res = await AIEngine.generateReply({
      companyId,
      conversationId,
      feature: 'COPILOT',
      messages: promptMessages,
      skipKnowledgeRetrieval: true,
      maxTokens: 300,
    });

    const lines = res.reply
      .split('\n')
      .map(l => l.replace(/^[-*•\d.]\s*/, '').trim())
      .filter(l => l.length > 5);

    return {
      suggestions: lines.slice(0, 3),
    };
  }

  /**
   * Rewrite or adjust tone of an employee draft
   */
  static async rewriteDraft(params: {
    companyId: string;
    draftText: string;
    style: 'PROFESSIONAL' | 'SHORTER' | 'FRIENDLY' | 'SALES_CONSULTATIVE';
  }): Promise<{ rewrittenText: string }> {
    const { companyId, draftText, style } = params;

    let instruction = 'Rewrite the message to be polite and professional.';
    if (style === 'SHORTER') instruction = 'Make this message significantly more concise and punchy without losing meaning.';
    if (style === 'FRIENDLY') instruction = 'Make this message warm, friendly, and approachable with positive energy.';
    if (style === 'SALES_CONSULTATIVE') instruction = 'Rewrite this message in a consultative sales tone, encouraging the customer toward the next logical step.';

    const res = await AIEngine.generateReply({
      companyId,
      feature: 'COPILOT',
      messages: [
        {
          role: 'user',
          content: `${instruction}\n\nOriginal draft: "${draftText}"\n\nReturn only the rewritten message text.`,
        },
      ],
      maxTokens: 250,
      skipKnowledgeRetrieval: true,
    });

    return {
      rewrittenText: res.reply.replace(/^["']|["']$/g, '').trim(),
    };
  }

  /**
   * Summarize a customer conversation
   */
  static async summarizeConversation(params: {
    companyId: string;
    conversationId: string;
  }): Promise<{
    summary: string;
    customerNeed: string;
    leadStatus: string;
    sentiment: string;
    nextAction: string;
  }> {
    const { companyId, conversationId } = params;

    const messages = await db.whatsappMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const formattedTranscript = messages
      .map(m => `${m.direction === 'INBOUND' ? 'Customer' : 'Agent'}: ${m.textBody || '[Media]'}`)
      .join('\n');

    const prompt = `Analyze this customer WhatsApp conversation and provide a structured JSON summary with the following keys:
- "summary": 2 sentence general overview
- "customerNeed": what specific product or service they need
- "leadStatus": "PROSPECT", "QUALIFIED", "NEEDS_FOLLOW_UP", or "RESOLVED"
- "sentiment": "POSITIVE", "NEUTRAL", "CONFUSED", or "FRUSTRATED"
- "nextAction": recommended next step for the team

Transcript:
${formattedTranscript}

Output strictly valid JSON only.`;

    const res = await AIEngine.generateReply({
      companyId,
      conversationId,
      feature: 'SUMMARY',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 400,
      skipKnowledgeRetrieval: true,
    });

    try {
      const jsonStart = res.reply.indexOf('{');
      const jsonEnd = res.reply.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = res.reply.slice(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr);
        return {
          summary: parsed.summary || 'Summary generated',
          customerNeed: parsed.customerNeed || 'General Inquiry',
          leadStatus: parsed.leadStatus || 'NEEDS_FOLLOW_UP',
          sentiment: parsed.sentiment || 'NEUTRAL',
          nextAction: parsed.nextAction || 'Reply to customer',
        };
      }
    } catch (e) {
      console.error('[AiCopilot] Failed to parse summary JSON:', e);
    }

    return {
      summary: res.reply.slice(0, 200),
      customerNeed: 'Inquiry',
      leadStatus: 'NEEDS_FOLLOW_UP',
      sentiment: 'NEUTRAL',
      nextAction: 'Review conversation',
    };
  }

  /**
   * Extract qualification fields from customer conversation and update Contact Custom Fields
   */
  static async extractLeadQualification(params: {
    companyId: string;
    conversationId: string;
    contactId?: string;
  }): Promise<{ fields: Record<string, string> }> {
    const { companyId, conversationId, contactId } = params;

    const messages = await db.whatsappMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    const transcript = messages
      .reverse()
      .map(m => `${m.direction === 'INBOUND' ? 'Customer' : 'Agent'}: ${m.textBody || ''}`)
      .join('\n');

    const prompt = `Extract standard business qualification fields from this conversation where mentioned.
Keys to extract if found: "serviceRequired", "budgetRange", "location", "timeline", "companySize".
If a field was not mentioned, set its value to null.
Transcript:
${transcript}

Output strictly valid JSON with key-value pairs.`;

    const res = await AIEngine.generateReply({
      companyId,
      conversationId,
      contactId,
      feature: 'LEAD_QUALIFICATION',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 300,
      skipKnowledgeRetrieval: true,
    });

    let extracted: Record<string, string> = {};
    try {
      const jsonStart = res.reply.indexOf('{');
      const jsonEnd = res.reply.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(res.reply.slice(jsonStart, jsonEnd + 1));
        for (const [k, v] of Object.entries(parsed)) {
          if (v && typeof v === 'string') {
            extracted[k] = v;
          }
        }
      }
    } catch {}

    // If contactId is present, persist non-empty fields to Contact customFields
    if (contactId && Object.keys(extracted).length > 0) {
      const contact = await db.contact.findFirst({ where: { id: contactId, companyId } });
      if (contact) {
        let existingCustom: Record<string, any> = {};
        try {
          existingCustom = contact.customFields ? JSON.parse(contact.customFields) : {};
        } catch {}

        const merged = { ...existingCustom, ...extracted };
        await db.contact.update({
          where: { id: contactId },
          data: { customFields: JSON.stringify(merged) },
        });
      }
    }

    return { fields: extracted };
  }
}
