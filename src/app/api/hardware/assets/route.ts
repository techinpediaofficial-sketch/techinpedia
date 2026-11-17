import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assetType = searchParams.get('assetType');
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (status) where.status = status;
    if (assetType) where.assetType = assetType;
    if (search.trim()) {
      where.OR = [
        { assetCode: { contains: search } },
        { serialNumber: { contains: search } },
        { brand: { contains: search } },
        { model: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const assets = await db.rentalAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          where: { returnedAt: null },
          include: {
            rentalOrder: {
              include: { customer: { select: { id: true, name: true, company: { select: { name: true } } } } },
            },
          },
        },
      },
    });

    const totalCount = assets.length;
    const availableCount = assets.filter(a => a.status === 'AVAILABLE').length;
    const rentedCount = assets.filter(a => a.status === 'RENTED').length;
    const maintenanceCount = assets.filter(a => a.status === 'MAINTENANCE').length;

    return NextResponse.json({
      success: true,
      assets,
      metrics: {
        total: totalCount,
        available: availableCount,
        rented: rentedCount,
        maintenance: maintenanceCount,
      },
    });
  } catch (error) {
    console.error('Fetch assets error:', error);
    return NextResponse.json({ error: 'Failed to fetch assets.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const {
      assetCode,
      serialNumber,
      assetType,
      brand,
      model,
      specs,
      purchaseCost = 0,
      purchaseDate,
      status = 'AVAILABLE',
      location = 'Main Warehouse, Delhi NCR',
      notes,
    } = body;

    if (!serialNumber || !assetType || !brand || !model) {
      return NextResponse.json({ error: 'Serial number, asset type, brand, and model are required.' }, { status: 400 });
    }

    // Generate assetCode if not given: TIP-[TYPE]-[4-digits]
    let finalAssetCode = assetCode;
    if (!finalAssetCode) {
      const count = await db.rentalAsset.count({ where: { assetType } });
      const prefix = assetType.slice(0, 3).toUpperCase();
      finalAssetCode = `TIP-${prefix}-${String(count + 1).padStart(4, '0')}`;
    }

    const asset = await db.rentalAsset.create({
      data: {
        assetCode: finalAssetCode,
        serialNumber,
        assetType,
        brand,
        model,
        specs: specs || `${brand} ${model}`,
        purchaseCost: parseFloat(purchaseCost) || 0,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        status,
        location,
        notes,
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'RENTAL_ASSET',
      entityId: asset.id,
      details: `Added rental asset ${asset.assetCode} (${brand} ${model} - ${serialNumber})`,
    });

    return NextResponse.json({ success: true, asset });
  } catch (error: any) {
    console.error('Create asset error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Asset code or serial number already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create asset.' }, { status: 500 });
  }
}
