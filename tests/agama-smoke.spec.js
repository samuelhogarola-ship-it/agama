import { test, expect } from '@playwright/test';

test('landing principal carga con hero y navegacion visible', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/AGAMA — Pigmentos, Masterbatch y Aditivos/i);
  await expect(page.getByRole('heading', { name: /Pigmentos, Masterbatch y Aditivos/i })).toBeVisible();
  await expect(page.getByRole('navigation').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Habla con ventas/i })).toBeVisible();
});

test('blog principal carga con el archivo legacy reconstruido', async ({ page }) => {
  await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Blog AGAMA \| Sólo la mejor información para ti/i);
  await expect(page.getByRole('link', { name: /MB-115 Negro Kalo mejora su dispersión/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Registrarse/i })).toBeVisible();
});

test('blog legado carga con posts reconstruidos', async ({ page }) => {
  await page.goto('/blog-agama/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Blog AGAMA \| Sólo la mejor información para ti/i);
  await expect(page.getByText(/Boletín AGAMA/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /MB-115 Negro Kalo mejora su dispersión/i })).toBeVisible();
});

test('faqs carga y expone el contenido de preguntas frecuentes', async ({ page }) => {
  await page.goto('/faqs/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Preguntas frecuentes — AGAMA/i);
  await expect(page.getByRole('heading', { name: /Dudas comunes antes de pedir con AGAMA/i })).toBeVisible();
});

test('filiales ES redirigen a contacto', async ({ page }) => {
  const samples = ['/filiales/', '/filiales/chalco/', '/filiales/queretaro/'];

  for (const path of samples) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/contacto\/$/);
    await expect(page.getByRole('heading', { name: /^Contacto$/i })).toBeVisible();
  }
});

test('filiales EN redirigen a contacto EN', async ({ page }) => {
  const samples = [
    '/filiales/index.en.html',
    '/filiales/chalco/index.en.html',
    '/filiales/queretaro/index.en.html',
  ];

  for (const path of samples) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/contacto\/index\.en(\.html)?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
    await expect(page.getByRole('heading', { name: /^Contact$/i })).toBeVisible();
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
  await expect(page.getByRole('link', { name: /meximold\.com/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /plastimagen\.com\.mx/i })).toBeVisible();
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
