import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');

const ENTITY_MAP = new Map([
  ['&amp;', '&'],
  ['&nbsp;', ' '],
  ['&quot;', '"'],
  ['&#39;', "'"],
  ['&apos;', "'"],
  ['&lt;', '<'],
  ['&gt;', '>'],
]);

export function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

export function runGit(args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trimEnd();
  } catch (error) {
    if (allowFailure) return null;

    const stderr = error.stderr ? String(error.stderr).trim() : error.message;
    fail(`git ${args.join(' ')} failed: ${stderr}`);
  }
}

export function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

export function normalizeText(value) {
  if (!value) return '';

  let normalized = String(value);

  for (const [entity, replacement] of ENTITY_MAP.entries()) {
    normalized = normalized.replaceAll(entity, replacement);
  }

  return normalized.replace(/\s+/g, ' ').trim();
}

export function stripHtml(value) {
  return normalizeText(String(value || '').replace(/<[^>]*>/g, ' '));
}

export function parseMarkdownSections(markdown) {
  const sections = new Map();
  const lines = markdown.split(/\r?\n/);
  let currentKey = null;
  let buffer = [];

  const flush = () => {
    if (!currentKey) return;
    sections.set(currentKey, buffer.join('\n').trim());
  };

  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*$/);

    if (match) {
      flush();
      currentKey = normalizeText(match[1].toLowerCase());
      buffer = [];
      continue;
    }

    if (currentKey) buffer.push(line);
  }

  flush();
  return sections;
}

export function parseMarkdownBulletList(sectionBody) {
  return sectionBody
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => normalizeText(line.slice(2).replace(/^`|`$/g, '')));
}

export function parseNameStatusOutput(output) {
  const entries = [];

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const parts = rawLine.split('\t');
    const status = parts[0];

    if (status.startsWith('R')) {
      entries.push({ status: 'D', path: parts[1], sourceStatus: status });
      entries.push({ status: 'A', path: parts[2], sourceStatus: status });
      continue;
    }

    entries.push({ status: status[0], path: parts[1] || parts[0].slice(1).trim(), sourceStatus: status });
  }

  return entries.filter((entry) => entry.path);
}

export function getCurrentBranch() {
  const branch = runGit(['branch', '--show-current'], { allowFailure: true });
  return normalizeText(branch);
}

export function hasRealChangelogEntry() {
  const diff = runGit(['diff', '--cached', '--unified=0', '--', 'CHANGELOG.md'], { allowFailure: true }) || '';
  const addedLines = diff
    .split(/\r?\n/)
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1));

  const hasBullet = addedLines.some((line) => /^\s*-\s+\S/.test(line));
  if (!hasBullet) return false;

  const stagedVersion = runGit(['show', ':CHANGELOG.md'], { allowFailure: true }) || '';
  return /^##\s+\d{4}-\d{2}-\d{2}\s*$/m.test(stagedVersion);
}

export function isCriticalPath(filePath) {
  return [
    /^filiales\//,
    /^components\//,
    /^app\//,
    /^pages\//,
    /^public\//,
    /^assets\/css\//,
    /^index\.html$/,
    /^index\.en\.html$/,
  ].some((pattern) => pattern.test(filePath));
}

export function ensureFileExists(relativePath) {
  if (!fs.existsSync(path.join(repoRoot, relativePath))) {
    fail(`Required file not found: ${relativePath}`);
  }
}
