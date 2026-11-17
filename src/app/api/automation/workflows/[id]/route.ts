import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { migrateLegacyRuleToGraph } from '@/lib/workflow/legacyMigrator';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const rule = await db.workflowRule.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!rule) {
      return NextResponse.json({ error: 'Workflow not found.' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && rule.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this workflow' }, { status: 403 });
    }

    // Auto-migrate legacy graph if missing
    let nodes = rule.nodes;
    let edges = rule.edges;
    if (!nodes) {
      const graph = migrateLegacyRuleToGraph(rule);
      nodes = JSON.stringify(graph.nodes);
      edges = JSON.stringify(graph.edges);
    }

    return NextResponse.json({
      success: true,
      rule: {
        ...rule,
        nodes,
        edges,
      },
    });
  } catch (error) {
    console.error('Fetch single workflow error:', error);
    return NextResponse.json({ error: 'Failed to fetch workflow.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const rule = await db.workflowRule.findUnique({ where: { id } });
    if (!rule) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && rule.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden: Cannot edit another company workflow' }, { status: 403 });
    }

    const { name, description, category, trigger, triggerConfig, nodes, edges, status, isActive } = body;

    // If publishing, validate graph
    if (status === 'PUBLISHED') {
      try {
        const parsedNodes = typeof nodes === 'string' ? JSON.parse(nodes) : nodes;
        if (!Array.isArray(parsedNodes) || parsedNodes.length === 0) {
          return NextResponse.json({ error: 'Workflow must have at least one trigger node before publishing.' }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid workflow node structure.' }, { status: 400 });
      }
    }

    // Determine versioning: if rule is currently PUBLISHED and editing graph, bump version
    let newVersion = rule.version;
    if (rule.status === 'PUBLISHED' && (nodes || trigger)) {
      newVersion += 1;
    }

    const updated = await db.workflowRule.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(trigger && { trigger }),
        ...(triggerConfig !== undefined && {
          triggerConfig: typeof triggerConfig === 'string' ? triggerConfig : JSON.stringify(triggerConfig),
        }),
        ...(nodes !== undefined && {
          nodes: typeof nodes === 'string' ? nodes : JSON.stringify(nodes),
        }),
        ...(edges !== undefined && {
          edges: typeof edges === 'string' ? edges : JSON.stringify(edges),
        }),
        ...(status && { status }),
        ...(isActive !== undefined && { isActive }),
        version: newVersion,
        updatedById: session.userId,
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'UPDATE',
      entityType: 'WORKFLOW_RULE',
      entityId: id,
      details: `Updated workflow ${rule.name} to v${newVersion}`,
    });

    return NextResponse.json({ success: true, rule: updated });
  } catch (error) {
    console.error('Update workflow rule error:', error);
    return NextResponse.json({ error: 'Failed to update workflow.' }, { status: 500 });
  }
}

// POST action handler for Clone / Duplicate / Toggle
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const rule = await db.workflowRule.findUnique({ where: { id } });
    if (!rule) {
      return NextResponse.json({ error: 'Workflow not found.' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && rule.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden: Cannot modify another company workflow' }, { status: 403 });
    }

    if (action === 'DUPLICATE') {
      const cloned = await db.workflowRule.create({
        data: {
          name: `${rule.name} (Copy)`,
          description: rule.description,
          category: rule.category,
          companyId: session.isTenant ? session.companyId : rule.companyId,
          trigger: rule.trigger,
          triggerConfig: rule.triggerConfig,
          nodes: rule.nodes,
          edges: rule.edges,
          status: 'DRAFT',
          isActive: false,
          version: 1,
          parentWorkflowId: rule.id,
          createdById: session.userId,
        },
      });

      return NextResponse.json({ success: true, clonedRule: cloned });
    }

    if (action === 'TOGGLE_STATUS') {
      const newActive = !rule.isActive;
      const updated = await db.workflowRule.update({
        where: { id },
        data: {
          isActive: newActive,
          status: newActive ? 'PUBLISHED' : 'DRAFT',
        },
      });

      return NextResponse.json({ success: true, rule: updated });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Workflow action error:', error);
    return NextResponse.json({ error: 'Failed to perform workflow action.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const rule = await db.workflowRule.findUnique({ where: { id } });
    if (!rule) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && rule.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden: Cannot delete another company workflow' }, { status: 403 });
    }

    await db.workflowRule.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      action: 'DELETE',
      entityType: 'WORKFLOW_RULE',
      entityId: id,
      details: `Deleted workflow ${rule.name}`,
    });

    return NextResponse.json({ success: true, message: 'Workflow rule deleted.' });
  } catch (error) {
    console.error('Delete workflow rule error:', error);
    return NextResponse.json({ error: 'Failed to delete workflow.' }, { status: 500 });
  }
}
