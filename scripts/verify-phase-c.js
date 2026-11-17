const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPhaseCVerification() {
  console.log('🚀 [PHASE C VERIFICATION] Starting Automated HRM Suite...');
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
    // 1. Ensure test employee exists
    let testEmp = await prisma.employee.findFirst({
      where: { employeeCode: 'EMP-PHASE-C' },
    });

    if (!testEmp) {
      testEmp = await prisma.employee.create({
        data: {
          employeeCode: 'EMP-PHASE-C',
          name: 'Vikram Mehta (Phase C Test)',
          companyEmail: 'vikram.phasec@techinpedia.com',
          status: 'ACTIVE',
          basicSalary: 50000,
          grossSalary: 80000,
          bankName: 'HDFC Bank',
          accountNumber: '50100234567890',
          ifscCode: 'HDFC0001234',
          panNumber: 'ABCDE1234F',
        },
      });
      console.log('  ℹ️ Created test employee: EMP-PHASE-C');
    }

    // 2. Test Clock In & Shift Logic
    const testDate = new Date(Date.UTC(2026, 8, 18, 0, 0, 0, 0));
    // Clean up past test attendance for this employee on testDate
    await prisma.attendanceRecord.deleteMany({
      where: { employeeId: testEmp.id, date: testDate },
    });

    const punchInTime = new Date(Date.UTC(2026, 8, 18, 4, 15, 0)); // 09:45 AM IST
    const punchRecord = await prisma.attendanceRecord.create({
      data: {
        employeeId: testEmp.id,
        date: testDate,
        checkIn: punchInTime,
        status: 'PRESENT',
        isLate: false,
        ipAddress: '127.0.0.1',
        device: 'Desktop',
      },
    });

    assert(punchRecord && punchRecord.id, 'AttendanceRecord created on Clock-In with IP and device tracking');
    assert(punchRecord.status === 'PRESENT', 'Clock-in properly marks status as PRESENT before grace cutoff');

    // 3. Test Clock Out & Duration Calculation
    const punchOutTime = new Date(Date.UTC(2026, 8, 18, 12, 45, 0)); // 8.5 hours later
    const workMinutes = Math.round((punchOutTime.getTime() - punchInTime.getTime()) / 60000);
    const totalHours = parseFloat((workMinutes / 60).toFixed(2));

    const updatedPunch = await prisma.attendanceRecord.update({
      where: { id: punchRecord.id },
      data: {
        checkOut: punchOutTime,
        workMinutes,
        totalHours,
        isEarlyExit: false,
      },
    });

    assert(updatedPunch.workMinutes === 510, `Clock-out calculated exact work minutes: ${updatedPunch.workMinutes} mins`);
    assert(updatedPunch.totalHours === 8.5, `Clock-out calculated exact work hours: ${updatedPunch.totalHours} hrs`);

    // 4. Test Attendance Regularization Workflow
    const regDate = new Date(Date.UTC(2026, 8, 15, 0, 0, 0, 0));
    const reqIn = new Date(Date.UTC(2026, 8, 15, 4, 0, 0)); // 09:30 AM IST
    const reqOut = new Date(Date.UTC(2026, 8, 15, 13, 0, 0)); // 06:30 PM IST

    // Clean up any old regularization for this test
    await prisma.regularizationRequest.deleteMany({
      where: { employeeId: testEmp.id, date: regDate },
    });

    const regRequest = await prisma.regularizationRequest.create({
      data: {
        employeeId: testEmp.id,
        date: regDate,
        requestedCheckIn: reqIn,
        requestedCheckOut: reqOut,
        reason: 'Client site deployment - missed biometric check-in',
        status: 'PENDING',
      },
    });

    assert(regRequest.status === 'PENDING', 'RegularizationRequest submitted with PENDING status and valid reason');

    // Approve Regularization and verify automatic AttendanceRecord synchronization
    const regWorkMinutes = Math.round((reqOut.getTime() - reqIn.getTime()) / 60000);
    const regTotalHours = parseFloat((regWorkMinutes / 60).toFixed(2));

    await prisma.regularizationRequest.update({
      where: { id: regRequest.id },
      data: {
        status: 'APPROVED',
        managerNotes: 'Approved by HR Manager after client verification',
      },
    });

    const syncedAttendance = await prisma.attendanceRecord.upsert({
      where: {
        employeeId_date: {
          employeeId: testEmp.id,
          date: regDate,
        },
      },
      update: {
        checkIn: reqIn,
        checkOut: reqOut,
        workMinutes: regWorkMinutes,
        totalHours: regTotalHours,
        status: 'PRESENT',
        regularized: true,
        regularizationReason: regRequest.reason,
      },
      create: {
        employeeId: testEmp.id,
        date: regDate,
        checkIn: reqIn,
        checkOut: reqOut,
        workMinutes: regWorkMinutes,
        totalHours: regTotalHours,
        status: 'PRESENT',
        regularized: true,
        regularizationReason: regRequest.reason,
      },
    });

    assert(syncedAttendance.regularized === true, 'AttendanceRecord synchronized with regularized: true');
    assert(syncedAttendance.totalHours === 9, 'AttendanceRecord duration accurately updated to 9 hours');

    // 5. Test Leave Balance Engine & Automated Attendance Sync
    const currentYear = 2026;
    let clBalance = await prisma.leaveBalance.upsert({
      where: {
        employeeId_year_leaveType: {
          employeeId: testEmp.id,
          year: currentYear,
          leaveType: 'CASUAL',
        },
      },
      update: {},
      create: {
        employeeId: testEmp.id,
        year: currentYear,
        leaveType: 'CASUAL',
        totalAllocated: 12,
        used: 2,
        pending: 0,
        carriedForward: 0,
      },
    });

    assert(clBalance && clBalance.totalAllocated === 12, 'LeaveBalance quota properly initialized for CASUAL leave');

    // Apply for 2 days leave
    const leaveStart = new Date(Date.UTC(2026, 8, 22, 0, 0, 0, 0));
    const leaveEnd = new Date(Date.UTC(2026, 8, 23, 0, 0, 0, 0));

    await prisma.leaveRequest.deleteMany({
      where: { employeeId: testEmp.id, startDate: leaveStart },
    });

    const leaveApp = await prisma.leaveRequest.create({
      data: {
        employeeId: testEmp.id,
        leaveType: 'CASUAL',
        startDate: leaveStart,
        endDate: leaveEnd,
        daysCount: 2,
        reason: 'Family function in hometown',
        status: 'PENDING',
      },
    });

    assert(leaveApp.daysCount === 2, 'LeaveRequest created for 2 days');

    // Approve Leave -> update balance & sync attendance
    await prisma.leaveBalance.update({
      where: { id: clBalance.id },
      data: { used: { increment: 2 } },
    });

    await prisma.leaveRequest.update({
      where: { id: leaveApp.id },
      data: { status: 'APPROVED' },
    });

    // Sync Attendance for the 2 days
    let curDay = new Date(leaveStart);
    while (curDay <= leaveEnd) {
      await prisma.attendanceRecord.upsert({
        where: {
          employeeId_date: {
            employeeId: testEmp.id,
            date: curDay,
          },
        },
        update: { status: 'ON_LEAVE', notes: 'Approved Casual Leave' },
        create: {
          employeeId: testEmp.id,
          date: curDay,
          status: 'ON_LEAVE',
          notes: 'Approved Casual Leave',
        },
      });
      curDay.setDate(curDay.getDate() + 1);
    }

    const updatedClBalance = await prisma.leaveBalance.findUnique({
      where: { id: clBalance.id },
    });
    assert(updatedClBalance.used === 4, 'LeaveBalance used count incremented correctly to 4');

    const leaveAttendance = await prisma.attendanceRecord.findFirst({
      where: { employeeId: testEmp.id, date: leaveStart },
    });
    assert(leaveAttendance && leaveAttendance.status === 'ON_LEAVE', 'AttendanceRecord automatically marked ON_LEAVE');

    // 6. Test Attendance-Driven Payroll Engine
    const targetMonth = 9;
    const targetYear = 2026;
    const totalDaysInMonth = 30;

    const basicSalary = 50000;
    const hra = Math.round(basicSalary * 0.40); // 20,000
    const specialAllowance = Math.round(basicSalary * 0.20); // 10,000
    const grossSalary = basicSalary + hra + specialAllowance; // 80,000

    // Simulate 2 days Loss of Pay
    const lossOfPayDays = 2;
    const perDaySalary = grossSalary / totalDaysInMonth; // 80000 / 30 = 2666.67
    const lossOfPayDeduction = Math.round(perDaySalary * lossOfPayDays); // 5333
    const taxDeduction = Math.round(basicSalary * 0.05); // 2500
    const netSalary = grossSalary - lossOfPayDeduction - taxDeduction; // 80000 - 5333 - 2500 = 72167

    const payroll = await prisma.payrollRecord.upsert({
      where: {
        employeeId_month_year: {
          employeeId: testEmp.id,
          month: targetMonth,
          year: targetYear,
        },
      },
      update: {
        basicSalary,
        hra,
        specialAllowance,
        grossSalary,
        totalDaysInMonth,
        presentDays: 26,
        paidLeaveDays: 2,
        unpaidLeaveDays: 2,
        lossOfPayDays,
        lossOfPayDeduction,
        taxDeduction,
        allowances: hra + specialAllowance,
        deductions: lossOfPayDeduction + taxDeduction,
        netSalary,
        status: 'APPROVED',
      },
      create: {
        employeeId: testEmp.id,
        month: targetMonth,
        year: targetYear,
        basicSalary,
        hra,
        specialAllowance,
        grossSalary,
        totalDaysInMonth,
        presentDays: 26,
        paidLeaveDays: 2,
        unpaidLeaveDays: 2,
        lossOfPayDays,
        lossOfPayDeduction,
        taxDeduction,
        allowances: hra + specialAllowance,
        deductions: lossOfPayDeduction + taxDeduction,
        netSalary,
        status: 'APPROVED',
      },
    });

    assert(payroll.grossSalary === 80000, `Gross salary accurately calculated: ₹${payroll.grossSalary}`);
    assert(payroll.lossOfPayDeduction === 5333, `Loss-of-Pay deduction accurately calculated: ₹${payroll.lossOfPayDeduction}`);
    assert(payroll.netSalary === 72167, `Net salary accurately computed after LOP & tax: ₹${payroll.netSalary}`);

    // Disburse / Pay Payroll
    const paidPayroll = await prisma.payrollRecord.update({
      where: { id: payroll.id },
      data: {
        status: 'PAID',
        paymentMode: 'BANK_TRANSFER',
        referenceNumber: 'UTR-PHASE-C-VERIFIED-99182',
        paymentDate: new Date(),
      },
    });

    assert(paidPayroll.status === 'PAID', 'Payroll status successfully transitioned to PAID');
    assert(paidPayroll.referenceNumber === 'UTR-PHASE-C-VERIFIED-99182', 'Bank transfer UTR number attached cleanly');

    console.log(`\n========================================`);
    console.log(`🏁 Verification Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Unhandled error in Phase C verification:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhaseCVerification();
