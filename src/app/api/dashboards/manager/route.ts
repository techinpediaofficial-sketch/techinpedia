import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

function getISTDateComponents(date: Date = new Date()) {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  const year = istDate.getFullYear();
  const month = istDate.getMonth();
  const day = istDate.getDate();

  const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  return { year, month: month + 1, day, startOfDay };
}

export async function GET() {
  try {
    const session = await requireAuth();

    // Resolve target team or department
    let teamId = session.teamId;
    let departmentId = session.departmentId;

    if (!teamId) {
      const firstTeam = await db.team.findFirst({
        include: { department: true },
      });
      teamId = firstTeam?.id || null;
      departmentId = firstTeam?.departmentId || null;
    }

    if (!teamId) {
      return NextResponse.json({
        success: true,
        hasTeam: false,
        message: 'No active team found in organization.',
      });
    }

    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        department: { select: { id: true, name: true } },
        leader: { select: { id: true, name: true, employeeCode: true, companyEmail: true } },
      },
    });

    const teamMembers = await db.employee.findMany({
      where: { teamId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        companyEmail: true,
        phone: true,
        designation: { select: { title: true } },
      },
    });

    const memberIds = teamMembers.map((m) => m.id);
    const { startOfDay } = getISTDateComponents();
    const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);

    // Parallel fetch for team
    const [
      todayAttendance,
      pendingLeaves,
      pendingRegularizations,
      teamDeals,
      teamFollowUps,
    ] = await Promise.all([
      db.attendanceRecord.findMany({
        where: {
          employeeId: { in: memberIds },
          date: { gte: startOfDay, lte: endOfDay },
        },
      }),
      db.leaveRequest.findMany({
        where: {
          employeeId: { in: memberIds },
          status: 'PENDING',
        },
        include: {
          employee: {
            select: { id: true, name: true, employeeCode: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.regularizationRequest.findMany({
        where: {
          employeeId: { in: memberIds },
          status: 'PENDING',
        },
        include: {
          employee: {
            select: { id: true, name: true, employeeCode: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.deal.findMany({
        where: {
          assignedEmployeeId: { in: memberIds },
          wonDate: null,
          lostDate: null,
          stage: { isWon: false, isLost: false },
        },
        include: {
          assignedEmployee: { select: { name: true } },
          stage: { select: { name: true } },
        },
      }),
      db.followUp.findMany({
        where: {
          assignedEmployeeId: { in: memberIds },
          status: 'PENDING',
        },
        include: {
          assignedEmployee: { select: { name: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
      }),
    ]);

    // Build roster with live punch status
    const attendanceMap = new Map(todayAttendance.map((a) => [a.employeeId, a]));

    const roster = teamMembers.map((m) => {
      const att = attendanceMap.get(m.id);
      let punchStatus = 'NOT_CHECKED_IN';
      if (att?.checkIn && !att?.checkOut) punchStatus = 'CHECKED_IN';
      else if (att?.checkIn && att?.checkOut) punchStatus = 'CHECKED_OUT';
      else if (att?.status === 'ON_LEAVE') punchStatus = 'ON_LEAVE';

      return {
        ...m,
        attendance: att || null,
        punchStatus,
      };
    });

    const presentCount = roster.filter((r) => r.punchStatus === 'CHECKED_IN' || r.punchStatus === 'CHECKED_OUT').length;
    const lateCount = roster.filter((r) => r.attendance?.isLate).length;
    const leaveCount = roster.filter((r) => r.punchStatus === 'ON_LEAVE').length;
    const notCheckedInCount = roster.filter((r) => r.punchStatus === 'NOT_CHECKED_IN').length;

    const pipelineValue = teamDeals.reduce((acc, d) => acc + (d.value || 0), 0);

    return NextResponse.json({
      success: true,
      hasTeam: true,
      team,
      metrics: {
        totalMembers: teamMembers.length,
        presentCount,
        lateCount,
        leaveCount,
        notCheckedInCount,
        pendingApprovalsCount: pendingLeaves.length + pendingRegularizations.length,
        activeDealsCount: teamDeals.length,
        pipelineValue,
      },
      roster,
      pendingApprovals: {
        leaves: pendingLeaves,
        regularizations: pendingRegularizations,
      },
      teamDeals,
      teamFollowUps,
    });
  } catch (error: any) {
    console.error('Manager Dashboard API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch manager dashboard data' }, { status: 500 });
  }
}
