import { fail, getCurrentBranch, hasRealChangelogEntry, runGit } from './guardrail-helpers.mjs';

const currentBranch = getCurrentBranch();

if (!currentBranch) {
  fail('Detached HEAD is not allowed while validating changelog requirements.');
}

const staged = (runGit(['diff', '--cached', '--name-only'], { allowFailure: true }) || '')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const requiresChangelog = staged.some((filePath) =>
  /^filiales\/.*\/index(\.en)?\.html$/.test(filePath)
  || filePath === 'filiales/index.html'
  || filePath === 'filiales/index.en.html'
  || filePath === 'docs/filiales-data-lock-plan.md'
  || filePath === 'docs/change-scope.md'
  || filePath === 'docs/worktree-control.json'
  || filePath === 'CLAUDE.md'
  || filePath.startsWith('.husky/')
  || filePath.startsWith('scripts/validate-')
  || filePath === 'scripts/guardrail-helpers.mjs'
);

if (!requiresChangelog) {
  console.log('Changelog requirement OK: no guarded files changed.');
  process.exit(0);
}

if (!staged.includes('CHANGELOG.md')) {
  fail('CHANGELOG.md must be staged when plan, scope, filiales, hooks, guardrails, or CLAUDE.md change.');
}

if (!hasRealChangelogEntry()) {
  fail('CHANGELOG.md is staged but does not contain a real new entry.');
}

console.log('Changelog requirement OK.');
