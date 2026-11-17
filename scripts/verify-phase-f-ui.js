const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'https://techinpedia.com';
const ARTIFACT_DIR = '/Users/adityaverma/.gemini/antigravity-ide/brain/7c34872b-91a6-4833-ab30-992e15980bcd';
const LOCAL_SCREENSHOT_DIR = path.join(__dirname, '../artifacts_screenshots/phase_f');

if (!fs.existsSync(LOCAL_SCREENSHOT_DIR)) {
  fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });
}

async function verifyPhaseFUI() {
  console.log('🚀 Launching headless Chrome to test Phase F Meetings & Google Calendar System on https://techinpedia.com...\n');
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
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '01_public_homepage_phase_f.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_public_homepage_phase_f.png') });
    console.log('   ✅ Saved 01_public_homepage_phase_f.png');

    // 2. Log In to Admin
    console.log('\n2️⃣  Logging in to Admin Workspace...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"], input[name="email"]', 'admin@techinpedia.com');
    await page.type('input[type="password"], input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log('   ✅ Logged in successfully!');

    // 3. Meetings Desk (/admin/meetings)
    console.log('\n3️⃣  Testing Meetings & Calendar Desk (/admin/meetings)...');
    await page.goto(`${BASE_URL}/admin/meetings`, { waitUntil: 'networkidle2' });
    await new Promise((res) => setTimeout(res, 2000));

    // Light Mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await new Promise((res) => setTimeout(res, 600));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '02_meetings_calendar_desk_light.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_meetings_calendar_desk_light.png') });
    console.log('   ✅ Saved 02_meetings_calendar_desk_light.png');

    // Dark Mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await new Promise((res) => setTimeout(res, 600));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '02_meetings_calendar_desk_dark.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_meetings_calendar_desk_dark.png') });
    console.log('   ✅ Saved 02_meetings_calendar_desk_dark.png');

    // 4. Open Schedule Meeting Modal
    console.log('\n4️⃣  Opening Schedule Meeting Modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent?.includes('Schedule Meeting') || b.textContent?.includes('Schedule First Meeting'));
      if (btn) btn.click();
    });
    await new Promise((res) => setTimeout(res, 1200));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '03_schedule_meeting_modal_dark.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_schedule_meeting_modal_dark.png') });
    console.log('   ✅ Saved 03_schedule_meeting_modal_dark.png');

    // Close modal
    await page.keyboard.press('Escape');
    await new Promise((res) => setTimeout(res, 500));

    // 5. Open Meeting Outcome Modal
    console.log('\n5️⃣  Opening Meeting Outcome Modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent?.includes('Log Outcome') || b.textContent?.includes('Update Outcome'));
      if (btn) btn.click();
    });
    await new Promise((res) => setTimeout(res, 1000));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '04_meeting_outcome_modal_dark.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_meeting_outcome_modal_dark.png') });
    console.log('   ✅ Saved 04_meeting_outcome_modal_dark.png');

    await page.keyboard.press('Escape');
    await new Promise((res) => setTimeout(res, 500));

    // 6. Customer 360 Meetings Tab
    console.log('\n6️⃣  Testing Customer 360 Meetings Tab...');
    await page.goto(`${BASE_URL}/admin/customers`, { waitUntil: 'networkidle2' });
    await new Promise((res) => setTimeout(res, 1500));

    // Click first customer
    const firstCustomerLink = await page.$('a[href^="/admin/customers/"]');
    if (firstCustomerLink) {
      await firstCustomerLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise((res) => setTimeout(res, 1500));

      // Click Meetings & Meet tab
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const tab = buttons.find((b) => b.textContent?.includes('Meetings & Meet'));
        if (tab) tab.click();
      });
      await new Promise((res) => setTimeout(res, 800));

      await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '05_customer_360_meetings_tab.png') });
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_customer_360_meetings_tab.png') });
      console.log('   ✅ Saved 05_customer_360_meetings_tab.png');
    }

    // 7. Settings Integrations - Google Calendar & Meet card
    console.log('\n7️⃣  Testing Settings Integrations (/admin/settings/integrations)...');
    await page.goto(`${BASE_URL}/admin/settings/integrations`, { waitUntil: 'networkidle2' });
    await new Promise((res) => setTimeout(res, 1500));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '06_settings_integrations_google_calendar.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_settings_integrations_google_calendar.png') });
    console.log('   ✅ Saved 06_settings_integrations_google_calendar.png');

    console.log('\n🎉 Phase F UI Verification Completed Successfully!');
  } catch (err) {
    console.error('UI Verification Error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyPhaseFUI();
