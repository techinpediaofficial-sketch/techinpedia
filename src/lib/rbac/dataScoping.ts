import { TokenPayload } from '../auth';

export type ScopeLevel = 'GLOBAL' | 'DEPARTMENT' | 'TEAM' | 'OWN';

/**
 * Determines the data visibility scope of the authenticated user based on role and permissions.
 */
export function getStaffScope(session: TokenPayload | null): ScopeLevel {
  if (!session) return 'OWN';

  // 1. Super Admin and Management have unrestricted global scope
  if (
    session.role === 'SUPER_ADMIN' ||
    session.appRoleName === 'SUPER_ADMIN' ||
    session.appRoleName === 'MANAGEMENT'
  ) {
    return 'GLOBAL';
  }

  // 2. Department heads or departmental managers
  if (
    session.appRoleName === 'SALES_MANAGER' ||
    session.appRoleName === 'HR_ADMIN' ||
    session.appRoleName === 'FINANCE_MANAGER'
  ) {
    return 'DEPARTMENT';
  }

  // 3. Team leaders have team-level scope
  if (session.appRoleName === 'TEAM_LEADER' || session.teamId) {
    if (session.appRoleName === 'TEAM_LEADER') {
      return 'TEAM';
    }
  }

  // 4. Default to individual own records
  return 'OWN';
}

/**
 * Returns Prisma filter for Leads/Enquiries based on staff scope.
 */
export function getLeadFilter(session: TokenPayload | null): Record<string, unknown> {
  if (!session) return { id: '__NONE__' };

  const scope = getStaffScope(session);
  if (scope === 'GLOBAL') return {};

  if (scope === 'DEPARTMENT' && session.departmentId) {
    return {
      OR: [
        { assignedToId: session.userId },
        { departmentId: session.departmentId },
        { assignedToId: null }, // Unassigned pool
      ],
    };
  }

  if (scope === 'TEAM' && session.teamId) {
    return {
      OR: [
        { assignedToId: session.userId },
        { teamId: session.teamId },
      ],
    };
  }

  // Default: Own assigned records
  return { assignedToId: session.userId };
}

/**
 * Returns Prisma filter for Deals based on staff scope.
 */
export function getDealFilter(session: TokenPayload | null): Record<string, unknown> {
  if (!session) return { id: '__NONE__' };

  const scope = getStaffScope(session);
  if (scope === 'GLOBAL') return {};

  if (scope === 'DEPARTMENT' && session.departmentId) {
    return {
      OR: [
        { createdById: session.userId },
        { team: { departmentId: session.departmentId } },
      ],
    };
  }

  if (scope === 'TEAM' && session.teamId) {
    return {
      OR: [
        { createdById: session.userId },
        { teamId: session.teamId },
      ],
    };
  }

  return { createdById: session.userId };
}

/**
 * Returns Prisma filter for Employees.
 */
export function getEmployeeFilter(session: TokenPayload | null): Record<string, unknown> {
  if (!session) return { id: '__NONE__' };

  if (
    session.role === 'SUPER_ADMIN' ||
    session.appRoleName === 'SUPER_ADMIN' ||
    session.appRoleName === 'HR_ADMIN' ||
    session.appRoleName === 'HR_MANAGER' ||
    session.permissions?.includes('hr.employees.view')
  ) {
    return {};
  }

  if (session.appRoleName === 'TEAM_LEADER' && session.teamId) {
    return {
      OR: [
        { id: session.employeeId || '__SELF__' },
        { teamId: session.teamId },
      ],
    };
  }

  return { id: session.employeeId || '__NONE__' };
}

/**
 * Returns Prisma filter for Attendance.
 */
export function getAttendanceFilter(session: TokenPayload | null): Record<string, unknown> {
  if (!session) return { id: '__NONE__' };

  if (
    session.role === 'SUPER_ADMIN' ||
    session.appRoleName === 'SUPER_ADMIN' ||
    session.appRoleName === 'HR_ADMIN' ||
    session.permissions?.includes('attendance.manage') ||
    session.permissions?.includes('hr.attendance.manage')
  ) {
    return {};
  }

  if (
    (session.appRoleName === 'TEAM_LEADER' || session.permissions?.includes('attendance.team')) &&
    session.teamId
  ) {
    return {
      OR: [
        { employeeId: session.employeeId || '__SELF__' },
        { employee: { teamId: session.teamId } },
      ],
    };
  }

  return { employeeId: session.employeeId || '__NONE__' };
}

/**
 * Returns Prisma filter for Leave requests.
 */
export function getLeaveFilter(session: TokenPayload | null): Record<string, unknown> {
  if (!session) return { id: '__NONE__' };

  if (
    session.role === 'SUPER_ADMIN' ||
    session.appRoleName === 'SUPER_ADMIN' ||
    session.appRoleName === 'HR_ADMIN' ||
    session.permissions?.includes('leave.hr.approve') ||
    session.permissions?.includes('hr.leaves.manage')
  ) {
    return {};
  }

  if (
    (session.appRoleName === 'TEAM_LEADER' || session.permissions?.includes('leave.team.approve')) &&
    session.teamId
  ) {
    return {
      OR: [
        { employeeId: session.employeeId || '__SELF__' },
        { employee: { teamId: session.teamId } },
      ],
    };
  }

  return { employeeId: session.employeeId || '__NONE__' };
}
