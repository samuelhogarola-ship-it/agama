import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build, buildIndexPage, buildProductPage, localizeStaticProductHtml } from '../build.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

test('inventario VPS contiene 270 imágenes y 130 fichas reales e íntegras', () => {
  const inventory = readJson('data/product-assets-vps-inventory.json');
  assert.deepEqual(inventory.counts, { images: 270, techSheets: 130, total: 400 });
  assert.equal(inventory.files.length, 400);
  for (const item of inventory.files) {
    const file = path.join(root, item.path);
    assert.equal(fs.existsSync(file), true, item.path);
    const buffer = fs.readFileSync(file);
    assert.equal(buffer.length, item.bytes, `${item.path}: size`);
    assert.equal(sha256(buffer), item.sha256, `${item.path}: sha256`);
    if (item.type === 'image') {
      assert.equal(buffer.subarray(0, 4).toString('ascii'), 'RIFF', `${item.path}: RIFF`);
      assert.equal(buffer.subarray(8, 12).toString('ascii'), 'WEBP', `${item.path}: WEBP`);
      assert.equal(item.mime, 'image/webp');
    } else {
      assert.equal(buffer.subarray(0, 5).toString('ascii'), '%PDF-', `${item.path}: PDF`);
      assert.equal(item.mime, 'application/pdf');
    }
  }
});

test('fase 1 contiene nueve archivos para las tres muestras verificadas', () => {
  const inventory = readJson('data/product-assets-vps-phase1-inventory.json');
  assert.deepEqual(inventory.counts, { images: 6, techSheets: 3, total: 9 });
  assert.deepEqual(new Set(inventory.selectedSlugs), new Set([
    'mb-101-mb-amarillo-huevo', 'bp-028-pig-magenta', 'ad-301-expanso-raywan',
  ]));
  for (const item of inventory.files) {
    const buffer = fs.readFileSync(path.join(root, item.path));
    assert.equal(buffer.length, item.bytes, item.path);
    assert.equal(sha256(buffer), item.sha256, item.path);
  }
});

test('fallback estático reemplaza URLs remotas y activa download para PDF', () => {
  const source = '<html lang="es-MX"><button class="product-gallery-trigger product-gallery-trigger--hero" data-gallery-open="https://ozexoekvshuhtkrleuze.supabase.co/storage/v1/object/public/product-images/aditivos/ad-301-expanso-raywan/cover.webp"><img src="https://ozexoekvshuhtkrleuze.supabase.co/storage/v1/object/public/product-images/aditivos/ad-301-expanso-raywan/cover.webp"></button><button class="product-gallery-thumb product-gallery-trigger" data-gallery-open="https://cdn.prod.website-files.com/example/FICHA.avif"><img src="https://cdn.prod.website-files.com/example/FICHA.avif"></button><a href="https://ozexoekvshuhtkrleuze.supabase.co/storage/v1/object/public/product-tech-sheets/aditivos/ad-301-expanso-raywan.pdf" target="_blank" rel="noopener noreferrer" class="product-pdf-btn">PDF</a></html>';
  const localized = localizeStaticProductHtml(source);
  assert.doesNotMatch(localized, /supabase/i);
  assert.match(localized, /src="\/assets\/product-media\/images\/aditivos\/ad-301-expanso-raywan\/cover\.webp"/);
  assert.match(localized, /href="\/assets\/product-media\/tech-sheets\/aditivos\/ad-301-expanso-raywan\.pdf" download class="product-pdf-btn"/);
  assert.match(localized, /href="\/assets\/product-media\/images\/aditivos\/ad-301-expanso-raywan\/cover\.webp" download class="product-image-download">Descargar imagen/);
  assert.doesNotMatch(localized, /website-files|FICHA\.avif/);
});

test('build elimina referencias remotas de producto en todas las páginas publicadas', async () => {
  await build();
  const htmlFiles = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (entry.name.endsWith('.html')) htmlFiles.push(target);
    }
  };
  visit(path.join(root, 'dist'));
  const remoteProductAsset = /ozexoekvshuhtkrleuze\.supabase\.co\/storage\/v1\/object\/public\/(?:product-images|product-tech-sheets)\//i;
  const offenders = htmlFiles
    .filter((file) => remoteProductAsset.test(fs.readFileSync(file, 'utf8')))
    .map((file) => path.relative(root, file));
  assert.deepEqual(offenders, []);
});

test('manifiestos publican únicamente rutas same-origin para recursos disponibles', () => {
  const images = readJson('data/product-images-manifest.json');
  const sheets = readJson('data/tech-sheets-manifest.json');
  const imageItems = images.flatMap((entry) => [entry.cover, ...(entry.gallery || [])]);
  assert.equal(imageItems.length, 270);
  for (const item of imageItems) {
    assert.match(item.publicUrl, /^\/assets\/product-media\/images\//);
    assert.doesNotMatch(item.publicUrl, /supabase|website-files/i);
  }
  const availableSheets = sheets.filter((entry) => !entry.skip);
  assert.equal(availableSheets.length, 130);
  for (const item of availableSheets) {
    assert.match(item.publicUrl, /^\/assets\/product-media\/tech-sheets\//);
    assert.doesNotMatch(item.publicUrl, /supabase|website-files/i);
  }
  for (const slug of ['ad-304-protector-uv', 'ad-313-perla-natural', 'ad-314-base-macro-batch', 'ad-315-phenil-o', 'ad-316-w-slip']) {
    assert.equal(sheets.find((entry) => entry.slug === slug)?.skip, true, `${slug}: WhatsApp fallback`);
  }
});

test('catálogo generado ES/EN usa recursos locales, download y fallback de WhatsApp', () => {
  const products = [
    {
      slug: 'ad-301-expanso-raywan', nombre: 'AD-301 EXPANSO RAYWAN', tipo_producto: 'aditivos',
      portada: 'https://remote.example/cover.jpg', galeria: 'https://remote.example/gallery.jpg',
      ficha_tecnica: 'https://remote.example/sheet.pdf', published: true, descripcion: 'Producto de prueba',
      informacion: '<p>Información</p>', tipo: 'Aditivo', acabado: '', color: '', precio: 232,
    },
    {
      slug: 'ad-304-protector-uv', nombre: 'AD-304 PROTECTOR UV', tipo_producto: 'aditivos',
      portada: 'https://remote.example/cover-304.jpg', galeria: '',
      ficha_tecnica: 'https://remote.example/sheet-304.pdf', published: true, descripcion: 'Producto omitido',
      informacion: '<p>Información</p>', tipo: 'Aditivo', acabado: '', color: '', precio: 1601,
    },
  ];
  for (const locale of ['es', 'en']) {
    const page = buildProductPage(products[0], 'aditivos', locale);
    assert.doesNotMatch(page, /supabase|website-files|remote\.example/i);
    assert.match(page, /href="\/assets\/product-media\/tech-sheets\/aditivos\/ad-301-expanso-raywan\.pdf" download/);
    assert.match(page, /href="\/assets\/product-media\/images\/aditivos\/ad-301-expanso-raywan\/cover\.webp" download/);
    const indexPage = buildIndexPage('aditivos', products, locale);
    assert.doesNotMatch(indexPage, /supabase|website-files|remote\.example/i);
    assert.match(indexPage, /href="\/assets\/product-media\/tech-sheets\/aditivos\/ad-301-expanso-raywan\.pdf" download/);
  }
  for (const locale of ['es', 'en']) {
    const page = buildProductPage(products[1], 'aditivos', locale);
    assert.doesNotMatch(page, /sheet-304\.pdf/);
    assert.match(page, /product-pdf-btn--fallback/);
    assert.match(page, /https:\/\/wa\.me\/525548604275/);
  }
});


test('AD-313 conserva solicitud por WhatsApp ES/EN sin inventar un PDF', () => {
  const slug = 'ad-313-perla-natural';
  const sheet = readJson('data/tech-sheets-manifest.json').find((item) => item.slug === slug);
  assert.equal(sheet.skip, true);
  assert.equal(sheet.publicUrl, undefined);
  assert.equal(fs.existsSync(path.join(root, 'assets/product-media/tech-sheets', sheet.bucketPath)), false);
  for (const locale of ['es', 'en']) {
    const product = { slug, nombre: 'AD-313 PERLA NATURAL', descripcion: '', informacion: '', ficha_tecnica: 'https://old.example/ad-313.pdf' };
    const html = buildProductPage(product, 'aditivos', locale);
    assert.match(html, /product-pdf-btn--fallback/);
    assert.match(html, /https:\/\/wa\.me\/525548604275/);
    assert.doesNotMatch(html, /ad-313[^"<>]*\.pdf/);
    const committed = fs.readFileSync(path.join(root, `productos/aditivos/${slug}/index${locale === 'en' ? '.en' : ''}.html`), 'utf8');
    assert.match(localizeStaticProductHtml(committed), /product-pdf-btn--fallback/);
  }
});

const localCatalogue = '<div id="products-grid"></div><h1>Masterbatch</h1><img src="/assets/product-media/images/masterbatch/mb-101-mb-amarillo-huevo/cover.webp"><a href="/assets/product-media/images/masterbatch/mb-101-mb-amarillo-huevo/cover.webp" download class="product-image-download">Download image</a><a href="/assets/product-media/tech-sheets/masterbatch/mb-101-mb-amarillo-huevo.pdf" download class="product-pdf-btn">PDF</a>';
const execFileAsync = promisify(execFile);

async function verifyDeployAgainst(t, catalogueHtml) {
  const server = createServer((request, response) => {
    if (request.url.startsWith('/productos/')) return response.end(catalogueHtml);
    const file = path.join(root, request.url.endsWith('/') ? `${request.url}index.html` : request.url);
    response.end(fs.readFileSync(file));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  try {
    const result = await execFileAsync(process.execPath, ['scripts/verify-deploy.mjs', '--url', `http://127.0.0.1:${server.address().port}`], { cwd: root });
    return { code: 0, ...result };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

test('verify:deploy acepta imágenes y descargas de producto same-origin', async (t) => {
  const result = await verifyDeployAgainst(t, localCatalogue);
  assert.equal(result.code, 0, result.stderr);
});

test('verify:deploy rechaza assets remotos aunque exista una imagen local', async (t) => {
  const result = await verifyDeployAgainst(t, `${localCatalogue}<img src="https://example.supabase.co/storage/v1/object/public/product-images/old.webp">`);
  assert.notEqual(result.code, 0, result.stdout);
});

test('verify:deploy rechaza PDF sin atributo download', async (t) => {
  const result = await verifyDeployAgainst(t, localCatalogue.replace('download class="product-pdf-btn"', 'class="product-pdf-btn"'));
  assert.notEqual(result.code, 0, result.stdout);
});
