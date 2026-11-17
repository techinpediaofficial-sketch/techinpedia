// ============================================================
// Condition Group Evaluator
// ============================================================

import { ConditionGroup, ConditionRule, ComparisonOperator } from './types';

export interface ConditionEvaluationDetail {
  field: string;
  operator: string;
  expectedValue: any;
  actualValue: any;
  passed: boolean;
}

export interface GroupEvaluationResult {
  passed: boolean;
  details: ConditionEvaluationDetail[];
}

/**
 * Resolves dot-notation path on an object (e.g. "lead.score" -> data.lead?.score).
 */
export function resolveFieldValue(path: string, context: Record<string, any>): any {
  if (!path) return undefined;

  // Direct key lookup
  if (path in context) return context[path];

  // Try dot navigation
  const parts = path.split('.');
  let current: any = context;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }

  return current;
}

/**
 * Compares two values using standard comparison operator.
 */
export function evaluateRule(actual: any, operator: ComparisonOperator, expected: any): boolean {
  // Handle empty / null checks
  if (operator === 'is_empty') {
    return actual === null || actual === undefined || actual === '' || (Array.isArray(actual) && actual.length === 0);
  }
  if (operator === 'is_not_empty') {
    return actual !== null && actual !== undefined && actual !== '' && (!Array.isArray(actual) || actual.length > 0);
  }

  // Treat missing value as empty string / 0
  const normalizedActual = actual === null || actual === undefined ? '' : actual;
  const normalizedExpected = expected === null || expected === undefined ? '' : expected;

  switch (operator) {
    case 'equals': {
      if (typeof normalizedActual === 'number' || !isNaN(Number(normalizedActual))) {
        return Number(normalizedActual) === Number(normalizedExpected);
      }
      return String(normalizedActual).trim().toLowerCase() === String(normalizedExpected).trim().toLowerCase();
    }

    case 'not_equals': {
      if (typeof normalizedActual === 'number' || !isNaN(Number(normalizedActual))) {
        return Number(normalizedActual) !== Number(normalizedExpected);
      }
      return String(normalizedActual).trim().toLowerCase() !== String(normalizedExpected).trim().toLowerCase();
    }

    case 'contains': {
      return String(normalizedActual).toLowerCase().includes(String(normalizedExpected).toLowerCase());
    }

    case 'not_contains': {
      return !String(normalizedActual).toLowerCase().includes(String(normalizedExpected).toLowerCase());
    }

    case 'starts_with': {
      return String(normalizedActual).toLowerCase().startsWith(String(normalizedExpected).toLowerCase());
    }

    case 'ends_with': {
      return String(normalizedActual).toLowerCase().endsWith(String(normalizedExpected).toLowerCase());
    }

    case 'greater_than': {
      return Number(normalizedActual) > Number(normalizedExpected);
    }

    case 'greater_than_or_equal': {
      return Number(normalizedActual) >= Number(normalizedExpected);
    }

    case 'less_than': {
      return Number(normalizedActual) < Number(normalizedExpected);
    }

    case 'less_than_or_equal': {
      return Number(normalizedActual) <= Number(normalizedExpected);
    }

    case 'in_list': {
      const list = Array.isArray(normalizedExpected)
        ? normalizedExpected.map((x) => String(x).toLowerCase().trim())
        : String(normalizedExpected).split(',').map((x) => x.toLowerCase().trim());
      return list.includes(String(normalizedActual).toLowerCase().trim());
    }

    case 'not_in_list': {
      const list = Array.isArray(normalizedExpected)
        ? normalizedExpected.map((x) => String(x).toLowerCase().trim())
        : String(normalizedExpected).split(',').map((x) => x.toLowerCase().trim());
      return !list.includes(String(normalizedActual).toLowerCase().trim());
    }

    case 'matches_regex': {
      try {
        const regex = new RegExp(String(normalizedExpected), 'i');
        return regex.test(String(normalizedActual));
      } catch {
        return false;
      }
    }

    default:
      return false;
  }
}

/**
 * Evaluates a single condition group with nested groups and AND/OR logic.
 */
export function evaluateConditionGroup(
  group: ConditionGroup,
  contextData: Record<string, any>
): GroupEvaluationResult {
  const details: ConditionEvaluationDetail[] = [];

  if (!group || (!group.rules?.length && !group.groups?.length)) {
    return { passed: true, details: [] };
  }

  const isAnd = group.logicalOperator === 'AND';

  // Evaluate direct rules
  for (const rule of group.rules || []) {
    const actualValue = resolveFieldValue(rule.field, contextData);
    const passed = evaluateRule(actualValue, rule.operator, rule.value);

    details.push({
      field: rule.field,
      operator: rule.operator,
      expectedValue: rule.value,
      actualValue,
      passed,
    });

    // Short-circuit
    if (isAnd && !passed) {
      return { passed: false, details };
    }
    if (!isAnd && passed) {
      return { passed: true, details };
    }
  }

  // Evaluate nested sub-groups
  for (const subGroup of group.groups || []) {
    const subResult = evaluateConditionGroup(subGroup, contextData);
    details.push(...subResult.details);

    if (isAnd && !subResult.passed) {
      return { passed: false, details };
    }
    if (!isAnd && subResult.passed) {
      return { passed: true, details };
    }
  }

  // If AND, all passed; if OR and reached here, none passed
  return {
    passed: isAnd,
    details,
  };
}
