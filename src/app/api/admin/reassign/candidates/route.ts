import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isOwnerOrAdmin, isManager } from '@/lib/access-policy';

/**
 * GET /api/admin/reassign/candidates
 * 
 * Returns list of eligible company employees for assignment/reassignment.
 * Includes:
 * - Employee Name & Email
 * - Department & Team
 * - Current Workload (active leads + active chats)
 * - Active Leads count
 * - Active Chats count
 * - Availability & Live Work Status
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const companyId = session.companyId || null;

    const role = (session.companyRole || session.role || '').toUpperCase();
    const canReassign = session.role === 'SUPER_ADMIN' || ['OWNER', 'ADMIN', 'MANAGER'].includes(role);
    if (!canReassign) {
      return NextResponse.json({ error: 'Forbidden: Only managers and above can view assignment candidates' }, { status: 403 });
    }

    // 1. Fetch active company users
    const users = await db.user.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyRole: true,
        avatar: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            department: { select: { id: true, name: true } },
            team: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const userIds = users.map(u => u.id);

    // 2. Fetch live statuses
    const statuses = await db.employeeStatus.findMany({
      where: { userId: { in: userIds } },
    });
    const statusMap = new Map(statuses.map(s => [s.userId, s]));

    // 3. Count active leads per user
    const leadCounts = await db.enquiry.groupBy({
      by: ['assignedTo'],
      where: {
        companyId,
        assignedTo: { in: userIds },
        status: { notIn: ['WON', 'LOST', 'ARCHIVED'] },
      },
      _count: true,
    });
    const leadCountMap = new Map(leadCounts.map(l => [l.assignedTo, l._count]));

    // 4. Count active chats per user
    const chatCounts = await db.whatsappConversation.groupBy({
      by: ['assignedUserId'],
      where: {
        companyId,
        assignedUserId: { in: userIds },
        status: 'OPEN',
      },
      _count: true,
    });
    const chatCountMap = new Map(chatCounts.map(c => [c.assignedUserId, c._count]));

    // 5. Compose candidate list
    const candidates = users.map(u => {
      const liveStatus = statusMap.get(u.id);
      const status = liveStatus?.status || 'OFFLINE';
      const activeLeads = leadCountMap.get(u.id) || 0;
      const activeChats = chatCountMap.get(u.id) || 0;
      const workload = activeLeads + activeChats;

      // Available if online/available/not on leave
      const isAvailable = ['ONLINE', 'AVAILABLE', 'HANDLING_LEAD', 'HANDLING_CHAT'].includes(status);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.companyRole || 'EMPLOYEE',
        avatar: u.avatar || null,
        employeeCode: u.employee?.employeeCode || null,
        department: u.employee?.department?.name || 'General',
        team: u.employee?.team?.name || 'Main Team',
        designation: u.employee?.designation?.title || u.companyRole || 'Staff',
        status,
        isAvailable,
        activeLeads,
        activeChats,
        workload,
        lastActivityAt: liveStatus?.lastActivityAt || null,
      };
    });

    // Sort by: available first, then lowest workload
    candidates.sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return a.workload - b.workload;
    });

    return NextResponse.json({ candidates });
  } catch (e: any) {
    console.error('Fetch reassign candidates error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
