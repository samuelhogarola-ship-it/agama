import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dataPath = path.join(repoRoot, 'data', 'branch-directory.json');
const hubPath = path.join(repoRoot, 'filiales', 'index.html');

const directory = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const hubHtml = fs.readFileSync(hubPath, 'utf8');
const errors = [];

function englishCity(branch) {
  return (
    branch.cityEn ??
    branch.city.normalize('NFD').replace(/\p{Diacritic}/gu, '')
  );
}

function expectEqual(actual, expected, context) {
  if (actual !== expected) {
    errors.push(`${context}: expected "${expected}" but found "${actual ?? 'null'}"`);
  }
}

function capture(source, pattern, context) {
  const match = source.match(pattern);
  if (!match) {
    errors.push(`${context}: pattern not found`);
    return null;
  }
  return match[1];
}

function auditSharedContactValues(html, defaults, language, slug) {
  const phoneLabel = language === 'en' ? 'Phone' : 'Teléfono';

  expectEqual(
    capture(html, new RegExp(`<div class="contact-data-label">${phoneLabel}<\\/div>\\s*<div class="contact-data-value">([^<]+)<\\/div>`), `${slug} ${language} phone`),
    defaults.phone,
    `${slug} ${language} phone`
  );
  expectEqual(
    capture(html, /<div class="contact-data-label">WhatsApp<\/div>\s*<div class="contact-data-value">([^<]+)<\/div>/, `${slug} ${language} whatsapp`),
    defaults.whatsapp,
    `${slug} ${language} whatsapp`
  );
  expectEqual(
    capture(html, /<div class="contact-data-label">(?:Sitio web|Website)<\/div>\s*<div class="contact-data-value">([^<]+)<\/div>/, `${slug} ${language} website`),
    defaults.website,
    `${slug} ${language} website`
  );
}

for (const branch of directory.branches) {
  const hubAddress = capture(
    hubHtml,
    new RegExp(`<a href="/filiales/${branch.slug}/" class="filial-card">[\\s\\S]*?<div class="filial-card-address">([^<]+)<\\/div>`),
    `${branch.slug} hub address`
  );
  expectEqual(hubAddress, branch.hubAddress ?? branch.address, `${branch.slug} hub address`);

  const esPath = path.join(repoRoot, 'filiales', branch.slug, 'index.html');
  const esHtml = fs.readFileSync(esPath, 'utf8');
  auditSharedContactValues(esHtml, directory.defaults, 'es', branch.slug);

  if (branch.status === 'live') {
    expectEqual(
      capture(esHtml, /<meta content="([^"]+)" name="description"\/>/, `${branch.slug} es meta`),
      `Sucursal Agama ${branch.city} · ${branch.address}`,
      `${branch.slug} es meta`
    );
    expectEqual(
      capture(esHtml, /<div class="topbar-copy">[\s\S]*?<span>([^<]+)<\/span>/, `${branch.slug} es topbar`),
      branch.address,
      `${branch.slug} es topbar`
    );
    expectEqual(
      capture(esHtml, /<!-- FILIAL: Dirección real de la sucursal -->[\s\S]*?<div class="contact-data-label">Dirección<\/div>\s*<div class="contact-data-value">([^<]+)<\/div>/, `${branch.slug} es contact address`),
      branch.address,
      `${branch.slug} es contact address`
    );
  } else {
    expectEqual(
      capture(esHtml, /<meta content="([^"]+)" name="description"\/>/, `${branch.slug} es meta`),
      branch.metaDescriptionEs,
      `${branch.slug} es meta`
    );
    expectEqual(
      capture(esHtml, /<!-- FILIAL: Dirección real de la sucursal -->[\s\S]*?<div class="contact-data-label">Nueva ubicación<\/div>\s*<div class="contact-data-value">([^<]+)<\/div>/, `${branch.slug} es opening contact`),
      branch.contactValueEs,
      `${branch.slug} es opening contact`
    );
  }

  const enPath = path.join(repoRoot, 'filiales', branch.slug, 'index.en.html');
  if (fs.existsSync(enPath)) {
    const enHtml = fs.readFileSync(enPath, 'utf8');
    auditSharedContactValues(enHtml, directory.defaults, 'en', branch.slug);

    if (branch.status === 'live') {
      expectEqual(
        capture(enHtml, /<meta content="([^"]+)" name="description"\/>/, `${branch.slug} en meta`),
        `AGAMA branch in ${englishCity(branch)} · ${branch.address}`,
        `${branch.slug} en meta`
      );
      expectEqual(
        capture(enHtml, /<div class="topbar-copy">[\s\S]*?<span>([^<]+)<\/span>/, `${branch.slug} en topbar`),
        branch.address,
        `${branch.slug} en topbar`
      );
      expectEqual(
        capture(enHtml, /<!-- FILIAL: Dirección real de la sucursal -->[\s\S]*?<div class="contact-data-label">Dirección<\/div>\s*<div class="contact-data-value">([^<]+)<\/div>/, `${branch.slug} en contact address`),
        branch.address,
        `${branch.slug} en contact address`
      );
    } else if (branch.metaDescriptionEn) {
      expectEqual(
        capture(enHtml, /<meta content="([^"]+)" name="description"\/>/, `${branch.slug} en meta`),
        branch.metaDescriptionEn,
        `${branch.slug} en meta`
      );
    }
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validated ${directory.branches.length} branches against data/branch-directory.json.`);
