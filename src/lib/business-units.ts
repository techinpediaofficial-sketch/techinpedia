import { TokenPayload } from './auth';
import { Role } from '@prisma/client';
import { AuthorizationError } from './auth-errors';
import { db } from './db';

/**
 * Returns a list of accessible Business Unit IDs for the current session.
 * For SUPER_ADMIN, it returns ['*']. For others, explicit assigned units.
 */
export function getAccessibleBusinessUnits(session: TokenPayload | null): string[] {
  if (!session) return [];
  if (session.role === 'SUPER_ADMIN') {
    return ['*'];
  }
  return session.businessUnitIds || [];
}

/**
 * PHASE 1.1 SECURITY FIX:
 * Validates if the session has access to a specific Business Unit.
 *
 * CHANGED BEHAVIOUR: null businessUnitId now FAILS CLOSED for normal users.
 * Unscoped/historical records (null BU) are only accessible to SUPER_ADMIN
 * for migration/cleanup purposes.
 *
 * Previously this returned `true` for null BU which was too permissive.
 */
export function canAccessBusinessUnit(session: TokenPayload | null, businessUnitId: string | null): boolean {
  const accessibleUnits = getAccessibleBusinessUnits(session);

  // SUPER_ADMIN has wildcard access including null BU cleanup
  if (accessibleUnits.includes('*')) return true;

  // PHASE 1.1 FIX: Normal users cannot access records with null/unscoped BU
  // This prevents unassigned historical records from leaking to all users
  if (!businessUnitId) return false;

  return accessibleUnits.includes(businessUnitId);
}

/**
 * Explicitly grants SUPER_ADMIN cleanup access to null BU records.
 * Use this ONLY in admin migration/cleanup flows, never in regular CRM queries.
 */
export function canAccessNullBusinessUnitForCleanup(session: TokenPayload | null): boolean {
  const accessibleUnits = getAccessibleBusinessUnits(session);
  return accessibleUnits.includes('*');
}

/**
 * Throws an error if the session does not have access to the specified Business Unit.
 */
export function requireBusinessUnitAccess(session: TokenPayload | null, businessUnitId: string | null) {
  if (!canAccessBusinessUnit(session, businessUnitId)) {
    throw new AuthorizationError('Forbidden: You do not have access to this Business Unit.');
  }
}

/**
 * Builds a Prisma-compatible businessUnitId filter for the given session.
 * Returns undefined (no filter) for SUPER_ADMIN.
 * Returns { in: [...accessibleIds] } for normal users.
 *
 * IMPORTANT: This does NOT include null BU in the result for normal users.
 * Use SUPER_ADMIN access + canAccessNullBusinessUnitForCleanup() for cleanup queries.
 */
export function buildBusinessUnitFilter(
  session: TokenPayload | null,
  requestedBusinessUnitId?: string | null
): { in: string[] } | string | undefined {
  const accessibleUnits = getAccessibleBusinessUnits(session);

  // SUPER_ADMIN: apply specific filter if requested, otherwise no constraint
  if (accessibleUnits.includes('*')) {
    if (requestedBusinessUnitId) return requestedBusinessUnitId;
    return undefined; // no filter = see everything
  }

  if (accessibleUnits.length === 0) {
    // User has no assigned units: deny by returning impossible filter
    return { in: [] };
  }

  if (requestedBusinessUnitId) {
    // Ensure requested unit is within allowed units
    if (!accessibleUnits.includes(requestedBusinessUnitId)) {
      throw new AuthorizationError('Forbidden: You do not have access to this Business Unit.');
    }
    return requestedBusinessUnitId;
  }

  return { in: accessibleUnits };
}

/**
 * Validates if the session has access to a specific Business Unit (throws on violation).
 */
export async function canEmployeeAccessBusinessUnit(employeeId: string, businessUnitId: string | null): Promise<boolean> {
  // PHASE 1.1 FIX: employees also cannot access null BU implicitly
  if (!businessUnitId) return false;

  const mapping = await db.employeeBusinessUnit.findUnique({
    where: {
      employeeId_businessUnitId: {
        employeeId,
        businessUnitId
      }
    }
  });

  return !!mapping;
}

/**
 * Returns Business Units explicitly assigned to an employee.
 */
export async function getEmployeeBusinessUnitIds(employeeId: string): Promise<string[]> {
  const mappings = await db.employeeBusinessUnit.findMany({
    where: { employeeId },
    select: { businessUnitId: true }
  });
  return mappings.map(m => m.businessUnitId);
}
