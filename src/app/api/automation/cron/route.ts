import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { processQueuedJobs } from '@/lib/workflow/queueEngine';
import { emitWorkflowEvent } from '@/lib/workflow/eventEmitter';
import { isValidCronAuthorization } from '@/lib/cron-auth';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!isValidCronAuthorization(authHeader)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 1. Process delayed queue jobs
    const queueResults = await processQueuedJobs();

    // 2. Scan for Overdue Invoices
    const now = new Date();
    const overdueInvoices = await db.invoice.findMany({
      where: {
        status: { in: ['SENT', 'PARTIALLY_PAID'] },
        dueDate: { lt: now },
      },
      take: 20,
    });

    let invoiceEventsDispatched = 0;
    for (const inv of overdueInvoices) {
      const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (24 * 60 * 60 * 1000));
      await emitWorkflowEvent('finance.invoice.overdue', {
        entityId: inv.id,
        entityType: 'Invoice',
        data: {
          invoice: {
            id: inv.id,
            number: inv.invoiceNumber,
            amount: inv.totalAmount,
            dueDate: inv.dueDate,
            daysOverdue,
            status: inv.status,
          },
        },
      });
      invoiceEventsDispatched++;
    }

    // 3. Scan for Rentals Due Soon (within 2 days)
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const dueRentals = await db.rentalOrder.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lte: twoDaysFromNow, gte: now },
      },
      take: 20,
    });

    let rentalEventsDispatched = 0;
    for (const rental of dueRentals) {
      if (!rental.endDate) continue;
      const daysRemaining = Math.ceil((new Date(rental.endDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      await emitWorkflowEvent('hardware.rental.due_soon', {
        entityId: rental.id,
        entityType: 'RentalOrder',
        data: {
          rental: {
            id: rental.id,
            orderNumber: rental.orderNumber,
            endDate: rental.endDate,
            daysRemaining,
          },
        },
      });
      rentalEventsDispatched++;
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      queueResults,
      invoiceEventsDispatched,
      rentalEventsDispatched,
    });
  } catch (error) {
    console.error('Automation cron runner error:', error);
    return NextResponse.json({ error: 'Cron execution failed' }, { status: 500 });
  }
}
