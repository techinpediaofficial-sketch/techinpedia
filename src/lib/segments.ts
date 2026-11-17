import { db } from '@/lib/db';

export type ConditionField =
  | 'TAG'
  | 'LEAD_STAGE'
  | 'SOURCE'
  | 'ASSIGNED_EMPLOYEE'
  | 'CITY'
  | 'CUSTOM_FIELD'
  | 'CREATED_DAYS_AGO'
  | 'LAST_INTERACTION_DAYS_AGO'
  | 'OPT_IN_STATUS'
  | 'TOTAL_ORDER_VALUE';

export type ConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'IN'
  | 'NOT_IN'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN_OR_EQUAL'
  | 'IS_EMPTY'
  | 'IS_NOT_EMPTY';

export interface SegmentRule {
  id: string;
  field: ConditionField;
  customFieldKey?: string;
  operator: ConditionOperator;
  value?: any;
}

export interface SegmentRuleGroup {
  logic: 'AND' | 'OR';
  rules: SegmentRule[];
}

export interface SegmentDefinition {
  groups: SegmentRuleGroup[];
  groupLogic?: 'AND' | 'OR';
}

/**
 * Evaluates a single rule against a contact record (including relations)
 */
export function evaluateRuleOnContact(rule: SegmentRule, contact: any): boolean {
  const { field, customFieldKey, operator, value } = rule;

  let contactVal: any = undefined;

  switch (field) {
    case 'TAG': {
      // Tags can be in contact.tags (JSON array or comma separated) or contact.entityTags
      let tags: string[] = [];
      if (typeof contact.tags === 'string') {
        try {
          const parsed = JSON.parse(contact.tags);
          if (Array.isArray(parsed)) tags = parsed.map((t) => String(t).trim().toLowerCase());
        } catch {
          tags = contact.tags.split(',').map((t: string) => t.trim().toLowerCase());
        }
      } else if (Array.isArray(contact.tags)) {
        tags = contact.tags.map((t: any) => String(t).trim().toLowerCase());
      }
      const target = String(value || '').trim().toLowerCase();
      if (operator === 'CONTAINS' || operator === 'EQUALS') {
        return tags.includes(target);
      }
      if (operator === 'NOT_CONTAINS' || operator === 'NOT_EQUALS') {
        return !tags.includes(target);
      }
      return false;
    }

    case 'LEAD_STAGE': {
      contactVal = contact.leadStatus || '';
      break;
    }

    case 'SOURCE': {
      contactVal = contact.source || '';
      break;
    }

    case 'ASSIGNED_EMPLOYEE': {
      contactVal = contact.assignedUserId || '';
      break;
    }

    case 'CITY': {
      // Check custom fields or department/notes
      let parsedCustom: any = {};
      try {
        if (contact.customFields) parsedCustom = JSON.parse(contact.customFields);
      } catch {}
      contactVal = parsedCustom.city || parsedCustom.City || contact.department || '';
      break;
    }

    case 'CUSTOM_FIELD': {
      if (!customFieldKey) return false;
      let parsedCustom: any = {};
      try {
        if (contact.customFields) parsedCustom = JSON.parse(contact.customFields);
      } catch {}
      contactVal = parsedCustom[customFieldKey];
      break;
    }

    case 'CREATED_DAYS_AGO': {
      if (!contact.createdAt) return false;
      const days = (Date.now() - new Date(contact.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      contactVal = days;
      break;
    }

    case 'LAST_INTERACTION_DAYS_AGO': {
      if (!contact.lastInteractionAt) {
        // If no interaction, treat as very large days ago
        contactVal = 99999;
      } else {
        const days = (Date.now() - new Date(contact.lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24);
        contactVal = days;
      }
      break;
    }

    case 'OPT_IN_STATUS': {
      contactVal = contact.optInStatus || 'OPTED_IN';
      break;
    }

    case 'TOTAL_ORDER_VALUE': {
      // Customer lifetime value or sum of deals
      const ltv = contact.customers?.reduce((acc: number, c: any) => acc + (c.lifetimeValue || 0), 0) || 0;
      contactVal = ltv;
      break;
    }

    default:
      return false;
  }

  // Operator evaluation
  switch (operator) {
    case 'EQUALS':
      return String(contactVal || '').toLowerCase() === String(value || '').toLowerCase();
    case 'NOT_EQUALS':
      return String(contactVal || '').toLowerCase() !== String(value || '').toLowerCase();
    case 'CONTAINS':
      return String(contactVal || '').toLowerCase().includes(String(value || '').toLowerCase());
    case 'NOT_CONTAINS':
      return !String(contactVal || '').toLowerCase().includes(String(value || '').toLowerCase());
    case 'GREATER_THAN':
      return Number(contactVal) > Number(value);
    case 'LESS_THAN':
      return Number(contactVal) < Number(value);
    case 'GREATER_THAN_OR_EQUAL':
      return Number(contactVal) >= Number(value);
    case 'LESS_THAN_OR_EQUAL':
      return Number(contactVal) <= Number(value);
    case 'IS_EMPTY':
      return contactVal === null || contactVal === undefined || contactVal === '';
    case 'IS_NOT_EMPTY':
      return contactVal !== null && contactVal !== undefined && contactVal !== '';
    default:
      return false;
  }
}

/**
 * Evaluates whether a contact matches a segment definition
 */
export function evaluateContactInSegment(definition: SegmentDefinition, contact: any): boolean {
  if (!definition || !definition.groups || definition.groups.length === 0) {
    return true; // Empty rule matches all
  }

  const groupLogic = definition.groupLogic || 'AND';

  const groupResults = definition.groups.map((group) => {
    if (!group.rules || group.rules.length === 0) return true;
    if (group.logic === 'OR') {
      return group.rules.some((rule) => evaluateRuleOnContact(rule, contact));
    }
    // Default to AND
    return group.rules.every((rule) => evaluateRuleOnContact(rule, contact));
  });

  if (groupLogic === 'OR') {
    return groupResults.some(Boolean);
  }
  return groupResults.every(Boolean);
}

/**
 * Evaluates all contacts for a company against a segment definition
 */
export async function getMatchingContactsForSegment(
  companyId: string | null,
  rulesJson: string | SegmentDefinition
): Promise<any[]> {
  let definition: SegmentDefinition;
  if (typeof rulesJson === 'string') {
    try {
      definition = JSON.parse(rulesJson);
    } catch {
      definition = { groups: [] };
    }
  } else {
    definition = rulesJson;
  }

  // Fetch company contacts with customer LTV
  const contacts = await db.contact.findMany({
    where: {
      ...(companyId && companyId !== 'master' ? { companyId } : {}),
    },
    include: {
      customers: { select: { lifetimeValue: true } },
    },
  });

  return contacts.filter((c) => evaluateContactInSegment(definition, c));
}
