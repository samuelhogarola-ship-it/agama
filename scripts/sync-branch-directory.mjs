import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dataPath = path.join(repoRoot, 'data', 'branch-directory.json');
const hubPath = path.join(repoRoot, 'filiales', 'index.html');

const directory = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

function englishCity(branch) {
  return (
    branch.cityEn ??
    branch.city.normalize('NFD').replace(/\p{Diacritic}/gu, '')
  );
}

function replaceOrThrow(source, pattern, replacement, context) {
  if (!pattern.test(source)) {
    throw new Error(`Pattern not found for ${context}`);
  }
  return source.replace(pattern, replacement);
}

function syncSharedContactValues(html, defaults, language) {
  const phoneLabel = language === 'en' ? 'Phone' : 'Teléfono';

  html = replaceOrThrow(
    html,
    new RegExp(`(<div class="contact-data-label">${phoneLabel}<\\/div>\\s*<div class="contact-data-value">)([^<]+)(<\\/div>)`),
    `$1${defaults.phone}$3`,
    `${language} phone`
  );
  html = replaceOrThrow(
    html,
    /(<div class="contact-data-label">WhatsApp<\/div>\s*<div class="contact-data-value">)([^<]+)(<\/div>)/,
    `$1${defaults.whatsapp}$3`,
    `${language} whatsapp`
  );
  html = replaceOrThrow(
    html,
    /(<div class="contact-data-label">(?:Sitio web|Website)<\/div>\s*<div class="contact-data-value">)([^<]+)(<\/div>)/,
    `$1${defaults.website}$3`,
    `${language} website`
  );

  return html;
}

function syncHub(hubHtml, branch) {
  const blockPattern = new RegExp(
    `(<a href="/filiales/${branch.slug}/" class="filial-card">[\\s\\S]*?<div class="filial-card-address">)([^<]+)(<\\/div>)`
  );
  const expected = branch.hubAddress ?? branch.address;
  return replaceOrThrow(hubHtml, blockPattern, `$1${expected}$3`, `hub ${branch.slug}`);
}

function syncBranchPage(html, branch, defaults, language) {
  const isEnglish = language === 'en';

  if (branch.status === 'live') {
    const metaDescription = isEnglish
      ? `AGAMA branch in ${englishCity(branch)} · ${branch.address}`
      : `Sucursal Agama ${branch.city} · ${branch.address}`;

    html = replaceOrThrow(
      html,
      /(<meta content=")([^"]+)(" name="description"\/>)/,
      `$1${metaDescription}$3`,
      `${branch.slug} ${language} meta`
    );

    html = replaceOrThrow(
      html,
      /(<div class="topbar-copy">[\s\S]*?<span>)([^<]+)(<\/span>)/,
      `$1${branch.address}$3`,
      `${branch.slug} ${language} topbar`
    );

    html = replaceOrThrow(
      html,
      /(<!-- FILIAL: Dirección real de la sucursal -->[\s\S]*?<div class="contact-data-label">)(Dirección|Nueva ubicación|Address|Location)(<\/div>\s*<div class="contact-data-value">)([^<]+)(<\/div>)/,
      `$1Dirección$3${branch.address}$5`,
      `${branch.slug} ${language} contact address`
    );
  } else if (branch.status === 'opening_soon') {
    if (!isEnglish) {
      html = replaceOrThrow(
        html,
        /(<meta content=")([^"]+)(" name="description"\/>)/,
        `$1${branch.metaDescriptionEs}$3`,
        `${branch.slug} es meta`
      );
      html = replaceOrThrow(
        html,
        /(<!-- FILIAL: Dirección real de la sucursal -->[\s\S]*?<div class="contact-data-label">)(Dirección|Nueva ubicación|Address|Location)(<\/div>\s*<div class="contact-data-value">)([^<]+)(<\/div>)/,
        `$1${branch.contactLabelEs}$3${branch.contactValueEs}$5`,
        `${branch.slug} es opening contact`
      );
    } else if (branch.metaDescriptionEn) {
      html = replaceOrThrow(
        html,
        /(<meta content=")([^"]+)(" name="description"\/>)/,
        `$1${branch.metaDescriptionEn}$3`,
        `${branch.slug} en meta`
      );
    }
  }

  return syncSharedContactValues(html, defaults, language);
}

let hubHtml = fs.readFileSync(hubPath, 'utf8');
for (const branch of directory.branches) {
  hubHtml = syncHub(hubHtml, branch);

  const esPath = path.join(repoRoot, 'filiales', branch.slug, 'index.html');
  let esHtml = fs.readFileSync(esPath, 'utf8');
  esHtml = syncBranchPage(esHtml, branch, directory.defaults, 'es');
  fs.writeFileSync(esPath, esHtml);

  const enPath = path.join(repoRoot, 'filiales', branch.slug, 'index.en.html');
  if (fs.existsSync(enPath)) {
    let enHtml = fs.readFileSync(enPath, 'utf8');
    enHtml = syncBranchPage(enHtml, branch, directory.defaults, 'en');
    fs.writeFileSync(enPath, enHtml);
  }
}

fs.writeFileSync(hubPath, hubHtml);
console.log(`Synced ${directory.branches.length} branch records from data/branch-directory.json`);
