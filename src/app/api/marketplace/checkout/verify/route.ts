import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRazorpayPaymentSignature } from '@/lib/razorpay';
import { recordLeadTimelineEvent } from '@/lib/crm';
import { VENDOR_PACKS } from '../create-order/route';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      packId,
      vendorId = 'Apex Aircon Systems',
    } = body;

    const pack = VENDOR_PACKS[packId];
    if (!pack) {
      return NextResponse.json({ error: 'Invalid pack selected' }, { status: 400 });
    }

    // Verify signature
    const isValid = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Payment signature verification failed. Untrusted payment.' },
        { status: 400 }
      );
    }

    // Find vendor registration record or admin user for logging
    const adminUser = await db.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true, email: true },
    });

    const vendorEnquiry = await db.enquiry.findFirst({
      where: {
        OR: [
          { company: { contains: vendorId } },
          { name: { contains: vendorId } },
          { projectType: 'VENDOR_ONBOARDING' },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (vendorEnquiry && adminUser) {
      // Record purchase in EnquiryNote
      await db.enquiryNote.create({
        data: {
          enquiryId: vendorEnquiry.id,
          userId: adminUser.id,
          note: `[URBAN_CREDIT_PURCHASE] Vendor purchased ${pack.name} (+${pack.credits} credits). Razorpay Order: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}, Amount: ₹${pack.total} (incl GST).`,
        },
      });

      // Record CRM timeline event
      await recordLeadTimelineEvent({
        enquiryId: vendorEnquiry.id,
        type: 'PAYMENT_RECEIVED',
        title: `Lead Credits Purchased (${pack.name})`,
        description: `Successfully collected ₹${pack.total} via Razorpay. +${pack.credits} lead credits credited to wallet.`,
        metadata: {
          packId,
          credits: pack.credits,
          amount: pack.total,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          purchasedAt: new Date().toISOString(),
        },
        actorEmail: adminUser.email,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Payment verified! ${pack.credits} lead credits have been added to your wallet.`,
      addedCredits: pack.credits,
      packName: pack.name,
      paymentId: razorpay_payment_id,
      invoiceRef: `INV-URB-${Date.now().toString().slice(-6)}`,
    });
  } catch (error: any) {
    console.error('Marketplace checkout verify error:', error);
    return NextResponse.json(
      { error: error?.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
