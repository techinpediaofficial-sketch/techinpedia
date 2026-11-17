import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.performance.view')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (dateStr) {
      const date = new Date(dateStr);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      where.date = { gte: date, lt: nextDay };
    }

    const [performances, total] = await Promise.all([
      prisma.employeeDailyPerformance.findMany({
        where,
        include: {
          employee: { select: { name: true, employeeCode: true, department: { select: { name: true } } } }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.employeeDailyPerformance.count({ where })
    ]);

    return NextResponse.json({
      performances,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching daily performance:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    // System or HR admin triggers this
    if (!hasPermission(session, 'hr.performance.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const targetDate = body.date ? new Date(body.date) : new Date();
    // Normalize to midnight UTC for stable querying
    targetDate.setUTCHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    // Fetch active employees
    const activeEmployees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, departmentId: true, designationId: true }
    });

    // 1. Gather all required data in parallel (Attendance, Tasks, CRM)
    // Note: This is an aggregated implementation. For production scaling, we might batch this.
    const [attendanceRecords, tasks, dealsWon] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { date: { gte: targetDate, lt: nextDay } }
      }),
      // Mocking Task completion logic (If `Task` exists in schema, otherwise skip)
      // Assuming a `tasks` structure doesn't exist explicitly in schema yet, we use default 0s.
      Promise.resolve([]),
      // Deals won today
      prisma.deal.findMany({
        where: { 
          wonDate: { gte: targetDate, lt: nextDay },
          stage: { isWon: true }
        }
      })
    ]);

    const results = [];

    // 2. Loop through employees to calculate score
    for (const emp of activeEmployees) {
      const attendance = attendanceRecords.find(a => a.employeeId === emp.id);
      const empDeals = dealsWon.filter(d => d.assignedEmployeeId === emp.id);
      const revenueToday = empDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

      // We'll create a basic score algorithm
      // Score = Attendance(30%) + Tasks(40%) + CRM(30%) - Penalties
      let score = 0;
      if (attendance) {
        if (attendance.status === 'PRESENT' && !attendance.isLate) score += 30;
        else if (attendance.status === 'PRESENT' && attendance.isLate) score += 20;
        else if (attendance.status === 'HALF_DAY') score += 15;
      }
      
      // Add logic based on revenue or deals
      if (empDeals.length > 0) {
        score += 30; // Max CRM score
      } else if (attendance?.status === 'PRESENT') {
        // If present but no deals, give partial baseline
        score += 10;
      }

      // Add baseline for tasks if they were present
      if (attendance?.status === 'PRESENT') {
        score += 40; // Max Task Score for demo purposes
      }

      // Compare with previous day to calculate Growth
      const prevDate = new Date(targetDate);
      prevDate.setDate(targetDate.getDate() - 1);
      
      const prevPerformance = await prisma.employeeDailyPerformance.findFirst({
        where: { 
          employeeId: emp.id, 
          date: { gte: prevDate, lt: targetDate } 
        }
      });

      let growthPercent = 0;
      if (prevPerformance && prevPerformance.finalScore > 0) {
        growthPercent = ((score - prevPerformance.finalScore) / prevPerformance.finalScore) * 100;
      }

      // Determine Status
      let status = 'STABLE';
      if (growthPercent >= 10) status = 'EXCELLENT';
      else if (growthPercent >= 1) status = 'IMPROVING';
      else if (growthPercent <= -15) status = 'CRITICAL';
      else if (growthPercent <= -5) status = 'DECLINING';

      const data = {
        employeeId: emp.id,
        date: targetDate,
        checkIn: attendance?.checkIn || null,
        checkOut: attendance?.checkOut || null,
        workMinutes: attendance?.workMinutes || 0,
        isLate: attendance?.isLate || false,
        dealsWon: empDeals.length,
        revenue: revenueToday,
        finalScore: Math.min(100, Math.max(0, score)),
        growthPercent,
        status,
      };

      // Upsert
      const perf = await prisma.employeeDailyPerformance.upsert({
        where: {
          employeeId_date: { employeeId: emp.id, date: targetDate }
        },
        update: data,
        create: data
      });

      results.push(perf);
    }

    // Log Activity
    try {
      await prisma.activityLog.create({
        data: {
          action: 'DAILY_PERFORMANCE_CALCULATED',
          userId: session.id,
          entityType: 'SYSTEM',
          entityId: 'BATCH',
          details: `Calculated daily performance for ${results.length} employees on ${targetDate.toISOString().split('T')[0]}`,
        }
      });
    } catch (e) {
      console.warn("Could not log activity:", e);
    }

    return NextResponse.json({ message: 'Performance calculated successfully', count: results.length });
  } catch (error) {
    console.error('Error calculating daily performance:', error);
    return NextResponse.json({ error: 'Failed to calculate performance' }, { status: 500 });
  }
}
