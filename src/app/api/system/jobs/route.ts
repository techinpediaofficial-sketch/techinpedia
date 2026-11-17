import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { getQueueMetrics } from '@/lib/queue/jobQueue';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'admin.settings.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queue = searchParams.get('queue');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // 1. Queue summary metrics
    const metrics = await getQueueMetrics();

    // 2. Active workers
    const activeThreshold = new Date(Date.now() - 60000); // 1 minute
    const workers = await db.workerHeartbeat.findMany({
      where: { lastHeartbeatAt: { gte: activeThreshold } },
      orderBy: { lastHeartbeatAt: 'desc' },
    });

    // 3. Filtered Job list
    const whereClause: any = {};
    if (queue && queue !== 'ALL') whereClause.queue = queue;
    if (status && status !== 'ALL') whereClause.status = status;

    const [jobs, totalJobs] = await Promise.all([
      db.backgroundJob.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.backgroundJob.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      metrics,
      workers: workers.map((w) => ({
        id: w.workerId,
        hostname: w.hostname,
        pid: w.pid,
        status: w.status,
        activeJobsCount: w.activeJobsCount,
        lastHeartbeatAt: w.lastHeartbeatAt,
      })),
      jobs,
      pagination: {
        page,
        limit,
        totalJobs,
        totalPages: Math.ceil(totalJobs / limit),
      },
    });
  } catch (error: any) {
    console.error('System jobs GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'admin.settings.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, jobId, queue } = body;

    if (action === 'RETRY_JOB' && jobId) {
      const job = await db.backgroundJob.findUnique({ where: { id: jobId } });
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

      await db.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: 'QUEUED',
          scheduledAt: null,
          lockedAt: null,
          lockedBy: null,
          lastError: null,
          attemptCount: 0,
        },
      });

      return NextResponse.json({ success: true, message: `Job ${jobId} re-queued successfully` });
    }

    if (action === 'RETRY_ALL_FAILED') {
      const whereClause: any = { status: 'FAILED' };
      if (queue && queue !== 'ALL') whereClause.queue = queue;

      const updated = await db.backgroundJob.updateMany({
        where: whereClause,
        data: {
          status: 'QUEUED',
          scheduledAt: null,
          lockedAt: null,
          lockedBy: null,
          lastError: null,
          attemptCount: 0,
        },
      });

      return NextResponse.json({ success: true, retriedCount: updated.count });
    }

    if (action === 'CANCEL_JOB' && jobId) {
      await db.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: 'CANCELLED',
          lockedAt: null,
          lockedBy: null,
        },
      });

      return NextResponse.json({ success: true, message: `Job ${jobId} cancelled` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('System jobs POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to perform job action' }, { status: 500 });
  }
}
