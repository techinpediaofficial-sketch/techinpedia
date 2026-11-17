import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { normalizePhone } from '@/lib/phone';
import { sendWhatsAppTextMessage, sendWhatsAppTemplateMessage } from '@/lib/whatsapp_service';
import { recordLeadTimelineEvent } from '@/lib/crm';
import { getAccessibleUserIdsForUser, isOwnerOrAdmin, isManager, canUserAccessConversation } from '@/lib/access-policy';

// 1. GET: List Conversations with Enterprise Folder Taxonomy & Counts
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (!hasPermission(session, 'whatsapp.inbox.view') && !hasPermission(session, 'comm.whatsapp.view'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'ALL'; // ALL, MY_CHATS, UNASSIGNED, UNREAD, WAITING_CUSTOMER, FOLLOWUP_REQUIRED, HIGH_PRIORITY, CLOSED, ARCHIVED, AWAITING_ACCEPTANCE, NEW_ASSIGNED
    const search = searchParams.get('search');

    // Tenant isolation:
    // If tenant user, strictly bound to their companyId
    // If platform super admin, can specify ?companyId=XYZ or default to master (null)
    const rawCompanyId = searchParams.get('companyId');
    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (rawCompanyId && rawCompanyId !== 'master' && rawCompanyId !== 'ALL' ? rawCompanyId : null);

    const where: any = {};
    if (targetCompanyId !== 'ALL') {
      where.companyId = targetCompanyId || null;
    }

    // ─── Scope Resolution (Owner/Admin vs Manager vs Employee) ────────────────
    const accessibleUserIds = await getAccessibleUserIdsForUser(session);
    const isOwnerAdmin = isOwnerOrAdmin(session);
    const isMgr = isManager(session);

    // Helper to scope an assignedUserId constraint based on role
    const getScopedUserCondition = () => {
      if (isOwnerAdmin || accessibleUserIds === null) {
        return undefined; // No user restriction for owners/admins
      }
      if (isMgr) {
        return { in: accessibleUserIds };
      }
      return session.userId;
    };

    if (folder === 'MY_CHATS') {
      where.assignedUserId = session.userId;
      where.status = { not: 'ARCHIVED' };
    } else if (folder === 'UNASSIGNED') {
      where.assignedUserId = null;
      where.status = { not: 'ARCHIVED' };
    } else if (folder === 'UNREAD') {
      const userCond = getScopedUserCondition();
      if (userCond) where.assignedUserId = userCond;
      where.unreadCount = { gt: 0 };
      where.status = { not: 'ARCHIVED' };
    } else if (folder === 'WAITING_CUSTOMER') {
      const userCond = getScopedUserCondition();
      if (userCond) where.assignedUserId = userCond;
      where.lastMessageSender = { in: ['AGENT', 'SYSTEM', 'TEMPLATE'] };
      where.status = 'OPEN';
    } else if (folder === 'HIGH_PRIORITY') {
      const userCond = getScopedUserCondition();
      if (userCond) where.assignedUserId = userCond;
      where.priority = { in: ['HIGH', 'URGENT'] };
      where.status = { not: 'ARCHIVED' };
    } else if (folder === 'CLOSED') {
      const userCond = getScopedUserCondition();
      if (userCond) where.assignedUserId = userCond;
      where.status = 'CLOSED';
    } else if (folder === 'ARCHIVED') {
      const userCond = getScopedUserCondition();
      if (userCond) where.assignedUserId = userCond;
      where.status = 'ARCHIVED';
    } else if (folder === 'AWAITING_ACCEPTANCE') {
      // Always self-scoped: "my unaccepted assignments"
      where.assignedUserId = session.userId;
      where.assignmentAcceptedAt = null;
      where.status = { not: 'ARCHIVED' };
    } else if (folder === 'NEW_ASSIGNED') {
      // SECURITY ENFORCEMENT:
      // Employee: strictly assigned to current employee AND not accepted
      // Manager: strictly assigned to team members AND not accepted
      // Owner/Admin: all unaccepted company assignments
      if (isOwnerAdmin || accessibleUserIds === null) {
        where.assignedUserId = { not: null };
      } else if (isMgr) {
        where.assignedUserId = { in: accessibleUserIds };
      } else {
        where.assignedUserId = session.userId;
      }
      where.assignmentAcceptedAt = null;
      where.status = { not: 'ARCHIVED' };
    } else if (folder === 'FOLLOWUP_REQUIRED') {
      const pendingFollowUps = await db.followUp.findMany({
        where: { status: 'PENDING' },
        select: { enquiryId: true },
      });
      const leadIdsWithFollowUps = pendingFollowUps.map(f => f.enquiryId).filter(Boolean) as string[];
      const userCond = getScopedUserCondition();
      if (userCond) where.assignedUserId = userCond;
      where.leadId = { in: leadIdsWithFollowUps };
      where.status = { not: 'ARCHIVED' };
    } else {
      // Default ALL:
      // Owners/Admins see all company chats
      // Managers see team members' chats + unassigned chats
      // Employees see ONLY their own assigned chats
      where.status = { not: 'ARCHIVED' };
      if (!isOwnerAdmin && accessibleUserIds !== null) {
        if (isMgr) {
          where.OR = [
            { assignedUserId: { in: accessibleUserIds } },
            { assignedUserId: null },
          ];
        } else {
          where.assignedUserId = session.userId;
        }
      }
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { customerName: { contains: search } },
            { waNumber: { contains: search } },
            { lastMessageText: { contains: search } },
          ],
        },
      ];
    }

    const conversations = await db.whatsappConversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });

    // Populate assigned user names & CRM Lead previews
    const userIds = Array.from(new Set(conversations.map((c) => c.assignedUserId).filter(Boolean))) as string[];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, companyRole: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enriched = conversations.map((conv) => ({
      ...conv,
      assignedUser: conv.assignedUserId ? userMap.get(conv.assignedUserId) || null : null,
      is24hWindowActive: conv.lastCustomerActivityAt
        ? Date.now() - new Date(conv.lastCustomerActivityAt).getTime() <= 24 * 60 * 60 * 1000
        : false,
    }));

    // Calculate Folder Badges / Metrics scoped strictly to user permissions
    const baseWhere = targetCompanyId !== 'ALL' ? { companyId: targetCompanyId || null } : {};
    const scopedUserCond = getScopedUserCondition();
    const userFilter = scopedUserCond ? { assignedUserId: scopedUserCond } : {};

    const [
      allCount,
      myCount,
      unassignedCount,
      unreadCount,
      waitingCount,
      highPriorityCount,
      closedCount,
      awaitingAcceptanceCount,
      newAssignedCount,
    ] = await Promise.all([
      // ALL count: scoped appropriately
      isOwnerAdmin || accessibleUserIds === null
        ? db.whatsappConversation.count({ where: { ...baseWhere, status: { not: 'ARCHIVED' } } })
        : isMgr
          ? db.whatsappConversation.count({
              where: {
                ...baseWhere,
                status: { not: 'ARCHIVED' },
                OR: [{ assignedUserId: { in: accessibleUserIds } }, { assignedUserId: null }],
              },
            })
          : db.whatsappConversation.count({ where: { ...baseWhere, assignedUserId: session.userId, status: { not: 'ARCHIVED' } } }),
      db.whatsappConversation.count({ where: { ...baseWhere, assignedUserId: session.userId, status: { not: 'ARCHIVED' } } }),
      db.whatsappConversation.count({ where: { ...baseWhere, assignedUserId: null, status: { not: 'ARCHIVED' } } }),
      db.whatsappConversation.count({ where: { ...baseWhere, ...userFilter, unreadCount: { gt: 0 }, status: { not: 'ARCHIVED' } } }),
      db.whatsappConversation.count({ where: { ...baseWhere, ...userFilter, lastMessageSender: { in: ['AGENT', 'SYSTEM', 'TEMPLATE'] }, status: 'OPEN' } }),
      db.whatsappConversation.count({ where: { ...baseWhere, ...userFilter, priority: { in: ['HIGH', 'URGENT'] }, status: { not: 'ARCHIVED' } } }),
      db.whatsappConversation.count({ where: { ...baseWhere, ...userFilter, status: 'CLOSED' } }),
      db.whatsappConversation.count({ where: { ...baseWhere, assignedUserId: session.userId, assignmentAcceptedAt: null, status: { not: 'ARCHIVED' } } }),
      db.whatsappConversation.count({
        where: {
          ...baseWhere,
          ...(isOwnerAdmin || accessibleUserIds === null
            ? { assignedUserId: { not: null } }
            : isMgr
              ? { assignedUserId: { in: accessibleUserIds } }
              : { assignedUserId: session.userId }),
          assignmentAcceptedAt: null,
          status: { not: 'ARCHIVED' },
        },
      }),
    ]);

    const folderMetrics = {
      ALL: allCount,
      MY_CHATS: myCount,
      UNASSIGNED: unassignedCount,
      UNREAD: unreadCount,
      WAITING_CUSTOMER: waitingCount,
      HIGH_PRIORITY: highPriorityCount,
      CLOSED: closedCount,
      AWAITING_ACCEPTANCE: awaitingAcceptanceCount,
      NEW_ASSIGNED: newAssignedCount,
    };

    return NextResponse.json({ conversations: enriched, folderMetrics });
  } catch (error: any) {
    console.error('Conversations GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch conversations' }, { status: 500 });
  }
}

// 2. PATCH: Update Conversation & Associated CRM Lead Fields
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || (!hasPermission(session, 'whatsapp.inbox.assign') && !hasPermission(session, 'comm.whatsapp.send'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      assignedUserId,
      status,
      priority,
      internalNotes,
      labels,
      leadStage,
      temperature,
      estimatedValue,
      leadScore,
      leadNotes,
      leadSource
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    const existingConv = await db.whatsappConversation.findUnique({ where: { id } });
    if (!existingConv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Enforce Access Policy
    const access = await canUserAccessConversation(session, existingConv);
    if (!access.allowed) {
      return NextResponse.json({ error: 'Forbidden: ' + access.reason }, { status: 403 });
    }

    const updateData: any = {};
    if (assignedUserId !== undefined) {
      if (assignedUserId !== existingConv.assignedUserId) {
        updateData.assignedUserId = assignedUserId || null;
        updateData.assignedAt = new Date();
        updateData.assignmentAcceptedAt = null;
        updateData.assignmentAcceptedBy = null;
      }
    }
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    if (labels !== undefined) updateData.labels = Array.isArray(labels) ? JSON.stringify(labels) : labels;

    const updated = await db.whatsappConversation.update({
      where: { id },
      data: updateData,
    });

    // Update CRM Lead if linked
    if (existingConv.leadId) {
      const leadUpdate: any = {};
      if (leadStage) leadUpdate.status = leadStage;
      if (temperature) leadUpdate.temperature = temperature;
      if (estimatedValue !== undefined) leadUpdate.estimatedValue = parseFloat(estimatedValue) || 0;
      if (leadScore !== undefined) leadUpdate.score = parseInt(leadScore) || 0;
      if (leadSource) leadUpdate.source = leadSource;
      if (assignedUserId !== undefined) leadUpdate.assignedTo = assignedUserId || null;

      if (Object.keys(leadUpdate).length > 0) {
        await db.enquiry.update({
          where: { id: existingConv.leadId },
          data: leadUpdate,
        });

        if (leadStage) {
          await recordLeadTimelineEvent({
            enquiryId: existingConv.leadId,
            type: 'STATUS_CHANGE',
            title: `Lead moved to ${leadStage}`,
            description: `Stage updated directly from WhatsApp Shared Inbox by ${session.email}`,
            actorEmail: session.email,
          });
        }
      }

      if (leadNotes && leadNotes.trim()) {
        await db.enquiryNote.create({
          data: {
            enquiryId: existingConv.leadId,
            userId: session.userId,
            note: leadNotes.trim(),
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, conversation: updated });
  } catch (error: any) {
    console.error('Conversation update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update conversation' }, { status: 500 });
  }
}

// 3. POST: Create New Conversation / Start New WhatsApp Chat
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (!hasPermission(session, 'whatsapp.send') && !hasPermission(session, 'comm.whatsapp.send'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { phone, customerName, message, templateName, templateParams = [], companyId } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const norm = normalizePhone(phone);
    if (!norm.isValid) {
      return NextResponse.json({ error: 'Invalid phone number. Please include valid country code e.g. +91 98187 68680' }, { status: 400 });
    }

    const url = new URL(request.url);
    const queryCompanyId = url.searchParams.get('companyId');
    const rawCompanyId = companyId || queryCompanyId;
    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (rawCompanyId && rawCompanyId !== 'master' && rawCompanyId !== 'ALL' ? rawCompanyId : null);

    // Try finding existing conversation scoped to this company
    let conv = await db.whatsappConversation.findFirst({
      where: {
        companyId: targetCompanyId || null,
        OR: [
          { waNumber: norm.canonical },
          { waNumber: norm.digitsOnly },
          { waNumber: { contains: norm.nationalNumber } },
        ],
      },
    });

    // Also link to CRM Lead or Customer if found
    let leadId: string | null = null;
    let customerId: string | null = null;
    if (!conv) {
      const existingLead = await db.enquiry.findFirst({
        where: {
          OR: [
            { phone: { contains: norm.nationalNumber } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      if (existingLead) leadId = existingLead.id;

      const existingCustomer = await db.customer.findFirst({
        where: {
          OR: [
            { phone: { contains: norm.nationalNumber } },
          ],
        },
      });
      if (existingCustomer) customerId = existingCustomer.id;

      conv = await db.whatsappConversation.create({
        data: {
          companyId: targetCompanyId || null,
          waNumber: norm.canonical,
          customerName: customerName || existingLead?.name || existingCustomer?.name || norm.canonical,
          leadId,
          customerId,
          assignedUserId: session.userId,
          status: 'OPEN',
          lastMessageSender: 'AGENT',
          lastMessageText: message ? message.trim() : 'Conversation initiated',
          lastMessageAt: new Date(),
        },
      });
    } else {
      // Re-open if closed
      if (conv.status !== 'OPEN') {
        conv = await db.whatsappConversation.update({
          where: { id: conv.id },
          data: { status: 'OPEN', updatedAt: new Date() },
        });
      }
    }

    // If message is provided, dispatch it immediately!
    let dispatchResult: any = null;
    if (message && message.trim()) {
      dispatchResult = await sendWhatsAppTextMessage(conv.waNumber, message.trim(), {
        conversationId: conv.id,
        senderUserId: session.userId,
        companyId: targetCompanyId || null,
      });
    } else if (templateName) {
      dispatchResult = await sendWhatsAppTemplateMessage(
        conv.waNumber,
        templateName,
        'en_US',
        templateParams,
        undefined,
        { conversationId: conv.id, companyId: targetCompanyId || null }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: conv,
      dispatch: dispatchResult,
      hint: dispatchResult?.error?.includes('131030')
        ? 'Meta Cloud API is in Development Mode. Recipient phone number must be added to allowed recipients in Meta console.'
        : undefined,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Conversation POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to start conversation' }, { status: 500 });
  }
}
