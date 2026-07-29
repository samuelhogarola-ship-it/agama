import { test, expect } from '@playwright/test';

test('landing principal carga con hero y navegacion visible', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/AGAMA — Pigmentos, Masterbatch y Aditivos/i);
  await expect(page.getByRole('heading', { name: /Pigmentos, Masterbatch y Aditivos/i })).toBeVisible();
  await expect(page.getByRole('navigation').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Encuentra tu tienda/i })).toBeVisible();
});

test('landing principal carga video ligero del hero en movil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const videoRequests = [];
  page.on('response', (response) => {
    if (response.url().includes('/assets/video/')) {
      videoRequests.push(response.url());
    }
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(750);

  await expect(page.locator('source[src="assets/video/aaa-540p.mp4"]')).toHaveCount(0);
  await expect(page.locator('source[src="assets/video/aaa-mobile-hero.m4v"]')).toHaveCount(1);
  await expect(page.locator('source[src="assets/video/aaa-540p-optimized.webm"]')).toHaveCount(1);
  await expect(page.locator('.video-bg-hero[data-home-hero="adaptive-video"] video')).not.toHaveCSS('display', 'none');
  expect(videoRequests).toEqual([expect.stringContaining('/assets/video/aaa-mobile-hero.m4v')]);
});

test('blog principal carga con el archivo legacy reconstruido', async ({ page }) => {
  await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Blog AGAMA \| Sólo la mejor información para ti/i);
  await expect(page.getByRole('link', { name: /en qué momento dejamos de ser estudiantes/i }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Registrarse/i })).toBeVisible();
});

test('blog EN usa la misma imagen social que su version ES', async ({ page }) => {
  await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
  const spanishImage = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(spanishImage).toBeTruthy();

  await page.goto('/blog/index.en.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', spanishImage || '');
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', spanishImage || '');
});

test('blog legado carga con posts reconstruidos', async ({ page }) => {
  await page.goto('/blog-agama/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Blog AGAMA \| Sólo la mejor información para ti/i);
  await expect(page.getByText(/Boletín AGAMA/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /en qué momento dejamos de ser estudiantes/i }).first()).toBeVisible();
});

test('landing masterbatch carga con canonical propio y CTAs comerciales', async ({ page }) => {
  await page.goto('/masterbatch/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Masterbatch en México para plástico \| Cotiza con AGAMA/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.agama.com.mx/masterbatch/');
  await expect(page.getByRole('heading', { level: 1, name: /^Masterbatch en México$/i })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('link', { name: /Solicitar cotización/i }).first()).toHaveAttribute('href', /wa\.me\/525573515156/);
  await expect(page.getByRole('link', { name: /Ver masterbatch disponibles/i }).first()).toHaveAttribute('href', '/productos/masterbatch/');
  await expect(page.locator('body')).toContainText(/masterbatch negro, blanco o de color/i);
  await expect(page.locator('body')).toContainText(/Qué revisamos antes de recomendar un masterbatch/i);
  await expect(page.getByRole('heading', { name: /Principales tipos de masterbatch/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Preguntas frecuentes sobre masterbatch/i })).toBeVisible();
  const jsonLdTexts = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
    nodes.map((node) => node.textContent || '').join('\n')
  );
  expect(jsonLdTexts).toMatch(/FAQPage/);
});

test('landings pigmentos y aditivos cargan con canonical propio y CTAs correctos', async ({ page }) => {
  const pages = [
    {
      path: '/pigmentos/',
      title: /Pigmentos para plástico en México \| AGAMA/i,
      canonical: 'https://www.agama.com.mx/pigmentos/',
      h1: /Pigmentos para plástico en México/i,
      catalog: '/productos/pigmentos/',
      text: /pigmentos para plástico en México/i,
    },
    {
      path: '/aditivos/',
      title: /Aditivos para plástico en México \| AGAMA/i,
      canonical: 'https://www.agama.com.mx/aditivos/',
      h1: /Aditivos para plástico en México/i,
      catalog: '/productos/aditivos/',
      text: /proceso, estabilidad y desempeño/i,
      images: [/Aditivos AGAMA/i, /Aditivos para plástico en México/i, /Asesoría técnica/i],
    },
  ];

  for (const item of pages) {
    await page.goto(item.path, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(item.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', item.canonical);
    await expect(page.getByRole('heading', { level: 1, name: item.h1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator(`a[href="${item.catalog}"]`).first()).toBeVisible();
    await expect(page.locator('a[href="/filiales/online/"]').first()).toBeVisible();
    await expect(page.locator('body')).toContainText(item.text);
    if (item.images) {
      for (const imageAlt of item.images) {
        await expect(page.getByRole('img', { name: imageAlt }).first()).toBeVisible();
      }
      const jsonLdTexts = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
        nodes.map((node) => node.textContent || '').join('\n')
      );
      expect(jsonLdTexts).toMatch(/ImageGallery/);
      expect(jsonLdTexts).toMatch(/ImageObject/);
    }
    if (item.path === '/pigmentos/') {
      await expect(page.locator('img[alt*="Pigmentos AGAMA"]').first()).toBeVisible();
      await expect(page.locator('img[alt*="Pigmento opaco"]').first()).toBeVisible();
      await expect(page.locator('img[alt*="Igualación de color"]').first()).toBeVisible();
      const jsonLdTexts = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
        nodes.map((node) => node.textContent || '').join('\n')
      );
      expect(jsonLdTexts).toMatch(/ImageGallery/);
      expect(jsonLdTexts).toMatch(/ImageObject/);
    }
  }
});

test('productos y categorias conectan landings, catalogo y AGAMA Online sin enlazar /online directo', async ({ page }) => {
  await page.goto('/productos/', { waitUntil: 'domcontentloaded' });
  for (const href of ['/pigmentos/', '/masterbatch/', '/aditivos/', '/productos/pigmentos/', '/productos/masterbatch/', '/productos/aditivos/']) {
    await expect(page.locator(`.products-category-actions a[href="${href}"]`)).toBeVisible();
  }

  for (const item of [
    { path: '/productos/pigmentos/', landing: '../../pigmentos/' },
    { path: '/productos/masterbatch/', landing: '../../masterbatch/' },
    { path: '/productos/aditivos/', landing: '../../aditivos/' },
  ]) {
    await page.goto(item.path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.catalog-guidance')).toBeVisible();
    await expect(page.locator(`.catalog-guidance a[href="${item.landing}"]`)).toBeVisible();
    await expect(page.locator('.catalog-guidance a[href="../../filiales/online/"]')).toBeVisible();
    await expect(page.locator('.catalog-guidance a[href^="https://wa.me/"]')).toBeVisible();
    const directOnlineLinks = await page.locator('a[href="/online/"], a[href="../../online/"], a[href="../online/"]').count();
    expect(directOnlineLinks).toBe(0);
  }
});

test('faqs carga y expone el contenido de preguntas frecuentes', async ({ page }) => {
  await page.goto('/faqs/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Preguntas frecuentes AGAMA \| Pigmentos, masterbatch y aditivos/i);
  await expect(page.getByRole('heading', { name: /Dudas comunes antes de pedir con AGAMA/i })).toBeVisible();
  await expect(page.locator('a[href="/masterbatch/"]').filter({ hasText: /masterbatch para plástico en México/i })).toHaveCount(1);
});

test('filiales ES vuelven a home, enlazan a productos reales y exponen switch EN', async ({ page }) => {
  const samples = [
    '/filiales/chalco/',
    '/filiales/queretaro/',
    '/filiales/zaragoza/',
  ];

  for (const path of samples) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: 'EN' }).first()).toBeVisible();

    const logo = page.locator('.global-brand-logo').first();
    await expect(logo).toHaveAttribute('href', '/');

    const pigmentLink = page.locator('a[href="/productos/pigmentos/"]');
    await expect.poll(async () => pigmentLink.count()).toBeGreaterThan(0);
  }
});

test('filiales EN cargan sin 404, vuelven a home EN y conservan switch ES', async ({ page }) => {
  const samples = [
    '/filiales/chalco/index.en.html',
    '/filiales/queretaro/index.en.html',
    '/filiales/zaragoza/index.en.html',
  ];

  for (const path of samples) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
    await expect(page.getByRole('link', { name: 'ES' }).first()).toBeVisible();

    const logo = page.locator('.global-brand-logo').first();
    await expect(logo).toHaveAttribute('href', '/index.en.html');

    const pigmentLink = page.locator('a[href*="pigmentos"]');
    await expect.poll(async () => pigmentLink.count()).toBeGreaterThan(0);
  }
});

test('filiales fisicas comparten el resumen de sucursal en ES y EN', async ({ page }) => {
  test.setTimeout(60000);

  const slugs = [
    'chalco',
    'cuautitlan',
    'ecatepec',
    'ermita',
    'guadalajara',
    'leon',
    'merced',
    'monterrey',
    'pantitlan',
    'puebla',
    'queretaro',
    'san-luis-potosi',
    'texcoco',
    'tlahuac',
    'zaragoza',
  ];

  for (const slug of slugs) {
    for (const filename of ['index.html', 'index.en.html']) {
      await page.goto(`/filiales/${slug}/${filename}`, { waitUntil: 'domcontentloaded' });

      const summary = page.locator('.branch-info-section');
      await expect(summary).toHaveCount(1);
      await expect(summary.locator('.branch-info-block')).toHaveCount(4);
      await expect(summary.locator('a[href*="google.com/maps"]')).toHaveCount(1);
    }
  }

  await page.goto('/filiales/online/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.branch-info-section')).toHaveCount(0);
});

test('los resumenes visibles de filiales muestran sucursal y cuentas en ES y EN', async ({ page }) => {
  test.setTimeout(60000);

  const physicalSlugs = [
    'chalco',
    'cuautitlan',
    'ecatepec',
    'ermita',
    'guadalajara',
    'leon',
    'merced',
    'monterrey',
    'pantitlan',
    'puebla',
    'queretaro',
    'san-luis-potosi',
    'texcoco',
    'tlahuac',
    'toluca',
    'zaragoza',
  ];

  for (const slug of physicalSlugs) {
    for (const locale of [
      {
        filename: 'index.html',
        branch: 'Sucursal',
        account: 'Cuenta',
        interbank: 'Cuenta Interbancaria',
      },
      {
        filename: 'index.en.html',
        branch: 'Branch',
        account: 'Account',
        interbank: 'Interbank account',
      },
    ]) {
      await page.goto(`/filiales/${slug}/${locale.filename}`, { waitUntil: 'domcontentloaded' });

      const summary = page.locator(
        slug === 'toluca' ? '.toluca-branch-section' : '.branch-info-section',
      );
      await expect(summary).toHaveCount(1);

      for (const field of [
        { label: locale.branch, minimumDigits: 0 },
        { label: locale.account, minimumDigits: 5 },
        { label: locale.interbank, minimumDigits: 10 },
      ]) {
        const row = summary.locator('.detail-item').filter({
          has: page.getByText(field.label, { exact: true }),
        });
        await expect(row).toHaveCount(1);

        const value = row.locator('.detail-item-value');
        await expect(value).toBeVisible();

        // Return only the count so sensitive banking values never reach test logs.
        const visibleValue = await value.evaluate((element) => ({
          digitCount: (element.textContent?.match(/\d/g) || []).length,
          hasText: Boolean(element.textContent?.trim()),
        }));
        expect(visibleValue.hasText).toBe(true);
        if (field.minimumDigits > 0) {
          expect(visibleValue.digitCount).toBeGreaterThanOrEqual(field.minimumDigits);
        }
      }

      // Each banking field must live only in the visible summary. A second
      // occurrence would mean the obsolete lower banking section returned.
      await expect(page.getByText(locale.account, { exact: true })).toHaveCount(1);
      await expect(page.getByText(locale.interbank, { exact: true })).toHaveCount(1);

      if (slug === 'toluca') {
        await expect(summary).toContainText('ANGEL PALMA AGAMA');
        await expect(summary).toContainText('PAA-810709');
        await expect(summary).toContainText('7004');
        await expect(summary).toContainText('2749-484');
        await expect(summary).toContainText('002-180-700-427-494-844');
      }
    }
  }

  // AGAMA Online has banking details but intentionally does not use the
  // physical-branch summary component.
  for (const locale of [
    { filename: 'index.html', account: 'Cuenta', interbank: 'Cuenta Interbancaria' },
    { filename: 'index.en.html', account: 'Account', interbank: 'Interbank account' },
  ]) {
    await page.goto(`/filiales/online/${locale.filename}`, { waitUntil: 'domcontentloaded' });
    for (const field of [
      { label: locale.account, minimumDigits: 5 },
      { label: locale.interbank, minimumDigits: 10 },
    ]) {
      const row = page.locator('.detail-item').filter({
        has: page.getByText(field.label, { exact: true }),
      });
      await expect(row).toHaveCount(1);
      await expect(row.locator('.detail-item-value')).toBeVisible();
      const digitCount = await row.locator('.detail-item-value').evaluate((element) => (
        element.textContent?.match(/\d/g) || []
      ).length);
      expect(digitCount).toBeGreaterThanOrEqual(field.minimumDigits);
    }
  }
});

test('filiales preservan las confirmaciones de Cuautitlan y Toluca', async ({ page }) => {
  const cuautitlanAddress = 'Carr. Tlalnepantla - Cuautitlan 19, Loma Bonita, 54759 Cuautitlán Izcalli, Méx., México';
  const cuautitlanMap = 'https://www.google.com/maps/place/Agama+Cuautitlán+-+Edomex/@19.6499966,-99.1865208,17z/data=!3m1!4b1!4m6!3m5!1s0x85d1f5fe6813a7d1:0x2db681e1b7855826!8m2!3d19.6499916!4d-99.1839459!16s%2Fg%2F11fjx8hv7k?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D';
  const tolucaMap = 'https://www.google.es/maps/place/Agama+-+Toluca/@19.2717097,-99.5553984,17z/data=!3m1!4b1!4m6!3m5!1s0x85cd8b77e2c5c48b:0x602bc44a6806cc77!8m2!3d19.2717047!4d-99.5528235!16s%2Fg%2F11nqbjx7l6?entry=ttu&g_ep=EgoyMDI2MDcxOS4wIKXMDSoASAFQAw%3D%3D';

  for (const filename of ['index.html', 'index.en.html']) {
    await page.goto(`/filiales/cuautitlan/${filename}`, { waitUntil: 'domcontentloaded' });
    const summary = page.locator('.branch-info-section');
    await expect(summary.getByText(cuautitlanAddress, { exact: true })).toHaveCount(1);
    await expect(summary.locator('.branch-info-inline-link')).toHaveAttribute('href', cuautitlanMap);

    const mapLinks = page.locator('.branch-hero-meta-item.is-link, [data-map-directions] .contact-data-link, .branch-info-inline-link');
    for (let index = 0; index < await mapLinks.count(); index += 1) {
      await expect(mapLinks.nth(index)).toHaveAttribute('href', cuautitlanMap);
    }

    const html = await page.content();
    expect(html).toContain('"streetAddress": "Carr. Tlalnepantla - Cuautitlan 19, Loma Bonita"');
    expect(html).not.toContain('Carretera Tlalnepantla Cuautitlán 19');
  }

  for (const path of ['/filiales/index.html', '/filiales/index.en.html']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.filial-card-address').filter({ hasText: cuautitlanAddress })).toHaveCount(1);
  }

  for (const filename of ['index.html', 'index.en.html']) {
    await page.goto(`/filiales/toluca/${filename}`, { waitUntil: 'domcontentloaded' });
    const summary = page.locator('.toluca-branch-section');
    await expect(summary.locator('a[href="https://wa.me/5215523103494"]')).toHaveText('+52 1 55 2310 3494');
    await expect(summary.locator('a[href="tel:+527229468099"]')).toHaveText('+52 722 946 8099');

    const whatsappLinks = page.locator('a[href*="wa.me/"]');
    for (let index = 0; index < await whatsappLinks.count(); index += 1) {
      await expect(whatsappLinks.nth(index)).toHaveAttribute('href', /^https:\/\/wa\.me\/5215523103494(?:\?|$)/);
    }

    const mapLinks = page.locator('.topbar-secondary, .branch-hero-meta-item.is-link, .toluca-inline-link');
    await expect(mapLinks).toHaveCount(3);
    for (let index = 0; index < await mapLinks.count(); index += 1) {
      await expect(mapLinks.nth(index)).toHaveAttribute('href', tolucaMap);
    }

    const html = await page.content();
    expect(html).not.toContain('527724997514');
    expect(html).not.toContain('+52 772 499 7514');
    if (filename === 'index.html') expect(html).toContain(`"hasMap": "${tolucaMap}"`);
  }
});

test('hub de filiales ofrece enlace directo a Maps sin entrar a la ficha', async ({ page }) => {
  const cuautitlanMap =
    'https://www.google.com/maps/place/Agama+Cuautitlán+-+Edomex/@19.6499966,-99.1865208,17z/data=!3m1!4b1!4m6!3m5!1s0x85d1f5fe6813a7d1:0x2db681e1b7855826!8m2!3d19.6499916!4d-99.1839459!16s%2Fg%2F11fjx8hv7k?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D';
  const tolucaMap =
    'https://www.google.es/maps/place/Agama+-+Toluca/@19.2717097,-99.5553984,17z/data=!3m1!4b1!4m6!3m5!1s0x85cd8b77e2c5c48b:0x602bc44a6806cc77!8m2!3d19.2717047!4d-99.5528235!16s%2Fg%2F11nqbjx7l6?entry=ttu&g_ep=EgoyMDI2MDcxOS4wIKXMDSoASAFQAw%3D%3D';

  for (const path of ['/filiales/index.html', '/filiales/index.en.html']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });

    const cuautitlanCard = page.locator('.filial-card').filter({ hasText: 'Agama Cuautitlán' });
    await expect(cuautitlanCard).toHaveCount(1);
    await expect(cuautitlanCard.locator('a[href="/filiales/cuautitlan/"]')).toHaveCount(1);
    await expect(cuautitlanCard.locator('.filial-card-map-link')).toBeVisible();
    await expect(cuautitlanCard.locator('.filial-card-map-link')).toHaveAttribute('href', cuautitlanMap);

    const tolucaCard = page.locator('.filial-card').filter({ hasText: 'Agama Toluca' });
    await expect(tolucaCard).toHaveCount(1);
    await expect(tolucaCard.locator('.filial-card-map-link')).toBeVisible();
    await expect(tolucaCard.locator('.filial-card-map-link')).toHaveAttribute('href', tolucaMap);

    const onlineCard = page.locator('.filial-card').filter({ hasText: 'Agama Online' });
    await expect(onlineCard.locator('.filial-card-map-link')).toHaveCount(0);
  }
});

test('filiales ES mantienen rutas canónicas de Google Maps y hasMap alineado', async ({ page }) => {
  const branches = [
    {
      path: '/filiales/cuautitlan/',
      mapsUrl:
        'https://www.google.com/maps/place/Agama+Cuautitlán+-+Edomex/@19.6499966,-99.1865208,17z/data=!3m1!4b1!4m6!3m5!1s0x85d1f5fe6813a7d1:0x2db681e1b7855826!8m2!3d19.6499916!4d-99.1839459!16s%2Fg%2F11fjx8hv7k?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D',
    },
    {
      path: '/filiales/ecatepec/',
      mapsUrl:
        'https://www.google.com/maps/place/Agama+Ecatepec+-+Edomex/@19.5164537,-99.0924265,17z/data=!3m1!4b1!4m6!3m5!1s0x85d1fa11b3b1931d:0x29e980c1984b64a5!8m2!3d19.5164487!4d-99.0875556!16s%2Fg%2F11dxl549rx?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D',
    },
    {
      path: '/filiales/guadalajara/',
      mapsUrl:
        'https://www.google.com/maps/place/Agama+-+Guadalajara/@20.6574359,-103.3815661,17z/data=!3m2!4b1!5s0x8428ade0d5060b15:0xab0634b0def2074!4m6!3m5!1s0x8428ade6d01e1c23:0xfeb7e8029662fd33!8m2!3d20.6574309!4d-103.3789912!16s%2Fg%2F11c44vfknp?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D',
    },
  ];

  for (const branch of branches) {
    await page.goto(branch.path, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.branch-hero-meta-item.is-link')).toHaveAttribute('href', branch.mapsUrl);
    await expect(page.locator('[data-map-directions] .contact-data-link')).toHaveAttribute('href', branch.mapsUrl);
    await expect(page.locator('.branch-info-inline-link')).toHaveAttribute('href', branch.mapsUrl);

    const jsonLdHasMap = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(jsonLdHasMap ?? '').toContain(`"hasMap": "${branch.mapsUrl}"`);
  }
});

test('productos EN cargan la calculadora y conservan switch ES', async ({ page }) => {
  await page.goto('/productos/pigmentos/index.en.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.getByRole('link', { name: 'ES' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Quote calculator/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Send quote via WhatsApp/i })).toBeVisible();
});

test('entrada legacy conserva slug antiguo y contenido', async ({ page }) => {
  await page.goto('/entrada-de-blog/004-como-formulamos-los-masterbatch-de-linea/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/¿Cómo formulamos los master de línea\? \| AGAMA Blog/i);
  await expect(page.getByRole('heading', { name: /¿Cómo formulamos los master de línea\?/i })).toBeVisible();
  await expect(page.getByText(/Masterbatch de línea/i).first()).toBeVisible();
});

test('post Meximold usa imagen con marca, texto tecnico y CTA legible', async ({ page }) => {
  await page.goto('/entrada-de-blog/agama-en-meximold-2026/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/AGAMA en Meximold 2026: visítanos en el stand 750/i);
  await expect(page.locator('.post-cover')).toHaveAttribute('src', /agama-en-meximold-2026-agama-evento\.webp/);
  await expect(page.getByRole('img', { name: /AGAMA en Meximold 2026 stand 750/i })).toBeVisible();
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /agama-en-meximold-2026-agama-evento\.webp/);
  await expect(page.locator('body')).toContainText(/manufactura de moldes/i);
  await expect(page.locator('body')).toContainText(/herramentales/i);
  await expect(page.locator('body')).toContainText(/moldeo por inyección/i);
  await expect(page.locator('body')).toContainText(/empresario, comprador técnico, ingeniero de proceso/i);
  await expect(page.locator('body')).toContainText(/desmoldeo, protección UV/i);
  await expect(page.locator('.cta-box h2')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.getByRole('link', { name: /Ver página de Meximold/i })).toBeVisible();
});

test('honeypot del formulario bloquea envios sospechosos', async ({ page }) => {
  await page.goto('/contacto/', { waitUntil: 'domcontentloaded' });
  await page.locator('#cf-website').evaluate((el) => {
    el.value = 'https://spam.example';
  });
  await page.locator('#cf-nombre').fill('Bot');
  await page.locator('#cf-email').fill('bot@example.com');
  await page.locator('#cf-mensaje').fill('spam');
  await page.getByRole('button', { name: /enviar mensaje/i }).click();
  await page.waitForTimeout(300);
  await expect(page.locator('#form-ok')).toBeHidden();
  await expect(page.locator('#form-fail')).toBeHidden();
});

test('contacto muestra intro y hero responsive en movil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ['/contacto/', '/contacto/index.en.html']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-contact-intro]')).toBeVisible();
    await expect(page.locator('.contact-intro-card')).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/contact-intro-complete/, { timeout: 3000 });
    await expect(page.locator('[data-contact-intro]')).toHaveCount(0);

    const hero = page.locator('.contact-hero');
    await expect(hero).toBeVisible();
    const heading = page.locator('.contact-hero h1');
    await expect(heading).toBeVisible();
    await expect(page.locator('.contact-hero p')).toBeVisible();

    const heroBox = await hero.boundingBox();
    expect(heroBox?.height ?? 0).toBeGreaterThan(680);
    const headingBox = await heading.boundingBox();
    expect(headingBox?.x ?? 0).toBeGreaterThanOrEqual(0);
    expect(headingBox?.width ?? 0).toBeGreaterThan(150);
    expect((headingBox?.y ?? 0) + (headingBox?.height ?? 0)).toBeLessThan(820);
    await expect(page.locator('.contact-form-box')).toBeVisible();
  }
});

test('eventos carga con hero, agenda y CTA principal visibles', async ({ page }) => {
  await page.goto('/eventos/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Eventos — AGAMA Pigmentos & Masterbatch/i);
  await expect(page.getByRole('heading', { name: /Exposiciones donde AGAMA se ve en vivo\./i })).toBeVisible();
  await expect(page.locator('.events-hero-poster img')).toHaveAttribute('src', /eventos-hero\.jpeg/);
  await expect(page.getByRole('link', { name: /Ver agenda 2026/i })).toBeVisible();
  await expect(page.getByText(/Exposiciones/i).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Próximos eventos donde estaremos/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /MEXIMOLD/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /PLASTIMAGEN/i })).toBeVisible();
  await expect(page.locator('body')).toContainText(/Stand #750/i);
  await expect(page.locator('a[href*="meximold"]').first()).toBeVisible();
  await expect(page.locator('a[href*="plastimagen"]').first()).toBeVisible();

  await page.goto('/eventos/index.en.html', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Events — AGAMA Pigments & Masterbatch/i);
  await expect(page.getByRole('heading', { name: /Trade shows where AGAMA can be seen in person\./i })).toBeVisible();
  await expect(page.locator('.events-hero-poster img')).toHaveAttribute('src', /eventos-hero\.jpeg/);
  await expect(page.getByRole('link', { name: /View 2026 agenda/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Upcoming events where we will exhibit/i })).toBeVisible();
  await expect(page.locator('body')).toContainText(/Stand #750/i);
  await expect(page.locator('body')).toContainText(/Stand #558/i);
  await expect(page.locator('body')).not.toContainText(/Trade shows, exhibitions and events where AGAMA is present/i);
});

test('landing Meximold usa hero propio, schema e indexacion de imagen', async ({ page }) => {
  await page.goto('/eventos/meximold-queretaro/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/AGAMA en Meximold 2026 Querétaro \| Stand 750/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.agama.com.mx/eventos/meximold-queretaro/');
  await expect(page.getByRole('heading', { level: 1, name: /AGAMA en Meximold 2026 Querétaro/i })).toBeVisible();
  await expect(page.getByRole('img', { name: /AGAMA estará en Meximold 2026 Querétaro stand 750/i })).toBeVisible();
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /agama-meximold-2026-stand-750\.webp/);
  await expect(page.locator('body')).toContainText(/manufactura de moldes/i);
  await expect(page.locator('body')).toContainText(/moldeo por inyección/i);
  await expect(page.locator('body')).toContainText(/transformación de plásticos/i);
  await expect(page.locator('body')).toContainText(/stand 750/i);
  const jsonLdTexts = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
    nodes.map((node) => node.textContent || '').join('\n')
  );
  expect(jsonLdTexts).toMatch(/Event/);
  expect(jsonLdTexts).toMatch(/2026-10-14T11:00:00-06:00/);
  expect(jsonLdTexts).toMatch(/agama-meximold-2026-stand-750\.webp/);
  expect(jsonLdTexts).toMatch(/ImageObject/);
});

test('landing Plastimagen usa hero propio, schema e indexacion de imagen', async ({ page }) => {
  await page.goto('/eventos/plastimagen-cdmx/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/AGAMA en Plastimagen 2026 CDMX \| Stand 558/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.agama.com.mx/eventos/plastimagen-cdmx/');
  await expect(page.getByRole('heading', { level: 1, name: /AGAMA en Plastimagen 2026 CDMX/i })).toBeVisible();
  await expect(page.getByRole('img', { name: /AGAMA en Plastimagen 2026 CDMX stand 558/i })).toBeVisible();
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /agama-plastimagen-2026-stand-558\.webp/);
  await expect(page.locator('body')).toContainText(/compradores, ingeniería, calidad y producción/i);
  await expect(page.locator('body')).toContainText(/Llega con un objetivo claro/i);
  await expect(page.locator('body')).toContainText(/Solicitar catálogo/i);
  await expect(page.locator('body')).toContainText(/fabricación/i);
  await expect(page.locator('body')).toContainText(/Centro Banamex/i);
  await expect(page.locator('body')).toContainText(/stand 558/i);
  await expect(page.locator('body')).not.toContainText(/Esta landing/i);
  await expect(page.locator('body')).not.toContainText(/Qué tipo de lead/i);
  const jsonLdTexts = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
    nodes.map((node) => node.textContent || '').join('\n')
  );
  expect(jsonLdTexts).toMatch(/Event/);
  expect(jsonLdTexts).toMatch(/2026-11-10T12:00:00-06:00/);
  expect(jsonLdTexts).toMatch(/agama-plastimagen-2026-stand-558\.webp/);
  expect(jsonLdTexts).toMatch(/pigmento\.jpg#plastimagen-image/);
  expect(jsonLdTexts).toMatch(/master-clean\.jpg#plastimagen-image/);
  expect(jsonLdTexts).toMatch(/aditivos\.jpg#plastimagen-image/);
  expect(jsonLdTexts).toMatch(/ImageObject/);
});

test('eventos endurece enlaces externos y evita widgets de terceros en la landing', async ({ page }) => {
  await page.goto('/eventos/', { waitUntil: 'domcontentloaded' });

  const externalBlankLinks = page.locator('a[target="_blank"]');
  const linkCount = await externalBlankLinks.count();
  expect(linkCount).toBeGreaterThan(0);

  for (let i = 0; i < linkCount; i += 1) {
    const rel = await externalBlankLinks.nth(i).getAttribute('rel');
    expect(rel ?? '').toContain('noopener');
    expect(rel ?? '').toContain('noreferrer');
  }

  await expect(page.locator('script[src*="chatbase.co"]')).toHaveCount(0);
  await expect(page.locator('.mesenger-hldr')).toBeHidden();
});

test('AGAMA Online prioriza cotizacion y precarga productos destacados', async ({ page }) => {
  await page.goto('/filiales/online/', { waitUntil: 'domcontentloaded' });

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /Compra pigmentos, masterbatch y aditivos para plástico/i,
    })
  ).toBeVisible();
  await expect(page.locator('[data-quick-quote]')).toBeVisible();
  await expect(page.locator('.sales-product')).toHaveCount(6);

  await page.locator('[data-quote-product="AD-304 Protector UV"]').click();

  await expect(page).toHaveURL(/#cotizar$/);
  await expect(page.locator('[data-quick-quote] [name="product"]')).toHaveValue(
    'AD-304 Protector UV'
  );
  await expect(
    page.locator('[data-quick-quote] [name="family"][value="Aditivos"]')
  ).toBeChecked();
  await expect(page.locator('[data-quote-status]')).toContainText(
    /Producto añadido a la cotización/i
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.sales-mobile-cta')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    )
  ).toBe(true);
});

test('newsletter del blog guarda en Supabase y dispara notificacion', async ({ page }) => {
  let insertPayload = null;
  let notifyPayload = null;

  await page.route('**/rest/v1/newsletter_signups', async (route) => {
    insertPayload = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: '[]',
    });
  });

  await page.route('**/functions/v1/notify-contact', async (route) => {
    notifyPayload = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-newsletter-form]').evaluate((form) => {
    form.dataset.startedAt = String(Date.now() - 3000);
  });
  await page.locator('[data-newsletter-form] input[type="email"]').fill('newsletter@example.com');
  await page.getByRole('button', { name: /registrarse/i }).click();

  await expect(page.locator('#newsletter-ok')).toBeVisible();
  await expect.poll(() => insertPayload).not.toBeNull();
  await expect.poll(() => notifyPayload).not.toBeNull();
  expect(insertPayload.email).toBe('newsletter@example.com');
  expect(notifyPayload.table).toBe('newsletter_signups');
  expect(notifyPayload.record.email).toBe('newsletter@example.com');
});
