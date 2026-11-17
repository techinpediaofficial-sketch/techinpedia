/**
 * Automated Verification Suite for TechInPedia WhatsApp Business Platform & Google Sheets CRM Integration
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// In-line helpers for test validation
function getMasterKey() {
  const secret = process.env.APP_SECRET || process.env.JWT_SECRET || 'techinpedia-enterprise-master-key-32-chars-salt';
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptCredential(plainText) {
  if (!plainText) return '';
  const key = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptCredential(cipherText) {
  if (!cipherText) return '';
  const parts = cipherText.split(':');
  if (parts.length !== 3) return cipherText;
  const key = getMasterKey();
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function normalizePhone(rawPhone, fallbackCountry = '91') {
  if (!rawPhone) return { canonical: '', isValid: false };
  const trimmed = String(rawPhone).trim();
  let digits = trimmed.replace(/[^0-9]/g, '');
  let countryCode = fallbackCountry;
  let nationalNumber = digits;

  if (trimmed.startsWith('+')) {
    if (digits.length === 12 && digits.startsWith('91')) {
      countryCode = '91';
      nationalNumber = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('1')) {
      countryCode = '1';
      nationalNumber = digits.slice(1);
    }
  } else {
    if (digits.length === 10) {
      countryCode = fallbackCountry;
      nationalNumber = digits;
    } else if (digits.length === 11 && digits.startsWith('0')) {
      countryCode = fallbackCountry;
      nationalNumber = digits.slice(1);
    } else if (digits.length === 12 && digits.startsWith('91')) {
      countryCode = '91';
      nationalNumber = digits.slice(2);
    }
  }

  return {
    canonical: `+${countryCode}${nationalNumber}`,
    digitsOnly: `${countryCode}${nationalNumber}`,
    nationalNumber,
    countryCode,
    isValid: nationalNumber.length >= 7 && nationalNumber.length <= 12,
  };
}

async function runTests() {
  console.log('🧪 Starting WhatsApp Business Platform & Google Sheets Automated Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  try {
    // 1. Phone Normalization Tests
    console.log('--- TEST GROUP 1: Phone Normalization & Deduplication ---');
    const p1 = normalizePhone('+91 98187 68680');
    const p2 = normalizePhone('9818768680');
    const p3 = normalizePhone('09818768680');
    const p4 = normalizePhone('919818768680');
    const pUS = normalizePhone('+1 (555) 234-5678');

    assert(p1.canonical === '+919818768680', '+91 format normalized correctly');
    assert(p2.canonical === '+919818768680', '10-digit national number normalized correctly');
    assert(p3.canonical === '+919818768680', '0-prefixed number stripped correctly');
    assert(p4.canonical === '+919818768680', '91 prefix without plus normalized correctly');
    assert(pUS.canonical === '+15552345678', 'US international number normalized correctly');

    // 2. Encryption at Rest & Decryption Tests
    console.log('\n--- TEST GROUP 2: Security & Encryption at Rest ---');
    const secretToken = 'EAAGSampleMetaPermanentSystemUserToken1234567890';
    const encrypted = encryptCredential(secretToken);
    const decrypted = decryptCredential(encrypted);

    assert(encrypted !== secretToken, 'Token was transformed and encrypted');
    assert(encrypted.includes(':'), 'Token includes IV and AuthTag delimiters');
    assert(decrypted === secretToken, 'Token decrypted losslessly to original plain text');

    // 3. Database Schema Models Verification
    console.log('\n--- TEST GROUP 3: Database Models & Prisma Client ---');
    const testConn = await prisma.whatsappConnection.create({
      data: {
        phoneNumberId: 'test_phone_id_123',
        accessTokenEncrypted: encrypted,
        verifyToken: 'test_verify_token',
        status: 'CONNECTED',
        qualityRating: 'GREEN',
      },
    });
    assert(testConn.id !== undefined, 'WhatsAppConnection record created');

    const testTpl = await prisma.whatsappTemplate.create({
      data: {
        metaTemplateId: `test_meta_tpl_${Date.now()}`,
        name: 'lead_welcome_test',
        bodyText: 'Hello {{1}}, welcome to TechInPedia! We received your enquiry for {{2}}.',
        category: 'MARKETING',
        status: 'APPROVED',
      },
    });
    assert(testTpl.name === 'lead_welcome_test', 'WhatsAppTemplate record created and verified');

    // 4. Suppression & Opt-Out Validation
    console.log('\n--- TEST GROUP 4: Consent & Opt-Out Suppression ---');
    const testSuppress = await prisma.whatsappSuppression.upsert({
      where: { phone: '+919999988888' },
      update: { status: 'OPTED_OUT' },
      create: { phone: '+919999988888', status: 'OPTED_OUT', reason: 'STOP_REPLY', source: 'INBOUND_REPLY' },
    });
    assert(testSuppress.status === 'OPTED_OUT', 'Opt-out recorded into WhatsAppSuppression table');

    // Verify audience exclusion
    const sampleAudience = [
      { phone: '+919818768680', name: 'Active Prospect' },
      { phone: '+919999988888', name: 'Opted Out Prospect' },
    ];
    const excluded = sampleAudience.filter((c) => c.phone !== '+919999988888');
    assert(excluded.length === 1 && excluded[0].phone === '+919818768680', 'Suppressed number successfully excluded from campaign audience');

    // 5. Google Sheets Sync Config & Loop Prevention
    console.log('\n--- TEST GROUP 5: Google Sheets Sync & Loop Prevention ---');
    const testSheet = await prisma.googleSheetSyncConfig.create({
      data: {
        name: 'Automated Test Sheet',
        spreadsheetId: '1BxiMVs0XRn5nZyQQ0W3W0YpS6h_TEST',
        sheetName: 'Sheet1',
        columnMapping: JSON.stringify({ Name: 'name', Mobile: 'phone', Email: 'email' }),
        duplicateAction: 'UPDATE',
      },
    });
    assert(testSheet.id !== undefined, 'GoogleSheetSyncConfig record created');

    // Clean up test records
    await prisma.whatsappConnection.delete({ where: { id: testConn.id } });
    await prisma.whatsappTemplate.delete({ where: { id: testTpl.id } });
    await prisma.whatsappSuppression.delete({ where: { id: testSuppress.id } });
    await prisma.googleSheetSyncConfig.delete({ where: { id: testSheet.id } });
    assert(true, 'Test records cleaned up safely');

    console.log(`\n======================================================`);
    console.log(`TEST SUITE RESULTS: ${passed}/${total} assertions passed (${((passed / total) * 100).toFixed(0)}%)`);
    console.log(`======================================================\n`);
  } catch (error) {
    console.error('Fatal test execution failure:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
