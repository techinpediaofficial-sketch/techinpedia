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
    const { isActive, url, event } = body;

    const sub = await db.webhookSubscription.findUnique({ where: { id } });
    if (!sub) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const updated = await db.webhookSubscription.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(url && { url }),
        ...(event && { event }),
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'UPDATE',
      entityType: 'WEBHOOK_SUBSCRIPTION',
      entityId: id,
      details: `Updated webhook ${id} status to ${isActive !== undefined ? isActive : 'modified'}`,
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error) {
    console.error('Update webhook error:', error);
    return NextResponse.json({ error: 'Failed to update webhook.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const sub = await db.webhookSubscription.findUnique({ where: { id } });
    if (!sub) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    await db.webhookSubscription.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      action: 'DELETE',
      entityType: 'WEBHOOK_SUBSCRIPTION',
      entityId: id,
      details: `Deleted webhook ${sub.url}`,
    });

    return NextResponse.json({ success: true, message: 'Webhook deleted.' });
  } catch (error) {
    console.error('Delete webhook error:', error);
    return NextResponse.json({ error: 'Failed to delete webhook.' }, { status: 500 });
  }
}
