import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const huskyDir = path.join(repoRoot, '.husky');

if (!fs.existsSync(path.join(repoRoot, '.git'))) {
  console.log('Skipped git hook setup: repository metadata not available.');
  process.exit(0);
}

if (!fs.existsSync(huskyDir)) {
  console.log('Skipped git hook setup: .husky directory not found.');
  process.exit(0);
}

const result = spawnSync('git', ['config', 'core.hooksPath', '.husky'], {
  cwd: repoRoot,
  stdio: 'inherit',
});

if (result.error) {
  console.log(`Skipped git hook setup: ${result.error.message}`);
  process.exit(0);
}

if (result.status !== 0) {
  process.exit(result.status ?? 0);
}

console.log('Git hooks configured to use .husky/.');
