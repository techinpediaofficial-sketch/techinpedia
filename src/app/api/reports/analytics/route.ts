import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();

    // CRM & Sales Aggregations
    const totalLeads = await db.enquiry.count();
    const convertedLeads = await db.enquiry.count({ where: { status: 'WON' } });
    const deals = await db.deal.findMany({
      select: {
        id: true,
        value: true,
        stageId: true,
        pipeline: { select: { name: true } },
        stage: { select: { isWon: true, isLost: true } },
      },
    });
    const invoices = await db.invoice.findMany({
      select: { id: true, totalAmount: true, amountPaid: true, balanceDue: true, status: true },
    });
    const payments = await db.payment.findMany({
      select: { id: true, amount: true, paymentDate: true },
    });
    const expenses = await db.expense.findMany({
      select: { id: true, amount: true },
    });
    const projects = await db.projectRecord.findMany({
      select: { id: true, budget: true, status: true, progress: true },
    });
    const tasks = await db.task.findMany({
      select: { id: true, status: true },
    });
    const timesheets = await db.timesheet.findMany({
      select: { id: true, hours: true, isBillable: true },
    });
    const employees = await db.employee.count({ where: { status: 'ACTIVE' } });
    const attendanceToday = await db.attendanceRecord.count({
      where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    });
    const leavesPending = await db.leaveRequest.count({ where: { status: 'PENDING' } });
    const payrolls = await db.payrollRecord.findMany({ select: { netSalary: true } });
    const assets = await db.rentalAsset.findMany({
      select: { id: true, status: true, purchaseCost: true },
    });
    const rentals = await db.rentalOrder.findMany({
      where: { status: 'ACTIVE' },
      select: { monthlyRate: true, securityDeposit: true },
    });
    const subscriptions = await db.saaSSubscription.findMany({
      where: { status: 'ACTIVE' },
      select: { price: true },
    });
    const tickets = await db.supportTicket.findMany({
      select: { id: true, status: true, priority: true },
    });

    // Financial Metrics
    const totalInvoiced = invoices.reduce((acc: number, inv: { totalAmount: number }) => acc + inv.totalAmount, 0);
    const realizedRevenue = payments.reduce((acc: number, p: { amount: number }) => acc + p.amount, 0);
    const outstandingReceivables = invoices.reduce((acc: number, inv: { balanceDue: number }) => acc + inv.balanceDue, 0);
    const totalExpenses = expenses.reduce((acc: number, exp: { amount: number }) => acc + exp.amount, 0);
    const netCashflow = realizedRevenue - totalExpenses;

    // Sales Pipeline
    const wonDeals = deals.filter((d: any) => d.stage?.isWon);
    const wonRevenue = wonDeals.reduce((acc: number, d: any) => acc + d.value, 0);
    const activeDeals = deals.filter((d: any) => !d.stage?.isWon && !d.stage?.isLost);
    const pipelineValue = activeDeals.reduce((acc: number, d: any) => acc + d.value, 0);
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

    // SaaS MRR & ARR
    const saasMrr = subscriptions.reduce((acc: number, s: { price: number }) => acc + s.price, 0);
    const saasArr = saasMrr * 12;

    // Hardware Rental Runrate & Fleet Utilization
    const rentalMonthlyRunrate = rentals.reduce((acc: number, r: { monthlyRate: number }) => acc + r.monthlyRate, 0);
    const rentedAssetsCount = assets.filter((a: any) => a.status === 'RENTED').length;
    const fleetUtilization = assets.length > 0 ? ((rentedAssetsCount / assets.length) * 100).toFixed(1) : '0';

    // Operations & Tasks
    const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED').length;
    const totalBillableHours = timesheets.filter((ts: any) => ts.isBillable).reduce((acc: number, ts: any) => acc + ts.hours, 0);

    // Support SLA Health
    const openTickets = tickets.filter((t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    const urgentTickets = tickets.filter((t: any) => t.priority === 'URGENT' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
    const resolvedTickets = tickets.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

    // Monthly Payroll
    const totalPayroll = payrolls.reduce((acc: number, p: { netSalary: number }) => acc + p.netSalary, 0);

    return NextResponse.json({
      success: true,
      data: {
        financials: {
          totalInvoiced,
          realizedRevenue,
          outstandingReceivables,
          totalExpenses,
          netCashflow,
        },
        sales: {
          totalLeads,
          convertedLeads,
          conversionRate,
          activeDealsCount: activeDeals.length,
          pipelineValue,
          wonRevenue,
          wonDealsCount: wonDeals.length,
        },
        saas: {
          activeSubscriptions: subscriptions.length,
          mrr: saasMrr,
          arr: saasArr,
        },
        hardware: {
          totalFleet: assets.length,
          rentedAssetsCount,
          fleetUtilization,
          rentalMonthlyRunrate,
          activeRentalsCount: rentals.length,
        },
        operations: {
          activeProjectsCount: projects.filter((p: any) => p.status === 'ACTIVE').length,
          totalProjectsCount: projects.length,
          completedTasks,
          totalTasks: tasks.length,
          totalBillableHours,
        },
        workforce: {
          activeEmployees: employees,
          presentToday: attendanceToday,
          pendingLeaves: leavesPending,
          totalPayroll,
        },
        support: {
          openTickets,
          urgentTickets,
          resolvedTickets,
          totalTickets: tickets.length,
        },
      },
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    return NextResponse.json({ error: 'Failed to aggregate business analytics.' }, { status: 500 });
  }
}
