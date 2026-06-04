import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const manifestPath = getArg('manifest', 'data/product-images-manifest.json');
const absoluteManifestPath = path.resolve(manifestPath);
const BUCKET = 'product-images';

function getArg(name, fallback = null) {
  const flag = `--${name}`;
  const idx = args.indexOf(flag);
  return idx === -1 ? fallback : args[idx + 1] ?? fallback;
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function expectedPublicUrl(origin, bucketPath) {
  const normalized = String(bucketPath).replace(/^\/+/, '');
  return `${origin}/storage/v1/object/public/${BUCKET}/${normalized}`;
}

function validateImage(entry, image, label, state) {
  if (!image || typeof image !== 'object') {
    state.errors.push(`${entry.slug} ${label}: missing image object`);
    return;
  }

  if (!image.bucketPath) {
    state.errors.push(`${entry.slug} ${label}: missing bucketPath`);
    return;
  }

  if (!image.publicUrl) {
    state.errors.push(`${entry.slug} ${label}: missing publicUrl`);
    return;
  }

  const normalizedPath = String(image.bucketPath).replace(/^\/+/, '');
  if (!normalizedPath.endsWith('.webp')) {
    state.errors.push(`${entry.slug} ${label}: bucketPath must end with .webp`);
  }

  if (!normalizedPath.includes(`/${entry.slug}/`) && !normalizedPath.endsWith(`/${entry.slug}.webp`)) {
    state.errors.push(`${entry.slug} ${label}: bucketPath does not include slug`);
  }

  let url;
  try {
    url = new URL(image.publicUrl);
  } catch {
    state.errors.push(`${entry.slug} ${label}: invalid publicUrl`);
    return;
  }

  state.origins.add(url.origin);
  const expected = expectedPublicUrl(url.origin, normalizedPath);
  if (image.publicUrl !== expected) {
    state.errors.push(`${entry.slug} ${label}: publicUrl does not match bucketPath`);
  }

  if (state.seenPaths.has(normalizedPath)) {
    state.errors.push(`${entry.slug} ${label}: duplicated bucketPath ${normalizedPath}`);
  }
  state.seenPaths.add(normalizedPath);
}

if (!fs.existsSync(absoluteManifestPath)) {
  fail(`Manifest not found: ${absoluteManifestPath}`);
}

let entries;
try {
  entries = JSON.parse(fs.readFileSync(absoluteManifestPath, 'utf8'));
} catch (error) {
  fail(`Failed to parse manifest JSON at ${absoluteManifestPath}: ${error.message}`);
}

if (!Array.isArray(entries) || entries.length === 0) {
  fail('Manifest must be a non-empty JSON array.');
}

const state = {
  errors: [],
  origins: new Set(),
  seenPaths: new Set(),
  processed: 0,
  skipped: 0,
};

for (const entry of entries) {
  if (!entry?.slug) {
    state.errors.push('Entry without slug');
    continue;
  }

  if (entry.skip) {
    state.skipped += 1;
    continue;
  }

  validateImage(entry, entry.cover, 'cover', state);

  if (!Array.isArray(entry.gallery) || entry.gallery.length === 0) {
    state.errors.push(`${entry.slug}: gallery must be a non-empty array`);
  } else {
    entry.gallery.forEach((image, index) => {
      validateImage(entry, image, `gallery-${index + 1}`, state);
    });
  }

  state.processed += 1;
}

if (state.origins.size > 1) {
  state.errors.push(`Manifest mixes multiple public origins: ${Array.from(state.origins).join(', ')}`);
}

if (state.errors.length > 0) {
  state.errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validated ${state.processed} product entries from ${manifestPath}.`);
console.log(`Skipped ${state.skipped} entries.`);
console.log(`Checked ${state.seenPaths.size} unique product image paths.`);
console.log(`Public origin: ${Array.from(state.origins)[0] ?? 'n/a'}`);
