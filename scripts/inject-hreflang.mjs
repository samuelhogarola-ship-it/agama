#!/usr/bin/env node
/**
 * Injects hreflang tags into all ES/EN page pairs.
 * - Skips pages that already have correct hreflang
 * - Fixes pages with broken hreflang (like eventos/index.en.html)
 * - Adds es-MX, en, and x-default to both versions
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const BASE = 'https://www.agama.com.mx';
const SKIP_DIRS = ['dist', 'node_modules', 'portal', '.git', 'scripts', 'tests', 'docs', 'data', 'assets', '.github', '.husky'];

function findEnPages(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (SKIP_DIRS.includes(entry)) continue;
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...findEnPages(full));
    } else if (entry === 'index.en.html') {
      results.push(full);
    }
  }
  return results;
}

function urlForPath(filePath) {
  const rel = relative(ROOT, filePath);
  if (rel === 'index.html') return `${BASE}/`;
  if (rel === 'index.en.html') return `${BASE}/index.en.html`;
  const dir = rel.replace(/\/index(\.en)?\.html$/, '/');
  if (rel.endsWith('.en.html')) return `${BASE}/${dir}index.en.html`;
  return `${BASE}/${dir}`;
}

function buildHreflangBlock(esUrl, enUrl) {
  return [
    `<link rel="alternate" hreflang="es-MX" href="${esUrl}"/>`,
    `<link rel="alternate" hreflang="en" href="${enUrl}"/>`,
    `<link rel="alternate" hreflang="x-default" href="${esUrl}"/>`,
  ].join('\n  ');
}

function removeExistingHreflang(html) {
  return html.replace(/\s*<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*\/?>\s*/g, '\n  ');
}

function injectHreflang(filePath, hreflangBlock) {
  let html = readFileSync(filePath, 'utf8');
  html = removeExistingHreflang(html);

  // Insert after <link rel="canonical" ...> if present
  const canonicalRe = /(<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>)/;
  if (canonicalRe.test(html)) {
    html = html.replace(canonicalRe, `$1\n  ${hreflangBlock}`);
  } else {
    // Fallback: insert before </head>
    html = html.replace('</head>', `  ${hreflangBlock}\n</head>`);
  }

  writeFileSync(filePath, html, 'utf8');
}

const enPages = findEnPages(ROOT);
let injected = 0;
let fixed = 0;
let skipped = 0;

for (const enPath of enPages) {
  const esPath = enPath.replace('/index.en.html', '/index.html');
  try {
    statSync(esPath);
  } catch {
    console.log(`SKIP (no ES pair): ${relative(ROOT, enPath)}`);
    skipped++;
    continue;
  }

  const esUrl = urlForPath(esPath);
  const enUrl = urlForPath(enPath);
  const block = buildHreflangBlock(esUrl, enUrl);

  const esHtml = readFileSync(esPath, 'utf8');
  const enHtml = readFileSync(enPath, 'utf8');

  const esHasCorrect = esHtml.includes(`hreflang="es-MX"`) && esHtml.includes(`hreflang="en"`) && esHtml.includes(enUrl);
  const enHasCorrect = enHtml.includes(`hreflang="es-MX"`) && enHtml.includes(`hreflang="en"`) && enHtml.includes(esUrl);

  if (esHasCorrect && enHasCorrect) {
    skipped++;
    continue;
  }

  // Inject or fix
  injectHreflang(esPath, block);
  injectHreflang(enPath, block);

  const label = (esHtml.includes('hreflang') || enHtml.includes('hreflang')) ? 'FIXED' : 'ADDED';
  if (label === 'FIXED') fixed++;
  else injected++;
  console.log(`${label}: ${relative(ROOT, esPath).replace('/index.html', '/')}`);
}

console.log(`\nDone: ${injected} pairs added, ${fixed} pairs fixed, ${skipped} skipped.`);
