import { expect, test } from '@playwright/test';

test('portal home carga con branding oficial y hero comercial', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/AGAMA Commerce Portal/i);
  await expect(page.getByRole('img', { name: /AGAMA Colores/i }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /NOS MOVEMOS/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Comprar productos/i })).toBeVisible();
});

test('catalogo expone productos reales y acciones principales', async ({ page }) => {
  await page.goto('/catalogo', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Productos reales, listos para pedir/i })).toBeVisible();
  await expect(page.getByPlaceholder(/Buscar por nombre, codigo o aplicacion/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Borrador rapido/i }).first()).toBeVisible();
});

test('mensajes mantiene a Bonny solo dentro de la seccion', async ({ page }) => {
  await page.goto('/mensajes', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Mensajes/i })).toBeVisible();
  await expect(page.getByText(/Bonny Pellet/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /Abrir Bonny en panel seguro/i })).toBeVisible();
});

test('admin pedidos carga el panel operativo', async ({ page }) => {
  await page.goto('/admin/pedidos', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Pedidos y clientes/i })).toBeVisible();
  await expect(page.getByText(/Panel de administracion/i)).toBeVisible();
  await expect(page.getByLabel(/Estado/i).first()).toBeVisible();
});
