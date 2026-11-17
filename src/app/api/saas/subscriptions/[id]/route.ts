import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { status, renewalDate, price, autoRenew } = body;

    const sub = await db.saaSSubscription.findUnique({ where: { id } });
    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const updated = await db.saaSSubscription.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(renewalDate && { renewalDate: new Date(renewalDate) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(autoRenew !== undefined && { autoRenew }),
      },
      include: {
        customer: true,
        product: true,
        plan: true,
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'UPDATE',
      entityType: 'SAAS_SUBSCRIPTION',
      entityId: id,
      details: `Updated subscription status to ${status || sub.status}`,
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json({ error: 'Failed to update subscription.' }, { status: 500 });
  }
}
