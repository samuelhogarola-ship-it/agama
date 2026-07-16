import { expect, test } from "@playwright/test";

import { enrichQuoteWithCatalogRows } from "../src/lib/quote-catalog";
import type { QuoteRequest } from "../src/lib/quote-contract";

test("carga el configurador aislado", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto("/configurador", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Configurador de Color/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Compartir/i })).toBeVisible();
  const viewer = page.getByRole("region", { name: /Visor de producto/i });
  await expect(viewer.getByRole("button", { name: /^Imagen$/i })).toBeVisible();
  await expect(viewer.getByRole("button", { name: /^Ficha$/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Catálogo de color AGAMA/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^MB-103\s+MB Amarillo Eléctrico$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^MB-106\s+MB Azul Rey$/i })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /^MB-110\s+MB Negro Kalo Económico$/i })).toHaveCount(1);
  await expect(page.getByText("114 colores", { exact: true })).toBeVisible();
  await expect(page.getByText(/Sin selección/i)).toBeVisible();
  await expect(page.getByText(/se muestra en blanco hasta elegir un color/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Añadir al carrito/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Pedido.*Configurar pedido/i })).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test("muestra la referencia comercial del color seleccionado", async ({ page }) => {
  await page.goto("/configurador?color=MB-103", { waitUntil: "domcontentloaded" });

  await expect(page.getByText(/Color activo/i)).toBeVisible();
  await expect(page.getByText(/MB-103/i).first()).toBeVisible();
  await expect(page.getByText(/Amarillo Eléctrico/i).first()).toBeVisible();
  await expect(page.getByText(/132 MXN\/kg/i).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Solicitar cotización/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Añadir al carrito/i })).toBeVisible();
});

test("usa los HEX validados del catálogo por código", async ({ page }) => {
  await page.goto("/configurador?color=MB-101", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("#F6C400", { exact: true })).toBeVisible();

  await page.goto("/configurador?color=BP-116", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("#53257E", { exact: true })).toBeVisible();
});

test("cambia entre productos usando las pestañas", async ({ page }) => {
  await page.goto("/configurador", { waitUntil: "domcontentloaded" });

  // Product tabs visible
  await expect(page.getByRole("button", { name: /Taza/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Silla/i })).toBeVisible();

  // Switch to Taza — canvas renderer should appear
  await page.getByRole("button", { name: /Taza/i }).click();
  await expect(page.getByRole("img", { name: /Taza renderizado en canvas/i })).toBeVisible();
  await expect(page.getByText(/Taza se muestra en blanco hasta elegir un color/i)).toBeVisible();

  // Switch back to Cubeta — image should appear (not canvas)
  await page.getByRole("button", { name: /Cubeta/i }).click();
  await expect(page.getByText(/Cubeta se muestra en blanco hasta elegir un color/i)).toBeVisible();
});

test("añade un color al carrito y lo quita", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto("/configurador?color=MB-103", { waitUntil: "domcontentloaded" });

  // Add to cart
  await page.getByRole("button", { name: /Añadir al carrito/i }).click();

  // Cart opens automatically with the item
  await expect(page.getByText(/1 configuración añadida/i)).toBeVisible();
  await expect(page.getByText(/MB-103/i).first()).toBeVisible();

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Pedido/i }).click();
  await expect(page.getByText(/MB-103/i).first()).toBeVisible();
  expect(consoleErrors).toEqual([]);

  // Remove from cart
  await page.getByRole("button", { name: /^Quitar$/i }).click();
  await expect(page.getByText(/Todavía no hay configuraciones añadidas/i)).toBeVisible();
});

test("descarga la imagen PNG del producto con un nombre reconocible", async ({ page }) => {
  await page.goto("/configurador?color=MB-103", { waitUntil: "domcontentloaded" });
  const viewer = page.getByRole("region", { name: /Visor de producto/i });
  const btn = viewer.getByRole("button", { name: /^Imagen$/i });
  await expect(btn).toBeVisible();
  await expect(btn).not.toBeDisabled();

  const downloadPromise = page.waitForEvent("download");
  await btn.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("bucket-MB-103-2d.png");
});

test("Ficha está habilitado con color activo", async ({ page }) => {
  await page.goto("/configurador?color=MB-103", { waitUntil: "domcontentloaded" });
  const viewer = page.getByRole("region", { name: /Visor de producto/i });
  const btn = viewer.getByRole("button", { name: /^Ficha$/i });
  await expect(btn).toBeVisible();
  await expect(btn).not.toBeDisabled();
});

test("mantiene el render dentro del viewport móvil", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/configurador?color=BP-116", { waitUntil: "domcontentloaded" });

  const canvas = page.getByRole("img", { name: /Cubeta renderizado en canvas/i });
  await expect(canvas).toBeVisible();
  await expect(page.getByText("#53257E", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Añadir al carrito/i })).toBeVisible();

  const layout = await page.evaluate(() => {
    const canvasEl = document.querySelector("canvas");
    const rect = canvasEl?.getBoundingClientRect();
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      canvasWidth: rect?.width ?? 0,
      canvasLeft: rect?.left ?? 0,
      canvasRight: rect?.right ?? 0,
    };
  });

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  expect(layout.canvasWidth).toBeLessThanOrEqual(layout.clientWidth);
  expect(layout.canvasLeft).toBeGreaterThanOrEqual(0);
  expect(layout.canvasRight).toBeLessThanOrEqual(layout.clientWidth);

  const paintedPixels = await page.locator("canvas").evaluate((canvasNode) => {
    const canvasEl = canvasNode as HTMLCanvasElement;
    const context = canvasEl.getContext("2d");
    if (!context) return 0;
    const { width, height } = canvasEl;
    const data = context.getImageData(0, 0, width, height).data;
    let painted = 0;
    for (let index = 0; index < data.length; index += 4 * 24) {
      const red = data[index] ?? 0;
      const green = data[index + 1] ?? 0;
      const blue = data[index + 2] ?? 0;
      const alpha = data[index + 3] ?? 0;
      if (alpha > 16 && (red < 245 || green < 245 || blue < 245)) painted += 1;
    }
    return painted;
  });

  expect(paintedPixels).toBeGreaterThan(100);
});

test("prioriza catálogo y controles legibles en un iPhone 15", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/configurador", { waitUntil: "domcontentloaded" });

  const catalog = page.getByRole("heading", { name: /Catálogo de color AGAMA/i });
  const viewerStatus = page.getByText(/Sin selección/i);
  await expect(catalog).toBeVisible();
  await expect(page.getByRole("region", { name: /Visor de producto/i }).getByRole("button", { name: /^Imagen$/i })).toBeVisible();

  const mobileLayout = await page.evaluate(() => {
    const catalogHeading = Array.from(document.querySelectorAll("h2")).find((heading) =>
      heading.textContent?.includes("Catálogo de color AGAMA"),
    );
    const viewerText = Array.from(document.querySelectorAll("p")).find((paragraph) =>
      paragraph.textContent?.includes("Sin selección"),
    );
    const filters = document.querySelector('[role="group"][aria-label="Filtrar por línea"]');
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      catalogTop: catalogHeading?.getBoundingClientRect().top ?? 0,
      viewerTop: viewerText?.getBoundingClientRect().top ?? 0,
      filterColumns: filters ? getComputedStyle(filters).gridTemplateColumns.split(" ").filter(Boolean).length : 0,
    };
  });

  expect(mobileLayout.scrollWidth).toBeLessThanOrEqual(mobileLayout.clientWidth);
  expect(mobileLayout.catalogTop).toBeLessThan(mobileLayout.viewerTop);
  expect(mobileLayout.filterColumns).toBe(3);

  await page.getByRole("button", { name: /^MB-103\s+MB Amarillo Eléctrico$/i }).click();
  await expect(viewerStatus).toBeHidden();
  await expect(page.getByText(/Color activo/i)).toBeInViewport();

  const productImage = page.getByRole("img", { name: /Cubeta MB-103/i });
  const price = page.getByText("132 MXN/kg", { exact: true });
  const cartButton = page.getByRole("button", { name: /Añadir al carrito/i });
  const [imageBox, priceBox, cartBox] = await Promise.all([productImage.boundingBox(), price.boundingBox(), cartButton.boundingBox()]);
  expect(imageBox).not.toBeNull();
  expect(priceBox).not.toBeNull();
  expect(cartBox).not.toBeNull();
  expect(cartBox!.y + cartBox!.height).toBeLessThanOrEqual(imageBox!.y);
  expect(priceBox!.y).toBeGreaterThanOrEqual(imageBox!.y + imageBox!.height);
});

test("expone landmark principal y permite saltar al contenido", async ({ page }) => {
  await page.goto("/configurador?color=MB-103", { waitUntil: "domcontentloaded" });

  const main = page.getByRole("main");
  await expect(main).toBeVisible();

  const skipLink = page.locator('a[href="#configurator-main"]');
  await expect(skipLink).toHaveAttribute("href", "#configurator-main");
  await expect(skipLink).toBeHidden();
  await skipLink.focus();
  await expect(skipLink).toBeVisible();
});

test("mantiene el foco dentro del checkout y permite cerrar con Escape", async ({ page }) => {
  await page.goto("/configurador?color=MB-103", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Añadir al carrito/i }).click();
  await page.getByRole("button", { name: /Siguiente/i }).click();

  const dialog = page.getByRole("dialog", { name: /Resumen del pedido/i });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: /Cerrar resumen del pedido/i })).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: /Volver al configurador/i })).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /Cerrar resumen del pedido/i })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: /Pedido/i })).toBeVisible();
});

test("apila el comparador en móvil estrecho para evitar columnas ilegibles", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/configurador?color=MB-103", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Comparar/i }).click();

  const columnCount = await page.getByRole("list", { name: /Slots del comparador/i }).evaluate((node) => {
    const columns = getComputedStyle(node).gridTemplateColumns.trim();
    return columns.split(" ").filter(Boolean).length;
  });

  expect(columnCount).toBe(1);
});

test("usa tipografía de 16px en los campos del formulario de cotización para evitar zoom en iPhone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/configurador?color=MB-103", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Añadir al carrito/i }).click();
  await page.getByRole("button", { name: /Siguiente/i }).click();
  await page.getByRole("button", { name: /Solicitar cotización/i }).click();

  const fontSize = await page.getByLabel(/Nombre completo/i).evaluate((input) => getComputedStyle(input).fontSize);
  expect(fontSize).toBe("16px");
});

test("solo publica productos con representación visual terminada", async ({ page }) => {
  await page.goto("/configurador", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: /Cubeta/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Taza/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Silla/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Tapa$/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Botella$/i })).toHaveCount(0);
});

test("envía una solicitud comercial y muestra su referencia", async ({ page }) => {
  await page.route("**/api/quotes", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        quoteId: "AGAMA-TEST-42",
        notificationQueued: true,
        notificationDelivered: false,
        submittedAt: "2026-07-12T10:30:00.000Z",
        contactEmail: "compras@example-client.com",
      }),
    });
  });
  await page.goto("/configurador?color=MB-103", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Añadir al carrito/i }).click();
  await page.getByRole("button", { name: /Siguiente/i }).click();
  await page.getByRole("button", { name: /Solicitar cotización/i }).click();
  await page.getByLabel(/Nombre completo/i).fill("María Compras");
  await page.getByLabel(/Empresa/i).fill("Plásticos Ejemplo");
  await page.getByLabel(/Email/i).fill("compras@example.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Enviar solicitud/i }).click();

  await expect(page.getByText(/Solicitud recibida/i)).toBeVisible();
  await expect(page.getByText(/AGAMA-TEST-42/i)).toBeVisible();
  await expect(page.getByText(/compras@example-client.com/i)).toBeVisible();
});

test("ofrece WhatsApp si la cotización no se puede guardar", async ({ page }) => {
  await page.route("**/api/quotes", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "storage_failed", message: "No pudimos guardar la solicitud. Puedes continuar por WhatsApp." }),
    });
  });
  await page.goto("/configurador?color=MB-103", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Añadir al carrito/i }).click();
  await page.getByRole("button", { name: /Siguiente/i }).click();
  await page.getByRole("button", { name: /Solicitar cotización/i }).click();
  await page.getByLabel(/Nombre completo/i).fill("María Compras");
  await page.getByLabel(/Empresa/i).fill("Plásticos Ejemplo");
  await page.getByLabel(/Email/i).fill("compras@example-client.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Enviar solicitud/i }).click();

  const errorAlert = page.getByText(/No pudimos guardar la solicitud/i);
  await expect(errorAlert).toBeVisible();
  await expect(page.getByRole("link", { name: /Continuar cotizacion por WhatsApp/i })).toHaveAttribute("href", /wa\.me/);
});

test("prepara WhatsApp con items, peso y monto total del pedido", async ({ page }) => {
  await page.goto("/configurador?color=MB-103", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Añadir al carrito/i }).click();
  await page.getByRole("button", { name: /Siguiente/i }).click();
  await page.getByRole("button", { name: /Solicitar cotización/i }).click();

  const whatsappLink = page.getByRole("link", { name: /Enviar pedido por WhatsApp/i });
  const href = await whatsappLink.getAttribute("href");

  expect(href).toContain("wa.me/525573515156");
  const decoded = decodeURIComponent(href ?? "");
  expect(decoded).toContain("MB-103");
  expect(decoded).toContain("Cubeta");
  expect(decoded).toContain("1 kg");
  expect(decoded).toContain("132 MXN/kg");
  expect(decoded).toContain("132 MXN");
  expect(decoded).toContain("Peso total: 1 kg");
  expect(decoded).toContain("Monto total: 132 MXN");
});

test("rechaza solicitudes inválidas en el servidor", async ({ request }) => {
  const response = await request.post("/api/quotes", { data: { contactName: "Sin pedido" } });
  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toMatchObject({ ok: false, error: "invalid_request" });
});

test("normaliza precio y nombre del catálogo aunque el payload venga manipulado", () => {
  const manipulatedQuote: QuoteRequest = {
    contactName: "María Compras",
    contactEmail: "compras@example-client.com",
    contactPhone: "",
    contactCompany: "Plásticos Ejemplo",
    notes: "",
    consent: true,
    source: "configurador",
    configurationUrl: "https://www.agama.com.mx/configurador?color=MB-103",
    website: "",
    items: [
      {
        configurationId: "fake-client-id",
        productId: "bucket",
        colorCode: "MB-103",
        colorName: "Nombre manipulado",
        quantityKg: 25,
        pricePerKgMxn: 1,
        process: "Extrusion",
        material: "PEAD",
      },
    ],
  };

  const enrichedQuote = enrichQuoteWithCatalogRows(manipulatedQuote, [
    { code: "MB-103", nombre: "MB-103 MB. AMARILLO ELÉCTRICO", precio: 132 },
  ]);

  expect(enrichedQuote?.items[0]).toMatchObject({
    colorCode: "MB-103",
    colorName: "Amarillo Eléctrico",
    pricePerKgMxn: 132,
    quantityKg: 25,
  });
});

test("rechaza catálogo incompleto antes de persistir una cotización", () => {
  const quote: QuoteRequest = {
    contactName: "María Compras",
    contactEmail: "compras@example-client.com",
    contactPhone: "",
    contactCompany: "Plásticos Ejemplo",
    notes: "",
    consent: true,
    source: "configurador",
    configurationUrl: "https://www.agama.com.mx/configurador?color=MB-999",
    website: "",
    items: [
      {
        configurationId: "fake-client-id",
        productId: "bucket",
        colorCode: "MB-999",
        colorName: "Color inexistente",
        quantityKg: 25,
        pricePerKgMxn: 1,
        process: "Extrusion",
        material: "PEAD",
      },
    ],
  };

  expect(enrichQuoteWithCatalogRows(quote, [])).toBeNull();
});
