import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const SENSITIVE_LABELS = new Set([
  'whatsapp',
  'correo',
  'email',
  'teléfono',
  'phone',
  'dirección',
  'address',
  'nombre / razón social',
  'razón social',
  'business name',
  'rfc',
  'tax id',
  'banco',
  'bank',
  'sucursal',
  'branch',
  'cuenta',
  'account',
  'cuenta interbancaria',
  'interbank account',
]);

const JSON_LD_KEYS = new Set([
  'telephone',
  'email',
  'address',
  'hasMap',
]);

const ENTITY_MAP = new Map([
  ['&amp;', '&'],
  ['&nbsp;', ' '],
  ['&quot;', '"'],
  ['&#39;', "'"],
  ['&apos;', "'"],
  ['&lt;', '<'],
  ['&gt;', '>'],
]);

function normalizeText(value) {
  let normalized = String(value || '');
  for (const [entity, replacement] of ENTITY_MAP.entries()) {
    normalized = normalized.replaceAll(entity, replacement);
  }
  return normalized.replace(/\s+/g, ' ').trim();
}

function stripHtml(value) {
  return normalizeText(String(value || '').replace(/<[^>]*>/g, ' '));
}

function normalizedMatches(html, matcher, transform = (value) => normalizeText(value)) {
  return [...html.matchAll(matcher)]
    .map((match) => transform(match[1]))
    .filter(Boolean)
    .sort();
}

function collectSensitiveJsonLd(value, pathParts = [], output = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectSensitiveJsonLd(entry, [...pathParts, String(index)], output));
    return output;
  }

  if (!value || typeof value !== 'object') return output;

  for (const [key, entry] of Object.entries(value)) {
    const nextPath = [...pathParts, key];
    if (JSON_LD_KEYS.has(key)) {
      output.push({
        path: nextPath.join('.'),
        value: canonicalize(entry),
      });
    }
    collectSensitiveJsonLd(entry, nextPath, output);
  }

  return output;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)])
    );
  }
  return typeof value === 'string' ? normalizeText(value) : value;
}

function extractJsonLd(html, filePath) {
  const entries = [];
  const scripts = [...html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )];

  for (const [index, match] of scripts.entries()) {
    const source = match[1].trim();
    if (!source) continue;

    let parsed;
    try {
      parsed = JSON.parse(source);
    } catch {
      throw new Error(`Invalid JSON-LD in protected filial file ${filePath} at script ${index + 1}.`);
    }

    entries.push(...collectSensitiveJsonLd(parsed, [`script-${index + 1}`]));
  }

  return entries.sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right))
  );
}

function extractVisibleSensitiveFields(html) {
  const fields = [];
  const matcher = /<div class="(?:detail-item-label|contact-data-label)">([\s\S]*?)<\/div>\s*<div class="(?:detail-item-value|contact-data-value)">([\s\S]*?)<\/div>/gi;

  for (const match of html.matchAll(matcher)) {
    const label = stripHtml(match[1]);
    if (!SENSITIVE_LABELS.has(label.toLowerCase())) continue;
    fields.push({
      label,
      value: stripHtml(match[2]),
    });
  }

  for (const match of html.matchAll(/<div class="toluca-branch-address">([\s\S]*?)<\/div>/gi)) {
    fields.push({
      label: 'Toluca branch address',
      value: stripHtml(match[1]),
    });
  }

  return fields.sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right))
  );
}

function extractFileSnapshot(html, filePath) {
  return {
    visible_fields: extractVisibleSensitiveFields(html),
    telephone_links: normalizedMatches(
      html,
      /href=["']tel:([^"'?]+)(?:\?[^"']*)?["']/gi,
      (value) => value.replace(/\D/g, '')
    ),
    whatsapp_links: normalizedMatches(
      html,
      /href=["']https:\/\/wa\.me\/([^"'?]+)(?:\?[^"']*)?["']/gi,
      (value) => value.replace(/\D/g, '')
    ),
    email_links: normalizedMatches(
      html,
      /href=["']mailto:([^"'?]+)(?:\?[^"']*)?["']/gi,
      (value) => normalizeText(value).toLowerCase()
    ),
    maps_links: normalizedMatches(
      html,
      /href=["'](https:\/\/(?:www\.)?google\.[^"']*\/maps\/[^"']+)["']/gi
    ),
    json_ld: extractJsonLd(html, filePath),
  };
}

function filialHtmlFiles(rootDir) {
  const filialesDir = path.join(rootDir, 'filiales');
  const files = [];

  for (const entry of fs.readdirSync(filialesDir, { withFileTypes: true })) {
    if (entry.isFile() && /^index(?:\.en)?\.html$/.test(entry.name)) {
      files.push(path.join('filiales', entry.name));
      continue;
    }

    if (!entry.isDirectory()) continue;
    for (const fileName of ['index.html', 'index.en.html']) {
      const relativePath = path.join('filiales', entry.name, fileName);
      if (fs.existsSync(path.join(rootDir, relativePath))) files.push(relativePath);
    }
  }

  return files.sort();
}

export function buildSensitiveSnapshot(rootDir) {
  const files = {};
  for (const relativePath of filialHtmlFiles(rootDir)) {
    const html = fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
    files[relativePath.replaceAll(path.sep, '/')] = extractFileSnapshot(html, relativePath);
  }

  return {
    schema_version: 1,
    protected_scope: [
      'banking_and_tax',
      'addresses_and_maps',
      'telephone_and_whatsapp',
      'email',
      'json_ld_sensitive_fields',
    ],
    files,
  };
}

export function canonicalJson(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function snapshotHash(snapshot) {
  return sha256(canonicalJson(snapshot));
}
