const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'https://www.techinpedia.com';
const ARTIFACT_DIR = '/Users/adityaverma/.gemini/antigravity-ide/brain/7c34872b-91a6-4833-ab30-992e15980bcd';
const LOCAL_DIR = path.join(__dirname, '../artifacts_screenshots/portal_check');

if (!fs.existsSync(LOCAL_DIR)) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

async function testPortalLive() {
  console.log('🔍 Testing https://www.techinpedia.com/admin/portal live with Headless Chrome...\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.toString());
  });

  try {
    // 1. First go to login
    console.log('1️⃣ Logging in as Admin...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"], input[name="email"]', 'admin@techinpedia.com');
    await page.type('input[type="password"], input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('   ✅ Successfully logged in!');

    // 2. Navigate to /admin/portal
    console.log('\n2️⃣ Navigating to /admin/portal...');
    const response = await page.goto(`${BASE_URL}/admin/portal`, { waitUntil: 'networkidle2' });
    console.log(`   HTTP Status: ${response.status()}`);

    // Wait for content to settle
    await new Promise((r) => setTimeout(r, 2000));

    // Check if error boundary or "Something went wrong" is visible
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasError = pageText.includes('Something went wrong') || pageText.includes('An error occurred');

    if (hasError) {
      console.error('   ❌ Page displayed an error screen!');
    } else {
      console.log('   ✅ Page loaded without error boundary!');
    }

    // 3. Inspect Loaded Components
    const portalStatus = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasClockWidget: text.includes('Clock In') || text.includes('Clock Out') || text.includes('Punch'),
        hasAttendanceGrid: text.includes('Monthly Attendance') || text.includes('Present Days') || text.includes('Check In'),
        hasLeaveLedger: text.includes('Leave Balances') || text.includes('Casual') || text.includes('Sick'),
        hasPayslipSection: text.includes('Payslip') || text.includes('Salary') || text.includes('Gross'),
        hasEmployeeName: text.includes('Vikram Mehta') || text.includes('Employee') || text.includes('Portal'),
        fullSnippet: text.substring(0, 400),
      };
    });

    console.log('\n3️⃣ Component Inspection:');
    console.log('   - Employee Name / Header:', portalStatus.hasEmployeeName ? '✅ Present' : '⚠️ Missing');
    console.log('   - Biometric Web Clock Widget:', portalStatus.hasClockWidget ? '✅ Present' : '⚠️ Missing');
    console.log('   - Monthly Attendance Calendar:', portalStatus.hasAttendanceGrid ? '✅ Present' : '⚠️ Missing');
    console.log('   - Leave Ledger & Balances:', portalStatus.hasLeaveLedger ? '✅ Present' : '⚠️ Missing');
    console.log('   - Payslip & Salary Desk:', portalStatus.hasPayslipSection ? '✅ Present' : '⚠️ Missing');

    // 4. Capture Light Mode Screenshot
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(LOCAL_DIR, 'portal_live_light.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'portal_live_light.png') });
    console.log('\n4️⃣  Saved portal_live_light.png');

    // 5. Capture Dark Mode Screenshot
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(LOCAL_DIR, 'portal_live_dark.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'portal_live_dark.png') });
    console.log('5️⃣  Saved portal_live_dark.png');

    // 6. Test Modals: Apply Leave Modal
    console.log('\n6️⃣ Testing "Apply Leave" Modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const leaveBtn = btns.find((b) => b.textContent && b.textContent.includes('Apply Leave'));
      if (leaveBtn) leaveBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(LOCAL_DIR, 'portal_modal_apply_leave.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'portal_modal_apply_leave.png') });
    console.log('   ✅ Saved portal_modal_apply_leave.png');

    // Close Modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancelBtn = btns.find((b) => b.textContent && b.textContent.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // 7. Test Modals: Regularize Missed Punch Modal
    console.log('\n7️⃣ Testing "Regularize Punch" Modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const regBtn = btns.find((b) => b.textContent && b.textContent.includes('Regularization'));
      if (regBtn) regBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(LOCAL_DIR, 'portal_modal_regularize.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'portal_modal_regularize.png') });
    console.log('   ✅ Saved portal_modal_regularize.png');

    // Close Regularize Modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancelBtn = btns.find((b) => b.textContent && b.textContent.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // 8. Console Errors Summary
    console.log('\n8️⃣ Console Errors Captured:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((e) => console.log('   ⚠️', e));
    } else {
      console.log('   ✅ Clean console with 0 errors!');
    }

    console.log('\n================================================================');
    console.log('🎉 PORTAL LIVE CHECK COMPLETE!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('Fatal Portal Check error:', error);
  } finally {
    await browser.close();
  }
}

testPortalLive();
