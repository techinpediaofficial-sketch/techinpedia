import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { filterSuppressedAudience } from '@/lib/whatsapp_suppression';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp_service';
import { normalizePhone } from '@/lib/phone';

// 1. GET: List All Campaigns
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (!hasPermission(session, 'whatsapp.campaigns.view') && !hasPermission(session, 'whatsapp.view'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawCompanyId = searchParams.get('companyId');
    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (rawCompanyId && rawCompanyId !== 'master' && rawCompanyId !== 'ALL' ? rawCompanyId : null);

    const where: any = {};
    if (targetCompanyId !== 'ALL') where.companyId = targetCompanyId || null;

    const campaigns = await db.whatsappCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error('Campaigns GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch campaigns' }, { status: 500 });
  }
}

// 2. POST: Audience Preview, Campaign Creation, or Launch
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action = 'CREATE_AND_LAUNCH' } = body;

    // A. Audience Preview & Suppression Validation
    if (action === 'AUDIENCE_PREVIEW') {
      const { audienceSource = 'CRM_LEADS', filter = {} } = body;

      let rawAudience: Array<{ id: string; name: string; phone?: string | null; email?: string | null }> = [];

      if (audienceSource === 'CRM_LEADS') {
        const leads = await db.enquiry.findMany({
          take: 1000,
          select: { id: true, name: true, phone: true, email: true },
        });
        rawAudience = leads;
      } else if (audienceSource === 'CONTACTS') {
        const contacts = await db.contact.findMany({
          take: 1000,
          select: { id: true, name: true, phone: true, email: true },
        });
        rawAudience = contacts;
      } else if (audienceSource === 'CUSTOMERS') {
        const customers = await db.customer.findMany({
          take: 1000,
          select: { id: true, name: true, phone: true, email: true },
        });
        rawAudience = customers;
      }

      const { eligible, suppressed, invalid } = await filterSuppressedAudience(rawAudience);

      return NextResponse.json({
        totalSelected: rawAudience.length,
        validCount: eligible.length,
        suppressedCount: suppressed.length,
        invalidCount: invalid.length,
        sampleEligible: eligible.slice(0, 5),
        sampleSuppressed: suppressed.slice(0, 5),
      });
    }

    // B. Create & Launch / Schedule Campaign
    if (!hasPermission(session, 'whatsapp.campaigns.launch') && !hasPermission(session, 'whatsapp.campaigns.create')) {
      return NextResponse.json({ error: 'Forbidden: Missing campaign launch permissions' }, { status: 403 });
    }

    const {
      name,
      description,
      type = 'MARKETING',
      templateId,
      variableMapping = {},
      audienceSource = 'CRM_LEADS',
      scheduleType = 'NOW',
      scheduledAt,
    } = body;

    if (!name || !templateId) {
      return NextResponse.json({ error: 'Campaign name and approved template are required' }, { status: 400 });
    }

    // 1. Verify Template exists and is APPROVED
    const template = await db.whatsappTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Selected WhatsApp Template not found' }, { status: 404 });
    }

    if (template.status !== 'APPROVED') {
      return NextResponse.json({
        error: `Cannot launch campaign: Template "${template.name}" has status [${template.status}]. Only APPROVED Meta templates can be used.`,
      }, { status: 400 });
    }

    // 2. Fetch Audience
    let rawAudience: Array<{ id: string; name: string; phone?: string | null; email?: string | null }> = [];
    if (audienceSource === 'CRM_LEADS') {
      rawAudience = await db.enquiry.findMany({
        take: 500,
        select: { id: true, name: true, phone: true, email: true },
      });
    } else if (audienceSource === 'CONTACTS') {
      rawAudience = await db.contact.findMany({
        take: 500,
        select: { id: true, name: true, phone: true, email: true },
      });
    } else {
      rawAudience = await db.customer.findMany({
        take: 500,
        select: { id: true, name: true, phone: true, email: true },
      });
    }

    // 3. Filter Audience against Suppression List
    const { eligible, suppressed } = await filterSuppressedAudience(rawAudience);

    if (eligible.length === 0) {
      return NextResponse.json({ error: 'No eligible recipients found. All contacts were invalid or suppressed.' }, { status: 400 });
    }

    const url = new URL(request.url);
    const rawCompanyId = body.companyId || url.searchParams.get('companyId');
    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (rawCompanyId && rawCompanyId !== 'master' && rawCompanyId !== 'ALL' ? rawCompanyId : null);

    // 4. Create Campaign in DB
    const campaign = await db.whatsappCampaign.create({
      data: {
        companyId: targetCompanyId || null,
        name,
        description: description || null,
        type,
        status: scheduleType === 'NOW' ? 'PROCESSING' : 'SCHEDULED',
        templateId: template.id,
        variableMapping: JSON.stringify(variableMapping),
        audienceSource,
        totalAudience: rawAudience.length,
        validCount: eligible.length,
        suppressedCount: suppressed.length,
        scheduledAt: scheduleType === 'SCHEDULE' && scheduledAt ? new Date(scheduledAt) : null,
        startedAt: scheduleType === 'NOW' ? new Date() : null,
        createdById: session.userId,
      },
    });

    // 5. Create Recipient Records with initial QUEUED status
    const createdRecipients = await Promise.all(
      eligible.map((recipient) => {
        const norm = normalizePhone(recipient.phone);
        return db.whatsappCampaignRecipient.create({
          data: {
            campaignId: campaign.id,
            phone: norm.canonical,
            leadId: audienceSource === 'CRM_LEADS' ? recipient.id : null,
            contactId: audienceSource === 'CONTACTS' ? recipient.id : null,
            status: 'QUEUED',
          },
        });
      })
    );

    // 6. Enqueue into Durable Background Queue
    const { enqueueJob } = await import('@/lib/queue/jobQueue');
    const scheduledDate = scheduleType === 'SCHEDULE' && scheduledAt ? new Date(scheduledAt) : null;

    // Enqueue individual deterministic recipient jobs
    for (const r of createdRecipients) {
      await enqueueJob(
        'whatsapp-message',
        `whatsapp:${campaign.id}:${r.id}`,
        {
          campaignId: campaign.id,
          recipientId: r.id,
          phone: r.phone,
          templateId: campaign.templateId,
        },
        {
          scheduledAt: scheduledDate,
          priority: 5,
          correlationId: campaign.id,
          entityType: 'WhatsappCampaignRecipient',
          entityId: r.id,
        }
      );
    }

    // Enqueue Campaign orchestrator job
    await enqueueJob(
      'whatsapp-campaign',
      `whatsapp:campaign:${campaign.id}`,
      { campaignId: campaign.id },
      {
        scheduledAt: scheduledDate,
        priority: 10,
        correlationId: campaign.id,
        entityType: 'WhatsappCampaign',
        entityId: campaign.id,
      }
    );

    // 7. Log Activity
    await db.activityLog.create({
      data: {
        userId: session.userId,
        userEmail: session.email,
        action: 'WHATSAPP_CAMPAIGN_LAUNCHED',
        entityType: 'WhatsAppCampaign',
        entityId: campaign.id,
        metadata: JSON.stringify({ name, totalAudience: eligible.length }),
      },
    });

    return NextResponse.json({
      success: true,
      message: scheduleType === 'NOW' ? 'Campaign launched successfully into background queue.' : 'Campaign scheduled successfully.',
      campaign,
    });
  } catch (error: any) {
    console.error('Campaigns POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process campaign' }, { status: 500 });
  }
}
