import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const roleMapping: Record<string, { email: string; name: string }> = {
  'EMPLOYEE': { email: 'employee@techinpedia.com', name: 'Demo Employee' },
  'FINANCE_MANAGER': { email: 'finance@techinpedia.com', name: 'Demo Finance' },
  'HR_ADMIN': { email: 'hr.admin@techinpedia.com', name: 'Demo HR Admin' },
  'HR_MANAGER': { email: 'hr@techinpedia.com', name: 'Demo HR Manager' },
  'MANAGEMENT': { email: 'management@techinpedia.com', name: 'Demo Management' },
  'PROJECT_MANAGER': { email: 'pm@techinpedia.com', name: 'Demo Project Manager' },
  'SALES_EXECUTIVE': { email: 'sales@techinpedia.com', name: 'Demo Sales Exec' },
  'SALES_MANAGER': { email: 'sales.manager@techinpedia.com', name: 'Demo Sales Manager' },
  'SUPER_ADMIN': { email: 'superadmin@techinpedia.com', name: 'Demo Super Admin' },
  'TEAM_LEADER': { email: 'tl@techinpedia.com', name: 'Demo Team Leader' },
};

async function main() {
  const password = await bcrypt.hash('123456578', 12);
  const roles = await prisma.appRole.findMany();

  const results = [];

  for (const role of roles) {
    const mapping = roleMapping[role.name];
    if (mapping) {
      // Create or update user
      const user = await prisma.user.upsert({
        where: { email: mapping.email },
        update: {
          password,
          appRoleId: role.id,
          role: role.name === 'super_administrator' ? 'SUPER_ADMIN' : 'ADMIN',
          status: 'ACTIVE',
          mustChangePassword: false,
        },
        create: {
          email: mapping.email,
          name: mapping.name,
          password,
          appRoleId: role.id,
          role: role.name === 'super_administrator' ? 'SUPER_ADMIN' : 'ADMIN',
          status: 'ACTIVE',
          mustChangePassword: false,
        },
      });
      results.push({ role: role.displayName, email: user.email, password: '123456578' });
      console.log(`Created/Updated user: ${user.email} for role ${role.displayName}`);
    }
  }
  
  console.log('\n--- Accounts Created ---');
  console.table(results);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
