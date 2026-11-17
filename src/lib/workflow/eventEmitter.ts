// ============================================================
// Central Workflow Event Emitter
// ============================================================

import { db } from '../db';
import { TriggerPayload, WorkflowExecutionContext, WorkflowDefinition } from './types';
import { executeWorkflowGraph } from './queueEngine';
import { migrateLegacyRuleToGraph } from './legacyMigrator';

/**
 * Dispatches an event to all matching published workflows.
 */
export async function emitWorkflowEvent(
  eventName: string,
  payload: TriggerPayload
): Promise<{ triggeredCount: number; executionIds: string[] }> {
  const executionIds: string[] = [];

  try {
    // Extract target company from event payload
    const eventCompanyId = payload.data?.companyId || payload.data?.lead?.companyId || null;

    // 1. Find all active workflows listening to this trigger event strictly scoped to this company
    const activeRules = await db.workflowRule.findMany({
      where: {
        companyId: eventCompanyId,
        OR: [
          { trigger: eventName },
          { trigger: { contains: eventName } },
        ],
        isActive: true,
        status: 'PUBLISHED', // Only execute officially published workflows
      },
    });

    if (activeRules.length === 0) {
      return { triggeredCount: 0, executionIds: [] };
    }

    for (const rule of activeRules) {
      // 2. Generate Idempotency Key
      const timestampBucket = Math.floor(Date.now() / (5 * 60 * 1000)); // 5-minute window
      const idempotencyKey = `${eventName}:${payload.entityType}:${payload.entityId}:${rule.id}:${timestampBucket}`;

      // Check existing execution with this key to prevent duplicate runs
      const existing = await db.workflowExecution.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        continue;
      }

      // 3. Load or migrate workflow definition
      let definition: WorkflowDefinition;
      if (rule.nodes) {
        try {
          definition = {
            nodes: JSON.parse(rule.nodes),
            edges: rule.edges ? JSON.parse(rule.edges) : [],
          };
        } catch {
          definition = migrateLegacyRuleToGraph(rule);
        }
      } else {
        definition = migrateLegacyRuleToGraph(rule);
      }

      if (!definition.nodes || definition.nodes.length === 0) {
        continue;
      }

      // 4. Create Execution Record
      const execution = await db.workflowExecution.create({
        data: {
          workflowId: rule.id,
          workflowVersion: rule.version,
          triggerEvent: eventName,
          triggerPayload: JSON.stringify(payload),
          idempotencyKey,
          status: 'RUNNING',
        },
      });

      executionIds.push(execution.id);

      // Increment rule counter
      await db.workflowRule.update({
        where: { id: rule.id },
        data: { totalExecutions: { increment: 1 } },
      });

      const resolvedLead = payload.data?.lead || {
        name: payload.data?.message?.senderName || 'Valued Customer',
        phone: payload.data?.message?.from || '',
        service: 'General Inquiry',
      };

      // 5. Build Execution Context
      const context: WorkflowExecutionContext = {
        executionId: execution.id,
        workflowId: rule.id,
        workflowVersion: rule.version,
        triggerEvent: eventName,
        payload,
        variables: {
          ...payload.data,
          lead: resolvedLead,
          entityId: payload.entityId,
          entityType: payload.entityType,
          companyId: rule.companyId || eventCompanyId,
        },
        stepResults: {},
      };

      // 6. Execute graph asynchronously
      const startNodeId = definition.nodes[0].id;
      executeWorkflowGraph(definition, startNodeId, context).catch((err) => {
        console.error(`Workflow execution ${execution.id} unhandled error:`, err);
      });
    }

    return { triggeredCount: executionIds.length, executionIds };
  } catch (error) {
    console.error(`Failed to emit workflow event ${eventName}:`, error);
    return { triggeredCount: 0, executionIds: [] };
  }
}
