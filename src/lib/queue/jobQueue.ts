/**
 * TechInPedia Durable Background Job & Queue Engine
 * 
 * Provides production-grade queueing, atomic claiming, deterministic job IDs,
 * crash/restart recovery, exponential backoff with jitter, rate-limiting,
 * and scheduled job execution.
 */

import { db } from '../db';

export type JobQueueName =
  | 'whatsapp-campaign'
  | 'whatsapp-message'
  | 'whatsapp-webhook'
  | 'google-sheet-sync'
  | 'workflow-delayed-actions'
  | 'whatsapp-drip-step'
  | 'whatsapp-chatbot-delay'
  | 'ai-knowledge-index';

export type JobStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'DELAYED'
  | 'CANCELLED'
  | 'SKIPPED';

export interface EnqueueOptions {
  priority?: number;
  maxAttempts?: number;
  scheduledAt?: Date | null;
  correlationId?: string;
  entityType?: string;
  entityId?: string;
}

export interface JobRecord {
  id: string;
  queue: string;
  status: string;
  payload: any;
  result?: any;
  attemptCount: number;
  maxAttempts: number;
  priority: number;
  scheduledAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  failedAt?: Date | null;
  lastError?: string | null;
  lockedAt?: Date | null;
  lockedBy?: string | null;
  correlationId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Enqueues a job with a deterministic ID.
 * If the job ID already exists and has COMPLETED, it will NOT re-execute (Idempotency).
 * If it is PENDING/RETRYING/CANCELLED, it updates or creates safely.
 */
export async function enqueueJob(
  queue: JobQueueName,
  jobId: string,
  payload: Record<string, any>,
  options: EnqueueOptions = {}
): Promise<{ enqueued: boolean; jobId: string; status: string }> {
  const payloadStr = JSON.stringify(payload);
  const now = new Date();
  const scheduledAt = options.scheduledAt || null;
  const initialStatus: JobStatus = scheduledAt && scheduledAt > now ? 'DELAYED' : 'QUEUED';

  // Check if job already exists
  const existing = await db.backgroundJob.findUnique({
    where: { id: jobId },
  });

  if (existing) {
    // If already successfully completed, preserve idempotency
    if (existing.status === 'COMPLETED') {
      return { enqueued: false, jobId, status: 'COMPLETED' };
    }

    // If currently processing, do not clobber
    if (existing.status === 'PROCESSING') {
      return { enqueued: false, jobId, status: 'PROCESSING' };
    }

    // Otherwise refresh job
    await db.backgroundJob.update({
      where: { id: jobId },
      data: {
        queue,
        status: initialStatus,
        payload: payloadStr,
        scheduledAt,
        attemptCount: 0,
        priority: options.priority ?? existing.priority,
        maxAttempts: options.maxAttempts ?? existing.maxAttempts,
        correlationId: options.correlationId ?? existing.correlationId,
        entityType: options.entityType ?? existing.entityType,
        entityId: options.entityId ?? existing.entityId,
        lockedAt: null,
        lockedBy: null,
        lastError: null,
        startedAt: null,
        completedAt: null,
        failedAt: null,
      },
    });

    return { enqueued: true, jobId, status: initialStatus };
  }

  // Create new job
  await db.backgroundJob.create({
    data: {
      id: jobId,
      queue,
      status: initialStatus,
      payload: payloadStr,
      scheduledAt,
      priority: options.priority ?? 0,
      maxAttempts: options.maxAttempts ?? 3,
      correlationId: options.correlationId || null,
      entityType: options.entityType || null,
      entityId: options.entityId || null,
    },
  });

  return { enqueued: true, jobId, status: initialStatus };
}

/**
 * Atomically claims the next ready batch of jobs for a queue.
 */
export async function claimNextJobs(
  queue: JobQueueName,
  workerId: string,
  limit: number = 5
): Promise<JobRecord[]> {
  const now = new Date();

  // Find candidate jobs
  const candidates = await db.backgroundJob.findMany({
    where: {
      queue,
      status: { in: ['QUEUED', 'PENDING', 'RETRYING', 'DELAYED'] },
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: now } },
      ],
      lockedAt: null,
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
    take: limit * 2, // fetch slightly more to account for race conditions
  });

  const claimed: JobRecord[] = [];

  for (const job of candidates) {
    if (claimed.length >= limit) break;

    // Atomic claim condition
    const updateRes = await db.backgroundJob.updateMany({
      where: {
        id: job.id,
        lockedAt: null,
        status: { in: ['QUEUED', 'PENDING', 'RETRYING', 'DELAYED'] },
      },
      data: {
        status: 'PROCESSING',
        lockedAt: now,
        lockedBy: workerId,
        startedAt: job.startedAt || now,
        attemptCount: { increment: 1 },
      },
    });

    if (updateRes.count > 0) {
      claimed.push({
        ...job,
        status: 'PROCESSING',
        lockedAt: now,
        lockedBy: workerId,
        attemptCount: job.attemptCount + 1,
        payload: JSON.parse(job.payload || '{}'),
        result: job.result ? JSON.parse(job.result) : null,
      });
    }
  }

  return claimed;
}

/**
 * Marks a job as completed.
 */
export async function completeJob(jobId: string, resultData?: any): Promise<void> {
  const now = new Date();
  await db.backgroundJob.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      result: resultData ? JSON.stringify(resultData) : null,
      completedAt: now,
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    },
  });
}

/**
 * Handles job failure with exponential backoff and jitter, or marks DEAD_LETTER / FAILED.
 */
export async function failJob(
  jobId: string,
  error: Error | string,
  isPermanent: boolean = false
): Promise<{ willRetry: boolean; nextRetryAt: Date | null }> {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const job = await db.backgroundJob.findUnique({ where: { id: jobId } });
  if (!job) return { willRetry: false, nextRetryAt: null };

  const currentAttempts = job.attemptCount;
  const maxAttempts = job.maxAttempts;

  // Permanent failure or exceeded max attempts
  if (isPermanent || currentAttempts >= maxAttempts) {
    await db.backgroundJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        lastError: errorMessage,
        failedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
      },
    });
    return { willRetry: false, nextRetryAt: null };
  }

  // Transient failure: Exponential backoff with jitter
  // Base 2s * 2^(attempts-1) + jitter (up to 1s)
  const baseMs = 2000;
  const backoffMs = Math.min(120000, baseMs * Math.pow(2, currentAttempts - 1));
  const jitterMs = Math.floor(Math.random() * 1000);
  const nextRetryAt = new Date(Date.now() + backoffMs + jitterMs);

  await db.backgroundJob.update({
    where: { id: jobId },
    data: {
      status: 'RETRYING',
      lastError: errorMessage,
      scheduledAt: nextRetryAt,
      lockedAt: null,
      lockedBy: null,
    },
  });

  return { willRetry: true, nextRetryAt };
}

/**
 * Recovers stale jobs left in 'PROCESSING' due to server crashes or PM2 restarts.
 */
export async function recoverStaleJobs(staleThresholdMs: number = 300000): Promise<{ recoveredCount: number }> {
  const cutoff = new Date(Date.now() - staleThresholdMs);

  // Find stuck processing jobs
  const stuckJobs = await db.backgroundJob.findMany({
    where: {
      status: 'PROCESSING',
      lockedAt: { lte: cutoff },
    },
    take: 50,
  });

  let recoveredCount = 0;

  for (const job of stuckJobs) {
    // If it's a WhatsApp message job, check if recipient actually got sent
    if (job.queue === 'whatsapp-message' && job.entityId) {
      const recipient = await db.whatsappCampaignRecipient.findUnique({
        where: { id: job.entityId },
      });

      if (recipient && (recipient.status === 'SENT' || recipient.metaMessageId)) {
        // Zero duplicate send: Already sent, mark completed
        await db.backgroundJob.update({
          where: { id: job.id },
          data: {
            status: 'COMPLETED',
            lockedAt: null,
            lockedBy: null,
            completedAt: recipient.sentAt || new Date(),
          },
        });
        recoveredCount++;
        continue;
      }
    }

    // Otherwise unlock and set back to QUEUED
    await db.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: 'QUEUED',
        lockedAt: null,
        lockedBy: null,
        lastError: 'Recovered from dead worker or server restart',
      },
    });
    recoveredCount++;
  }

  return { recoveredCount };
}

/**
 * Gets aggregated queue metrics for observability.
 */
export async function getQueueMetrics(): Promise<Record<string, Record<string, number>>> {
  const metrics: Record<string, Record<string, number>> = {
    'whatsapp-campaign': { waiting: 0, active: 0, delayed: 0, completed: 0, failed: 0, retrying: 0 },
    'whatsapp-message': { waiting: 0, active: 0, delayed: 0, completed: 0, failed: 0, retrying: 0 },
    'google-sheet-sync': { waiting: 0, active: 0, delayed: 0, completed: 0, failed: 0, retrying: 0 },
    'workflow-delayed-actions': { waiting: 0, active: 0, delayed: 0, completed: 0, failed: 0, retrying: 0 },
  };

  const counts = await db.backgroundJob.groupBy({
    by: ['queue', 'status'],
    _count: { id: true },
  });

  for (const c of counts) {
    if (!metrics[c.queue]) {
      metrics[c.queue] = { waiting: 0, active: 0, delayed: 0, completed: 0, failed: 0, retrying: 0 };
    }

    const count = c._count.id;
    if (c.status === 'QUEUED' || c.status === 'PENDING') metrics[c.queue].waiting += count;
    else if (c.status === 'PROCESSING') metrics[c.queue].active += count;
    else if (c.status === 'DELAYED') metrics[c.queue].delayed += count;
    else if (c.status === 'COMPLETED') metrics[c.queue].completed += count;
    else if (c.status === 'FAILED') metrics[c.queue].failed += count;
    else if (c.status === 'RETRYING') metrics[c.queue].retrying += count;
  }

  return metrics;
}

/**
 * Updates worker heartbeat.
 */
export async function recordWorkerHeartbeat(
  workerId: string,
  hostname: string,
  pid: number,
  activeJobsCount: number,
  status: 'ONLINE' | 'SHUTTING_DOWN' | 'OFFLINE' = 'ONLINE'
): Promise<void> {
  const now = new Date();
  await db.workerHeartbeat.upsert({
    where: { workerId },
    update: {
      status,
      activeJobsCount,
      lastHeartbeatAt: now,
    },
    create: {
      workerId,
      hostname,
      pid,
      status,
      activeJobsCount,
      lastHeartbeatAt: now,
      version: '1.0.0',
    },
  });
}
