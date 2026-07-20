import { fail, normalizeText, readRepoFile, stripHtml } from './guardrail-helpers.mjs';
import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const filialesDir = path.join(repoRoot, 'filiales');
const planMarkdown = readRepoFile('docs/filiales-data-lock-plan.md');

const slugByFilial = {
  Monterrey: 'monterrey',
  Puebla: 'puebla',
  'Querétaro': 'queretaro',
  'San Luis Potosí': 'san-luis-potosi',
  Chalco: 'chalco',
  'Cuautitlán': 'cuautitlan',
  Ecatepec: 'ecatepec',
  Ermita: 'ermita',
  'León': 'leon',
  Merced: 'merced',
  Guadalajara: 'guadalajara',
  Zaragoza: 'zaragoza',
  'Tláhuac': 'tlahuac',
  Texcoco: 'texcoco',
  'Pantitlán': 'pantitlan',
  Online: 'online',
  Toluca: 'toluca',
};

function sectionBetween(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start === -1) return '';
  const end = endMarker ? text.indexOf(endMarker, start) : -1;
  return text.slice(start, end === -1 ? undefined : end);
}

function parseMarkdownTable(section) {
  const lines = section.split(/\r?\n/).filter((line) => /^\|/.test(line.trim()));
  if (lines.length < 3) return [];

  const headers = lines[0].split('|').slice(1, -1).map((cell) => normalizeText(cell));
  return lines.slice(2).map((line) => {
    const values = line.split('|').slice(1, -1).map((cell) => normalizeText(cell));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
}

function extractField(html, labels) {
  for (const label of labels) {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matcher = new RegExp(
      `<div class="(?:detail-item-label|contact-data-label)">${escapedLabel}</div>[\\s\\S]*?<div class="(?:detail-item-value|contact-data-value)">(.*?)</div>`,
      'i'
    );
    const match = html.match(matcher);
    if (match) return stripHtml(match[1]);
  }

  return '';
}

function extractTolucaAddress(html) {
  const match = html.match(/<div class="toluca-branch-address">([\s\S]*?)<\/div>/i);
  if (!match) return '';

  return normalizeText(
    [...match[1].matchAll(/<p>([\s\S]*?)<\/p>/gi)]
      .map((entry) => stripHtml(entry[1]))
      .filter(Boolean)
      .join(', ')
  );
}

function extractHtmlData(slug) {
  const html = fs.readFileSync(path.join(filialesDir, slug, 'index.html'), 'utf8');

  return {
    direccion: slug === 'toluca' ? extractTolucaAddress(html) : extractField(html, ['Dirección']),
    telefono: extractField(html, ['Teléfono']),
    razon_social: extractField(html, ['Razón social', 'Nombre / razón social', 'Titular']),
    rfc: extractField(html, ['RFC']),
    banco: extractField(html, ['Banco']),
    sucursal: extractField(html, ['Sucursal']),
    cuenta: extractField(html, ['Cuenta']),
    clabe: extractField(html, ['Cuenta Interbancaria']),
  };
}

function isMarkedPendingOrAbsent(value) {
  const normalized = normalizeText(value).toLowerCase();
  return normalized.startsWith('pendiente') || normalized.startsWith('ausente');
}

const contactTable = parseMarkdownTable(
  sectionBetween(
    planMarkdown,
    '### Contacto y dirección (HTML ES auditado — 2026-06-24)',
    '### Datos fiscales y bancarios (HTML ES auditado — 2026-06-24)'
  )
);

const bankingTable = parseMarkdownTable(
  sectionBetween(
    planMarkdown,
    '### Datos fiscales y bancarios (HTML ES auditado — 2026-06-24)',
    '## Pendientes humanos'
  )
);

if (contactTable.length === 0 || bankingTable.length === 0) {
  fail('Could not parse the baseline tables in docs/filiales-data-lock-plan.md.');
}

const planRows = new Map();

for (const row of contactTable) {
  const filial = row['Filial'];
  const slug = slugByFilial[filial];
  if (!slug) continue;

  planRows.set(slug, {
    filial,
    direccion: row['Dirección operativa'],
    telefono: row['Teléfono operativo'],
  });
}

for (const row of bankingTable) {
  const filial = row['Filial'];
  const slug = slugByFilial[filial];
  if (!slug) continue;

  const existing = planRows.get(slug) || { filial };
  existing.razon_social = row['Razón social'];
  existing.rfc = row['RFC'];
  existing.banco = row['Banco'];
  existing.sucursal = row['Sucursal'];
  existing.cuenta = row['Cuenta'];
  existing.clabe = row['CLABE'];
  planRows.set(slug, existing);
}

const errors = [];
const fields = [
  ['direccion', 'Dirección'],
  ['telefono', 'Teléfono'],
  ['razon_social', 'Razón social'],
  ['rfc', 'RFC'],
  ['banco', 'Banco'],
  ['sucursal', 'Sucursal'],
  ['cuenta', 'Cuenta'],
  ['clabe', 'CLABE'],
];

for (const [slug, planData] of planRows.entries()) {
  const htmlData = extractHtmlData(slug);

  for (const [fieldKey, fieldLabel] of fields) {
    const planValue = normalizeText(planData[fieldKey]);
    const htmlValue = normalizeText(htmlData[fieldKey]);

    if (isMarkedPendingOrAbsent(planValue)) {
      if (htmlValue) {
        errors.push(`${planData.filial}: ${fieldLabel} is marked as ${planValue} in the plan but HTML ES currently exposes "${htmlValue}".`);
      }
      continue;
    }

    if (!htmlValue) {
      errors.push(`${planData.filial}: could not extract a reliable ${fieldLabel} from HTML ES; mark it as pendiente or ausente in the plan if intentional.`);
      continue;
    }

    if (planValue !== htmlValue) {
      errors.push(`${planData.filial}: ${fieldLabel} mismatch.\nPlan: ${planValue}\nHTML ES: ${htmlValue}`);
    }
  }
}

if (errors.length > 0) {
  fail(errors.join('\n'));
}

console.log('Filiales plan baseline matches HTML ES.');
