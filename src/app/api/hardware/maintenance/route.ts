import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assetId = searchParams.get('assetId');

    const where: any = {};
    if (status) where.status = status;
    if (assetId) where.assetId = assetId;

    const records = await db.assetMaintenance.findMany({
      where,
      orderBy: { loggedAt: 'desc' },
      include: {
        asset: true,
      },
    });

    const activeRepairs = records.filter(r => r.status === 'IN_PROGRESS' || r.status === 'REPORTED');
    const totalRepairCost = records.reduce((acc, r) => acc + r.cost, 0);

    return NextResponse.json({
      success: true,
      records,
      metrics: {
        total: records.length,
        active: activeRepairs.length,
        totalRepairCost,
      },
    });
  } catch (error) {
    console.error('Fetch maintenance logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance logs.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { assetId, issue, technician, cost = 0 } = body;

    if (!assetId || !issue) {
      return NextResponse.json({ error: 'Asset and issue description are required.' }, { status: 400 });
    }

    const record = await db.$transaction(async (tx) => {
      const rec = await tx.assetMaintenance.create({
        data: {
          assetId,
          issue,
          technician,
          cost: parseFloat(cost) || 0,
          status: 'IN_PROGRESS',
        },
      });

      // Mark asset status as MAINTENANCE
      await tx.rentalAsset.update({
        where: { id: assetId },
        data: { status: 'MAINTENANCE' },
      });

      return rec;
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'ASSET_MAINTENANCE',
      entityId: record.id,
      details: `Logged maintenance for asset ID ${assetId}: ${issue}`,
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Create maintenance log error:', error);
    return NextResponse.json({ error: 'Failed to create maintenance log.' }, { status: 500 });
  }
}
