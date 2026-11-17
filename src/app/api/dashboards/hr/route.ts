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

    const empFilter = session.role === 'SUPER_ADMIN' ? {} : {
      businessUnits: { some: { businessUnitId: { in: session.businessUnitIds || [] } } }
    };
    const relatedFilter = session.role === 'SUPER_ADMIN' ? {} : {
      employee: {
        businessUnits: { some: { businessUnitId: { in: session.businessUnitIds || [] } } }
      }
    };
    const { year, month, startOfDay } = getISTDateComponents();
    const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);

    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(year, month - 1, totalDaysInMonth, 23, 59, 59, 999));

    // Parallel fetch
    const [
      activeEmployees,
      departments,
      todayRecords,
      monthRecords,
      pendingLeaves,
      pendingRegularizations,
      monthPayrolls,
    ] = await Promise.all([
      db.employee.findMany({
        where: { status: 'ACTIVE', ...empFilter },
        include: {
          department: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
          designation: { select: { title: true } },
        },
      }),
      db.department.findMany({
        include: {
          employees: { select: { id: true, status: true } },
        },
      }),
      db.attendanceRecord.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          ...relatedFilter,
        },
        include: {
          employee: {
            select: { id: true, name: true, departmentId: true },
          },
        },
      }),
      db.attendanceRecord.findMany({
        where: {
          date: { gte: monthStart, lte: monthEnd },
          ...relatedFilter,
        },
      }),
      db.leaveRequest.findMany({
        where: { status: 'PENDING', ...relatedFilter },
        include: {
          employee: {
            select: { id: true, name: true, employeeCode: true, department: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.regularizationRequest.findMany({
        where: { status: 'PENDING', ...relatedFilter },
        include: {
          employee: {
            select: { id: true, name: true, employeeCode: true, department: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.payrollRecord.findMany({
        where: { month, year, ...relatedFilter },
      }),
    ]);

    const totalStaff = activeEmployees.length;
    const presentToday = todayRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const lateToday = todayRecords.filter((r) => r.isLate || r.status === 'LATE').length;
    const halfDayToday = todayRecords.filter((r) => r.status === 'HALF_DAY').length;
    const onLeaveToday = todayRecords.filter((r) => r.status === 'ON_LEAVE').length;
    const absentToday = Math.max(0, totalStaff - presentToday - halfDayToday - onLeaveToday);

    const presenceRate = totalStaff > 0 ? Math.round(((presentToday + halfDayToday * 0.5) / totalStaff) * 100) : 0;

    // Department breakdown
    const deptAttendanceMap = new Map<string, number>();
    todayRecords.forEach((r) => {
      const deptId = r.employee.departmentId || 'unassigned';
      deptAttendanceMap.set(deptId, (deptAttendanceMap.get(deptId) || 0) + 1);
    });

    const departmentStats = departments.map((d) => {
      const deptEmployees = d.employees.filter((e) => e.status === 'ACTIVE').length;
      const deptPresent = deptAttendanceMap.get(d.id) || 0;
      const rate = deptEmployees > 0 ? Math.round((deptPresent / deptEmployees) * 100) : 0;

      return {
        id: d.id,
        name: d.name,
        totalHeadcount: deptEmployees,
        presentToday: deptPresent,
        presenceRate: rate,
      };
    });

    // Payroll readiness forecast
    const totalPayrollGross = activeEmployees.reduce((acc, e) => acc + (e.grossSalary || (e.basicSalary * 1.6)), 0);
    const totalLopDaysRecorded = monthRecords.filter((r) => r.status === 'HALF_DAY').length * 0.5 +
      monthRecords.filter((r) => r.status === 'ABSENT').length;

    return NextResponse.json({
      success: true,
      presence: {
        totalStaff,
        presentToday,
        lateToday,
        halfDayToday,
        onLeaveToday,
        absentToday,
        presenceRate,
      },
      departmentStats,
      alerts: {
        pendingLeavesCount: pendingLeaves.length,
        pendingRegularizationsCount: pendingRegularizations.length,
        pendingLeaves,
        pendingRegularizations,
      },
      payrollReadiness: {
        month,
        year,
        isGenerated: monthPayrolls.length > 0,
        payrollsCount: monthPayrolls.length,
        projectedGrossBurn: totalPayrollGross,
        lopDaysAccumulated: totalLopDaysRecorded,
      },
      headcount: {
        active: totalStaff,
        departmentsCount: departments.length,
      },
    });
  } catch (error: any) {
    console.error('HR Dashboard API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch HR dashboard data' }, { status: 500 });
  }
}
