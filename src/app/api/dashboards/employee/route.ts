import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/dashboards/employee
 * 
 * Personal employee dashboard — shows ONLY the requesting user's own data.
 * Employees NEVER see other employees' private work through this API.
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.userId;
    const companyId = session.companyId || null;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // ─── My Leads ─────────────────────────────────────────────────────────────
    const myLeadWhere = {
      companyId,
      OR: [
        { assignedTo: userId },
        ...(session.employeeId ? [{ assignedEmployeeId: session.employeeId }] : []),
      ],
    };

    const [
      myTotalLeads,
      myNewAssignments,
      myAwaitingAcceptance,
      myInProgress,
      myFollowUpDue,
      myOverdueFollowUp,
      myLeadsAccepted,
      myLeadsConverted,
    ] = await Promise.all([
      db.enquiry.count({ where: { ...myLeadWhere, status: { not: 'ARCHIVED' } } }),
      db.enquiry.count({ where: { ...myLeadWhere, assignedAt: { gte: todayStart }, status: { notIn: ['WON', 'LOST', 'ARCHIVED'] } } }),
      db.enquiry.count({ where: { ...myLeadWhere, assignmentAcceptedAt: null, assignedAt: { not: null }, status: { notIn: ['WON', 'LOST', 'ARCHIVED'] } } }),
      db.enquiry.count({ where: { ...myLeadWhere, status: { in: ['CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION'] } } }),
      db.followUp.count({ where: { enquiry: myLeadWhere, status: 'PENDING', scheduledAt: { lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) } } }),
      db.followUp.count({ where: { enquiry: myLeadWhere, status: 'PENDING', scheduledAt: { lt: now } } }),
      db.enquiry.count({ where: { ...myLeadWhere, assignmentAcceptedAt: { not: null } } }),
      db.enquiry.count({ where: { ...myLeadWhere, status: 'WON' } }),
    ]);

    // My chats
    const [
      myActiveChats,
      myUnacceptedChats,
      myResolvedToday,
    ] = await Promise.all([
      db.whatsappConversation.count({ where: { companyId, assignedUserId: userId, status: 'OPEN' } }),
      db.whatsappConversation.count({ where: { companyId, assignedUserId: userId, assignmentAcceptedAt: null, status: 'OPEN' } }),
      db.whatsappConversation.count({ where: { companyId, assignedUserId: userId, status: 'CLOSED', updatedAt: { gte: todayStart } } }),
    ]);

    // Average acceptance time (completed today)
    const acceptedToday = await db.enquiry.findMany({
      where: {
        ...myLeadWhere,
        assignmentAcceptedAt: { gte: todayStart },
        assignedAt: { not: null },
      },
      select: { assignedAt: true, assignmentAcceptedAt: true },
      take: 50,
    });

    let avgAcceptanceMs = 0;
    if (acceptedToday.length > 0) {
      const totalMs = acceptedToday.reduce((sum, l) => {
        if (!l.assignedAt || !l.assignmentAcceptedAt) return sum;
        return sum + (new Date(l.assignmentAcceptedAt).getTime() - new Date(l.assignedAt).getTime());
      }, 0);
      avgAcceptanceMs = Math.round(totalMs / acceptedToday.length / 1000); // in seconds
    }

    // My tickets
    const [myOpenTickets, myTicketsResolvedToday] = await Promise.all([
      db.supportTicket.count({ where: { companyId, assignedTo: userId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      db.supportTicket.count({ where: { companyId, assignedTo: userId, status: { in: ['RESOLVED', 'CLOSED'] }, updatedAt: { gte: todayStart } } }),
    ]);

    // Average first response time (on WhatsApp)
    const myRespondedChats = await db.whatsappConversation.findMany({
      where: { companyId, assignedUserId: userId, firstResponseAt: { not: null }, assignedAt: { not: null } },
      select: { assignedAt: true, firstResponseAt: true },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });
    let avgResponseSeconds = 0;
    if (myRespondedChats.length > 0) {
      const totalSec = myRespondedChats.reduce((sum, c) => {
        return sum + (new Date(c.firstResponseAt!).getTime() - new Date(c.assignedAt!).getTime()) / 1000;
      }, 0);
      avgResponseSeconds = Math.round(totalSec / myRespondedChats.length);
    }

    // SLA breaches for current unaccepted assignments
    const myUnacceptedChatsList = await db.whatsappConversation.findMany({
      where: { companyId, assignedUserId: userId, assignmentAcceptedAt: null, assignedAt: { not: null }, status: 'OPEN' },
      select: { assignedAt: true },
    });
    const myUnacceptedLeadsList = await db.enquiry.findMany({
      where: { ...myLeadWhere, assignmentAcceptedAt: null, assignedAt: { not: null }, status: { notIn: ['WON', 'LOST', 'ARCHIVED'] } },
      select: { assignedAt: true },
    });

    let slaBreaches = 0;
    const nowTime = Date.now();
    for (const c of myUnacceptedChatsList) {
      if (c.assignedAt && (nowTime - new Date(c.assignedAt).getTime()) > 5 * 60 * 1000) slaBreaches++;
    }
    for (const l of myUnacceptedLeadsList) {
      if (l.assignedAt && (nowTime - new Date(l.assignedAt).getTime()) > 10 * 60 * 1000) slaBreaches++;
    }

    // My live status
    const myStatus = await db.employeeStatus.findUnique({
      where: { userId },
    });

    // Recent activity (today's leads + chats) for display
    const recentLeads = await db.enquiry.findMany({
      where: { ...myLeadWhere, createdAt: { gte: todayStart } },
      select: { id: true, name: true, status: true, assignedAt: true, assignmentAcceptedAt: true, priority: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      dashboardType: 'EMPLOYEE',
      myWork: {
        leads: {
          total: myTotalLeads,
          newAssignments: myNewAssignments,
          awaitingAcceptance: myAwaitingAcceptance,
          inProgress: myInProgress,
          followUpDue: myFollowUpDue,
          overdueFollowUp: myOverdueFollowUp,
        },
        chats: {
          active: myActiveChats,
          unaccepted: myUnacceptedChats,
          resolvedToday: myResolvedToday,
        },
        tickets: {
          open: myOpenTickets,
          resolvedToday: myTicketsResolvedToday,
        },
      },
      myPerformance: {
        leadsAccepted: myLeadsAccepted,
        leadsConverted: myLeadsConverted,
        avgAcceptanceSeconds: avgAcceptanceMs,
        avgResponseSeconds,
        chatsHandled: myResolvedToday,
        ticketsResolved: myTicketsResolvedToday,
        slaBreaches,
      },
      myStatus: myStatus?.status || 'OFFLINE',
      recentLeads,
    });
  } catch (e: any) {
    console.error('Employee dashboard error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
