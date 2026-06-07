import { spawnSync } from 'child_process';

const DESIGN_ONLY_BYPASS = process.env.ALLOW_NON_DESIGN_CHANGES === '1';
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const ALLOWED_PATH_PREFIXES = [
  'assets/css/',
  'assets/img/',
];

function git(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || '').trim() || `git ${args.join(' ')} failed`);
  }

  return result.stdout.trim();
}

function getStagedFiles() {
  const output = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR']);
  if (!output) return [];
  return output.split('\n').map((file) => file.trim()).filter(Boolean);
}

function isAllowed(filePath) {
  return ALLOWED_PATH_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function main() {
  if (DESIGN_ONLY_BYPASS) {
    console.log('== design guard ==');
    console.log('Bypass enabled via ALLOW_NON_DESIGN_CHANGES=1.');
    return;
  }

  const stagedFiles = getStagedFiles();
  const blocked = stagedFiles.filter((file) => !isAllowed(file));

  console.log('== design guard ==');

  if (stagedFiles.length === 0) {
    console.log('No staged files found. Nothing to check.');
    return;
  }

  if (blocked.length === 0) {
    console.log(`Allowed staged files: ${stagedFiles.length}`);
    console.log(`Protected surface locked to CSS/assets only.`);
    return;
  }

  console.error('Blocked staged changes outside the design surface:');
  for (const file of blocked) {
    console.error(`- ${file}`);
  }
  console.error('');
  console.error('Only design files are allowed by default:');
  console.error('- `assets/css/**`');
  console.error('- `assets/img/**`');
  console.error('');
  console.error('If you really need to touch protected behavior, rerun with:');
  console.error(`- ${npmCmd} run precommit:check`); // keep help text aligned with local workflow
  console.error('- ALLOW_NON_DESIGN_CHANGES=1');
  process.exit(1);
}

main();
