/**
 * Download product images from a manifest, convert them to WebP with cwebp,
 * upload them to Supabase Storage, and write an updated manifest.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run product-images:migrate-webp -- --manifest data/product-images-manifest.json
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const args = process.argv.slice(2);
const BUCKET = 'product-images';

function getArg(name, fallback = null) {
  const flag = `--${name}`;
  const idx = args.indexOf(flag);
  return idx === -1 ? fallback : args[idx + 1] ?? fallback;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const manifestPath = path.resolve(getArg('manifest', 'data/product-images-manifest.json'));
const outputPath = path.resolve(getArg('out', manifestPath));
const workDir = path.resolve(getArg('work-dir', path.join(os.tmpdir(), 'agama-product-images-webp')));
const quality = String(getArg('quality', '82'));
const timeoutMs = Number(getArg('timeout-ms', '30000'));
const dryRun = args.includes('--dry-run');
const normalizedServiceRoleKey = SERVICE_ROLE_KEY ? String(SERVICE_ROLE_KEY).trim() : '';

if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL');
  process.exit(1);
}

if (!normalizedServiceRoleKey && !dryRun) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) {
  console.error(`Manifest not found: ${manifestPath}`);
  process.exit(1);
}

function toWebpBucketPath(bucketPath) {
  const parsed = path.posix.parse(String(bucketPath).replace(/^\/+/, ''));
  return path.posix.join(parsed.dir, `${parsed.name}.webp`);
}

function looksLikeJwt(value) {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
}

function publicUrl(bucketPath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${bucketPath}`;
}

function fileExtensionFromUrl(url, fallback = '.img') {
  try {
    const pathname = decodeURIComponent(new URL(url).pathname);
    const ext = path.extname(pathname).toLowerCase();
    if (ext) return ext;
  } catch {
    return fallback;
  }

  return fallback;
}

function splitSourceUrls(value) {
  if (!value) return [];

  return String(value)
    .split(/[;,]\s*(?=https?:\/\/)/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

function rankSourceUrl(url, { kind, coverSourceUrl }) {
  let score = 0;

  if (/ficha/i.test(url)) score -= 100;
  if (/no%20usar|no usar/i.test(url)) score -= 50;
  if (/empaque|foto-1/i.test(url)) score += kind.startsWith('gallery') ? 30 : 0;
  if (/producto-interno|foto-2/i.test(url)) score += kind === 'cover' ? 30 : 0;
  if (/placa|foto-3/i.test(url)) score += kind.startsWith('gallery') ? 10 : 0;
  if (coverSourceUrl && url === coverSourceUrl) score -= kind.startsWith('gallery') ? 20 : 0;

  return score;
}

function resolveSourceUrls(entry, item) {
  const coverSourceUrl = entry.cover?.sourceUrl ? splitSourceUrls(entry.cover.sourceUrl)[0] : null;

  return splitSourceUrls(item.image.sourceUrl)
    .sort((a, b) => rankSourceUrl(b, { kind: item.kind, coverSourceUrl }) - rankSourceUrl(a, { kind: item.kind, coverSourceUrl }));
}

function imagesForEntry(entry) {
  const images = [];
  if (entry.cover) {
    images.push({ kind: 'cover', image: entry.cover });
  }
  if (Array.isArray(entry.gallery)) {
    entry.gallery.forEach((image, index) => {
      images.push({ kind: `gallery-${index + 1}`, image });
    });
  }
  return images;
}

async function downloadImage(sourceUrls, outputBase) {
  let lastError = null;

  for (const sourceUrl of sourceUrls) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(sourceUrl, { signal: controller.signal });
      if (!res.ok) {
        lastError = `Download failed ${res.status} for ${sourceUrl}`;
        continue;
      }

      const outputFile = `${outputBase}${fileExtensionFromUrl(sourceUrl)}`;
      const bytes = Buffer.from(await res.arrayBuffer());
      fs.mkdirSync(path.dirname(outputFile), { recursive: true });
      fs.writeFileSync(outputFile, bytes);
      return { sourceUrl, outputFile };
    } catch (error) {
      lastError = error?.name === 'AbortError'
        ? `Download timed out after ${timeoutMs}ms for ${sourceUrl}`
        : `Download failed for ${sourceUrl}: ${error.message}`;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(lastError ?? 'Download failed for all candidate URLs.');
}

async function convertAvifToPng(inputFile, outputFile) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });

  const script = [
    'from PIL import Image',
    'import sys',
    'src, dst = sys.argv[1], sys.argv[2]',
    "Image.open(src).save(dst, 'PNG')",
  ].join('; ');

  await execFileAsync('python3', ['-c', script, inputFile, outputFile]);
}

async function prepareInputForCwebp(inputFile, outputBase) {
  if (path.extname(inputFile).toLowerCase() !== '.avif') {
    return inputFile;
  }

  const pngFile = `${outputBase}.png`;
  await convertAvifToPng(inputFile, pngFile);
  return pngFile;
}

async function convertToWebp(inputFile, outputFile, outputBase) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  const preparedInput = await prepareInputForCwebp(inputFile, outputBase);
  await execFileAsync('cwebp', ['-quiet', '-q', quality, preparedInput, '-o', outputFile]);
}

async function uploadWebp(bucketPath, filePath) {
  const objectPath = bucketPath.split('/').map(encodeURIComponent).join('/');
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        apikey: normalizedServiceRoleKey,
        Authorization: `Bearer ${normalizedServiceRoleKey}`,
        'Content-Type': 'image/webp',
        'Cache-Control': '31536000',
        'x-upsert': 'true',
      },
      body: fs.readFileSync(filePath),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Upload failed for ${bucketPath}: ${res.status} ${await res.text()}`);
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Upload timed out after ${timeoutMs}ms for ${bucketPath}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function processImage(entry, item) {
  if (!item.image?.sourceUrl) {
    throw new Error(`${entry.slug} ${item.kind} is missing sourceUrl`);
  }
  if (!item.image?.bucketPath) {
    throw new Error(`${entry.slug} ${item.kind} is missing bucketPath`);
  }

  const nextBucketPath = toWebpBucketPath(item.image.bucketPath);
  const localBase = path.join(workDir, entry.slug, item.kind);
  const webpFile = `${localBase}.webp`;
  const sourceUrls = resolveSourceUrls(entry, item);

  if (sourceUrls.length === 0) {
    throw new Error(`${entry.slug} ${item.kind} has no usable source URLs`);
  }

  if (dryRun) {
    item.image.bucketPath = nextBucketPath;
    item.image.publicUrl = publicUrl(nextBucketPath);
    return;
  }

  const { sourceUrl: chosenSourceUrl, outputFile: sourceFile } = await downloadImage(sourceUrls, localBase);
  await convertToWebp(sourceFile, webpFile, localBase);
  await uploadWebp(nextBucketPath, webpFile);

  item.image.bucketPath = nextBucketPath;
  item.image.sourceUrl = chosenSourceUrl;
  item.image.publicUrl = publicUrl(nextBucketPath);
}

async function main() {
  if (!dryRun && !looksLikeJwt(normalizedServiceRoleKey)) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY does not look like a project JWT. Use the project service_role key, not a CLI token.');
  }

  const entries = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('Manifest must be a non-empty JSON array.');
  }

  let processed = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (entry.skip) {
      skipped += 1;
      continue;
    }

    for (const item of imagesForEntry(entry)) {
      await processImage(entry, item);
      processed += 1;
      console.log(`${dryRun ? '[dry-run] ' : ''}${entry.slug} ${item.kind} -> ${item.image.bucketPath}`);
    }
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2) + '\n');

  console.log(`Done. ${dryRun ? 'Prepared' : 'Migrated'} ${processed} images. Skipped ${skipped} entries.`);
  console.log(`Manifest written to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
