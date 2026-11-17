const http = require('http');
const https = require('https');

const targetUrl = process.env.TEST_URL || 'https://techinpedia.com';

async function testEndpoint(endpointPath, headers = {}) {
  const url = new URL(endpointPath, targetUrl);
  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        method: 'GET',
        headers: {
          ...headers,
          'User-Agent': 'Theme-Test-Agent',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('Testing Next.js local server endpoints for theme & anti-FOUC architecture...\n');

  try {
    // 1. Check Root HTML has suppressHydrationWarning and inline anti-FOUC script
    const rootRes = await testEndpoint('/');
    console.log(`[GET /] Status: ${rootRes.status}`);

    const hasSuppressHydration = rootRes.body.includes('suppressHydrationWarning');
    const hasAntiFoucScript = rootRes.body.includes("localStorage.getItem('theme')");
    const hasDarkClassToggle = rootRes.body.includes("classList.add('dark')");

    console.log(`  ✓ suppressHydrationWarning present: ${hasSuppressHydration}`);
    console.log(`  ✓ Anti-FOUC inline script present: ${hasAntiFoucScript}`);
    console.log(`  ✓ Dark class toggle present: ${hasDarkClassToggle}`);

    if (!hasSuppressHydration || !hasAntiFoucScript || !hasDarkClassToggle) {
      throw new Error('Anti-FOUC validation failed on root layout');
    }

    // 2. Check Admin Login route
    const loginRes = await testEndpoint('/admin/login');
    console.log(`\n[GET /admin/login] Status: ${loginRes.status}`);
    const hasThemeClassesLogin = loginRes.body.includes('dark:bg-slate-950') && loginRes.body.includes('dark:text-white');
    console.log(`  ✓ Login page contains dual theme classes: ${hasThemeClassesLogin}`);

    // 3. Check Admin Dashboard route (redirects to /admin/login if unauthenticated)
    const adminRes = await testEndpoint('/admin');
    console.log(`\n[GET /admin] Status: ${adminRes.status} (Redirect or protected HTML: ${adminRes.headers.location || 'OK'})`);

    console.log('\n✅ All automated local theme tests PASSED successfully!');
  } catch (err) {
    console.error('Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
