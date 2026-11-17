import { ensureSystemRoles } from '../src/lib/rbac/seedRoles';
import { db } from '../src/lib/db';

async function main() {
  console.log('Seeding system roles and permissions...');
  await ensureSystemRoles();
  const rolesCount = await db.appRole.count();
  const permLinksCount = await db.appRolePermission.count();
  console.log(`Successfully seeded! Roles: ${rolesCount}, Permission Mappings: ${permLinksCount}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error seeding roles:', err);
  process.exit(1);
});
