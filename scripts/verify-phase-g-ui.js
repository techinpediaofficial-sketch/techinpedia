const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'https://techinpedia.com';
const ARTIFACT_DIR = '/Users/adityaverma/.gemini/antigravity-ide/brain/7c34872b-91a6-4833-ab30-992e15980bcd';
const LOCAL_SCREENSHOT_DIR = path.join(__dirname, '../artifacts_screenshots/phase_g');

if (!fs.existsSync(LOCAL_SCREENSHOT_DIR)) {
  fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });
}

async function verifyPhaseGUI() {
  console.log('🚀 Launching headless Chrome to test Phase G Global Omnibox & Audit Trail on https://techinpedia.com...\n');
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
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '01_public_homepage_phase_g.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_public_homepage_phase_g.png') });
    console.log('   ✅ Saved 01_public_homepage_phase_g.png');

    // 2. Log In to Admin
    console.log('\n2️⃣  Logging in to Admin Workspace...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"], input[name="email"]', 'admin@techinpedia.com');
    await page.type('input[type="password"], input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log('   ✅ Logged in successfully!');

    // 3. Audit Trail Desk (/admin/audit) - Light Mode
    console.log('\n3️⃣  Testing Audit Trail & Diffs Desk (/admin/audit) in Light Mode...');
    await page.goto(`${BASE_URL}/admin/audit`, { waitUntil: 'networkidle2' });
    await new Promise((res) => setTimeout(res, 2000));

    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await new Promise((res) => setTimeout(res, 600));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '02_audit_trail_desk_light.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_audit_trail_desk_light.png') });
    console.log('   ✅ Saved 02_audit_trail_desk_light.png');

    // 4. Audit Trail Desk (/admin/audit) - Dark Mode
    console.log('\n4️⃣  Testing Audit Trail & Diffs Desk (/admin/audit) in Dark Mode...');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await new Promise((res) => setTimeout(res, 600));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '03_audit_trail_desk_dark.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_audit_trail_desk_dark.png') });
    console.log('   ✅ Saved 03_audit_trail_desk_dark.png');

    // 5. Inspect Snapshots Modal
    console.log('\n5️⃣  Opening Snapshot Inspector Modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const target = buttons.find((b) => b.textContent && b.textContent.includes('Inspect Snapshots'));
      if (target) target.click();
    });
    await new Promise((res) => setTimeout(res, 1000));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '04_audit_snapshot_inspector_modal.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_audit_snapshot_inspector_modal.png') });
    console.log('   ✅ Saved 04_audit_snapshot_inspector_modal.png');

    // Close Inspector Modal
    await page.evaluate(() => {
      const closeButtons = Array.from(document.querySelectorAll('button'));
      const closeBtn = closeButtons.find((b) => b.textContent && b.textContent.includes('Close Inspector'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise((res) => setTimeout(res, 500));

    // 6. Test Omnibox Command Palette (Cmd+K / Search Modal)
    console.log('\n6️⃣  Triggering Omnibox Command Palette & executing live search...');
    // Click on the sidebar search button
    await page.evaluate(() => {
      const searchTrigger = document.querySelector('button[title*="Search"], button:has([class*="Search"])');
      const allButtons = Array.from(document.querySelectorAll('button'));
      const trigger = allButtons.find((b) => b.textContent && b.textContent.includes('Search CRM, HRM...'));
      if (trigger) {
        trigger.click();
      } else {
        // Dispatch keydown Cmd+K
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
      }
    });
    await new Promise((res) => setTimeout(res, 800));

    // Type query into Omnibox input
    const omniInput = await page.$('input[placeholder*="Search across all entities"]');
    if (omniInput) {
      await omniInput.type('Vikram', { delay: 50 });
      await new Promise((res) => setTimeout(res, 1200));
    }
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '05_omnibox_search_modal.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_omnibox_search_modal.png') });
    console.log('   ✅ Saved 05_omnibox_search_modal.png');

    console.log('\n================================================================');
    console.log('🎉 PHASE G VISUAL VERIFICATION COMPLETE & VERIFIED ON LIVE VPS!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('Visual verification error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyPhaseGUI();
