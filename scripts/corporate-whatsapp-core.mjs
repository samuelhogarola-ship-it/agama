import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// These sentinels and their regression tests deliberately retain the retired identity.
export const OLD_CORPORATE_DIGITS = '525573515156';
export const NEW_CORPORATE_DIGITS = '525548604275';
export const NEW_CORPORATE_DISPLAY = '+52 55 4860 4275';

const CORPORATE_PATTERN = String.raw`(?<!\d)\+?52[ \t\u00a0().-]*55[ \t\u00a0().-]*7351[ \t\u00a0().-]*5156(?!\d)`;
const WHATSAPP_URL_PATTERN = String.raw`(?:https?:)?\/\/(?:wa\.me|api\.whatsapp\.com)\/[^\s"'<>\x60]+`;
const PHYSICAL_BRANCHES = [
  'chalco', 'cuautitlan', 'ecatepec', 'ermita', 'guadalajara', 'leon',
  'merced', 'monterrey', 'pantitlan', 'puebla', 'queretaro', 'san-luis-potosi',
  'texcoco', 'tlahuac', 'toluca', 'zaragoza',
];
const SENTINEL_FILES = new Set([
  'scripts/corporate-whatsapp-core.mjs',
  'scripts/validate-corporate-whatsapp.mjs',
  'tests/corporate-whatsapp.test.mjs',
]);
const IGNORED_DIRECTORIES = new Set([
  '.git', 'node_modules', '.next', '.superpowers', '.claude', '.codex',
  'playwright-report', 'test-results', 'blob-report', 'graphify-out',
]);
const TEXT_EXTENSIONS = new Set([
  '.html', '.htm', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.php',
  '.json', '.csv', '.tsv', '.txt', '.xml', '.yaml', '.yml', '.md', '.svg', '.sql',
]);

export function isProtectedCorporateWhatsappFile(file) {
  return /^(?:dist\/)?filiales\/online\/index(?:\.en)?\.html$/.test(file);
}

/** Pure migration: preserve formatting and every non-phone WhatsApp query byte. */
export function migrateCorporateWhatsappText(source) {
  let replacements = 0;
  const replaceIdentity = (value) => value.replace(new RegExp(CORPORATE_PATTERN, 'g'), (number) => {
    replacements += 1;
    let digitIndex = 0;
    return number.replace(/\d/g, () => NEW_CORPORATE_DIGITS[digitIndex++]);
  });
  // Match complete WhatsApp URLs before loose text so query values are never re-encoded.
  const text = source.replace(new RegExp(`${WHATSAPP_URL_PATTERN}|${CORPORATE_PATTERN}`, 'gi'), (value) => {
    if (/^(?:https?:)?\/\/wa\.me\//i.test(value)) {
      return value.replace(/^((?:https?:)?\/\/wa\.me\/)([^?#]*)/i, (_, prefix, phone) =>
        prefix + replaceIdentity(phone));
    }
    if (/^(?:https?:)?\/\/api\.whatsapp\.com\//i.test(value)) {
      return value.replace(/([?&](?:amp;)?phone=)([^&#]*)/g, (_, prefix, phone) => prefix + replaceIdentity(phone));
    }
    return replaceIdentity(value);
  });
  return { text, replacements };
}

function walkFiles(root, relative = '') {
  const files = [];
  for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
    if (IGNORED_DIRECTORIES.has(entry.name)) continue;
    const file = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(root, file));
    else if (entry.isFile()) files.push(file);
  }
  return files;
}

function sourceFiles(root, includeDist) {
  const top = spawnSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  let files;
  if (top.status === 0 && fs.realpathSync(top.stdout.trim()) === fs.realpathSync(root)) {
    const listed = spawnSync('git', ['-C', root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    if (listed.status !== 0) throw new Error(`Cannot inventory repository files: ${listed.stderr}`);
    files = listed.stdout.split('\0').filter(Boolean);
  } else {
    files = walkFiles(root);
  }
  // dist is intentionally git-ignored, and only scanned when explicitly requested.
  if (includeDist && fs.existsSync(path.join(root, 'dist'))) {
    files.push(...walkFiles(root, 'dist'));
  }
  return [...new Set(files)].filter((file) => {
    const parts = file.split('/');
    return !parts.some((part) => IGNORED_DIRECTORIES.has(part))
      && (includeDist || parts[0] !== 'dist')
      && !file.startsWith('docs/superpowers/')
      && !SENTINEL_FILES.has(file)
      && TEXT_EXTENSIONS.has(path.extname(file).toLowerCase());
  }).sort();
}

/** Read-only inventory; git-ignored build noise is excluded except opt-in dist. */
export function findLegacyCorporateMatches(root, { includeDist = false, skipProtected = false } = {}) {
  const matches = [];
  for (const file of sourceFiles(root, includeDist)) {
    if (skipProtected && isProtectedCorporateWhatsappFile(file)) continue;
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute) || !fs.lstatSync(absolute).isFile()) continue;
    const source = fs.readFileSync(absolute, 'utf8');
    for (const match of source.matchAll(new RegExp(CORPORATE_PATTERN, 'g'))) {
      matches.push({ file, line: source.slice(0, match.index).split('\n').length, value: match[0] });
    }
  }
  return matches;
}

/** Capture raw WhatsApp destinations and displayed numbers, in document order. */
export function collectBranchWhatsappSnapshot(root) {
  const snapshot = {};
  for (const family of ['filiales', 'puntosdeventa']) {
    for (const slug of PHYSICAL_BRANCHES) {
      for (const name of ['index.en.html', 'index.html']) {
        const file = `${family}/${slug}/${name}`;
        const absolute = path.join(root, file);
        if (!fs.existsSync(absolute)) throw new Error(`Missing physical branch file: ${file}`);
        const source = fs.readFileSync(absolute, 'utf8');
        const values = [];
        for (const anchor of source.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])((?:https?:)?\/\/(?:wa\.me|api\.whatsapp\.com)\/[^"']*)\1[^>]*>([\s\S]*?)<\/a>/gi)) {
          values.push(anchor[2]);
          // Keep the displayed bytes, including punctuation, instead of normalizing digits.
          for (const number of anchor[3].matchAll(/\+?\d[\d \t\u00a0().-]{6,}\d/g)) values.push(number[0]);
        }
        if (values.length === 0) throw new Error(`Missing WhatsApp links in physical branch file: ${file}`);
        snapshot[file] = values;
      }
    }
  }
  return snapshot;
}
