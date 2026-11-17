// ============================================================
// Legacy Rule to Visual Graph Migrator
// ============================================================

import { WorkflowDefinition, WorkflowNode, WorkflowEdge, TriggerWorkflowNode, ActionWorkflowNode } from './types';

/**
 * Converts a legacy WorkflowRule record into a visual WorkflowDefinition.
 */
export function migrateLegacyRuleToGraph(legacyRule: {
  id: string;
  name: string;
  trigger: string;
  conditions?: string | null;
  actions?: string | null;
}): WorkflowDefinition {
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];

  // Map legacy trigger name to standard trigger code
  let triggerCode = legacyRule.trigger;
  if (triggerCode === 'LEAD_CREATED') triggerCode = 'crm.lead.created';
  if (triggerCode === 'STAGE_CHANGED') triggerCode = 'crm.deal.stage_changed';
  if (triggerCode === 'DEAL_WON') triggerCode = 'crm.deal.won';
  if (triggerCode === 'INVOICE_OVERDUE') triggerCode = 'finance.invoice.overdue';

  // 1. Root Trigger Node
  const triggerNodeId = `node-trigger-${legacyRule.id.slice(0, 8)}`;
  const triggerNode: TriggerWorkflowNode = {
    id: triggerNodeId,
    name: `When: ${legacyRule.name}`,
    type: 'TRIGGER',
    description: `Triggered by event ${triggerCode}`,
    config: {
      event: triggerCode,
    },
  };
  nodes.push(triggerNode);

  // 2. Parse Actions
  let parsedActions: any[] = [];
  try {
    if (legacyRule.actions) {
      parsedActions = JSON.parse(legacyRule.actions);
      if (!Array.isArray(parsedActions)) parsedActions = [parsedActions];
    }
  } catch {
    parsedActions = [];
  }

  let previousNodeId = triggerNodeId;

  parsedActions.forEach((actionObj: any, index: number) => {
    const actionNodeId = `node-action-${index}-${Date.now().toString(36)}`;
    let actionType = actionObj.type || 'SEND_WHATSAPP';

    // Map legacy action types
    if (actionType === 'SEND_WHATSAPP_TEMPLATE') actionType = 'SEND_WHATSAPP';
    if (actionType === 'CREATE_FOLLOW_UP') actionType = 'CREATE_FOLLOW_UP';
    if (actionType === 'ASSIGN_ROUND_ROBIN') actionType = 'ASSIGN_ROUND_ROBIN';

    const actionNode: ActionWorkflowNode = {
      id: actionNodeId,
      name: actionObj.type ? actionObj.type.replace(/_/g, ' ') : `Action ${index + 1}`,
      type: 'ACTION',
      description: actionObj.description || undefined,
      config: {
        actionType,
        params: {
          ...actionObj,
          recipientPhone: actionObj.recipientPhone || '{{lead.phone}}',
          messageText: actionObj.messageText || actionObj.template || 'Hi {{lead.name}}, thank you for contacting TechInPedia.',
        },
      },
    };

    nodes.push(actionNode);

    // Link previous node to this action
    edges.push({
      id: `edge-${previousNodeId}-${actionNodeId}`,
      sourceNodeId: previousNodeId,
      targetNodeId: actionNodeId,
      branchType: 'DEFAULT',
    });

    previousNodeId = actionNodeId;
  });

  return { nodes, edges };
}
