import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getSlaRules, computeSlaStatus, getAccessibleUserIdsForUser } from '@/lib/access-policy';

/**
 * GET /api/dashboards/company
 * 
 * Company / Team Dashboard:
 * - Owner / Admin: Unrestricted company-wide dashboard
 * - Manager: Scoped to their team & direct reports by default
 *   (Company-wide metrics granted only with VIEW_COMPANY_ANALYTICS permission)
 * - Employees: Prohibited (403 Forbidden)
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const companyId = session.companyId || null;

    const role = (session.companyRole || session.role || '').toUpperCase();
    if (!['OWNER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const companyWhere = { companyId };

    // ─── Scope Resolution (Owner vs. Manager) ──────────────────────────────────
    const isOwnerOrSuper = session.role === 'SUPER_ADMIN' || ['OWNER', 'ADMIN'].includes(role);
    const hasCompanyAnalytics =
      session.permissions?.includes('VIEW_COMPANY_ANALYTICS') ||
      session.permissions?.includes('analytics.company.view') ||
      session.permissions?.includes('admin.analytics.view');

    const isCompanyScope = isOwnerOrSuper || hasCompanyAnalytics;
    const dashboardScope = isCompanyScope ? 'COMPANY' : 'TEAM';

    // When team-scoped, resolve the manager's accessible team member IDs
    const accessibleUserIds = isCompanyScope ? null : await getAccessibleUserIdsForUser(session);

    // ─── SLA Rules ────────────────────────────────────────────────────────────
    const slaRules = await getSlaRules(companyId);
    const chatSlaAcceptance = slaRules['WHATSAPP_CHAT:ACCEPTANCE:NORMAL'] || { warningMinutes: 4, breachMinutes: 5 };
    const leadSlaAcceptance = slaRules['LEAD:ACCEPTANCE:NORMAL'] || { warningMinutes: 8, breachMinutes: 10 };

    // ─── Workforce Overview ───────────────────────────────────────────────────
    const userWhere = accessibleUserIds
      ? { companyId, id: { in: accessibleUserIds }, status: 'ACTIVE' as const }
      : { companyId, status: 'ACTIVE' as const };

    const statusWhere = accessibleUserIds
      ? { companyId, userId: { in: accessibleUserIds } }
      : { companyId };

    const [
      totalEmployees,
      employeeStatuses,
    ] = await Promise.all([
      db.user.count({ where: userWhere }),
      db.employeeStatus.findMany({
        where: statusWhere,
        select: { userId: true, status: true, currentLeadId: true, currentChatId: true, lastActivityAt: true },
      }),
    ]);

    const onlineStatuses = ['ONLINE', 'AVAILABLE', 'BUSY', 'HANDLING_LEAD', 'HANDLING_CHAT', 'HANDLING_TICKET', 'ON_BREAK'];
    const onlineCount = employeeStatuses.filter(s => onlineStatuses.includes(s.status)).length;
    const availableCount = employeeStatuses.filter(s => s.status === 'AVAILABLE').length;
    const busyCount = employeeStatuses.filter(s => ['BUSY', 'HANDLING_LEAD', 'HANDLING_CHAT', 'HANDLING_TICKET'].includes(s.status)).length;

    // ─── Lead Metrics ─────────────────────────────────────────────────────────
    const leadScopeCondition = accessibleUserIds
      ? { assignedTo: { in: accessibleUserIds } }
      : {};

    const [
      totalLeads,
      newToday,
      unassignedLeads,
      assignedLeads,
      awaitingAcceptanceLeads,
      acceptedLeads,
      wonLeads,
      lostLeads,
    ] = await Promise.all([
      db.enquiry.count({ where: { ...companyWhere, ...leadScopeCondition, status: { not: 'ARCHIVED' } } }),
      db.enquiry.count({ where: { ...companyWhere, ...leadScopeCondition, createdAt: { gte: todayStart } } }),
      db.enquiry.count({ where: { ...companyWhere, assignedTo: null, assignedEmployeeId: null, status: { not: 'ARCHIVED' } } }),
      db.enquiry.count({ where: { ...companyWhere, ...leadScopeCondition, assignedTo: { not: null }, status: { not: 'ARCHIVED' } } }),
      db.enquiry.count({ where: { ...companyWhere, ...leadScopeCondition, assignedTo: { not: null }, assignmentAcceptedAt: null, status: { notIn: ['WON', 'LOST', 'ARCHIVED'] } } }),
      db.enquiry.count({ where: { ...companyWhere, ...leadScopeCondition, assignmentAcceptedAt: { not: null }, status: { notIn: ['WON', 'LOST', 'ARCHIVED'] } } }),
      db.enquiry.count({ where: { ...companyWhere, ...leadScopeCondition, status: 'WON' } }),
      db.enquiry.count({ where: { ...companyWhere, ...leadScopeCondition, status: 'LOST' } }),
    ]);

    // Follow-up metrics
    const [followUpDue, overdueFollowUp] = await Promise.all([
      db.followUp.count({ where: { enquiry: { ...companyWhere, ...leadScopeCondition }, status: 'PENDING', scheduledAt: { lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) } } }),
      db.followUp.count({ where: { enquiry: { ...companyWhere, ...leadScopeCondition }, status: 'PENDING', scheduledAt: { lt: now } } }),
    ]);

    // SLA breach counts for leads
    const unacceptedLeads = await db.enquiry.findMany({
      where: {
        ...companyWhere,
        ...leadScopeCondition,
        assignedTo: { not: null },
        assignmentAcceptedAt: null,
        assignedAt: { not: null },
        status: { notIn: ['WON', 'LOST', 'ARCHIVED'] },
      },
      select: { id: true, assignedAt: true, priority: true },
    });

    let leadSlaWarning = 0, leadSlaBreached = 0;
    for (const lead of unacceptedLeads) {
      const priorityKey = (lead.priority || 'NORMAL').toUpperCase();
      const threshold = slaRules[`LEAD:ACCEPTANCE:${priorityKey}`] || leadSlaAcceptance;
      const slaStatus = computeSlaStatus(lead.assignedAt, threshold);
      if (slaStatus === 'WARNING') leadSlaWarning++;
      if (slaStatus === 'BREACHED') leadSlaBreached++;
    }

    // ─── WhatsApp Chat Metrics ─────────────────────────────────────────────────
    const chatScopeCondition = accessibleUserIds
      ? { assignedUserId: { in: accessibleUserIds } }
      : {};

    const [
      newChatsToday,
      activeChats,
      unassignedChats,
      assignedNotAccepted,
      acceptedChats,
      waitingForAgent,
      waitingForCustomer,
      unreadChats,
      resolvedToday,
    ] = await Promise.all([
      db.whatsappConversation.count({ where: { ...companyWhere, ...chatScopeCondition, createdAt: { gte: todayStart } } }),
      db.whatsappConversation.count({ where: { ...companyWhere, ...chatScopeCondition, status: 'OPEN' } }),
      db.whatsappConversation.count({ where: { ...companyWhere, assignedUserId: null, status: 'OPEN' } }),
      db.whatsappConversation.count({ where: { ...companyWhere, ...chatScopeCondition, assignedUserId: { not: null }, assignmentAcceptedAt: null, status: 'OPEN' } }),
      db.whatsappConversation.count({ where: { ...companyWhere, ...chatScopeCondition, assignmentAcceptedAt: { not: null }, status: 'OPEN' } }),
      db.whatsappConversation.count({ where: { ...companyWhere, ...chatScopeCondition, lastMessageSender: 'CONTACT', status: 'OPEN' } }),
      db.whatsappConversation.count({ where: { ...companyWhere, ...chatScopeCondition, lastMessageSender: { in: ['AGENT', 'SYSTEM', 'TEMPLATE'] }, status: 'OPEN' } }),
      db.whatsappConversation.count({ where: { ...companyWhere, ...chatScopeCondition, unreadCount: { gt: 0 } } }),
      db.whatsappConversation.count({ where: { ...companyWhere, ...chatScopeCondition, status: 'CLOSED', updatedAt: { gte: todayStart } } }),
    ]);

    // SLA for chats
    const unacceptedChats = await db.whatsappConversation.findMany({
      where: {
        ...companyWhere,
        ...chatScopeCondition,
        assignedUserId: { not: null },
        assignmentAcceptedAt: null,
        assignedAt: { not: null },
        status: 'OPEN',
      },
      select: { id: true, assignedAt: true, priority: true },
    });

    let chatSlaWarning = 0, chatSlaBreached = 0;
    for (const chat of unacceptedChats) {
      const priorityKey = (chat.priority || 'NORMAL').toUpperCase();
      const threshold = slaRules[`WHATSAPP_CHAT:ACCEPTANCE:${priorityKey}`] || chatSlaAcceptance;
      const slaStatus = computeSlaStatus(chat.assignedAt, threshold);
      if (slaStatus === 'WARNING') chatSlaWarning++;
      if (slaStatus === 'BREACHED') chatSlaBreached++;
    }

    // Employees with pending assignments / SLA breaches
    const employeesWithPendingAssignments = await db.whatsappConversation.groupBy({
      by: ['assignedUserId'],
      where: { ...companyWhere, ...chatScopeCondition, assignedUserId: { not: null }, assignmentAcceptedAt: null, status: 'OPEN' },
      _count: true,
    });

    // Calculate real averages for acceptance, first response, and resolution times
    const [acceptedChatsData, respondedChatsData, resolvedChatsData] = await Promise.all([
      db.whatsappConversation.findMany({
        where: { ...companyWhere, ...chatScopeCondition, assignmentAcceptedAt: { not: null }, assignedAt: { not: null } },
        select: { assignedAt: true, assignmentAcceptedAt: true },
        take: 100,
        orderBy: { updatedAt: 'desc' },
      }),
      db.whatsappConversation.findMany({
        where: { ...companyWhere, ...chatScopeCondition, firstResponseAt: { not: null }, assignedAt: { not: null } },
        select: { assignedAt: true, firstResponseAt: true },
        take: 100,
        orderBy: { updatedAt: 'desc' },
      }),
      db.whatsappConversation.findMany({
        where: { ...companyWhere, ...chatScopeCondition, status: 'CLOSED' },
        select: { createdAt: true, updatedAt: true },
        take: 100,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    let avgAcceptanceSeconds = 0;
    if (acceptedChatsData.length > 0) {
      const sum = acceptedChatsData.reduce((acc, c) => acc + (new Date(c.assignmentAcceptedAt!).getTime() - new Date(c.assignedAt!).getTime()), 0);
      avgAcceptanceSeconds = Math.round(sum / acceptedChatsData.length / 1000);
    }

    let avgFirstResponseSeconds = 0;
    if (respondedChatsData.length > 0) {
      const sum = respondedChatsData.reduce((acc, c) => acc + (new Date(c.firstResponseAt!).getTime() - new Date(c.assignedAt!).getTime()), 0);
      avgFirstResponseSeconds = Math.round(sum / respondedChatsData.length / 1000);
    }

    let avgResolutionSeconds = 0;
    if (resolvedChatsData.length > 0) {
      const sum = resolvedChatsData.reduce((acc, c) => acc + (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()), 0);
      avgResolutionSeconds = Math.round(sum / resolvedChatsData.length / 1000);
    }

    return NextResponse.json({
      dashboardType: 'COMPANY',
      dashboardScope, // 'COMPANY' | 'TEAM'
      scopeDescription: isCompanyScope ? 'Company-wide operations' : 'Scoped to your team & direct reports',
      teamName: session.teamName || null,
      workforce: {
        total: totalEmployees,
        online: onlineCount,
        available: availableCount,
        busy: busyCount,
        offline: Math.max(0, totalEmployees - onlineCount),
        withPendingAssignments: employeesWithPendingAssignments.length,
        withSlaBreaches: chatSlaBreached + leadSlaBreached,
      },
      leads: {
        total: totalLeads,
        newToday,
        unassigned: unassignedLeads,
        assigned: assignedLeads,
        awaitingAcceptance: awaitingAcceptanceLeads,
        accepted: acceptedLeads,
        won: wonLeads,
        lost: lostLeads,
        followUpDue,
        overdueFollowUp,
        slaWarning: leadSlaWarning,
        slaBreached: leadSlaBreached,
      },
      whatsapp: {
        newToday: newChatsToday,
        active: activeChats,
        unassigned: unassignedChats,
        assignedNotAccepted,
        accepted: acceptedChats,
        waitingForAgent,
        waitingForCustomer,
        unread: unreadChats,
        resolvedToday,
        slaWarning: chatSlaWarning,
        slaBreached: chatSlaBreached,
        avgAcceptanceSeconds,
        avgFirstResponseSeconds,
        avgResolutionSeconds,
      },
    });
  } catch (e: any) {
    console.error('Company dashboard error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
