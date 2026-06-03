import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const IGNORE_DIRS = new Set([
  '.git',
  'node_modules',
]);

const TEXT_EXTENSIONS = new Set([
  '.html',
  '.js',
  '.mjs',
  '.css',
  '.json',
  '.md',
  '.sql',
  '.txt',
]);

const PATTERNS = [
  { label: 'Webflow CDN', regex: /cdn\.prod\.website-files\.com/g },
  { label: 'Webflow Cloudfront', regex: /d3e54v103j8qbb\.cloudfront\.net/g },
  { label: 'Webflow domain', regex: /\bwebflow\.(?:io|com)\b/g },
];

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, results);
      continue;
    }

    if (!TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    results.push(fullPath);
  }

  return results;
}

function relative(filePath) {
  return path.relative(ROOT, filePath) || '.';
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = [];

  for (const { label, regex } of PATTERNS) {
    const found = content.match(regex);
    if (found?.length) {
      matches.push({ label, count: found.length });
    }
  }

  return matches.length > 0 ? matches : null;
}

function main() {
  const files = walk(ROOT);
  const findings = [];
  const totals = new Map();

  for (const filePath of files) {
    const matches = auditFile(filePath);
    if (!matches) continue;

    findings.push({
      file: relative(filePath),
      matches,
    });

    for (const match of matches) {
      totals.set(match.label, (totals.get(match.label) || 0) + match.count);
    }
  }

  if (findings.length === 0) {
    console.log('No Webflow dependencies found.');
    return;
  }

  console.log('Webflow dependency audit\n');

  for (const finding of findings) {
    const summary = finding.matches
      .map((match) => `${match.label}: ${match.count}`)
      .join(', ');

    console.log(`- ${finding.file}`);
    console.log(`  ${summary}`);
  }

  console.log('\nTotals');
  for (const [label, count] of totals.entries()) {
    console.log(`- ${label}: ${count}`);
  }
}

main();
