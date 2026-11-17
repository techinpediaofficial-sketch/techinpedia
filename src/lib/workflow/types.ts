// ============================================================
// Workflow Engine Core Types & Interfaces
// ============================================================

export type WorkflowStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type WorkflowCategory =
  | 'CRM'
  | 'LEADS'
  | 'SALES'
  | 'FINANCE'
  | 'SUPPORT'
  | 'HARDWARE'
  | 'HRM'
  | 'COMMUNICATIONS'
  | 'CUSTOM';

export type NodeType =
  | 'TRIGGER'
  | 'CONDITION_GROUP'
  | 'BRANCH'
  | 'MULTI_BRANCH'
  | 'FILTER'
  | 'APPROVAL'
  | 'STOP_WORKFLOW'
  | 'ACTION'
  | 'DELAY';

export type ComparisonOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'in_list'
  | 'not_in_list'
  | 'is_empty'
  | 'is_not_empty'
  | 'matches_regex';

export interface ConditionRule {
  id: string;
  field: string; // e.g. "lead.score", "lead.budget", "deal.amount"
  operator: ComparisonOperator;
  value: any;
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'array';
}

export interface ConditionGroup {
  id: string;
  logicalOperator: 'AND' | 'OR';
  rules: ConditionRule[];
  groups?: ConditionGroup[];
}

export interface BaseWorkflowNode {
  id: string;
  name: string;
  type: NodeType;
  description?: string;
  disabled?: boolean;
}

export interface TriggerNodeConfig {
  event: string; // e.g. "crm.lead.created"
  filterConditions?: ConditionGroup;
}

export interface TriggerWorkflowNode extends BaseWorkflowNode {
  type: 'TRIGGER';
  config: TriggerNodeConfig;
}

export interface ConditionWorkflowNode extends BaseWorkflowNode {
  type: 'CONDITION_GROUP';
  config: {
    group: ConditionGroup;
  };
}

export interface BranchWorkflowNode extends BaseWorkflowNode {
  type: 'BRANCH';
  config: {
    conditionGroup: ConditionGroup;
    trueNextNodeId?: string | null;
    falseNextNodeId?: string | null;
  };
}

export interface MultiBranchCase {
  id: string;
  name: string;
  conditionGroup: ConditionGroup;
  targetNodeId?: string | null;
}

export interface MultiBranchWorkflowNode extends BaseWorkflowNode {
  type: 'MULTI_BRANCH';
  config: {
    branches: MultiBranchCase[];
    defaultTargetNodeId?: string | null;
  };
}

export interface FilterWorkflowNode extends BaseWorkflowNode {
  type: 'FILTER';
  config: {
    conditionGroup: ConditionGroup;
    failureAction?: 'STOP' | 'DROP';
  };
}

export interface ApprovalWorkflowNode extends BaseWorkflowNode {
  type: 'APPROVAL';
  config: {
    title: string;
    approverRole?: string;
    approverUserId?: string;
    timeoutHours?: number;
    autoApproveOnTimeout?: boolean;
  };
}

export interface StopWorkflowNode extends BaseWorkflowNode {
  type: 'STOP_WORKFLOW';
  config: {
    reason?: string;
    status?: 'COMPLETED' | 'CANCELLED' | 'FAILED';
  };
}

export interface ActionWorkflowNode extends BaseWorkflowNode {
  type: 'ACTION';
  config: {
    actionType: string; // e.g. "SEND_WHATSAPP", "SEND_EMAIL", "ASSIGN_LEAD"
    params: Record<string, any>;
    retryOnFailure?: boolean;
    maxRetries?: number;
    continueOnFailure?: boolean;
  };
}

export type DelayUnit = 'MINUTES' | 'HOURS' | 'DAYS';

export interface DelayWorkflowNode extends BaseWorkflowNode {
  type: 'DELAY';
  config: {
    delayType: 'RELATIVE' | 'SPECIFIC_TIME' | 'DATE_RELATIVE';
    duration?: number;
    unit?: DelayUnit;
    specificTime?: string; // "09:00"
    businessHoursOnly?: boolean; // 9:00 AM to 6:00 PM Mon-Sat
    skipWeekends?: boolean;
    dateField?: string; // e.g. "invoice.dueDate"
    relativeOffsetDays?: number; // e.g. -2 (2 days before)
  };
}

export type WorkflowNode =
  | TriggerWorkflowNode
  | ConditionWorkflowNode
  | BranchWorkflowNode
  | MultiBranchWorkflowNode
  | FilterWorkflowNode
  | ApprovalWorkflowNode
  | StopWorkflowNode
  | ActionWorkflowNode
  | DelayWorkflowNode;

export interface WorkflowEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  branchType?: 'DEFAULT' | 'TRUE' | 'FALSE';
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface TriggerPayload {
  entityId: string;
  entityType: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface WorkflowExecutionContext {
  executionId: string;
  workflowId: string;
  workflowVersion: number;
  triggerEvent: string;
  payload: TriggerPayload;
  variables: Record<string, any>;
  stepResults: Record<string, any>;
  isDryRun?: boolean;
}

export interface StepExecutionResult {
  nodeId: string;
  nodeName: string;
  nodeType: NodeType;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'WAITING';
  actionType?: string;
  inputPayload?: any;
  outputPayload?: any;
  errorDetails?: string;
  durationMs?: number;
  nextExecutionTime?: Date | null;
  chosenBranch?: 'TRUE' | 'FALSE' | 'DEFAULT';
  isWaiting?: boolean;
}

export interface SimulationResult {
  success: boolean;
  simulatedSteps: {
    nodeId: string;
    nodeName: string;
    nodeType: NodeType;
    status: 'EXECUTED' | 'BRANCH_TAKEN' | 'SKIPPED';
    evaluatedConditions?: {
      field: string;
      operator: string;
      expectedValue: any;
      actualValue: any;
      passed: boolean;
    }[];
    branchChoice?: 'TRUE' | 'FALSE';
    mockActionOutput?: any;
    delayEstimate?: string;
  }[];
  explanation: string[];
}
