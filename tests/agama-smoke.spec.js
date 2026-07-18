import { test, expect } from '@playwright/test';

test('landing principal carga con hero y navegacion visible', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/AGAMA — Pigmentos, Masterbatch y Aditivos/i);
  await expect(page.getByRole('heading', { name: /Pigmentos, Masterbatch y Aditivos/i })).toBeVisible();
  await expect(page.getByRole('navigation').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Encuentra tu tienda/i })).toBeVisible();
});

test('blog principal carga con el archivo legacy reconstruido', async ({ page }) => {
  await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Blog AGAMA \| Sólo la mejor información para ti/i);
  await expect(page.getByRole('link', { name: /en qué momento dejamos de ser estudiantes/i }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Registrarse/i })).toBeVisible();
});

test('blog legado carga con posts reconstruidos', async ({ page }) => {
  await page.goto('/blog-agama/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Blog AGAMA \| Sólo la mejor información para ti/i);
  await expect(page.getByText(/Boletín AGAMA/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /en qué momento dejamos de ser estudiantes/i }).first()).toBeVisible();
});

test('faqs carga y expone el contenido de preguntas frecuentes', async ({ page }) => {
  await page.goto('/faqs/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Preguntas frecuentes — AGAMA/i);
  await expect(page.getByRole('heading', { name: /Dudas comunes antes de pedir con AGAMA/i })).toBeVisible();
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

test('filiales preservan las confirmaciones de Cuautitlan y Toluca', async ({ page }) => {
  const cuautitlanAddress = 'Carr. Tlalnepantla - Cuautitlan 19, Loma Bonita, 54759 Cuautitlán Izcalli, Méx., México';
  const cuautitlanMap = 'https://www.google.com/maps/search/?api=1&query=Carr.%20Tlalnepantla%20-%20Cuautitlan%2019%2C%20Loma%20Bonita%2C%2054759%20Cuautitl%C3%A1n%20Izcalli%2C%20M%C3%A9x.%2C%20M%C3%A9xico';

  for (const filename of ['index.html', 'index.en.html']) {
    await page.goto(`/filiales/cuautitlan/${filename}`, { waitUntil: 'domcontentloaded' });
    const summary = page.locator('.branch-info-section');
    await expect(summary.getByText(cuautitlanAddress, { exact: true })).toHaveCount(1);
    await expect(summary.locator('a[href*="google.com/maps"]')).toHaveAttribute('href', cuautitlanMap);

    const mapLinks = page.locator('a[href*="google.com/maps/search"]');
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

    const html = await page.content();
    expect(html).not.toContain('527724997514');
    expect(html).not.toContain('+52 772 499 7514');
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

test('eventos carga con hero, agenda y CTA principal visibles', async ({ page }) => {
  await page.goto('/eventos/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Eventos — AGAMA Pigmentos & Masterbatch/i);
  await expect(page.getByRole('heading', { name: /Exposiciones donde AGAMA se ve en vivo\./i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Ver agenda 2026/i })).toBeVisible();
  await expect(page.getByText(/Exposiciones/i).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Próximos eventos donde estaremos/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /MEXIMOLD/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /PLASTIMAGEN/i })).toBeVisible();
  await expect(page.locator('a[href*="meximold"]').first()).toBeVisible();
  await expect(page.locator('a[href*="plastimagen"]').first()).toBeVisible();
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
