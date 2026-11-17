// ============================================================
// Automated End-to-End Workflow Engine Verification Script
// ============================================================

const assert = require('assert');

// 1. Condition Evaluator Test
function resolveFieldValue(path, context) {
  if (!path) return undefined;
  if (path in context) return context[path];
  const parts = path.split('.');
  let current = context;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

function evaluateRule(actual, operator, expected) {
  if (operator === 'is_empty') {
    return actual === null || actual === undefined || actual === '';
  }
  if (operator === 'is_not_empty') {
    return actual !== null && actual !== undefined && actual !== '';
  }
  const normActual = actual === null || actual === undefined ? '' : actual;
  const normExpected = expected === null || expected === undefined ? '' : expected;

  switch (operator) {
    case 'equals':
      if (typeof normActual === 'number' || !isNaN(Number(normActual))) {
        return Number(normActual) === Number(normExpected);
      }
      return String(normActual).trim().toLowerCase() === String(normExpected).trim().toLowerCase();
    case 'contains':
      return String(normActual).toLowerCase().includes(String(normExpected).toLowerCase());
    case 'greater_than_or_equal':
      return Number(normActual) >= Number(normExpected);
    case 'less_than':
      return Number(normActual) < Number(normExpected);
    default:
      return false;
  }
}

function evaluateConditionGroup(group, contextData) {
  const isAnd = group.logicalOperator === 'AND';
  for (const rule of group.rules || []) {
    const actual = resolveFieldValue(rule.field, contextData);
    const passed = evaluateRule(actual, rule.operator, rule.value);
    if (isAnd && !passed) return false;
    if (!isAnd && passed) return true;
  }
  return isAnd;
}

// 2. Template Variable Interpolation Test
function interpolateTemplate(template, data) {
  return template.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (match, path) => {
    const val = resolveFieldValue(path.trim(), data);
    return val !== undefined && val !== null ? String(val) : '';
  });
}

// 3. Sensitive Data Masking Test
function maskSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitiveData);
  const masked = {};
  const sensitiveRegex = /(password|token|secret|apikey)/i;
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveRegex.test(key) && typeof value === 'string') {
      masked[key] = '***MASKED***';
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

async function runVerification() {
  console.log('🧪 Starting Workflow Engine Automated Test Suite...\n');

  // Test 1: Field Resolver
  const mockLead = {
    lead: {
      name: 'Himanshu Arora',
      score: 85,
      budget: '5 Lakhs',
      service: 'Web Development',
      contact: { email: 'himanshu@techinpedia.com' },
    },
  };
  assert.strictEqual(resolveFieldValue('lead.name', mockLead), 'Himanshu Arora');
  assert.strictEqual(resolveFieldValue('lead.score', mockLead), 85);
  assert.strictEqual(resolveFieldValue('lead.contact.email', mockLead), 'himanshu@techinpedia.com');
  console.log('✅ Test 1 Passed: Deep field path resolution works cleanly.');

  // Test 2: Condition Group (AND logic)
  const groupAnd = {
    logicalOperator: 'AND',
    rules: [
      { field: 'lead.score', operator: 'greater_than_or_equal', value: 60 },
      { field: 'lead.service', operator: 'contains', value: 'Web' },
    ],
  };
  assert.strictEqual(evaluateConditionGroup(groupAnd, mockLead), true);

  const groupAndFail = {
    logicalOperator: 'AND',
    rules: [
      { field: 'lead.score', operator: 'greater_than_or_equal', value: 90 }, // 85 >= 90 is false
      { field: 'lead.service', operator: 'contains', value: 'Web' },
    ],
  };
  assert.strictEqual(evaluateConditionGroup(groupAndFail, mockLead), false);
  console.log('✅ Test 2 Passed: AND Condition Group evaluation accurate.');

  // Test 3: Condition Group (OR logic)
  const groupOr = {
    logicalOperator: 'OR',
    rules: [
      { field: 'lead.score', operator: 'greater_than_or_equal', value: 95 }, // false
      { field: 'lead.budget', operator: 'contains', value: 'Lakh' }, // true
    ],
  };
  assert.strictEqual(evaluateConditionGroup(groupOr, mockLead), true);
  console.log('✅ Test 3 Passed: OR Condition Group evaluation accurate.');

  // Test 4: Variable Interpolation
  const tpl = 'Hi {{lead.name}}, thank you for your enquiry regarding {{lead.service}}.';
  const rendered = interpolateTemplate(tpl, mockLead);
  assert.strictEqual(
    rendered,
    'Hi Himanshu Arora, thank you for your enquiry regarding Web Development.'
  );
  console.log('✅ Test 4 Passed: Dynamic template tag interpolation verified.');

  // Test 5: Sensitive Data Masking
  const payloadWithSecrets = {
    user: 'admin',
    apiKey: 'sk_live_999888777666',
    meta: {
      passwordHash: 'secret_hash_value',
      publicInfo: 'visible',
    },
  };
  const masked = maskSensitiveData(payloadWithSecrets);
  assert.strictEqual(masked.apiKey, '***MASKED***');
  assert.strictEqual(masked.meta.passwordHash, '***MASKED***');
  assert.strictEqual(masked.meta.publicInfo, 'visible');
  console.log('✅ Test 5 Passed: Sensitive credential masking verified.');

  console.log('\n🎉 ALL 5 WORKFLOW ENGINE TESTS PASSED SUCCESSFULLY!\n');
}

runVerification().catch((e) => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
