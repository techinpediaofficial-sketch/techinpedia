export interface FlowNode {
  id: string;
  type: string;
  data: Record<string, any>;
  position?: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface FlowValidationError {
  nodeId?: string;
  code: string;
  message: string;
}

export function validateChatbotFlow(nodes: FlowNode[], edges: FlowEdge[]): {
  isValid: boolean;
  errors: FlowValidationError[];
} {
  const errors: FlowValidationError[] = [];

  if (!nodes || nodes.length === 0) {
    errors.push({ code: 'EMPTY_FLOW', message: 'Flow cannot be empty. Please add nodes.' });
    return { isValid: false, errors };
  }

  // 1. Entry node exists and is unique
  const entryNodes = nodes.filter(n => n.type === 'entry' || n.type === 'trigger');
  if (entryNodes.length === 0) {
    errors.push({ code: 'MISSING_ENTRY', message: 'Flow must have an Entry / Trigger node.' });
  } else if (entryNodes.length > 1) {
    errors.push({ code: 'MULTIPLE_ENTRIES', message: 'Flow can only have one Entry / Trigger node.' });
  }

  const nodeMap = new Map<string, FlowNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  // 2. Validate broken edges
  for (const edge of edges || []) {
    if (!nodeMap.has(edge.source)) {
      errors.push({
        code: 'BROKEN_CONNECTION',
        message: `Edge connects from missing node ID: ${edge.source}`,
      });
    }
    if (!nodeMap.has(edge.target)) {
      errors.push({
        code: 'BROKEN_CONNECTION',
        message: `Edge connects to missing node ID: ${edge.target}`,
      });
    }
  }

  // 3. Node-specific validations
  for (const node of nodes) {
    switch (node.type) {
      case 'send_message': {
        const msgType = node.data?.messageType || 'text';
        if (msgType === 'text' && (!node.data?.text || node.data.text.trim() === '')) {
          errors.push({
            nodeId: node.id,
            code: 'EMPTY_MESSAGE_TEXT',
            message: `Send Message node "${node.data?.label || node.id}" has empty text.`,
          });
        }
        if (msgType === 'template' && !node.data?.templateName) {
          errors.push({
            nodeId: node.id,
            code: 'MISSING_TEMPLATE',
            message: `Template Send node "${node.data?.label || node.id}" requires a template name.`,
          });
        }
        break;
      }

      case 'question': {
        if (!node.data?.questionText || node.data.questionText.trim() === '') {
          errors.push({
            nodeId: node.id,
            code: 'EMPTY_QUESTION',
            message: `Question node "${node.data?.label || node.id}" requires question text.`,
          });
        }
        if (!node.data?.variableName && !node.data?.contactField) {
          errors.push({
            nodeId: node.id,
            code: 'NO_STORAGE_TARGET',
            message: `Question node "${node.data?.label || node.id}" must specify where to store the user response.`,
          });
        }
        break;
      }

      case 'condition': {
        if (!node.data?.conditions || node.data.conditions.length === 0) {
          errors.push({
            nodeId: node.id,
            code: 'EMPTY_CONDITION',
            message: `Condition node "${node.data?.label || node.id}" must have at least one rule.`,
          });
        }
        break;
      }

      case 'buttons': {
        const btns = node.data?.buttons || [];
        if (btns.length === 0) {
          errors.push({
            nodeId: node.id,
            code: 'NO_BUTTONS',
            message: `Buttons node "${node.data?.label || node.id}" must have at least one button (up to 3).`,
          });
        } else if (btns.length > 3) {
          errors.push({
            nodeId: node.id,
            code: 'TOO_MANY_BUTTONS',
            message: `Buttons node "${node.data?.label || node.id}" cannot have more than 3 buttons for WhatsApp.`,
          });
        }
        break;
      }

      case 'assign_employee': {
        if (!node.data?.assignType && !node.data?.userId) {
          errors.push({
            nodeId: node.id,
            code: 'NO_ASSIGNMENT_TARGET',
            message: `Assign node "${node.data?.label || node.id}" must specify an assignment target.`,
          });
        }
        break;
      }
    }
  }

  // 4. Detect tight infinite loops (cycles containing 0 questions or delays)
  const outgoing = new Map<string, string[]>();
  for (const n of nodes) outgoing.set(n.id, []);
  for (const e of edges || []) {
    if (outgoing.has(e.source)) {
      outgoing.get(e.source)!.push(e.target);
    }
  }

  // Check for immediate self-loop
  outgoing.forEach((targets, src) => {
    if (targets.includes(src)) {
      errors.push({
        nodeId: src,
        code: 'SELF_LOOP',
        message: `Node connects directly to itself, creating an illegal infinite loop.`,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
