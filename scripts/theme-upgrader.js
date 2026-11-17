const fs = require('fs');
const path = require('path');

const ALREADY_UPGRADED = new Set([
  'src/app/admin/page.tsx',
  'src/app/admin/enquiries/page.tsx',
  'src/app/admin/whatsapp/page.tsx',
  'src/app/admin/workflows/builder/page.tsx',
  'src/app/admin/deals/page.tsx',
  'src/app/admin/invoices/page.tsx',
  'src/app/admin/system/jobs/page.tsx',
  'src/app/admin/login/page.tsx',
  'src/app/admin/reports/page.tsx',
]);

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('page.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const allPages = walk('src/app/admin');
console.log(`Total admin pages: ${allPages.length}`);

let upgradedCount = 0;

for (const filePath of allPages) {
  if (ALREADY_UPGRADED.has(filePath)) {
    console.log(`Skipping already upgraded: ${filePath}`);
    continue;
  }

  let code = fs.readFileSync(filePath, 'utf8');
  const original = code;

  // 1. Modals & Overlays
  code = code.replace(/\bbg-black\/40\b/g, 'bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs');
  code = code.replace(/\bbg-black\/50\b/g, 'bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs');
  code = code.replace(/\bbg-black\/60\b/g, 'bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs');

  // 2. Surfaces & Backgrounds
  // Cards / primary panels
  code = code.replace(/\bbg-white\b(?!\s+dark:)/g, 'bg-white dark:bg-slate-900');
  code = code.replace(/\bbg-slate-900\b(?!\s+dark:)/g, 'bg-white dark:bg-slate-900');

  // Inner subtle containers, table headers, backgrounds
  code = code.replace(/\bbg-slate-950\b(?!\s+dark:)/g, 'bg-slate-50 dark:bg-slate-950');
  code = code.replace(/\bbg-gray-50\/50\b/g, 'bg-slate-50/80 dark:bg-slate-950/80');
  code = code.replace(/\bbg-gray-50\b(?!\s+dark:)/g, 'bg-slate-50 dark:bg-slate-950');
  code = code.replace(/\bbg-gray-100\b(?!\s+dark:)/g, 'bg-slate-100 dark:bg-slate-800');
  code = code.replace(/\bbg-slate-100\b(?!\s+dark:)/g, 'bg-slate-100 dark:bg-slate-800');
  code = code.replace(/\bbg-gray-200\b(?!\s+dark:)/g, 'bg-slate-200 dark:bg-slate-800');

  // 3. Borders & Dividers
  code = code.replace(/\bborder-slate-800\/80\b(?!\s+dark:)/g, 'border-slate-200 dark:border-slate-800/80');
  code = code.replace(/\bborder-slate-800\/60\b(?!\s+dark:)/g, 'border-slate-200 dark:border-slate-800/60');
  code = code.replace(/\bborder-slate-800\b(?!\s+dark:)/g, 'border-slate-200 dark:border-slate-800');
  code = code.replace(/\bborder-gray-100\b(?!\s+dark:)/g, 'border-slate-200 dark:border-slate-800/80');
  code = code.replace(/\bborder-gray-200\b(?!\s+dark:)/g, 'border-slate-200 dark:border-slate-800');
  code = code.replace(/\bborder-slate-200\b(?!\s+dark:)/g, 'border-slate-200 dark:border-slate-800');
  code = code.replace(/\bborder-gray-300\b(?!\s+dark:)/g, 'border-slate-300 dark:border-slate-700');
  code = code.replace(/\bborder-slate-700\b(?!\s+dark:)/g, 'border-slate-200 dark:border-slate-700');
  code = code.replace(/\bdivide-slate-800\/60\b/g, 'divide-slate-200 dark:divide-slate-800/60');
  code = code.replace(/\bdivide-slate-800\b/g, 'divide-slate-200 dark:divide-slate-800');
  code = code.replace(/\bdivide-gray-100\b/g, 'divide-slate-200 dark:divide-slate-800');
  code = code.replace(/\bdivide-gray-200\b/g, 'divide-slate-200 dark:divide-slate-800');

  // 4. Typography - Slate / Gray
  code = code.replace(/\btext-gray-900\b(?!\s+dark:)/g, 'text-slate-900 dark:text-white');
  code = code.replace(/\btext-slate-900\b(?!\s+dark:)/g, 'text-slate-900 dark:text-white');

  code = code.replace(/\btext-gray-800\b(?!\s+dark:)/g, 'text-slate-800 dark:text-slate-100');
  code = code.replace(/\btext-slate-800\b(?!\s+dark:)/g, 'text-slate-800 dark:text-slate-100');

  code = code.replace(/\btext-gray-700\b(?!\s+dark:)/g, 'text-slate-700 dark:text-slate-300');
  code = code.replace(/\btext-slate-700\b(?!\s+dark:)/g, 'text-slate-700 dark:text-slate-300');

  code = code.replace(/\btext-gray-600\b(?!\s+dark:)/g, 'text-slate-600 dark:text-slate-400');
  code = code.replace(/\btext-slate-600\b(?!\s+dark:)/g, 'text-slate-600 dark:text-slate-400');

  code = code.replace(/\btext-gray-500\b(?!\s+dark:)/g, 'text-slate-500 dark:text-slate-400');
  code = code.replace(/\btext-slate-500\b(?!\s+dark:)/g, 'text-slate-500 dark:text-slate-400');

  code = code.replace(/\btext-gray-400\b(?!\s+dark:)/g, 'text-slate-400 dark:text-slate-500');
  code = code.replace(/\btext-slate-400\b(?!\s+dark:)/g, 'text-slate-500 dark:text-slate-400');

  code = code.replace(/\btext-slate-300\b(?!\s+dark:)/g, 'text-slate-700 dark:text-slate-200');
  code = code.replace(/\btext-slate-200\b(?!\s+dark:)/g, 'text-slate-700 dark:text-slate-200');

  // 5. Headings / titles with text-white that were dark-coded
  // Careful: do not replace when inside bg-violet-600, bg-indigo-600, bg-blue-600, bg-emerald-600, bg-rose-600, bg-amber-500, bg-gradient-
  // We match classNames and replace isolated text-white in elements that are not colored buttons
  code = code.replace(/(<h[1-6][^>]*className="[^"]*?)\btext-white\b([^"]*")/g, (m, p1, p2) => {
    if (p1.includes('bg-') && !p1.includes('bg-transparent')) return m;
    return `${p1}text-slate-900 dark:text-white${p2}`;
  });

  // KPI stat card big numbers (e.g. text-3xl font-extrabold text-white)
  code = code.replace(/\b(text-[234]xl\s+font-(?:bold|extrabold))\s+text-white\b/g, '$1 text-slate-900 dark:text-white');
  code = code.replace(/\bfont-(?:bold|extrabold)\s+(text-[234]xl)\s+text-white\b/g, 'font-bold $1 text-slate-900 dark:text-white');

  // 6. Badges
  code = code.replace(/\bbg-blue-500\/20 text-blue-400 border-blue-500\/30\b/g, 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30');
  code = code.replace(/\bbg-amber-500\/20 text-amber-400 border-amber-500\/30\b/g, 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30');
  code = code.replace(/\bbg-emerald-500\/20 text-emerald-400 border-emerald-500\/30\b/g, 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30');
  code = code.replace(/\bbg-rose-500\/20 text-rose-400 border-rose-500\/30\b/g, 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30');
  code = code.replace(/\bbg-purple-500\/20 text-purple-400 border-purple-500\/30\b/g, 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30');
  code = code.replace(/\bbg-cyan-500\/20 text-cyan-400 border-cyan-500\/30\b/g, 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30');
  code = code.replace(/\bbg-indigo-500\/20 text-indigo-400 border-indigo-500\/30\b/g, 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30');

  code = code.replace(/\bbg-emerald-100 text-emerald-800\b/g, 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30');
  code = code.replace(/\bbg-emerald-100 text-emerald-700\b/g, 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30');
  code = code.replace(/\bbg-amber-100 text-amber-800\b/g, 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30');
  code = code.replace(/\bbg-amber-100 text-amber-700\b/g, 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30');
  code = code.replace(/\bbg-blue-100 text-blue-800\b/g, 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30');
  code = code.replace(/\bbg-rose-100 text-rose-800\b/g, 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30');
  code = code.replace(/\bbg-purple-100 text-purple-800\b/g, 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30');

  // 7. Hover states
  code = code.replace(/\bhover:bg-slate-800\/40\b/g, 'hover:bg-slate-50 dark:hover:bg-slate-800/40');
  code = code.replace(/\bhover:bg-slate-800\/60\b/g, 'hover:bg-slate-100 dark:hover:bg-slate-800/60');
  code = code.replace(/\bhover:bg-slate-800\b(?!\s+dark:)/g, 'hover:bg-slate-100 dark:hover:bg-slate-800');
  code = code.replace(/\bhover:bg-gray-100\b(?!\s+dark:)/g, 'hover:bg-slate-100 dark:hover:bg-slate-800');
  code = code.replace(/\bhover:bg-gray-50\/50\b/g, 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40');
  code = code.replace(/\bhover:bg-gray-50\b(?!\s+dark:)/g, 'hover:bg-slate-50 dark:hover:bg-slate-800/50');

  // 8. Form inputs / placeholders
  code = code.replace(/placeholder:text-slate-500\b/g, 'placeholder:text-slate-400 dark:placeholder:text-slate-500');
  code = code.replace(/placeholder:text-gray-400\b/g, 'placeholder:text-slate-400 dark:placeholder:text-slate-500');

  if (code !== original) {
    fs.writeFileSync(filePath, code, 'utf8');
    upgradedCount++;
    console.log(`[✓] Upgraded: ${filePath}`);
  } else {
    console.log(`[-] No changes needed: ${filePath}`);
  }
}

console.log(`\nSuccessfully upgraded ${upgradedCount} admin pages.`);
