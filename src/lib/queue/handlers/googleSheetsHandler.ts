/**
 * Google Sheets Queue Worker Handler & Automatic Sync Scheduler
 * 
 * Provides automated recurring synchronization, concurrency locking per spreadsheet mapping,
 * duration tracking, and sync metrics recording.
 */

import { db } from '../../db';
import { completeJob, failJob, enqueueJob, JobRecord } from '../jobQueue';
import { syncInboundSheetLeads } from '../../google_sheets_service';

/**
 * Executes a Google Sheet sync job.
 */
export async function handleGoogleSheetSyncJob(job: JobRecord): Promise<void> {
  const { configId } = job.payload;

  if (!configId) {
    await completeJob(job.id, { skipped: true, reason: 'No configId provided' });
    return;
  }

  const config = await db.googleSheetSyncConfig.findUnique({
    where: { id: configId },
  });

  if (!config) {
    await completeJob(job.id, { skipped: true, reason: 'Config not found' });
    return;
  }

  const startTime = Date.now();

  // Update status to RUNNING
  await db.googleSheetSyncConfig.update({
    where: { id: configId },
    data: { lastSyncStatus: 'RUNNING' },
  });

  try {
    const result = await syncInboundSheetLeads(configId);
    const durationMs = Date.now() - startTime;
    const intervalMinutes = config.autoSyncIntervalMinutes > 0 ? config.autoSyncIntervalMinutes : 15;
    const nextSyncAt = new Date(Date.now() + intervalMinutes * 60 * 1000);

    // Update config with detailed sync metrics
    await db.googleSheetSyncConfig.update({
      where: { id: configId },
      data: {
        lastSyncStatus: 'COMPLETED',
        lastSyncDuration: durationMs,
        lastSuccessfulSyncAt: new Date(),
        nextSyncAt,
        rowsProcessed: result.rowsScanned,
        rowsCreated: result.leadsCreated,
        rowsUpdated: result.leadsUpdated,
        rowsSkipped: result.duplicatesSkipped,
        rowsFailed: result.errorsCount,
        lastError: null,
      },
    });

    await completeJob(job.id, {
      ...result,
      durationMs,
      nextSyncAt,
    });
  } catch (err: any) {
    const durationMs = Date.now() - startTime;

    await db.googleSheetSyncConfig.update({
      where: { id: configId },
      data: {
        lastSyncStatus: 'FAILED',
        lastSyncDuration: durationMs,
        lastError: err.message,
      },
    });

    await failJob(job.id, err.message, false);
  }
}

/**
 * Periodically schedules due Google Sheet sync jobs based on autoSyncIntervalMinutes.
 */
export async function scheduleDueGoogleSheetSyncs(): Promise<{ scheduledCount: number }> {
  const now = new Date();

  // Find active configurations due for sync
  const dueConfigs = await db.googleSheetSyncConfig.findMany({
    where: {
      status: 'ACTIVE',
      autoSyncIntervalMinutes: { gt: 0 },
      OR: [
        { nextSyncAt: null },
        { nextSyncAt: { lte: now } },
      ],
    },
  });

  let scheduledCount = 0;

  for (const cfg of dueConfigs) {
    const jobId = `google-sheet-sync:${cfg.id}`;

    // Concurrency check: Ensure another sync job for this mapping is not already running
    const existingActive = await db.backgroundJob.findFirst({
      where: {
        id: jobId,
        status: { in: ['PROCESSING', 'QUEUED'] },
      },
    });

    if (existingActive) {
      continue; // Skip concurrent run
    }

    await enqueueJob(
      'google-sheet-sync',
      jobId,
      { configId: cfg.id, name: cfg.name },
      {
        priority: 5,
        correlationId: cfg.id,
        entityType: 'GoogleSheetSyncConfig',
        entityId: cfg.id,
      }
    );

    // Update tentative nextSyncAt to prevent repeated scheduling in the same poll
    await db.googleSheetSyncConfig.update({
      where: { id: cfg.id },
      data: {
        nextSyncAt: new Date(Date.now() + cfg.autoSyncIntervalMinutes * 60 * 1000),
      },
    });

    scheduledCount++;
  }

  return { scheduledCount };
}
