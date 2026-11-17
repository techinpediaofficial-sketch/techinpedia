import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { WorkflowDefinition, WorkflowExecutionContext } from '@/lib/workflow/types';
import { executeWorkflowGraph, executeNode } from '@/lib/workflow/queueEngine';
import { migrateLegacyRuleToGraph } from '@/lib/workflow/legacyMigrator';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ executionId: string }> }
) {
  try {
    await requireAuth();
    const { executionId } = await params;

    const execution = await db.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        workflow: {
          select: { id: true, name: true, trigger: true, category: true, version: true },
        },
        steps: {
          orderBy: { executedAt: 'asc' },
        },
      },
    });

    if (!execution) {
      return NextResponse.json({ error: 'Workflow execution not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      execution,
    });
  } catch (error) {
    console.error('Fetch execution error:', error);
    return NextResponse.json({ error: 'Failed to fetch execution details.' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ executionId: string }> }
) {
  try {
    const session = await requireAuth();
    const { executionId } = await params;
    const body = await request.json();
    const { action, stepId } = body;

    const execution = await db.workflowExecution.findUnique({
      where: { id: executionId },
      include: { workflow: true, steps: true },
    });

    if (!execution || !execution.workflow) {
      return NextResponse.json({ error: 'Workflow execution not found.' }, { status: 404 });
    }

    let definition: WorkflowDefinition;
    if (execution.workflow.nodes) {
      try {
        definition = {
          nodes: JSON.parse(execution.workflow.nodes),
          edges: execution.workflow.edges ? JSON.parse(execution.workflow.edges) : [],
        };
      } catch {
        definition = migrateLegacyRuleToGraph(execution.workflow);
      }
    } else {
      definition = migrateLegacyRuleToGraph(execution.workflow);
    }

    let payloadData = {};
    try {
      if (execution.triggerPayload) {
        payloadData = JSON.parse(execution.triggerPayload);
      }
    } catch {}

    const context: WorkflowExecutionContext = {
      executionId: execution.id,
      workflowId: execution.workflowId,
      workflowVersion: execution.workflowVersion,
      triggerEvent: execution.triggerEvent,
      payload: payloadData as any,
      variables: (payloadData as any).data || payloadData,
      stepResults: {},
    };

    // 1. Replay Execution from start
    if (action === 'REPLAY') {
      const newExecution = await db.workflowExecution.create({
        data: {
          workflowId: execution.workflowId,
          workflowVersion: execution.workflowVersion,
          triggerEvent: execution.triggerEvent,
          triggerPayload: execution.triggerPayload,
          status: 'RUNNING',
        },
      });

      context.executionId = newExecution.id;
      const startNodeId = definition.nodes[0].id;

      executeWorkflowGraph(definition, startNodeId, context).catch((err) => {
        console.error(`Replay execution ${newExecution.id} error:`, err);
      });

      return NextResponse.json({
        success: true,
        message: 'Workflow replay initiated.',
        newExecutionId: newExecution.id,
      });
    }

    // 2. Retry Failed Step
    if (action === 'RETRY_STEP' && stepId) {
      const step = execution.steps.find((s) => s.id === stepId);
      if (!step) {
        return NextResponse.json({ error: 'Execution step not found.' }, { status: 404 });
      }

      const node = definition.nodes.find((n) => n.id === step.nodeId);
      if (!node) {
        return NextResponse.json({ error: 'Corresponding workflow node not found in graph.' }, { status: 404 });
      }

      const retryResult = await executeNode(node, context);

      await db.workflowExecutionStep.update({
        where: { id: stepId },
        data: {
          status: retryResult.status,
          outputPayload: retryResult.outputPayload ? JSON.stringify(retryResult.outputPayload) : null,
          errorDetails: retryResult.errorDetails || null,
          durationMs: retryResult.durationMs || 0,
          retryCount: { increment: 1 },
          executedAt: new Date(),
        },
      });

      if (retryResult.status === 'SUCCESS') {
        await db.workflowExecution.update({
          where: { id: execution.id },
          data: { status: 'COMPLETED', errorLog: null },
        });
      }

      return NextResponse.json({
        success: retryResult.status === 'SUCCESS',
        stepResult: retryResult,
      });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Execution action error:', error);
    return NextResponse.json({ error: error.message || 'Action failed.' }, { status: 500 });
  }
}
