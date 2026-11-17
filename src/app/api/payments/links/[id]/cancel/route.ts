import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { cancelRazorpayPaymentLink } from '@/lib/razorpay';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const link = await db.paymentLink.findUnique({
      where: { id },
    });

    if (!link) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 });
    }

    if (link.status === 'PAID') {
      return NextResponse.json({ error: 'Cannot cancel a link that has already been paid.' }, { status: 400 });
    }

    if (link.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Link is already cancelled.' }, { status: 400 });
    }

    // Call Razorpay cancellation API
    try {
      await cancelRazorpayPaymentLink(link.providerLinkId);
    } catch (err: any) {
      console.warn('Razorpay cancel warning:', err.message);
    }

    // Update database status
    const updated = await db.paymentLink.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      paymentLink: updated,
    });
  } catch (error: any) {
    console.error('Cancel payment link error:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel payment link' }, { status: 500 });
  }
}
