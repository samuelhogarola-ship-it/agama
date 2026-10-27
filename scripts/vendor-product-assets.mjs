import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const IMAGE_MANIFEST = path.join(ROOT, 'data/product-images-manifest.json');
const SHEET_MANIFEST = path.join(ROOT, 'data/tech-sheets-manifest.json');
const INVENTORY = path.resolve(getArg('inventory') || path.join(ROOT, 'data/product-assets-vps-inventory.json'));
const ASSET_ROOT = path.join(ROOT, 'assets/product-media');
const CONCURRENCY = 8;

function getArg(name) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? null : args[index + 1] || null;
}

const slugsFile = getArg('slugs-file');
const selectedSlugs = new Set(
  slugsFile
    ? JSON.parse(fs.readFileSync(path.resolve(slugsFile), 'utf8')).slugs
    : getArg('slugs')?.split(',').map((slug) => slug.trim()).filter(Boolean) || [],
);
const includesSlug = (slug) => selectedSlugs.size === 0 || selectedSlugs.has(slug);

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const publicPath = (kind, bucketPath) => `/assets/product-media/${kind}/${String(bucketPath).replace(/^\/+/, '')}`;

function detectMime(buffer) {
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
      && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  return null;
}

async function fetchBuffer(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) throw new Error(`Empty response for ${url}`);
  return buffer;
}

async function runPool(items, worker) {
  let next = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      await worker(items[index], index);
    }
  });
  await Promise.all(workers);
}

const images = readJson(IMAGE_MANIFEST);
const sheets = readJson(SHEET_MANIFEST);
const jobs = [];

for (const entry of images) {
  if (!includesSlug(entry.slug)) continue;
  for (const [label, image] of [['cover', entry.cover], ...(entry.gallery || []).map((item, index) => [`gallery-${index + 1}`, item])]) {
    if (!image?.bucketPath) throw new Error(`${entry.slug} ${label} lacks bucketPath`);
    const source = String(image.sourceUrl || image.publicUrl || '').split(/[;,]\s*(?=https?:\/\/)/i)[0];
    if (!source) throw new Error(`${entry.slug} ${label} lacks a remote source`);
    jobs.push({ type: 'image', slug: entry.slug, label, bucketPath: image.bucketPath, source, manifestItem: image });
  }
}

for (const entry of sheets.filter((item) => !item.skip)) {
  if (!includesSlug(entry.slug)) continue;
  const source = entry.sourceUrl;
  if (!source) {
    entry.skip = true;
    entry.note = 'No accessible source PDF; legacy Supabase-only object is unavailable';
    delete entry.publicUrl;
    continue;
  }
  jobs.push({ type: 'tech-sheet', slug: entry.slug, label: 'pdf', bucketPath: entry.bucketPath, source, manifestItem: entry });
}

const inventory = new Array(jobs.length);
await runPool(jobs, async (job, index) => {
  const kind = job.type === 'image' ? 'images' : 'tech-sheets';
  const destination = path.join(ASSET_ROOT, kind, job.bucketPath);
  let buffer = fs.existsSync(destination) ? fs.readFileSync(destination) : await fetchBuffer(job.source);
  if (job.type === 'image' && detectMime(buffer) !== 'image/webp') {
    buffer = await sharp(buffer).rotate().webp({ quality: 90 }).toBuffer();
  }
  const mime = detectMime(buffer);
  const expectedMime = job.type === 'image' ? 'image/webp' : 'application/pdf';
  if (mime !== expectedMime) throw new Error(`${job.slug} ${job.label}: expected ${expectedMime}, got ${mime || 'unknown'}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, buffer);
  const url = publicPath(kind, job.bucketPath);
  job.manifestItem.publicUrl = url;
  inventory[index] = {
    type: job.type,
    slug: job.slug,
    label: job.label,
    path: url.slice(1),
    mime,
    bytes: buffer.length,
    sha256: sha256(buffer),
    sourceUrl: job.source,
  };
  process.stdout.write(`\r${index + 1}/${jobs.length}`);
});

inventory.sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(IMAGE_MANIFEST, `${JSON.stringify(images, null, 2)}\n`);
fs.writeFileSync(SHEET_MANIFEST, `${JSON.stringify(sheets, null, 2)}\n`);
fs.writeFileSync(INVENTORY, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  counts: {
    images: inventory.filter((item) => item.type === 'image').length,
    techSheets: inventory.filter((item) => item.type === 'tech-sheet').length,
    total: inventory.length,
  },
  bytes: inventory.reduce((sum, item) => sum + item.bytes, 0),
  selectedSlugs: selectedSlugs.size > 0 ? [...selectedSlugs] : null,
  files: inventory,
}, null, 2)}\n`);
console.log(`\nVendored ${inventory.length} files into ${path.relative(ROOT, ASSET_ROOT)}.`);
