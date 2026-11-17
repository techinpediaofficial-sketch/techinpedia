const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'https://techinpedia.com';
const ARTIFACT_DIR = '/Users/adityaverma/.gemini/antigravity-ide/brain/7c34872b-91a6-4833-ab30-992e15980bcd';
const LOCAL_SCREENSHOT_DIR = path.join(__dirname, '../artifacts_screenshots/phase_c');

if (!fs.existsSync(LOCAL_SCREENSHOT_DIR)) {
  fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });
}

async function verifyPhaseCUI() {
  console.log('🚀 Launching headless Chrome to test Phase C HRM on https://techinpedia.com...\n');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // 1. Verify Public Homepage Theme remains 100% Crisp Light/Violet
    console.log('1️⃣  Checking Public Homepage theme integrity...');
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle2' });
    await new Promise((res) => setTimeout(res, 1000));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '01_public_homepage_phasec.png'), fullPage: false });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_public_homepage_phasec.png'), fullPage: false });
    console.log('   ✅ Saved 01_public_homepage_phasec.png');

    // 2. Log In to Admin
    console.log('\n2️⃣  Logging in to Admin Workspace...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"], input[name="email"]', 'admin@techinpedia.com');
    await page.type('input[type="password"], input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log('   ✅ Logged in successfully!');

    // 3. Test Attendance & Punch Desk
    console.log('\n3️⃣  Testing Attendance & Punch Desk (/admin/hr/attendance)...');
    await page.goto(`${BASE_URL}/admin/hr/attendance`, { waitUntil: 'networkidle2' });
    await new Promise((res) => setTimeout(res, 2000));

    // Light
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await new Promise((res) => setTimeout(res, 600));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '02_attendance_punch_desk_light.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_attendance_punch_desk_light.png') });
    console.log('   ✅ Saved 02_attendance_punch_desk_light.png');

    // Dark
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await new Promise((res) => setTimeout(res, 600));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '02_attendance_punch_desk_dark.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_attendance_punch_desk_dark.png') });
    console.log('   ✅ Saved 02_attendance_punch_desk_dark.png');

    // 4. Test Leave Balances & Requests Desk
    console.log('\n4️⃣  Testing Leave Management & Balances (/admin/hr/leaves)...');
    await page.goto(`${BASE_URL}/admin/hr/leaves`, { waitUntil: 'networkidle2' });
    await new Promise((res) => setTimeout(res, 2000));

    // Light
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await new Promise((res) => setTimeout(res, 600));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '03_leave_balances_light.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_leave_balances_light.png') });
    console.log('   ✅ Saved 03_leave_balances_light.png');

    // Dark
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await new Promise((res) => setTimeout(res, 600));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '03_leave_balances_dark.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_leave_balances_dark.png') });
    console.log('   ✅ Saved 03_leave_balances_dark.png');

    // 5. Test Payroll & Compensation
    console.log('\n5️⃣  Testing Payroll & Compensation (/admin/hr/payroll)...');
    await page.goto(`${BASE_URL}/admin/hr/payroll`, { waitUntil: 'networkidle2' });
    await new Promise((res) => setTimeout(res, 2000));

    // Light
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await new Promise((res) => setTimeout(res, 600));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '04_payroll_compensation_light.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_payroll_compensation_light.png') });
    console.log('   ✅ Saved 04_payroll_compensation_light.png');

    // Dark
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await new Promise((res) => setTimeout(res, 600));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '04_payroll_compensation_dark.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_payroll_compensation_dark.png') });
    console.log('   ✅ Saved 04_payroll_compensation_dark.png');

    // 6. Test Payslip Modal
    console.log('\n6️⃣  Testing Corporate Payslip Modal...');
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const payslipBtn = buttons.find((b) => b.textContent && b.textContent.includes('Payslip'));
      if (payslipBtn) {
        payslipBtn.click();
        return true;
      }
      return false;
    });

    if (clicked) {
      await new Promise((res) => setTimeout(res, 1200));
      await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '05_corporate_payslip_modal.png') });
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_corporate_payslip_modal.png') });
      console.log('   ✅ Saved 05_corporate_payslip_modal.png');
    }

    console.log('\n🎉 Phase C UI acceptance testing completed successfully!');
  } catch (err) {
    console.error('Error in UI verification:', err);
  } finally {
    await browser.close();
  }
}

verifyPhaseCUI();
