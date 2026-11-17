import { db } from '@/lib/db';
import { logActivity } from '@/lib/activity';

export interface HumanHandoffParams {
  companyId: string;
  conversationId: string;
  reason: string;
  targetUserId?: string;
  department?: 'SALES' | 'SUPPORT' | 'BILLING' | 'TECHNICAL';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  aiActionsSummary?: string;
  interestedPackage?: string;
  customerAsked?: string;
  intent?: string;
}

export interface HandoffSummary {
  customerName: string;
  customerPhone: string;
  intent: string;
  interestedPackage: string;
  customerAsked: string;
  aiActions: string;
  reason: string;
  lastCustomerMessage: string;
  timestamp: string;
  department: string;
}

export class HandoffEngine {
  /**
   * Generates a structured employee handoff summary so staff never have to read the whole chat.
   */
  static async generateHandoffSummary(
    conversation: any,
    params: HumanHandoffParams
  ): Promise<HandoffSummary> {
    const recentMessages = await db.whatsappMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    const lastInbound = recentMessages.find(m => m.direction === 'INBOUND')?.textBody || conversation.lastMessageText || 'None';

    let pkgName = params.interestedPackage || 'None';
    if (!params.interestedPackage && conversation.packageContextJson) {
      try {
        const pkgCtx = JSON.parse(conversation.packageContextJson);
        pkgName = pkgCtx.selectedPackageName || pkgCtx.packageName || pkgName;
      } catch {}
    }

    return {
      customerName: conversation.customerName || 'Customer',
      customerPhone: conversation.waNumber,
      intent: params.intent || 'Customer Inquiry',
      interestedPackage: pkgName,
      customerAsked: params.customerAsked || lastInbound,
      aiActions: params.aiActionsSummary || 'Checked catalog, resolved initial turn, requested staff review.',
      reason: params.reason,
      lastCustomerMessage: lastInbound,
      timestamp: new Date().toISOString(),
      department: params.department || 'SUPPORT',
    };
  }

  /**
   * Resolves the best active employee based on company department and least-loaded queue.
   */
  static async resolveDepartmentEmployee(
    companyId: string,
    department: string = 'SUPPORT'
  ): Promise<string | null> {
    // 1. Fetch active company staff/editors
    const users = await db.user.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    if (!users || users.length === 0) return null;

    // Prioritize staff/editors over Owner Admin if multiple users exist
    const staffPool = users.filter(u => u.role !== 'SUPER_ADMIN' && u.name?.toLowerCase() !== 'admin');
    const candidatePool = staffPool.length > 0 ? staffPool : users;

    // Workload calculation: count active OPEN chats
    const workloads = await Promise.all(
      candidatePool.map(async u => {
        const count = await db.whatsappConversation.count({
          where: {
            companyId,
            assignedUserId: u.id,
            status: 'OPEN',
          },
        });
        return { id: u.id, name: u.name, count };
      })
    );

    workloads.sort((a, b) => a.count - b.count);
    return workloads[0]?.id || candidatePool[0].id;
  }
}

/**
 * Executes full Human Handoff with state transitions, internal AI summary,
 * in-app notification, and CRM lead timeline recording.
 */
export async function executeHumanHandoff(params: HumanHandoffParams) {
  const { companyId, conversationId, reason, targetUserId, department = 'SUPPORT', priority = 'NORMAL' } = params;

  const conv = await db.whatsappConversation.findFirst({
    where: {
      id: conversationId,
      companyId: companyId || null,
    },
  });

  if (!conv) {
    throw new Error('Conversation not found or tenant mismatch');
  }

  // 1. Resolve assigned employee
  let assignedUserId = targetUserId || conv.assignedUserId;
  if (!assignedUserId) {
    assignedUserId = await HandoffEngine.resolveDepartmentEmployee(companyId, department);
  }

  const now = new Date();

  // 2. Build structured Handoff Summary for employee
  const summary = await HandoffEngine.generateHandoffSummary(conv, params);

  const formattedSummaryText = `📋 **AI HANDOFF BRIEF**
• **Customer:** ${summary.customerName} (${summary.customerPhone})
• **Intent:** ${summary.intent}
• **Package:** ${summary.interestedPackage}
• **Customer Asked:** "${summary.customerAsked}"
• **AI Actions Taken:** ${summary.aiActions}
• **Reason for Handoff:** ${summary.reason}
• **Last Message:** "${summary.lastCustomerMessage}"
• **Department:** ${department} (Priority: ${priority})`;

  // Merge into aiStateJson
  let existingAiState: any = {};
  if (conv.aiStateJson) {
    try {
      existingAiState = JSON.parse(conv.aiStateJson);
    } catch {}
  }
  existingAiState.handoffSummary = summary;
  existingAiState.lastHandoffAt = now.toISOString();

  // 3. Update Conversation: Pause AI, set state to HUMAN_ACTIVE, assign user
  const updatedConv = await db.whatsappConversation.update({
    where: { id: conversationId },
    data: {
      isAiPaused: true,
      aiPausedAt: now,
      aiPausedBy: 'AI_SYSTEM',
      handoffState: 'HUMAN_ACTIVE',
      lastAiHandoffReason: reason,
      lastAiHandoffAt: now,
      assignedUserId: assignedUserId || conv.assignedUserId,
      assignedTeam: department === 'SALES' ? 'Sales' : department === 'BILLING' ? 'Billing' : 'Support',
      assignedAt: now,
      assignmentAcceptedAt: null, // Triggers Acceptance SLA timer
      priority: priority === 'URGENT' ? 'URGENT' : priority === 'HIGH' ? 'HIGH' : conv.priority,
      internalNotes: conv.internalNotes
        ? `${conv.internalNotes}\n\n[${now.toLocaleDateString()}] ${formattedSummaryText}`
        : formattedSummaryText,
      aiStateJson: JSON.stringify(existingAiState),
    },
  });

  // 4. Update Chatbot session if active
  if (conv.activeChatbotSessionId) {
    await db.chatbotSession.updateMany({
      where: { id: conv.activeChatbotSessionId },
      data: {
        status: 'HANDED_OFF',
        handoffReason: reason,
        assignedUserId: assignedUserId || null,
        completedAt: now,
      },
    }).catch(() => {});
  }

  // 5. In-App Notification for assigned employee
  if (assignedUserId) {
    await db.notification.create({
      data: {
        userId: assignedUserId,
        title: `⚡ Live Chat Handoff (${department})`,
        message: `${summary.customerName} requires human assistance: "${summary.reason}"`,
        link: `/admin/whatsapp?tab=inbox&conversationId=${conversationId}`,
      },
    }).catch(() => {});
  }

  // 6. Timeline and audit log
  await logActivity({
    userId: assignedUserId || null,
    action: 'AI_HUMAN_HANDOFF',
    entityType: 'WhatsappConversation',
    entityId: conversationId,
    details: `Handoff to ${department} (${assignedUserId || 'Unassigned'}). Reason: ${reason}`,
    metadata: {
      companyId,
      conversationId,
      reason,
      department,
      priority,
      assignedUserId,
      waNumber: conv.waNumber,
    },
  }).catch(() => {});

  return updatedConv;
}

/**
 * Resumes AI assistance ("Return to AI").
 * Analyzes conversation transcript to summarize employee actions,
 * updates structured conversation state, and sets handoffState to AI_ACTIVE.
 */
export async function resumeAiForConversation(params: {
  companyId: string;
  conversationId: string;
  resumedByUserId: string;
}) {
  const { companyId, conversationId, resumedByUserId } = params;

  const conv = await db.whatsappConversation.findUnique({
    where: { id: conversationId },
  });

  if (!conv) throw new Error('Conversation not found');

  // Read latest messages since handoff
  const messagesSinceHandoff = await db.whatsappMessage.findMany({
    where: {
      conversationId,
      createdAt: conv.lastAiHandoffAt ? { gte: conv.lastAiHandoffAt } : undefined,
    },
    orderBy: { createdAt: 'asc' },
    take: 10,
  });

  const staffOutbound = messagesSinceHandoff.filter(m => m.direction === 'OUTBOUND');
  const agentResolvedContext = staffOutbound.length > 0
    ? `Staff handled customer inquiry with ${staffOutbound.length} outbound replies. Resuming AI support.`
    : 'Conversation returned to AI assistance.';

  let existingAiState: any = {};
  if (conv.aiStateJson) {
    try {
      existingAiState = JSON.parse(conv.aiStateJson);
    } catch {}
  }
  existingAiState.lastAgentAction = agentResolvedContext;
  existingAiState.resumedAt = new Date().toISOString();
  existingAiState.loopCounter = 0;
  existingAiState.frustrationCount = 0;

  const updatedConv = await db.whatsappConversation.update({
    where: { id: conversationId },
    data: {
      isAiPaused: false,
      aiPausedAt: null,
      aiPausedBy: null,
      handoffState: 'AI_ACTIVE',
      aiStateJson: JSON.stringify(existingAiState),
    },
  });

  await logActivity({
    userId: resumedByUserId,
    action: 'AI_RESUMED',
    entityType: 'WhatsappConversation',
    entityId: conversationId,
    details: 'AI assistant resumed for this conversation.',
  }).catch(() => {});

  return updatedConv;
}

/**
 * Immediate Employee Takeover ("Take Over" button).
 * Pauses AI, assigns conversation to current staff member, sets state to HUMAN_ACTIVE.
 */
export async function employeeTakeover(params: {
  companyId: string;
  conversationId: string;
  employeeUserId: string;
}) {
  const { companyId, conversationId, employeeUserId } = params;

  const updatedConv = await db.whatsappConversation.update({
    where: { id: conversationId },
    data: {
      isAiPaused: true,
      aiPausedAt: new Date(),
      aiPausedBy: employeeUserId,
      handoffState: 'HUMAN_ACTIVE',
      assignedUserId: employeeUserId,
      assignedAt: new Date(),
      lastAiHandoffReason: 'Employee Manual Takeover',
      lastAiHandoffAt: new Date(),
    },
  });

  await logActivity({
    userId: employeeUserId,
    action: 'EMPLOYEE_TAKEOVER',
    entityType: 'WhatsappConversation',
    entityId: conversationId,
    details: `Employee ${employeeUserId} took over the conversation from AI.`,
  }).catch(() => {});

  return updatedConv;
}
