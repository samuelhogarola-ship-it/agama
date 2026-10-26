import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fail, repoRoot, runGit } from './guardrail-helpers.mjs';

const staged = (runGit(['diff', '--cached', '--name-only'], { allowFailure: true }) || '')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const stagedSet = new Set(staged);
const errors = [];
const whatsappScript = /assets\/js\/(products|home|online-store)\.js(?:\?v=[A-Za-z0-9_-]+)?/g;

function gitFile(revision, filePath) {
  return execFileSync('git', ['show', `${revision}:${filePath}`], { cwd: repoRoot, encoding: 'utf8' });
}

function isUnpairedCacheOnlyChange(filePath, pair) {
  try {
    const before = gitFile('HEAD', filePath);
    const after = gitFile('', filePath);
    const pairedIndex = gitFile('', pair);
    const pairedWorktree = fs.readFileSync(path.join(repoRoot, pair), 'utf8');
    if (pairedIndex !== pairedWorktree || before === after) return false;

    const normalize = (source) => source.replace(whatsappScript, (_url, script) => `assets/js/${script}.js?v=<cache>`);
    if (normalize(before) !== normalize(after)) return false;

    const oldReferences = [...before.matchAll(whatsappScript)];
    const newReferences = [...after.matchAll(whatsappScript)];
    const changedScripts = new Set(oldReferences
      .filter((match, index) => match[0] !== newReferences[index][0])
      .map((match) => match[1]));
    if (changedScripts.size === 0) return false;

    return [...changedScripts].every((script) => !pairedIndex.includes(`assets/js/${script}.js`));
  } catch {
    return false;
  }
}

function expectedPair(filePath) {
  if (filePath.endsWith('/index.html')) {
    return filePath.replace(/\/index\.html$/, '/index.en.html');
  }

  if (filePath.endsWith('/index.en.html')) {
    return filePath.replace(/\/index\.en\.html$/, '/index.html');
  }

  if (filePath === 'filiales/index.html') return 'filiales/index.en.html';
  if (filePath === 'filiales/index.en.html') return 'filiales/index.html';
  return null;
}

for (const filePath of staged) {
  if (!/^filiales\/.+\/index(\.en)?\.html$/.test(filePath) && filePath !== 'filiales/index.html' && filePath !== 'filiales/index.en.html') {
    continue;
  }

  const pair = expectedPair(filePath);
  if (pair && !stagedSet.has(pair) && !isUnpairedCacheOnlyChange(filePath, pair)) {
    errors.push(`${filePath} is staged without its locale pair ${pair}.`);
  }
}

if (errors.length > 0) {
  fail(errors.join('\n'));
}

console.log('Filiales locale parity OK.');
