import { execFileSync } from 'child_process';

const FILIAL_HTML = /^filiales\/[^/]+\/index(\.en)?\.html$/;
const MAX_CHANGED_CSS_RULES = 10;

function runGit(args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trimEnd();
  } catch (error) {
    if (allowFailure) return '';
    const stderr = error.stderr ? String(error.stderr).trim() : error.message;
    fail(`git ${args.join(' ')} failed: ${stderr}`);
  }
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function parseNameStatus(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const parts = line.split(/\t/);
      const status = parts[0];
      if (status.startsWith('R')) {
        return [
          { status: 'D', path: parts[1] },
          { status: 'A', path: parts[2] },
        ];
      }
      return [{ status: status[0], path: parts[1] || parts[0].slice(1).trim() }];
    });
}

function readHeadFile(filePath) {
  return runGit(['show', `HEAD:${filePath}`], { allowFailure: true });
}

function readStagedFile(filePath) {
  return runGit(['show', `:${filePath}`], { allowFailure: true });
}

function valuesForAttribute(html, attr) {
  const matcher = new RegExp(`\\s${attr}=(["'])(.*?)\\1`, 'gi');
  return [...html.matchAll(matcher)].map((match) => match[2]).sort();
}

function blocksFor(html, matcher) {
  return [...html.matchAll(matcher)].map((match) => normalize(match[0])).sort();
}

function sensitiveSnapshot(html) {
  return {
    hrefs: valuesForAttribute(html, 'href'),
    srcs: valuesForAttribute(html, 'src'),
    ids: valuesForAttribute(html, 'id').sort(),
    titles: blocksFor(html, /<title[\s\S]*?<\/title>/gi),
    metas: blocksFor(html, /<meta\b[^>]*>/gi),
    canonicals: blocksFor(html, /<link\b[^>]*rel=(["'])(?:canonical|alternate)\1[^>]*>/gi),
    scripts: blocksFor(html, /<script\b[\s\S]*?<\/script>/gi),
    forms: blocksFor(html, /<form\b[\s\S]*?<\/form>/gi),
    jsonLd: blocksFor(html, /<script\b[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi),
  };
}

function assertSameSnapshot(filePath, before, after, errors) {
  const oldSnapshot = sensitiveSnapshot(before);
  const newSnapshot = sensitiveSnapshot(after);

  for (const key of Object.keys(oldSnapshot)) {
    const oldValue = JSON.stringify(oldSnapshot[key]);
    const newValue = JSON.stringify(newSnapshot[key]);
    if (oldValue !== newValue) {
      errors.push(`${filePath}: visual-only patch cannot change ${key}.`);
    }
  }
}

function changedLines(diff) {
  return diff
    .split(/\r?\n/)
    .filter((line) => /^[+-]/.test(line) && !line.startsWith('+++') && !line.startsWith('---'));
}

function isCssSelectorLine(text) {
  const trimmed = text.trim();
  if (!trimmed.endsWith('{')) return false;
  if (trimmed.startsWith('@')) return false;
  if (trimmed.startsWith('<')) return false;
  return /[.#:\[]|^[a-z][a-z0-9-]*(?:\s|\.|#|:|\[)/i.test(trimmed);
}

function changedCssSelectors(lines) {
  const selectors = new Set();
  for (const rawLine of lines) {
    const text = rawLine.slice(1).trim();
    if (!isCssSelectorLine(text)) continue;
    selectors.add(text.replace(/\s*\{$/, '').trim());
  }
  return selectors;
}

function normalizeHtmlChangeLine(line) {
  return normalize(
    line
      .replace(/\sclass=(["']).*?\1/gi, ' class=""')
      .replace(/\sstyle=(["']).*?\1/gi, ' style=""')
  );
}

function assertNoTextOrMarkupChanges(diff, errors) {
  const removed = [];
  const added = [];

  for (const rawLine of changedLines(diff)) {
    const text = rawLine.slice(1);
    const trimmed = text.trim();
    if (!trimmed.includes('<')) continue;
    if (/^<\/?style\b/i.test(trimmed)) continue;

    const normalized = normalizeHtmlChangeLine(text);
    if (rawLine.startsWith('-')) removed.push(normalized);
    if (rawLine.startsWith('+')) added.push(normalized);
  }

  removed.sort();
  added.sort();

  if (JSON.stringify(removed) !== JSON.stringify(added)) {
    errors.push('visual-only patch can change class/style attributes, but not visible text, markup structure, href/src values, ids, forms, scripts, or metadata.');
  }
}

const FORBIDDEN_LINE_PATTERNS = [
  /tel:/i,
  /mailto:/i,
  /wa\.me/i,
  /api\.whatsapp\.com/i,
  /g\.page/i,
  /google review/i,
  /google\.com\/maps/i,
  /google maps/i,
  /streetAddress/i,
  /addressLocality/i,
  /postalCode/i,
  /latitude/i,
  /longitude/i,
  /hasMap/i,
  /<title\b/i,
  /<meta\b/i,
  /rel=(["'])(?:canonical|alternate)\1/i,
  /hreflang/i,
  /application\/ld\+json/i,
  /<script\b/i,
  /<\/script>/i,
  /<form\b/i,
  /<\/form>/i,
  /\sid=(["'])/i,
  /Direcci[oó]n/i,
  /Tel[eé]fono/i,
  /WhatsApp/i,
  /RFC/i,
  /CLABE/i,
  /Banco/i,
  /Cuenta/i,
  /Raz[oó]n social/i,
  /datos fiscales/i,
  /datos bancarios/i,
  /bank details/i,
  /fiscal/i,
];

function assertNoSensitiveLineChanges(diff, errors) {
  for (const rawLine of changedLines(diff)) {
    const text = rawLine.slice(1);
    const matched = FORBIDDEN_LINE_PATTERNS.find((pattern) => pattern.test(text));
    if (matched) {
      errors.push(`sensitive line changed or touched: "${normalize(text).slice(0, 180)}"`);
    }
  }
}

if (process.argv.includes('--help')) {
  console.log(`Usage: npm run validate:filiales-visual-only

Fast lane for staged visual-only patches in filial pages.

Use only for local CSS/class/layout/responsive fixes in filiales/*/index.html
and filiales/*/index.en.html. Do not use for contact data, URLs, metadata,
schema, scripts, forms, maps, Google Review, WhatsApp, banking/fiscal data, or
business/legal copy. Sensitive changes must use the full change-scope flow.`);
  process.exit(0);
}

const nameStatus = runGit(['diff', '--cached', '--name-status'], { allowFailure: true });
const changes = parseNameStatus(nameStatus);
const filialChanges = changes.filter((change) => FILIAL_HTML.test(change.path));

if (changes.length === 0) {
  console.log('Filiales visual-only OK: no staged changes.');
  process.exit(0);
}

if (filialChanges.length === 0) {
  console.log('Filiales visual-only OK: no staged filial HTML changes.');
  process.exit(0);
}

const errors = [];
const nonFilialChanges = changes.filter((change) => !FILIAL_HTML.test(change.path));
if (nonFilialChanges.length > 0) {
  errors.push(`visual-only filial patch can only stage filiales/*/index.html or filiales/*/index.en.html:\n- ${nonFilialChanges.map((change) => change.path).join('\n- ')}`);
}

const diff = runGit(['diff', '--cached', '--unified=0', '--', ...filialChanges.map((change) => change.path)]);
const lines = changedLines(diff);
const selectors = changedCssSelectors(lines);

if (selectors.size > MAX_CHANGED_CSS_RULES) {
  errors.push(`visual-only patch changes ${selectors.size} CSS selectors; max is ${MAX_CHANGED_CSS_RULES}. Use full change-scope + changelog flow.`);
}

assertNoSensitiveLineChanges(diff, errors);
assertNoTextOrMarkupChanges(diff, errors);

for (const change of filialChanges) {
  if (change.status === 'D') {
    errors.push(`${change.path}: visual-only patch cannot delete filial pages.`);
    continue;
  }

  const before = readHeadFile(change.path);
  const after = readStagedFile(change.path);
  assertSameSnapshot(change.path, before, after, errors);
}

if (errors.length > 0) {
  fail(errors.join('\n'));
}

console.log(`Filiales visual-only OK: ${filialChanges.length} filial page(s), ${selectors.size} changed CSS selector pattern(s).`);
