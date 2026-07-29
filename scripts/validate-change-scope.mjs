import {
  ensureFileExists,
  fail,
  getCurrentBranch,
  hasRealChangelogEntry,
  isCriticalPath,
  parseMarkdownBulletList,
  parseMarkdownSections,
  parseNameStatusOutput,
  readRepoFile,
  runGit,
  normalizeText,
} from './guardrail-helpers.mjs';

const auditMode = process.argv.includes('--audit');
const currentBranch = getCurrentBranch();

if (!currentBranch) {
  fail('Detached HEAD is not allowed when validating change scope.');
}

if (currentBranch === 'main') {
  fail('Direct work on main is outside the allowed scope.');
}

ensureFileExists('docs/change-scope.md');
const scopeMarkdown = readRepoFile('docs/change-scope.md');
const sections = parseMarkdownSections(scopeMarkdown);

const baselineList = parseMarkdownBulletList(sections.get('baseline') || '');
const allowedFiles = new Set(parseMarkdownBulletList(sections.get('archivos permitidos') || ''));
const allowedDirs = parseMarkdownBulletList(sections.get('carpetas permitidas') || '');
const forbiddenEntries = parseMarkdownBulletList(sections.get('cambios prohibidos') || '');

if (baselineList.length !== 1) {
  fail('docs/change-scope.md must declare exactly one baseline.');
}

const baseline = baselineList[0];
const baselineRef = runGit(['rev-parse', '--verify', `${baseline}^{commit}`], { allowFailure: true });
if (!baselineRef) {
  fail(`Baseline declared in docs/change-scope.md does not exist: ${baseline}`);
}

const diffOutput = auditMode
  ? runGit(['diff', '--name-status', `${baseline}...HEAD`], { allowFailure: true }) || ''
  : runGit(['diff', '--cached', '--name-status'], { allowFailure: true }) || '';

const changes = parseNameStatusOutput(diffOutput);

if (changes.length === 0) {
  console.log(`Change scope OK: no ${auditMode ? 'branch-level' : 'staged'} changes to validate.`);
  process.exit(0);
}

const sensitiveLockHardeningFiles = new Set([
  '.github/CODEOWNERS',
  '.github/workflows/filiales-sensitive-data-lock.yml',
  '.husky/pre-push',
  'data/filiales-sensitive-data.lock.json',
  'docs/change-scope.md',
  'docs/filiales-sensitive-data-policy.md',
  'docs/worktree-control.json',
  'package.json',
  'scripts/filiales-sensitive-data-core.mjs',
  'scripts/precommit-check.mjs',
  'scripts/validate-change-scope.mjs',
  'scripts/validate-changelog-required.mjs',
  'scripts/validate-filiales-sensitive-lock.mjs',
]);

const changedPaths = changes.map((change) => normalizeText(change.path));
const isSensitiveLockHardeningOnly = changedPaths.includes('data/filiales-sensitive-data.lock.json')
  && changedPaths.every((filePath) => sensitiveLockHardeningFiles.has(filePath));

const deletions = changes.filter((entry) => entry.status === 'D').map((entry) => entry.path);
if (deletions.length > 0) {
  console.error(`ALARM: file deletions detected:\n- ${deletions.join('\n- ')}`);
}

const isAllowedByDir = (filePath) => allowedDirs.some((dir) => filePath.startsWith(dir));
const scopeErrors = [];

for (const change of changes) {
  const filePath = normalizeText(change.path);
  const explicitlyAllowed = allowedFiles.has(filePath);
  const directoryAllowed = isAllowedByDir(filePath);

  if (isCriticalPath(filePath) && !explicitlyAllowed) {
    scopeErrors.push(`${change.status} ${filePath} touches a critical path and is not declared explicitly in docs/change-scope.md.`);
    continue;
  }

  if (!explicitlyAllowed && !directoryAllowed) {
    scopeErrors.push(`${change.status} ${filePath} is outside the declared scope.`);
  }
}

if (
  changes.some((change) => change.path === 'docs/change-scope.md')
  && !isSensitiveLockHardeningOnly
  && !hasRealChangelogEntry()
) {
  scopeErrors.push('docs/change-scope.md changed but CHANGELOG.md does not contain a real new entry.');
}

if (forbiddenEntries.some((entry) => normalizeText(entry).includes('main')) && currentBranch === 'main') {
  scopeErrors.push('Current branch is main, which is explicitly forbidden by docs/change-scope.md.');
}

if (scopeErrors.length > 0) {
  fail(scopeErrors.join('\n'));
}

console.log(`Change scope OK against ${auditMode ? `${baseline}...HEAD` : 'staged changes'}.`);
