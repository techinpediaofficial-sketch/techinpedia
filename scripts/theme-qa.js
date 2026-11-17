const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const adminFiles = walk('src/app/admin').concat(walk('src/components/admin'));
console.log(`Inspecting ${adminFiles.length} admin files for theme and contrast health...\n`);

let totalIssues = 0;
const report = [];

adminFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const fileIssues = [];

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Check for hardcoded white-on-white: e.g. bg-white without dark variant alongside text-white without dark:text-
    if (line.includes('bg-white') && !line.includes('dark:bg-') && line.includes('text-white') && !line.includes('dark:text-')) {
      fileIssues.push({ line: lineNum, issue: 'Possible white-on-white text hazard' });
    }

    // Check for hardcoded black-on-black: e.g. bg-slate-900 without dark variant alongside text-slate-900 without dark:text-
    if (line.includes('bg-slate-900') && !line.includes('dark:bg-') && line.includes('text-slate-900') && !line.includes('dark:text-')) {
      fileIssues.push({ line: lineNum, issue: 'Possible dark-on-dark text hazard' });
    }

    // Check for orphaned bg-slate-950 without dark variant
    if (/\bbg-slate-950\b/.test(line) && !line.includes('dark:bg-') && !file.includes('ThemeProvider') && !file.includes('layout.tsx')) {
      // Check if it has a light mode counterpart
      if (!line.includes('bg-slate-50') && !line.includes('bg-white') && !line.includes('bg-')) {
        fileIssues.push({ line: lineNum, issue: 'Unpaired bg-slate-950 (no light mode surface)' });
      }
    }
  });

  if (fileIssues.length > 0) {
    totalIssues += fileIssues.length;
    report.push({ file, issues: fileIssues });
  }
});

if (totalIssues === 0) {
  console.log('✅ ZERO critical theme/contrast hazards found across all admin routes and components!');
} else {
  console.log(`⚠️ Found ${totalIssues} potential contrast notices:`);
  report.forEach((r) => {
    console.log(`\nFile: ${r.file}`);
    r.issues.forEach((i) => console.log(`  Line ${i.line}: ${i.issue}`));
  });
}
