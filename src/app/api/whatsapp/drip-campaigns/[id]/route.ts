import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const campaign = await db.dripCampaign.findUnique({
      where: { id },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Drip campaign not found.' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && campaign.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant drip campaign access denied' }, { status: 403 });
    }

    let parsedSteps: any[] = [];
    let parsedExitConditions: any[] = [];
    try {
      parsedSteps = JSON.parse(campaign.stepsJson);
    } catch {}
    try {
      parsedExitConditions = campaign.exitConditionsJson ? JSON.parse(campaign.exitConditionsJson) : [];
    } catch {}

    return NextResponse.json({
      success: true,
      campaign: {
        ...campaign,
        steps: parsedSteps,
        exitConditions: parsedExitConditions,
      },
    });
  } catch (error: any) {
    console.error('Fetch drip campaign error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch drip campaign.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const body = await request.json();

    const existing = await db.dripCampaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Drip campaign not found.' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant drip modification denied' }, { status: 403 });
    }

    const { name, description, status, triggerType, triggerConfig, steps, exitConditions } = body;
    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (description !== undefined) dataToUpdate.description = description;
    if (status !== undefined) dataToUpdate.status = status;
    if (triggerType !== undefined) dataToUpdate.triggerType = triggerType;
    if (triggerConfig !== undefined) {
      dataToUpdate.triggerConfig = typeof triggerConfig === 'object' ? JSON.stringify(triggerConfig) : triggerConfig;
    }
    if (steps !== undefined) {
      dataToUpdate.stepsJson = typeof steps === 'object' ? JSON.stringify(steps) : steps;
    }
    if (exitConditions !== undefined) {
      dataToUpdate.exitConditionsJson = typeof exitConditions === 'object' ? JSON.stringify(exitConditions) : exitConditions;
    }

    const updated = await db.dripCampaign.update({
      where: { id },
      data: dataToUpdate,
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_DRIP_CAMPAIGN',
      entityType: 'DripCampaign',
      entityId: id,
      metadata: { fieldsUpdated: Object.keys(dataToUpdate) },
    });

    return NextResponse.json({ success: true, campaign: updated });
  } catch (error: any) {
    console.error('Update drip campaign error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update drip campaign.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const existing = await db.dripCampaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Drip campaign not found.' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant drip deletion denied' }, { status: 403 });
    }

    await db.dripCampaign.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'DELETE_DRIP_CAMPAIGN',
      entityType: 'DripCampaign',
      entityId: id,
      metadata: { name: existing.name },
    });

    return NextResponse.json({ success: true, message: 'Drip campaign deleted.' });
  } catch (error: any) {
    console.error('Delete drip campaign error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete drip campaign.' }, { status: 500 });
  }
}
