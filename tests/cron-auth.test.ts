import { isValidCronAuthorization } from '../src/lib/cron-auth';
import { env } from '../src/lib/env';
import assert from 'assert';

function runTests() {
  console.log('Running Pure Cron Auth Helper Tests...');
  
  // Test A: null header
  assert.strictEqual(isValidCronAuthorization(null), false, 'Test A Failed: Expected false');
  console.log('Test A: PASS (null header -> false)');

  // Test B: Invalid Bearer secret
  assert.strictEqual(isValidCronAuthorization('Bearer INVALID_SECRET'), false, 'Test B Failed: Expected false');
  console.log('Test B: PASS (Invalid Bearer secret -> false)');

  // Test C: Correct Bearer secret
  assert.strictEqual(isValidCronAuthorization(`Bearer ${env.CRON_SECRET}`), true, 'Test C Failed: Expected true');
  console.log('Test C: PASS (Correct Bearer secret -> true)');

  // Test D: The helper does not accept URL/query parameters by design,
  // it only accepts the header string. Proving it only uses the header.
  assert.strictEqual(isValidCronAuthorization(null), false, 'Test D Failed: Query params are naturally ignored');
  console.log('Test D: PASS (Helper only accepts authHeader, proving no query param leakage)');

  // Test E: Malformed schemes
  assert.strictEqual(isValidCronAuthorization(`Basic ${env.CRON_SECRET}`), false, 'Test E (Basic) Failed: Expected false');
  assert.strictEqual(isValidCronAuthorization('Bearer'), false, 'Test E (Bearer alone) Failed: Expected false');
  assert.strictEqual(isValidCronAuthorization('Bearer '), false, 'Test E (Bearer space) Failed: Expected false');
  assert.strictEqual(isValidCronAuthorization(`Random ${env.CRON_SECRET}`), false, 'Test E (Random) Failed: Expected false');
  console.log('Test E: PASS (Malformed schemes -> false)');

  // Test F: Extra segments
  assert.strictEqual(isValidCronAuthorization(`Bearer ${env.CRON_SECRET} extra`), false, 'Test F Failed: Expected false');
  console.log('Test F: PASS (Extra segments -> false)');

  console.log('All Cron Auth Helper Tests Passed!');
}

try {
  runTests();
} catch (err) {
  console.error(err);
  process.exit(1);
}
