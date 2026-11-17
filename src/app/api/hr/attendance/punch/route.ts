import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

function getISTDateComponents(date: Date = new Date()) {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  const year = istDate.getFullYear();
  const month = istDate.getMonth();
  const day = istDate.getDate();
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();

  // Normalize start of day in UTC for DB Date column consistency
  const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

  return { year, month, day, hours, minutes, startOfDay, istDate };
}

function getClientDetails(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');
  const userAgent = request.headers.get('user-agent') || 'Browser';
  
  let device = 'Desktop';
  if (/mobile/i.test(userAgent)) device = 'Mobile';
  else if (/tablet|ipad/i.test(userAgent)) device = 'Tablet';

  return { ipAddress: ip, device };
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const requestedEmpId = searchParams.get('employeeId');

    // Determine target employee ID
    let employeeId = requestedEmpId;
    if (!employeeId) {
      if (session.employeeId) {
        employeeId = session.employeeId;
      } else {
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
    }

    if (!employeeId) {
      return NextResponse.json({
        success: true,
        record: null,
        punchState: 'NOT_REGISTERED_EMPLOYEE',
      });
    }

    const { startOfDay } = getISTDateComponents();
    const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);

    const record = await db.attendanceRecord.findFirst({
      where: {
        employeeId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    let punchState = 'NOT_CHECKED_IN';
    if (record?.checkIn && !record?.checkOut) {
      punchState = 'CHECKED_IN';
    } else if (record?.checkIn && record?.checkOut) {
      punchState = 'CHECKED_OUT';
    }

    return NextResponse.json({
      success: true,
      employeeId,
      record,
      punchState,
    });
  } catch (error: any) {
    console.error('Fetch punch status error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch punch status' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const { action = 'CLOCK_IN', employeeId: bodyEmpId, notes } = body;

    // Resolve target employee
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
        targetEmployeeId = emp?.id || null;
      }
    }

    if (!targetEmployeeId) {
      return NextResponse.json({
        error: 'No associated employee profile found for clock-in.',
      }, { status: 400 });
    }

    const now = new Date();
    const { hours, minutes, startOfDay } = getISTDateComponents(now);
    const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);
    const { ipAddress, device } = getClientDetails(request);

    // Look for existing record today
    let record = await db.attendanceRecord.findFirst({
      where: {
        employeeId: targetEmployeeId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (action === 'CLOCK_IN') {
      if (record && record.checkIn) {
        return NextResponse.json({
          error: 'You have already clocked in for today.',
          record,
        }, { status: 400 });
      }

      // Shift policy: Shift starts at 09:30 AM with 15 min grace (09:45 AM)
      const isLate = hours > 9 || (hours === 9 && minutes > 45);
      const status = isLate ? 'LATE' : 'PRESENT';

      if (record) {
        record = await db.attendanceRecord.update({
          where: { id: record.id },
          data: {
            checkIn: now,
            status,
            isLate,
            ipAddress,
            device,
            notes: notes || record.notes,
          },
        });
      } else {
        record = await db.attendanceRecord.create({
          data: {
            employeeId: targetEmployeeId,
            date: startOfDay,
            checkIn: now,
            status,
            isLate,
            ipAddress,
            device,
            notes: notes || null,
          },
        });
      }

      await logActivity({
        userId: session.userId,
        userEmail: session.email,
        action: 'ATTENDANCE_CLOCK_IN',
        entityType: 'AttendanceRecord',
        entityId: record.id,
        metadata: {
          employeeId: targetEmployeeId,
          isLate,
          ipAddress,
          device,
          time: now.toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        action: 'CLOCK_IN',
        record,
        message: isLate ? 'Clocked in successfully (Marked Late: After 09:45 AM)' : 'Clocked in successfully on time!',
      });
    }

    if (action === 'CLOCK_OUT') {
      if (!record || !record.checkIn) {
        return NextResponse.json({
          error: 'Cannot clock out without clocking in first.',
        }, { status: 400 });
      }

      if (record.checkOut) {
        return NextResponse.json({
          error: 'You have already clocked out for today.',
          record,
        }, { status: 400 });
      }

      const checkInTime = new Date(record.checkIn);
      const diffMs = now.getTime() - checkInTime.getTime();
      const workMinutes = Math.max(1, Math.round(diffMs / 60000));
      const totalHours = parseFloat((workMinutes / 60).toFixed(2));

      // Policy: Early exit before 06:00 PM (18:00 IST)
      const isEarlyExit = hours < 18;

      // Policy: Half-day if less than 4 hours (240 minutes)
      let finalStatus = record.status;
      if (workMinutes < 240) {
        finalStatus = 'HALF_DAY';
      }

      record = await db.attendanceRecord.update({
        where: { id: record.id },
        data: {
          checkOut: now,
          workMinutes,
          totalHours,
          isEarlyExit,
          status: finalStatus,
          notes: notes ? `${record.notes ? record.notes + '; ' : ''}${notes}` : record.notes,
        },
      });

      await logActivity({
        userId: session.userId,
        userEmail: session.email,
        action: 'ATTENDANCE_CLOCK_OUT',
        entityType: 'AttendanceRecord',
        entityId: record.id,
        metadata: {
          employeeId: targetEmployeeId,
          workMinutes,
          totalHours,
          isEarlyExit,
          status: finalStatus,
          time: now.toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        action: 'CLOCK_OUT',
        record,
        message: `Clocked out successfully! Logged ${totalHours} hours (${workMinutes} mins).`,
      });
    }

    return NextResponse.json({ error: 'Invalid action. Expected CLOCK_IN or CLOCK_OUT.' }, { status: 400 });
  } catch (error: any) {
    console.error('Punch action error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process punch action.' }, { status: 500 });
  }
}
