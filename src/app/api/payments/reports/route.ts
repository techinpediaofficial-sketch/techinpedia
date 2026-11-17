import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();

    // 1. All successful payments
    const payments = await db.payment.findMany({
      where: { status: 'SUCCESS' },
      include: {
        salesEmployee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            department: { select: { id: true, name: true } },
          },
        },
        paymentLink: {
          select: {
            purpose: true,
            department: { select: { id: true, name: true } },
          },
        },
        customer: { select: { id: true, name: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // 2. Attribution by Sales Employee
    const employeeMap = new Map<string, { employee: any; totalAmount: number; count: number }>();
    payments.forEach((p) => {
      if (p.salesEmployee) {
        const empId = p.salesEmployee.id;
        const current = employeeMap.get(empId) || {
          employee: p.salesEmployee,
          totalAmount: 0,
          count: 0,
        };
        current.totalAmount += p.amount || 0;
        current.count += 1;
        employeeMap.set(empId, current);
      }
    });

    const employeeLeaderboard = Array.from(employeeMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);

    // 3. Attribution by Department
    const departmentMap = new Map<string, { name: string; totalAmount: number; count: number }>();
    payments.forEach((p) => {
      const deptName = p.salesEmployee?.department?.name || p.paymentLink?.department?.name || 'General / Unassigned';
      const current = departmentMap.get(deptName) || { name: deptName, totalAmount: 0, count: 0 };
      current.totalAmount += p.amount || 0;
      current.count += 1;
      departmentMap.set(deptName, current);
    });

    const departmentBreakdown = Array.from(departmentMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);

    // 4. Attribution by Purpose / Service
    const purposeMap = new Map<string, { purpose: string; totalAmount: number; count: number }>();
    payments.forEach((p) => {
      const purpose = p.paymentLink?.purpose || 'DIRECT_INVOICE';
      const current = purposeMap.get(purpose) || { purpose, totalAmount: 0, count: 0 };
      current.totalAmount += p.amount || 0;
      current.count += 1;
      purposeMap.set(purpose, current);
    });

    const purposeBreakdown = Array.from(purposeMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);

    // 5. Payment Methods
    const methodMap = new Map<string, number>();
    payments.forEach((p) => {
      const method = p.paymentMethod || 'OTHER';
      methodMap.set(method, (methodMap.get(method) || 0) + (p.amount || 0));
    });

    const methodBreakdown = Array.from(methodMap.entries()).map(([method, amount]) => ({
      method,
      amount,
      percentage: totalCollected > 0 ? Math.round((amount / totalCollected) * 100) : 0,
    }));

    return NextResponse.json({
      success: true,
      metrics: {
        totalCollected,
        transactionCount: payments.length,
        attributedEmployeesCount: employeeLeaderboard.length,
      },
      employeeLeaderboard,
      departmentBreakdown,
      purposeBreakdown,
      methodBreakdown,
      recentPayments: payments.slice(0, 15),
    });
  } catch (error: any) {
    console.error('Payment reports GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payment reports' }, { status: 500 });
  }
}
