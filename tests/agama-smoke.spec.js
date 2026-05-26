const { test, expect } = require('@playwright/test');

test('landing principal carga con popup y navegacion visible', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Nueva Apertura Toluca/i);
  await expect(page.locator('#agamaPopupToluca')).toContainText(/Toluca/i);
  await expect(page.getByRole('navigation').first()).toBeVisible();
});

test('cerrar popup deja visibles los CTAs principales', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /continuar/i }).click();
  await expect(page.locator('#agamaPopupToluca')).toBeHidden();
  await expect(page.getByRole('link', { name: /solicitar información/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /whatsapp/i }).first()).toBeVisible();
});
