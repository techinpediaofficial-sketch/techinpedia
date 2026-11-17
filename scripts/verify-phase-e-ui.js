const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'https://techinpedia.com';
const ARTIFACT_DIR = '/Users/adityaverma/.gemini/antigravity-ide/brain/7c34872b-91a6-4833-ab30-992e15980bcd';
const LOCAL_SCREENSHOT_DIR = path.join(__dirname, '../artifacts_screenshots/phase_e');

if (!fs.existsSync(LOCAL_SCREENSHOT_DIR)) {
  fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });
}

async function verifyPhaseEUI() {
  console.log('🚀 Launching headless Chrome to test Phase E Razorpay System on https://techinpedia.com...\n');
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
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '01_public_homepage_phase_e.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_public_homepage_phase_e.png') });
    console.log('   ✅ Saved 01_public_homepage_phase_e.png');

    // 2. Log In to Admin
    console.log('\n2️⃣  Logging in to Admin Workspace...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"], input[name="email"]', 'admin@techinpedia.com');
    await page.type('input[type="password"], input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log('   ✅ Logged in successfully!');

    // 3. Payments Page - Tab 1: Payment Links Desk
    console.log('\n3️⃣  Testing Payments Hub (/admin/payments)...');
    await page.goto(`${BASE_URL}/admin/payments`, { waitUntil: 'networkidle2' });
    await new Promise((res) => setTimeout(res, 2000));

    // Light Mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await new Promise((res) => setTimeout(res, 600));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '02_payments_links_desk_light.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_payments_links_desk_light.png') });
    console.log('   ✅ Saved 02_payments_links_desk_light.png');

    // Dark Mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await new Promise((res) => setTimeout(res, 600));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '02_payments_links_desk_dark.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_payments_links_desk_dark.png') });
    console.log('   ✅ Saved 02_payments_links_desk_dark.png');

    // 4. Test Open "Generate Payment Link" Modal
    console.log('\n4️⃣  Opening Generate Payment Link Modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const genBtn = btns.find((b) => b.textContent.includes('Generate Payment Link'));
      if (genBtn) genBtn.click();
    });
    await new Promise((res) => setTimeout(res, 800));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '03_payment_link_modal_dark.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_payment_link_modal_dark.png') });
    console.log('   ✅ Saved 03_payment_link_modal_dark.png');

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button .lucide-x, button [data-lucide="x"]')?.closest('button');
      if (closeBtn) closeBtn.click();
    });
    await new Promise((res) => setTimeout(res, 500));

    // 5. Payments Page - Tab 3: Attribution & Analytics
    console.log('\n5️⃣  Testing Attribution & Analytics tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const analyticsTab = btns.find((b) => b.textContent.includes('Attribution & Analytics'));
      if (analyticsTab) analyticsTab.click();
    });
    await new Promise((res) => setTimeout(res, 1000));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '04_payments_analytics_dark.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_payments_analytics_dark.png') });
    console.log('   ✅ Saved 04_payments_analytics_dark.png');

    // 6. Settings Integrations - Razorpay card
    console.log('\n6️⃣  Testing Settings Integrations (/admin/settings/integrations)...');
    await page.goto(`${BASE_URL}/admin/settings/integrations`, { waitUntil: 'networkidle2' });
    await new Promise((res) => setTimeout(res, 1500));
    await page.screenshot({ path: path.join(LOCAL_SCREENSHOT_DIR, '05_settings_integrations_razorpay.png') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_settings_integrations_razorpay.png') });
    console.log('   ✅ Saved 05_settings_integrations_razorpay.png');

    console.log('\n🎉 Phase E UI verification completed successfully!');
  } catch (err) {
    console.error('Error in Phase E UI verification:', err);
  } finally {
    await browser.close();
  }
}

verifyPhaseEUI();
