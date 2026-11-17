import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const productId = searchParams.get('productId');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (status) where.status = status;
    if (productId) where.productId = productId;
    if (customerId) where.customerId = customerId;

    if (search.trim()) {
      where.OR = [
        { customer: { name: { contains: search } } },
        { customer: { company: { name: { contains: search } } } },
        { product: { name: { contains: search } } },
      ];
    }

    const subscriptions = await db.saaSSubscription.findMany({
      where,
      orderBy: { renewalDate: 'asc' },
      include: {
        customer: { select: { id: true, name: true, company: { select: { name: true } }, email: true } },
        product: { select: { id: true, name: true, code: true } },
        plan: { select: { id: true, name: true, billingCycle: true } },
      },
    });

    const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE');
    const mrr = activeSubs.reduce((acc, s) => acc + s.price, 0);

    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const renewalsDue = activeSubs.filter(s => new Date(s.renewalDate) <= thirtyDaysAhead && new Date(s.renewalDate) >= now).length;

    return NextResponse.json({
      success: true,
      subscriptions,
      metrics: {
        total: subscriptions.length,
        active: activeSubs.length,
        mrr,
        renewalsDue,
      },
    });
  } catch (error) {
    console.error('Fetch subscriptions error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { customerId, productId, planId, startDate, renewalDate, price, autoRenew = true, status = 'ACTIVE' } = body;

    if (!customerId || !productId || !planId || price === undefined) {
      return NextResponse.json({ error: 'Customer, product, plan, and price are required.' }, { status: 400 });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const renewal = renewalDate ? new Date(renewalDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await db.saaSSubscription.create({
      data: {
        customerId,
        productId,
        planId,
        startDate: start,
        renewalDate: renewal,
        price: parseFloat(price),
        autoRenew,
        status,
      },
      include: {
        customer: true,
        product: true,
        plan: true,
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'SAAS_SUBSCRIPTION',
      entityId: subscription.id,
      details: `Created SaaS subscription for ${subscription.customer.name} to ${subscription.product.name} (₹${subscription.price})`,
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json({ error: 'Failed to create subscription.' }, { status: 500 });
  }
}
