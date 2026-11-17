import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    const customerId = searchParams.get('customerId');

    const where: any = {};
    if (invoiceId) where.invoiceId = invoiceId;
    if (customerId) where.customerId = customerId;

    if (session.role !== 'SUPER_ADMIN') {
      where.businessUnitId = { in: session.businessUnitIds || [] };
    }

    const payments = await db.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: {
        invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, status: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

    return NextResponse.json({
      success: true,
      payments,
      metrics: { totalCollected },
    });
  } catch (error) {
    console.error('Fetch payments error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const {
      invoiceId,
      customerId,
      amount,
      paymentMethod = 'BANK_TRANSFER',
      referenceId,
      notes,
    } = body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required.' }, { status: 400 });
    }

    // Execute atomic transaction for payment and invoice balance recalculation
    const result = await db.$transaction(async (tx) => {
      let linkedCustomerId = customerId;
      let invoiceRecord: any = null;

      if (invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
        if (!invoice) throw new Error('Referenced invoice not found');
        invoiceRecord = invoice;

        linkedCustomerId = linkedCustomerId || invoice.customerId;

        const newAmountPaid = invoice.amountPaid + parsedAmount;
        const newBalanceDue = Math.max(0, invoice.totalAmount - newAmountPaid);
        const newStatus = newBalanceDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            amountPaid: newAmountPaid,
            balanceDue: newBalanceDue,
            status: newStatus,
          },
        });
      }

      // Record payment
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoiceId || null,
          customerId: linkedCustomerId || null,
          businessUnitId: invoiceRecord?.businessUnitId || session.businessUnitIds?.[0] || null,
          amount: parsedAmount,
          paymentMethod,
          referenceId: referenceId || null,
          notes: notes || null,
          recordedBy: session.email,
        },
      });

      // Update customer lifetime value if linked
      if (linkedCustomerId) {
        await tx.customer.update({
          where: { id: linkedCustomerId },
          data: {
            lifetimeValue: { increment: parsedAmount },
          },
        });
      }

      return payment;
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'RECORD_PAYMENT',
      entityType: 'Payment',
      entityId: result.id,
      metadata: { amount: parsedAmount, paymentMethod, invoiceId },
    });

    return NextResponse.json({ success: true, payment: result });
  } catch (error: any) {
    console.error('Payment record error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record payment.' }, { status: 500 });
  }
}
