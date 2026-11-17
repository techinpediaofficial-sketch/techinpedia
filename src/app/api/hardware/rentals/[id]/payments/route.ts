import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

/**
 * Helper to compute calendar or order-based monthly cycles from startDate up to now/endDate.
 */
function generateMonthlyCycles(startDate: Date, endDate: Date | null, monthlyRate: number) {
  const cycles: Array<{
    cycleMonth: string;
    cycleLabel: string;
    cycleStartDate: Date;
    cycleEndDate: Date;
    dueDate: Date;
    expectedAmount: number;
  }> = [];

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const now = new Date();
  const limitDate = endDate && endDate < now ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 2, 0);

  let current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= limitDate) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const cycleMonth = `${year}-${String(month + 1).padStart(2, '0')}`;

    const cycleStartDate = new Date(year, month, 1);
    const cycleEndDate = new Date(year, month + 1, 0, 23, 59, 59);

    // Due date is usually 5th of the billing month
    const dueDate = new Date(year, month, Math.min(5, cycleEndDate.getDate()));

    const monthName = cycleStartDate.toLocaleString('default', { month: 'short' });
    const cycleLabel = `${monthName} ${year} (${cycleStartDate.getDate()} ${monthName} - ${cycleEndDate.getDate()} ${monthName})`;

    cycles.push({
      cycleMonth,
      cycleLabel,
      cycleStartDate,
      cycleEndDate,
      dueDate,
      expectedAmount: monthlyRate,
    });

    current = new Date(year, month + 1, 1);
  }

  return cycles.reverse(); // Latest month first
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const order = await db.rentalOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { asset: true } },
        payments: {
          orderBy: { cycleMonth: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Rental order not found' }, { status: 404 });
    }

    const calculatedCycles = generateMonthlyCycles(order.startDate, order.endDate, order.monthlyRate);
    const existingPaymentsMap = new Map(order.payments.map((p) => [p.cycleMonth, p]));
    const now = new Date();

    const mergedCycles = calculatedCycles.map((cycle) => {
      const existing = existingPaymentsMap.get(cycle.cycleMonth);
      if (existing) {
        return {
          id: existing.id,
          cycleMonth: existing.cycleMonth,
          cycleLabel: cycle.cycleLabel,
          cycleStartDate: existing.cycleStartDate,
          cycleEndDate: existing.cycleEndDate,
          dueDate: existing.dueDate,
          expectedAmount: existing.expectedAmount,
          paidAmount: existing.paidAmount,
          pendingAmount: existing.pendingAmount,
          status: existing.status,
          paymentDate: existing.paymentDate,
          paymentMethod: existing.paymentMethod,
          paymentType: existing.paymentType,
          transactionRef: existing.transactionRef,
          invoiceNumber: existing.invoiceNumber,
          notes: existing.notes,
          recordedBy: existing.recordedBy,
          isRecorded: true,
        };
      }

      const isOverdue = now > cycle.dueDate;
      return {
        id: null,
        cycleMonth: cycle.cycleMonth,
        cycleLabel: cycle.cycleLabel,
        cycleStartDate: cycle.cycleStartDate,
        cycleEndDate: cycle.cycleEndDate,
        dueDate: cycle.dueDate,
        expectedAmount: cycle.expectedAmount,
        paidAmount: 0,
        pendingAmount: cycle.expectedAmount,
        status: isOverdue ? 'OVERDUE' : 'PENDING',
        paymentDate: null,
        paymentMethod: null,
        paymentType: null,
        transactionRef: null,
        invoiceNumber: null,
        notes: null,
        recordedBy: null,
        isRecorded: false,
      };
    });

    const totalExpected = mergedCycles.reduce((sum, c) => sum + c.expectedAmount, 0);
    const totalPaid = mergedCycles.reduce((sum, c) => sum + c.paidAmount, 0);
    const totalPending = mergedCycles.reduce((sum, c) => sum + c.pendingAmount, 0);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer,
        monthlyRate: order.monthlyRate,
        securityDeposit: order.securityDeposit,
        status: order.status,
        startDate: order.startDate,
        endDate: order.endDate,
      },
      summary: {
        totalCycles: mergedCycles.length,
        totalExpected,
        totalPaid,
        totalPending,
      },
      cycles: mergedCycles,
      history: order.payments,
    });
  } catch (error: any) {
    if (error?.name === 'AuthenticationError' || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Fetch rental payments error:', error);
    return NextResponse.json({ error: 'Failed to fetch rental payments' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const {
      cycleMonth,
      cycleStartDate,
      cycleEndDate,
      dueDate,
      expectedAmount,
      amountPaid,
      paymentMethod = 'UPI',
      paymentType = 'FULL', // 'FULL', 'PARTIAL', 'ADVANCE'
      paymentDate,
      transactionRef,
      invoiceNumber,
      notes,
    } = body;

    if (!cycleMonth) {
      return NextResponse.json({ error: 'cycleMonth is required (e.g. 2026-10)' }, { status: 400 });
    }

    const payAmountFloat = parseFloat(String(amountPaid));
    if (isNaN(payAmountFloat) || payAmountFloat <= 0) {
      return NextResponse.json({ error: 'A valid payment amount greater than 0 is required' }, { status: 400 });
    }

    const order = await db.rentalOrder.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Rental order not found' }, { status: 404 });
    }

    const targetExpected = expectedAmount !== undefined ? parseFloat(String(expectedAmount)) : order.monthlyRate;

    // Check if a payment record already exists for this cycleMonth
    const existing = await db.rentalPayment.findFirst({
      where: {
        rentalOrderId: id,
        cycleMonth,
      },
    });

    let savedPayment;
    const effectivePaymentDate = paymentDate ? new Date(paymentDate) : new Date();

    if (existing) {
      const newPaidAmount = existing.paidAmount + payAmountFloat;
      const newPendingAmount = Math.max(0, existing.expectedAmount - newPaidAmount);
      const newStatus = newPendingAmount === 0 ? 'PAID' : (newPaidAmount > 0 ? 'PARTIAL' : 'PENDING');

      const appendNote = notes?.trim()
        ? `${existing.notes ? existing.notes + ' | ' : ''}Paid ₹${payAmountFloat} on ${effectivePaymentDate.toISOString().split('T')[0]} via ${paymentMethod} (${notes.trim()})`
        : existing.notes;

      savedPayment = await db.rentalPayment.update({
        where: { id: existing.id },
        data: {
          paidAmount: newPaidAmount,
          pendingAmount: newPendingAmount,
          status: newStatus,
          paymentDate: effectivePaymentDate,
          paymentMethod,
          paymentType: newStatus === 'PAID' ? 'FULL' : 'PARTIAL',
          transactionRef: transactionRef?.trim() || existing.transactionRef,
          invoiceNumber: invoiceNumber?.trim() || existing.invoiceNumber,
          notes: appendNote,
          recordedBy: (session as any).name || (session as any).userName || session.email || 'Admin',
        },
      });
    } else {
      const pendingAmount = Math.max(0, targetExpected - payAmountFloat);
      const status = pendingAmount === 0 ? 'PAID' : (payAmountFloat > 0 ? 'PARTIAL' : 'PENDING');

      const [yearStr, monthStr] = cycleMonth.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10) - 1;

      const cStart = cycleStartDate ? new Date(cycleStartDate) : new Date(y, m, 1);
      const cEnd = cycleEndDate ? new Date(cycleEndDate) : new Date(y, m + 1, 0, 23, 59, 59);
      const cDue = dueDate ? new Date(dueDate) : new Date(y, m, 5);

      savedPayment = await db.rentalPayment.create({
        data: {
          rentalOrderId: id,
          cycleMonth,
          cycleStartDate: cStart,
          cycleEndDate: cEnd,
          dueDate: cDue,
          expectedAmount: targetExpected,
          paidAmount: payAmountFloat,
          pendingAmount,
          status,
          paymentDate: effectivePaymentDate,
          paymentMethod,
          paymentType: status === 'PAID' ? 'FULL' : 'PARTIAL',
          transactionRef: transactionRef?.trim() || null,
          invoiceNumber: invoiceNumber?.trim() || null,
          notes: notes?.trim() || `Rent payment recorded via ${paymentMethod}`,
          recordedBy: (session as any).name || (session as any).userName || session.email || 'Admin',
        },
      });
    }

    await logActivity({
      userId: session.userId,
      action: 'PAYMENT',
      entityType: 'RENTAL_PAYMENT',
      entityId: savedPayment.id,
      details: `Recorded rent of ₹${payAmountFloat} for Order ${order.orderNumber} (${cycleMonth}, Status: ${savedPayment.status})`,
    });

    return NextResponse.json({
      success: true,
      payment: savedPayment,
    });
  } catch (error: any) {
    if (error?.name === 'AuthenticationError' || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Record rental payment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record rent payment' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
    }

    const payment = await db.rentalPayment.findFirst({
      where: { id: paymentId, rentalOrderId: id },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    await db.rentalPayment.delete({ where: { id: paymentId } });

    await logActivity({
      userId: session.userId,
      action: 'DELETE_PAYMENT',
      entityType: 'RENTAL_PAYMENT',
      entityId: paymentId,
      details: `Deleted rental payment of ₹${payment.paidAmount} for Order ID: ${id} (${payment.cycleMonth})`,
    });

    return NextResponse.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error: any) {
    console.error('Delete payment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete payment' }, { status: 500 });
  }
}

