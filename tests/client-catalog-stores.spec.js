import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Exercise committed real product cards when the external data service is offline.
  await page.route('**/rest/v1/products**', route => route.abort());
});

for (const english of [false, true]) {
  const suffix = english ? 'index.en.html' : '';
  test(`home category links open filtered catalogs (${suffix || 'ES'})`, async ({ page }) => {
    await page.goto('/' + suffix, { waitUntil: 'domcontentloaded' });
    const cards = page.locator(english ? '.products-grid' : '.seo-local-product-grid');
    await cards.getByRole('link', { name: english ? 'Crystal' : 'Cristal', exact: true }).click();
    await expect(page.locator('.catalog-filters button[aria-pressed="true"]')).toHaveText(english ? 'Crystal' : 'Cristal');
    await expect(page.locator('#products-count')).toHaveText('16');
    expect(await page.locator('.prod-badge').allTextContents()).toEqual(Array(16).fill(english ? 'Crystal' : 'Cristal'));
    await page.locator('#products-search').fill('no-product-matches-this');
    await expect(page.locator('#products-count')).toHaveText('0');
    await page.locator('#products-search').fill('');
    await expect(page.locator('#products-count')).toHaveText('16');
    await page.getByRole('button', { name: english ? 'Opaque' : 'Opacos', exact: true })
      .evaluate((button) => button.click());
    await expect(page.locator('#products-count')).toHaveText('48');
    await page.goBack();
    await expect(page.locator('#products-count')).toHaveText('16');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#products-count')).toHaveText('16');
  });

  test(`masterbatch keeps only approved categories (${suffix || 'ES'})`, async ({ page }) => {
    await page.goto(`/productos/masterbatch/${suffix}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.catalog-filters button')).toHaveText(english ? ['All', 'Opaque'] : ['Todos', 'Opacos']);
    await page
      .getByRole('button', { name: english ? 'Opaque' : 'Opacos', exact: true })
      .evaluate((button) => button.click());
    await page.locator('#products-search').fill('125');
    await expect(page.locator('#products-count')).toHaveText('1');
  });

  test(`branch cards keep Toluca first, Online last and usable links (${suffix || 'ES'})`, async ({ page }) => {
    await page.goto('/puntosdeventa/' + suffix, { waitUntil: 'domcontentloaded' });
    const cards = page.locator('.filial-card');
    await expect(cards).toHaveCount(17);
    await expect(cards.first().locator('.filial-card-name')).toHaveText('Agama Toluca');
    await expect(cards.last().locator('.filial-card-name')).toHaveText('Agama Online');
    await expect(cards.first()).not.toContainText(/17\.06|Apertura|Opening/);
    await expect(cards.first().getByRole('link', { name: english ? 'View branch' : 'Ver sucursal', exact: true })).toBeVisible();
    if (english) {
      const branchLinks = cards.getByRole('link', { name: 'View branch', exact: true });
      await expect(branchLinks).toHaveCount(17);
      for (const href of await branchLinks.evaluateAll(links => links.map(link => link.getAttribute('href')))) {
        expect(href).toMatch(/index\.en\.html$/);
      }
    }
    await expect(cards.first().locator('.filial-card-map-link')).toHaveAttribute('href', /google.*maps/);
    const order = await cards.evaluateAll(nodes => nodes.map(node => ({ name: node.querySelector('.filial-card-name').textContent, top: node.getBoundingClientRect().top })));
    expect(order.at(-1).top).toBeGreaterThanOrEqual(Math.max(...order.map(item => item.top)));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await cards.first().getByRole('link', { name: 'Agama Toluca', exact: true }).click();
    await expect(page).toHaveURL(new RegExp('/puntosdeventa/toluca/' + (english ? 'index.en.html' : '') + '$'));
    await expect(page.locator('h1')).toContainText('Toluca');
  });
}

test('reduced motion disables product and branch zoom', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const card = page.locator('.seo-local-product-grid .featured-product-card').first();
  await card.hover();
  await expect(card.locator('img')).toHaveCSS('transform', 'none');
  await page.goto('/puntosdeventa/');
  await page.locator('.filial-card').first().hover();
  await expect(page.locator('.filial-card').first()).toHaveCSS('transform', 'none');
});

test('descargas de imagen no reducen ni rompen la galeria de producto', async ({ page }) => {
  await page.goto('/productos/aditivos/ad-301-expanso-raywan/', { waitUntil: 'domcontentloaded' });

  const heroWrap = page.locator('.product-hero-wrap');
  const heroTrigger = heroWrap.locator('.product-gallery-trigger--hero');
  const [wrapBox, triggerBox] = await Promise.all([heroWrap.boundingBox(), heroTrigger.boundingBox()]);
  expect(triggerBox.width).toBeGreaterThanOrEqual(wrapBox.width * 0.95);
  await expect(heroWrap.locator(':scope > .product-image-download')).toBeVisible();

  const galleryItems = page.locator('.product-gallery-grid > .product-gallery-item');
  await expect(galleryItems).toHaveCount(1);
  await expect(galleryItems.first().locator('.product-gallery-thumb')).toHaveCount(1);
  await expect(galleryItems.first().locator('.product-image-download')).toHaveCount(1);
});


for (const english of [false, true]) {
  for (const [category, slug] of [
    ['pigmentos', 'bp-028-pig-magenta'],
    ['masterbatch', 'mb-101-mb-amarillo-huevo'],
    ['aditivos', 'ad-301-expanso-raywan'],
  ]) {
    test(`API conserva assets locales y fallback PDF ${category} ${english ? 'EN' : 'ES'}`, async ({ page }) => {
      const skippedSlugs = category === 'aditivos'
        ? ['ad-304-protector-uv', 'ad-313-perla-natural', 'ad-314-base-macro-batch', 'ad-315-phenil-o', 'ad-316-w-slip'] : [];
      const products = [slug, ...skippedSlugs].map((item) => ({
        slug: item, nombre: item.toUpperCase(), tipo: 'Opaco', descripcion: '', precio: 100,
        portada: `https://example.supabase.co/storage/v1/object/public/product-images/${item}.webp`,
        ficha_tecnica: `https://cdn.prod.website-files.com/${item}.pdf`,
      }));
      await page.route('**/rest/v1/products**', route => route.fulfill({ json: products }));
      await page.goto(`/productos/${category}/${english ? 'index.en.html' : ''}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.prod-card[data-detail-href]')).toHaveCount(products.length);
      const available = page.locator(`.prod-card[data-detail-href^="${slug}/"]`);
      await expect(available.locator('.prod-card-img')).toHaveAttribute('src', `/assets/product-media/images/${category}/${slug}/cover.webp`);
      await expect(available.locator('.prod-card-pdf')).toHaveAttribute('href', `/assets/product-media/tech-sheets/${category}/${slug}.pdf`);
      await expect(available.locator('.prod-card-pdf')).toHaveAttribute('download', '');
      for (const skipped of skippedSlugs) {
        await expect(page.locator(`.prod-card[data-detail-href^="${skipped}/"] .prod-card-pdf`)).toHaveAttribute('href', /^https:\/\/wa\.me\/525548604275/);
      }
      const media = await page.locator('.prod-card-img, .prod-card-pdf:not(.prod-card-pdf--fallback)').evaluateAll(nodes => nodes.map(node => node.getAttribute('src') || node.getAttribute('href')));
      expect(media.every(url => url.startsWith('/assets/product-media/'))).toBeTruthy();
    });
  }
}
