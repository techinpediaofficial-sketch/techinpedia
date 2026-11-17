import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const employeeId = searchParams.get('employeeId');

    const where: any = { month, year };
    if (employeeId) where.employeeId = employeeId;

    if (session.role !== 'SUPER_ADMIN') {
      where.employee = {
        businessUnits: {
          some: { businessUnitId: { in: session.businessUnitIds || [] } }
        }
      };
    }

    const payrolls = await db.payrollRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            companyEmail: true,
            phone: true,
            bankName: true,
            accountNumber: true,
            ifscCode: true,
            panNumber: true,
            department: { select: { name: true } },
            team: { select: { name: true } },
          },
        },
      },
    });

    const totalGross = payrolls.reduce((acc, p) => acc + (p.grossSalary || (p.basicSalary + p.allowances)), 0);
    const totalNet = payrolls.reduce((acc, p) => acc + p.netSalary, 0);
    const totalLossOfPay = payrolls.reduce((acc, p) => acc + (p.lossOfPayDeduction || 0), 0);
    const paidCount = payrolls.filter((p) => p.status === 'PAID').length;
    const pendingCount = payrolls.filter((p) => p.status !== 'PAID').length;

    return NextResponse.json({
      success: true,
      payrolls,
      metrics: {
        totalGross,
        totalNet,
        totalLossOfPay,
        employeeCount: payrolls.length,
        paidCount,
        pendingCount,
      },
    });
  } catch (error: any) {
    console.error('Fetch payroll error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payroll records.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const { month, year, employeeId: targetEmpId } = body;

    const targetMonth = parseInt(month) || (new Date().getMonth() + 1);
    const targetYear = parseInt(year) || new Date().getFullYear();

    // Total days in target month
    const totalDaysInMonth = new Date(targetYear, targetMonth, 0).getDate();

    // Start and end dates of the target month in UTC
    const monthStart = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(targetYear, targetMonth - 1, totalDaysInMonth, 23, 59, 59, 999));

    // Fetch active employees
    const employeeQuery: any = { status: 'ACTIVE' };
    if (targetEmpId) employeeQuery.id = targetEmpId;

    if (session.role !== 'SUPER_ADMIN') {
      employeeQuery.businessUnits = {
        some: { businessUnitId: { in: session.businessUnitIds || [] } }
      };
    }

    const employees = await db.employee.findMany({
      where: employeeQuery,
    });

    let generatedCount = 0;

    for (const emp of employees) {
      // 1. Fetch attendance records for this month
      const attendance = await db.attendanceRecord.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: monthStart, lte: monthEnd },
        },
      });

      const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
      const lateCount = attendance.filter((a) => a.status === 'LATE').length;
      const halfDayCount = attendance.filter((a) => a.status === 'HALF_DAY').length;

      // 2. Fetch approved leaves for this month
      const leaves = await db.leaveRequest.findMany({
        where: {
          employeeId: emp.id,
          status: 'APPROVED',
          startDate: { lte: monthEnd },
          endDate: { gte: monthStart },
        },
      });

      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;

      for (const leave of leaves) {
        if (leave.leaveType === 'UNPAID') {
          unpaidLeaveDays += leave.daysCount;
        } else {
          paidLeaveDays += leave.daysCount;
        }
      }

      // Present Days calculation
      const presentDays = presentCount + lateCount + (0.5 * halfDayCount);

      // Loss of Pay Days calculation (unpaid leaves + half day deductions + recorded absences)
      const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
      const lossOfPayDays = unpaidLeaveDays + absentCount + (0.5 * halfDayCount);

      // Salary structure calculation
      const basicSalary = emp.basicSalary || 30000;
      const hra = Math.round(basicSalary * 0.40); // 40% HRA standard
      const specialAllowance = Math.round(basicSalary * 0.20); // 20% Special allowance
      const grossSalary = basicSalary + hra + specialAllowance;

      const perDaySalary = grossSalary / totalDaysInMonth;
      const lossOfPayDeduction = Math.round(perDaySalary * lossOfPayDays);
      const taxDeduction = Math.round(basicSalary * 0.05); // 5% TDS standard
      const otherDeductions = 0;
      const totalDeductions = lossOfPayDeduction + taxDeduction + otherDeductions;

      const netSalary = Math.max(0, Math.round(grossSalary - totalDeductions));

      await db.payrollRecord.upsert({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month: targetMonth,
            year: targetYear,
          },
        },
        update: {
          basicSalary,
          hra,
          specialAllowance,
          grossSalary,
          totalDaysInMonth,
          presentDays,
          paidLeaveDays,
          unpaidLeaveDays,
          lossOfPayDays,
          lossOfPayDeduction,
          taxDeduction,
          otherDeductions,
          allowances: hra + specialAllowance,
          deductions: totalDeductions,
          netSalary,
        },
        create: {
          employeeId: emp.id,
          month: targetMonth,
          year: targetYear,
          basicSalary,
          hra,
          specialAllowance,
          grossSalary,
          totalDaysInMonth,
          presentDays,
          paidLeaveDays,
          unpaidLeaveDays,
          lossOfPayDays,
          lossOfPayDeduction,
          taxDeduction,
          otherDeductions,
          allowances: hra + specialAllowance,
          deductions: totalDeductions,
          netSalary,
          status: 'GENERATED',
        },
      });

      generatedCount++;
    }

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'GENERATE_ATTENDANCE_PAYROLL',
      entityType: 'PayrollRecord',
      metadata: { month: targetMonth, year: targetYear, count: generatedCount },
    });

    return NextResponse.json({
      success: true,
      count: generatedCount,
      message: `Generated attendance-driven payroll for ${generatedCount} employee(s) for ${targetMonth}/${targetYear}.`,
    });
  } catch (error: any) {
    console.error('Generate payroll error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate payroll.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const {
      payrollId,
      status,
      paymentMode,
      referenceNumber,
      notes,
    } = body;

    if (!payrollId || !status) {
      return NextResponse.json({ error: 'Payroll ID and status are required.' }, { status: 400 });
    }

    const updateData: any = { status };
    if (notes !== undefined) updateData.notes = notes;
    if (paymentMode) updateData.paymentMode = paymentMode;
    if (referenceNumber) updateData.referenceNumber = referenceNumber;

    if (status === 'REVIEWED') {
      updateData.reviewedById = session.email;
    } else if (status === 'APPROVED') {
      updateData.approvedById = session.email;
    } else if (status === 'PAID') {
      updateData.paymentDate = new Date();
    }

    const updated = await db.payrollRecord.update({
      where: { id: payrollId },
      data: updateData,
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_PAYROLL_STATUS',
      entityType: 'PayrollRecord',
      entityId: payrollId,
      metadata: { status, paymentMode, referenceNumber },
    });

    return NextResponse.json({
      success: true,
      payroll: updated,
      message: `Payroll status updated to ${status}.`,
    });
  } catch (error: any) {
    console.error('Update payroll error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update payroll.' }, { status: 500 });
  }
}
