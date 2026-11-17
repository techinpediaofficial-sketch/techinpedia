const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSearch() {
  const q = 'Vikram';
  try {
    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { employeeCode: { contains: q } },
          { companyEmail: { contains: q } },
          { designation: { title: { contains: q } } },
        ],
      },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        companyEmail: true,
        designation: { select: { title: true } },
        department: { select: { name: true } },
        status: true,
      },
    });
    console.log('Employees matched:', employees);
  } catch (err) {
    console.error('Error querying employee:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testSearch();
