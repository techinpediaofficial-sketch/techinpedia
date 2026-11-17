import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const targetMonth = searchParams.get('month') || defaultMonth;

    // Fetch all orders that are ACTIVE or were active during this month
    const orders = await db.rentalOrder.findMany({
      where: {
        status: { in: ['ACTIVE', 'DISCONTINUATION_REQUESTED', 'RETURNED'] },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            company: { select: { name: true } },
          },
        },
        items: {
          include: { asset: true },
        },
        payments: {
          where: { cycleMonth: targetMonth },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const [targetYear, targetMonthNum] = targetMonth.split('-').map((v) => parseInt(v, 10));
    const cycleStartDate = new Date(targetYear, targetMonthNum - 1, 1);
    const cycleDueDate = new Date(targetYear, targetMonthNum - 1, 5);

    let totalExpected = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let paidCount = 0;
    let partialCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    const itemsSummary = orders.map((order) => {
      // Check if order started after this month or ended before this month
      const orderStart = new Date(order.startDate);
      const orderEnd = order.endDate ? new Date(order.endDate) : null;

      const isApplicableThisMonth =
        orderStart <= new Date(targetYear, targetMonthNum, 0, 23, 59, 59) &&
        (!orderEnd || orderEnd >= cycleStartDate);

      if (!isApplicableThisMonth && order.status === 'RETURNED') {
        return null;
      }

      const payment = order.payments[0] || null;
      const expectedAmount = order.monthlyRate;
      const paidAmount = payment ? payment.paidAmount : 0;
      const pendingAmount = payment ? payment.pendingAmount : expectedAmount;

      let status = 'PENDING';
      if (payment) {
        status = payment.status;
      } else if (now > cycleDueDate) {
        status = 'OVERDUE';
      }

      totalExpected += expectedAmount;
      totalCollected += paidAmount;
      totalPending += pendingAmount;

      if (status === 'PAID') paidCount++;
      else if (status === 'PARTIAL') partialCount++;
      else if (status === 'OVERDUE') overdueCount++;
      else pendingCount++;

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customer.name,
        customerPhone: order.customer.phone,
        companyName: order.customer.company?.name || null,
        monthlyRate: order.monthlyRate,
        devicesCount: order.items.length,
        items: order.items.map((i) => ({
          assetCode: i.asset.assetCode,
          brand: i.asset.brand,
          model: i.asset.model,
          serialNumber: i.asset.serialNumber,
        })),
        cycleMonth: targetMonth,
        expectedAmount,
        paidAmount,
        pendingAmount,
        status,
        lastPaymentDate: payment?.paymentDate || null,
        paymentMethod: payment?.paymentMethod || null,
        transactionRef: payment?.transactionRef || null,
        notes: payment?.notes || null,
        orderStatus: order.status,
      };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      month: targetMonth,
      summary: {
        totalOrders: itemsSummary.length,
        totalExpected,
        totalCollected,
        totalPending,
        paidCount,
        partialCount,
        pendingCount,
        overdueCount,
      },
      orders: itemsSummary,
    });
  } catch (error: any) {
    if (error?.name === 'AuthenticationError' || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Fetch monthly summary error:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly summary' }, { status: 500 });
  }
}
