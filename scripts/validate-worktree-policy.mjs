import { getCurrentBranch, readRepoFile, runGit, fail, normalizeText } from './guardrail-helpers.mjs';

const currentBranch = getCurrentBranch();

if (!currentBranch) {
  fail('Detached HEAD is not allowed for this repository.');
}

if (currentBranch === 'main') {
  fail('Direct work on main is not allowed.');
}

const control = JSON.parse(readRepoFile('docs/worktree-control.json'));
const worktrees = runGit(['worktree', 'list']);
const openBranches = [];

for (const line of worktrees.split(/\r?\n/)) {
  const match = line.match(/\[(.+?)\]/);
  if (!match) continue;

  const branch = normalizeText(match[1]);
  if (!branch || branch === 'main') continue;
  openBranches.push(branch);
}

const parked = new Set((control.parked_branches || []).map((branch) => normalizeText(branch)));
const activeBranch = normalizeText(control.active_branch);

if (control.allow_detached !== false) {
  fail('docs/worktree-control.json must set allow_detached to false.');
}

if (parked.has(currentBranch)) {
  fail(`Current branch ${currentBranch} is parked and cannot be used for commits or pushes.`);
}

if (currentBranch !== activeBranch) {
  fail(`Current branch ${currentBranch} is not the configured active_branch (${activeBranch}).`);
}

const unregistered = openBranches.filter((branch) => branch !== activeBranch && !parked.has(branch));
if (unregistered.length > 0) {
  fail(`Found open branches not registered as active or parked: ${unregistered.join(', ')}`);
}

const activeOpenBranches = openBranches.filter((branch) => !parked.has(branch));

if (activeOpenBranches.length !== 1) {
  fail(`Expected exactly one active non-parked branch, found ${activeOpenBranches.length}: ${activeOpenBranches.join(', ')}`);
}

if (activeOpenBranches[0] !== activeBranch) {
  fail(`Configured active_branch (${activeBranch}) does not match the single active open branch (${activeOpenBranches[0]}).`);
}

console.log(`Worktree policy OK: active branch is ${activeBranch}.`);
