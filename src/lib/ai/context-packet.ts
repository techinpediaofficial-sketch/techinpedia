import { db } from '@/lib/db';
import { retrieveRelevantKnowledge, KnowledgeMatchResult } from './knowledge-retrieval';

export interface CustomerContextData {
  name: string;
  phone: string;
  customerId?: string | null;
  leadId?: string | null;
  leadStage?: string | null;
  tags: string[];
  city: string;
  language: string;
  previousIssues?: string | null;
  assignedExecutive?: string | null;
}

export interface StructuredConversationMemory {
  current_intent: string;
  current_topic: string;
  last_user_question: string;
  last_ai_action: string;
  selected_package_ids: string[];
  current_package_id: string | null;
  booking_package_id: string | null;
  booking_stage: string; // 'INQUIRY' | 'PACKAGE_SELECTED' | 'SLOT_REQUESTED' | 'CONFIRMED' | 'HANDOFF'
  customer_language: string; // 'en' | 'hi' | 'hinglish'
  unresolved_fields: string[];
  loop_counter: number;
  frustration_count: number;
  conversation_summary: string;
  handoff_state: string; // 'AI_ACTIVE' | 'HANDOFF_REQUESTED' | 'WAITING_FOR_AGENT' | 'HUMAN_ACTIVE' | 'RETURNED_TO_AI' | 'CLOSED'
  lastHandoffReason?: string;
}

export interface CompanyContextData {
  companyId: string;
  brandName: string;
  botName: string;
  role: string;
  workingHours: string;
  supportPolicies: string;
  refundPolicy: string;
  packages: Array<{
    number: string;
    name: string;
    price: string;
    services: string;
    freeBonus: string;
  }>;
}

export interface FullAiContextPacket {
  customer: CustomerContextData;
  conversation: {
    id: string;
    waNumber: string;
    status: string;
    handoffState: string;
    isAiPaused: boolean;
    messagesTranscript: Array<{
      role: 'user' | 'assistant';
      senderType: string;
      text: string;
      time: string;
    }>;
    memory: StructuredConversationMemory;
  };
  company: CompanyContextData;
  knowledgeMatch?: KnowledgeMatchResult;
}

export class ContextPacketBuilder {
  /**
   * Compiles the 360° Context Packet before AI generation.
   */
  static async buildPacket(params: {
    companyId: string;
    conversationId: string;
    userMessage: string;
    senderName?: string;
    phone: string;
  }): Promise<FullAiContextPacket> {
    const { companyId, conversationId, userMessage, senderName, phone } = params;
    const normPhone = phone.replace(/^\+/, '').slice(-10);

    // 1. Fetch Customer / Lead Context
    const [contact, lead] = await Promise.all([
      db.contact.findFirst({
        where: {
          companyId,
          phone: { contains: normPhone },
        },
      }),
      db.enquiry.findFirst({
        where: {
          companyId,
          phone: { contains: normPhone },
        },
        orderBy: { createdAt: 'desc' },
        include: { assignedUser: { select: { name: true } } },
      }),
    ]);

    let tags: string[] = [];
    if (contact?.tags) {
      try {
        tags = JSON.parse(contact.tags);
      } catch {}
    }

    const customer: CustomerContextData = {
      name: contact?.name || lead?.name || senderName || 'Valued Customer',
      phone,
      customerId: contact?.id || null,
      leadId: lead?.id || null,
      leadStage: lead?.leadStage || 'NEW_LEAD',
      tags,
      city: contact?.city || 'Lucknow',
      language: this.detectLanguage(userMessage),
      assignedExecutive: lead?.assignedUser?.name || null,
    };

    // 2. Fetch Conversation and Transcript
    const conv = await db.whatsappConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
      },
    });

    const rawTranscript = (conv?.messages || []).reverse();
    const messagesTranscript = rawTranscript.map(m => ({
      role: (m.direction === 'INBOUND' ? 'user' : 'assistant') as 'user' | 'assistant',
      senderType: m.senderType,
      text: m.textBody || `[${m.type} message]`,
      time: m.createdAt.toISOString(),
    }));

    // Parse structured memory
    let memory: StructuredConversationMemory = {
      current_intent: 'GENERAL_QUERY',
      current_topic: 'Services',
      last_user_question: userMessage,
      last_ai_action: 'NONE',
      selected_package_ids: [],
      current_package_id: null,
      booking_package_id: null,
      booking_stage: 'INQUIRY',
      customer_language: customer.language,
      unresolved_fields: [],
      loop_counter: 0,
      frustration_count: 0,
      conversation_summary: 'New conversation initiated.',
      handoff_state: conv?.handoffState || 'AI_ACTIVE',
    };

    if (conv?.aiStateJson) {
      try {
        const parsed = JSON.parse(conv.aiStateJson);
        memory = { ...memory, ...parsed };
      } catch {}
    }

    // Also pick up package IDs from conversation if present
    if (conv?.selectedPackageIdsJson) {
      try {
        memory.selected_package_ids = JSON.parse(conv.selectedPackageIdsJson);
      } catch {}
    }
    if (conv?.bookingPackageId) {
      memory.booking_package_id = conv.bookingPackageId;
      memory.current_package_id = conv.bookingPackageId;
    }

    // 3. Fetch Company & Live Packages
    const [aiConfig, packages] = await Promise.all([
      db.aiConfig.findUnique({ where: { companyId } }),
      db.packageWhatsAppConfig.findMany({
        where: { companyId, isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    const company: CompanyContextData = {
      companyId,
      brandName: aiConfig?.brandName || 'Hello Mam',
      botName: aiConfig?.botName || 'Sarah',
      role: aiConfig?.role || 'Customer Support & Sales Executive',
      workingHours: aiConfig?.workingHours || 'Monday to Sunday, 9:00 AM - 7:00 PM',
      supportPolicies: aiConfig?.supportPolicies || '100% genuine salon products, sealed single-use kits, verified female beauticians.',
      refundPolicy: aiConfig?.refundPolicy || 'Full refund or free service rework within 24 hours if unsatisfied.',
      packages: packages.map(p => ({
        number: p.selectionKey,
        name: p.packageName,
        price: `₹${p.packagePrice}`,
        services: p.servicesSummary || '',
        freeBonus: p.freeService || 'Free threading or D-Tan',
      })),
    };

    // 4. Retrieve Knowledge Chunks (RAG)
    let knowledgeMatch: KnowledgeMatchResult | undefined;
    try {
      knowledgeMatch = await retrieveRelevantKnowledge({
        companyId,
        query: userMessage,
        maxChunks: 4,
      });
    } catch (err) {
      console.warn('[ContextPacketBuilder] Knowledge retrieval notice:', err);
    }

    return {
      customer,
      conversation: {
        id: conversationId,
        waNumber: conv?.waNumber || phone,
        status: conv?.status || 'OPEN',
        handoffState: conv?.handoffState || 'AI_ACTIVE',
        isAiPaused: Boolean(conv?.isAiPaused),
        messagesTranscript,
        memory,
      },
      company,
      knowledgeMatch,
    };
  }

  /**
   * Simple language detector for English, Hindi, and Hinglish.
   */
  static detectLanguage(text: string): 'en' | 'hi' | 'hinglish' {
    const clean = (text || '').toLowerCase();
    // Check Devanagari script for pure Hindi
    if (/[\u0900-\u097F]/.test(clean)) return 'hi';

    // Hinglish keywords
    const hinglishMarkers = [
      'karo', 'karna', 'hai', 'chahiye', 'batao', 'kaise', 'kaha', 'kitna', 'kitne',
      'aaj', 'kal', 'bhejo', 'hoga', 'hogi', 'paise', 'ghar', 'nahi', 'samajh', 'baat'
    ];
    const isHinglish = hinglishMarkers.some(w => clean.includes(w));
    if (isHinglish) return 'hinglish';

    return 'en';
  }
}
