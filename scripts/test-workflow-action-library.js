// ============================================================
// Automated Test Suite for Workflow Action Library & Registry
// ============================================================

const fs = require('fs');
const path = require('path');

// Manually load .env if not loaded
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('🚀 Starting Business Automation Step Library Test Suite...\n');
  let passed = 0;
  let failed = 0;

  // ------------------------------------------------------------
  // TEST 1: Universal Registry & Categories Verification
  // ------------------------------------------------------------
  try {
    const { WORKFLOW_CATEGORIES, ACTION_REGISTRY, TRIGGER_REGISTRY } = require('../src/lib/workflow/registry');

    const expectedCategories = [
      'Communication',
      'Leads & CRM',
      'Deals & Sales',
      'Tasks & Meetings',
      'Quotations & Finance',
      'Support',
      'Rental & AMC',
      'HRM',
      'Data & Integrations',
      'Logic & Branching',
      'Timing & Scheduling',
      'Advanced',
    ];

    const actualCategories = WORKFLOW_CATEGORIES.map((c) => c.id);
    const missingCategories = expectedCategories.filter((c) => !actualCategories.includes(c));

    if (missingCategories.length > 0) {
      throw new Error(`Missing expected categories: ${missingCategories.join(', ')}`);
    }

    const actionCount = Object.keys(ACTION_REGISTRY).length;
    if (actionCount < 25) {
      throw new Error(`Action registry has only ${actionCount} actions. Expected at least 25.`);
    }

    console.log(`✅ [1/5] Registry & Categories Verified (${actualCategories.length} categories, ${actionCount} actions, ${Object.keys(TRIGGER_REGISTRY).length} triggers)`);
    passed++;
  } catch (err) {
    console.error('❌ [1/5] Registry & Categories Failed:', err.message);
    failed++;
  }

  // ------------------------------------------------------------
  // TEST 2: Action Runners Across CRM, Deals, Tasks, Finance & Support
  // ------------------------------------------------------------
  try {
    const { executeAction } = require('../src/lib/workflow/actionRunner');

    // Create a temporary enquiry to test real database mutations
    const testEnquiry = await prisma.enquiry.create({
      data: {
        name: 'Automated Test Client',
        email: `test-${Date.now()}@automation.techinpedia.com`,
        phone: '+91 99999 88888',
        service: 'Enterprise Cloud App',
        budget: '5 Lakh - 10 Lakh',
        score: 20,
        status: 'NEW',
        message: 'Testing action runner executors',
      },
    });

    const context = {
      lead: {
        id: testEnquiry.id,
        name: testEnquiry.name,
        email: testEnquiry.email,
        phone: testEnquiry.phone,
        score: testEnquiry.score,
        company: 'Automated Testing Ltd',
      },
      entityId: testEnquiry.id,
    };

    // Test 2a: ADJUST_LEAD_SCORE
    const scoreRes = await executeAction('ADJUST_LEAD_SCORE', { operation: 'ADD', points: 30 }, context);
    if (!scoreRes.success || scoreRes.output.newScore !== 50) {
      throw new Error(`ADJUST_LEAD_SCORE failed: expected 50, got ${scoreRes.output?.newScore}`);
    }

    // Test 2b: UPDATE_LEAD (Status & Priority)
    const updateRes = await executeAction('UPDATE_LEAD', { status: 'QUALIFIED', priority: 'URGENT' }, context);
    if (!updateRes.success) {
      throw new Error(`UPDATE_LEAD failed: ${updateRes.error}`);
    }

    // Test 2c: ADD_LEAD_TAG
    const tagRes = await executeAction('ADD_LEAD_TAG', { tag: 'High-Value-Test' }, context);
    if (!tagRes.success) {
      throw new Error(`ADD_LEAD_TAG failed: ${tagRes.error}`);
    }

    // Test 2d: CREATE_FOLLOW_UP
    const followUpRes = await executeAction('CREATE_FOLLOW_UP', { title: 'Call {{lead.name}}', delayHours: 48 }, context);
    if (!followUpRes.success || !followUpRes.output.followUpId) {
      throw new Error(`CREATE_FOLLOW_UP failed: ${followUpRes.error}`);
    }

    // Test 2e: CREATE_DEAL
    const dealRes = await executeAction('CREATE_DEAL', { title: 'Deal for {{lead.company}}', value: 350000 }, context);
    if (!dealRes.success || !dealRes.output.dealId) {
      throw new Error(`CREATE_DEAL failed: ${dealRes.error}`);
    }

    // Test 2f: CREATE_INVOICE
    const invoiceRes = await executeAction('CREATE_INVOICE', { clientName: '{{lead.name}}', clientEmail: '{{lead.email}}', totalAmount: 75000 }, context);
    if (!invoiceRes.success || !invoiceRes.output.invoiceId) {
      throw new Error(`CREATE_INVOICE failed: ${invoiceRes.error}`);
    }

    // Test 2g: CREATE_TICKET
    const ticketRes = await executeAction('CREATE_TICKET', { subject: 'Urgent setup for {{lead.name}}', priority: 'HIGH' }, context);
    if (!ticketRes.success || !ticketRes.output.ticketId) {
      throw new Error(`CREATE_TICKET failed: ${ticketRes.error}`);
    }

    // Clean up temporary records
    await prisma.followUp.delete({ where: { id: followUpRes.output.followUpId } }).catch(() => {});
    await prisma.deal.delete({ where: { id: dealRes.output.dealId } }).catch(() => {});
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: invoiceRes.output.invoiceId } }).catch(() => {});
    await prisma.invoice.delete({ where: { id: invoiceRes.output.invoiceId } }).catch(() => {});
    await prisma.supportTicket.delete({ where: { id: ticketRes.output.ticketId } }).catch(() => {});
    await prisma.entityTag.deleteMany({ where: { entityId: testEnquiry.id } }).catch(() => {});
    await prisma.enquiry.delete({ where: { id: testEnquiry.id } }).catch(() => {});

    console.log('✅ [2/5] Real Backend Action Executors Passed (Lead Scoring, Update, Tags, Follow-ups, Deals, Invoices, Tickets)');
    passed++;
  } catch (err) {
    console.error('❌ [2/5] Action Runners Failed:', err.message);
    failed++;
  }

  // ------------------------------------------------------------
  // TEST 3: Advanced Logic & Calculations (SET_VARIABLE & Logic)
  // ------------------------------------------------------------
  try {
    const { executeAction } = require('../src/lib/workflow/actionRunner');

    const calcRes = await executeAction('SET_VARIABLE', {
      variableName: 'calculated_tax',
      valueExpression: '1000 * 0.18',
    }, {});

    if (!calcRes.success || calcRes.output.value !== 180) {
      throw new Error(`SET_VARIABLE calculation failed: expected 180, got ${calcRes.output?.value}`);
    }

    console.log('✅ [3/5] Advanced Calculation Step (SET_VARIABLE) Passed');
    passed++;
  } catch (err) {
    console.error('❌ [3/5] SET_VARIABLE Failed:', err.message);
    failed++;
  }

  // ------------------------------------------------------------
  // TEST 4: Date-Relative Delay Calculations
  // ------------------------------------------------------------
  try {
    const { calculateDelayTarget } = require('../src/lib/workflow/queueEngine');

    // Test relative hours
    const delay1 = calculateDelayTarget({ delayType: 'RELATIVE', duration: 2, unit: 'HOURS' });
    const diffHours = (delay1.getTime() - Date.now()) / (3600 * 1000);
    if (Math.abs(diffHours - 2) > 0.05) {
      throw new Error(`Relative delay mismatch: expected ~2 hours, got ${diffHours}`);
    }

    // Test CRM date relative (2 days before invoice dueDate)
    const futureDate = new Date(Date.now() + 10 * 24 * 3600 * 1000);
    const delay2 = calculateDelayTarget(
      { delayType: 'DATE_RELATIVE', dateField: 'invoice.dueDate', relativeOffsetDays: -2 },
      { invoice: { dueDate: futureDate.toISOString() } }
    );
    const expectedDiffDays = (delay2.getTime() - Date.now()) / (24 * 3600 * 1000);
    if (Math.abs(expectedDiffDays - 8) > 0.1) {
      throw new Error(`Date-relative delay mismatch: expected ~8 days, got ${expectedDiffDays}`);
    }

    console.log('✅ [4/5] Timing & Date-Relative Delay Engine Passed');
    passed++;
  } catch (err) {
    console.error('❌ [4/5] Delay Target Calculation Failed:', err.message);
    failed++;
  }

  // ------------------------------------------------------------
  // TEST 5: End-to-End Multi-Step Graph Execution (Dry-Run & Real)
  // ------------------------------------------------------------
  try {
    const { executeWorkflowGraph } = require('../src/lib/workflow/queueEngine');

    const multiStepDefinition = {
      nodes: [
        {
          id: 'n-trigger',
          name: 'Lead Trigger',
          type: 'TRIGGER',
          config: { event: 'crm.lead.created' },
        },
        {
          id: 'n-calc',
          name: 'Calculate Estimated Value',
          type: 'ACTION',
          config: {
            actionType: 'SET_VARIABLE',
            params: { variableName: 'budgetMultiplier', valueExpression: '5 * 20000' },
          },
        },
        {
          id: 'n-branch',
          name: 'High-Value Filter',
          type: 'BRANCH',
          config: {
            conditionGroup: {
              id: 'cg-1',
              logicalOperator: 'AND',
              rules: [{ id: 'r-1', field: 'lead.score', operator: 'greater_than', value: 50 }],
            },
          },
        },
        {
          id: 'n-action-true',
          name: 'Send VIP WhatsApp',
          type: 'ACTION',
          config: {
            actionType: 'SEND_WHATSAPP',
            params: { recipientPhone: '{{lead.phone}}', messageText: 'VIP Greeting for {{lead.name}}' },
          },
        },
      ],
      edges: [
        { id: 'e-1', sourceNodeId: 'n-trigger', targetNodeId: 'n-calc' },
        { id: 'e-2', sourceNodeId: 'n-calc', targetNodeId: 'n-branch' },
        { id: 'e-3', sourceNodeId: 'n-branch', targetNodeId: 'n-action-true', branchType: 'TRUE' },
      ],
    };

    const context = {
      executionId: 'exec-test-dryrun',
      workflowId: 'wf-test-1',
      workflowVersion: 1,
      triggerEvent: 'crm.lead.created',
      payload: { entityId: 'lead-1', entityType: 'LEAD', data: { name: 'VIP Lead', phone: '9818768680', score: 85 } },
      variables: { lead: { name: 'VIP Lead', phone: '9818768680', score: 85 } },
      stepResults: {},
      isDryRun: true,
    };

    const result = await executeWorkflowGraph(multiStepDefinition, 'n-trigger', context);

    if (result.completedSteps.length < 4) {
      throw new Error(`Expected at least 4 executed steps in dry-run, got ${result.completedSteps.length}`);
    }

    const branchStep = result.completedSteps.find((s) => s.nodeId === 'n-branch');
    if (branchStep?.chosenBranch !== 'TRUE') {
      throw new Error(`Expected branch to choose TRUE for score 85 > 50, got ${branchStep?.chosenBranch}`);
    }

    console.log(`✅ [5/5] Multi-Step Graph Execution Passed (${result.completedSteps.length} steps simulated, branch evaluated TRUE)`);
    passed++;
  } catch (err) {
    console.error('❌ [5/5] Multi-Step Graph Execution Failed:', err.message);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
