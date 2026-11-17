import { 
  getAccessibleBusinessUnits, 
  canAccessBusinessUnit,
  requireBusinessUnitAccess
} from '../src/lib/business-units';
import { normalizeHostname } from '../src/lib/site-context';
import { AuthorizationError } from '../src/lib/auth-errors';
import assert from 'assert';

function runTests() {
  console.log('Running Business Unit Isolation Tests...');
  
  // Test 1: Super Admin
  const superAdminSession = {
    userId: '1',
    email: 'admin@test.com',
    role: 'SUPER_ADMIN' as any,
    mustChangePassword: false,
  };
  assert.deepStrictEqual(getAccessibleBusinessUnits(superAdminSession), ['*']);
  assert.strictEqual(canAccessBusinessUnit(superAdminSession, 'MARKETPLACE'), true);
  console.log('Test 1: PASS (Super Admin has global access)');

  // Test 2: Employee with specific access
  const empSession = {
    userId: '2',
    email: 'emp@test.com',
    role: 'ADMIN' as any,
    mustChangePassword: false,
    businessUnitIds: ['COMPANY_SERVICES']
  };
  assert.deepStrictEqual(getAccessibleBusinessUnits(empSession), ['COMPANY_SERVICES']);
  assert.strictEqual(canAccessBusinessUnit(empSession, 'COMPANY_SERVICES'), true);
  assert.strictEqual(canAccessBusinessUnit(empSession, 'MARKETPLACE'), false);
  console.log('Test 2: PASS (Employee restricted to specific units)');

  // Test 3: Require Business Unit Access throws properly
  let threw = false;
  try {
    requireBusinessUnitAccess(empSession, 'MARKETPLACE');
  } catch (e) {
    if (e instanceof AuthorizationError) threw = true;
  }
  assert.strictEqual(threw, true);
  console.log('Test 3: PASS (requireBusinessUnitAccess throws AuthorizationError for denied unit)');

  // Test 4: Multi-unit Employee
  const multiSession = {
    userId: '3',
    email: 'multi@test.com',
    role: 'ADMIN' as any,
    mustChangePassword: false,
    businessUnitIds: ['COMPANY_SERVICES', 'MARKETPLACE']
  };
  assert.strictEqual(canAccessBusinessUnit(multiSession, 'COMPANY_SERVICES'), true);
  assert.strictEqual(canAccessBusinessUnit(multiSession, 'MARKETPLACE'), true);
  console.log('Test 4: PASS (Multi-unit employee access works)');

  // Test 5: Hostname Normalization
  assert.strictEqual(normalizeHostname('http://www.techinpedia.com'), 'techinpedia.com');
  assert.strictEqual(normalizeHostname('https://marketplace.techinpedia.com:3000'), 'marketplace.techinpedia.com');
  assert.strictEqual(normalizeHostname('PORTAL.EXAMPLE.COM '), 'portal.example.com');
  assert.strictEqual(normalizeHostname(null), '');
  console.log('Test 5: PASS (Hostname normalizer works)');

  console.log('All Business Unit Tests Passed!');
}

try {
  runTests();
} catch (err) {
  console.error(err);
  process.exit(1);
}
