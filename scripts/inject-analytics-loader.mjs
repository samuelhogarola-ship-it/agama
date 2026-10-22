import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const GTM_SCRIPT_RE = /\s*(?:<!--\s*Google Tag Manager\s*-->\s*)?<script\b[^>]*>\s*\(function\(w,d,s,l,i\)[\s\S]*?googletagmanager\.com\/gtm\.js[\s\S]*?<\/script>\s*(?:<!--\s*End Google Tag Manager\s*-->)?/gi;
const GTM_NOSCRIPT_RE = /\s*(?:<!--\s*Google Tag Manager \(noscript\)\s*-->\s*)?<noscript>\s*<iframe\b[^>]*googletagmanager\.com\/ns\.html[\s\S]*?<\/noscript>\s*(?:<!--\s*End Google Tag Manager \(noscript\)\s*-->)?/gi;
const ANALYTICS_SCRIPT_RE = /\s*<script\s+src=["'][^"']*assets\/js\/analytics(?:-config)?\.js[^"']*["'][^>]*>\s*<\/script>/gi;

export const ANALYTICS_ENV_KEYS = [
  'AGAMA_GTM_ID',
  'AGAMA_GA4_ID',
  'AGAMA_UMAMI_WEBSITE_ID',
  'AGAMA_UMAMI_SRC',
];

export function analyticsConfigFromEnv(env = process.env) {
  return {
    gtmId: env.AGAMA_GTM_ID || '',
    ga4Id: env.AGAMA_GA4_ID || '',
    umamiWebsiteId: env.AGAMA_UMAMI_WEBSITE_ID || '',
    umamiSrc: env.AGAMA_UMAMI_SRC || '',
  };
}

export function buildAnalyticsConfigSource(config = analyticsConfigFromEnv()) {
  return `(function (window) {
  window.AGAMA_ANALYTICS_CONFIG = ${JSON.stringify(config, null, 2)};
})(window);
`;
}

export function buildAnalyticsScriptTags(root = '') {
  return `  <script src="${root}assets/js/analytics-config.js" defer></script>
  <script src="${root}assets/js/analytics.js" defer></script>`;
}

export function injectAnalyticsLoader(html, root = '') {
  const cleaned = html
    .replace(GTM_SCRIPT_RE, '')
    .replace(GTM_NOSCRIPT_RE, '')
    .replace(ANALYTICS_SCRIPT_RE, '');

  const tags = buildAnalyticsScriptTags(root);
  if (!/<\/head>/i.test(cleaned)) return cleaned;

  return cleaned.replace(/\s*<\/head>/i, `\n${tags}\n</head>`);
}

function rootForHtml(relativePath) {
  const depth = path.dirname(relativePath) === '.'
    ? 0
    : path.dirname(relativePath).split(path.sep).length;
  return depth === 0 ? '' : '../'.repeat(depth);
}

function trackedHtmlFiles() {
  return execFileSync('git', ['ls-files', '*.html'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((filePath) => !filePath.startsWith('dist/'));
}

function runCli() {
  let changed = 0;

  for (const relativePath of trackedHtmlFiles()) {
    const absolutePath = path.join(repoRoot, relativePath);
    const before = fs.readFileSync(absolutePath, 'utf8');
    const after = injectAnalyticsLoader(before, rootForHtml(relativePath));

    if (after !== before) {
      fs.writeFileSync(absolutePath, after, 'utf8');
      changed += 1;
    }
  }

  console.log(`Analytics loader injected in ${changed} HTML files.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
