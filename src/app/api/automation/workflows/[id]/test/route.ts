import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { WorkflowDefinition, WorkflowExecutionContext } from '@/lib/workflow/types';
import { executeWorkflowGraph } from '@/lib/workflow/queueEngine';
import { migrateLegacyRuleToGraph } from '@/lib/workflow/legacyMigrator';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const sampleData = body.sampleData || body.samplePayload || {};
    const overrideDefinition = body.definition;
    const isDryRun = body.isDryRun !== undefined ? body.isDryRun : (body.mode !== 'LIVE');

    const rule = await db.workflowRule.findUnique({ where: { id } });
    if (!rule && !overrideDefinition) {
      return NextResponse.json({ error: 'Workflow not found.' }, { status: 404 });
    }

    let definition: WorkflowDefinition;
    if (overrideDefinition) {
      definition = overrideDefinition;
    } else if (rule?.nodes) {
      try {
        definition = {
          nodes: JSON.parse(rule.nodes),
          edges: rule.edges ? JSON.parse(rule.edges) : [],
        };
      } catch {
        definition = migrateLegacyRuleToGraph(rule!);
      }
    } else {
      definition = migrateLegacyRuleToGraph(rule!);
    }

    if (!definition.nodes || definition.nodes.length === 0) {
      return NextResponse.json({ error: 'Workflow has no configured nodes.' }, { status: 400 });
    }

    const mockExecutionId = `sim-${Date.now()}`;

    const context: WorkflowExecutionContext = {
      executionId: mockExecutionId,
      workflowId: rule?.id || 'temp-id',
      workflowVersion: rule?.version || 1,
      triggerEvent: rule?.trigger || 'test.event',
      payload: {
        entityId: sampleData?.id || 'sample-1',
        entityType: 'Lead',
        data: sampleData || {},
      },
      variables: {
        ...sampleData,
        lead: sampleData,
        deal: sampleData,
        customer: sampleData,
        entityId: sampleData?.id || 'sample-1',
        entityType: 'Lead',
      },
      stepResults: {},
      isDryRun,
    };

    const startNodeId = definition.nodes[0].id;
    const result = await executeWorkflowGraph(definition, startNodeId, context);

    const isSuccess = result.status === 'COMPLETED' || result.status === 'SUCCESS';
    const simulatedSteps = (result.completedSteps || []).map((step) => ({
      ...step,
      branchChoice: step.chosenBranch,
      mockActionOutput: step.outputPayload || (step.errorDetails ? { error: step.errorDetails } : null),
    }));

    return NextResponse.json({
      success: isSuccess,
      mode: isDryRun ? 'DRY_RUN' : 'LIVE',
      status: result.status,
      steps: result.completedSteps,
      simulatedSteps,
      simulation: {
        success: isSuccess,
        status: result.status,
        simulatedSteps,
        error: result.error,
      },
      error: result.error,
    });
  } catch (error: any) {
    console.error('Workflow test error:', error);
    return NextResponse.json(
      { error: error.message || 'Workflow test simulation failed.' },
      { status: 500 }
    );
  }
}
