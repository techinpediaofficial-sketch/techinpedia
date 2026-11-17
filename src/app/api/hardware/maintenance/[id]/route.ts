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
    const { status, repairAction, cost, technician } = body;

    const maintenance = await db.assetMaintenance.findUnique({ where: { id } });
    if (!maintenance) {
      return NextResponse.json({ error: 'Maintenance record not found' }, { status: 404 });
    }

    const updated = await db.$transaction(async (tx) => {
      const isResolving = status === 'RESOLVED' && maintenance.status !== 'RESOLVED';
      const isScrapped = status === 'SCRAPPED';

      const rec = await tx.assetMaintenance.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(repairAction && { repairAction }),
          ...(cost !== undefined && { cost: parseFloat(cost) }),
          ...(technician !== undefined && { technician }),
          ...(isResolving && { resolvedAt: new Date() }),
        },
      });

      if (isResolving) {
        await tx.rentalAsset.update({
          where: { id: maintenance.assetId },
          data: { status: 'AVAILABLE' },
        });
      } else if (isScrapped) {
        await tx.rentalAsset.update({
          where: { id: maintenance.assetId },
          data: { status: 'RETIRED' },
        });
      }

      return rec;
    });

    await logActivity({
      userId: session.userId,
      action: 'UPDATE',
      entityType: 'ASSET_MAINTENANCE',
      entityId: id,
      details: `Updated maintenance record for asset ID ${maintenance.assetId} status to ${status || maintenance.status}`,
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (error) {
    console.error('Update maintenance record error:', error);
    return NextResponse.json({ error: 'Failed to update maintenance record.' }, { status: 500 });
  }
}
