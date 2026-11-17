const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function test() {
  const user = await db.user.findFirst({
    where: { email: 'admin@techinpedia.com' },
    include: { employee: true },
  });
  console.log('User employeeId:', user.employeeId);
  console.log('User employee:', user.employee?.name, user.employee?.employeeCode);

  const emp = await db.employee.findUnique({
    where: { id: user.employeeId },
    include: {
      department: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
      designation: { select: { id: true, title: true } },
    },
  });
  console.log('Resolved emp:', emp);

  const leaveBalances = await db.leaveBalance.findMany({
    where: { employeeId: user.employeeId, year: 2026 },
  });
  console.log('Leave Balances count:', leaveBalances.length, leaveBalances);
}

test()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    db.$disconnect();
  });
