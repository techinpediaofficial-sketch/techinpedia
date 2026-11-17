import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAuditEvent } from '@/lib/auditLogger';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);

    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (entityType && entityType !== 'ALL') where.entityType = entityType;
    if (action && action !== 'ALL') where.action = action;
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { userEmail: { contains: search } },
        { entityType: { contains: search } },
        { metadata: { contains: search } },
      ];
    }

    const [logs, totalCount] = await Promise.all([
      db.activityLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.activityLog.count({ where }),
    ]);

    // Format logs and parse metadata diffs
    const formattedLogs = logs.map((l) => {
      let parsedMetadata: any = {};
      try {
        if (l.metadata) parsedMetadata = JSON.parse(l.metadata);
      } catch {
        parsedMetadata = { raw: l.metadata };
      }

      return {
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        userEmail: l.userEmail || l.user?.email || 'System / Automated',
        userName: l.user?.name || 'System Worker',
        diffs: parsedMetadata.diffs || [],
        details: parsedMetadata.details || null,
        beforeSnapshot: parsedMetadata.beforeSnapshot || null,
        afterSnapshot: parsedMetadata.afterSnapshot || null,
        ip: parsedMetadata.ip || null,
        userAgent: parsedMetadata.userAgent || null,
        createdAt: l.createdAt,
      };
    });

    // Summary counts
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const [todayCount, totalAudits] = await Promise.all([
      db.activityLog.count({ where: { createdAt: { gte: startOfToday } } }),
      db.activityLog.count(),
    ]);

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      summary: {
        todayCount,
        totalAudits,
      },
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { action, entityType, entityId, before, after, details } = body;
    if (!action || !entityType) {
      return NextResponse.json({ error: 'Action and entityType are required' }, { status: 400 });
    }

    const record = await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      action,
      entityType,
      entityId,
      before,
      after,
      details,
    });

    return NextResponse.json({ success: true, log: record });
  } catch (error: any) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to record audit' },
      { status: 500 }
    );
  }
}
