import { db } from '@/lib/db';
import { ContextPacketBuilder, FullAiContextPacket } from './context-packet';
import { IntentEngine, DetectedIntentResult } from './intent-engine';
import { AiToolRunner } from './tools';
import { AIEngine, AiChatMessage } from './ai-engine';
import { executeHumanHandoff } from './handoff-engine';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp_service';
import { TemplateRouter } from '@/lib/whatsapp/template_router';

export interface OrchestrationResult {
  handled: boolean;
  intent: string;
  confidence: number;
  responseType: 'ANSWER' | 'ACTION' | 'HANDOFF' | 'CLARIFICATION' | 'SKIPPED';
  replyText?: string;
  actionExecuted?: string;
  needsHuman: boolean;
  department?: string;
  handoffReason?: string;
  knowledgeChunksUsed: string[];
  toolsCalled: string[];
}

export class AiOrchestrator {
  /**
   * Main entry point for inbound customer message processing.
   */
  static async handleInboundMessage(params: {
    companyId: string;
    conversationId: string;
    messageText: string;
    senderPhone: string;
    senderName?: string;
  }): Promise<OrchestrationResult> {
    const { companyId, conversationId, messageText, senderPhone, senderName } = params;
    const cleanText = (messageText || '').trim();

    // 1. Check Conversation Handoff State
    const conv = await db.whatsappConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      return {
        handled: false,
        intent: 'UNKNOWN',
        confidence: 0,
        responseType: 'SKIPPED',
        needsHuman: false,
        knowledgeChunksUsed: [],
        toolsCalled: [],
      };
    }

    // STRICT RULE: If human is active or AI is paused, AI MUST NEVER auto-reply!
    if (conv.isAiPaused || conv.handoffState === 'HUMAN_ACTIVE') {
      console.log(`[AiOrchestrator] Chat is currently handled by human (isAiPaused=${conv.isAiPaused}, handoffState=${conv.handoffState}). AI skipped.`);
      return {
        handled: true,
        intent: 'HUMAN_ACTIVE_BYPASS',
        confidence: 1.0,
        responseType: 'SKIPPED',
        needsHuman: true,
        knowledgeChunksUsed: [],
        toolsCalled: [],
      };
    }

    // 2. Build Full 360° Context Packet
    const packet: FullAiContextPacket = await ContextPacketBuilder.buildPacket({
      companyId,
      conversationId,
      userMessage: cleanText,
      senderName,
      phone: senderPhone,
    });

    // 3. Detect Intent & Escalation Signals
    const intentResult: DetectedIntentResult = await IntentEngine.detectIntent(companyId, cleanText);
    const toolsCalled: string[] = [];
    let liveBusinessData: any = null;

    // Track loops & customer frustration
    let loopCounter = packet.conversation.memory.loop_counter || 0;
    let frustrationCount = packet.conversation.memory.frustration_count || 0;

    const isNegativeFeedback = /(nahi\s+samjhe|samajh\s+nahi|wrong|galat|not\s+understanding|phir\s+se\s+wahi|baar\s+baar)/i.test(cleanText);
    if (isNegativeFeedback) {
      loopCounter += 1;
      frustrationCount += 1;
    }

    // Check for explicit Human Agent Request OR High Frustration
    if (intentResult.intentName === 'HUMAN_AGENT_REQUEST' || frustrationCount >= 2 || loopCounter >= 2) {
      const handoffReason = intentResult.intentName === 'HUMAN_AGENT_REQUEST'
        ? 'Customer explicitly requested human assistance'
        : 'Customer expressed frustration / conversation loop detected';

      const handoffReply = packet.customer.language === 'en'
        ? "Sure! I am connecting you with our support team right now. An executive will join and assist you shortly."
        : "Ji zaroor! Main aapko hamari team se connect kar rahi hu. Hamare executive aapse thodi der me baat karenge.";

      await sendWhatsAppTextMessage(senderPhone, handoffReply, { companyId });

      await executeHumanHandoff({
        companyId,
        conversationId,
        reason: handoffReason,
        department: intentResult.department || 'SUPPORT',
        priority: frustrationCount >= 2 ? 'HIGH' : 'NORMAL',
        customerAsked: cleanText,
        intent: intentResult.intentName,
      });

      return {
        handled: true,
        intent: intentResult.intentName,
        confidence: 0.98,
        responseType: 'HANDOFF',
        replyText: handoffReply,
        needsHuman: true,
        department: intentResult.department || 'SUPPORT',
        handoffReason,
        knowledgeChunksUsed: [],
        toolsCalled: ['requestHumanAgent'],
      };
    }

    // 4. Tool & Live Business Data Execution based on Intent
    let selectedPackageNumber = packet.conversation.memory.current_package_id;

    // Check if user specified a package in current message (e.g. "Rice Wax", "Package 2", "Option 1")
    const pkgMatch = cleanText.match(/\b([1-9])\b|rice\s*wax|glam\s*special|super\s*saver|golden\s*glow|patel\s*glow|premium\s*glow|soft\s*glam|divine\s*glow|elite\s*glow/i);
    if (pkgMatch) {
      const queryKey = pkgMatch[1] || pkgMatch[0];
      const pkgDetails = await AiToolRunner.executeTool('getPackageDetails', { packageIdentifier: queryKey }, {
        companyId,
        conversationId,
        customerPhone: senderPhone,
      });
      if (pkgDetails.success && pkgDetails.data) {
        liveBusinessData = { package: pkgDetails.data };
        selectedPackageNumber = String(pkgDetails.data.number);
        toolsCalled.push('getPackageDetails');
      }
    }

    // Booking Intent with context memory
    if (intentResult.intentName === 'BOOKING_REQUEST') {
      // If a package was already selected in context or mentioned now
      if (selectedPackageNumber) {
        const pkgDetails = await AiToolRunner.executeTool('getPackageDetails', { packageIdentifier: selectedPackageNumber }, {
          companyId,
          conversationId,
          customerPhone: senderPhone,
        });
        liveBusinessData = {
          bookingReady: true,
          package: pkgDetails.data,
          slots: ['10:00 AM', '12:30 PM', '02:30 PM', '04:30 PM', '06:00 PM'],
        };
        toolsCalled.push('getPackageDetails');
      } else {
        // No package selected yet, fetch package list
        const pkgList = await AiToolRunner.executeTool('getPackageList', {}, { companyId, conversationId });
        liveBusinessData = { packageList: pkgList.data };
        toolsCalled.push('getPackageList');
      }
    }

    // Booking status check
    if (intentResult.intentName === 'BOOKING_STATUS') {
      const statusRes = await AiToolRunner.executeTool('getBookingStatus', { phone: senderPhone }, { companyId, conversationId });
      liveBusinessData = { bookingStatus: statusRes.data };
      toolsCalled.push('getBookingStatus');
    }

    // 5. Construct Modular System Prompt
    const systemPrompt = this.constructModularPrompt(packet, intentResult, liveBusinessData);

    // 6. Generate Response via AIEngine
    const historyMessages: AiChatMessage[] = packet.conversation.messagesTranscript.map(m => ({
      role: m.role,
      content: m.text,
    }));

    // Ensure system prompt is at the top
    const fullMessages: AiChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: cleanText },
    ];

    const aiRes = await AIEngine.generateReply({
      companyId,
      conversationId,
      contactId: packet.customer.customerId || undefined,
      feature: 'CHATBOT',
      messages: fullMessages,
      customerContext: {
        name: packet.customer.name,
        phone: senderPhone,
        leadStatus: packet.customer.leadStage || undefined,
        tags: packet.customer.tags,
      },
    });

    let confidence = intentResult.confidence;
    // Lower confidence if no knowledge matched and intent is UNKNOWN
    if (intentResult.intentName === 'UNKNOWN' && (!packet.knowledgeMatch || packet.knowledgeMatch.matchStatus === 'NO_MATCH')) {
      confidence = 0.40;
    }

    // 7. Check Confidence Threshold (< 0.55 Triggers Handoff)
    const config = await AIEngine.getConfig(companyId);
    const minThreshold = config.handoffThresholdScore || 0.65;

    if (confidence < 0.55) {
      console.warn(`[AiOrchestrator] Low confidence (${confidence} < 0.55). Escalating to human agent.`);
      
      // Log Knowledge Gap in AiKnowledgeSuggestion
      await db.aiKnowledgeSuggestion.upsert({
        where: { id: `gap-${companyId}-${cleanText.slice(0, 30).toLowerCase().replace(/\s+/g, '-')}` },
        create: {
          id: `gap-${companyId}-${cleanText.slice(0, 30).toLowerCase().replace(/\s+/g, '-')}`,
          companyId,
          question: cleanText,
          proposedAnswer: 'Customer asked question with low AI confidence. Needs official company answer.',
          sourceQuery: cleanText,
          frequency: 1,
          status: 'PENDING',
        },
        update: {
          frequency: { increment: 1 },
        },
      }).catch(() => {});

      const safeHandoffMsg = packet.customer.language === 'en'
        ? "I want to ensure you get accurate information, so I'm connecting you directly with our team who can help you with this."
        : "Main chahti hu ki aapko bilkul sahi jankari mile, isliye main aapko hamari team se connect kar rahi hu jo isme aapki help karenge.";

      await sendWhatsAppTextMessage(senderPhone, safeHandoffMsg, { companyId });

      await executeHumanHandoff({
        companyId,
        conversationId,
        reason: 'Low AI confidence on query: ' + cleanText.slice(0, 50),
        department: intentResult.department || 'SUPPORT',
        priority: 'NORMAL',
        customerAsked: cleanText,
        intent: intentResult.intentName,
      });

      return {
        handled: true,
        intent: intentResult.intentName,
        confidence,
        responseType: 'HANDOFF',
        replyText: safeHandoffMsg,
        needsHuman: true,
        department: intentResult.department || 'SUPPORT',
        handoffReason: 'Low AI confidence',
        knowledgeChunksUsed: [],
        toolsCalled,
      };
    }

    // 8. Dispatch Reply to Customer via WhatsApp
    const replyToSend = aiRes.reply;
    if (replyToSend) {
      await sendWhatsAppTextMessage(senderPhone, replyToSend, { companyId });
    }

    // 9. Update Conversation Structured Memory & State
    const updatedMemory = {
      ...packet.conversation.memory,
      current_intent: intentResult.intentName,
      last_user_question: cleanText,
      last_ai_action: liveBusinessData ? 'TOOL_QUERY' : 'DIRECT_REPLY',
      current_package_id: selectedPackageNumber,
      loop_counter: loopCounter,
      frustration_count: frustrationCount,
      booking_stage: liveBusinessData?.bookingReady ? 'PACKAGE_SELECTED' : packet.conversation.memory.booking_stage,
      customer_language: packet.customer.language,
    };

    await db.whatsappConversation.update({
      where: { id: conversationId },
      data: {
        aiStateJson: JSON.stringify(updatedMemory),
        bookingPackageId: selectedPackageNumber || conv.bookingPackageId,
        lastViewedPackageId: selectedPackageNumber || conv.lastViewedPackageId,
      },
    }).catch(() => {});

    // 10. Audit Log in AiUsageLog
    await db.aiUsageLog.create({
      data: {
        companyId,
        conversationId,
        contactId: packet.customer.customerId || null,
        provider: aiRes.providerUsed,
        model: aiRes.modelUsed,
        feature: 'CHATBOT',
        promptTokens: aiRes.tokens.promptTokens,
        completionTokens: aiRes.tokens.completionTokens,
        totalTokens: aiRes.tokens.totalTokens,
        estimatedCost: aiRes.estimatedCost,
        latencyMs: aiRes.latencyMs,
        isFallback: aiRes.isFallback,
        intent: intentResult.intentName,
        confidence,
        toolsCalled: toolsCalled.length > 0 ? JSON.stringify(toolsCalled) : null,
        retrievedKnowledgeIds: packet.knowledgeMatch?.chunks?.map(c => c.chunkId)?.join(',') || null,
        handoffDecision: 'ANSWER',
      },
    }).catch(() => {});

    return {
      handled: true,
      intent: intentResult.intentName,
      confidence,
      responseType: 'ANSWER',
      replyText: replyToSend,
      needsHuman: false,
      knowledgeChunksUsed: packet.knowledgeMatch?.chunks?.map(c => c.chunkId) || [],
      toolsCalled,
    };
  }

  /**
   * Constructs modular, section-based prompt matching Section 24 of prompt guidelines:
   * System Identity, Company Profile, Customer Context, Conversation Summary,
   * Relevant Knowledge, Live Business Data, Handoff Rules, and Response Rules.
   */
  private static constructModularPrompt(
    packet: FullAiContextPacket,
    intent: DetectedIntentResult,
    liveData?: any
  ): string {
    const { customer, conversation, company, knowledgeMatch } = packet;
    const parts: string[] = [];

    // 1. System Identity
    parts.push(`=== 1. SYSTEM IDENTITY ===`);
    parts.push(`You are ${company.botName}, the official senior Customer Support & Sales Executive at ${company.brandName}.`);
    parts.push(`Your mission: Act like an experienced, warm, polite, and trustworthy company executive.`);
    parts.push(`Language Policy: The customer speaks ${customer.language.toUpperCase()}. You MUST respond in natural, friendly ${customer.language.toUpperCase()} (Hinglish/English as appropriate). Do not switch language unnecessarily.`);

    // 2. Company Profile & Policies
    parts.push(`\n=== 2. COMPANY PROFILE & POLICIES ===`);
    parts.push(`Brand: ${company.brandName}`);
    parts.push(`Operating Hours: ${company.workingHours}`);
    parts.push(`Quality Guarantee: ${company.supportPolicies}`);
    parts.push(`Cancellation/Refund: ${company.refundPolicy}`);
    parts.push(`Locations Served: Lucknow (Gomti Nagar, Alambagh, Indira Nagar, Hazratganj, Mahanagar, Ashiyana, etc.). Verified female beauticians arrive with sanitized kits.`);

    // 3. Customer & Conversation Memory
    parts.push(`\n=== 3. CUSTOMER & CONVERSATION MEMORY ===`);
    parts.push(`Customer Name: ${customer.name}`);
    parts.push(`Phone: ${customer.phone}`);
    parts.push(`Lead Stage: ${customer.leadStage || 'Active Inquiry'}`);
    if (conversation.memory.current_package_id) {
      parts.push(`Currently Selected/Discussed Package: Option ${conversation.memory.current_package_id}`);
    }
    if (conversation.memory.booking_stage) {
      parts.push(`Current Booking Stage: ${conversation.memory.booking_stage}`);
    }

    // 4. Verified Company Knowledge (RAG)
    if (knowledgeMatch && knowledgeMatch.chunks.length > 0) {
      parts.push(`\n=== 4. VERIFIED COMPANY KNOWLEDGE (Tenant Isolated) ===`);
      knowledgeMatch.chunks.forEach((c, idx) => {
        parts.push(`[Knowledge Source ${idx + 1} - ${c.title || 'FAQ'}]:\n${c.content}\n`);
      });
    }

    // 5. Live Business Data (Live Database Truth)
    if (liveData) {
      parts.push(`\n=== 5. LIVE BUSINESS DATA (Live Truth - NEVER HALLUCINATE) ===`);
      parts.push(JSON.stringify(liveData, null, 2));
    }

    // 6. Verified Service Packages Catalog
    if (company.packages && company.packages.length > 0) {
      parts.push(`\n=== 6. VERIFIED PACKAGES (Authoritative Pricing) ===`);
      company.packages.forEach(p => {
        parts.push(`Option ${p.number}: ${p.name} - ${p.price} | Inclusions: ${p.services} | Free Gift: ${p.freeBonus}`);
      });
    }

    // 7. Strict Operational Rules & Etiquette
    parts.push(`\n=== 7. STRICT RESPONSE RULES ===`);
    parts.push(`1. Direct & Concise: Answer the customer's exact question FIRST. Keep answers clean, conversational, and WhatsApp-friendly (2-4 concise sentences max).`);
    parts.push(`2. Memory Rule: If the customer already chose or mentioned a package (e.g. Rice Wax), and says "Book karna hai", DO NOT ask "Which package do you want?". Know it is Option 2 (Rice Wax Special ₹1,388) and proceed with booking!`);
    parts.push(`3. Never Hallucinate: NEVER invent prices, discounts, or policies not in section 4, 5, or 6. If you do not know, say so politely and offer human staff assistance.`);
    parts.push(`4. Follow-up Questions: Ask only ONE relevant next question. For booking: ask for preferred date/time slot or address in Lucknow.`);
    parts.push(`5. Clean Formatting: Use simple WhatsApp bullets or numbers when listing options.`);

    return parts.join('\n');
  }
}
