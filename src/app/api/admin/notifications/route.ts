import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/admin/notifications
 * 
 * Returns actionable notification center items:
 * - Unaccepted assigned WhatsApp chats (with direct Accept & View)
 * - Unaccepted assigned Leads (with direct Accept & View)
 * - SLA warnings
 * - Reassignment notices
 * - System notifications
 * 
 * Strictly tenant and user scoped.
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.userId;
    const companyId = session.companyId || null;

    const [
      unacceptedChats,
      unacceptedLeads,
      recentReassignments,
      dbNotifications,
    ] = await Promise.all([
      db.whatsappConversation.findMany({
        where: {
          companyId,
          assignedUserId: userId,
          assignmentAcceptedAt: null,
          status: 'OPEN',
        },
        select: {
          id: true,
          waNumber: true,
          customerName: true,
          assignedAt: true,
          priority: true,
        },
        orderBy: { assignedAt: 'desc' },
        take: 10,
      }),
      db.enquiry.findMany({
        where: {
          companyId,
          OR: [
            { assignedTo: userId },
            ...(session.employeeId ? [{ assignedEmployeeId: session.employeeId }] : []),
          ],
          assignmentAcceptedAt: null,
          status: { notIn: ['WON', 'LOST', 'ARCHIVED'] },
        },
        select: {
          id: true,
          name: true,
          assignedAt: true,
          priority: true,
        },
        orderBy: { assignedAt: 'desc' },
        take: 10,
      }),
      db.reassignmentHistory.findMany({
        where: {
          companyId,
          toUserId: userId,
          createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.notification.findMany({
        where: {
          OR: [{ userId }, { userId: null }],
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    const items: any[] = [];

    // Actionable Chat items
    for (const c of unacceptedChats) {
      const elapsedMin = c.assignedAt ? Math.round((Date.now() - new Date(c.assignedAt).getTime()) / 60000) : 0;
      items.push({
        id: `chat-${c.id}`,
        resourceType: 'WHATSAPP_CONVERSATION',
        resourceId: c.id,
        type: 'ACTION_REQUIRED',
        title: 'New WhatsApp Conversation Assigned',
        message: `${c.customerName || c.waNumber} is waiting (${elapsedMin}m ago).`,
        priority: c.priority || 'NORMAL',
        link: '/admin/whatsapp?tab=inbox',
        acceptEndpoint: `/api/whatsapp/conversations/${c.id}/accept`,
        createdAt: c.assignedAt,
        requiresAction: true,
      });
    }

    // Actionable Lead items
    for (const l of unacceptedLeads) {
      const elapsedMin = l.assignedAt ? Math.round((Date.now() - new Date(l.assignedAt).getTime()) / 60000) : 0;
      items.push({
        id: `lead-${l.id}`,
        resourceType: 'LEAD',
        resourceId: l.id,
        type: 'ACTION_REQUIRED',
        title: 'New Lead Assignment',
        message: `${l.name} assigned to you (${elapsedMin}m ago).`,
        priority: l.priority || 'NORMAL',
        link: `/admin/leads?id=${l.id}`,
        acceptEndpoint: `/api/enquiries/${l.id}/accept`,
        createdAt: l.assignedAt,
        requiresAction: true,
      });
    }

    // Reassignment alerts
    for (const r of recentReassignments) {
      items.push({
        id: `reassign-${r.id}`,
        type: 'INFO',
        title: `Item Reassigned to You (${r.resourceType})`,
        message: `Reason: ${r.reason || 'Manager Action'}`,
        link: r.resourceType === 'LEAD' ? `/admin/leads?id=${r.resourceId}` : '/admin/whatsapp?tab=inbox',
        createdAt: r.createdAt,
        requiresAction: false,
      });
    }

    // System notifications
    for (const n of dbNotifications) {
      items.push({
        id: `sys-${n.id}`,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        createdAt: n.createdAt,
        isRead: n.isRead,
        requiresAction: false,
      });
    }

    // Sort by createdAt descending
    items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const actionableCount = unacceptedChats.length + unacceptedLeads.length;
    const unreadSystemCount = dbNotifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      items,
      badgeCount: actionableCount + unreadSystemCount,
      actionableCount,
    });
  } catch (e: any) {
    console.error('Fetch notifications error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
