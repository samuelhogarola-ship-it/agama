/**
 * Update public.products.portada and public.products.galeria from a manifest
 * after images are uploaded to Supabase Storage.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/update-product-image-urls.mjs --manifest data/product-images-manifest.json --dry-run
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/update-product-image-urls.mjs --manifest data/product-images-manifest.json
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const BUCKET = 'product-images';

function getArg(name, fallback = null) {
  const flag = `--${name}`;
  const idx = args.indexOf(flag);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
}

const manifestPath = getArg('manifest', 'data/product-images-manifest.json');
const dryRun = args.includes('--dry-run');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function getImageUrl(image) {
  if (!image) return null;
  if (image.publicUrl) return String(image.publicUrl);
  if (image.bucketPath) return buildPublicUrl(image.bucketPath);
  throw new Error('Each image entry must include bucketPath or publicUrl');
}

function buildPayload(entry) {
  const payload = {
    updated_at: new Date().toISOString(),
  };

  if ('cover' in entry) {
    payload.portada = entry.cover ? getImageUrl(entry.cover) : null;
  }

  if ('gallery' in entry) {
    const galleryUrls = Array.isArray(entry.gallery)
      ? entry.gallery.map(getImageUrl).filter(Boolean)
      : [];

    payload.galeria = galleryUrls.length > 0 ? galleryUrls.join(',') : null;
  }

  return payload;
}

async function updateProduct(slug, payload) {
  const url = `${SUPABASE_URL}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
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

    const payload = buildPayload(entry);

    if (dryRun) {
      console.log(`[dry-run] ${entry.slug} -> portada=${payload.portada ?? 'unchanged'} galeria=${payload.galeria ?? 'unchanged'}`);
      continue;
    }

    const rows = await updateProduct(entry.slug, payload);
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
