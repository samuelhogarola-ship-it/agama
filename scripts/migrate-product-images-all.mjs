/**
 * Safe orchestration for the real product image migration.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run product-images:migrate-all
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run product-images:migrate-all -- --yes
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync, spawnSync } from 'child_process';
import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const args = process.argv.slice(2);
const manifestPath = 'data/product-images-manifest.json';
const dryRunManifestPath = path.join(os.tmpdir(), 'agama-product-images-manifest-dry-run.json');
const yes = args.includes('--yes');

function section(title) {
  console.log(`\n== ${title} ==`);
}

function fail(message) {
  console.error(`\nERROR: ${message}`);
  process.exit(1);
}

function assertEnv(name) {
  if (!process.env[name]) {
    fail(`${name} is required.`);
  }
}

function commandExists(command) {
  try {
    execFileSync('which', [command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function runStep(title, commandArgs, envOverrides = {}) {
  section(title);
  console.log(`$ npm ${commandArgs.join(' ')}`);

  const result = spawnSync(npmCmd, commandArgs, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...envOverrides,
    },
  });

  if (result.error) {
    fail(`${title} failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`${title} failed with exit code ${result.status}.`);
  }
}

async function confirmRealMigration() {
  if (yes) {
    console.log('\n--yes passed. Continuing with real upload and database update.');
    return;
  }

  const rl = createInterface({ input, output });
  const answer = await rl.question('\nType MIGRATE to upload WebP images and update product URLs: ');
  rl.close();

  if (answer.trim() !== 'MIGRATE') {
    fail('Migration cancelled.');
  }
}

async function main() {
  section('Validate environment');
  assertEnv('SUPABASE_URL');
  assertEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!commandExists('cwebp')) {
    fail('cwebp must be installed and available in PATH.');
  }

  if (!fs.existsSync(manifestPath)) {
    fail(`Manifest file not found: ${manifestPath}`);
  }

  console.log('SUPABASE_URL present.');
  console.log('SUPABASE_SERVICE_ROLE_KEY present.');
  console.log('cwebp available.');
  console.log(`Manifest found: ${manifestPath}`);
  if (!process.env.SUPABASE_ANON_KEY) {
    console.log('SUPABASE_ANON_KEY missing. Build step will reuse SUPABASE_SERVICE_ROLE_KEY for local fetch.');
  }

  runStep('Dry run WebP migration', [
    'run',
    'product-images:migrate-webp',
    '--',
    '--manifest',
    manifestPath,
    '--out',
    dryRunManifestPath,
    '--dry-run',
  ]);

  await confirmRealMigration();

  runStep('Upload converted WebP images', [
    'run',
    'product-images:migrate-webp',
    '--',
    '--manifest',
    manifestPath,
  ]);

  runStep('Update product image URLs', [
    'run',
    'product-images:update',
    '--',
    '--manifest',
    manifestPath,
  ]);

  runStep('Build static catalogue', ['run', 'build'], {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  section('Done');
  console.log('Product images migrated, product URLs updated, and catalogue rebuilt.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
