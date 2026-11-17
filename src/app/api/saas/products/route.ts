import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET() {
  try {
    await requireAuth();

    const products = await db.saaSProduct.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        plans: true,
        subscriptions: {
          select: { id: true, status: true, price: true },
        },
        licenses: {
          select: { id: true, status: true },
        },
      },
    });

    const activeSubscriptions = products.flatMap(p => p.subscriptions).filter(s => s.status === 'ACTIVE');
    const mrr = activeSubscriptions.reduce((acc, s) => acc + s.price, 0);

    return NextResponse.json({
      success: true,
      products,
      metrics: {
        totalProducts: products.length,
        activeSubscriptions: activeSubscriptions.length,
        totalMrr: mrr,
      },
    });
  } catch (error) {
    console.error('Fetch SaaS products error:', error);
    return NextResponse.json({ error: 'Failed to fetch SaaS products.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { action, code, name, description, productId, planName, billingCycle = 'MONTHLY', price, features } = body;

    // Action 1: Add Plan to an existing product
    if (action === 'ADD_PLAN') {
      if (!productId || !planName || price === undefined) {
        return NextResponse.json({ error: 'Product ID, plan name, and price are required.' }, { status: 400 });
      }

      const plan = await db.saaSPlan.create({
        data: {
          productId,
          name: planName,
          billingCycle,
          price: parseFloat(price),
          features: typeof features === 'string' ? features : JSON.stringify(features || []),
        },
      });

      return NextResponse.json({ success: true, plan });
    }

    // Action 2: Create New SaaS Product
    if (!code || !name) {
      return NextResponse.json({ error: 'Product code and name are required.' }, { status: 400 });
    }

    const product = await db.saaSProduct.create({
      data: {
        code: code.toUpperCase().trim(),
        name,
        description,
        status: 'ACTIVE',
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'SAAS_PRODUCT',
      entityId: product.id,
      details: `Created SaaS product ${product.name} (${product.code})`,
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Create SaaS product error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Product code must be unique.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create SaaS product.' }, { status: 500 });
  }
}
