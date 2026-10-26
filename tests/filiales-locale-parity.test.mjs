import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const es = 'filiales/toluca/index.html';
const en = 'filiales/toluca/index.en.html';

function git(root, ...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

function validateFixture(t, { originalEs, changedEs, originalEn }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agama-locale-parity-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'filiales/toluca'), { recursive: true });
  for (const script of ['validate-filiales-locale-parity.mjs', 'guardrail-helpers.mjs']) {
    fs.copyFileSync(path.join(sourceRoot, 'scripts', script), path.join(root, 'scripts', script));
  }
  fs.writeFileSync(path.join(root, 'package.json'), '{"type":"module"}\n');
  fs.writeFileSync(path.join(root, es), originalEs);
  fs.writeFileSync(path.join(root, en), originalEn);
  git(root, 'init', '-q');
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'config', 'user.name', 'Parity Test');
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'fixture');
  fs.writeFileSync(path.join(root, es), changedEs);
  git(root, 'add', es);
  return spawnSync('node', ['scripts/validate-filiales-locale-parity.mjs'], { cwd: root, encoding: 'utf8' });
}

const oldScript = '<script src="../../assets/js/home.js?v=old" defer></script>\n';
const newScript = '<script src="../../assets/js/home.js?v=20261025whatsapp" defer></script>\n';
const noHomeScript = '<p>English branch page</p>\n';

test('allows a one-sided WhatsApp script cache key when the locale pair does not load it', (t) => {
  const result = validateFixture(t, { originalEs: oldScript, changedEs: newScript, originalEn: noHomeScript });
  assert.equal(result.status, 0, result.stderr);
});

test('rejects one-sided cache key and phone content changes', (t) => {
  const result = validateFixture(t, {
    originalEs: oldScript + '<p>+52 55 1111 1111</p>\n',
    changedEs: newScript + '<p>+52 55 2222 2222</p>\n',
    originalEn: noHomeScript,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /locale pair/);
});

test('rejects one-sided cache key when the locale pair loads the same script', (t) => {
  const result = validateFixture(t, { originalEs: oldScript, changedEs: newScript, originalEn: oldScript });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /locale pair/);
});

test('rejects a one-sided version change on another script', (t) => {
  const result = validateFixture(t, {
    originalEs: '<script src="../../assets/js/global-ui.js?v=old"></script>\n',
    changedEs: '<script src="../../assets/js/global-ui.js?v=new"></script>\n',
    originalEn: noHomeScript,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /locale pair/);
});

test('rejects one-sided addition of a WhatsApp script', (t) => {
  const result = validateFixture(t, { originalEs: noHomeScript, changedEs: noHomeScript + newScript, originalEn: noHomeScript });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /locale pair/);
});

test('rejects one-sided removal of a WhatsApp script', (t) => {
  const result = validateFixture(t, { originalEs: noHomeScript + oldScript, changedEs: noHomeScript, originalEn: noHomeScript });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /locale pair/);
});

test('rejects one-sided script path changes', (t) => {
  const result = validateFixture(t, {
    originalEs: oldScript,
    changedEs: '<script src="../../assets/js/products.js?v=20261025whatsapp" defer></script>\n',
    originalEn: noHomeScript,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /locale pair/);
});

test('rejects one-sided page copy changes alongside a cache key', (t) => {
  const result = validateFixture(t, {
    originalEs: '<p>Original copy</p>\n' + oldScript,
    changedEs: '<p>Changed copy</p>\n' + newScript,
    originalEn: noHomeScript,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /locale pair/);
});
