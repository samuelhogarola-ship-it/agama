import { fail, runGit } from './guardrail-helpers.mjs';

const staged = (runGit(['diff', '--cached', '--name-only'], { allowFailure: true }) || '')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const stagedSet = new Set(staged);
const errors = [];

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
  if (pair && !stagedSet.has(pair)) {
    errors.push(`${filePath} is staged without its locale pair ${pair}.`);
  }
}

if (errors.length > 0) {
  fail(errors.join('\n'));
}

console.log('Filiales locale parity OK.');
