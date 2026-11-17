import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (!hasPermission(session, 'whatsapp.campaigns.view') && !hasPermission(session, 'whatsapp.view'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const campaign = await db.whatsappCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const recipients = await db.whatsappCampaignRecipient.findMany({
      where: { campaignId: id },
      take: 200,
    });

    const template = await db.whatsappTemplate.findUnique({
      where: { id: campaign.templateId },
    });

    // Compute delivery and read rates
    const total = campaign.validCount || 1;
    const deliveryRate = ((campaign.deliveredCount / total) * 100).toFixed(1);
    const readRate = ((campaign.readCount / total) * 100).toFixed(1);
    const failureRate = ((campaign.failedCount / total) * 100).toFixed(1);

    return NextResponse.json({
      campaign: {
        ...campaign,
        templateName: template?.name,
        rates: {
          deliveryRate: `${deliveryRate}%`,
          readRate: `${readRate}%`,
          failureRate: `${failureRate}%`,
        },
      },
      recipients,
    });
  } catch (error: any) {
    console.error('Campaign detail GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch campaign details' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (!hasPermission(session, 'whatsapp.campaigns.create') && !hasPermission(session, 'whatsapp.view'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, scheduledAt } = body;

    const campaign = await db.whatsappCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const { enqueueJob } = await import('@/lib/queue/jobQueue');

    if (action === 'PAUSE') {
      await db.whatsappCampaign.update({
        where: { id },
        data: { status: 'PAUSED' },
      });
      return NextResponse.json({ success: true, status: 'PAUSED' });
    }

    if (action === 'RESUME') {
      await db.whatsappCampaign.update({
        where: { id },
        data: { status: 'PROCESSING' },
      });
      // Re-trigger campaign orchestrator job
      await enqueueJob(
        'whatsapp-campaign',
        `whatsapp:campaign:${campaign.id}`,
        { campaignId: campaign.id },
        { priority: 10 }
      );
      return NextResponse.json({ success: true, status: 'PROCESSING' });
    }

    if (action === 'RESCHEDULE' && scheduledAt) {
      const newDate = new Date(scheduledAt);
      await db.whatsappCampaign.update({
        where: { id },
        data: { status: 'SCHEDULED', scheduledAt: newDate },
      });

      // Update background job scheduledAt
      await db.backgroundJob.updateMany({
        where: { correlationId: id, status: { in: ['QUEUED', 'DELAYED', 'PENDING'] } },
        data: { scheduledAt: newDate, status: 'DELAYED' },
      });

      return NextResponse.json({ success: true, status: 'SCHEDULED', scheduledAt: newDate });
    }

    if (action === 'CANCEL') {
      await db.whatsappCampaign.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Cancel background jobs
      await db.backgroundJob.updateMany({
        where: { correlationId: id, status: { in: ['QUEUED', 'DELAYED', 'PENDING'] } },
        data: { status: 'CANCELLED' },
      });

      return NextResponse.json({ success: true, status: 'CANCELLED' });
    }

    if (action === 'RETRY_FAILED') {
      const failedRecipients = await db.whatsappCampaignRecipient.findMany({
        where: { campaignId: id, status: 'FAILED' },
      });

      let retriedCount = 0;
      for (const r of failedRecipients) {
        await db.whatsappCampaignRecipient.update({
          where: { id: r.id },
          data: { status: 'QUEUED', errorMessage: null, errorCode: null },
        });

        await enqueueJob(
          'whatsapp-message',
          `whatsapp:${id}:${r.id}`,
          { campaignId: id, recipientId: r.id, phone: r.phone, templateId: campaign.templateId },
          { priority: 8, correlationId: id, entityType: 'WhatsappCampaignRecipient', entityId: r.id }
        );
        retriedCount++;
      }

      await db.whatsappCampaign.update({
        where: { id },
        data: { status: 'PROCESSING' },
      });

      return NextResponse.json({ success: true, retriedCount });
    }

    return NextResponse.json({ error: 'Unsupported campaign action' }, { status: 400 });
  } catch (error: any) {
    console.error('Campaign detail PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update campaign' }, { status: 500 });
  }
}

