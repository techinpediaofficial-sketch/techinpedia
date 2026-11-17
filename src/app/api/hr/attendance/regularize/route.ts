import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (employeeId) {
      where.employeeId = employeeId;
    }

    const requests = await db.regularizationRequest.findMany({
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
        approvedBy: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
          },
        },
      },
    });

    const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
    const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
    const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

    return NextResponse.json({
      success: true,
      requests,
      metrics: {
        pendingCount,
        approvedCount,
        rejectedCount,
        total: requests.length,
      },
    });
  } catch (error: any) {
    console.error('Fetch regularization requests error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch regularization requests.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const {
      employeeId: inputEmpId,
      date,
      requestedCheckIn,
      requestedCheckOut,
      reason,
    } = body;

    let targetEmployeeId = inputEmpId;
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

    if (!targetEmployeeId || !date || !requestedCheckIn || !requestedCheckOut || !reason?.trim()) {
      return NextResponse.json({
        error: 'Employee, punch date, requested in/out times, and detailed reason are required.',
      }, { status: 400 });
    }

    const punchDate = new Date(date);
    const startOfPunchDay = new Date(Date.UTC(punchDate.getUTCFullYear(), punchDate.getUTCMonth(), punchDate.getUTCDate(), 0, 0, 0, 0));

    const regRequest = await db.regularizationRequest.create({
      data: {
        employeeId: targetEmployeeId,
        date: startOfPunchDay,
        requestedCheckIn: new Date(requestedCheckIn),
        requestedCheckOut: new Date(requestedCheckOut),
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
      action: 'SUBMIT_ATTENDANCE_REGULARIZATION',
      entityType: 'RegularizationRequest',
      entityId: regRequest.id,
      metadata: {
        employeeId: targetEmployeeId,
        date: startOfPunchDay.toISOString(),
        reason: reason.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      request: regRequest,
      message: 'Regularization request submitted successfully.',
    });
  } catch (error: any) {
    console.error('Regularization request submission error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit regularization request.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { requestId, status, managerNotes } = body;

    if (!requestId || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({
        error: 'Valid regularization request ID and status (APPROVED or REJECTED) are required.',
      }, { status: 400 });
    }

    const existingReq = await db.regularizationRequest.findUnique({
      where: { id: requestId },
      include: { employee: true },
    });

    if (!existingReq) {
      return NextResponse.json({ error: 'Regularization request not found.' }, { status: 404 });
    }

    // Resolve reviewer employee ID if possible
    let reviewerEmpId = session.employeeId;
    if (!reviewerEmpId) {
      const emp = await db.employee.findFirst({
        where: {
          OR: [
            { user: { id: session.userId } },
            { companyEmail: session.email },
          ],
        },
      });
      reviewerEmpId = emp?.id || null;
    }

    const updatedRequest = await db.regularizationRequest.update({
      where: { id: requestId },
      data: {
        status,
        approvedById: reviewerEmpId,
        managerNotes: managerNotes?.trim() || null,
      },
    });

    // When APPROVED, automatically update/create the underlying AttendanceRecord
    if (status === 'APPROVED') {
      const checkIn = new Date(existingReq.requestedCheckIn);
      const checkOut = new Date(existingReq.requestedCheckOut);
      const workMinutes = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 60000));
      const totalHours = parseFloat((workMinutes / 60).toFixed(2));
      const finalStatus = workMinutes < 240 ? 'HALF_DAY' : 'PRESENT';

      const startOfDay = new Date(existingReq.date);
      const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);

      const existingRecord = await db.attendanceRecord.findFirst({
        where: {
          employeeId: existingReq.employeeId,
          date: { gte: startOfDay, lte: endOfDay },
        },
      });

      if (existingRecord) {
        await db.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            checkIn,
            checkOut,
            workMinutes,
            totalHours,
            status: finalStatus,
            isLate: false,
            isEarlyExit: false,
            regularized: true,
            regularizationReason: existingReq.reason,
            notes: `Regularized by ${session.email}: ${managerNotes || existingReq.reason}`,
          },
        });
      } else {
        await db.attendanceRecord.create({
          data: {
            employeeId: existingReq.employeeId,
            date: startOfDay,
            checkIn,
            checkOut,
            workMinutes,
            totalHours,
            status: finalStatus,
            isLate: false,
            isEarlyExit: false,
            regularized: true,
            regularizationReason: existingReq.reason,
            notes: `Regularized by ${session.email}: ${managerNotes || existingReq.reason}`,
          },
        });
      }
    }

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: status === 'APPROVED' ? 'APPROVE_ATTENDANCE_REGULARIZATION' : 'REJECT_ATTENDANCE_REGULARIZATION',
      entityType: 'RegularizationRequest',
      entityId: requestId,
      metadata: {
        status,
        employeeId: existingReq.employeeId,
        date: existingReq.date.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: `Regularization request ${status.toLowerCase()} successfully.`,
    });
  } catch (error: any) {
    console.error('Update regularization request error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update regularization request.' }, { status: 500 });
  }
}
