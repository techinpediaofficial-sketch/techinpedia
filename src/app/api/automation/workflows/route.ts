import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { migrateLegacyRuleToGraph } from '@/lib/workflow/legacyMigrator';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';

    const isTenant = Boolean(session.isTenant);
    const requestedCompanyId = searchParams.get('companyId');
    const targetCompanyId = isTenant && session.companyId
      ? session.companyId
      : (requestedCompanyId && requestedCompanyId !== 'ALL' ? requestedCompanyId : null);

    const where: any = {};

    if (isTenant && session.companyId) {
      // Strict multi-tenant isolation: tenants only ever see their own workflows
      where.companyId = session.companyId;
    } else if (targetCompanyId) {
      if (targetCompanyId === 'master') {
        where.companyId = null;
      } else {
        where.companyId = targetCompanyId;
      }
    }

    if (category && category !== 'ALL') where.category = category;
    if (status && status !== 'ALL') where.status = status;
    if (search.trim()) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: search } },
            { trigger: { contains: search } },
            { description: { contains: search } },
          ],
        },
      ];
    }

    const rules = await db.workflowRule.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            startedAt: true,
            durationMs: true,
            stepCount: true,
          },
        },
      },
    });

    // Ensure all rules have visual nodes/edges
    const formattedRules = rules.map((r) => {
      if (!r.nodes) {
        const graph = migrateLegacyRuleToGraph(r);
        return {
          ...r,
          nodes: JSON.stringify(graph.nodes),
          edges: JSON.stringify(graph.edges),
        };
      }
      return r;
    });

    // Compute aggregate metrics scoped strictly to this company
    const executionWhere: any = {};
    if (where.companyId !== undefined) {
      executionWhere.workflow = { companyId: where.companyId };
    }

    const [
      totalExecutionsCount,
      completedExecutionsCount,
      failedExecutionsCount,
      waitingJobsCount,
    ] = await Promise.all([
      db.workflowExecution.count({ where: executionWhere }),
      db.workflowExecution.count({ where: { ...executionWhere, status: 'COMPLETED' } }),
      db.workflowExecution.count({ where: { ...executionWhere, status: 'FAILED' } }),
      db.workflowJob.count({
        where: {
          status: { in: ['PENDING', 'RETRYING'] },
          ...(where.companyId !== undefined ? { workflow: { companyId: where.companyId } } : {}),
        },
      }),
    ]);

    const activeRulesCount = rules.filter((r) => r.isActive && r.status === 'PUBLISHED').length;
    const successRate =
      totalExecutionsCount > 0
        ? Math.round((completedExecutionsCount / totalExecutionsCount) * 100)
        : 100;

    return NextResponse.json({
      success: true,
      rules: formattedRules,
      metrics: {
        totalRules: rules.length,
        activeRules: activeRulesCount,
        totalExecutions: totalExecutionsCount,
        completedExecutions: completedExecutionsCount,
        failedExecutions: failedExecutionsCount,
        waitingJobs: waitingJobsCount,
        successRate,
      },
    });
  } catch (error) {
    console.error('Fetch workflow rules error:', error);
    return NextResponse.json({ error: 'Failed to fetch workflows.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { name, description, category, trigger, triggerConfig, nodes, edges, status } = body;

    if (!name || !trigger) {
      return NextResponse.json({ error: 'Workflow name and trigger event are required.' }, { status: 400 });
    }

    const isTenant = session.isTenant;
    const companyId = isTenant && session.companyId ? session.companyId : body.companyId || null;

    const rule = await db.workflowRule.create({
      data: {
        name: name.trim(),
        description: description || null,
        category: category || 'CRM',
        companyId,
        trigger,
        triggerConfig: typeof triggerConfig === 'string' ? triggerConfig : JSON.stringify(triggerConfig || {}),
        nodes: typeof nodes === 'string' ? nodes : JSON.stringify(nodes || []),
        edges: typeof edges === 'string' ? edges : JSON.stringify(edges || []),
        status: status || 'DRAFT',
        isActive: status === 'PUBLISHED',
        version: 1,
        createdById: session.userId,
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'WORKFLOW_RULE',
      entityId: rule.id,
      details: `Created workflow ${rule.name} with trigger ${rule.trigger}`,
    });

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error('Create workflow rule error:', error);
    return NextResponse.json({ error: 'Failed to create workflow.' }, { status: 500 });
  }
}
