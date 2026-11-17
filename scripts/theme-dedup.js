const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, '../src/app/admin');
const componentsDir = path.join(__dirname, '../src/components/admin');

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = [...getAllFiles(adminDir), ...getAllFiles(componentsDir)];

let totalChanges = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Fix modal backdrop overlay:
  content = content.replace(/bg-white dark:bg-slate-900\/60 dark:bg-slate-50 dark:bg-slate-950\/80/g, 'bg-slate-900/60 dark:bg-slate-950/80');
  content = content.replace(/bg-white dark:bg-slate-900\/60/g, (match, offset, str) => {
    // If it's a fixed inset-0 (modal backdrop), it should be dark overlay in both modes
    const surrounding = str.substring(Math.max(0, offset - 50), offset + 50);
    if (surrounding.includes('fixed inset-0')) {
      return 'bg-slate-900/60 dark:bg-slate-950/80';
    }
    return 'bg-white dark:bg-slate-900/60';
  });

  // 2. Fix duplicated dark:bg-white
  content = content.replace(/bg-white dark:bg-white dark:bg-slate-900/g, 'bg-white dark:bg-slate-900');
  content = content.replace(/dark:bg-white dark:bg-slate-900/g, 'dark:bg-slate-900');
  content = content.replace(/bg-slate-50 dark:bg-white dark:bg-slate-900/g, 'bg-slate-50 dark:bg-slate-900');

  // 3. Fix duplicated dark:text-slate-900 dark:text-white
  content = content.replace(/text-slate-900 dark:text-slate-900 dark:text-white/g, 'text-slate-900 dark:text-white');
  content = content.replace(/dark:text-slate-900 dark:text-white/g, 'text-slate-900 dark:text-white');

  // 4. Fix duplicated dark:text-slate-500 dark:text-slate-400
  content = content.replace(/text-slate-500 dark:text-slate-500 dark:text-slate-400/g, 'text-slate-500 dark:text-slate-400');
  content = content.replace(/dark:text-slate-500 dark:text-slate-400/g, 'text-slate-500 dark:text-slate-400');

  // 5. Fix duplicated border classes
  content = content.replace(/border-slate-200 dark:border-slate-200 dark:border-slate-800/g, 'border-slate-200 dark:border-slate-800');
  content = content.replace(/dark:border-slate-200 dark:border-slate-800/g, 'border-slate-200 dark:border-slate-800');
  content = content.replace(/border-slate-200 dark:border-slate-200/g, 'border-slate-200');

  // 6. Fix duplicated backdrop-blur
  content = content.replace(/backdrop-blur-xs backdrop-blur-xs/g, 'backdrop-blur-xs');

  // 7. Cleanup any double spaces in classNames
  // (clean without altering logic)
  content = content.replace(/className="([^"]*)"/g, (match, p1) => {
    const cleaned = p1.replace(/\s+/g, ' ').trim();
    return `className="${cleaned}"`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalChanges++;
    console.log(`✅ Cleaned up: ${path.relative(process.cwd(), file)}`);
  }
}

console.log(`\n🎉 Theme deduplication and normalization complete! ${totalChanges} files updated.`);
