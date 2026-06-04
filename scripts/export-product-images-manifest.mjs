/**
 * Export a product images manifest from current Supabase product data.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/export-product-images-manifest.mjs
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/export-product-images-manifest.mjs --out data/product-images-manifest.json
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const PAGE_SIZE = 100;

function getArg(name, fallback = null) {
  const flag = `--${name}`;
  const idx = args.indexOf(flag);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const outputPath = path.resolve(getArg('out', 'data/product-images-manifest.json'));

if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_ANON_KEY');
  process.exit(1);
}

async function fetchProductsPage(offset) {
  const url = `${SUPABASE_URL}/rest/v1/products?select=slug,tipo_producto,portada,galeria&published=eq.true&order=tipo_producto.asc,slug.asc&limit=${PAGE_SIZE}&offset=${offset}`;
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

async function fetchProducts() {
  const products = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await fetchProductsPage(offset);
    products.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }
  }

  return products;
}

function splitGallery(gallery) {
  if (!gallery) return [];

  return String(gallery)
    .split(/[;,]\s*(?=https?:\/\/)/i)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !/ficha/i.test(item));
}

function fileExtensionFromUrl(url, fallback = '.jpg') {
  try {
    const pathname = decodeURIComponent(new URL(url).pathname);
    const ext = path.extname(pathname).toLowerCase();
    if (ext) return ext;
  } catch {
    return fallback;
  }

  return fallback;
}

function buildEntry(product) {
  const galleryUrls = splitGallery(product.galeria);
  const entry = {
    slug: product.slug,
  };

  if (product.portada) {
    entry.cover = {
      bucketPath: `${product.tipo_producto}/${product.slug}/cover${fileExtensionFromUrl(product.portada)}`,
      sourceUrl: product.portada,
    };
  }

  if (galleryUrls.length > 0) {
    entry.gallery = galleryUrls.map((sourceUrl, index) => ({
      bucketPath: `${product.tipo_producto}/${product.slug}/gallery-${index + 1}${fileExtensionFromUrl(sourceUrl)}`,
      sourceUrl,
    }));
  }

  if (!entry.cover && !entry.gallery) {
    entry.skip = true;
    entry.note = 'No source images in current catalog';
  }

  return entry;
}

async function main() {
  const products = await fetchProducts();
  const manifest = products.map(buildEntry);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + '\n');

  const skipped = manifest.filter((entry) => entry.skip).length;
  const withCover = manifest.filter((entry) => entry.cover).length;
  const withGallery = manifest.filter((entry) => Array.isArray(entry.gallery) && entry.gallery.length > 0).length;

  console.log(`Wrote ${manifest.length} entries to ${outputPath}`);
  console.log(`Entries with cover image: ${withCover}`);
  console.log(`Entries with gallery images: ${withGallery}`);
  console.log(`Skipped (missing source images): ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
