import { NextResponse } from 'next/server';
import os from 'os';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();

    // Measure MySQL latency
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbStart;

    // Fetch key counters in parallel
    const [
      enquiriesCount,
      contactsCount,
      dealsCount,
      invoicesCount,
      projectsCount,
      assetsCount,
      ticketsCount,
      usersCount,
      servicesCount,
    ] = await Promise.all([
      db.enquiry.count().catch(() => 0),
      db.contact.count().catch(() => 0),
      db.deal.count().catch(() => 0),
      db.invoice.count().catch(() => 0),
      db.project.count().catch(() => 0),
      db.rentalAsset.count().catch(() => 0),
      db.supportTicket.count().catch(() => 0),
      db.user.count().catch(() => 0),
      db.service.count().catch(() => 0),
    ]);

    const mem = process.memoryUsage();
    const systemInfo = {
      nodeVersion: process.version,
      platform: `${os.type()} ${os.release()} (${os.arch()})`,
      uptimeSeconds: Math.floor(process.uptime()),
      pid: process.pid,
      memory: {
        rssMb: (mem.rss / 1024 / 1024).toFixed(1),
        heapUsedMb: (mem.heapUsed / 1024 / 1024).toFixed(1),
        heapTotalMb: (mem.heapTotal / 1024 / 1024).toFixed(1),
        systemFreeMemMb: (os.freemem() / 1024 / 1024).toFixed(1),
        systemTotalMemMb: (os.totalmem() / 1024 / 1024).toFixed(1),
      },
      cpuCount: os.cpus().length,
      database: {
        status: 'CONNECTED',
        latencyMs: dbLatencyMs,
        provider: 'MySQL 8.0',
      },
      counts: {
        enquiries: enquiriesCount,
        contacts: contactsCount,
        deals: dealsCount,
        invoices: invoicesCount,
        projects: projectsCount,
        assets: assetsCount,
        tickets: ticketsCount,
        users: usersCount,
        services: servicesCount,
      },
      cache: {
        isrStatus: 'ACTIVE',
        revalidateWindow: '120s',
      },
    };

    return NextResponse.json({ success: true, system: systemInfo });
  } catch (error) {
    console.error('System health check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve system health',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
