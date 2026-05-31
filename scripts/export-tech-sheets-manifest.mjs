/**
 * Export a tech sheets manifest from current Supabase product data.
 *
 * Existing source PDF URLs are preserved in `sourceUrl`.
 * Missing source PDFs are marked with `skip: true` so the updater won't write broken URLs.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/export-tech-sheets-manifest.mjs
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/export-tech-sheets-manifest.mjs --out data/tech-sheets-manifest.json
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

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const outputPath = path.resolve(getArg('out', 'data/tech-sheets-manifest.json'));

if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_ANON_KEY');
  process.exit(1);
}

async function fetchProducts() {
  const url = `${SUPABASE_URL}/rest/v1/products?select=slug,tipo_producto,ficha_tecnica&published=eq.true&order=tipo_producto.asc,slug.asc`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

function buildEntry(product) {
  const entry = {
    slug: product.slug,
    bucketPath: `${product.tipo_producto}/${product.slug}.pdf`,
  };

  if (product.ficha_tecnica) {
    entry.sourceUrl = product.ficha_tecnica;
  } else {
    entry.skip = true;
    entry.note = 'No source PDF in current catalog';
  }

  return entry;
}

async function main() {
  const products = await fetchProducts();
  const manifest = products.map(buildEntry);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + '\n');

  const skipped = manifest.filter((entry) => entry.skip).length;
  console.log(`Wrote ${manifest.length} entries to ${outputPath}`);
  console.log(`Entries with source PDF: ${manifest.length - skipped}`);
  console.log(`Skipped (missing source PDF): ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
