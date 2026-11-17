import { db } from '../src/lib/db';
import { ensureSystemRoles } from '../src/lib/rbac/seedRoles';
import { hasPermission, requirePermission } from '../src/lib/permissions';
import { getStaffScope, getLeadFilter, getEmployeeFilter } from '../src/lib/rbac/dataScoping';
import { TokenPayload } from '../src/lib/auth';

async function runPhaseATests() {
  console.log('====================================================');
  console.log('PHASE A AUTOMATED VERIFICATION: ORGANIZATION & RBAC');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Seed & Verify Roles in Database
    console.log('--- TEST GROUP 1: Database-Backed Roles & Permissions ---');
    await ensureSystemRoles();

    const superAdminRole = await db.appRole.findUnique({
      where: { name: 'SUPER_ADMIN' },
      include: { permissions: { include: { permission: true } } },
    });
    assert(!!superAdminRole, 'Super Admin role exists in database');
    assert(
      (superAdminRole?.permissions.length || 0) >= 50,
      `Super Admin has all permissions (${superAdminRole?.permissions.length} perms)`
    );

    const salesManagerRole = await db.appRole.findUnique({
      where: { name: 'SALES_MANAGER' },
      include: { permissions: { include: { permission: true } } },
    });
    assert(!!salesManagerRole, 'Sales Manager role exists in database');

    const salesMgrPermCodes = salesManagerRole?.permissions.map((p) => p.permission.code) || [];
    assert(salesMgrPermCodes.includes('crm.leads.assign'), 'Sales Manager has crm.leads.assign permission');
    assert(!salesMgrPermCodes.includes('hr.payroll.approve'), 'Sales Manager lacks hr.payroll.approve permission');

    // 2. Organization Hierarchy (Department -> Team -> Leader -> Employee)
    console.log('\n--- TEST GROUP 2: Organization Hierarchy ---');
    const testDept = await db.department.upsert({
      where: { name: 'Test QA Department' },
      update: { code: 'TEST_QA' },
      create: { name: 'Test QA Department', code: 'TEST_QA', description: 'Temporary test department' },
    });
    assert(!!testDept.id, 'Test Department created');

    const testManagerEmp = await db.employee.upsert({
      where: { companyEmail: 'qa.manager@test-techinpedia.com' },
      update: { departmentId: testDept.id },
      create: {
        employeeCode: 'TEST-EMP-MGR',
        name: 'QA Manager',
        companyEmail: 'qa.manager@test-techinpedia.com',
        departmentId: testDept.id,
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
      },
    });
    assert(!!testManagerEmp.id, 'Department Head employee created');

    // Assign as Department Head
    await db.department.update({
      where: { id: testDept.id },
      data: { headId: testManagerEmp.id },
    });

    const testTeam = await db.team.upsert({
      where: { code: 'QA_AUTOMATION' },
      update: { departmentId: testDept.id, leaderId: testManagerEmp.id },
      create: {
        name: 'QA Automation Team',
        code: 'QA_AUTOMATION',
        departmentId: testDept.id,
        leaderId: testManagerEmp.id,
      },
    });
    assert(!!testTeam.id, 'Operational Team created under Department');

    const testStaffEmp = await db.employee.upsert({
      where: { companyEmail: 'qa.staff@test-techinpedia.com' },
      update: { departmentId: testDept.id, teamId: testTeam.id, managerId: testManagerEmp.id },
      create: {
        employeeCode: 'TEST-EMP-STAFF',
        name: 'QA Staff Engineer',
        companyEmail: 'qa.staff@test-techinpedia.com',
        departmentId: testDept.id,
        teamId: testTeam.id,
        managerId: testManagerEmp.id,
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
      },
    });
    assert(!!testStaffEmp.id, 'Staff employee created with manager and team relations');

    // Query back the full hierarchy
    const fetchedDept = await db.department.findUnique({
      where: { id: testDept.id },
      include: {
        head: true,
        teams: {
          include: {
            leader: true,
            members: true,
          },
        },
      },
    });
    assert(fetchedDept?.head?.id === testManagerEmp.id, 'Department head correctly resolved');
    assert(fetchedDept?.teams[0]?.id === testTeam.id, 'Department teams correctly resolved');
    assert(fetchedDept?.teams[0]?.leader?.id === testManagerEmp.id, 'Team leader correctly resolved');

    // 3. User <-> Employee Unification
    console.log('\n--- TEST GROUP 3: User <-> Employee Unification ---');
    const testUser = await db.user.upsert({
      where: { email: 'qa.staff@test-techinpedia.com' },
      update: { employeeId: testStaffEmp.id, appRoleId: salesManagerRole?.id },
      create: {
        name: 'QA Staff User',
        email: 'qa.staff@test-techinpedia.com',
        password: 'HashedPasswordTest123!',
        role: 'EDITOR',
        employeeId: testStaffEmp.id,
        appRoleId: salesManagerRole?.id,
        status: 'ACTIVE',
      },
    });
    assert(testUser.employeeId === testStaffEmp.id, 'User is linked 1-to-1 with Employee');

    const resolvedUser = await db.user.findUnique({
      where: { id: testUser.id },
      include: {
        employee: {
          include: {
            department: true,
            team: true,
            manager: true,
          },
        },
        appRole: true,
      },
    });
    assert(resolvedUser?.employee?.department?.name === 'Test QA Department', 'User resolves to Department');
    assert(resolvedUser?.employee?.team?.name === 'QA Automation Team', 'User resolves to Team');
    assert(resolvedUser?.employee?.manager?.name === 'QA Manager', 'User resolves to Reporting Manager');

    // 4. Session & Permission Engine
    console.log('\n--- TEST GROUP 4: RBAC & Permission Enforcement ---');
    const superAdminSession: TokenPayload = {
      userId: 'usr_superadmin',
      email: 'admin@techinpedia.com',
      role: 'SUPER_ADMIN',
      mustChangePassword: false,
      permissions: [],
    };
    assert(hasPermission(superAdminSession, 'hr.payroll.approve'), 'SUPER_ADMIN bypasses all permissions');

    const salesRepSession: TokenPayload = {
      userId: testUser.id,
      email: testUser.email,
      role: 'EDITOR',
      appRoleId: salesManagerRole?.id,
      appRoleName: 'SALES_MANAGER',
      employeeId: testStaffEmp.id,
      departmentId: testDept.id,
      teamId: testTeam.id,
      mustChangePassword: false,
      permissions: salesMgrPermCodes as any,
    };
    assert(hasPermission(salesRepSession, 'crm.leads.create'), 'Sales Manager has crm.leads.create');
    assert(hasPermission(salesRepSession, 'crm.leads.assign'), 'Sales Manager has crm.leads.assign');
    assert(!hasPermission(salesRepSession, 'hr.payroll.approve'), 'Sales Manager correctly forbidden from hr.payroll.approve');

    let threwForbidden = false;
    try {
      requirePermission(salesRepSession, 'hr.payroll.approve');
    } catch {
      threwForbidden = true;
    }
    assert(threwForbidden, 'requirePermission throws on missing permission');

    // 5. Data Scoping Engine
    console.log('\n--- TEST GROUP 5: Record-Level Data Scoping ---');
    assert(getStaffScope(superAdminSession) === 'GLOBAL', 'Super Admin scope is GLOBAL');
    assert(getStaffScope(salesRepSession) === 'DEPARTMENT', 'Sales Manager scope is DEPARTMENT');

    const leadFilter = getLeadFilter(salesRepSession);
    assert(
      JSON.stringify(leadFilter).includes(testDept.id),
      'Sales Manager lead filter scopes to their Department'
    );

    const individualRepSession: TokenPayload = {
      userId: 'rep_123',
      email: 'rep@techinpedia.com',
      role: 'EDITOR',
      appRoleName: 'SALES_EXECUTIVE',
      employeeId: 'emp_123',
      mustChangePassword: false,
      permissions: ['crm.leads.view'],
    };
    assert(getStaffScope(individualRepSession) === 'OWN', 'Sales Executive scope is OWN');
    const repLeadFilter = getLeadFilter(individualRepSession);
    assert(
      (repLeadFilter as any).assignedToId === 'rep_123',
      'Sales Executive lead filter strictly scopes to assignedToId == userId'
    );

    // 6. Cleanup test records
    console.log('\n--- CLEANUP ---');
    await db.user.deleteMany({ where: { email: 'qa.staff@test-techinpedia.com' } });
    await db.employee.deleteMany({ where: { companyEmail: { in: ['qa.staff@test-techinpedia.com', 'qa.manager@test-techinpedia.com'] } } });
    await db.team.deleteMany({ where: { code: 'QA_AUTOMATION' } });
    await db.department.deleteMany({ where: { code: 'TEST_QA' } });
    console.log('Cleaned up test records successfully.');

    console.log('\n====================================================');
    console.log(`PHASE A RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during Phase A test execution:', error);
    process.exit(1);
  }
}

runPhaseATests();
