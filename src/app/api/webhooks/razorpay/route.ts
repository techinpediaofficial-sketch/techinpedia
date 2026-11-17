import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRazorpayConfig, verifyRazorpayWebhookSignature } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';
    const eventId = request.headers.get('x-razorpay-event-id') || `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const config = await getRazorpayConfig();

    // 1. Verify Cryptographic Signature
    if (config.webhookSecret) {
      const isValid = verifyRazorpayWebhookSignature(rawBody, signature, config.webhookSecret);
      if (!isValid) {
        console.error('Razorpay Webhook: Invalid HMAC Signature');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    } else {
      // In development/demo, warn if secret not configured
      console.warn('Razorpay Webhook: Webhook secret not configured in settings. Skipping HMAC check.');
    }

    // 2. Idempotency Check
    const existingEvent = await db.paymentWebhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent && existingEvent.status === 'PROCESSED') {
      return NextResponse.json({ received: true, message: 'Event already processed' });
    }

    // 3. Record pending webhook event
    if (!existingEvent) {
      await db.paymentWebhookEvent.create({
        data: {
          eventId,
          eventType: 'unknown',
          signature: signature || null,
          payloadJson: rawBody,
          status: 'PENDING',
        },
      });
    }

    // 4. Parse Payload
    const payload = JSON.parse(rawBody);
    const eventType = payload.event || 'payment_link.paid';

    await db.paymentWebhookEvent.update({
      where: { eventId },
      data: { eventType },
    });

    // 5. Handle Payment Link Paid or Payment Captured
    if (eventType === 'payment_link.paid' || eventType === 'payment.captured' || eventType === 'order.paid') {
      const plinkEntity = payload.payload?.payment_link?.entity || payload.payment_link;
      const paymentEntity = payload.payload?.payment?.entity || payload.payment;

      const providerLinkId = plinkEntity?.id;
      const providerPaymentId = paymentEntity?.id || `pay_sim_${Date.now()}`;
      const method = (paymentEntity?.method || 'UPI').toUpperCase();

      // Amount in rupees (Razorpay sends in paise)
      let amount = 0;
      if (paymentEntity?.amount) {
        amount = paymentEntity.amount / 100;
      } else if (plinkEntity?.amount) {
        amount = plinkEntity.amount / 100;
      }

      if (providerLinkId) {
        const paymentLink = await db.paymentLink.findUnique({
          where: { providerLinkId },
          include: { invoice: true },
        });

        if (paymentLink) {
          // Transition PaymentLink status to PAID
          await db.paymentLink.update({
            where: { id: paymentLink.id },
            data: {
              status: 'PAID',
              paidAt: new Date(),
            },
          });

          // Insert verified Payment record
          const existingPayment = await db.payment.findUnique({
            where: { providerPaymentId },
          });

          if (!existingPayment) {
            await db.payment.create({
              data: {
                paymentLinkId: paymentLink.id,
                invoiceId: paymentLink.invoiceId || null,
                customerId: paymentLink.customerId || null,
                amount: amount || paymentLink.amount,
                currency: paymentLink.currency || 'INR',
                paymentDate: new Date(),
                paymentMethod: method,
                provider: 'RAZORPAY',
                providerPaymentId,
                salesEmployeeId: paymentLink.salesEmployeeId || null,
                status: 'SUCCESS',
                referenceId: paymentEntity?.acquirer_data?.bank_transaction_id || paymentEntity?.acquirer_data?.upi_transaction_id || providerPaymentId,
                rawWebhookPayload: rawBody,
                notes: `Razorpay payment captured for ${paymentLink.purpose}. Customer: ${paymentLink.clientName || 'Direct'}`,
                recordedBy: 'Razorpay Official Webhook',
              },
            });
          }

          // Auto-reconcile Invoice if linked
          if (paymentLink.invoice) {
            const currentPaid = paymentLink.invoice.amountPaid || 0;
            const newPaid = currentPaid + (amount || paymentLink.amount);
            const total = paymentLink.invoice.totalAmount || 0;
            const newBalance = Math.max(0, total - newPaid);
            const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

            await db.invoice.update({
              where: { id: paymentLink.invoice.id },
              data: {
                amountPaid: newPaid,
                balanceDue: newBalance,
                status: newStatus,
              },
            });
          }

          // Auto-reconcile Deal if linked
          if (paymentLink.dealId) {
            await db.deal.update({
              where: { id: paymentLink.dealId },
              data: {
                wonDate: new Date(),
              },
            });
          }

          // Customer activity timeline event
          if (paymentLink.customerId) {
            try {
              await db.leadTimelineEvent.create({
                data: {
                  customerId: paymentLink.customerId,
                  type: 'PAYMENT_RECEIVED',
                  title: `Payment Received: ₹${(amount || paymentLink.amount).toLocaleString('en-IN')}`,
                  description: `Official Razorpay payment captured via ${method} for ${paymentLink.purpose}. Ref: ${providerPaymentId}`,
                },
              });
            } catch {
              // Timeline event non-blocking
            }
          }
        }
      }
    }

    // 6. Mark Webhook Event as PROCESSED
    await db.paymentWebhookEvent.update({
      where: { eventId },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });

    return NextResponse.json({
      received: true,
      status: 'PROCESSED',
      eventId,
    });
  } catch (error: any) {
    console.error('Razorpay Webhook processing error:', error);
    return NextResponse.json({ error: error.message || 'Webhook internal error' }, { status: 500 });
  }
}
