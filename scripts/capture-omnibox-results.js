const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'https://techinpedia.com';
const ARTIFACT_DIR = '/Users/adityaverma/.gemini/antigravity-ide/brain/7c34872b-91a6-4833-ab30-992e15980bcd';
const LOCAL_SCREENSHOT_DIR = path.join(__dirname, '../artifacts_screenshots/phase_g');

async function captureOmniboxResults() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"], input[name="email"]', 'admin@techinpedia.com');
    await page.type('input[type="password"], input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    await page.goto(`${BASE_URL}/admin/audit`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      const allButtons = Array.from(document.querySelectorAll('button'));
      const trigger = allButtons.find((b) => b.textContent && b.textContent.includes('Search Business OS'));
      if (trigger) trigger.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Focus and type query
    const inputSelector = 'input[placeholder*="Search Leads"]';
    await page.waitForSelector(inputSelector, { timeout: 5000 });
    await page.type(inputSelector, 'Tech', { delay: 70 });
    await new Promise((r) => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '07_omnibox_cross_entity_results.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_omnibox_cross_entity_results.png') });
    console.log('✅ Successfully saved 07_omnibox_cross_entity_results.png');
  } catch (err) {
    console.error('Error capturing omnibox:', err);
  } finally {
    await browser.close();
  }
}

captureOmniboxResults();
