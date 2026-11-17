import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');

    let dateFilter: any;
    if (dateStr) {
      const targetDate = new Date(dateStr);
      const startOfDay = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0, 0));
      const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);
      dateFilter = { gte: startOfDay, lte: endOfDay };
    } else {
      // Default to today
      const now = new Date();
      const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      const endOfToday = new Date(startOfToday.getTime() + (24 * 60 * 60 * 1000) - 1);
      dateFilter = { gte: startOfToday, lte: endOfToday };
    }

    const where: any = {
      date: dateFilter,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (departmentId) {
      where.employee = { departmentId };
    }

    const records = await db.attendanceRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            companyEmail: true,
            department: { select: { id: true, name: true } },
            team: { select: { id: true, name: true } },
          },
        },
      },
    });

    const presentCount = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const lateCount = records.filter((r) => r.isLate || r.status === 'LATE').length;
    const halfDayCount = records.filter((r) => r.status === 'HALF_DAY').length;
    const leaveCount = records.filter((r) => r.status === 'ON_LEAVE').length;
    const regularizedCount = records.filter((r) => r.regularized).length;

    return NextResponse.json({
      success: true,
      records,
      metrics: {
        presentCount,
        lateCount,
        halfDayCount,
        leaveCount,
        regularizedCount,
        totalRecords: records.length,
      },
    });
  } catch (error: any) {
    console.error('Fetch attendance error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch attendance.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const {
      employeeId,
      status = 'PRESENT',
      totalHours = 8,
      checkIn,
      checkOut,
      notes,
    } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required.' }, { status: 400 });
    }

    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const hoursNum = parseFloat(totalHours) || 8;
    const workMinutes = Math.round(hoursNum * 60);

    const record = await db.attendanceRecord.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: startOfToday,
        },
      },
      update: {
        status,
        totalHours: hoursNum,
        workMinutes,
        notes: notes || null,
        checkIn: checkIn ? new Date(checkIn) : now,
        checkOut: checkOut ? new Date(checkOut) : null,
      },
      create: {
        employeeId,
        date: startOfToday,
        checkIn: checkIn ? new Date(checkIn) : now,
        checkOut: checkOut ? new Date(checkOut) : null,
        totalHours: hoursNum,
        workMinutes,
        status,
        notes: notes || null,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'RECORD_ATTENDANCE',
      entityType: 'AttendanceRecord',
      entityId: record.id,
      metadata: { employeeId, status, totalHours: hoursNum },
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error('Attendance recording error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record attendance.' }, { status: 500 });
  }
}
