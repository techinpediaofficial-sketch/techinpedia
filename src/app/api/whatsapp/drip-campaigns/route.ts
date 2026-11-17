import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const isTenant = session.isTenant;
    const requestedCompanyId = searchParams.get('companyId');
    const companyId = isTenant && session.companyId ? session.companyId : requestedCompanyId || undefined;

    const where: any = {};
    if (companyId && companyId !== 'master') {
      where.companyId = companyId;
    }

    const campaigns = await db.dripCampaign.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, campaigns });
  } catch (error: any) {
    console.error('Fetch drip campaigns error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch drip campaigns.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const {
      name,
      description,
      triggerType = 'CONTACT_ADDED', // 'CONTACT_ADDED' | 'LEAD_CREATED' | 'TAG_ADDED' | 'MANUAL' | 'SEGMENT_ENTERED'
      triggerConfig = {},
      steps = [],
      exitConditions = [],
      status = 'DRAFT',
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Campaign name is required.' }, { status: 400 });
    }

    const isTenant = session.isTenant;
    const companyId = isTenant && session.companyId ? session.companyId : body.companyId || null;

    const campaign = await db.dripCampaign.create({
      data: {
        name: name.trim(),
        description: description || null,
        triggerType,
        triggerConfig: typeof triggerConfig === 'object' ? JSON.stringify(triggerConfig) : triggerConfig,
        stepsJson: typeof steps === 'object' ? JSON.stringify(steps) : steps || '[]',
        exitConditionsJson: typeof exitConditions === 'object' ? JSON.stringify(exitConditions) : exitConditions || '[]',
        status,
        companyId,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_DRIP_CAMPAIGN',
      entityType: 'DripCampaign',
      entityId: campaign.id,
      metadata: { name: campaign.name, stepsCount: Array.isArray(steps) ? steps.length : 0, companyId },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    console.error('Create drip campaign error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create drip campaign.' }, { status: 500 });
  }
}
