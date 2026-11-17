import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { DEFAULT_INTENTS } from '@/lib/ai/intent-engine';
import { resolveEffectiveCompanyId, getAvailableCompaniesForAdmin } from '@/lib/access-policy';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.intents.manage') && !hasPermission(session, 'ai.brain.view') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to view intents' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = await resolveEffectiveCompanyId(session, searchParams.get('companyId'));

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    const [tenantIntents, availableCompanies] = await Promise.all([
      db.aiIntent.findMany({
        where: { companyId },
        orderBy: { priority: 'desc' },
      }),
      getAvailableCompaniesForAdmin(session),
    ]);

    return NextResponse.json({
      success: true,
      companyId,
      availableCompanies,
      customIntents: tenantIntents,
      defaultIntents: DEFAULT_INTENTS,
    });
  } catch (error: any) {
    console.error('Error fetching intents:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.intents.manage') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to manage intents' }, { status: 403 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const companyId = await resolveEffectiveCompanyId(session, body.companyId || searchParams.get('companyId'));

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    const name = body.name?.trim().toLowerCase().replace(/\s+/g, '_');
    if (!name) {
      return NextResponse.json({ error: 'Intent name is required' }, { status: 400 });
    }

    const description = body.description?.trim() || null;
    const exampleUtterances = Array.isArray(body.exampleUtterances) ? body.exampleUtterances : [];
    const priority = parseInt(body.priority || '5');
    const actionType = body.actionType || 'AI_RESPONSE';
    const actionPayload = body.actionPayload ? JSON.stringify(body.actionPayload) : null;
    const isEnabled = body.isEnabled !== undefined ? Boolean(body.isEnabled) : true;

    const intent = await db.aiIntent.create({
      data: {
        companyId,
        name,
        description,
        exampleUtterancesJson: JSON.stringify(exampleUtterances),
        priority,
        actionType,
        actionPayloadJson: actionPayload,
        isEnabled,
      },
    });

    return NextResponse.json({
      success: true,
      intent,
    });
  } catch (error: any) {
    console.error('Error creating intent:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
