/**
 * TechInPedia Dedicated Background Job Worker Daemon
 * 
 * Runs as an independent PM2 process (`techinpedia-worker`).
 * Processes WhatsApp campaigns, recipient messages, Google Sheet syncs,
 * workflow delayed steps, stale job recovery, and worker heartbeats.
 */

import os from 'os';
import { db } from './lib/db';
import {
  claimNextJobs,
  recoverStaleJobs,
  recordWorkerHeartbeat,
} from './lib/queue/jobQueue';
import {
  handleWhatsAppCampaignJob,
  handleWhatsAppRecipientJob,
} from './lib/queue/handlers/whatsappHandler';
import {
  handleGoogleSheetSyncJob,
  scheduleDueGoogleSheetSyncs,
} from './lib/queue/handlers/googleSheetsHandler';
import { handleWorkflowDelayedJob } from './lib/queue/handlers/workflowHandler';
import { processRecurringTasks } from './lib/queue/handlers/tasksHandler';

const WORKER_ID = `worker-${os.hostname()}-${process.pid}`;
let isRunning = true;
let activeJobs = 0;

console.log(`🚀 TechInPedia Background Worker starting [${WORKER_ID}] (PID: ${process.pid})...`);

// ==========================================
// GRACEFUL SHUTDOWN HANDLERS
// ==========================================
async function handleShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
  isRunning = false;

  try {
    await recordWorkerHeartbeat(WORKER_ID, os.hostname(), process.pid, activeJobs, 'SHUTTING_DOWN');

    // Wait up to 10 seconds for active jobs to complete
    let waitCount = 0;
    while (activeJobs > 0 && waitCount < 20) {
      console.log(`⏳ Waiting for ${activeJobs} in-flight jobs to finish...`);
      await new Promise((r) => setTimeout(r, 500));
      waitCount++;
    }

    await recordWorkerHeartbeat(WORKER_ID, os.hostname(), process.pid, 0, 'OFFLINE');
    await db.$disconnect();
    console.log(`✅ Worker [${WORKER_ID}] shut down cleanly.`);
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// ==========================================
// BACKGROUND WORKER TICK
// ==========================================
export async function runWorkerCycle(): Promise<{ jobsProcessed: number }> {
  let totalProcessed = 0;

  // 1. WhatsApp Campaigns (Orchestrator)
  const campaignJobs = await claimNextJobs('whatsapp-campaign', WORKER_ID, 2);
  for (const job of campaignJobs) {
    activeJobs++;
    try {
      await handleWhatsAppCampaignJob(job);
      totalProcessed++;
    } catch (err) {
      console.error(`Error processing campaign job ${job.id}:`, err);
    } finally {
      activeJobs--;
    }
  }

  // 2. WhatsApp Recipient Messages (Concurrent Batch: up to 5)
  const messageJobs = await claimNextJobs('whatsapp-message', WORKER_ID, 5);
  if (messageJobs.length > 0) {
    activeJobs += messageJobs.length;
    await Promise.all(
      messageJobs.map(async (job) => {
        try {
          await handleWhatsAppRecipientJob(job);
          totalProcessed++;
        } catch (err) {
          console.error(`Error processing recipient job ${job.id}:`, err);
        } finally {
          activeJobs--;
        }
      })
    );
  }

  // 3. Google Sheets Inbound Syncs
  const sheetJobs = await claimNextJobs('google-sheet-sync', WORKER_ID, 2);
  for (const job of sheetJobs) {
    activeJobs++;
    try {
      await handleGoogleSheetSyncJob(job);
      totalProcessed++;
    } catch (err) {
      console.error(`Error processing sheet sync job ${job.id}:`, err);
    } finally {
      activeJobs--;
    }
  }

  // 4. Workflow Delayed Actions
  const workflowJobs = await claimNextJobs('workflow-delayed-actions', WORKER_ID, 5);
  for (const job of workflowJobs) {
    activeJobs++;
    try {
      await handleWorkflowDelayedJob(job);
      totalProcessed++;
    } catch (err) {
      console.error(`Error processing workflow delayed job ${job.id}:`, err);
    } finally {
      activeJobs--;
    }
  }

  return { jobsProcessed: totalProcessed };
}

// ==========================================
// MAIN DAEMON LOOP
// ==========================================
async function startDaemon() {
  // Stale job recovery on startup
  try {
    const recovery = await recoverStaleJobs();
    if (recovery.recoveredCount > 0) {
      console.log(`♻️ Recovered ${recovery.recoveredCount} stale/interrupted jobs from previous runs.`);
    }
  } catch (err) {
    console.error('Error recovering stale jobs on startup:', err);
  }

  let lastHeartbeat = 0;
  let lastWatchdog = 0;
  let lastScheduler = 0;

  while (isRunning) {
    const now = Date.now();

    // Heartbeat every 10s
    if (now - lastHeartbeat >= 10000) {
      lastHeartbeat = now;
      await recordWorkerHeartbeat(WORKER_ID, os.hostname(), process.pid, activeJobs, 'ONLINE').catch(() => {});
    }

    // Stale job recovery and Recurring Tasks watchdog every 60s
    if (now - lastWatchdog >= 60000) {
      lastWatchdog = now;
      await recoverStaleJobs().catch(() => {});
      await processRecurringTasks().catch(() => {});
    }

    // Google Sheets recurring sync scheduler check every 15s
    if (now - lastScheduler >= 15000) {
      lastScheduler = now;
      await scheduleDueGoogleSheetSyncs().catch(() => {});
    }

    // Process Queues
    try {
      const { jobsProcessed } = await runWorkerCycle();
      if (jobsProcessed === 0) {
        // Sleep 1s if queues are idle
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (err) {
      console.error('Error in worker cycle:', err);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

// Execute daemon if run directly
if (require.main === module || process.env.RUN_WORKER === 'true') {
  startDaemon().catch((err) => {
    console.error('Fatal worker daemon error:', err);
    process.exit(1);
  });
}
