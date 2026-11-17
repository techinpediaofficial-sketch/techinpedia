import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'today', 'overdue', 'upcoming', or all
    const status = searchParams.get('status');
    const dealId = searchParams.get('dealId');
    const enquiryId = searchParams.get('enquiryId');
    const customerId = searchParams.get('customerId');

    const assignedEmployeeId = searchParams.get('assignedEmployeeId');

    const canViewAllFollowups =
      session.role === 'SUPER_ADMIN' ||
      session.appRoleName === 'SUPER_ADMIN' ||
      (session.isTenant && !!session.companyId && (session.companyRole === 'OWNER' || session.companyRole === 'ADMIN')) ||
      session.permissions?.includes('meetings.team.view') ||
      session.permissions?.includes('crm.leads.assign') ||
      session.permissions?.includes('hr.assignments.view') ||
      session.permissions?.includes('cockpit.manager.view');

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const userScopeFilter = {
      OR: [
        { assignedToId: session.userId },
        ...(session.employeeId ? [{ assignedEmployeeId: session.employeeId }] : []),
        { enquiry: { assignedTo: session.userId } },
        ...(session.employeeId ? [{ enquiry: { assignedEmployeeId: session.employeeId } }] : []),
      ],
    };

    const where: any = {};
    if (dealId) where.dealId = dealId;
    if (enquiryId) where.enquiryId = enquiryId;
    if (customerId) where.customerId = customerId;
    if (assignedEmployeeId) where.assignedEmployeeId = assignedEmployeeId;

    if (status) {
      where.status = status;
    }

    // Non-managers are strictly scoped to their own tasks.
    // Managers are scoped when filtering by 'my', or if explicitly requested.
    if (!canViewAllFollowups || filter === 'my') {
      where.AND = [
        ...(where.AND || []),
        userScopeFilter,
      ];
    }

    if (filter === 'today') {
      where.scheduledAt = { gte: startOfToday, lte: endOfToday };
      if (!status) where.status = 'PENDING';
    } else if (filter === 'overdue') {
      where.scheduledAt = { lt: startOfToday };
      if (!status) where.status = 'PENDING';
    } else if (filter === 'upcoming') {
      where.scheduledAt = { gt: endOfToday };
      if (!status) where.status = 'PENDING';
    } else if (filter === 'my') {
      if (!status) where.status = 'PENDING';
    }

    const followUps = await db.followUp.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        deal: { select: { id: true, title: true, value: true } },
        enquiry: { select: { id: true, name: true, email: true, phone: true, company: true } },
        customer: { select: { id: true, name: true, email: true } },
        assignedEmployee: { select: { id: true, name: true, employeeCode: true } },
      },
    });

    // Overview metric counts scoped by role/user
    const baseCountWhere: any = !canViewAllFollowups ? { ...userScopeFilter } : {};

    const [todayCount, overdueCount, upcomingCount, myCount, allCount] = await Promise.all([
      db.followUp.count({
        where: { ...baseCountWhere, status: 'PENDING', scheduledAt: { gte: startOfToday, lte: endOfToday } },
      }),
      db.followUp.count({
        where: { ...baseCountWhere, status: 'PENDING', scheduledAt: { lt: startOfToday } },
      }),
      db.followUp.count({
        where: { ...baseCountWhere, status: 'PENDING', scheduledAt: { gt: endOfToday } },
      }),
      db.followUp.count({
        where: { ...userScopeFilter, status: 'PENDING' },
      }),
      db.followUp.count({
        where: { ...baseCountWhere, status: 'PENDING' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      followUps,
      canViewAll: canViewAllFollowups,
      metrics: {
        today: todayCount,
        overdue: overdueCount,
        upcoming: upcomingCount,
        my: myCount,
        all: allCount,
      },
    });
  } catch (error) {
    console.error('Fetch followups error:', error);
    return NextResponse.json({ error: 'Failed to fetch follow-ups.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { title, type, scheduledAt, dealId, customerId, enquiryId, assignedEmployeeId, notes } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Follow-up title is required.' }, { status: 400 });
    }
    if (!scheduledAt) {
      return NextResponse.json({ error: 'Scheduled date/time is required.' }, { status: 400 });
    }

    const followUp = await db.followUp.create({
      data: {
        title: title.trim(),
        type: type || 'CALL',
        status: 'PENDING',
        scheduledAt: new Date(scheduledAt),
        dealId: dealId || null,
        customerId: customerId || null,
        enquiryId: enquiryId || null,
        assignedToId: session.userId,
        assignedEmployeeId: assignedEmployeeId || session.employeeId || null,
        assignedToEmail: session.email,
        notes: notes ? notes.trim() : null,
      },
      include: {
        deal: { select: { id: true, title: true } },
        enquiry: { select: { id: true, name: true } },
        assignedEmployee: { select: { id: true, name: true } },
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'SCHEDULE_FOLLOWUP',
      entityType: 'FollowUp',
      entityId: followUp.id,
      metadata: { title: followUp.title, scheduledAt: followUp.scheduledAt },
    });

    return NextResponse.json({ success: true, followUp });
  } catch (error) {
    console.error('Create follow-up error:', error);
    return NextResponse.json({ error: 'Failed to schedule follow-up.' }, { status: 500 });
  }
}
