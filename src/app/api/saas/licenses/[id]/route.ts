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
    const { status, domain, activationLimit, expiresAt } = body;

    const license = await db.softwareLicense.findUnique({ where: { id } });
    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    const updated = await db.softwareLicense.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(domain !== undefined && { domain }),
        ...(activationLimit !== undefined && { activationLimit: parseInt(activationLimit) }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
      include: { product: true },
    });

    await logActivity({
      userId: session.userId,
      action: 'UPDATE',
      entityType: 'SOFTWARE_LICENSE',
      entityId: id,
      details: `Updated license ${license.licenseKey} status to ${status || license.status}`,
    });

    return NextResponse.json({ success: true, license: updated });
  } catch (error) {
    console.error('Update license error:', error);
    return NextResponse.json({ error: 'Failed to update license.' }, { status: 500 });
  }
}
