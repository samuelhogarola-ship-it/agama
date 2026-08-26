#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const BASE = 'https://www.agama.com.mx';
const SITEMAP = 'sitemap.xml';

const sitemap = readFileSync(SITEMAP, 'utf8');

// Find all product pages (individual products + category indexes)
const allProducts = execSync(
  `find productos -name 'index.html' -o -name 'index.en.html' | sort`
).toString().trim().split('\n').filter(Boolean);

// Already in sitemap
const existing = new Set();
for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  existing.add(m[1]);
}

const newEntries = [];
let skipped = 0;

for (const file of allProducts) {
  // Build the URL: productos/pigmentos/bp-080/index.html → /productos/pigmentos/bp-080/
  // productos/pigmentos/bp-080/index.en.html → /productos/pigmentos/bp-080/index.en.html
  const isEN = file.endsWith('.en.html');
  const dir = file.replace(/\/index(\.en)?\.html$/, '/');
  const url = isEN
    ? `${BASE}/${dir}index.en.html`
    : `${BASE}/${dir}`;

  if (existing.has(url)) {
    skipped++;
    continue;
  }

  // Determine category for priority
  const isCategory = file.split('/').length === 3; // productos/pigmentos/index.html
  const priority = isEN ? '0.5' : isCategory ? '0.8' : '0.6';

  newEntries.push(
    `  <url><loc>${url}</loc><changefreq>monthly</changefreq><priority>${priority}</priority></url>`
  );
}

if (newEntries.length === 0) {
  console.log('No new product URLs to add.');
  process.exit(0);
}

// Insert before </urlset>
const block = newEntries.join('\n');
const updated = sitemap.replace(
  '</urlset>',
  `\n  <!-- Product catalog pages (auto-injected ${new Date().toISOString().slice(0,10)}) -->\n${block}\n</urlset>`
);

writeFileSync(SITEMAP, updated);
console.log(`Added ${newEntries.length} product URLs to sitemap (${skipped} already present).`);

// Summary by type
const esCount = newEntries.filter(e => !e.includes('index.en.html')).length;
const enCount = newEntries.filter(e => e.includes('index.en.html')).length;
console.log(`  ES: ${esCount}, EN: ${enCount}`);
