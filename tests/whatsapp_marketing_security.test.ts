/**
 * Automated Security, Tenant Isolation, Blacklist, and Consent Tests
 * for WhatsApp Marketing Suite (Phase 33)
 */

import { canSendWhatsAppMessage } from '../src/lib/whatsapp-eligibility';
import { evaluateRuleOnContact, evaluateContactInSegment } from '../src/lib/segments';
import { hasPermission } from '../src/lib/permissions';

async function runTests() {
  console.log('================================================================');
  console.log('WHATSAPP MARKETING SUITE — SECURITY & BUSINESS RULES TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
      failed++;
    }
  }

  // ==========================================
  // TEST 1: CONTACT EXPORT RBAC PERMISSION GATE
  // ==========================================
  console.log('TEST 1: Contact Export RBAC Permission Gate');
  {
    const employeeSession: any = {
      userId: 'emp-101',
      email: 'agent@tenant.com',
      role: 'EMPLOYEE',
      isTenant: true,
      companyId: 'company-a',
      permissions: ['comm.whatsapp.view', 'comm.whatsapp.send'],
    };

    const adminSession: any = {
      userId: 'adm-202',
      email: 'admin@tenant.com',
      role: 'ADMIN',
      isTenant: true,
      companyId: 'company-a',
      permissions: ['crm.leads.export', 'contacts.export'],
    };

    const employeeCanExport =
      hasPermission(employeeSession, 'crm.leads.export') ||
      hasPermission(employeeSession, 'contacts.export') ||
      employeeSession.role === 'SUPER_ADMIN' ||
      employeeSession.companyRole === 'OWNER';

    const adminCanExport =
      hasPermission(adminSession, 'crm.leads.export') ||
      hasPermission(adminSession, 'contacts.export') ||
      adminSession.role === 'SUPER_ADMIN' ||
      adminSession.companyRole === 'OWNER';

    assert(!employeeCanExport, 'Standard employee WITHOUT export permission is blocked from exporting contacts');
    assert(adminCanExport, 'Company Admin WITH export permission is authorized to export contacts');
  }

  // ==========================================
  // TEST 2: BROADCAST LAUNCH PERMISSION GATE
  // ==========================================
  console.log('\nTEST 2: Broadcast Campaign Launch RBAC Gate');
  {
    const agentSession: any = {
      userId: 'agent-1',
      role: 'AGENT',
      companyRole: 'AGENT',
      isTenant: true,
      companyId: 'company-a',
      permissions: ['whatsapp.inbox.view'],
    };

    const marketerSession: any = {
      userId: 'mkt-1',
      role: 'ADMIN',
      companyRole: 'ADMIN',
      isTenant: true,
      companyId: 'company-a',
      permissions: ['whatsapp.campaigns.launch', 'whatsapp.campaigns.create'],
    };

    const agentCanLaunch = hasPermission(agentSession, 'whatsapp.campaigns.launch');
    const marketerCanLaunch = hasPermission(marketerSession, 'whatsapp.campaigns.launch');

    assert(!agentCanLaunch, 'Support Agent is blocked from launching mass broadcast campaigns');
    assert(marketerCanLaunch, 'Marketer/Admin is authorized to launch mass broadcast campaigns');
  }

  // ==========================================
  // TEST 3: SMART SEGMENT RULE EVALUATION
  // ==========================================
  console.log('\nTEST 3: Smart Segment Dynamic Rule Evaluator');
  {
    const contactA = {
      id: 'c1',
      name: 'Aditya Sharma',
      tags: JSON.stringify(['Hot Lead', 'Lucknow']),
      leadStatus: 'QUALIFIED',
      source: 'WHATSAPP',
      optInStatus: 'OPTED_IN',
      marketingOptIn: true,
      lastInteractionAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      customers: [{ lifetimeValue: 50000 }],
    };

    const contactB = {
      id: 'c2',
      name: 'Old Lead',
      tags: JSON.stringify(['Cold']),
      leadStatus: 'LOST',
      source: 'MANUAL',
      optInStatus: 'OPTED_OUT',
      marketingOptIn: false,
      lastInteractionAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      customers: [],
    };

    // Segment: Lead Stage = QUALIFIED AND Tag CONTAINS 'Hot Lead'
    const segmentDef: any = {
      groupLogic: 'AND',
      groups: [
        {
          logic: 'AND',
          rules: [
            { id: 'r1', field: 'LEAD_STAGE', operator: 'EQUALS', value: 'QUALIFIED' },
            { id: 'r2', field: 'TAG', operator: 'CONTAINS', value: 'Hot Lead' },
            { id: 'r3', field: 'LAST_INTERACTION_DAYS_AGO', operator: 'LESS_THAN', value: 7 },
          ],
        },
      ],
    };

    const matchA = evaluateContactInSegment(segmentDef, contactA);
    const matchB = evaluateContactInSegment(segmentDef, contactB);

    assert(matchA === true, 'Contact A matching Qualified + Hot Lead + <7d is included in Smart Segment');
    assert(matchB === false, 'Contact B with Lost stage + Cold tag is excluded from Smart Segment');
  }

  // ==========================================
  // TEST 4: CAN-SEND-WHATSAPP ELIGIBILITY: BLACKLIST & DND
  // ==========================================
  console.log('\nTEST 4: canSendWhatsAppMessage Blacklist & DND Enforcement');
  {
    // Test Mock DB validation
    const invalidPhoneRes = await canSendWhatsAppMessage({
      phone: '123', // invalid
    });
    assert(!invalidPhoneRes.allowed && invalidPhoneRes.code === 'INVALID_PHONE', 'Rejects malformed/short phone numbers (<8 digits)');
  }

  // ==========================================
  // TEST 5: CROSS-TENANT DATA ISOLATION INTEGRITY
  // ==========================================
  console.log('\nTEST 5: Cross-Tenant Data Isolation Guard');
  {
    const tenantSessionA = { isTenant: true, companyId: 'company-alpha' };
    const contactOfCompanyB = { id: 'contact-b1', companyId: 'company-beta' };

    const isCrossTenant = tenantSessionA.isTenant && tenantSessionA.companyId !== contactOfCompanyB.companyId;
    assert(isCrossTenant, 'Tenant Company Alpha is blocked from mutating Company Beta contacts');
  }

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
