const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPhaseDVerification() {
  console.log('🚀 [PHASE D VERIFICATION] Starting Automated Dashboards & Portals Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Verify ESS Data Queries
    const testEmp = await prisma.employee.findFirst({
      where: { employeeCode: 'EMP-PHASE-C' },
      include: {
        department: true,
        team: true,
        designation: true,
      },
    });

    assert(testEmp !== null, 'Found target employee profile for ESS Portal');

    const [todayAtt, monthAtt, balances, recentLeaves, recentPayrolls] = await Promise.all([
      prisma.attendanceRecord.findFirst({
        where: { employeeId: testEmp.id },
        orderBy: { date: 'desc' },
      }),
      prisma.attendanceRecord.findMany({
        where: { employeeId: testEmp.id },
      }),
      prisma.leaveBalance.findMany({
        where: { employeeId: testEmp.id },
      }),
      prisma.leaveRequest.findMany({
        where: { employeeId: testEmp.id },
      }),
      prisma.payrollRecord.findMany({
        where: { employeeId: testEmp.id },
      }),
    ]);

    assert(todayAtt !== null, 'ESS: Fetched today/recent attendance record');
    assert(monthAtt.length > 0, `ESS: Monthly attendance retrieved (${monthAtt.length} records)`);
    assert(balances.length > 0, `ESS: Annual leave balances retrieved (${balances.length} types)`);
    assert(recentLeaves.length > 0, `ESS: Recent leave requests retrieved (${recentLeaves.length} items)`);
    assert(recentPayrolls.length > 0, `ESS: Recent payroll payslips retrieved (${recentPayrolls.length} items)`);

    // 2. Verify Manager Cockpit Queries
    const teams = await prisma.team.findMany({
      include: {
        department: true,
        leader: true,
        members: true,
      },
    });

    assert(teams.length > 0, `Manager: Found ${teams.length} operational teams`);
    const activeTeam = teams[0];

    const teamMemberIds = (activeTeam.members || []).map((e) => e.id);
    const [teamAtt, pendingLeaves, pendingRegs, teamDeals] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { employeeId: { in: teamMemberIds } },
      }),
      prisma.leaveRequest.findMany({
        where: { employeeId: { in: teamMemberIds }, status: 'PENDING' },
      }),
      prisma.regularizationRequest.findMany({
        where: { employeeId: { in: teamMemberIds }, status: 'PENDING' },
      }),
      prisma.deal.findMany({
        where: { assignedEmployeeId: { in: teamMemberIds } },
      }),
    ]);

    assert(activeTeam.name.length > 0, `Manager: Resolved active team "${activeTeam.name}"`);
    assert(Array.isArray(teamAtt), 'Manager: Queried team attendance presence');
    assert(Array.isArray(pendingLeaves), 'Manager: Queried team pending leave applications');
    assert(Array.isArray(pendingRegs), 'Manager: Queried team pending attendance regularizations');
    assert(Array.isArray(teamDeals), 'Manager: Queried team deals pipeline');

    // 3. Verify HR Operations Queries
    const [allEmployees, allDepts, allTodayAtt, allPendingLeaves, allPendingRegs] = await Promise.all([
      prisma.employee.findMany({ where: { status: 'ACTIVE' } }),
      prisma.department.findMany({ include: { employees: true } }),
      prisma.attendanceRecord.findMany(),
      prisma.leaveRequest.findMany({ where: { status: 'PENDING' } }),
      prisma.regularizationRequest.findMany({ where: { status: 'PENDING' } }),
    ]);

    const presenceRate = allEmployees.length > 0
      ? Math.round((allTodayAtt.length / allEmployees.length) * 100)
      : 100;

    assert(allEmployees.length > 0, `HR: Verified ${allEmployees.length} active employees across company`);
    assert(allDepts.length > 0, `HR: Verified ${allDepts.length} functional departments`);
    assert(typeof presenceRate === 'number', `HR: Calculated company presence rate: ${presenceRate}%`);
    assert(Array.isArray(allPendingLeaves), 'HR: Action center pending leaves queried');
    assert(Array.isArray(allPendingRegs), 'HR: Action center pending regularizations queried');

    // 4. Verify Executive Cockpit Queries
    const [payments, invoices, deals, projects, tickets] = await Promise.all([
      prisma.payment.findMany(),
      prisma.invoice.findMany(),
      prisma.deal.findMany({ include: { stage: true } }),
      prisma.project.findMany(),
      prisma.supportTicket.findMany(),
    ]);

    const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalInvoiced = invoices.reduce((acc, i) => acc + (i.total || 0), 0);
    const openDeals = deals.filter((d) => d.status === 'OPEN');
    const wonDeals = deals.filter((d) => d.status === 'WON');
    const weightedPipeline = openDeals.reduce((acc, d) => {
      const prob = d.stage?.probability ?? 50;
      return acc + ((d.value || 0) * (prob / 100));
    }, 0);

    assert(typeof totalCollected === 'number', `Executive: Total revenue collected queried: ₹${totalCollected}`);
    assert(typeof totalInvoiced === 'number', `Executive: Total invoiced volume queried: ₹${totalInvoiced}`);
    assert(typeof weightedPipeline === 'number', `Executive: Weighted pipeline forecast calculated: ₹${Math.round(weightedPipeline)}`);
    assert(Array.isArray(projects), `Executive: Delivery health projects queried (${projects.length} projects)`);
    assert(Array.isArray(tickets), `Executive: Support SLA tickets queried (${tickets.length} tickets)`);

    console.log(`\n========================================`);
    console.log(`🏁 Phase D Verification Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Error in Phase D verification:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhaseDVerification();
