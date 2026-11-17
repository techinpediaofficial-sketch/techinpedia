const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'https://techinpedia.com';
const SCREENSHOT_DIR = path.join(__dirname, '../artifacts_screenshots/phase_a');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyPhaseAUI() {
  console.log('Launching headless Chrome to test Phase A UI on https://techinpedia.com...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Log in
  console.log('Navigating to login page...');
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"], input[name="email"]', 'admin@techinpedia.com');
  await page.type('input[type="password"], input[name="password"]', 'Admin@123456');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
  console.log('Logged in successfully!');

  const routes = [
    { name: 'roles_live', path: '/admin/roles' },
    { name: 'departments_teams', path: '/admin/hr/departments' },
    { name: 'employees_directory', path: '/admin/hr/employees' },
  ];

  for (const r of routes) {
    console.log(`Testing route: ${r.path}`);
    await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle2' });
    await new Promise((res) => setTimeout(res, 2000));

    // Light Mode Screenshot
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await new Promise((res) => setTimeout(res, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${r.name}_light.png`), fullPage: false });
    console.log(`Saved ${r.name}_light.png`);

    // Dark Mode Screenshot
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await new Promise((res) => setTimeout(res, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${r.name}_dark.png`), fullPage: false });
    console.log(`Saved ${r.name}_dark.png`);
  }

  await browser.close();
  console.log('Phase A visual UI verification complete! All screenshots saved in:', SCREENSHOT_DIR);
}

verifyPhaseAUI().catch((err) => {
  console.error('Phase A UI verification failed:', err);
  process.exit(1);
});
