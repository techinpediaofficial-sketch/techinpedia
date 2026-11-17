const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'https://techinpedia.com';
const SCREENSHOT_DIR = path.join(__dirname, '../artifacts_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Launching Google Chrome headless via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log(`🌐 Navigating to ${BASE_URL}/admin/login ...`);
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2' });

  // Take screenshot of login in default state
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_default.png') });
  console.log('📸 Captured 01_login_default.png');

  // Fill credentials
  console.log('🔑 Logging in as admin@techinpedia.com ...');
  await page.type('input[type="email"]', 'admin@techinpedia.com');
  await page.type('input[type="password"]', 'Admin@123456');
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  console.log('📍 Current URL after login:', page.url());
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_admin_dashboard_initial.png') });
  console.log('📸 Captured 02_admin_dashboard_initial.png');

  // Check theme switcher
  console.log('🎨 Testing Theme Switcher...');
  // Find button with Sun/Moon or theme selector
  const themeButton = await page.$('button[title*="theme" i], button[aria-label*="theme" i], button:has(svg.lucide-sun), button:has(svg.lucide-moon), button:has(svg.lucide-laptop)');
  
  if (themeButton) {
    console.log('Found theme toggle button, clicking...');
    await themeButton.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_theme_dropdown_open.png') });
    console.log('📸 Captured 03_theme_dropdown_open.png');

    // Switch to Light mode
    console.log('Switching to Light Mode...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const lightBtn = btns.find(b => b.textContent.includes('Light'));
      if (lightBtn) lightBtn.click();
      else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.setItem('theme', 'light');
      }
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_dashboard_light.png') });
    console.log('📸 Captured 04_dashboard_light.png');

    // Switch to Dark mode
    console.log('Switching to Dark Mode...');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_dashboard_dark.png') });
    console.log('📸 Captured 05_dashboard_dark.png');
  } else {
    console.log('Theme button not matched directly by selector, checking page header...');
  }

  await browser.close();
  console.log('✅ Initial smoke test complete!');
}

run().catch(err => {
  console.error('❌ Error during test run:', err);
  process.exit(1);
});
