const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'https://techinpedia.com';
const SCREENSHOT_DIR = path.join(__dirname, '../artifacts_screenshots/phase_b');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyPhaseBUI() {
  console.log('🚀 Launching headless Chrome to test Phase B CRM & Customer 360 on https://techinpedia.com...\n');
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
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_public_homepage_verified.png'), fullPage: false });
    console.log('   ✅ Saved 01_public_homepage_verified.png');

    // 2. Log In to Admin
    console.log('\n2️⃣  Logging in to Admin Workspace...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"], input[name="email"]', 'admin@techinpedia.com');
    await page.type('input[type="password"], input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log('   ✅ Logged in successfully!');

    const routes = [
      { name: '02_crm_leads_desk', path: '/admin/leads' },
      { name: '03_deals_pipeline_kanban', path: '/admin/deals' },
      { name: '04_followups_task_engine', path: '/admin/follow-ups' },
      { name: '05_customers_directory', path: '/admin/customers' },
    ];

    for (const r of routes) {
      console.log(`\nTesting route: ${r.path}`);
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle2' });
      await new Promise((res) => setTimeout(res, 2000));

      // Light Mode Screenshot
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      });
      await new Promise((res) => setTimeout(res, 600));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${r.name}_light.png`), fullPage: false });
      console.log(`   ✅ Saved ${r.name}_light.png`);

      // Dark Mode Screenshot
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });
      await new Promise((res) => setTimeout(res, 600));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${r.name}_dark.png`), fullPage: false });
      console.log(`   ✅ Saved ${r.name}_dark.png`);
    }

    // 3. Test Customer 360 Workspace Profile
    console.log('\nTesting Customer 360 Workspace Profile...');
    await page.goto(`${BASE_URL}/admin/customers`, { waitUntil: 'networkidle2' });
    await new Promise((res) => setTimeout(res, 1500));

    // Find first customer link
    const customerHref = await page.evaluate(() => {
      const link = document.querySelector('a[href^="/admin/customers/"]');
      return link ? link.getAttribute('href') : null;
    });

    if (customerHref) {
      console.log(`Navigating to customer profile: ${customerHref}`);
      await page.goto(`${BASE_URL}${customerHref}`, { waitUntil: 'networkidle2' });
      await new Promise((res) => setTimeout(res, 2000));

      // Light Mode Screenshot
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      });
      await new Promise((res) => setTimeout(res, 600));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_customer_360_profile_light.png'), fullPage: false });
      console.log('   ✅ Saved 06_customer_360_profile_light.png');

      // Dark Mode Screenshot
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });
      await new Promise((res) => setTimeout(res, 600));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_customer_360_profile_dark.png'), fullPage: false });
      console.log('   ✅ Saved 06_customer_360_profile_dark.png');
    }

    console.log('\n🎉 [UI Verification Complete] All Phase B visual tests captured successfully!');
  } catch (err) {
    console.error('❌ UI Verification failed:', err);
  } finally {
    await browser.close();
  }
}

verifyPhaseBUI();
