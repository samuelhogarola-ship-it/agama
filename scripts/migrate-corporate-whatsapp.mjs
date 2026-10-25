import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isProtectedCorporateWhatsappFile, isProtectedCorporateWhatsappHub, migrateCorporateWhatsappText } from './corporate-whatsapp-core.mjs';

// This migration operates only on tracked HTML; sources and protected metadata are never inputs.
const CACHE_VERSION = '20261025whatsapp';
const options = { root: fileURLToPath(new URL('../', import.meta.url)), mode: null, skipProtected: false };
try {
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (['--dry-run', '--write'].includes(arg)) {
      if (options.mode) throw new Error('Choose exactly one migration mode.');
      options.mode = arg;
    } else if (arg === '--skip-protected') options.skipProtected = true;
    else if (arg === '--root' && args[index + 1] && !args[index + 1].startsWith('--')) options.root = path.resolve(args[++index]);
    else throw new Error(`Unknown or incomplete argument: ${arg}`);
  }
  if (!options.mode || !options.skipProtected) throw new Error('Use --dry-run or --write with --skip-protected.');
  const listed = spawnSync('git', ['-C', options.root, 'ls-files', '-z', '--', '*.html'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (listed.status !== 0) throw new Error(`Cannot list tracked HTML: ${listed.stderr}`);
  let changedFiles = 0;
  let identityReplacements = 0;
  let cacheReplacements = 0;
  let protectedSkipped = 0;
  let protectedHubsSkipped = 0;
  // Prepare the full scope before performing writes.
  const edits = [];
  for (const file of listed.stdout.split('\0').filter(Boolean).sort()) {
    if (isProtectedCorporateWhatsappFile(file)) {
      console.log(`protected ${file} skipped`);
      protectedSkipped += 1;
      continue;
    }
    if (isProtectedCorporateWhatsappHub(file)) {
      console.log(`protected_hub ${file} skipped`);
      protectedHubsSkipped += 1;
      continue;
    }
    const absolute = path.join(options.root, file);
    if (!fs.existsSync(absolute) || !fs.lstatSync(absolute).isFile()) continue;
    const source = fs.readFileSync(absolute, 'utf8');
    const migrated = migrateCorporateWhatsappText(source);
    let caches = 0;
    const text = migrated.text.replace(/(assets\/(?:js\/global-ui\.js|css\/home-custom\.css))(?:\?v=([^\s"'<>#&]+))?(?=[\s"'<>#&]|$)/g, (match, prefix, version) => {
      if (version === CACHE_VERSION) return match;
      caches += 1;
      return prefix + '?v=' + CACHE_VERSION;
    });
    if (text === source) continue;
    edits.push({ absolute, text });
    changedFiles += 1;
    identityReplacements += migrated.replacements;
    cacheReplacements += caches;
    console.log(`${options.mode === '--write' ? 'write' : 'would_change'} ${file} corporate=${migrated.replacements} cache=${caches}`);
  }
  if (options.mode === '--write') for (const { absolute, text } of edits) fs.writeFileSync(absolute, text);
  console.log(`changed_files=${changedFiles}`);
  console.log(`corporate_replacements=${identityReplacements}`);
  console.log(`cache_replacements=${cacheReplacements}`);
  console.log(`protected_skipped=${protectedSkipped}`);
  console.log(`protected_hubs_skipped=${protectedHubsSkipped}`);
} catch (error) {
  console.error(`CORPORATE WHATSAPP MIGRATION: ${error.message}`);
  process.exitCode = 1;
}
