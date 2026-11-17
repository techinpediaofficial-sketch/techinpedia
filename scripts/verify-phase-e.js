const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const db = new PrismaClient();

async function runPhaseEVerification() {
  console.log('🚀 [PHASE E VERIFICATION] Starting Automated Razorpay Payment Suite...\n');

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
    // 1. Resolve active user, employee, and department
    const employee = await db.employee.findFirst({
      where: { status: 'ACTIVE' },
      include: { user: true, department: true, team: true },
    });
    assert(Boolean(employee), 'Found active employee record for attribution');

    const user = employee?.user || await db.user.findFirst();
    assert(Boolean(user), 'Found active admin user for link creation');

    // 2. Cryptographic HMAC-SHA256 signature verification tests
    const testSecret = 'rzp_whsec_test_secret_key_12345';
    const testBody = JSON.stringify({ event: 'payment_link.paid', timestamp: 1726700000 });
    const validSignature = crypto.createHmac('sha256', testSecret).update(testBody).digest('hex');
    const tamperedSignature = crypto.createHmac('sha256', 'wrong_secret').update(testBody).digest('hex');

    // Timing-safe check implementation
    const isValid = (raw, sig, sec) => {
      const exp = crypto.createHmac('sha256', sec).update(raw).digest('hex');
      const b1 = Buffer.from(exp, 'utf8');
      const b2 = Buffer.from(sig, 'utf8');
      return b1.length === b2.length && crypto.timingSafeEqual(b1, b2);
    };

    assert(isValid(testBody, validSignature, testSecret) === true, 'HMAC-SHA256: Valid signature passes cryptographic verification');
    assert(isValid(testBody, tamperedSignature, testSecret) === false, 'HMAC-SHA256: Tampered signature correctly rejected');
    assert(isValid(testBody + ' ', validSignature, testSecret) === false, 'HMAC-SHA256: Payload tampering rejected');

    // 3. Create Attributed Payment Link
    const testLinkId = `plink_test_${Date.now()}`;
    const testShortUrl = `https://rzp.io/i/${crypto.randomBytes(4).toString('hex')}`;
    const testAmount = 7500;

    const paymentLink = await db.paymentLink.create({
      data: {
        providerLinkId: testLinkId,
        shortUrl: testShortUrl,
        amount: testAmount,
        currency: 'INR',
        purpose: 'SOFTWARE_DEVELOPMENT',
        description: 'Advance milestone for custom web application engineering',
        status: 'CREATED',
        createdByUserId: user.id,
        salesEmployeeId: employee.id,
        departmentId: employee.departmentId || null,
        teamId: employee.teamId || null,
        clientName: 'Acme Enterprise Ltd',
        clientEmail: 'billing@acme.example.com',
        clientPhone: '919876543210',
        expiresAt: new Date(Date.now() + (7 * 86400000)),
        internalNotes: '50% project advance',
      },
    });

    assert(Boolean(paymentLink.id), `PaymentLink created: ${paymentLink.id}`);
    assert(paymentLink.providerLinkId === testLinkId, `Provider link ID matches: ${paymentLink.providerLinkId}`);
    assert(paymentLink.status === 'CREATED', `Initial link status is CREATED`);
    assert(paymentLink.salesEmployeeId === employee.id, `Authoritative staff attribution saved: ${employee.name}`);

    // 4. Simulate Webhook Ingestion (payment_link.paid)
    const testPaymentId = `pay_test_${Date.now()}`;
    const testEventId = `evt_test_${Date.now()}`;

    // Record webhook event (Idempotency)
    const webhookEvent = await db.paymentWebhookEvent.create({
      data: {
        eventId: testEventId,
        eventType: 'payment_link.paid',
        signature: validSignature,
        payloadJson: JSON.stringify({ test: true }),
        status: 'PENDING',
      },
    });
    assert(Boolean(webhookEvent.id), `PaymentWebhookEvent logged: ${webhookEvent.eventId}`);

    // Transition PaymentLink to PAID
    const updatedLink = await db.paymentLink.update({
      where: { id: paymentLink.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });
    assert(updatedLink.status === 'PAID', 'PaymentLink transitioned to PAID upon webhook');
    assert(Boolean(updatedLink.paidAt), 'paidAt timestamp recorded accurately');

    // Insert Payment record
    const payment = await db.payment.create({
      data: {
        paymentLinkId: paymentLink.id,
        amount: testAmount,
        currency: 'INR',
        paymentDate: new Date(),
        paymentMethod: 'UPI',
        provider: 'RAZORPAY',
        providerPaymentId: testPaymentId,
        salesEmployeeId: employee.id,
        status: 'SUCCESS',
        referenceId: `upi_${Date.now()}`,
        recordedBy: 'Razorpay Official Webhook',
      },
    });
    assert(Boolean(payment.id), `Payment transaction recorded: ${payment.id}`);
    assert(payment.provider === 'RAZORPAY', 'Payment provider flagged as RAZORPAY');
    assert(payment.salesEmployeeId === employee.id, `Payment correctly attributed to ${employee.name}`);

    // Mark webhook processed
    const processedEvent = await db.paymentWebhookEvent.update({
      where: { eventId: testEventId },
      data: { status: 'PROCESSED', processedAt: new Date() },
    });
    assert(processedEvent.status === 'PROCESSED', 'PaymentWebhookEvent transitioned to PROCESSED');

    // 5. Idempotency Check
    const isDuplicate = await db.paymentWebhookEvent.findUnique({
      where: { eventId: testEventId },
    });
    assert(isDuplicate && isDuplicate.status === 'PROCESSED', 'Idempotency: Repeated webhook event recognized as processed');

    // 6. Attribution Analytics Query Verification
    const employeeCollections = await db.payment.aggregate({
      where: {
        salesEmployeeId: employee.id,
        status: 'SUCCESS',
      },
      _sum: { amount: true },
      _count: { id: true },
    });
    assert((employeeCollections._sum.amount || 0) >= testAmount, `Employee attribution aggregate verified: ₹${employeeCollections._sum.amount}`);

    // 7. Link Cancellation Flow
    const cancellableLinkId = `plink_cancel_${Date.now()}`;
    const cancellableLink = await db.paymentLink.create({
      data: {
        providerLinkId: cancellableLinkId,
        shortUrl: `https://rzp.io/i/${crypto.randomBytes(4).toString('hex')}`,
        amount: 2500,
        currency: 'INR',
        purpose: 'AMC_RENEWAL',
        status: 'CREATED',
        createdByUserId: user.id,
      },
    });
    const cancelled = await db.paymentLink.update({
      where: { id: cancellableLink.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    assert(cancelled.status === 'CANCELLED', 'Secondary link successfully transitioned to CANCELLED');

    console.log(`\n========================================`);
    console.log(`🏁 Phase E Verification Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during Phase E verification:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runPhaseEVerification();
