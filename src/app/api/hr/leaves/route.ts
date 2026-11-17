import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

const DEFAULT_ALLOCATIONS: Record<string, number> = {
  CASUAL: 12,
  SICK: 12,
  PAID: 15,
  UNPAID: 30,
};

async function getOrInitLeaveBalances(employeeId: string, year: number) {
  let balances = await db.leaveBalance.findMany({
    where: { employeeId, year },
  });

  if (balances.length === 0) {
    // Initialize default allocations
    const created: any[] = [];
    for (const [leaveType, totalAllocated] of Object.entries(DEFAULT_ALLOCATIONS)) {
      const b = await db.leaveBalance.create({
        data: {
          employeeId,
          year,
          leaveType,
          totalAllocated,
          used: 0,
          pending: 0,
          carriedForward: 0,
        },
      });
      created.push(b);
    }
    balances = created;
  }

  return balances;
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const leaveRequests = await db.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            companyEmail: true,
            department: { select: { name: true } },
            team: { select: { name: true } },
          },
        },
      },
    });

    // Resolve balances for the requested employee or logged in employee
    let balances: any[] = [];
    let targetEmpId = employeeId || session.employeeId;
    if (!targetEmpId) {
      const firstEmp = await db.employee.findFirst({ where: { status: 'ACTIVE' } });
      targetEmpId = firstEmp?.id;
    }
    if (targetEmpId) {
      balances = await getOrInitLeaveBalances(targetEmpId, year);
    }

    const pendingCount = leaveRequests.filter((r) => r.status === 'PENDING').length;
    const approvedCount = leaveRequests.filter((r) => r.status === 'APPROVED').length;
    const rejectedCount = leaveRequests.filter((r) => r.status === 'REJECTED').length;

    return NextResponse.json({
      success: true,
      leaveRequests,
      balances,
      metrics: {
        pendingCount,
        approvedCount,
        rejectedCount,
        total: leaveRequests.length,
      },
    });
  } catch (error: any) {
    console.error('Fetch leaves error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch leave requests.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const {
      employeeId: bodyEmpId,
      leaveType = 'CASUAL',
      startDate,
      endDate,
      daysCount: inputDays,
      reason,
    } = body;

    let targetEmployeeId = bodyEmpId;
    if (!targetEmployeeId) {
      if (session.employeeId) {
        targetEmployeeId = session.employeeId;
      } else {
        const emp = await db.employee.findFirst({
          where: {
            OR: [
              { user: { id: session.userId } },
              { companyEmail: session.email },
            ],
          },
        });
        targetEmployeeId = emp?.id;
      }
    }

    if (!targetEmployeeId || !startDate || !endDate || !reason?.trim()) {
      return NextResponse.json({
        error: 'Employee, start date, end date, and reason are required.',
      }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return NextResponse.json({ error: 'End date cannot be earlier than start date.' }, { status: 400 });
    }

    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    const daysCount = inputDays ? parseFloat(inputDays) : Math.max(1, diffDays);

    const year = start.getFullYear();

    // Check and update LeaveBalance
    const balances = await getOrInitLeaveBalances(targetEmployeeId, year);
    const currentBalance = balances.find((b) => b.leaveType === leaveType);

    if (leaveType !== 'UNPAID' && currentBalance) {
      const available = currentBalance.totalAllocated + currentBalance.carriedForward - currentBalance.used - currentBalance.pending;
      if (daysCount > available) {
        return NextResponse.json({
          error: `Insufficient ${leaveType} leave balance. Available: ${available} day(s), Requested: ${daysCount} day(s).`,
        }, { status: 400 });
      }

      // Increment pending count in balance
      await db.leaveBalance.update({
        where: { id: currentBalance.id },
        data: { pending: { increment: daysCount } },
      });
    }

    const leaveRequest = await db.leaveRequest.create({
      data: {
        employeeId: targetEmployeeId,
        leaveType,
        startDate: start,
        endDate: end,
        daysCount,
        reason: reason.trim(),
        status: 'PENDING',
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
          },
        },
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'SUBMIT_LEAVE_REQUEST',
      entityType: 'LeaveRequest',
      entityId: leaveRequest.id,
      metadata: {
        employeeId: targetEmployeeId,
        leaveType,
        daysCount,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      leaveRequest,
      message: 'Leave application submitted successfully.',
    });
  } catch (error: any) {
    console.error('Leave submission error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit leave request.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { leaveId, status } = body;

    if (!leaveId || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Valid leave ID and status (APPROVED/REJECTED) required.' }, { status: 400 });
    }

    const existingLeave = await db.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { employee: true },
    });

    if (!existingLeave) {
      return NextResponse.json({ error: 'Leave request not found.' }, { status: 404 });
    }

    if (existingLeave.status === status) {
      return NextResponse.json({ error: `Leave request is already ${status.toLowerCase()}.` }, { status: 400 });
    }

    const year = existingLeave.startDate.getFullYear();
    const balance = await db.leaveBalance.findUnique({
      where: {
        employeeId_year_leaveType: {
          employeeId: existingLeave.employeeId,
          year,
          leaveType: existingLeave.leaveType,
        },
      },
    });

    if (status === 'APPROVED') {
      if (balance) {
        await db.leaveBalance.update({
          where: { id: balance.id },
          data: {
            used: { increment: existingLeave.daysCount },
            pending: { decrement: Math.min(balance.pending, existingLeave.daysCount) },
          },
        });
      }

      // Automatically synchronize AttendanceRecords for the duration of the leave
      const current = new Date(existingLeave.startDate);
      const end = new Date(existingLeave.endDate);

      while (current <= end) {
        const startOfDay = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate(), 0, 0, 0, 0));

        await db.attendanceRecord.upsert({
          where: {
            employeeId_date: {
              employeeId: existingLeave.employeeId,
              date: startOfDay,
            },
          },
          update: {
            status: 'ON_LEAVE',
            notes: `Approved Leave (${existingLeave.leaveType}): ${existingLeave.reason}`,
          },
          create: {
            employeeId: existingLeave.employeeId,
            date: startOfDay,
            status: 'ON_LEAVE',
            notes: `Approved Leave (${existingLeave.leaveType}): ${existingLeave.reason}`,
          },
        });

        current.setDate(current.getDate() + 1);
      }
    } else if (status === 'REJECTED') {
      if (balance && balance.pending >= existingLeave.daysCount) {
        await db.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pending: { decrement: existingLeave.daysCount },
          },
        });
      }
    }

    const updated = await db.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status,
        approvedBy: session.email,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: status === 'APPROVED' ? 'APPROVE_LEAVE' : 'REJECT_LEAVE',
      entityType: 'LeaveRequest',
      entityId: leaveId,
      metadata: { status, approvedBy: session.email, daysCount: existingLeave.daysCount },
    });

    return NextResponse.json({
      success: true,
      leaveRequest: updated,
      message: `Leave request ${status.toLowerCase()} and attendance records synchronized.`,
    });
  } catch (error: any) {
    console.error('Leave review error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update leave request.' }, { status: 500 });
  }
}
