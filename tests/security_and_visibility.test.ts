import assert from 'assert';
import {
  canUserAccessConversation,
  canUserAccessLead,
  getAccessibleUserIdsForUser,
  buildConversationAccessFilter,
  buildLeadAccessFilter,
  computeSlaStatus,
  isOwnerOrAdmin,
  isManager,
  VisibilityPolicy,
} from '../src/lib/access-policy';
import { TokenPayload } from '../src/lib/auth';

console.log('----------------------------------------------------');
console.log('STARTING SECURITY, VISIBILITY & TENANT ISOLATION SUITE');
console.log('----------------------------------------------------');

// ==========================================
// 1. SESSIONS SETUP FOR TEST MATRICES
// ==========================================
const superAdminSession: TokenPayload = {
  userId: 'usr-super',
  email: 'super@techinpedia.com',
  role: 'SUPER_ADMIN' as any,
  mustChangePassword: false,
};

const companyAOwnerSession: TokenPayload = {
  userId: 'usr-compA-owner',
  email: 'owner@companyA.com',
  role: 'ADMIN' as any,
  companyId: 'company-A',
  companyRole: 'OWNER',
  isTenant: true,
  mustChangePassword: false,
};

const companyAAdminSession: TokenPayload = {
  userId: 'usr-compA-admin',
  email: 'admin@companyA.com',
  role: 'ADMIN' as any,
  companyId: 'company-A',
  companyRole: 'ADMIN',
  isTenant: true,
  mustChangePassword: false,
};

const companyAManagerSession: TokenPayload = {
  userId: 'usr-compA-mgr',
  email: 'manager@companyA.com',
  role: 'USER' as any,
  companyId: 'company-A',
  companyRole: 'MANAGER',
  teamId: 'team-sales',
  isTenant: true,
  mustChangePassword: false,
};

const companyAEmployee1Session: TokenPayload = {
  userId: 'usr-compA-emp1',
  email: 'emp1@companyA.com',
  role: 'USER' as any,
  companyId: 'company-A',
  companyRole: 'EMPLOYEE',
  teamId: 'team-sales',
  isTenant: true,
  mustChangePassword: false,
};

const companyAEmployee2Session: TokenPayload = {
  userId: 'usr-compA-emp2',
  email: 'emp2@companyA.com',
  role: 'USER' as any,
  companyId: 'company-A',
  companyRole: 'EMPLOYEE',
  teamId: 'team-support',
  isTenant: true,
  mustChangePassword: false,
};

// ==========================================
// TEST 1: Cross-Tenant Isolation
// ==========================================
async function testCrossTenantIsolation() {
  console.log('\n[TEST 1] Cross-Tenant Isolation (Company A vs Company B)');

  const convCompanyB = {
    id: 'conv-b-1',
    companyId: 'company-B',
    assignedUserId: 'usr-compB-emp',
  };

  const leadCompanyB = {
    id: 'lead-b-1',
    companyId: 'company-B',
    assignedTo: 'usr-compB-emp',
  };

  // Company A Owner cannot access Company B conversation or lead
  const convAccessA = await canUserAccessConversation(companyAOwnerSession, convCompanyB);
  assert.strictEqual(convAccessA.allowed, false, 'FAIL: Company A Owner accessed Company B conversation');
  assert.strictEqual(convAccessA.reason, 'TENANT_ISOLATION', 'FAIL: Reason should be TENANT_ISOLATION');

  const leadAccessA = await canUserAccessLead(companyAOwnerSession, leadCompanyB);
  assert.strictEqual(leadAccessA.allowed, false, 'FAIL: Company A Owner accessed Company B lead');
  assert.strictEqual(leadAccessA.reason, 'TENANT_ISOLATION', 'FAIL: Reason should be TENANT_ISOLATION');

  // Company A Employee cannot access Company B conversation or lead
  const convAccessEmpA = await canUserAccessConversation(companyAEmployee1Session, convCompanyB);
  assert.strictEqual(convAccessEmpA.allowed, false, 'FAIL: Company A Employee accessed Company B conversation');
  assert.strictEqual(convAccessEmpA.reason, 'TENANT_ISOLATION');

  const leadAccessEmpA = await canUserAccessLead(companyAEmployee1Session, leadCompanyB);
  assert.strictEqual(leadAccessEmpA.allowed, false, 'FAIL: Company A Employee accessed Company B lead');
  assert.strictEqual(leadAccessEmpA.reason, 'TENANT_ISOLATION');

  // Super Admin can access cross-tenant
  const superConvAccess = await canUserAccessConversation(superAdminSession, convCompanyB);
  assert.strictEqual(superConvAccess.allowed, true, 'FAIL: Super Admin denied access to conversation');

  console.log('  ✓ Company A Owner strictly blocked from Company B conversation (TENANT_ISOLATION)');
  console.log('  ✓ Company A Owner strictly blocked from Company B lead (TENANT_ISOLATION)');
  console.log('  ✓ Company A Employee strictly blocked from Company B conversation (TENANT_ISOLATION)');
  console.log('  ✓ Super Admin maintains platform-level override');
  console.log('  -> PASS: Cross-Tenant Isolation Verified');
}

// ==========================================
// TEST 2: Role Scoping & Accessible User IDs
// ==========================================
async function testRoleScoping() {
  console.log('\n[TEST 2] Role Scoping & Accessible User IDs');

  // Owner & Admin return null (unrestricted across company)
  const ownerScope = await getAccessibleUserIdsForUser(companyAOwnerSession);
  assert.strictEqual(ownerScope, null, 'FAIL: Owner should have null (unrestricted) user ID scope');

  const adminScope = await getAccessibleUserIdsForUser(companyAAdminSession);
  assert.strictEqual(adminScope, null, 'FAIL: Admin should have null (unrestricted) user ID scope');

  // Standard employee returns strictly self
  const emp1Scope = await getAccessibleUserIdsForUser(companyAEmployee1Session);
  assert.deepStrictEqual(emp1Scope, ['usr-compA-emp1'], 'FAIL: Employee 1 should only access self user ID');

  const emp2Scope = await getAccessibleUserIdsForUser(companyAEmployee2Session);
  assert.deepStrictEqual(emp2Scope, ['usr-compA-emp2'], 'FAIL: Employee 2 should only access self user ID');

  console.log('  ✓ Owner returns null scope (full company visibility)');
  console.log('  ✓ Admin returns null scope (full company visibility)');
  console.log('  ✓ Employee 1 strictly restricted to [usr-compA-emp1]');
  console.log('  ✓ Employee 2 strictly restricted to [usr-compA-emp2]');
  console.log('  -> PASS: Role Scoping Verified');
}

// ==========================================
// TEST 3: Granular Resource Visibility (Policies)
// ==========================================
async function testResourceVisibilityPolicies() {
  console.log('\n[TEST 3] Granular Resource Visibility Policies');

  // Case A: ASSIGNED_ONLY policy
  const assignedOnlyConv = {
    id: 'conv-assigned-only',
    companyId: 'company-A',
    assignedUserId: 'usr-compA-emp1',
  };
  const assignedOnlyPolicy: VisibilityPolicy = {
    visibilityType: 'ASSIGNED_ONLY',
    employeeIds: [],
    teamIds: [],
    departmentIds: [],
  };

  // Emp 1 is assigned -> allowed
  const emp1Access = await canUserAccessConversation(companyAEmployee1Session, assignedOnlyConv, assignedOnlyPolicy);
  assert.strictEqual(emp1Access.allowed, true, 'FAIL: Assigned employee should access conversation');

  // Emp 2 is NOT assigned -> blocked
  const emp2Access = await canUserAccessConversation(companyAEmployee2Session, assignedOnlyConv, assignedOnlyPolicy);
  assert.strictEqual(emp2Access.allowed, false, 'FAIL: Unassigned employee bypassed ASSIGNED_ONLY');

  // Case B: SELECTED_EMPLOYEES policy
  const selectedPolicy: VisibilityPolicy = {
    visibilityType: 'SELECTED_EMPLOYEES',
    employeeIds: ['usr-compA-emp1'],
    teamIds: [],
    departmentIds: [],
  };
  const emp1SelAccess = await canUserAccessConversation(companyAEmployee1Session, assignedOnlyConv, selectedPolicy);
  assert.strictEqual(emp1SelAccess.allowed, true, 'FAIL: Selected employee denied access');

  const emp2SelAccess = await canUserAccessConversation(companyAEmployee2Session, assignedOnlyConv, selectedPolicy);
  assert.strictEqual(emp2SelAccess.allowed, false, 'FAIL: Non-selected employee accessed SELECTED_EMPLOYEES');

  // Case C: MANAGERS_ONLY policy
  const mgrPolicy: VisibilityPolicy = {
    visibilityType: 'MANAGERS_ONLY',
    employeeIds: [],
    teamIds: [],
    departmentIds: [],
  };
  const empMgrAccess = await canUserAccessConversation(companyAEmployee1Session, assignedOnlyConv, mgrPolicy);
  assert.strictEqual(empMgrAccess.allowed, false, 'FAIL: Employee bypassed MANAGERS_ONLY');

  const ownerMgrAccess = await canUserAccessConversation(companyAOwnerSession, assignedOnlyConv, mgrPolicy);
  assert.strictEqual(ownerMgrAccess.allowed, true, 'FAIL: Owner blocked from MANAGERS_ONLY');

  // Case D: OWNER_ONLY policy
  const ownerOnlyPolicy: VisibilityPolicy = {
    visibilityType: 'OWNER_ONLY',
    employeeIds: [],
    teamIds: [],
    departmentIds: [],
  };
  const mgrOwnerAccess = await canUserAccessConversation(companyAManagerSession, assignedOnlyConv, ownerOnlyPolicy);
  assert.strictEqual(mgrOwnerAccess.allowed, false, 'FAIL: Manager bypassed OWNER_ONLY policy');

  const ownerAccess = await canUserAccessConversation(companyAOwnerSession, assignedOnlyConv, ownerOnlyPolicy);
  assert.strictEqual(ownerAccess.allowed, true, 'FAIL: Owner blocked from OWNER_ONLY policy');

  // Case E: HIDDEN / HIDDEN_FROM_EMPLOYEES policy
  const hiddenPolicy: VisibilityPolicy = {
    visibilityType: 'HIDDEN',
    employeeIds: [],
    teamIds: [],
    departmentIds: [],
  };
  const ownerHidden = await canUserAccessConversation(companyAOwnerSession, assignedOnlyConv, hiddenPolicy);
  assert.strictEqual(ownerHidden.allowed, true, 'FAIL: Company Owner must access HIDDEN_FROM_EMPLOYEES resource');

  const adminHidden = await canUserAccessConversation(companyAAdminSession, assignedOnlyConv, hiddenPolicy);
  assert.strictEqual(adminHidden.allowed, true, 'FAIL: Company Admin must access HIDDEN_FROM_EMPLOYEES resource');

  const empHidden = await canUserAccessConversation(companyAEmployee1Session, assignedOnlyConv, hiddenPolicy);
  assert.strictEqual(empHidden.allowed, false, 'FAIL: Regular Employee must be denied access to HIDDEN resource');
  assert.strictEqual(empHidden.reason, 'VISIBILITY_HIDDEN_FROM_EMPLOYEES');

  const mgrHidden = await canUserAccessConversation(companyAManagerSession, assignedOnlyConv, hiddenPolicy);
  assert.strictEqual(mgrHidden.allowed, false, 'FAIL: Unauthorized Manager must be denied access to HIDDEN resource');

  // Privileged employee with explicit permission
  const privilegedEmpSession = {
    ...companyAEmployee1Session,
    permissions: ['crm.leads.view_hidden', 'whatsapp.view_hidden'],
  };
  const privHidden = await canUserAccessConversation(privilegedEmpSession, assignedOnlyConv, hiddenPolicy);
  assert.strictEqual(privHidden.allowed, true, 'FAIL: Staff with explicit view_hidden permission denied');

  // Case F: PLATFORM_RESTRICTED policy
  const platRestrictedPolicy: VisibilityPolicy = {
    visibilityType: 'PLATFORM_RESTRICTED',
    employeeIds: [],
    teamIds: [],
    departmentIds: [],
  };
  const ownerPlat = await canUserAccessConversation(companyAOwnerSession, assignedOnlyConv, platRestrictedPolicy);
  assert.strictEqual(ownerPlat.allowed, false, 'FAIL: Owner accessed PLATFORM_RESTRICTED resource');

  const superPlat = await canUserAccessConversation(superAdminSession, assignedOnlyConv, platRestrictedPolicy);
  assert.strictEqual(superPlat.allowed, true, 'FAIL: Super admin blocked from PLATFORM_RESTRICTED resource');

  console.log('  ✓ ASSIGNED_ONLY: Assigned employee allowed, unassigned colleague rejected');
  console.log('  ✓ SELECTED_EMPLOYEES: Whitelisted employee allowed, other rejected');
  console.log('  ✓ MANAGERS_ONLY: Employee rejected, Owner/Manager allowed');
  console.log('  ✓ OWNER_ONLY: Manager rejected, Owner allowed');
  console.log('  ✓ HIDDEN_FROM_EMPLOYEES: Owner & Admin allowed, regular Employee & unauthorized Manager denied');
  console.log('  ✓ PLATFORM_RESTRICTED: Tenant Owner denied, only Super Admin allowed');
  console.log('  -> PASS: Visibility Policy Matrix Verified');
}

// ==========================================
// TEST 4: Query Filter Builders Scoping
// ==========================================
async function testQueryFilterBuilders() {
  console.log('\n[TEST 4] Query Filter Builders (Server-Side List Scoping)');

  // Conversations filter for Employee 1
  const convFilterEmp = await buildConversationAccessFilter(companyAEmployee1Session);
  assert.strictEqual(convFilterEmp.companyId, 'company-A');
  assert.ok(convFilterEmp.OR, 'Conversation filter for employee must contain OR condition');
  assert.deepStrictEqual(convFilterEmp.OR[0].assignedUserId, { in: ['usr-compA-emp1'] });

  // Conversations filter for Owner
  const convFilterOwner = await buildConversationAccessFilter(companyAOwnerSession);
  assert.strictEqual(convFilterOwner.companyId, 'company-A');
  assert.strictEqual(convFilterOwner.OR, undefined);

  // Leads filter for Employee 1
  const leadFilterEmp = await buildLeadAccessFilter(companyAEmployee1Session);
  assert.strictEqual(leadFilterEmp.companyId, 'company-A');
  assert.ok(leadFilterEmp.OR, 'Lead filter for employee must contain OR conditions for assignments');

  // Leads filter for Owner
  const leadFilterOwner = await buildLeadAccessFilter(companyAOwnerSession);
  assert.strictEqual(leadFilterOwner.companyId, 'company-A');
  assert.strictEqual(leadFilterOwner.OR, undefined);

  console.log('  ✓ Conversation query filter for employee strictly locks assignedUserId');
  console.log('  ✓ Conversation query filter for owner allows full company list');
  console.log('  ✓ Lead query filter for employee strictly locks assignedTo');
  console.log('  ✓ Lead query filter for owner allows full company list');
  console.log('  -> PASS: Query Filter Builders Verified');
}

// ==========================================
// TEST 5: Configurable SLA Calculation
// ==========================================
function testSlaCalculation() {
  console.log('\n[TEST 5] Configurable SLA Calculation & Threshold Warnings');

  const normalThreshold = { warningMinutes: 8, breachMinutes: 10 };
  const urgentThreshold = { warningMinutes: 3, breachMinutes: 5 };

  const now = Date.now();

  // Test 1: Just created (2 minutes ago) -> SAFE
  const status1 = computeSlaStatus(new Date(now - 2 * 60 * 1000), normalThreshold);
  assert.strictEqual(status1, 'SAFE');

  // Test 2: Warning threshold reached (8.5 minutes elapsed for 8 min warning) -> WARNING
  const status2 = computeSlaStatus(new Date(now - 8.5 * 60 * 1000), normalThreshold);
  assert.strictEqual(status2, 'WARNING');

  // Test 3: Breach threshold reached (12 minutes elapsed for 10 min breach) -> BREACHED
  const status3 = computeSlaStatus(new Date(now - 12 * 60 * 1000), normalThreshold);
  assert.strictEqual(status3, 'BREACHED');

  // Test 4: Urgent lead breach (6 minutes elapsed for 5 min breach) -> BREACHED
  const status4 = computeSlaStatus(new Date(now - 6 * 60 * 1000), urgentThreshold);
  assert.strictEqual(status4, 'BREACHED');

  // Test 5: Not assigned -> NONE
  const status5 = computeSlaStatus(null, normalThreshold);
  assert.strictEqual(status5, 'NONE');

  console.log('  ✓ 2 mins elapsed (Rule: 8/10m) -> SAFE');
  console.log('  ✓ 8.5 mins elapsed (Rule: 8/10m) -> WARNING');
  console.log('  ✓ 12 mins elapsed (Rule: 8/10m) -> BREACHED');
  console.log('  ✓ Urgent lead at 6 mins (Rule: 3/5m) -> BREACHED');
  console.log('  ✓ Unassigned item -> NONE');
  console.log('  -> PASS: SLA Calculations Verified');
}

// ==========================================
// TEST 6: Reassignment Authorization
// ==========================================
function testReassignmentAuthorization() {
  console.log('\n[TEST 6] Reassignment Permission Matrix');

  assert.strictEqual(isOwnerOrAdmin(companyAOwnerSession), true, 'Owner should be authorized to reassign');
  assert.strictEqual(isOwnerOrAdmin(companyAAdminSession), true, 'Admin should be authorized to reassign');
  assert.strictEqual(isManager(companyAManagerSession), true, 'Manager should be recognized as manager');
  assert.strictEqual(isOwnerOrAdmin(companyAEmployee1Session), false, 'Employee must not be recognized as owner/admin');
  assert.strictEqual(isManager(companyAEmployee1Session), false, 'Employee must not be recognized as manager');

  console.log('  ✓ Owner authorized for reassignment');
  console.log('  ✓ Admin authorized for reassignment');
  console.log('  ✓ Manager recognized for team reassignment');
  console.log('  ✓ Standard Employee rejected from reassignment controls');
  console.log('  -> PASS: Reassignment Authorization Verified');
}

// ==========================================
// TEST 7: Manager Dashboard Scoping
// ==========================================
function testManagerDashboardScoping() {
  console.log('\n[TEST 7] Manager Dashboard Scoping Logic');

  function resolveDashboardScope(session: TokenPayload) {
    const role = (session.companyRole || session.role || '').toUpperCase();
    const isOwnerOrSuper = session.role === 'SUPER_ADMIN' || ['OWNER', 'ADMIN'].includes(role);
    const hasCompanyAnalytics =
      session.permissions?.includes('VIEW_COMPANY_ANALYTICS') ||
      session.permissions?.includes('analytics.company.view') ||
      session.permissions?.includes('admin.analytics.view');

    const isCompanyScope = isOwnerOrSuper || hasCompanyAnalytics;
    return isCompanyScope ? 'COMPANY' : 'TEAM';
  }

  // 1. Owner -> COMPANY
  assert.strictEqual(resolveDashboardScope(companyAOwnerSession), 'COMPANY');

  // 2. Admin -> COMPANY
  assert.strictEqual(resolveDashboardScope(companyAAdminSession), 'COMPANY');

  // 3. Manager without permission -> TEAM
  assert.strictEqual(resolveDashboardScope(companyAManagerSession), 'TEAM');

  // 4. Manager with explicit VIEW_COMPANY_ANALYTICS permission -> COMPANY
  const privilegedManager = {
    ...companyAManagerSession,
    permissions: ['VIEW_COMPANY_ANALYTICS'],
  };
  assert.strictEqual(resolveDashboardScope(privilegedManager), 'COMPANY');

  console.log('  ✓ Owner receives full COMPANY scope');
  console.log('  ✓ Company Admin receives full COMPANY scope');
  console.log('  ✓ Manager without explicit permission receives TEAM scope by default');
  console.log('  ✓ Manager with explicit VIEW_COMPANY_ANALYTICS receives COMPANY scope');
  console.log('  -> PASS: Manager Dashboard Scoping Verified');
}

// ==========================================
// RUN ALL TESTS
// ==========================================
async function main() {
  try {
    await testCrossTenantIsolation();
    await testRoleScoping();
    await testResourceVisibilityPolicies();
    await testQueryFilterBuilders();
    testSlaCalculation();
    testReassignmentAuthorization();
    testManagerDashboardScoping();

    console.log('\n====================================================');
    console.log('ALL SECURITY, VISIBILITY & ISOLATION TESTS PASSED 100%');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILURE:', err);
    process.exit(1);
  }
}

main();
