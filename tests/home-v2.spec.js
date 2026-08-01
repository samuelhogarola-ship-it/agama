import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const ROOT = process.cwd();

test("home-v2 ES y EN mantienen una base aislada y no indexable", async ({ page }) => {
  for (const preview of [
    { path: "/home-v2/", lang: "es-MX", switchHref: "/home-v2/index.en.html" },
    { path: "/home-v2/index.en.html", lang: "en-US", switchHref: "/home-v2/" },
  ]) {
    await page.goto(preview.path, { waitUntil: "domcontentloaded" });

    await expect(page.locator("html")).toHaveAttribute("lang", preview.lang);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow, noarchive",
    );
    await expect(page.locator('meta[name="googlebot"]')).toHaveAttribute(
      "content",
      "noindex, nofollow, noarchive",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('link[href*="home-custom.css"]')).toHaveCount(0);
    await expect(page.locator('script[src*="/assets/js/home.js"]')).toHaveCount(0);
    await expect(page.locator('script[src*="/assets/js/global-ui.js"]')).toHaveCount(0);
    await expect(page.locator('a[href="' + preview.switchHref + '"]').first()).toBeVisible();
    await expect(page.locator("video")).toHaveCount(1);
    await expect(page.locator('video[poster="/assets/video/agama-video-bg-poster-00001.jpg"]')).toHaveCount(1);
    await expect(page.locator('video source[src="/assets/video/agama-video-bg-transcode.webm"]')).toHaveCount(1);
    await expect(page.locator("[data-home-v2-hero-intro]")).toHaveCount(1);
    await expect(page.locator("[data-home-v2-hero-final]")).toHaveCount(1);
    await expect(page.locator('[data-home-v2-map] svg')).toHaveCount(1);
    await expect(page.locator('[data-branch-id="ermita"]')).toHaveCount(1);
    await expect(page.locator('a[href="/configurador"]')).toHaveCount(0);

    const relativeReferences = await page.locator("[href], [src], [poster]").evaluateAll((nodes) =>
      nodes.flatMap((node) =>
        ["href", "src", "poster"]
          .map((attribute) => node.getAttribute(attribute))
          .filter(
            (value) =>
              value &&
              !value.startsWith("/") &&
              !value.startsWith("https://") &&
              !value.startsWith("http://") &&
              !value.startsWith("#") &&
              !value.startsWith("mailto:") &&
              !value.startsWith("tel:"),
          ),
      ),
    );
    expect(relativeReferences).toEqual([]);
  }
});

test("home-v2 inicializa navegación y Chatbase una sola vez sin cargar GTM en local", async ({
  page,
}) => {
  const gtmRequests = [];
  page.on("request", (request) => {
    if (request.url().includes("googletagmanager.com")) gtmRequests.push(request.url());
  });
  await page.route("https://www.chatbase.co/**", (route) => route.abort());

  await page.goto("/home-v2/", { waitUntil: "domcontentloaded" });
  await page.dispatchEvent("body", "pointerdown");
  await page.dispatchEvent("body", "pointerdown");

  await expect
    .poll(() => page.evaluate(() => window.__AGAMA_HOME_V2_NAV_INIT_COUNT__))
    .toBe(1);
  await expect
    .poll(() => page.evaluate(() => window.__AGAMA_HOME_V2_CHATBASE_LOAD_COUNT__))
    .toBe(1);
  await expect(page.locator("#syhmjssLBRg1bJZYYj3ag")).toHaveCount(1);
  expect(gtmRequests).toEqual([]);
  await expect(page.locator("html")).toHaveAttribute("data-gtm", "disabled-preview");
});

test("home-v2 sincroniza la filial activa entre lista y mapa", async ({ page }) => {
  await page.goto("/home-v2/", { waitUntil: "domcontentloaded" });
  await page.locator('[data-branch-id="ermita"]').hover();
  await expect(page.locator('[data-branch-id="ermita"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-home-v2-map][data-active-zone="centro"]')).toHaveCount(1);
  await expect(page.locator('[data-map-halo="centro"]')).toHaveCSS("opacity", "1");
  await expect(page.locator('[data-map-active-label]')).toHaveText("Ermita");
  await page.locator('[data-inset-branch="ermita"]').click();
  await expect(page.locator('[data-branch-id="ermita"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-map-active-label]')).toHaveText("Ermita");
});

test("home-v2 conserva navegación, WhatsApp y newsletter sin JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("/home-v2/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();
  await expect(page.locator('a[href="https://wa.me/525573515156"]').first()).toBeVisible();
  await expect(page.locator('form[action="/contacto/"][method="get"]')).toBeVisible();
  await expect(page.locator('#home-v2-email[type="email"][required]')).toBeEnabled();

  await context.close();
});

test("el build incluye home-v2 y excluye completamente el backup", async () => {
  expect(fs.existsSync(path.join(ROOT, "dist/home-v2/index.html"))).toBe(true);
  expect(fs.existsSync(path.join(ROOT, "dist/home-v2/index.en.html"))).toBe(true);
  expect(fs.existsSync(path.join(ROOT, "dist/_backup"))).toBe(false);

  const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  expect(sitemap).not.toContain("/home-v2/");
});

test("el rollback físico reproduce la home estable con todas sus dependencias", async () => {
  const backupRoot = path.join(ROOT, "_backup/home-v1");
  const missing = [];

  expect(fs.readFileSync(path.join(backupRoot, "index.html"))).toEqual(
    fs.readFileSync(path.join(ROOT, "index.html")),
  );
  expect(fs.readFileSync(path.join(backupRoot, "index.en.html"))).toEqual(
    fs.readFileSync(path.join(ROOT, "index.en.html")),
  );

  for (const filename of ["index.html", "index.en.html"]) {
    const html = fs.readFileSync(path.join(backupRoot, filename), "utf8");
    const directReferences = [...html.matchAll(/(?:src|href|poster)="([^"]+)"/g)].map(
      (match) => match[1],
    );
    const srcsetReferences = [...html.matchAll(/srcset="([^"]+)"/g)].flatMap((match) =>
      match[1].split(",").map((candidate) => candidate.trim().split(/\s+/)[0]),
    );

    for (const rawReference of [...directReferences, ...srcsetReferences]) {
      const reference = rawReference.split("?")[0].replace(/^\//, "");
      if (!reference.startsWith("assets/")) continue;
      if (!fs.existsSync(path.join(backupRoot, reference))) missing.push(reference);
    }
  }

  for (const filename of [
    "normalize.css",
    "webflow.css",
    "webflow-base.css",
    "home-custom.css",
  ]) {
    const cssPath = path.join(backupRoot, "assets/css", filename);
    const css = fs.readFileSync(cssPath, "utf8");

    for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      const reference = match[1];
      if (/^(?:data:|https?:)/.test(reference)) continue;

      const resolved = path.resolve(path.dirname(cssPath), reference);
      if (!fs.existsSync(resolved)) {
        missing.push(path.relative(backupRoot, resolved));
      }
    }
  }

  expect([...new Set(missing)]).toEqual([]);
});
