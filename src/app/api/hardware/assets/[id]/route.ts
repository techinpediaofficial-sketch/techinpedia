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
    const { status, location, notes, specs, purchaseCost } = body;

    const asset = await db.rentalAsset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const updated = await db.rentalAsset.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(location && { location }),
        ...(notes !== undefined && { notes }),
        ...(specs && { specs }),
        ...(purchaseCost !== undefined && { purchaseCost: parseFloat(purchaseCost) || 0 }),
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'UPDATE',
      entityType: 'RENTAL_ASSET',
      entityId: id,
      details: `Updated asset ${asset.assetCode} status to ${status || asset.status}`,
    });

    return NextResponse.json({ success: true, asset: updated });
  } catch (error) {
    console.error('Update asset error:', error);
    return NextResponse.json({ error: 'Failed to update asset.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const asset = await db.rentalAsset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Check if currently rented
    if (asset.status === 'RENTED') {
      return NextResponse.json({ error: 'Cannot delete an asset that is currently rented.' }, { status: 400 });
    }

    await db.rentalAsset.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      action: 'DELETE',
      entityType: 'RENTAL_ASSET',
      entityId: id,
      details: `Deleted asset ${asset.assetCode}`,
    });

    return NextResponse.json({ success: true, message: 'Asset deleted successfully.' });
  } catch (error) {
    console.error('Delete asset error:', error);
    return NextResponse.json({ error: 'Failed to delete asset.' }, { status: 500 });
  }
}
