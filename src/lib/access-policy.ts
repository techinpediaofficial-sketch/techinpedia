/**
 * ACCESS POLICY SERVICE
 * 
 * Centralised, server-side policy enforcement for conversations and leads.
 * Use these functions in every API handler — never scatter permission checks inline.
 * 
 * canUserAccessConversation(session, conversation) — WhatsApp conversations
 * canUserAccessLead(session, lead)                 — CRM Leads
 * 
 * Rules evaluated in order:
 * 1. SUPER_ADMIN: platform-level access according to existing architecture
 * 2. Tenant isolation: companyId must match session.companyId (non-negotiable)
 * 3. ResourceVisibility override: explicit visibility policy set by owner/manager
 * 4. Role-based default: OWNER/ADMIN/MANAGER see all; AGENT sees assigned only
 */

import { db } from './db';
import { TokenPayload } from './auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: string };

interface ConversationRecord {
  id: string;
  companyId?: string | null;
  assignedUserId?: string | null;
}

interface LeadRecord {
  id: string;
  companyId?: string | null;
  assignedTo?: string | null;
  assignedEmployeeId?: string | null;
}

export function isOwnerOrAdmin(session: TokenPayload): boolean {
  if (session.role === 'SUPER_ADMIN' || session.appRoleName === 'SUPER_ADMIN') return true;
  if (session.isTenant && session.companyId) {
    const role = (session.companyRole || '').toUpperCase();
    return ['OWNER', 'ADMIN'].includes(role);
  }
  return false;
}

export function isManager(session: TokenPayload): boolean {
  if (session.role === 'SUPER_ADMIN' || session.appRoleName === 'SUPER_ADMIN') return true;
  if (session.isTenant && session.companyId) {
    const role = (session.companyRole || '').toUpperCase();
    return ['OWNER', 'ADMIN', 'MANAGER'].includes(role);
  }
  if (session.appRoleName === 'SALES_MANAGER' || session.appRoleName === 'TEAM_LEADER' || session.appRoleName === 'MANAGEMENT') return true;
  if (session.permissions?.includes('cockpit.manager.view') || session.permissions?.includes('crm.leads.assign')) return true;
  return false;
}

/**
 * Returns user IDs accessible to the current session:
 * - null: Unrestricted across the company (OWNER, ADMIN, SUPER_ADMIN)
 * - string[]: Restricted to specific users (MANAGER -> team members + self; AGENT -> self only)
 */
export async function getAccessibleUserIdsForUser(session: TokenPayload): Promise<string[] | null> {
  if (isOwnerOrAdmin(session)) {
    return null; // All users in the company
  }

  const role = (session.companyRole || '').toUpperCase();
  if (role === 'MANAGER') {
    try {
      // Find team members or direct reports
      const employee = session.employeeId
        ? await db.employee.findUnique({
            where: { id: session.employeeId },
            include: { teamsLed: true, directReports: { include: { user: { select: { id: true } } } } },
          })
        : null;

      const teamIds: string[] = [];
      if (session.teamId) teamIds.push(session.teamId);
      if (employee?.teamsLed) {
        for (const t of employee.teamsLed) teamIds.push(t.id);
      }

      // Collect user IDs in those teams
      const teamEmployees = teamIds.length > 0
        ? await db.employee.findMany({
            where: { teamId: { in: teamIds } },
            include: { user: { select: { id: true, companyId: true } } },
          })
        : [];

      const userIds = new Set<string>([session.userId]);
      for (const emp of teamEmployees) {
        if (emp.user?.id) {
          if (!session.companyId || emp.user.companyId === session.companyId) {
            userIds.add(emp.user.id);
          }
        }
      }
      if (employee?.directReports) {
        for (const rep of employee.directReports) {
          if (rep.user?.id) {
            userIds.add(rep.user.id);
          }
        }
      }

      return Array.from(userIds);
    } catch {
      return [session.userId];
    }
  }

  // Normal employee/agent: self only
  return [session.userId];
}

export interface VisibilityPolicy {
  visibilityType: string;
  employeeIds: string[];
  teamIds: string[];
  departmentIds: string[];
}

/**
 * Load the ResourceVisibility policy for a given resource.
 * Returns null if no policy is set (defaults to role-based fallback).
 */
async function loadVisibilityPolicy(
  resourceType: 'LEAD' | 'WHATSAPP_CONVERSATION',
  resourceId: string
): Promise<VisibilityPolicy | null> {
  try {
    const record = await db.resourceVisibility.findUnique({
      where: { resourceType_resourceId: { resourceType, resourceId } },
    });
    if (!record) return null;
    return {
      visibilityType: record.visibilityType,
      employeeIds: parseJsonArray(record.employeeIds),
      teamIds: parseJsonArray(record.teamIds),
      departmentIds: parseJsonArray(record.departmentIds),
    };
  } catch {
    return null;
  }
}

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Main Policy Functions ─────────────────────────────────────────────────────

/**
 * Determines if a user session can access a WhatsApp conversation.
 * Must be called BEFORE returning any conversation data from an API.
 */
export async function canUserAccessConversation(
  session: TokenPayload,
  conversation: ConversationRecord,
  explicitPolicy?: VisibilityPolicy | null
): Promise<AccessResult> {
  // 1. SUPER_ADMIN: platform-level, can see anything
  if (session.role === 'SUPER_ADMIN') {
    return { allowed: true };
  }

  // 2. Tenant isolation — non-negotiable, derived from auth, not from client
  const userCompany = session.companyId || null;
  const resourceCompany = conversation.companyId || null;
  if (userCompany !== resourceCompany) {
    return { allowed: false, reason: 'TENANT_ISOLATION' };
  }

  // 3. Check explicit ResourceVisibility policy if one exists
  const policy = explicitPolicy !== undefined
    ? explicitPolicy
    : await loadVisibilityPolicy('WHATSAPP_CONVERSATION', conversation.id);

  if (policy) {
    return evaluateVisibilityPolicy(policy, session, conversation.assignedUserId);
  }

  // 4. Default role-based fallback:
  // OWNER/ADMIN: full access within their tenant
  if (isOwnerOrAdmin(session)) {
    return { allowed: true };
  }

  // If assigned to current user:
  if (conversation.assignedUserId === session.userId) {
    return { allowed: true };
  }

  // If user is a MANAGER: can access team members' conversations or unassigned conversations
  const role = (session.companyRole || '').toUpperCase();
  if (role === 'MANAGER') {
    if (!conversation.assignedUserId) {
      // Unassigned conversation can be viewed/assigned by manager
      return { allowed: true };
    }
    const accessibleUserIds = await getAccessibleUserIdsForUser(session);
    if (accessibleUserIds && accessibleUserIds.includes(conversation.assignedUserId)) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'MANAGER_OUTSIDE_TEAM' };
  }

  // Default: deny unless assigned
  return { allowed: false, reason: 'NOT_ASSIGNED' };
}

/**
 * Determines if a user session can access a CRM Lead.
 * Must be called BEFORE returning any lead data from an API.
 */
export async function canUserAccessLead(
  session: TokenPayload,
  lead: LeadRecord,
  explicitPolicy?: VisibilityPolicy | null
): Promise<AccessResult> {
  // 1. SUPER_ADMIN: platform-level access
  if (session.role === 'SUPER_ADMIN') {
    return { allowed: true };
  }

  // 2. Tenant isolation
  const userCompany = session.companyId || null;
  const resourceCompany = lead.companyId || null;
  if (userCompany !== resourceCompany) {
    return { allowed: false, reason: 'TENANT_ISOLATION' };
  }

  // 3. Check explicit ResourceVisibility policy
  const policy = explicitPolicy !== undefined
    ? explicitPolicy
    : await loadVisibilityPolicy('LEAD', lead.id);

  if (policy) {
    return evaluateVisibilityPolicy(
      policy,
      session,
      lead.assignedTo || lead.assignedEmployeeId
    );
  }

  // 4. OWNER/ADMIN: full access within tenant
  if (isOwnerOrAdmin(session)) {
    return { allowed: true };
  }

  // 5. Assigned agent/user can see their leads
  if (
    lead.assignedTo === session.userId ||
    lead.assignedEmployeeId === session.employeeId
  ) {
    return { allowed: true };
  }

  // 6. Manager can see team members' leads or unassigned leads
  const role = (session.companyRole || '').toUpperCase();
  if (role === 'MANAGER') {
    if (!lead.assignedTo && !lead.assignedEmployeeId) {
      return { allowed: true };
    }
    const accessibleUserIds = await getAccessibleUserIdsForUser(session);
    if (lead.assignedTo && accessibleUserIds && accessibleUserIds.includes(lead.assignedTo)) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'MANAGER_OUTSIDE_TEAM' };
  }

  return { allowed: false, reason: 'NOT_ASSIGNED' };
}

/**
 * Evaluate a ResourceVisibility policy against a session.
 */
function evaluateVisibilityPolicy(
  policy: { visibilityType: string; employeeIds: string[]; teamIds: string[]; departmentIds: string[] },
  session: TokenPayload,
  assignedUserId?: string | null
): AccessResult {
  switch (policy.visibilityType) {
    case 'ALL_AUTHORIZED':
      return { allowed: true };

    case 'ASSIGNED_ONLY':
      if (session.userId === assignedUserId) return { allowed: true };
      return { allowed: false, reason: 'VISIBILITY_ASSIGNED_ONLY' };

    case 'SELECTED_EMPLOYEES':
      if (policy.employeeIds.includes(session.userId)) return { allowed: true };
      return { allowed: false, reason: 'VISIBILITY_NOT_SELECTED' };

    case 'SELECTED_TEAM':
      if (session.teamId && policy.teamIds.includes(session.teamId)) return { allowed: true };
      return { allowed: false, reason: 'VISIBILITY_TEAM_RESTRICTED' };

    case 'SELECTED_DEPARTMENT':
      if (session.departmentId && policy.departmentIds.includes(session.departmentId)) return { allowed: true };
      return { allowed: false, reason: 'VISIBILITY_DEPARTMENT_RESTRICTED' };

    case 'MANAGERS_ONLY':
      if (isManager(session)) return { allowed: true };
      return { allowed: false, reason: 'VISIBILITY_MANAGERS_ONLY' };

    case 'OWNER_ONLY':
      if ((session.companyRole || '').toUpperCase() === 'OWNER' || session.role === 'SUPER_ADMIN') return { allowed: true };
      return { allowed: false, reason: 'VISIBILITY_OWNER_ONLY' };

    case 'HIDDEN_FROM_EMPLOYEES':
    case 'HIDDEN': {
      // Allowed: Company Owner, Authorized Company Admin, Explicit privileged role with permission, Super Admin
      const role = (session.companyRole || session.role || '').toUpperCase();
      const hasPrivilegedPerm =
        session.permissions?.includes('crm.leads.view_hidden') ||
        session.permissions?.includes('whatsapp.view_hidden') ||
        session.permissions?.includes('view_hidden_resources') ||
        session.permissions?.includes('VIEW_HIDDEN_RESOURCES');

      if (
        session.role === 'SUPER_ADMIN' ||
        ['OWNER', 'ADMIN'].includes(role) ||
        hasPrivilegedPerm
      ) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'VISIBILITY_HIDDEN_FROM_EMPLOYEES' };
    }

    case 'PLATFORM_RESTRICTED':
      // Hidden from all tenant staff, platform Super Admin only
      if (session.role === 'SUPER_ADMIN') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'VISIBILITY_PLATFORM_RESTRICTED' };

    default:
      return { allowed: true };
  }
}

/**
 * Build the Prisma WHERE clause additions to scope a conversation query to only
 * conversations this user is allowed to see. Used in list endpoints for
 * performance — avoids loading records then filtering in code.
 * 
 * NOTE: This does NOT replace canUserAccessConversation for single-record checks.
 * For single-record fetches (GET /api/.../[id]), always use canUserAccessConversation.
 */
export async function buildConversationAccessFilter(session: TokenPayload): Promise<Record<string, any>> {
  // SUPER_ADMIN: no restriction
  if (session.role === 'SUPER_ADMIN') return {};

  // Tenant isolation: always apply
  const baseFilter: Record<string, any> = {
    companyId: session.companyId || null,
  };

  // OWNER/ADMIN: see all within tenant
  if (isOwnerOrAdmin(session)) return baseFilter;

  const accessibleUserIds = await getAccessibleUserIdsForUser(session);
  if (accessibleUserIds === null) return baseFilter;

  // Managers see team members' chats + unassigned chats; agents only see their own
  return {
    ...baseFilter,
    OR: [
      { assignedUserId: { in: accessibleUserIds } },
      ...(isManager(session) ? [{ assignedUserId: null }] : []),
    ],
  };
}

/**
 * Build the Prisma WHERE clause to scope lead queries by access.
 */
export async function buildLeadAccessFilter(session: TokenPayload): Promise<Record<string, any>> {
  if (session.role === 'SUPER_ADMIN') return {};

  const baseFilter: Record<string, any> = {
    companyId: session.companyId || null,
  };

  if (isOwnerOrAdmin(session)) return baseFilter;

  const accessibleUserIds = await getAccessibleUserIdsForUser(session);
  if (accessibleUserIds === null) return baseFilter;

  return {
    ...baseFilter,
    OR: [
      { assignedTo: { in: accessibleUserIds } },
      ...(isManager(session) ? [{ assignedTo: null, assignedEmployeeId: null }] : []),
      ...(session.employeeId ? [{ assignedEmployeeId: session.employeeId }] : []),
    ],
  };
}

/**
 * Load SLA rules for a company. Falls back to platform defaults (companyId = null).
 */
export async function getSlaRules(companyId: string | null): Promise<SlaRuleMap> {
  const rules = await db.slaRule.findMany({
    where: {
      OR: [
        { companyId },
        { companyId: null }, // platform defaults
      ],
      isActive: true,
    },
  });

  // Company-specific rules override platform defaults
  const map: SlaRuleMap = {};
  // First load platform defaults
  for (const rule of rules.filter(r => !r.companyId)) {
    const key = `${rule.entityType}:${rule.actionType}:${rule.priority}`;
    map[key] = { warningMinutes: rule.warningMinutes, breachMinutes: rule.breachMinutes };
  }
  // Then override with company-specific
  for (const rule of rules.filter(r => r.companyId === companyId)) {
    const key = `${rule.entityType}:${rule.actionType}:${rule.priority}`;
    map[key] = { warningMinutes: rule.warningMinutes, breachMinutes: rule.breachMinutes };
  }

  return map;
}

export interface SlaThreshold {
  warningMinutes: number;
  breachMinutes: number;
}
export type SlaRuleMap = Record<string, SlaThreshold>;

/**
 * Compute SLA status for a given assignment.
 * Returns 'SAFE' | 'WARNING' | 'BREACHED'
 */
export function computeSlaStatus(
  assignedAt: Date | null | undefined,
  slaThreshold: SlaThreshold
): 'SAFE' | 'WARNING' | 'BREACHED' | 'NONE' {
  if (!assignedAt) return 'NONE';

  const elapsedMinutes = (Date.now() - new Date(assignedAt).getTime()) / 60000;

  if (elapsedMinutes >= slaThreshold.breachMinutes) return 'BREACHED';
  if (elapsedMinutes >= slaThreshold.warningMinutes) return 'WARNING';
  return 'SAFE';
}

/**
 * Resolves the effective companyId for a session.
 * - For tenant users (session.isTenant === true): strictly locked to session.companyId.
 * - For Super Admin / platform operators: honors requested companyId, or falls back to first tenant company in DB.
 */
export async function resolveEffectiveCompanyId(
  session: { isTenant?: boolean; companyId?: string | null; role?: string },
  requestedCompanyId?: string | null
): Promise<string | null> {
  if (session.isTenant && session.companyId) {
    return session.companyId;
  }

  if (requestedCompanyId && requestedCompanyId !== 'ALL' && requestedCompanyId !== 'master') {
    return requestedCompanyId;
  }

  if (session.companyId) {
    return session.companyId;
  }

  // Fallback for Super Admin / platform operator when not explicitly specifying company in query
  const defaultCompany = await db.company.findFirst({
    where: { isTenant: true },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  }) || await db.company.findFirst({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  return defaultCompany ? defaultCompany.id : null;
}

/**
 * Returns available companies for company switchers when session is Super Admin or Platform Admin.
 */
export async function getAvailableCompaniesForAdmin(session: { isTenant?: boolean; role?: string }) {
  if (session.isTenant) return [];
  return await db.company.findMany({
    select: {
      id: true,
      name: true,
      isTenant: true,
    },
    orderBy: { name: 'asc' },
  });
}

