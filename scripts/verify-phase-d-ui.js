const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'https://techinpedia.com';
const ARTIFACT_DIR = '/Users/adityaverma/.gemini/antigravity-ide/brain/7c34872b-91a6-4833-ab30-992e15980bcd';
const LOCAL_SCREENSHOT_DIR = path.join(__dirname, '../artifacts_screenshots/phase_d');

if (!fs.existsSync(LOCAL_SCREENSHOT_DIR)) {
  fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });
}

async function verifyPhaseDUI() {
  console.log('🚀 Launching headless Chrome to test Phase D Dashboards & Portals on https://techinpedia.com...\n');
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
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '01_public_homepage_phase_d.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_public_homepage_phase_d.png') });
    console.log('   ✅ Saved 01_public_homepage_phase_d.png');

    // 2. Log In to Admin
    console.log('\n2️⃣  Logging in to Admin Workspace...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"], input[name="email"]', 'admin@techinpedia.com');
    await page.type('input[type="password"], input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log('   ✅ Logged in successfully!');

    const dashboards = [
      { name: '02_main_dashboard_unified', path: '/admin' },
      { name: '03_ess_portal', path: '/admin/portal' },
      { name: '04_manager_cockpit', path: '/admin/dashboards/manager' },
      { name: '05_hr_operations', path: '/admin/dashboards/hr' },
      { name: '06_executive_cockpit', path: '/admin/dashboards/executive' },
    ];

    for (const d of dashboards) {
      console.log(`\nTesting: ${d.path}...`);
      await page.goto(`${BASE_URL}${d.path}`, { waitUntil: 'networkidle2' });
      await new Promise((res) => setTimeout(res, 2000));

      // Light Mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      });
      await new Promise((res) => setTimeout(res, 600));
      await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, `${d.name}_light.png`) });
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `${d.name}_light.png`) });
      console.log(`   ✅ Saved ${d.name}_light.png`);

      // Dark Mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });
      await new Promise((res) => setTimeout(res, 600));
      await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, `${d.name}_dark.png`) });
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `${d.name}_dark.png`) });
      console.log(`   ✅ Saved ${d.name}_dark.png`);
    }

    console.log('\n🎉 Phase D UI verification completed successfully!');
  } catch (err) {
    console.error('Error in Phase D UI verification:', err);
  } finally {
    await browser.close();
  }
}

verifyPhaseDUI();
