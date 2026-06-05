import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const IGNORE_DIRS = new Set([
  '.git',
  '.cache',
  'dist',
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

const EXPECTED_MATCHERS = [
  /^blog-agama\//,
  /^entrada-de-blog\//,
  /^wordpress\/import\//,
  /^data\/product-images-manifest(?:\.example)?\.json$/,
  /^data\/tech-sheets-manifest\.json$/,
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

function isExpectedLegacyFile(relativePath) {
  return EXPECTED_MATCHERS.some((matcher) => matcher.test(relativePath));
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
  const actionableFindings = [];
  const expectedFindings = [];
  const actionableTotals = new Map();
  const expectedTotals = new Map();

  for (const filePath of files) {
    const matches = auditFile(filePath);
    if (!matches) continue;

    const relativePath = relative(filePath);
    const expected = isExpectedLegacyFile(relativePath);
    const bucket = expected ? expectedFindings : actionableFindings;
    const totals = expected ? expectedTotals : actionableTotals;

    bucket.push({
      file: relativePath,
      matches,
    });

    for (const match of matches) {
      totals.set(match.label, (totals.get(match.label) || 0) + match.count);
    }
  }

  if (actionableFindings.length === 0 && expectedFindings.length === 0) {
    console.log('No Webflow dependencies found.');
    return;
  }

  console.log('Webflow dependency audit\n');

  if (actionableFindings.length === 0) {
    console.log('Actionable dependencies: none\n');
  } else {
    console.log('Actionable dependencies\n');
    for (const finding of actionableFindings) {
      const summary = finding.matches
        .map((match) => `${match.label}: ${match.count}`)
        .join(', ');

      console.log(`- ${finding.file}`);
      console.log(`  ${summary}`);
    }

    console.log('\nActionable totals');
    for (const [label, count] of actionableTotals.entries()) {
      console.log(`- ${label}: ${count}`);
    }
  }

  if (expectedFindings.length > 0) {
    console.log('\nExpected legacy dependencies\n');
    for (const finding of expectedFindings) {
      const summary = finding.matches
        .map((match) => `${match.label}: ${match.count}`)
        .join(', ');

      console.log(`- ${finding.file}`);
      console.log(`  ${summary}`);
    }

    console.log('\nExpected legacy totals');
    for (const [label, count] of expectedTotals.entries()) {
      console.log(`- ${label}: ${count}`);
    }
  }
}

main();
