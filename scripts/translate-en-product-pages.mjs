import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

import { translateProductHtmlToEn, translateProductTextToEn } from '../assets/js/product-i18n.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const productsDir = path.join(rootDir, 'productos');

function walk(dir, matches = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, matches);
      continue;
    }

    if (entry.name === 'index.en.html') {
      matches.push(fullPath);
    }
  }

  return matches;
}

function gitReadHead(relativePath) {
  return execFileSync('git', ['show', `HEAD:${relativePath}`], {
    cwd: rootDir,
    encoding: 'utf8',
  });
}

function replaceMetaContent(html, key, translator) {
  const pattern = new RegExp(`(<meta[^>]+(?:name|property)="${key}"[^>]+content=")([^"]*)(")`, 'i');
  return html.replace(pattern, (_, start, content, end) => `${start}${translator(content)}${end}`);
}

function truncateMetaDescription(value) {
  const text = String(value || '').trim();
  return text.length > 155 ? `${text.slice(0, 152)}...` : text;
}

function buildWhatsAppHref(productName, requestSheet = false) {
  const base = `Hello AGAMA, I am interested in the product: ${productName}`;
  const text = requestSheet ? `${base}. I would like to request the technical sheet.` : base;
  return `https://wa.me/525573515156?text=${encodeURIComponent(text)}`;
}

function translateProductPage(originalHtml) {
  const nameMatch = originalHtml.match(/<h1 class="product-title">([\s\S]*?)<\/h1>/);
  const originalName = nameMatch ? nameMatch[1].trim() : '';
  const translatedName = translateProductTextToEn(originalName);
  const descMatch = originalHtml.match(/<p class="product-desc">([\s\S]*?)<\/p>/);
  const originalDesc = descMatch ? descMatch[1].trim() : '';
  const translatedDesc = translateProductTextToEn(originalDesc);
  const translatedMetaDesc = truncateMetaDescription(translatedDesc);

  let html = originalHtml;

  html = html.replace(/<title>([\s\S]*?)<\/title>/, (_, value) => `<title>${translateProductTextToEn(value)}</title>`);
  html = replaceMetaContent(html, 'description', () => translatedMetaDesc);
  html = replaceMetaContent(html, 'og:title', (value) => translateProductTextToEn(value));
  html = replaceMetaContent(html, 'og:description', () => translatedMetaDesc);
  html = replaceMetaContent(html, 'twitter:title', (value) => translateProductTextToEn(value));
  html = replaceMetaContent(html, 'twitter:description', () => translatedMetaDesc);

  html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (_, start, json, end) => {
    const translatedJson = json
      .replace(/"name":"([^"]*)"/g, (match, value) => `"name":"${translateProductTextToEn(value)}"`)
      .replace(/"description":"([^"]*)"/g, (match, value) => `"description":"${translateProductTextToEn(value)}"`);
    return `${start}${translatedJson}${end}`;
  });

  html = html.replace(/<h1 class="product-title">([\s\S]*?)<\/h1>/, `<h1 class="product-title">${translatedName}</h1>`);
  html = html.replace(/(<nav class="product-breadcrumb"[\s\S]*?\/\s*)([^<\n][\s\S]*?)(\s*<\/nav>)/, (_, start, value, end) => {
    return `${start}${translateProductTextToEn(value.trim())}${end}`;
  });

  html = html.replace(/<span class="prod-badge">([\s\S]*?)<\/span>/g, (_, value) => `<span class="prod-badge">${translateProductTextToEn(value.trim())}</span>`);
  html = html.replace(/<p class="product-desc">([\s\S]*?)<\/p>/g, () => `<p class="product-desc">${translatedDesc}</p>`);
  html = html.replace(/(<section class="product-info-section">)([\s\S]*?)(<\/section>)/, (_, start, value, end) => {
    return `${start}${translateProductHtmlToEn(value)}${end}`;
  });

  html = html.replace(/\b(aria-label|data-gallery-alt|alt)="([^"]*)"/g, (_, attr, value) => {
    return `${attr}="${translateProductTextToEn(value)}"`;
  });

  let waCount = 0;
  html = html.replace(/https:\/\/wa\.me\/525573515156\?text=[^"]+/g, () => {
    waCount += 1;
    return buildWhatsAppHref(translatedName, waCount > 1);
  });

  return html;
}

const files = walk(productsDir).filter((filePath) =>
  /productos\/[^/]+\/[^/]+\/index\.en\.html$/.test(filePath)
);

for (const filePath of files) {
  const relativePath = path.relative(rootDir, filePath).split(path.sep).join('/');
  const original = gitReadHead(relativePath);
  const translated = translateProductPage(original);
  fs.writeFileSync(filePath, translated, 'utf8');
}

console.log(`Translated ${files.length} English product pages from HEAD sources.`);
