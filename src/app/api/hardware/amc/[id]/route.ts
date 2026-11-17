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
    const { status, renewalDate, contractValue, engineerName, notes } = body;

    const contract = await db.aMCContract.findUnique({ where: { id } });
    if (!contract) {
      return NextResponse.json({ error: 'AMC contract not found' }, { status: 404 });
    }

    const updated = await db.aMCContract.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(renewalDate && { renewalDate: new Date(renewalDate) }),
        ...(contractValue !== undefined && { contractValue: parseFloat(contractValue) }),
        ...(engineerName !== undefined && { engineerName }),
        ...(notes !== undefined && { notes }),
      },
      include: { customer: true },
    });

    await logActivity({
      userId: session.userId,
      action: 'UPDATE',
      entityType: 'AMC_CONTRACT',
      entityId: id,
      details: `Updated AMC contract ${contract.amcNumber} status to ${status || contract.status}`,
    });

    return NextResponse.json({ success: true, contract: updated });
  } catch (error) {
    console.error('Update AMC contract error:', error);
    return NextResponse.json({ error: 'Failed to update AMC contract.' }, { status: 500 });
  }
}
