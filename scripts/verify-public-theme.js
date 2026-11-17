const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'https://techinpedia.com';
const SCREENSHOT_DIR = path.join(__dirname, '../artifacts_screenshots');

async function check() {
  console.log('🚀 Launching Google Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Simulate OS in Dark Mode
  console.log('🌓 Emulating prefers-color-scheme: dark...');
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);

  // 2. Set localStorage theme to dark (as if user visited admin in dark mode)
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('theme', 'dark');
  });

  console.log(`🌐 Navigating to ${BASE_URL} ...`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

  // 3. Inspect documentElement and body classes
  const classes = await page.evaluate(() => {
    return {
      htmlClass: document.documentElement.className,
      colorScheme: document.documentElement.style.colorScheme,
      bodyClass: document.body.className,
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      heroBg: window.getComputedStyle(document.querySelector('section')).backgroundColor,
    };
  });

  console.log('📊 DOM Inspection:', JSON.stringify(classes, null, 2));

  // 4. Capture screenshot
  const screenshotPath = path.join(SCREENSHOT_DIR, 'public_home_after_fix.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);

  await browser.close();
}

check().catch(console.error);
