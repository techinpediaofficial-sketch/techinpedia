// ============================================================
// Workflow Graph Execution & Asynchronous Queue Engine
// ============================================================

import { db } from '../db';
import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowExecutionContext,
  StepExecutionResult,
  MultiBranchWorkflowNode,
  FilterWorkflowNode,
  ApprovalWorkflowNode,
  StopWorkflowNode,
} from './types';
import { evaluateConditionGroup, resolveFieldValue } from './conditionEvaluator';
import { executeAction, maskSensitiveData } from './actionRunner';

const MAX_EXECUTION_DEPTH = 50;

/**
 * Calculates target execution time for a Delay node.
 */
export function calculateDelayTarget(config: any, contextData: Record<string, any> = {}): Date {
  const now = new Date();
  let target = new Date(now);

  if (config.delayType === 'DATE_RELATIVE' && config.dateField) {
    const rawVal = resolveFieldValue(config.dateField, contextData);
    if (rawVal) {
      const baseDate = new Date(rawVal);
      if (!isNaN(baseDate.getTime())) {
        const offsetDays = Number(config.relativeOffsetDays) || 0;
        target = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
      }
    }
  } else if (config.delayType === 'RELATIVE' || !config.delayType) {
    const duration = Number(config.duration) || 5;
    const unit = config.unit || 'MINUTES';
    let ms = duration * 60 * 1000;
    if (unit === 'HOURS') ms = duration * 60 * 60 * 1000;
    if (unit === 'DAYS') ms = duration * 24 * 60 * 60 * 1000;
    target = new Date(now.getTime() + ms);
  }

  // Business hours check (if enabled, shift to 9am if outside 9am-6pm)
  if (config.businessHoursOnly) {
    const hours = target.getHours();
    if (hours < 9) target.setHours(9, 0, 0, 0);
    else if (hours >= 18) {
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    }
  }

  // Skip Sundays
  if (config.skipWeekends && target.getDay() === 0) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

/**
 * Executes a single workflow node.
 */
export async function executeNode(
  node: WorkflowNode,
  context: WorkflowExecutionContext
): Promise<StepExecutionResult> {
  const startTime = Date.now();

  // If node is disabled by administrator, skip execution
  if (node.disabled) {
    return {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      status: 'SKIPPED',
      outputPayload: { skipped: true, reason: 'Node disabled by administrator' },
      durationMs: Date.now() - startTime,
    };
  }

  try {
    switch (node.type) {
      case 'TRIGGER': {
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: 'TRIGGER',
          status: 'SUCCESS',
          outputPayload: context.payload.data,
          durationMs: Date.now() - startTime,
        };
      }

      case 'CONDITION_GROUP': {
        const evalResult = evaluateConditionGroup(node.config.group, context.variables);
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: 'CONDITION_GROUP',
          status: evalResult.passed ? 'SUCCESS' : 'SKIPPED',
          outputPayload: { passed: evalResult.passed, details: evalResult.details },
          durationMs: Date.now() - startTime,
        };
      }

      case 'BRANCH': {
        const evalResult = evaluateConditionGroup(node.config.conditionGroup, context.variables);
        const chosenBranch = evalResult.passed ? 'TRUE' : 'FALSE';
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: 'BRANCH',
          status: 'SUCCESS',
          chosenBranch,
          outputPayload: { passed: evalResult.passed, branch: chosenBranch, details: evalResult.details },
          durationMs: Date.now() - startTime,
        };
      }

      case 'MULTI_BRANCH': {
        const multiNode = node as MultiBranchWorkflowNode;
        const branches = multiNode.config.branches || [];
        let chosenBranch = 'DEFAULT';

        for (const branch of branches) {
          const res = evaluateConditionGroup(branch.conditionGroup, context.variables);
          if (res.passed) {
            chosenBranch = branch.name || branch.id;
            break;
          }
        }

        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: 'MULTI_BRANCH',
          status: 'SUCCESS',
          chosenBranch: chosenBranch as any,
          outputPayload: { chosenBranch },
          durationMs: Date.now() - startTime,
        };
      }

      case 'FILTER': {
        const filterNode = node as FilterWorkflowNode;
        const evalResult = evaluateConditionGroup(filterNode.config.conditionGroup, context.variables);
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: 'FILTER',
          status: evalResult.passed ? 'SUCCESS' : 'SKIPPED',
          outputPayload: { passed: evalResult.passed, filterAction: filterNode.config.failureAction || 'STOP' },
          durationMs: Date.now() - startTime,
        };
      }

      case 'APPROVAL': {
        const approvalNode = node as ApprovalWorkflowNode;
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: 'APPROVAL',
          status: 'WAITING',
          isWaiting: true,
          outputPayload: { approvalRequested: true, title: approvalNode.config.title },
          durationMs: Date.now() - startTime,
        };
      }

      case 'STOP_WORKFLOW': {
        const stopNode = node as StopWorkflowNode;
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: 'STOP_WORKFLOW',
          status: (stopNode.config.status === 'COMPLETED' || stopNode.config.status === 'CANCELLED') ? 'SUCCESS' : (stopNode.config.status as any) || 'SUCCESS',
          outputPayload: { stopped: true, reason: stopNode.config.reason || 'Workflow stopped intentionally' },
          durationMs: Date.now() - startTime,
        };
      }

      case 'ACTION': {
        const actionResult = await executeAction(
          node.config.actionType,
          node.config.params,
          context.variables,
          context.isDryRun
        );

        // If action was SET_VARIABLE, mutate context variables for subsequent nodes
        if (node.config.actionType === 'SET_VARIABLE' && actionResult.output?.variableName) {
          context.variables[actionResult.output.variableName] = actionResult.output.value;
        }

        if (!actionResult.success && !node.config.continueOnFailure) {
          return {
            nodeId: node.id,
            nodeName: node.name,
            nodeType: 'ACTION',
            status: 'FAILED',
            actionType: node.config.actionType,
            inputPayload: node.config.params,
            outputPayload: actionResult.output,
            errorDetails: actionResult.error,
            durationMs: Date.now() - startTime,
          };
        }

        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: 'ACTION',
          status: actionResult.success ? 'SUCCESS' : 'FAILED',
          actionType: node.config.actionType,
          inputPayload: node.config.params,
          outputPayload: actionResult.output,
          errorDetails: actionResult.error,
          durationMs: Date.now() - startTime,
        };
      }

      case 'DELAY': {
        if (context.isDryRun) {
          return {
            nodeId: node.id,
            nodeName: node.name,
            nodeType: 'DELAY',
            status: 'SUCCESS',
            outputPayload: { simulatedDelay: `${node.config.duration || 5} ${node.config.unit || 'MINUTES'}` },
            durationMs: Date.now() - startTime,
          };
        }

        const runAt = calculateDelayTarget(node.config, context.variables);
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: 'DELAY',
          status: 'WAITING',
          nextExecutionTime: runAt,
          isWaiting: true,
          outputPayload: { scheduledRunAt: runAt.toISOString() },
          durationMs: Date.now() - startTime,
        };
      }

      default:
        return {
          nodeId: (node as any).id,
          nodeName: (node as any).name || 'Unknown',
          nodeType: (node as any).type,
          status: 'FAILED',
          errorDetails: `Unsupported node type: ${(node as any).type}`,
          durationMs: Date.now() - startTime,
        };
    }
  } catch (err: any) {
    return {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      status: 'FAILED',
      errorDetails: err.message || 'Execution error in node.',
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Finds the next node(s) to execute based on current node and edges.
 */
export function getNextNode(
  currentNodeId: string,
  stepResult: StepExecutionResult,
  definition: WorkflowDefinition
): WorkflowNode | null {
  const edges = definition.edges || [];

  if (stepResult.nodeType === 'BRANCH') {
    const branchChoice = stepResult.chosenBranch; // 'TRUE' or 'FALSE'
    const matchingEdge = edges.find(
      (e) => e.sourceNodeId === currentNodeId && e.branchType === branchChoice
    );
    if (matchingEdge) {
      return definition.nodes.find((n) => n.id === matchingEdge.targetNodeId) || null;
    }
  }

  if (stepResult.nodeType === 'MULTI_BRANCH') {
    const branchChoice = stepResult.chosenBranch as string;
    const matchingEdge = edges.find(
      (e) => e.sourceNodeId === currentNodeId && (e.branchType === branchChoice || e.branchType === 'DEFAULT')
    );
    if (matchingEdge) {
      return definition.nodes.find((n) => n.id === matchingEdge.targetNodeId) || null;
    }
  }

  // Default next node
  const defaultEdge = edges.find((e) => e.sourceNodeId === currentNodeId);
  if (defaultEdge) {
    return definition.nodes.find((n) => n.id === defaultEdge.targetNodeId) || null;
  }

  return null;
}

/**
 * Runs a complete workflow graph sequentially from startNode.
 */
export async function executeWorkflowGraph(
  definition: WorkflowDefinition,
  startNodeId: string,
  context: WorkflowExecutionContext
): Promise<{ status: string; completedSteps: StepExecutionResult[]; error?: string }> {
  let currentNode: WorkflowNode | null =
    definition.nodes.find((n) => n.id === startNodeId) || definition.nodes[0] || null;

  const completedSteps: StepExecutionResult[] = [];
  let depth = 0;

  while (currentNode && depth < MAX_EXECUTION_DEPTH) {
    depth++;

    // Execute step
    const stepResult = await executeNode(currentNode, context);
    completedSteps.push(stepResult);

    // Save step to database if not in dry-run mode
    if (!context.isDryRun) {
      await db.workflowExecutionStep.create({
        data: {
          executionId: context.executionId,
          nodeId: stepResult.nodeId,
          nodeName: stepResult.nodeName,
          nodeType: stepResult.nodeType,
          actionType: stepResult.actionType || null,
          status: stepResult.status,
          inputPayload: stepResult.inputPayload ? JSON.stringify(maskSensitiveData(stepResult.inputPayload)) : null,
          outputPayload: stepResult.outputPayload ? JSON.stringify(maskSensitiveData(stepResult.outputPayload)) : null,
          errorDetails: stepResult.errorDetails || null,
          durationMs: stepResult.durationMs || 0,
        },
      });
    }

    // If step paused in DELAY or APPROVAL node, handle waiting state
    if (stepResult.status === 'WAITING') {
      if (stepResult.nextExecutionTime) {
        const nextNode = getNextNode(currentNode.id, stepResult, definition);
        if (nextNode && !context.isDryRun) {
          await db.workflowJob.create({
            data: {
              executionId: context.executionId,
              workflowId: context.workflowId,
              nodeId: nextNode.id,
              status: 'PENDING',
              runAt: stepResult.nextExecutionTime,
              payload: JSON.stringify({
                context,
                definition,
                resumeFromNodeId: nextNode.id,
              }),
            },
          });

          // Also enqueue into durable BackgroundJob queue
          try {
            const { enqueueJob } = await import('@/lib/queue/jobQueue');
            await enqueueJob(
              'workflow-delayed-actions',
              `workflow-delayed:${context.executionId}:${nextNode.id}`,
              {
                executionId: context.executionId,
                workflowId: context.workflowId,
                resumeFromNodeId: nextNode.id,
                definition,
                context,
              },
              {
                scheduledAt: stepResult.nextExecutionTime,
                correlationId: context.executionId,
                entityType: 'WorkflowExecution',
                entityId: context.executionId,
              }
            );
          } catch (e) {
            console.error('Failed to enqueue BackgroundJob for workflow delay:', e);
          }

          await db.workflowExecution.update({
            where: { id: context.executionId },
            data: { status: 'WAITING', currentStepId: currentNode.id },
          });
        }
      }

      return { status: 'WAITING', completedSteps };
    }

    // Stop execution early if STOP_WORKFLOW node was reached, or FILTER conditions failed
    if (stepResult.nodeType === 'STOP_WORKFLOW' || (stepResult.nodeType === 'FILTER' && stepResult.status === 'SKIPPED')) {
      const finalStatus = stepResult.nodeType === 'STOP_WORKFLOW' ? stepResult.status : 'COMPLETED';
      if (!context.isDryRun) {
        await db.workflowExecution.update({
          where: { id: context.executionId },
          data: { status: finalStatus, completedAt: new Date() },
        });
      }
      return { status: finalStatus, completedSteps };
    }

    // Stop on failed required action
    if (stepResult.status === 'FAILED') {
      if (!context.isDryRun) {
        await db.workflowExecution.update({
          where: { id: context.executionId },
          data: {
            status: 'FAILED',
            errorLog: stepResult.errorDetails,
            completedAt: new Date(),
          },
        });

        await db.workflowRule.update({
          where: { id: context.workflowId },
          data: { failedExecutions: { increment: 1 } },
        });
      }

      return { status: 'FAILED', completedSteps, error: stepResult.errorDetails };
    }

    // Move to next node
    currentNode = getNextNode(currentNode.id, stepResult, definition);
  }

  // Finished graph successfully
  if (!context.isDryRun) {
    await db.workflowExecution.update({
      where: { id: context.executionId },
      data: {
        status: 'COMPLETED',
        stepCount: completedSteps.length,
        completedAt: new Date(),
      },
    });

    await db.workflowRule.update({
      where: { id: context.workflowId },
      data: { successfulExecutions: { increment: 1 }, lastExecutedAt: new Date() },
    });
  }

  return { status: 'COMPLETED', completedSteps };
}

/**
 * Background worker: processes queued delayed jobs.
 */
export async function processQueuedJobs(): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  const now = new Date();
  const workerId = `worker-${process.pid}-${Date.now()}`;

  // Find and lock pending jobs ready to execute
  const pendingJobs = await db.workflowJob.findMany({
    where: {
      status: { in: ['PENDING', 'RETRYING'] },
      runAt: { lte: now },
      lockedAt: null,
    },
    take: 10,
    orderBy: { priority: 'desc' },
  });

  for (const job of pendingJobs) {
    // Atomic lock claim
    const claimed = await db.workflowJob.updateMany({
      where: { id: job.id, lockedAt: null },
      data: { lockedAt: now, lockedBy: workerId, status: 'PROCESSING' },
    });

    if (claimed.count === 0) continue;

    try {
      const data = JSON.parse(job.payload);
      const { context, definition, resumeFromNodeId } = data;

      const result = await executeWorkflowGraph(definition, resumeFromNodeId, context);

      if (result.status === 'COMPLETED') {
        await db.workflowJob.update({
          where: { id: job.id },
          data: { status: 'COMPLETED', lockedAt: null },
        });
        processed++;
      } else if (result.status === 'FAILED') {
        throw new Error(result.error || 'Job failed execution.');
      }
    } catch (err: any) {
      errors++;
      const nextAttempt = job.attempts + 1;

      if (nextAttempt >= job.maxAttempts) {
        // Dead letter
        await db.workflowJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            lastError: err.message,
            lockedAt: null,
            attempts: nextAttempt,
          },
        });
      } else {
        // Exponential backoff: 1m, 5m, 15m
        const backoffMinutes = Math.pow(nextAttempt, 2) * 2;
        const retryTime = new Date(Date.now() + backoffMinutes * 60 * 1000);

        await db.workflowJob.update({
          where: { id: job.id },
          data: {
            status: 'RETRYING',
            attempts: nextAttempt,
            lastError: err.message,
            runAt: retryTime,
            lockedAt: null,
          },
        });
      }
    }
  }

  return { processed, errors };
}
