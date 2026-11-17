const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'https://techinpedia.com';
const SCREENSHOT_DIR = path.join(__dirname, '../artifacts_screenshots/deep_pass');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Routes to thoroughly test
const ROUTES = [
  { name: 'dashboard', path: '/admin' },
  { name: 'enquiries', path: '/admin/enquiries' },
  { name: 'leads', path: '/admin/leads' },
  { name: 'deals_kanban', path: '/admin/deals' },
  { name: 'whatsapp', path: '/admin/whatsapp' },
  { name: 'workflows', path: '/admin/workflows' },
  { name: 'workflow_builder', path: '/admin/workflows/builder' },
  { name: 'google_sheets', path: '/admin/integrations/google-sheets' },
  { name: 'system_jobs', path: '/admin/system/jobs' },
  { name: 'customers', path: '/admin/customers' },
  { name: 'invoices', path: '/admin/invoices' },
  { name: 'quotations', path: '/admin/quotations' },
  { name: 'contracts', path: '/admin/contracts' },
  { name: 'proposals', path: '/admin/proposals' },
  { name: 'hr_employees', path: '/admin/hr/employees' },
  { name: 'hr_attendance', path: '/admin/hr/attendance' },
  { name: 'hr_payroll', path: '/admin/hr/payroll' },
  { name: 'projects', path: '/admin/projects' },
  { name: 'tasks', path: '/admin/tasks' },
  { name: 'settings', path: '/admin/settings' },
  { name: 'settings_integrations', path: '/admin/settings/integrations' },
  { name: 'blog_editor', path: '/admin/blog' },
  { name: 'monitoring', path: '/admin/monitoring' },
  { name: 'users', path: '/admin/users' },
  { name: 'roles', path: '/admin/roles' },
  { name: 'activity', path: '/admin/activity' }
];

async function run() {
  console.log('🚀 Starting Deep Visual Theme Acceptance Pass...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Authenticate via login
  console.log('🔑 Authenticating on production...');
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'admin@techinpedia.com');
  await page.type('input[type="password"]', 'Admin@123456');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  const findings = [];

  // Helper to set theme via ThemeContext or DOM
  async function setTheme(mode) {
    await page.evaluate((themeMode) => {
      localStorage.setItem('theme', themeMode);
      if (themeMode === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.style.colorScheme = 'light';
      }
    }, mode);
    await new Promise(r => setTimeout(r, 400));
  }

  // Helper to scan page for contrast anomalies
  async function scanContrastIssues(routePath, mode) {
    return await page.evaluate((route, themeMode) => {
      const issues = [];
      const allElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, th, td, label, input, select, textarea, button, a');
      
      allElements.forEach((el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0 || style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return;
        }

        const color = style.color;
        let parent = el.parentElement;
        let bgColor = style.backgroundColor;
        
        while (parent && (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent')) {
          bgColor = window.getComputedStyle(parent).backgroundColor;
          parent = parent.parentElement;
        }

        // Check for pure white on pure white or pure black on pure black
        // Parse rgb
        function parseRgb(rgbStr) {
          const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          return match ? { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) } : null;
        }

        const fg = parseRgb(color);
        const bg = parseRgb(bgColor);

        if (fg && bg) {
          const diff = Math.abs(fg.r - bg.r) + Math.abs(fg.g - bg.g) + Math.abs(fg.b - bg.b);
          if (diff < 35 && el.textContent.trim().length > 0) {
            issues.push({
              tag: el.tagName,
              text: el.textContent.trim().substring(0, 40),
              fg: color,
              bg: bgColor,
              diff,
              className: el.className
            });
          }
        }
      });
      return issues;
    }, routePath, mode);
  }

  // 2. Iterate through routes in Light and Dark mode
  for (const route of ROUTES) {
    console.log(`\n🔍 Inspecting [${route.name}] -> ${route.path}`);
    await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Test Light Mode
    await setTheme('light');
    const lightIssues = await scanContrastIssues(route.path, 'light');
    if (lightIssues.length > 0) {
      console.warn(`⚠️ [Light Mode] Potential contrast risks in ${route.name}:`, lightIssues.length);
      findings.push({ route: route.path, mode: 'light', issues: lightIssues });
    }
    const lightShot = path.join(SCREENSHOT_DIR, `${route.name}_light.png`);
    await page.screenshot({ path: lightShot, fullPage: false });

    // Test Dark Mode
    await setTheme('dark');
    const darkIssues = await scanContrastIssues(route.path, 'dark');
    if (darkIssues.length > 0) {
      console.warn(`⚠️ [Dark Mode] Potential contrast risks in ${route.name}:`, darkIssues.length);
      findings.push({ route: route.path, mode: 'dark', issues: darkIssues });
    }
    const darkShot = path.join(SCREENSHOT_DIR, `${route.name}_dark.png`);
    await page.screenshot({ path: darkShot, fullPage: false });
  }

  // 3. Test Modals & Drawers Interaction
  console.log('\n🎭 Testing Interactive Modals & Drawers...');
  
  // Test Password Change Modal
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' });
  await setTheme('light');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pwd = btns.find(b => b.textContent.includes('Password') || b.textContent.includes('Update Default Password'));
    if (pwd) pwd.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal_password_light.png') });
  await setTheme('dark');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal_password_dark.png') });
  
  // Close modal if open
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find(b => b.querySelector('svg.lucide-x') || b.textContent.includes('Cancel'));
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Test WhatsApp Campaign Wizard / Tabs
  console.log('📱 Testing WhatsApp Campaign & Tabs...');
  await page.goto(`${BASE_URL}/admin/whatsapp`, { waitUntil: 'networkidle2' });
  await setTheme('light');
  // Click on campaign tab if exists
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const campTab = tabs.find(t => t.textContent.includes('Campaign') || t.textContent.includes('Broadcast'));
    if (campTab) campTab.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_campaigns_light.png') });
  await setTheme('dark');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_campaigns_dark.png') });

  // Test Workflow Builder Canvas & Drawer
  console.log('⚡ Testing Workflow Builder Nodes...');
  await page.goto(`${BASE_URL}/admin/workflows/builder`, { waitUntil: 'networkidle2' });
  await setTheme('light');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow_builder_light.png') });
  await setTheme('dark');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow_builder_dark.png') });

  // 4. Test Print Preview Styles (Invoices & Contracts)
  console.log('🖨️ Testing Print Preview Emulation (Invoice & Contract)...');
  await page.goto(`${BASE_URL}/admin/invoices`, { waitUntil: 'networkidle2' });
  await setTheme('dark'); // In dark mode, ensure print produces crisp white background
  await page.emulateMediaType('print');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'invoice_print_emulation.png') });
  await page.emulateMediaType('screen');

  await page.goto(`${BASE_URL}/admin/contracts`, { waitUntil: 'networkidle2' });
  await page.emulateMediaType('print');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'contract_print_emulation.png') });
  await page.emulateMediaType('screen');

  // 5. Test Refresh Persistence in Dark Mode
  console.log('🔄 Testing Browser Refresh Persistence in Dark Mode...');
  await page.goto(`${BASE_URL}/admin/deals`, { waitUntil: 'networkidle2' });
  await setTheme('dark');
  await page.reload({ waitUntil: 'networkidle2' });
  const isDarkAfterReload = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  console.log('Dark mode persisted after reload:', isDarkAfterReload ? '✅ YES' : '❌ NO');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'refresh_persistence_dark.png') });

  // 6. Test Mobile / Tablet Responsive Viewport
  console.log('📱 Testing Mobile & Tablet Viewport...');
  await page.setViewport({ width: 390, height: 844 }); // iPhone 14
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' });
  await setTheme('light');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile_dashboard_light.png') });
  await setTheme('dark');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile_dashboard_dark.png') });

  await page.setViewport({ width: 768, height: 1024 }); // iPad
  await setTheme('light');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'tablet_dashboard_light.png') });
  await setTheme('dark');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'tablet_dashboard_dark.png') });

  await browser.close();

  // Save findings summary
  fs.writeFileSync(
    path.join(__dirname, '../artifacts_screenshots/contrast_findings.json'),
    JSON.stringify(findings, null, 2)
  );

  console.log(`\n🎉 Deep visual pass completed! Total findings logged: ${findings.length}`);
}

run().catch(err => {
  console.error('❌ Error during deep pass:', err);
  process.exit(1);
});
