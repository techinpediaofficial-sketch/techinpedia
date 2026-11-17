// @ts-nocheck
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

    // Resolve target employee
    let employeeId = session.employeeId;
    if (!employeeId) {
      const emp = await db.employee.findFirst({
        where: {
          OR: [
            { user: { id: session.userId } },
            { companyEmail: session.email },
          ],
        },
      });
      employeeId = emp?.id || null;
    }

    // Fallback to first active employee for super admin previewing the portal
    if (!employeeId) {
      const firstEmp = await db.employee.findFirst({
        where: { status: 'ACTIVE' },
      });
      employeeId = firstEmp?.id || null;
    }

    if (!employeeId) {
      return NextResponse.json({
        success: true,
        isEmployee: false,
        message: 'No employee profile linked to this user.',
      });
    }

    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
      },
    });

    const { year, month, startOfDay } = getISTDateComponents();
    const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);

    // Month date range
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(year, month - 1, totalDaysInMonth, 23, 59, 59, 999));

    // Parallel fetch
    const [
      todayRecord,
      monthlyAttendance,
      leaveBalances,
      recentLeaves,
      recentRegularizations,
      recentPayrolls,
      assignedTasks,
      assignedLeads,
    ] = await Promise.all([
      db.attendanceRecord.findFirst({
        where: {
          employeeId,
          date: { gte: startOfDay, lte: endOfDay },
        },
      }),
      db.attendanceRecord.findMany({
        where: {
          employeeId,
          date: { gte: monthStart, lte: monthEnd },
        },
      }),
      db.leaveBalance.findMany({
        where: { employeeId, year },
      }),
      db.leaveRequest.findMany({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      db.regularizationRequest.findMany({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      db.payrollRecord.findMany({
        where: { employeeId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 3,
        include: {
          employee: {
            select: {
              name: true,
              employeeCode: true,
              bankName: true,
              accountNumber: true,
              panNumber: true,
              department: { select: { name: true } },
            },
          },
        },
      }),
      db.staffTask.findMany({
        where: {
          assignees: { some: { employeeId: employeeId } },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
        include: { assignees: { include: { user: true } } }
      }),
      db.enquiry.findMany({
        where: {
          assignedEmployeeId: employeeId,
          status: { in: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    let punchState = 'NOT_CHECKED_IN';
    if (todayRecord?.checkIn && !todayRecord?.checkOut) {
      punchState = 'CHECKED_IN';
    } else if (todayRecord?.checkIn && todayRecord?.checkOut) {
      punchState = 'CHECKED_OUT';
    }

    const presentDays = monthlyAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const lateDays = monthlyAttendance.filter((a) => a.isLate || a.status === 'LATE').length;
    const halfDays = monthlyAttendance.filter((a) => a.status === 'HALF_DAY').length;
    const leaveDays = monthlyAttendance.filter((a) => a.status === 'ON_LEAVE').length;

    return NextResponse.json({
      success: true,
      isEmployee: true,
      employee,
      punchState,
      todayRecord,
      monthlyAttendance: {
        totalRecorded: monthlyAttendance.length,
        presentDays,
        lateDays,
        halfDays,
        leaveDays,
        records: monthlyAttendance,
      },
      leaveBalances,
      recentLeaves,
      recentRegularizations,
      recentPayrolls,
      assignedTasks,
      assignedLeads,
    });
  } catch (error: any) {
    console.error('ESS Dashboard API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch ESS data' }, { status: 500 });
  }
}
