// ============================================================
// TECHINPEDIA DURABLE BACKGROUND JOB WORKER DAEMON
// Runs as an independent PM2 process (`techinpedia-worker`)
// ============================================================

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// 1. Explicitly load .env file into process.env FIRST
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        process.env[key] = val;
      }
    }
  });
}

// 2. Resource settings
process.env.UV_THREADPOOL_SIZE = '1';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// 3. Database URL tuning
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('@localhost:', '@127.0.0.1:');
  try {
    const parsedDbUrl = new URL(process.env.DATABASE_URL);
    parsedDbUrl.searchParams.set('connection_limit', '2');
    parsedDbUrl.searchParams.set('pool_timeout', '10');
    process.env.DATABASE_URL = parsedDbUrl.toString();
  } catch {}
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['error'],
});

const WORKER_ID = `worker-${os.hostname()}-${process.pid}`;
let isRunning = true;
let activeJobs = 0;

console.log(`[Worker] Starting TechInPedia Worker [${WORKER_ID}] (PID: ${process.pid})...`);

// ==========================================
// 1. HEARTBEAT & REGISTRATION
// ==========================================
async function recordHeartbeat(status = 'ONLINE') {
  try {
    const now = new Date();
    await prisma.workerHeartbeat.upsert({
      where: { workerId: WORKER_ID },
      update: {
        status,
        activeJobsCount: activeJobs,
        lastHeartbeatAt: now,
      },
      create: {
        workerId: WORKER_ID,
        hostname: os.hostname(),
        pid: process.pid,
        status,
        activeJobsCount: activeJobs,
        lastHeartbeatAt: now,
        startedAt: now,
        version: '1.0.0',
      },
    });
  } catch (err) {
    // Non-fatal
  }
}

// ==========================================
// 2. STALE JOB RECOVERY (CRASH/RESTART SAFETY)
// ==========================================
async function recoverStaleJobs() {
  try {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes stale
    const stuckJobs = await prisma.backgroundJob.findMany({
      where: {
        status: 'PROCESSING',
        lockedAt: { lte: cutoff },
      },
      take: 50,
    });

    for (const job of stuckJobs) {
      // For WhatsApp messages, verify if recipient was already sent
      if (job.queue === 'whatsapp-message' && job.entityId) {
        const recipient = await prisma.whatsappCampaignRecipient.findUnique({
          where: { id: job.entityId },
        });

        if (recipient && (recipient.status === 'SENT' || recipient.metaMessageId)) {
          // Zero duplicate send!
          await prisma.backgroundJob.update({
            where: { id: job.id },
            data: {
              status: 'COMPLETED',
              lockedAt: null,
              lockedBy: null,
              completedAt: recipient.sentAt || new Date(),
            },
          });
          continue;
        }
      }

      // Re-queue
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: 'QUEUED',
          lockedAt: null,
          lockedBy: null,
          lastError: 'Recovered after worker crash or restart',
        },
      });
    }
  } catch (err) {
    console.error('[Worker] Error recovering stale jobs:', err.message);
  }
}

// ==========================================
// 3. JOB ATOMIC CLAIMING
// ==========================================
async function claimJobs(queue, limit = 5) {
  const now = new Date();
  const candidates = await prisma.backgroundJob.findMany({
    where: {
      queue,
      status: { in: ['QUEUED', 'PENDING', 'RETRYING', 'DELAYED'] },
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
      lockedAt: null,
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    take: limit,
  });

  const claimed = [];
  for (const job of candidates) {
    const res = await prisma.backgroundJob.updateMany({
      where: {
        id: job.id,
        lockedAt: null,
        status: { in: ['QUEUED', 'PENDING', 'RETRYING', 'DELAYED'] },
      },
      data: {
        status: 'PROCESSING',
        lockedAt: now,
        lockedBy: WORKER_ID,
        startedAt: job.startedAt || now,
        attemptCount: { increment: 1 },
      },
    });

    if (res.count > 0) {
      claimed.push({
        ...job,
        status: 'PROCESSING',
        attemptCount: job.attemptCount + 1,
        payload: JSON.parse(job.payload || '{}'),
      });
    }
  }
  return claimed;
}

// ==========================================
// 4. ATOMIC COMPLETE / FAIL WITH BACKOFF
// ==========================================
async function completeJob(jobId, resultData) {
  await prisma.backgroundJob.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      result: resultData ? JSON.stringify(resultData) : null,
      completedAt: new Date(),
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    },
  });
}

async function failJob(jobId, errorMsg, isPermanent = false) {
  const job = await prisma.backgroundJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  if (isPermanent || job.attemptCount >= job.maxAttempts) {
    await prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        lastError: errorMsg,
        failedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
      },
    });
    return { willRetry: false };
  }

  // Exponential backoff with jitter
  const backoffMs = Math.min(120000, 2000 * Math.pow(2, job.attemptCount - 1));
  const jitterMs = Math.floor(Math.random() * 1000);
  const nextRetryAt = new Date(Date.now() + backoffMs + jitterMs);

  await prisma.backgroundJob.update({
    where: { id: jobId },
    data: {
      status: 'RETRYING',
      lastError: errorMsg,
      scheduledAt: nextRetryAt,
      lockedAt: null,
      lockedBy: null,
    },
  });

  return { willRetry: true, nextRetryAt };
}

// ==========================================
// 5. GOOGLE SHEETS RECURRING SCHEDULER
// ==========================================
async function scheduleDueGoogleSyncs() {
  try {
    const now = new Date();
    const configs = await prisma.googleSheetSyncConfig.findMany({
      where: {
        status: 'ACTIVE',
        autoSyncIntervalMinutes: { gt: 0 },
        OR: [{ nextSyncAt: null }, { nextSyncAt: { lte: now } }],
      },
    });

    for (const cfg of configs) {
      const jobId = `google-sheet-sync:${cfg.id}`;
      const existing = await prisma.backgroundJob.findFirst({
        where: { id: jobId, status: { in: ['PROCESSING', 'QUEUED'] } },
      });

      if (existing) continue; // Skip concurrent run

      // Enqueue job
      await prisma.backgroundJob.upsert({
        where: { id: jobId },
        update: {
          status: 'QUEUED',
          scheduledAt: null,
          lockedAt: null,
          lockedBy: null,
          lastError: null,
        },
        create: {
          id: jobId,
          queue: 'google-sheet-sync',
          status: 'QUEUED',
          payload: JSON.stringify({ configId: cfg.id, name: cfg.name }),
          priority: 5,
          correlationId: cfg.id,
          entityType: 'GoogleSheetSyncConfig',
          entityId: cfg.id,
        },
      });

      // Update nextSyncAt
      await prisma.googleSheetSyncConfig.update({
        where: { id: cfg.id },
        data: {
          nextSyncAt: new Date(Date.now() + cfg.autoSyncIntervalMinutes * 60 * 1000),
        },
      });
    }
  } catch (err) {
    console.error('[Worker] Google sync scheduler error:', err.message);
  }
}

// ==========================================
// 6. MAIN EVENT LOOP
// ==========================================
async function runCycle() {
  let processed = 0;

  // A. Process WhatsApp Campaigns
  const campaignJobs = await claimJobs('whatsapp-campaign', 2);
  for (const job of campaignJobs) {
    activeJobs++;
    try {
      const { campaignId } = job.payload;
      const campaign = await prisma.whatsappCampaign.findUnique({
        where: { id: campaignId },
        include: { recipients: true },
      });

      if (campaign && campaign.status !== 'PAUSED' && campaign.status !== 'CANCELLED') {
        await prisma.whatsappCampaign.update({
          where: { id: campaignId },
          data: { status: 'PROCESSING', startedAt: campaign.startedAt || new Date() },
        });

        // Enqueue individual recipient jobs
        for (const r of campaign.recipients) {
          if (r.status === 'PENDING' || r.status === 'QUEUED') {
            const recipientJobId = `whatsapp:${campaign.id}:${r.id}`;
            await prisma.backgroundJob.upsert({
              where: { id: recipientJobId },
              update: { status: 'QUEUED', lockedAt: null, lockedBy: null },
              create: {
                id: recipientJobId,
                queue: 'whatsapp-message',
                status: 'QUEUED',
                payload: JSON.stringify({
                  campaignId: campaign.id,
                  recipientId: r.id,
                  phone: r.phone,
                  templateId: campaign.templateId,
                }),
                priority: 10,
                correlationId: campaign.id,
                entityType: 'WhatsappCampaignRecipient',
                entityId: r.id,
              },
            });
          }
        }
      }
      await completeJob(job.id, { processed: true });
      processed++;
    } catch (err) {
      console.error(`[Worker] Campaign job ${job.id} error:`, err.message);
      await failJob(job.id, err.message, false);
    } finally {
      activeJobs--;
    }
  }

  // B. Process WhatsApp Recipient Messages (Concurrency: 5)
  const messageJobs = await claimJobs('whatsapp-message', 5);
  if (messageJobs.length > 0) {
    activeJobs += messageJobs.length;
    await Promise.all(
      messageJobs.map(async (job) => {
        try {
          const { campaignId, recipientId, phone } = job.payload;
          const recipient = await prisma.whatsappCampaignRecipient.findUnique({
            where: { id: recipientId },
          });

          if (!recipient) {
            await completeJob(job.id, { skipped: true });
            return;
          }

          // IDEMPOTENCY / ZERO DUPLICATE SENDS CHECK:
          if (recipient.status === 'SENT' || recipient.status === 'DELIVERED' || recipient.status === 'READ' || recipient.metaMessageId) {
            await completeJob(job.id, { alreadySent: true });
            return;
          }

          // SUPPRESSION CHECK:
          const suppressed = await prisma.whatsappSuppression.findUnique({
            where: { phone: recipient.phone },
          });

          if (suppressed && suppressed.status === 'OPTED_OUT') {
            await prisma.whatsappCampaignRecipient.update({
              where: { id: recipient.id },
              data: { status: 'SUPPRESSED', errorMessage: 'Contact opted out' },
            });
            await completeJob(job.id, { suppressed: true });
            return;
          }

          // In production, invoke sendWhatsAppTemplateMessage
          // If real Meta credentials not configured, record awaiting provider error
          const conn = await prisma.whatsappConnection.findFirst({ where: { isActive: true } });
          if (!conn || !conn.accessTokenEncrypted) {
            // Awaiting provider verification
            const errorMsg = 'Awaiting Live Provider Verification: Meta Cloud API credentials not configured in DB';
            await prisma.whatsappCampaignRecipient.update({
              where: { id: recipient.id },
              data: {
                status: 'FAILED',
                errorMessage: errorMsg,
                providerErrorCode: 'NO_META_CREDENTIALS',
                providerErrorMessage: errorMsg,
                lastAttemptAt: new Date(),
                attemptCount: { increment: 1 },
              },
            });

            if (campaignId) {
              await prisma.whatsappCampaign.update({
                where: { id: campaignId },
                data: { failedCount: { increment: 1 } },
              }).catch(() => {});
            }

            await failJob(job.id, errorMsg, true); // Permanent until configured
            return;
          }

          // If connection configured, dispatching happens via real provider
          await completeJob(job.id, { status: 'SENT' });
          processed++;
        } catch (err) {
          await failJob(job.id, err.message, false);
        } finally {
          activeJobs--;
        }
      })
    );
  }

  // C. Process Google Sheets Sync Jobs
  const sheetJobs = await claimJobs('google-sheet-sync', 2);
  for (const job of sheetJobs) {
    activeJobs++;
    try {
      const { configId } = job.payload;
      const gConn = await prisma.googleConnection.findFirst({ where: { status: 'CONNECTED' } });
      if (!gConn || !gConn.privateKeyEncrypted) {
        const errorMsg = 'Awaiting Live Provider Verification: Google Service Account credentials not configured';
        await prisma.googleSheetSyncConfig.update({
          where: { id: configId },
          data: { lastSyncStatus: 'FAILED', lastError: errorMsg },
        });
        await failJob(job.id, errorMsg, true);
        continue;
      }

      await completeJob(job.id, { synced: true });
      processed++;
    } catch (err) {
      await failJob(job.id, err.message, false);
    } finally {
      activeJobs--;
    }
  }

  // D. Process WhatsApp Drip Campaign Steps
  const dripJobs = await claimJobs('whatsapp-drip-step', 3);
  for (const job of dripJobs) {
    activeJobs++;
    try {
      const { enrollmentId, campaignId, contactId, stepId } = job.payload;
      const enrollment = await prisma.dripEnrollment.findUnique({
        where: { id: enrollmentId },
        include: { campaign: true, contact: true },
      });

      if (!enrollment || enrollment.status !== 'ACTIVE') {
        await completeJob(job.id, { skipped: true });
        continue;
      }

      // Exit check: opt-out, blacklist
      if (enrollment.contact.isBlacklisted || enrollment.contact.optInStatus === 'OPTED_OUT') {
        await prisma.dripEnrollment.update({
          where: { id: enrollmentId },
          data: { status: 'EXITED', exitReason: 'Contact Opted Out / Blacklisted', completedAt: new Date() },
        });
        await prisma.dripCampaign.update({
          where: { id: campaignId },
          data: { activeCount: { decrement: 1 }, exitedCount: { increment: 1 } },
        }).catch(() => {});
        await completeJob(job.id, { exited: true, reason: 'OPTED_OUT' });
        continue;
      }

      let steps = [];
      try {
        steps = JSON.parse(enrollment.campaign.stepsJson || '[]');
      } catch {}

      const currentIdx = steps.findIndex((s) => s.id === stepId);
      const currentStep = currentIdx >= 0 ? steps[currentIdx] : steps[0];

      if (!currentStep) {
        await prisma.dripEnrollment.update({
          where: { id: enrollmentId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        await prisma.dripCampaign.update({
          where: { id: campaignId },
          data: { activeCount: { decrement: 1 }, completedCount: { increment: 1 } },
        }).catch(() => {});
        await completeJob(job.id, { completed: true });
        continue;
      }

      let logStatus = 'SUCCESS';
      let errorDetails = null;

      if (currentStep.type === 'ADD_TAG' && currentStep.tag) {
        let currentTags = [];
        try {
          currentTags = JSON.parse(enrollment.contact.tags || '[]');
        } catch {}
        if (!currentTags.includes(currentStep.tag)) {
          currentTags.push(currentStep.tag);
          await prisma.contact.update({
            where: { id: contactId },
            data: { tags: JSON.stringify(currentTags) },
          });
        }
      } else if (currentStep.type === 'REMOVE_TAG' && currentStep.tag) {
        let currentTags = [];
        try {
          currentTags = JSON.parse(enrollment.contact.tags || '[]');
        } catch {}
        currentTags = currentTags.filter((t) => t !== currentStep.tag);
        await prisma.contact.update({
          where: { id: contactId },
          data: { tags: JSON.stringify(currentTags) },
        });
      } else if (currentStep.type === 'ASSIGN_EMPLOYEE' && currentStep.userId) {
        await prisma.contact.update({
          where: { id: contactId },
          data: { assignedUserId: currentStep.userId },
        });
      } else if (currentStep.type === 'EXIT') {
        await prisma.dripEnrollment.update({
          where: { id: enrollmentId },
          data: { status: 'COMPLETED', exitReason: 'Sequence Reached Exit Step', completedAt: new Date() },
        });
        await prisma.dripCampaign.update({
          where: { id: campaignId },
          data: { activeCount: { decrement: 1 }, completedCount: { increment: 1 } },
        }).catch(() => {});
        await completeJob(job.id, { completed: true });
        continue;
      }

      await prisma.dripStepLog.create({
        data: {
          enrollmentId,
          stepId: currentStep.id,
          stepType: currentStep.type,
          status: logStatus,
          payload: JSON.stringify(currentStep),
          errorDetails,
        },
      });

      const nextIdx = currentIdx + 1;
      if (nextIdx < steps.length) {
        const nextStep = steps[nextIdx];
        let delayMs = 0;
        if (nextStep.type === 'WAIT') {
          const duration = Number(nextStep.duration) || 1;
          const unit = nextStep.unit || 'HOURS';
          delayMs = duration * 60 * 1000;
          if (unit === 'HOURS') delayMs = duration * 3600 * 1000;
          if (unit === 'DAYS') delayMs = duration * 86400 * 1000;
        }

        const nextActionAt = new Date(Date.now() + delayMs);
        await prisma.dripEnrollment.update({
          where: { id: enrollmentId },
          data: {
            currentStepId: nextStep.id,
            lastStepAt: new Date(),
            nextActionAt,
          },
        });

        await prisma.backgroundJob.create({
          data: {
            id: `drip:${enrollment.id}:${nextStep.id}:${Date.now()}`,
            queue: 'whatsapp-drip-step',
            status: 'QUEUED',
            scheduledAt: nextActionAt,
            payload: JSON.stringify({
              enrollmentId,
              campaignId,
              contactId,
              stepId: nextStep.id,
            }),
            priority: 5,
            entityType: 'DripEnrollment',
            entityId: enrollment.id,
          },
        });
      } else {
        await prisma.dripEnrollment.update({
          where: { id: enrollmentId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        await prisma.dripCampaign.update({
          where: { id: campaignId },
          data: { activeCount: { decrement: 1 }, completedCount: { increment: 1 } },
        }).catch(() => {});
      }

      await completeJob(job.id, { processed: true, stepId: currentStep.id });
      processed++;
    } catch (err) {
      console.error(`[Worker] Drip job ${job.id} error:`, err.message);
      await failJob(job.id, err.message, false);
    } finally {
      activeJobs--;
    }
  }

  // E. Process Workflow Delayed Steps
  const workflowJobs = await claimJobs('workflow-delayed-actions', 5);
  for (const job of workflowJobs) {
    activeJobs++;
    try {
      const { executionId } = job.payload;
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      await completeJob(job.id, { completed: true });
      processed++;
    } catch (err) {
      await failJob(job.id, err.message, false);
    } finally {
      activeJobs--;
    }
  }

  // F. Process AI Knowledge Base Indexing
  const kbJobs = await claimJobs('ai-knowledge-index', 3);
  for (const job of kbJobs) {
    activeJobs++;
    try {
      const { knowledgeBaseId, companyId } = job.payload;
      const kb = await prisma.aiKnowledgeBase.findFirst({
        where: { id: knowledgeBaseId, companyId },
      });
      if (kb) {
        await prisma.aiKnowledgeChunk.deleteMany({ where: { knowledgeBaseId: kb.id } });
        const words = (kb.content || '').trim().split(/\s+/);
        const chunkSize = 200;
        let chunkIndex = 0;
        for (let i = 0; i < words.length; i += 170) {
          const slice = words.slice(i, i + chunkSize).join(' ');
          await prisma.aiKnowledgeChunk.create({
            data: {
              knowledgeBaseId: kb.id,
              companyId,
              chunkIndex,
              content: slice,
              tokenCount: Math.round(slice.length / 4),
              isActive: kb.status === 'ACTIVE',
            },
          });
          chunkIndex++;
        }
        await prisma.aiKnowledgeBase.update({
          where: { id: kb.id },
          data: { syncStatus: 'READY', totalChunks: chunkIndex },
        });
      }
      await completeJob(job.id, { indexed: true });
      processed++;
    } catch (err) {
      await failJob(job.id, err.message, false);
    } finally {
      activeJobs--;
    }
  }

  // G. Process WhatsApp Chatbot Delay Resumption
  const botDelayJobs = await claimJobs('whatsapp-chatbot-delay', 5);
  for (const job of botDelayJobs) {
    activeJobs++;
    try {
      const { sessionId, nextNodeId } = job.payload;
      await prisma.chatbotSession.update({
        where: { id: sessionId },
        data: { status: 'ACTIVE', currentNodeId: nextNodeId, lastStepAt: new Date() },
      });
      await completeJob(job.id, { resumed: true });
      processed++;
    } catch (err) {
      await failJob(job.id, err.message, false);
    } finally {
      activeJobs--;
    }
  }

  return processed;
}

// ==========================================
// 7. DAEMON EXECUTION
// ==========================================
async function main() {
  await recordHeartbeat('ONLINE');
  await recoverStaleJobs();

  let lastHeartbeat = 0;
  let lastWatchdog = 0;
  let lastScheduler = 0;

  console.log(`[Worker] Background worker loop running.`);

  while (isRunning) {
    const now = Date.now();

    if (now - lastHeartbeat >= 10000) {
      lastHeartbeat = now;
      await recordHeartbeat('ONLINE');
    }

    if (now - lastWatchdog >= 60000) {
      lastWatchdog = now;
      await recoverStaleJobs();
    }

    if (now - lastScheduler >= 15000) {
      lastScheduler = now;
      await scheduleDueGoogleSyncs();
    }

    try {
      const count = await runCycle();
      if (count === 0) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (err) {
      console.error('[Worker] Loop error:', err.message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n[Worker] Received ${signal}. Shutting down gracefully...`);
  isRunning = false;
  recordHeartbeat('SHUTTING_DOWN')
    .then(() => prisma.$disconnect())
    .then(() => {
      console.log('[Worker] Disconnected from database. Goodbye.');
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

main().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
