import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BRANCH_DIR = path.join(ROOT, 'filiales');
const INDEX_FILES = {
  es: path.join(BRANCH_DIR, 'index.html'),
  en: path.join(BRANCH_DIR, 'index.en.html'),
};
const PAGE_FILES = {
  es: 'index.html',
  en: 'index.en.html',
};
const MAP_HOST = 'https://www.google.com/maps/search/?api=1&query=';

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .replace(/[.,]/g, '')
    .trim()
    .toLowerCase();
}

function decodeMapUrls(html) {
  return [...html.matchAll(/https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=[^"\s<]+/g)]
    .map((match) => decodeURIComponent(match[0].replace(MAP_HOST, '')));
}

function readIndexAddresses(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const regex = /<a href="\/filiales\/([^/]+)\/(?:index\.en\.html)?" class="filial-card[\s\S]*?<div class="filial-card-address">([^<]+)<\/div>/g;
  const addresses = new Map();

  for (const match of html.matchAll(regex)) {
    addresses.set(match[1], match[2].trim());
  }

  return addresses;
}

function addressFragments(address) {
  const parts = String(address)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const street = parts[0] || '';
  const postalCode = address.match(/\b\d{5}\b/)?.[0] || '';
  return [street, postalCode].filter(Boolean).map(normalize);
}

function auditBranchPage(slug, locale, expectedAddress) {
  const filePath = path.join(BRANCH_DIR, slug, PAGE_FILES[locale]);
  const html = fs.readFileSync(filePath, 'utf8');
  const normalizedHtml = normalize(html);
  const decodedMaps = decodeMapUrls(html);
  const fragments = addressFragments(expectedAddress);
  const normalizedMaps = decodedMaps.map((item) => normalize(item));
  const hasExpectedText = fragments.every((fragment) => normalizedHtml.includes(fragment));
  const hasExpectedMap = normalizedMaps.some((item) =>
    fragments.every((fragment) => item.includes(fragment))
  );
  const hasVisibleMapLink =
    html.includes('class="contact-data-link"') ||
    html.includes('class="toluca-inline-link"') ||
    html.includes('branch-hero-meta-item is-link');

  const issues = [];

  if (!hasExpectedText && !hasExpectedMap) {
    issues.push(`address mismatch in ${locale.toUpperCase()} page`);
  }

  if (decodedMaps.length === 0) {
    issues.push(`missing Google Maps link in ${locale.toUpperCase()} page`);
  }

  if (!hasVisibleMapLink) {
    issues.push(`missing visible map CTA in ${locale.toUpperCase()} page`);
  }

  return issues;
}

const canonicalAddresses = readIndexAddresses(INDEX_FILES.es);

const slugs = fs
  .readdirSync(BRANCH_DIR)
  .filter((entry) => fs.statSync(path.join(BRANCH_DIR, entry)).isDirectory())
  .sort();

const failures = [];

for (const slug of slugs) {
  for (const locale of ['es', 'en']) {
    const expectedAddress = canonicalAddresses.get(slug);

    if (!expectedAddress) {
      failures.push(`${slug}: missing address in filiales/index.html`);
      continue;
    }

    const issues = auditBranchPage(slug, locale, expectedAddress);
    for (const issue of issues) {
      failures.push(`${slug}: ${issue}`);
    }
  }
}

if (failures.length) {
  console.error('Branch audit failed:\n' + failures.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(`Branch audit passed for ${slugs.length} branch slugs in ES and EN.`);
