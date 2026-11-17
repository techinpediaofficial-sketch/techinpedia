import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.intents.manage') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to modify intents' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await db.aiIntent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Intent not found' }, { status: 404 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim().toLowerCase().replace(/\s+/g, '_');
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.exampleUtterances !== undefined) {
      updateData.exampleUtterancesJson = JSON.stringify(body.exampleUtterances);
    }
    if (body.priority !== undefined) updateData.priority = parseInt(body.priority);
    if (body.actionType !== undefined) updateData.actionType = body.actionType;
    if (body.actionPayload !== undefined) updateData.actionPayloadJson = JSON.stringify(body.actionPayload);
    if (body.isEnabled !== undefined) updateData.isEnabled = Boolean(body.isEnabled);

    const updated = await db.aiIntent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      intent: updated,
    });
  } catch (error: any) {
    console.error('Error updating intent:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.intents.manage') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to delete intents' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await db.aiIntent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Intent not found' }, { status: 404 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.aiIntent.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Intent deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting intent:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
