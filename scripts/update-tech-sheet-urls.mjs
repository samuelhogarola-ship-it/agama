/**
 * Update public.products.ficha_tecnica from a manifest after PDFs are uploaded to Supabase Storage.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/update-tech-sheet-urls.mjs --manifest data/tech-sheets-manifest.json --dry-run
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/update-tech-sheet-urls.mjs --manifest data/tech-sheets-manifest.json
 *
 * Manifest shape:
 * [
 *   {
 *     "slug": "mb101-amarillo-huevo",
 *     "bucketPath": "masterbatch/mb101-amarillo-huevo.pdf",
 *     "sourceUrl": "https://old-cdn.example/file.pdf"
 *   },
 *   {
 *     "slug": "pigmento-azul",
 *     "publicUrl": "https://.../storage/v1/object/public/product-tech-sheets/pigmentos/pigmento-azul.pdf"
 *   },
 *   {
 *     "slug": "ad-304-protector-uv",
 *     "skip": true,
 *     "note": "No source PDF yet"
 *   }
 * ]
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);

function getArg(name, fallback = null) {
  const flag = `--${name}`;
  const idx = args.indexOf(flag);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
}

const manifestPath = getArg('manifest', 'data/tech-sheets-manifest.json');
const dryRun = args.includes('--dry-run');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'product-tech-sheets';

if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const absoluteManifestPath = path.resolve(manifestPath);
if (!fs.existsSync(absoluteManifestPath)) {
  console.error(`Manifest not found: ${absoluteManifestPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(absoluteManifestPath, 'utf8');
const entries = JSON.parse(raw);

if (!Array.isArray(entries) || entries.length === 0) {
  console.error('Manifest must be a non-empty JSON array.');
  process.exit(1);
}

function buildPublicUrl(bucketPath) {
  const normalized = String(bucketPath).replace(/^\/+/, '');
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${normalized}`;
}

function getFichaUrl(entry) {
  if (entry.publicUrl) return String(entry.publicUrl);
  if (entry.bucketPath) return buildPublicUrl(entry.bucketPath);
  throw new Error(`Entry for slug "${entry.slug}" must include bucketPath or publicUrl`);
}

async function updateProduct(slug, fichaUrl) {
  const url = `${SUPABASE_URL}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      ficha_tecnica: fichaUrl,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update slug "${slug}": ${res.status} ${await res.text()}`);
  }

  return res.json();
}

async function main() {
  console.log(`Loaded ${entries.length} entries from ${manifestPath}`);
  console.log(dryRun ? 'Running in dry-run mode.' : 'Applying updates.');

  let updated = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (!entry?.slug) {
      throw new Error('Each entry must include a slug.');
    }

    if (entry.skip) {
      skipped += 1;
      console.log(`[skip] ${entry.slug}${entry.note ? ` - ${entry.note}` : ''}`);
      continue;
    }

    const fichaUrl = getFichaUrl(entry);

    if (dryRun) {
      console.log(`[dry-run] ${entry.slug} -> ${fichaUrl}`);
      continue;
    }

    const rows = await updateProduct(entry.slug, fichaUrl);
    if (!Array.isArray(rows) || rows.length === 0) {
      console.warn(`No product row updated for slug "${entry.slug}"`);
      continue;
    }

    updated += rows.length;
    console.log(`Updated ${entry.slug}`);
  }

  if (dryRun) {
    console.log(`Dry run completed. Skipped ${skipped} entries.`);
  } else {
    console.log(`Done. Updated ${updated} product rows. Skipped ${skipped} entries.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
