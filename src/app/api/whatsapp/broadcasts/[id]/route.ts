import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { enqueueJob } from '@/lib/queue/jobQueue';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const campaign = await db.whatsappCampaign.findUnique({
      where: { id },
      include: {
        recipients: {
          take: 100,
          orderBy: { lastAttemptAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Broadcast campaign not found.' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && campaign.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant broadcast access denied' }, { status: 403 });
    }

    const template = await db.whatsappTemplate.findUnique({
      where: { id: campaign.templateId },
      select: { id: true, name: true, category: true, status: true, bodyText: true },
    });

    // Counts by recipient status
    const statusCounts = await db.whatsappCampaignRecipient.groupBy({
      by: ['status'],
      where: { campaignId: id },
      _count: { _all: true },
    });

    const statusMap: Record<string, number> = {};
    for (const item of statusCounts) {
      statusMap[item.status] = item._count._all;
    }

    const sent = statusMap['SENT'] || campaign.sentCount || 0;
    const delivered = statusMap['DELIVERED'] || campaign.deliveredCount || 0;
    const read = statusMap['READ'] || campaign.readCount || 0;
    const failed = statusMap['FAILED'] || campaign.failedCount || 0;
    const queued = statusMap['QUEUED'] || statusMap['PENDING'] || 0;
    const replies = campaign.replyCount || 0;

    const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
    const readRate = delivered > 0 ? Math.round((read / delivered) * 100) : 0;
    const replyRate = delivered > 0 ? Math.round((replies / delivered) * 100) : 0;

    return NextResponse.json({
      success: true,
      campaign: {
        ...campaign,
        template,
        metrics: {
          totalAudience: campaign.totalAudience,
          validCount: campaign.validCount,
          suppressedCount: campaign.suppressedCount,
          queued,
          sent,
          delivered,
          read,
          failed,
          replies,
          deliveryRate,
          readRate,
          replyRate,
        },
      },
    });
  } catch (error: any) {
    console.error('Fetch campaign detail error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch campaign detail.' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const body = await request.json();
    const { action } = body; // 'LAUNCH' | 'PAUSE' | 'CANCEL' | 'CLONE'

    const campaign = await db.whatsappCampaign.findUnique({
      where: { id },
      include: { recipients: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Broadcast campaign not found.' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && campaign.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant broadcast modification denied' }, { status: 403 });
    }

    if (action === 'LAUNCH') {
      await db.whatsappCampaign.update({
        where: { id },
        data: { status: 'PROCESSING', startedAt: new Date() },
      });

      await enqueueJob(
        'whatsapp-campaign',
        `campaign:${campaign.id}`,
        { campaignId: campaign.id },
        { priority: 10 }
      );

      await logActivity({
        userId: session.userId,
        userEmail: session.email,
        action: 'LAUNCH_BROADCAST',
        entityType: 'WhatsappCampaign',
        entityId: id,
        metadata: { name: campaign.name },
      });

      return NextResponse.json({ success: true, message: 'Broadcast campaign launched.' });
    }

    if (action === 'PAUSE') {
      await db.whatsappCampaign.update({
        where: { id },
        data: { status: 'PAUSED' },
      });

      return NextResponse.json({ success: true, message: 'Broadcast campaign paused.' });
    }

    if (action === 'CANCEL') {
      await db.whatsappCampaign.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      return NextResponse.json({ success: true, message: 'Broadcast campaign cancelled.' });
    }

    if (action === 'CLONE') {
      const cloned = await db.whatsappCampaign.create({
        data: {
          companyId: campaign.companyId,
          name: `${campaign.name} (Copy)`,
          description: campaign.description,
          type: campaign.type,
          status: 'DRAFT',
          templateId: campaign.templateId,
          variableMapping: campaign.variableMapping,
          audienceSource: campaign.audienceSource,
          audienceFilter: campaign.audienceFilter,
          totalAudience: campaign.totalAudience,
          validCount: campaign.validCount,
          suppressedCount: campaign.suppressedCount,
          createdById: session.userId,
        },
      });

      return NextResponse.json({ success: true, campaign: cloned });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Campaign action error:', error);
    return NextResponse.json({ error: error.message || 'Failed to perform campaign action.' }, { status: 500 });
  }
}
