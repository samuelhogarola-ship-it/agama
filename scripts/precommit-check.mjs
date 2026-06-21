import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function loadDotEnvIfPresent() {
  const envPath = path.join(repoRoot, '.env');
  if (!fs.existsSync(envPath)) return;

  fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;

      const separatorIndex = trimmed.indexOf('=');
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
}

loadDotEnvIfPresent();

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function runStep(label, command, args, envOverrides = {}) {
  console.log(`\n== ${label} ==`);
  console.log(`$ ${command} ${args.join(' ')}`);

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...envOverrides,
    },
  });

  if (result.error) {
    console.error(`ERROR: ${label} failed: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`ERROR: ${label} failed with exit code ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}

runStep('Validate product image manifest', npmCmd, ['run', 'product-images:validate-manifest']);
runStep('Lint public site scripts', npmCmd, ['run', 'lint:root']);
runStep('Lint portal app', npmCmd, ['run', 'portal:lint']);
runStep('Run public smoke tests', npmCmd, ['run', 'test:public']);
runStep('Run portal smoke tests', npmCmd, ['run', 'test:portal'], {
  PORTAL_PRODUCTS_SOURCE: 'manifest',
});

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  runStep('Build static catalogue', npmCmd, ['run', 'build']);
} else {
  console.log('\n== Build static catalogue ==');
  console.log('Skipped: define SUPABASE_URL and SUPABASE_ANON_KEY to include build in pre-commit.');
}
