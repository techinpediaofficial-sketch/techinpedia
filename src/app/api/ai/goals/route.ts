import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { resolveEffectiveCompanyId, getAvailableCompaniesForAdmin } from '@/lib/access-policy';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.brain.view') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = await resolveEffectiveCompanyId(session, searchParams.get('companyId'));

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    const [goals, availableCompanies] = await Promise.all([
      db.aiGoal.findMany({
        where: { companyId },
        orderBy: { priority: 'desc' },
      }),
      getAvailableCompaniesForAdmin(session),
    ]);

    return NextResponse.json({
      success: true,
      companyId,
      availableCompanies,
      goals,
    });
  } catch (error: any) {
    console.error('Error fetching AI goals:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.brain.manage') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to manage AI goals' }, { status: 403 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const companyId = await resolveEffectiveCompanyId(session, body.companyId || searchParams.get('companyId'));

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    const goal = await db.aiGoal.create({
      data: {
        companyId,
        goalKey: body.goalKey || 'CUSTOM_GOAL',
        name: body.name?.trim() || 'New Goal',
        description: body.description?.trim() || null,
        priority: parseInt(body.priority || '5'),
        successCriteriaJson: body.successCriteria ? JSON.stringify(body.successCriteria) : null,
        allowedActionsJson: body.allowedActions ? JSON.stringify(body.allowedActions) : null,
        handoffBehavior: body.handoffBehavior || 'CONTINUE',
        isEnabled: body.isEnabled !== undefined ? Boolean(body.isEnabled) : true,
      },
    });

    return NextResponse.json({
      success: true,
      goal,
    });
  } catch (error: any) {
    console.error('Error creating AI goal:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
