import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: any = { workflowId: id };
    if (status && status !== 'ALL') where.status = status;

    const [executions, totalCount, workflow] = await Promise.all([
      db.workflowExecution.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          steps: {
            orderBy: { executedAt: 'asc' },
            select: {
              id: true,
              nodeName: true,
              nodeType: true,
              actionType: true,
              status: true,
              durationMs: true,
              executedAt: true,
            },
          },
        },
      }),
      db.workflowExecution.count({ where }),
      db.workflowRule.findUnique({
        where: { id },
        select: { id: true, name: true, trigger: true, version: true, status: true },
      }),
    ]);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      workflow,
      executions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Fetch workflow executions error:', error);
    return NextResponse.json({ error: 'Failed to fetch executions.' }, { status: 500 });
  }
}
