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
    if (!hasPermission(session, 'ai.brain.manage') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to modify AI goals' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await db.aiGoal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.priority !== undefined) updateData.priority = parseInt(body.priority);
    if (body.successCriteria !== undefined) updateData.successCriteriaJson = JSON.stringify(body.successCriteria);
    if (body.allowedActions !== undefined) updateData.allowedActionsJson = JSON.stringify(body.allowedActions);
    if (body.handoffBehavior !== undefined) updateData.handoffBehavior = body.handoffBehavior;
    if (body.isEnabled !== undefined) updateData.isEnabled = Boolean(body.isEnabled);

    const updated = await db.aiGoal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      goal: updated,
    });
  } catch (error: any) {
    console.error('Error updating AI goal:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.brain.manage') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to delete AI goals' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await db.aiGoal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.aiGoal.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting AI goal:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
