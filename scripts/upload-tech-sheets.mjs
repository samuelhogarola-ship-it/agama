/**
 * Download PDFs from sourceUrl (Webflow CDN) and upload to Supabase Storage.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/upload-tech-sheets.mjs
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/upload-tech-sheets.mjs --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET       = 'product-tech-sheets';
const MANIFEST     = path.join(__dirname, '../data/tech-sheets-manifest.json');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entries  = manifest.filter(e => e.sourceUrl && !e.skip);

console.log(`📋  ${entries.length} PDFs to upload${dryRun ? ' (dry-run)' : ''}\n`);

let ok = 0, fail = 0, skip = 0;

for (const entry of entries) {
  const { slug, bucketPath, sourceUrl } = entry;

  try {
    // Download from Webflow CDN
    const dlRes = await fetch(sourceUrl);
    if (!dlRes.ok) {
      console.error(`  ✗ ${slug}: download failed (${dlRes.status})`);
      fail++;
      continue;
    }

    const buffer = await dlRes.arrayBuffer();

    if (dryRun) {
      console.log(`  ✓ ${slug}: ${(buffer.byteLength / 1024).toFixed(0)} KB (would upload to ${bucketPath})`);
      ok++;
      continue;
    }

    // Upload to Supabase Storage
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${bucketPath}`;
    const upRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/pdf',
        'x-upsert': 'true',
      },
      body: buffer,
    });

    if (!upRes.ok) {
      const err = await upRes.text();
      console.error(`  ✗ ${slug}: upload failed (${upRes.status}) ${err}`);
      fail++;
      continue;
    }

    console.log(`  ✓ ${slug}`);
    ok++;

  } catch (e) {
    console.error(`  ✗ ${slug}: ${e.message}`);
    fail++;
  }
}

console.log(`\n✅  Done: ${ok} uploaded, ${fail} failed, ${skip} skipped`);
if (fail > 0) process.exit(1);
