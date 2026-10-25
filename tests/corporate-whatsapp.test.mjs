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
  assert.equal(findLegacyCorporateMatches(root, { skipProtected: true }).length, 16);
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
  assert.match(report.stdout, /legacy_unprotected=0/);
  assert.match(run('--report', '--skip-protected').stdout, /protected_skipped=2/);
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

test('active non-protected generators use the new corporate WhatsApp', async (t) => {
  for (const file of [
    'assets/js/global-ui.js', 'assets/js/home.js', 'assets/js/online-store.js',
    'assets/js/products.js', 'build.js', 'scripts/shared-layout.mjs',
    'apps/configurador/src/components/configurator/configurator-page.tsx',
    'wordpress/wp-content/themes/agama-blog/footer.php',
  ]) {
    await t.test(file, () => {
      const source = fs.readFileSync(path.join(repoRoot, file), 'utf8');
      assert.equal(source.includes('525548604275'), true, `${file}: missing new destination`);
      assert.equal(source.includes('525573515156'), false, `${file}: retired destination remains`);
    });
  }
});

test('corporate WhatsApp is absent from telephone semantics and branch telephones remain', async (t) => {
  const structuredData = (file) => [...fs.readFileSync(path.join(repoRoot, file), 'utf8')
    .matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
  for (const file of ['index.html', 'index.en.html']) {
    await t.test(file, () => {
      const organization = structuredData(file).find((data) => data['@type'] === 'Organization');
      assert.equal(organization.contactPoint['@type'], 'ContactPoint');
      assert.equal(Object.hasOwn(organization.contactPoint, 'telephone'), false);
      assert.equal(organization.contactPoint.url, 'https://wa.me/525548604275');
      const source = fs.readFileSync(path.join(repoRoot, file), 'utf8');
      assert.doesNotMatch(source, /tel:\+?52[\s().-]*55[\s().-]*(?:4860[\s().-]*4275|7351[\s().-]*5156)/i);
    });
  }
  await t.test('physical branch JSON-LD', () => {
    for (const file of ['filiales/toluca/index.html', 'puntosdeventa/toluca/index.html']) {
      const branch = structuredData(file).find((data) => data['@type'] === 'LocalBusiness');
      assert.equal(branch.telephone, '+52-722-946-8099');
    }
  });
  await t.test('demo customer phone is unavailable', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'portal/src/lib/mock-store.ts'), 'utf8');
    assert.equal(source.match(/\bphone:\s*"([^"]*)"/)[1], 'No disponible');
    assert.doesNotMatch(source, /\+52 55 (?:4860 4275|7351 5156)/);
  });
});


test('static migration changes exact corporate identity without touching protected paths', (t) => {
  const root = fixture(t);
  assert.equal(spawnSync('git', ['init', '-q', root]).status, 0);
  const old = '<a href="https://wa.me/525573515156?text=Hola%20AGAMA%2C%20caf%C3%A9&app_absent=0#chat">+52 55 7351 5156</a>';
  const expected = '<a href="https://wa.me/525548604275?text=Hola%20AGAMA%2C%20caf%C3%A9&app_absent=0#chat">+52 55 4860 4275</a>';
  write(root, 'index.html', old + '<script src="assets/js/global-ui.js?v=previous"></script><script src="assets/js/global-ui.js"></script><link href="assets/css/home-custom.css?v=previous"><script src="assets/js/analytics.js?v=keep"></script>');
  for (const file of ['filiales/online/index.html', 'filiales/online/index.en.html']) write(root, file, old);
  const branch = '<a href="https://wa.me/527224997514?text=Hola%20AGAMA">+52 722 499 7514</a>';
  write(root, 'filiales/toluca/index.html', branch);
  write(root, 'filiales/index.html', old + '<script src="assets/js/global-ui.js?v=previous"></script>');
  write(root, 'filiales/index.en.html', old);
  write(root, 'assets/unrelated.js', old);
  assert.equal(spawnSync('git', ['-C', root, 'add', '.']).status, 0);
  write(root, 'untracked.html', old);
  const migration = path.join(repoRoot, 'scripts/migrate-corporate-whatsapp.mjs');
  const run = (...args) => spawnSync(process.execPath, [migration, '--root', root, ...args], { encoding: 'utf8' });
  const dryRun = run('--dry-run', '--skip-protected');
  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.match(dryRun.stdout, /protected_skipped=2/);
  assert.match(dryRun.stdout, /protected.*filiales\/online\/index.en.html/);
  assert.equal(fs.readFileSync(path.join(root, 'index.html'), 'utf8').startsWith(old), true);
  assert.equal(run('--write').status, 1, 'explicit protected skip required');
  const applied = run('--write', '--skip-protected');
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), expected + '<script src="assets/js/global-ui.js?v=20261025whatsapp"></script><script src="assets/js/global-ui.js?v=20261025whatsapp"></script><link href="assets/css/home-custom.css?v=20261025whatsapp"><script src="assets/js/analytics.js?v=keep"></script>');
  for (const file of ['filiales/online/index.html', 'filiales/online/index.en.html', 'assets/unrelated.js', 'untracked.html']) assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), old);
  assert.equal(fs.readFileSync(path.join(root, 'filiales/toluca/index.html'), 'utf8'), branch);
  assert.equal(fs.readFileSync(path.join(root, 'filiales/index.html'), 'utf8'), old + '<script src="assets/js/global-ui.js?v=previous"></script>');
  assert.equal(fs.readFileSync(path.join(root, 'filiales/index.en.html'), 'utf8'), old);
  assert.match(applied.stdout, /protected_hubs_skipped=2/);
  const rerun = run('--write', '--skip-protected');
  assert.equal(rerun.status, 0, rerun.stderr);
  assert.match(rerun.stdout, /changed_files=0/);
});

test('build output has no unprotected legacy corporate number', () => {
  const build = spawnSync('npm', ['run', 'build'], { cwd: repoRoot, encoding: 'utf8', timeout: 120000 });
  assert.equal(build.status, 0, build.stderr);
  assert.match(build.stdout, /Build complete/);
  assert.equal(fs.existsSync(path.join(repoRoot, 'dist/index.html')), true);
  const residue = findLegacyCorporateMatches(repoRoot, { includeDist: true, skipProtected: true }).filter(({ file }) => file.startsWith('dist/'));
  assert.deepEqual(residue, []);
  assert.deepEqual(collectBranchWhatsappSnapshot(path.join(repoRoot, 'dist')), JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/corporate-whatsapp-branch-baseline.json'), 'utf8')));
  for (const file of ['filiales/online/index.html', 'filiales/online/index.en.html']) assert.deepEqual(fs.readFileSync(path.join(repoRoot, 'dist', file)), fs.readFileSync(path.join(repoRoot, file)));
});

test('WhatsApp QR assets decode to the new destination', async (t) => {
  const { default: sharp } = await import('sharp');
  const { default: jsQR } = await import('jsqr');
  const decode = async (file) => {
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, 500);
    assert.equal(info.height, 500);
    assert.equal(jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data, 'https://wa.me/525548604275');
  };
  for (const extension of ['png', 'webp']) await decode(path.join(repoRoot, 'assets/img/qr-whatsapp.' + extension));
  const { generateQrAssets } = await import('../scripts/generate-whatsapp-assets.mjs');
  const output = fixture(t);
  await generateQrAssets('https://wa.me/525548604275', output);
  const first = fs.readFileSync(path.join(output, 'qr-whatsapp.png'));
  const firstWebp = fs.readFileSync(path.join(output, 'qr-whatsapp.webp'));
  await generateQrAssets('https://wa.me/525548604275', output);
  assert.deepEqual(fs.readFileSync(path.join(output, 'qr-whatsapp.png')), first);
  assert.deepEqual(fs.readFileSync(path.join(output, 'qr-whatsapp.webp')), firstWebp);
  for (const extension of ['png', 'webp']) await decode(path.join(output, 'qr-whatsapp.' + extension));
  const validated = spawnSync(process.execPath, [path.join(repoRoot, 'scripts/validate-whatsapp-assets.mjs'), '--qr'], { encoding: 'utf8' });
  assert.equal(validated.status, 0, validated.stderr);
  assert.match(validated.stdout, /qr_png=https:\/\/wa.me\/525548604275/);
  assert.match(validated.stdout, /qr_webp=https:\/\/wa.me\/525548604275/);
});


test('scanner protects only the exact immutable metadata files and reports their residue explicitly', (t) => {
  const root = fixture(t);
  branches(root);
  for (const file of ['data/filiales-sensitive-data.lock.json', 'docs/filiales-data-lock-plan.md', 'docs/current.md', 'data/current.json', 'filiales/current.html', 'filiales/index.html', 'filiales/index.en.html', 'filiales/online/index.html', 'filiales/online/index.en.html']) write(root, file, '525573515156');
  assert.deepEqual(findLegacyCorporateMatches(root, { skipProtected: true }).map(({ file }) => file), ['data/current.json', 'docs/current.md', 'filiales/current.html']);
  const run = (...args) => spawnSync(process.execPath, [cli, '--root', root, ...args], { encoding: 'utf8' });
  assert.equal(run('--write-branch-baseline').status, 0);
  const dirty = run('--assert-clean', '--skip-protected');
  assert.equal(dirty.status, 1);
  assert.match(dirty.stdout, /legacy_unprotected=3/);
  assert.match(dirty.stdout, /protected_metadata_matches=2/);
  assert.match(dirty.stdout, /protected_hub_matches=2/);
  assert.match(dirty.stdout, /protected_hubs_skipped=2/);
  assert.match(dirty.stdout, /protected_hub filiales\/index.html/);
  assert.match(dirty.stdout, /protected_metadata_skipped=2/);
  assert.match(dirty.stdout, /protected_metadata data\/filiales-sensitive-data.lock.json/);
  assert.match(dirty.stdout, /protected_metadata docs\/filiales-data-lock-plan.md/);
  fs.unlinkSync(path.join(root, 'docs/current.md'));
  fs.unlinkSync(path.join(root, 'data/current.json'));
  fs.unlinkSync(path.join(root, 'filiales/current.html'));
  assert.equal(run('--assert-clean').status, 1);
  const clean = run('--assert-clean', '--skip-protected');
  assert.equal(clean.status, 0, clean.stderr);
  assert.match(clean.stdout, /legacy_unprotected=0/);
});


test('Masterbatch image validation accepts the current public CSS revision', () => {
  const result = spawnSync(process.execPath, [path.join(repoRoot, 'scripts/validate-masterbatch-category-image.mjs')], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Masterbatch category image OK/);
});
