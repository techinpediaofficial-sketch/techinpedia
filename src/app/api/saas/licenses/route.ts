import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import crypto from 'crypto';

function generateLicenseKey(prefix = 'TIP'): string {
  const segment1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const segment2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const segment3 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const segment4 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${segment1}-${segment2}-${segment3}-${segment4}`;
}

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const productId = searchParams.get('productId');
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (status) where.status = status;
    if (productId) where.productId = productId;
    if (search.trim()) {
      where.OR = [
        { licenseKey: { contains: search } },
        { domain: { contains: search } },
        { product: { name: { contains: search } } },
      ];
    }

    const licenses = await db.softwareLicense.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, code: true } },
      },
    });

    const activeLicenses = licenses.filter(l => l.status === 'ACTIVE').length;
    const suspendedLicenses = licenses.filter(l => l.status === 'SUSPENDED').length;

    return NextResponse.json({
      success: true,
      licenses,
      metrics: {
        total: licenses.length,
        active: activeLicenses,
        suspended: suspendedLicenses,
      },
    });
  } catch (error) {
    console.error('Fetch licenses error:', error);
    return NextResponse.json({ error: 'Failed to fetch licenses.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { productId, customerId, domain, activationLimit = 1, expiresAt } = body;

    if (!productId) {
      return NextResponse.json({ error: 'SaaS Product ID is required.' }, { status: 400 });
    }

    const product = await db.saaSProduct.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const licenseKey = generateLicenseKey(product.code || 'TIP');

    const license = await db.softwareLicense.create({
      data: {
        licenseKey,
        productId,
        customerId: customerId || null,
        domain: domain || null,
        activationLimit: parseInt(activationLimit) || 1,
        status: 'ACTIVE',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        product: true,
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'SOFTWARE_LICENSE',
      entityId: license.id,
      details: `Generated license key for ${product.name} (${license.licenseKey})`,
    });

    return NextResponse.json({ success: true, license });
  } catch (error) {
    console.error('Create license error:', error);
    return NextResponse.json({ error: 'Failed to create license.' }, { status: 500 });
  }
}
