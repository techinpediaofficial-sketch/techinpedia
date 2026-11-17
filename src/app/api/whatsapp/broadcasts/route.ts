import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { normalizePhoneNumber } from '@/lib/whatsapp-eligibility';
import { getMatchingContactsForSegment } from '@/lib/segments';
import { enqueueJob } from '@/lib/queue/jobQueue';

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

    const campaigns = await db.whatsappCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Enrich with rates
    const enriched = campaigns.map((camp) => {
      const sent = camp.sentCount || 0;
      const delivered = camp.deliveredCount || 0;
      const read = camp.readCount || 0;
      const replies = camp.replyCount || 0;

      const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
      const readRate = delivered > 0 ? Math.round((read / delivered) * 100) : 0;
      const replyRate = delivered > 0 ? Math.round((replies / delivered) * 100) : 0;

      return {
        ...camp,
        deliveryRate,
        readRate,
        replyRate,
      };
    });

    return NextResponse.json({ success: true, campaigns: enriched });
  } catch (error: any) {
    console.error('Fetch broadcasts error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch broadcasts.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const {
      action = 'CREATE_AND_LAUNCH', // 'AUDIENCE_PREVIEW' | 'CREATE_DRAFT' | 'SCHEDULE' | 'CREATE_AND_LAUNCH'
      name,
      description,
      templateId,
      variableMapping = {},
      audienceSource = 'ALL_CONTACTS', // 'ALL_CONTACTS' | 'SMART_SEGMENT' | 'STATIC_LIST' | 'SELECTED_CONTACTS'
      segmentId,
      listId,
      selectedContactIds = [],
      scheduledAt,
    } = body;

    const isTenant = session.isTenant;
    const companyId = isTenant && session.companyId ? session.companyId : body.companyId || null;

    // 1. Resolve raw audience based on source
    let rawContacts: any[] = [];

    if (audienceSource === 'SMART_SEGMENT' && segmentId) {
      const segment = await db.contactSegment.findUnique({ where: { id: segmentId } });
      if (segment) {
        rawContacts = await getMatchingContactsForSegment(companyId, segment.rulesJson);
      }
    } else if (audienceSource === 'STATIC_LIST' && listId) {
      const members = await db.contactListMember.findMany({
        where: { listId },
        include: { contact: true },
      });
      rawContacts = members.map((m) => m.contact);
    } else if (audienceSource === 'SELECTED_CONTACTS' && Array.isArray(selectedContactIds)) {
      rawContacts = await db.contact.findMany({
        where: {
          id: { in: selectedContactIds },
          ...(companyId ? { companyId } : {}),
        },
      });
    } else {
      // Default: ALL_CONTACTS
      rawContacts = await db.contact.findMany({
        where: {
          ...(companyId ? { companyId } : {}),
        },
        take: 2000,
      });
    }

    // 2. Filter audience: Check phone validity, blacklist/suppression, and marketing consent
    const eligible: any[] = [];
    const excluded: Array<{ contact: any; reason: string }> = [];

    // Fetch tenant suppressions
    const suppressions = await db.whatsappSuppression.findMany({
      where: {
        OR: [
          { companyId },
          { companyId: null },
        ],
        status: { in: ['OPTED_OUT', 'BOUNCED'] },
      },
      select: { phone: true },
    });
    const suppressedSet = new Set(
      suppressions.map((s) => s.phone.replace(/[^0-9]/g, '').slice(-10))
    );

    for (const c of rawContacts) {
      if (!c.phone) {
        excluded.push({ contact: c, reason: 'Missing phone number' });
        continue;
      }

      const canonical = normalizePhoneNumber(c.phone);
      if (canonical.length < 8) {
        excluded.push({ contact: c, reason: 'Invalid phone format' });
        continue;
      }

      const last10 = canonical.slice(-10);
      if (suppressedSet.has(last10) || c.isBlacklisted) {
        excluded.push({ contact: c, reason: 'Blacklisted / Suppressed' });
        continue;
      }

      if (c.optInStatus === 'OPTED_OUT' || c.marketingOptIn === false) {
        excluded.push({ contact: c, reason: 'Marketing Opted-Out' });
        continue;
      }

      eligible.push({
        ...c,
        canonicalPhone: canonical,
      });
    }

    // A. Audience Preview Response
    if (action === 'AUDIENCE_PREVIEW') {
      return NextResponse.json({
        success: true,
        totalSelected: rawContacts.length,
        eligibleCount: eligible.length,
        excludedCount: excluded.length,
        sampleEligible: eligible.slice(0, 5),
        sampleExcluded: excluded.slice(0, 5),
      });
    }

    // B. Create Campaign
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Campaign name is required.' }, { status: 400 });
    }
    if (!templateId) {
      return NextResponse.json({ error: 'Approved WhatsApp template is required.' }, { status: 400 });
    }

    const template = await db.whatsappTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      return NextResponse.json({ error: 'WhatsApp template not found.' }, { status: 404 });
    }
    if (template.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Template "${template.name}" is not approved (Status: ${template.status}). Only APPROVED templates can be broadcasted.` },
        { status: 400 }
      );
    }

    let initialStatus = 'DRAFT';
    if (action === 'CREATE_AND_LAUNCH') initialStatus = 'PROCESSING';
    else if (action === 'SCHEDULE') initialStatus = 'SCHEDULED';

    const campaign = await db.whatsappCampaign.create({
      data: {
        companyId,
        name: name.trim(),
        description: description || null,
        type: 'MARKETING',
        status: initialStatus,
        templateId: template.id,
        variableMapping: JSON.stringify(variableMapping),
        audienceSource,
        audienceFilter: JSON.stringify({ segmentId, listId, count: eligible.length }),
        totalAudience: rawContacts.length,
        validCount: eligible.length,
        suppressedCount: excluded.length,
        scheduledAt: action === 'SCHEDULE' && scheduledAt ? new Date(scheduledAt) : null,
        startedAt: action === 'CREATE_AND_LAUNCH' ? new Date() : null,
        createdById: session.userId,
      },
    });

    // Create Recipient Records
    const recipients = await Promise.all(
      eligible.map((rec) =>
        db.whatsappCampaignRecipient.create({
          data: {
            campaignId: campaign.id,
            phone: rec.canonicalPhone,
            contactId: rec.id,
            status: 'QUEUED',
          },
        })
      )
    );

    // If launching now, enqueue campaign job
    if (action === 'CREATE_AND_LAUNCH') {
      await enqueueJob(
        'whatsapp-campaign',
        `campaign:${campaign.id}`,
        { campaignId: campaign.id },
        { priority: 10 }
      );
    }

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: action === 'CREATE_AND_LAUNCH' ? 'LAUNCH_BROADCAST' : 'CREATE_BROADCAST',
      entityType: 'WhatsappCampaign',
      entityId: campaign.id,
      metadata: { name: campaign.name, total: rawContacts.length, eligible: eligible.length, companyId },
    });

    return NextResponse.json({
      success: true,
      campaign: {
        ...campaign,
        recipientsCount: recipients.length,
      },
    });
  } catch (error: any) {
    console.error('Broadcast create error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create broadcast campaign.' }, { status: 500 });
  }
}
