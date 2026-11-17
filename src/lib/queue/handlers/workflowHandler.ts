/**
 * Workflow Delayed Actions Queue Worker Handler
 * 
 * Resumes paused/delayed workflows after scheduled delays expire.
 * Survives PM2 restarts, redeployments, and server reboots.
 */

import { db } from '../../db';
import { completeJob, failJob, JobRecord } from '../jobQueue';
import { executeWorkflowGraph } from '../../workflow/queueEngine';

export async function handleWorkflowDelayedJob(job: JobRecord): Promise<void> {
  const { executionId, resumeFromNodeId, definition, context } = job.payload;

  if (!executionId || !resumeFromNodeId || !definition) {
    await completeJob(job.id, { skipped: true, reason: 'Incomplete workflow delayed job payload' });
    return;
  }

  const execution = await db.workflowExecution.findUnique({
    where: { id: executionId },
  });

  if (!execution) {
    await completeJob(job.id, { skipped: true, reason: 'Workflow execution record not found' });
    return;
  }

  // If already completed or failed, do not re-run
  if (execution.status === 'COMPLETED' || execution.status === 'FAILED' || execution.status === 'CANCELLED') {
    await completeJob(job.id, { skipped: true, status: execution.status });
    return;
  }

  try {
    // Update execution to RUNNING
    await db.workflowExecution.update({
      where: { id: executionId },
      data: { status: 'RUNNING' },
    });

    // Resume execution graph
    const result = await executeWorkflowGraph(definition, resumeFromNodeId, context);

    if (result.status === 'COMPLETED') {
      await completeJob(job.id, { status: 'COMPLETED', stepsCount: result.completedSteps.length });
    } else if (result.status === 'WAITING') {
      // Encountered another delay step; the executeWorkflowGraph logic will have scheduled the next job
      await completeJob(job.id, { status: 'WAITING' });
    } else {
      await failJob(job.id, result.error || 'Workflow execution failed during resumption', true);
    }
  } catch (err: any) {
    await failJob(job.id, err.message || 'Error executing delayed workflow step', false);
  }
}
