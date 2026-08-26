#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const BASE = 'https://www.agama.com.mx';
const IMG = `${BASE}/assets/img/meta-social-home.png`;

const filialesDir = 'filiales';
const dirs = readdirSync(filialesDir).filter(d => {
  const p = join(filialesDir, d);
  return statSync(p).isDirectory();
});

let added = 0, skipped = 0;

for (const city of dirs) {
  for (const file of ['index.html', 'index.en.html']) {
    const filePath = join(filialesDir, city, file);
    let html;
    try { html = readFileSync(filePath, 'utf8'); } catch { continue; }

    if (html.includes('og:title')) { skipped++; continue; }

    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (!titleMatch) { skipped++; continue; }
    const title = titleMatch[1].replace(/&amp;/g, '&');

    // Extract description
    const descMatch = html.match(/name="description"\s+content="([^"]*)"/);
    const descMatch2 = html.match(/content="([^"]*)"\s+name="description"/);
    const desc = (descMatch && descMatch[1]) || (descMatch2 && descMatch2[1]) || title;

    // Extract canonical
    const canonMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
    const url = canonMatch ? canonMatch[1] : `${BASE}/filiales/${city}/`;

    const isEN = file.endsWith('.en.html');
    const siteName = isEN ? 'AGAMA Pigments & Masterbatch' : 'AGAMA Pigmentos & Masterbatch';

    const ogBlock = [
      `  <meta property="og:type" content="website"/>`,
      `  <meta property="og:title" content="${title.replace(/"/g, '&quot;')}"/>`,
      `  <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}"/>`,
      `  <meta property="og:url" content="${url}"/>`,
      `  <meta property="og:image" content="${IMG}"/>`,
      `  <meta property="og:site_name" content="${siteName.replace(/&/g, '&amp;')}"/>`,
      `  <meta name="twitter:card" content="summary_large_image"/>`,
      `  <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}"/>`,
      `  <meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}"/>`,
      `  <meta name="twitter:image" content="${IMG}"/>`,
    ].join('\n');

    // Insert after canonical link (or after hreflang block)
    const insertAfter = html.includes('hreflang="x-default"')
      ? /(<link rel="alternate" hreflang="x-default"[^>]*>)/
      : /(<link rel="canonical"[^>]*>)/;

    const match = html.match(insertAfter);
    if (!match) { skipped++; continue; }

    const idx = html.indexOf(match[0]) + match[0].length;
    const updated = html.slice(0, idx) + '\n' + ogBlock + '\n' + html.slice(idx);
    writeFileSync(filePath, updated);
    added++;
  }
}

// Also do filiales/index.html and filiales/index.en.html (hub pages)
console.log(`Added OG/Twitter tags to ${added} filiales pages (${skipped} skipped).`);
