import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  migrateCorporateWhatsappText,
  findLegacyCorporateMatches,
  collectBranchWhatsappSnapshot,
} from '../scripts/corporate-whatsapp-core.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const cli = path.join(repoRoot, 'scripts/validate-corporate-whatsapp.mjs');
const slugs = ['chalco', 'cuautitlan', 'ecatepec', 'ermita', 'guadalajara', 'leon', 'merced', 'monterrey', 'pantitlan', 'puebla', 'queretaro', 'san-luis-potosi', 'texcoco', 'tlahuac', 'toluca', 'zaragoza'];

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'corporate-whatsapp-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function write(root, file, text) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), text);
}

function branches(root) {
  for (const family of ['puntosdeventa', 'filiales']) {
    for (const slug of slugs) {
      for (const locale of ['', '.en']) {
        write(root, `${family}/${slug}/index${locale}.html`, '<a href="https://wa.me/527224997514?text=Hola%20AGAMA">+52 722 499 7514</a>');
      }
    }
  }
}

test('migration matches only the exact corporate identity and preserves branch WhatsApp', () => {
  const source = 'https://wa.me/525573515156 +52 55 7351 5156 +52-55-7351-5156 +52 (55) 7351-5156 https://wa.me/527224997514 +52 722 499 7514 1525573515156 5255735151560';
  assert.deepEqual(migrateCorporateWhatsappText(source), {
    text: 'https://wa.me/525548604275 +52 55 4860 4275 +52-55-4860-4275 +52 (55) 4860-4275 https://wa.me/527224997514 +52 722 499 7514 1525573515156 5255735151560',
    replacements: 4,
  });
});

test('migration preserves encoded WhatsApp query parameters', () => {
  const source = 'https://wa.me/525573515156?text=Hola%20AGAMA%2C%20caf%C3%A9&app_absent=0#chat https://api.whatsapp.com/send?text=%2B%20%26&phone=525573515156&source=web&amp;lang=es';
  assert.deepEqual(migrateCorporateWhatsappText(source), {
    text: 'https://wa.me/525548604275?text=Hola%20AGAMA%2C%20caf%C3%A9&app_absent=0#chat https://api.whatsapp.com/send?text=%2B%20%26&phone=525548604275&source=web&amp;lang=es',
    replacements: 2,
  });
  assert.deepEqual(migrateCorporateWhatsappText('https://wa.me/525573515156?text=525573515156&ref=525573515156'), {
    text: 'https://wa.me/525548604275?text=525573515156&ref=525573515156', replacements: 1,
  });
  assert.deepEqual(migrateCorporateWhatsappText('https://wa.me/527224997514?text=Hola%20AGAMA'), {
    text: 'https://wa.me/527224997514?text=Hola%20AGAMA', replacements: 0,
  });
});

test('migration leaves unrelated and empty WhatsApp destinations byte-identical', () => {
  const source = 'https://wa.me/?text=525573515156 https://api.whatsapp.com/send?phone=527224997514&text=525573515156';
  assert.deepEqual(migrateCorporateWhatsappText(source), { text: source, replacements: 0 });
});

test('scanner finds exact identities in served files, generators, data and current fixtures', (t) => {
  const root = fixture(t);
  for (const file of ['index.html', 'assets/a.js', 'scripts/layout.mjs', 'portal/a.ts', 'apps/a.tsx', 'wordpress/a.php', 'data/current.json', 'tests/current.spec.js', 'docs/filiales-data-lock-plan.md']) {
    write(root, file, 'unrelated 527224997514\nhttps://wa.me/525573515156\n+52 55 7351 5156');
  }
  for (const file of ['docs/superpowers/plans/plan.md', 'docs/superpowers/specs/spec.md', '.superpowers/sdd/brief.md', 'node_modules/a.js', '.git/noise.html', 'scripts/corporate-whatsapp-core.mjs', 'scripts/validate-corporate-whatsapp.mjs', 'tests/corporate-whatsapp.test.mjs', 'dist/index.html']) {
    write(root, file, '525573515156');
  }
  write(root, 'filiales/online/index.html', '525573515156');
  write(root, 'filiales/online/index.en.html', '525573515156');
  const matches = findLegacyCorporateMatches(root);
  assert.equal(matches.length, 20);
  assert.deepEqual(matches.filter(({ file }) => file === 'index.html'), [
    { file: 'index.html', line: 2, value: '525573515156' },
    { file: 'index.html', line: 3, value: '+52 55 7351 5156' },
  ]);
  assert.equal(findLegacyCorporateMatches(root, { skipProtected: true }).length, 18);
  assert.equal(findLegacyCorporateMatches(root, { includeDist: true }).length, 21);
});

test('scanner honors git-ignored noise while including untracked operational files', (t) => {
  const root = fixture(t);
  assert.equal(spawnSync('git', ['init', '-q', root]).status, 0);
  write(root, '.gitignore', 'generated/\n');
  write(root, 'generated/noise.html', '525573515156');
  write(root, 'assets/untracked.js', '525573515156');
  assert.deepEqual(findLegacyCorporateMatches(root), [{ file: 'assets/untracked.js', line: 1, value: '525573515156' }]);
});

test('branch snapshot covers exactly 64 physical files and preserves raw links and displayed numbers', (t) => {
  const root = fixture(t);
  branches(root);
  write(root, 'filiales/online/index.html', 'https://wa.me/525573515156');
  const snapshot = collectBranchWhatsappSnapshot(root);
  assert.equal(Object.keys(snapshot).length, 64);
  assert.equal(Object.keys(snapshot).some((file) => file.includes('/online/')), false);
  assert.deepEqual(snapshot['puntosdeventa/toluca/index.html'], ['https://wa.me/527224997514?text=Hola%20AGAMA', '+52 722 499 7514']);
  fs.unlinkSync(path.join(root, 'filiales/toluca/index.en.html'));
  assert.throws(() => collectBranchWhatsappSnapshot(root), /filiales\/toluca\/index.en.html/);
});

test('CLI reports protected matches, asserts clean, and rejects byte changes to branch baseline', (t) => {
  const root = fixture(t);
  branches(root);
  write(root, 'filiales/online/index.html', '525573515156');
  write(root, 'filiales/online/index.en.html', '525573515156');
  const run = (...args) => spawnSync(process.execPath, [cli, '--root', root, ...args], { encoding: 'utf8' });
  assert.equal(run('--write-branch-baseline').status, 0);
  assert.equal(Object.keys(JSON.parse(fs.readFileSync(path.join(root, 'data/corporate-whatsapp-branch-baseline.json')))).length, 64);
  const report = run('--report');
  assert.equal(report.status, 0, report.stderr);
  assert.match(report.stdout, /legacy_matches=0/);
  assert.match(report.stdout, /protected_legacy_matches=2/);
  assert.match(report.stdout, /protected.*filiales\/online\/index.html/);
  assert.match(report.stdout, /branch_baseline=unchanged\n$/);
  assert.equal(run('--assert-clean').status, 1);
  assert.equal(run('--assert-clean', '--skip-protected').status, 0);
  write(root, 'index.html', '525573515156');
  assert.equal(run('--assert-clean', '--skip-protected').status, 1);
  write(root, 'index.html', '525548604275');
  write(root, 'puntosdeventa/toluca/index.html', '<a href="https://wa.me/527224997514?text=Hola%20AGAMA">+52 722 499-7514</a>');
  const changed = run('--assert-clean', '--skip-protected');
  assert.equal(changed.status, 1);
  assert.match(changed.stdout, /branch_baseline=changed/);
  assert.match(changed.stderr, /puntosdeventa\/toluca\/index.html/);
  assert.equal(run('--write-branch-baseline').status, 1, 'baseline cannot silently be overwritten');
});
