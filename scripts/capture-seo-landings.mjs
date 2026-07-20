import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.AGAMA_PREVIEW_URL ?? "http://127.0.0.1:3460";
const outputDirectory = path.resolve("test-results", "seo-landings");
const routes = ["masterbatch", "pigmentos", "aditivos"];
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 375, height: 812 },
];
const failures = [];

fs.mkdirSync(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });

  for (const route of routes) {
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const response = await page.goto(`${baseUrl}/${route}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    if (response?.status() !== 200) failures.push(`/${route}/ devolvió ${response?.status() ?? "sin respuesta"}`);
    if (!(await page.locator("h1").isVisible())) failures.push(`H1 no visible en /${route}/ (${viewport.name})`);
    if (await page.locator("vite-error-overlay, nextjs-portal, #webpack-dev-server-client-overlay").count()) {
      failures.push(`Overlay de error visible en /${route}/ (${viewport.name})`);
    }

    const horizontalOverflow = await page.evaluate(() => (
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    ));
    if (horizontalOverflow) failures.push(`Overflow horizontal en /${route}/ (${viewport.name})`);
    if (pageErrors.length) failures.push(`Error JS en /${route}/ (${viewport.name}): ${pageErrors.join(" | ")}`);

    await page.screenshot({
      path: path.join(outputDirectory, `${route}-${viewport.name}.png`),
      fullPage: true,
    });
    await page.close();
  }

  await context.close();
}

const navigationContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const navigationPage = await navigationContext.newPage();
await navigationPage.goto(`${baseUrl}/masterbatch/`, { waitUntil: "domcontentloaded" });
await navigationPage.locator('.seo-hero a[href="/productos/masterbatch/"]').click();
await navigationPage.waitForURL("**/productos/masterbatch/");
if (!navigationPage.url().endsWith("/productos/masterbatch/")) failures.push("El CTA de masterbatch no llega al catálogo");

await navigationPage.goto(`${baseUrl}/masterbatch/`, { waitUntil: "domcontentloaded" });
await navigationPage.locator('.seo-hero a[href="/filiales/online/"]').click();
await navigationPage.waitForURL("**/filiales/online/");
if (!navigationPage.url().endsWith("/filiales/online/")) failures.push("El CTA comercial no llega a /filiales/online/");

await navigationContext.close();
await browser.close();

if (failures.length) {
  console.error("Verificación visual fallida:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Verificación visual OK: ${routes.length * viewports.length} capturas en ${outputDirectory}`);
  console.log("Navegación verificada: /masterbatch/ → catálogo y /filiales/online/");
}
