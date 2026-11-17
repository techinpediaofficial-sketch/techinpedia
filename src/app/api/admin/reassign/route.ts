import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { recordLeadTimelineEvent } from '@/lib/crm';

const REASSIGN_REASONS = [
  'NO_RESPONSE',
  'SLA_BREACHED',
  'EMPLOYEE_OFFLINE',
  'EMPLOYEE_ON_LEAVE',
  'WORKLOAD_TOO_HIGH',
  'MANAGER_DECISION',
  'WRONG_ASSIGNMENT',
  'CUSTOMER_REQUEST',
  'OTHER',
];

// POST: Reassign a lead or WhatsApp conversation
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const {
      resourceType,  // 'LEAD' | 'WHATSAPP_CONVERSATION'
      resourceId,
      reason,
      notes,
    } = body;
    const toUserId = body.toUserId || body.targetUserId;

    if (!resourceType || !resourceId || !toUserId) {
      return NextResponse.json({ error: 'resourceType, resourceId, and toUserId are required' }, { status: 400 });
    }

    // Permission: OWNER/ADMIN/MANAGER can reassign; employees cannot reassign others' items
    const role = (session.companyRole || session.role || '').toUpperCase();
    const canReassign = session.role === 'SUPER_ADMIN' || ['OWNER', 'ADMIN', 'MANAGER'].includes(role);
    if (!canReassign) {
      return NextResponse.json({ error: 'Forbidden: Only managers and above can reassign' }, { status: 403 });
    }

    // Validate target user exists and belongs to same company
    const targetUser = await db.user.findFirst({
      where: {
        id: toUserId,
        companyId: session.companyId || null,
      },
      select: { id: true, name: true, email: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found or not in your company' }, { status: 404 });
    }

    const now = new Date();
    let fromUserId: string | null = null;

    if (resourceType === 'WHATSAPP_CONVERSATION') {
      const conv = await db.whatsappConversation.findFirst({
        where: {
          id: resourceId,
          companyId: session.companyId || null,
        },
      });
      if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

      fromUserId = conv.assignedUserId || null;

      // Reset acceptance state for new assignee
      await db.whatsappConversation.update({
        where: { id: resourceId },
        data: {
          assignedUserId: toUserId,
          assignedAt: now,
          assignmentAcceptedAt: null,
          assignmentAcceptedBy: null,
        },
      });
    } else if (resourceType === 'LEAD') {
      const lead = await db.enquiry.findFirst({
        where: {
          id: resourceId,
          companyId: session.companyId || null,
        },
      });
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

      fromUserId = lead.assignedTo || null;

      await db.enquiry.update({
        where: { id: resourceId },
        data: {
          assignedTo: toUserId,
          assignedAt: now,
          assignmentAcceptedAt: null,
          assignmentAcceptedBy: null,
        },
      });

      // Record timeline event
      await recordLeadTimelineEvent({
        enquiryId: resourceId,
        type: 'REASSIGNED',
        title: `Lead reassigned to ${targetUser.name}`,
        description: `Reassigned by ${session.name || session.email}. Reason: ${reason || 'Not specified'}${notes ? '. Notes: ' + notes : ''}`,
        actorEmail: session.email,
      }).catch(() => {});
    } else {
      return NextResponse.json({ error: 'Invalid resourceType' }, { status: 400 });
    }

    // Record reassignment history (never overwrite)
    await db.reassignmentHistory.create({
      data: {
        companyId: session.companyId || null,
        resourceType,
        resourceId,
        fromUserId,
        toUserId,
        reassignedBy: session.userId,
        reason: reason || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      reassignedTo: targetUser,
      fromUserId,
    });
  } catch (e: any) {
    console.error('Reassignment error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET: Fetch reassignment history for a resource
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('resourceType');
    const resourceId = searchParams.get('resourceId');

    if (!resourceType || !resourceId) {
      return NextResponse.json({ error: 'resourceType and resourceId are required' }, { status: 400 });
    }

    const history = await db.reassignmentHistory.findMany({
      where: {
        resourceType,
        resourceId,
        companyId: session.companyId || null,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Enrich with user names
    const userIds = [...new Set([
      ...history.map(h => h.fromUserId).filter(Boolean) as string[],
      ...history.map(h => h.toUserId),
      ...history.map(h => h.reassignedBy),
    ])];

    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map(u => [u.id, u.name]));

    const enriched = history.map(h => ({
      ...h,
      fromUserName: h.fromUserId ? userMap.get(h.fromUserId) || h.fromUserId : 'Unassigned',
      toUserName: userMap.get(h.toUserId) || h.toUserId,
      reassignedByName: userMap.get(h.reassignedBy) || h.reassignedBy,
    }));

    return NextResponse.json({ history: enriched });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
