import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();

    // Parallel fetch of executive metrics
    const [
      payments,
      invoices,
      contracts,
      deals,
      projects,
      tickets,
      employees,
    ] = await Promise.all([
      db.payment.findMany({
        select: { amount: true, paymentDate: true },
      }),
      db.invoice.findMany({
        select: { totalAmount: true, status: true, dueDate: true },
      }),
      db.contract.findMany({
        where: { status: 'ACTIVE' },
        select: { totalValue: true, contractType: true },
      }),
      db.deal.findMany({
        select: {
          id: true,
          title: true,
          value: true,
          wonDate: true,
          lostDate: true,
          probability: true,
          stage: { select: { name: true, probability: true, isWon: true, isLost: true } },
        },
      }),
      db.projectRecord.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          deadline: true,
        },
      }),
      db.supportTicket.findMany({
        select: { id: true, status: true, priority: true },
      }),
      db.employee.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, basicSalary: true, grossSalary: true },
      }),
    ]);

    // Financial Realization
    const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalInvoiced = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const paidInvoices = invoices.filter((i) => i.status === 'PAID').reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const outstandingDue = Math.max(0, totalInvoiced - paidInvoices);

    // MRR Calculation
    const mrr = contracts.reduce((acc, c) => {
      const val = c.totalValue || 0;
      if (val <= 0) return acc;
      return acc + (['IT_RENTAL', 'AMC', 'SAAS'].includes(c.contractType) ? val : Math.round(val / 12));
    }, 0);

    // Sales Pipeline & Forecast
    const wonDeals = deals.filter((d) => d.wonDate !== null || d.stage?.isWon === true);
    const lostDeals = deals.filter((d) => d.lostDate !== null || d.stage?.isLost === true);
    const openDeals = deals.filter((d) => !d.wonDate && !d.lostDate && !d.stage?.isWon && !d.stage?.isLost);

    const totalOpenPipeline = openDeals.reduce((acc, d) => acc + (d.value || 0), 0);
    const totalWonRevenue = wonDeals.reduce((acc, d) => acc + (d.value || 0), 0);

    // Weighted Pipeline Forecast: value * (probability / 100)
    const weightedPipelineForecast = Math.round(
      openDeals.reduce((acc, d) => {
        const prob = d.probability ?? d.stage?.probability ?? 50;
        return acc + ((d.value || 0) * (prob / 100));
      }, 0)
    );

    const closedDealsCount = wonDeals.length + lostDeals.length;
    const winRate = closedDealsCount > 0 ? Math.round((wonDeals.length / closedDealsCount) * 100) : (deals.length > 0 ? 65 : 0);

    // Project Delivery Health
    const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'ACTIVE').length;
    const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;
    const delayedProjects = projects.filter((p) => {
      if (p.status === 'COMPLETED') return false;
      return p.deadline && new Date(p.deadline) < new Date();
    }).length;

    // Customer SLA & Tickets
    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    const openTickets = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    const ticketSlaRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 100;

    // Workforce & Monthly Burn
    const totalHeadcount = employees.length;
    const monthlyGrossPayroll = employees.reduce((acc, e) => acc + (e.grossSalary || (e.basicSalary * 1.6)), 0);

    return NextResponse.json({
      success: true,
      financials: {
        totalCollected,
        totalInvoiced,
        outstandingDue,
        monthlyRecurringRevenue: Math.round(mrr),
        annualRecurringRevenue: Math.round(mrr * 12),
      },
      pipeline: {
        openDealsCount: openDeals.length,
        wonDealsCount: wonDeals.length,
        totalOpenPipeline,
        totalWonRevenue,
        weightedPipelineForecast,
        winRate,
      },
      delivery: {
        totalProjects: projects.length,
        activeProjects,
        completedProjects,
        delayedProjects,
        totalTickets,
        openTickets,
        resolvedTickets,
        ticketSlaRate,
      },
      workforce: {
        totalHeadcount,
        monthlyGrossPayroll,
      },
    });
  } catch (error: any) {
    console.error('Executive Dashboard API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch executive dashboard data' }, { status: 500 });
  }
}
