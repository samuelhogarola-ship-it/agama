import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const branchesDir = path.join(repoRoot, 'filiales');
const outputPath = path.join(repoRoot, 'docs', 'branch-contact-report.md');

function extract(html, pattern) {
  return html.match(pattern)?.[1]?.trim() ?? null;
}

function readBranch(slug) {
  const filePath = path.join(branchesDir, slug, 'index.html');
  const html = fs.readFileSync(filePath, 'utf8');

  const branchName =
    extract(html, /<span class="filial-card-name">([^<]+)<\/span>/) ||
    extract(html, /<strong>([^<]+)<\/strong>/) ||
    slug;
  const pageTitle = extract(html, /<title>([^<]+)<\/title>/);
  const address = extract(
    html,
    /<!-- FILIAL: Dirección real de la sucursal -->[\s\S]*?<div class="contact-data-value">([^<]+)<\/div>/
  );
  const phone = extract(
    html,
    /<div class="contact-data-label">Teléfono<\/div>\s*<div class="contact-data-value">([^<]+)<\/div>/
  );
  const whatsapp = extract(
    html,
    /<div class="contact-data-label">WhatsApp<\/div>\s*<div class="contact-data-value">([^<]+)<\/div>/
  );
  const fiscalName = extract(
    html,
    /<div class="detail-item-label">Nombre \/ razón social<\/div>\s*<div class="detail-item-value">([^<]+)<\/div>/
  );
  const rfc = extract(
    html,
    /<div class="detail-item-label">RFC<\/div>\s*<div class="detail-item-value">([^<]+)<\/div>/
  );
  const bank = extract(
    html,
    /<div class="detail-item-label">Banco<\/div>\s*<div class="detail-item-value">([^<]+)<\/div>/
  );
  const branchNumber = extract(
    html,
    /<div class="detail-item-label">Sucursal<\/div>\s*<div class="detail-item-value">([^<]+)<\/div>/
  );
  const account = extract(
    html,
    /<div class="detail-item-label">Cuenta<\/div>\s*<div class="detail-item-value">([^<]+)<\/div>/
  );
  const clabe = extract(
    html,
    /<div class="detail-item-label">Cuenta Interbancaria<\/div>\s*<div class="detail-item-value">([^<]+)<\/div>/
  );

  return {
    slug,
    pageTitle,
    branchName,
    address: address ?? 'No expuesta en página',
    phone: phone ?? 'No expuesto en página',
    whatsapp: whatsapp ?? 'No expuesto en página',
    fiscalName: fiscalName ?? 'No expuesto en página',
    rfc: rfc ?? 'No expuesto en página',
    bank: bank ?? 'No expuesto en página',
    branchNumber: branchNumber ?? 'No expuesto en página',
    account: account ?? 'No expuesto en página',
    clabe: clabe ?? 'No expuesta en página',
  };
}

const slugs = fs
  .readdirSync(branchesDir)
  .filter((slug) => fs.existsSync(path.join(branchesDir, slug, 'index.html')))
  .sort();

const rows = slugs.map(readBranch);

const lines = [
  '# Informe de filiales',
  '',
  'Reporte generado desde el contenido visible actual de `filiales/*/index.html`.',
  '',
  '| Filial | Dirección | Razón social / fiscal | RFC | Banco | Sucursal bancaria | Cuenta | CLABE | Teléfono | WhatsApp |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map((row) =>
    `| ${row.branchName} | ${row.address} | ${row.fiscalName} | ${row.rfc} | ${row.bank} | ${row.branchNumber} | ${row.account} | ${row.clabe} | ${row.phone} | ${row.whatsapp} |`
  ),
  '',
  '## Observaciones',
  '',
  '- `No expuesto en página` significa que el dato no aparece en el HTML público actual de esa filial.',
  '- Este informe refleja el estado visible del sitio, no una validación externa con negocio o ERP.',
];

fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
console.log(`Wrote ${rows.length} branch rows to ${path.relative(repoRoot, outputPath)}`);
