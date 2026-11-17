/**
 * WhatsApp Campaign & Message Queue Worker Handler
 * 
 * Executes individual recipient messages with strict idempotency, rate limiting,
 * transient error backoff (429/timeouts), permanent failure detection, and campaign metric tracking.
 */

import { db } from '../../db';
import { completeJob, failJob, enqueueJob, JobRecord } from '../jobQueue';
import { sendWhatsAppTemplateMessage } from '../../whatsapp_service';
import { isPhoneSuppressed } from '../../whatsapp_suppression';

// Checks if an error is a permanent provider error (should NOT be retried)
export function isPermanentWhatsAppError(error: any): boolean {
  const msg = (error?.message || String(error)).toLowerCase();
  const code = error?.code || error?.statusCode || 0;

  if (code === 400 || code === 401 || code === 403 || code === 404) return true;
  if (msg.includes('invalid recipient') || msg.includes('not a valid whatsapp number')) return true;
  if (msg.includes('template') && (msg.includes('not found') || msg.includes('not approved') || msg.includes('paused'))) return true;
  if (msg.includes('permission') || msg.includes('oauth') || msg.includes('token expired')) return true;

  return false;
}

/**
 * Handles a whatsapp-campaign orchestrator job.
 */
export async function handleWhatsAppCampaignJob(job: JobRecord): Promise<void> {
  const { campaignId } = job.payload;
  if (!campaignId) {
    await completeJob(job.id, { skipped: true, reason: 'No campaignId provided' });
    return;
  }

  const campaign = await db.whatsappCampaign.findUnique({
    where: { id: campaignId },
    include: { recipients: true },
  });

  if (!campaign) {
    await completeJob(job.id, { skipped: true, reason: 'Campaign not found' });
    return;
  }

  // If paused or cancelled, stop processing
  if (campaign.status === 'PAUSED' || campaign.status === 'CANCELLED') {
    await completeJob(job.id, { status: campaign.status });
    return;
  }

  // Update campaign to PROCESSING
  await db.whatsappCampaign.update({
    where: { id: campaignId },
    data: { status: 'PROCESSING', startedAt: campaign.startedAt || new Date() },
  });

  // Enqueue individual recipient jobs with deterministic IDs
  for (const r of campaign.recipients) {
    if (r.status === 'PENDING' || r.status === 'QUEUED') {
      const recipientJobId = `whatsapp:${campaign.id}:${r.id}`;
      await enqueueJob(
        'whatsapp-message',
        recipientJobId,
        {
          campaignId: campaign.id,
          recipientId: r.id,
          phone: r.phone,
          templateId: campaign.templateId,
        },
        {
          correlationId: campaign.id,
          entityType: 'WhatsappCampaignRecipient',
          entityId: r.id,
          priority: 10,
        }
      );

      await db.whatsappCampaignRecipient.update({
        where: { id: r.id },
        data: { status: 'QUEUED' },
      });
    }
  }

  await completeJob(job.id, { recipientsEnqueued: campaign.recipients.length });
}

/**
 * Handles an individual whatsapp-message recipient dispatch job.
 */
export async function handleWhatsAppRecipientJob(job: JobRecord): Promise<void> {
  const { campaignId, recipientId, phone, templateId } = job.payload;

  const recipient = await db.whatsappCampaignRecipient.findUnique({
    where: { id: recipientId },
    include: { campaign: true },
  });

  if (!recipient) {
    await completeJob(job.id, { skipped: true, reason: 'Recipient not found' });
    return;
  }

  // 1. CRASH RECOVERY / IDEMPOTENCY CHECK:
  // If recipient is already marked SENT or has a providerMessageId, NEVER duplicate send
  if (recipient.status === 'SENT' || recipient.status === 'DELIVERED' || recipient.status === 'READ' || recipient.metaMessageId) {
    await completeJob(job.id, {
      skipped: true,
      alreadySent: true,
      providerMessageId: recipient.metaMessageId || recipient.providerMessageId,
    });
    return;
  }

  // 2. SUPPRESSION / OPT-OUT CHECK:
  const suppressed = await isPhoneSuppressed(recipient.phone);
  if (suppressed) {
    await db.whatsappCampaignRecipient.update({
      where: { id: recipient.id },
      data: {
        status: 'SUPPRESSED',
        errorMessage: 'Contact is opted-out or suppressed.',
      },
    });

    if (campaignId) {
      await db.whatsappCampaign.update({
        where: { id: campaignId },
        data: { suppressedCount: { increment: 1 } },
      }).catch(() => {});
    }

    await completeJob(job.id, { skipped: true, reason: 'Suppressed phone number' });
    return;
  }

  // 3. FETCH TEMPLATE
  const template = await db.whatsappTemplate.findUnique({
    where: { id: templateId || recipient.campaign?.templateId },
  });

  if (!template) {
    const errorMsg = 'WhatsApp Template not found';
    await db.whatsappCampaignRecipient.update({
      where: { id: recipient.id },
      data: { status: 'FAILED', errorMessage: errorMsg, providerErrorCode: 'TEMPLATE_NOT_FOUND' },
    });
    await failJob(job.id, errorMsg, true);
    return;
  }

  // 4. PREPARE TEMPLATE VARIABLES
  const params: string[] = [];
  params.push('Valued Customer'); // dynamic interpolation fallback

  // Mark recipient as PROCESSING
  await db.whatsappCampaignRecipient.update({
    where: { id: recipient.id },
    data: {
      status: 'PROCESSING',
      attemptCount: { increment: 1 },
      lastAttemptAt: new Date(),
    },
  });

  // 5. DISPATCH VIA OFFICIAL META CLOUD API
  try {
    const res = await sendWhatsAppTemplateMessage(
      recipient.phone,
      template.name,
      template.language || 'en_US',
      params,
      undefined,
      { campaignId: campaignId || undefined, companyId: recipient.campaign?.companyId || null }
    );

    if (res.success && res.messageId) {
      // SUCCESS
      await db.whatsappCampaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: 'SENT',
          metaMessageId: res.messageId,
          providerMessageId: res.messageId,
          sentAt: new Date(),
          errorMessage: null,
          errorCode: null,
        },
      });

      if (campaignId) {
        await db.whatsappCampaign.update({
          where: { id: campaignId },
          data: { sentCount: { increment: 1 } },
        }).catch(() => {});
      }

      await completeJob(job.id, { messageId: res.messageId, status: 'SENT' });
    } else {
      // PROVIDER RETURNED ERROR
      const errorMsg = res.error || 'Failed to dispatch WhatsApp template';
      const isPermanent = isPermanentWhatsAppError({ message: errorMsg, code: res.data?.error?.code });

      const failResult = await failJob(job.id, errorMsg, isPermanent);

      await db.whatsappCampaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: failResult.willRetry ? 'RETRYING' : 'FAILED',
          errorMessage: errorMsg,
          providerErrorCode: res.data?.error?.code ? String(res.data.error.code) : 'PROVIDER_ERROR',
          providerErrorMessage: errorMsg,
          nextRetryAt: failResult.nextRetryAt,
        },
      });

      if (!failResult.willRetry && campaignId) {
        await db.whatsappCampaign.update({
          where: { id: campaignId },
          data: { failedCount: { increment: 1 } },
        }).catch(() => {});
      }
    }
  } catch (err: any) {
    const isPermanent = isPermanentWhatsAppError(err);
    const failResult = await failJob(job.id, err.message || 'Network exception', isPermanent);

    await db.whatsappCampaignRecipient.update({
      where: { id: recipient.id },
      data: {
        status: failResult.willRetry ? 'RETRYING' : 'FAILED',
        errorMessage: err.message,
        providerErrorMessage: err.message,
        nextRetryAt: failResult.nextRetryAt,
      },
    });

    if (!failResult.willRetry && campaignId) {
      await db.whatsappCampaign.update({
        where: { id: campaignId },
        data: { failedCount: { increment: 1 } },
      }).catch(() => {});
    }
  }

  // 6. CHECK IF CAMPAIGN HAS FINISHED
  if (campaignId) {
    const remainingPending = await db.whatsappCampaignRecipient.count({
      where: {
        campaignId,
        status: { in: ['PENDING', 'QUEUED', 'PROCESSING', 'RETRYING'] },
      },
    });

    if (remainingPending === 0) {
      await db.whatsappCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      }).catch(() => {});
    }
  }
}
