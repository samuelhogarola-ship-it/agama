const GLOBAL_WHATSAPP_NUMBER = "525573515156";
const GLOBAL_WHATSAPP_ICON = "/assets/img/whatsapp-white.svg";
const CHATBASE_SCRIPT_ID = "syhmjssLBRg1bJZYYj3ag";
const CHATBASE_DOMAIN = "www.chatbase.co";
const CHATBASE_SRC = "https://www.chatbase.co/embed.min.js";
const BONNY_PRODUCTS_API_URL = "https://ozexoekvshuhtkrleuze.supabase.co/rest/v1/products";
const BONNY_PRODUCTS_API_KEY = "sb_publishable_nyvRHJ6eZ3aAfSQjVnBzYg_TdVPqpFL";
const BONNY_DEFAULT_QUANTITY = 25;

let bonnyProductsPromise = null;

function setBodyScrollLocked(locked) {
  document.body.classList.toggle("is-scroll-locked", locked);
}

function initMobileNav() {
  const modalNav = document.querySelector(".modal-nav-component");
  const openButton = document.querySelector(".brgr");
  const closeButton = document.querySelector(".close.close-btn");

  if (!modalNav || !openButton || !closeButton) return;
  if (modalNav.dataset.sharedNavReady === "true") return;

  const openNav = (event) => {
    event.preventDefault();
    modalNav.classList.add("show");
    setBodyScrollLocked(true);
  };

  const closeNav = (event) => {
    if (event) event.preventDefault();
    modalNav.classList.remove("show");
    setBodyScrollLocked(false);
  };

  openButton.addEventListener("click", openNav);
  closeButton.addEventListener("click", closeNav);

  modalNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      modalNav.classList.remove("show");
      setBodyScrollLocked(false);
    });
  });

  modalNav.dataset.sharedNavReady = "true";
}

function isFilialPage() {
  return window.location.pathname.includes("/filiales/");
}

function normalizeWhatsappNumber(rawValue) {
  const digits = (rawValue || "").replace(/\D/g, "");

  if (!digits) return "";
  if (digits.length === 10) return `52${digits}`;

  return digits;
}

function getPageWhatsappNumber() {
  const contactItems = Array.from(document.querySelectorAll(".contact-data-item"));

  for (const item of contactItems) {
    const label = item.querySelector(".contact-data-label");
    const value = item.querySelector(".contact-data-value");

    if (!label || !value) continue;
    if (!/whatsapp/i.test(label.textContent || "")) continue;

    const normalized = normalizeWhatsappNumber(value.textContent || "");
    if (normalized) return normalized;
  }

  const detailItems = Array.from(document.querySelectorAll(".detail-item"));

  for (const item of detailItems) {
    const label = item.querySelector(".detail-item-label");
    const value = item.querySelector(".detail-item-value");

    if (!label || !value) continue;
    if (!/whatsapp/i.test(label.textContent || "")) continue;

    const normalized = normalizeWhatsappNumber(value.textContent || "");
    if (normalized) return normalized;
  }

  return GLOBAL_WHATSAPP_NUMBER;
}

function updatePageWhatsappLinks(whatsappNumber) {
  const whatsappLinks = Array.from(
    document.querySelectorAll('a[href*="wa.me/"], a[href*="api.whatsapp.com/"]')
  );

  whatsappLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const [baseUrl, query = ""] = href.split("?");
    const nextBase = baseUrl.includes("api.whatsapp.com")
      ? `https://api.whatsapp.com/send?phone=${whatsappNumber}`
      : `https://wa.me/${whatsappNumber}`;

    if (baseUrl.includes("api.whatsapp.com")) {
      const params = new URLSearchParams(query);
      params.set("phone", whatsappNumber);
      link.href = `https://api.whatsapp.com/send?${params.toString()}`;
      return;
    }

    link.href = query ? `${nextBase}?${query}` : nextBase;
  });
}

function initFloatingWhatsapp() {
  if (!document.body) return;

  const whatsappNumber = getPageWhatsappNumber();

  const existingHolders = Array.from(document.querySelectorAll(".mesenger-hldr"));
  const holder =
    existingHolders[0] || document.createElement("div");

  existingHolders.slice(1).forEach((duplicate) => duplicate.remove());
  holder.className = "mesenger-hldr";
  holder.replaceChildren();

  const link = document.createElement("a");

  link.href = `https://wa.me/${whatsappNumber}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "messenger w-inline-block";
  link.setAttribute("aria-label", "WhatsApp");

  const image = document.createElement("img");
  image.src = GLOBAL_WHATSAPP_ICON;
  image.alt = "WhatsApp";
  image.loading = "lazy";

  link.appendChild(image);
  holder.appendChild(link);
  if (!holder.isConnected) {
    document.body.appendChild(holder);
  }
}

function shouldInitChatbase() {
  return ["/filiales/", "/productos/"].some((segment) =>
    window.location.pathname.includes(segment)
  );
}

function syncPageWhatsapp() {
  if (!isFilialPage()) return;
  updatePageWhatsappLinks(getPageWhatsappNumber());
}

function initSharedChatbase() {
  if (!shouldInitChatbase()) return;

  if (!window.chatbase || window.chatbase("getState") !== "initialized") {
    const queuedChatbase = (...args) => {
      queuedChatbase.q = queuedChatbase.q || [];
      queuedChatbase.q.push(args);
    };

    window.chatbase = new Proxy(queuedChatbase, {
      get(target, prop) {
        if (prop === "q") return target.q;
        return (...args) => target(prop, ...args);
      },
    });
  }

  if (
    document.getElementById(CHATBASE_SCRIPT_ID) ||
    (window.chatbase && window.chatbase("getState") === "initialized")
  ) {
    return;
  }

  const script = document.createElement("script");
  script.src = CHATBASE_SRC;
  script.id = CHATBASE_SCRIPT_ID;
  script.domain = CHATBASE_DOMAIN;
  document.body.appendChild(script);
}

function normalizeBonnyText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseBonnyQuantity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function formatBonnyMoney(value, locale = "es-MX") {
  return Number(value).toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

async function fetchBonnyProducts() {
  if (!bonnyProductsPromise) {
    const url = `${BONNY_PRODUCTS_API_URL}?published=eq.true&select=nombre,slug,precio,tipo_producto&order=nombre.asc`;

    bonnyProductsPromise = fetch(url, {
      headers: {
        apikey: BONNY_PRODUCTS_API_KEY,
        Authorization: `Bearer ${BONNY_PRODUCTS_API_KEY}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Supabase returned ${response.status}`);
        }

        const products = await response.json();
        return products
          .map((product) => ({
            ...product,
            precioNumero: Number(product.precio),
            slugNormalizado: normalizeBonnyText(product.slug),
            nombreNormalizado: normalizeBonnyText(product.nombre),
          }))
          .filter((product) => Number.isFinite(product.precioNumero) && product.precioNumero > 0);
      })
      .catch((error) => {
        bonnyProductsPromise = null;
        throw error;
      });
  }

  return bonnyProductsPromise;
}

function getBonnyCopy() {
  const isEnglish = document.documentElement.lang?.toLowerCase().startsWith("en");

  if (isEnglish) {
    return {
      locale: "en-US",
      intro: "Hello AGAMA, I would like a quote with this estimate:",
      outro: "Please confirm availability, final price, and shipping.",
      totalLabel: "Estimated total",
      productMissing: "I couldn't match one of the requested products with an item that has a visible price.",
      emptyItems: "At least one product with quantity is required.",
      unavailablePrices: "No priced products are currently available for Bonny's calculator.",
      quoteSummary: "Estimated quote based on current public website prices.",
    };
  }

  return {
    locale: "es-MX",
    intro: "Hola AGAMA, quiero cotizar este presupuesto estimado:",
    outro: "Por favor confirmen disponibilidad, precio final y envio.",
    totalLabel: "Total estimado",
    productMissing: "No pude relacionar uno de los productos solicitados con un item que tenga precio visible.",
    emptyItems: "Necesito al menos un producto con cantidad para calcular la cotizacion.",
    unavailablePrices: "No hay productos con precio visible disponibles para la calculadora de Bonny.",
    quoteSummary: "Cotizacion estimada con base en los precios publicos visibles en la web.",
  };
}

function buildBonnyQuoteMessage(lines, totalDisplay, copy) {
  return [
    copy.intro,
    ...lines.map(
      (line) => `- ${line.nombre}: ${line.cantidad_kg} kg = $${line.subtotal_mxn_formateado} MXN`
    ),
    `${copy.totalLabel}: $${totalDisplay} MXN.`,
    copy.outro,
  ].join("\n");
}

function buildBonnyWhatsappUrl(message) {
  return `https://wa.me/${GLOBAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function resolveBonnyItems(args) {
  if (Array.isArray(args?.items)) return args.items;
  if (Array.isArray(args?.productos)) return args.productos;
  if (Array.isArray(args?.lines)) return args.lines;

  const singleProduct = args?.product || args?.producto || args?.name || args?.nombre || args?.slug;
  if (!singleProduct) return [];

  return [{
    ...args,
    product: args.product || args.producto || args.name || args.nombre || args.slug,
  }];
}

function matchBonnyProduct(candidate, products) {
  const rawProduct = candidate?.product || candidate?.producto || candidate?.name || candidate?.nombre || candidate?.slug || "";
  const rawSlug = candidate?.slug || "";
  const requestedCategory = normalizeBonnyText(candidate?.category || candidate?.categoria || "");
  const target = normalizeBonnyText(rawProduct);
  const slugTarget = normalizeBonnyText(rawSlug);

  if (!target && !slugTarget) return null;

  const filteredProducts = requestedCategory
    ? products.filter((product) => normalizeBonnyText(product.tipo_producto) === requestedCategory)
    : products;

  const exactSlug = filteredProducts.find((product) => product.slugNormalizado === slugTarget || product.slugNormalizado === target);
  if (exactSlug) return exactSlug;

  const exactName = filteredProducts.find((product) => product.nombreNormalizado === target);
  if (exactName) return exactName;

  const startsWithName = filteredProducts.find((product) =>
    product.nombreNormalizado.startsWith(target) || target.startsWith(product.nombreNormalizado)
  );
  if (startsWithName) return startsWithName;

  return filteredProducts.find((product) =>
    product.nombreNormalizado.includes(target) ||
    target.includes(product.nombreNormalizado) ||
    product.slugNormalizado.includes(target)
  ) || null;
}

async function runBonnyQuoteCalculator(args) {
  try {
    const copy = getBonnyCopy();
    const requestedItems = resolveBonnyItems(args);

    if (requestedItems.length === 0) {
      return {
        status: "error",
        error: copy.emptyItems,
      };
    }

    const products = await fetchBonnyProducts();
    if (products.length === 0) {
      return {
        status: "error",
        error: copy.unavailablePrices,
      };
    }

    const resolvedLines = [];

    for (const item of requestedItems) {
      const rawQuantity =
        item?.quantity ?? item?.cantidad ?? item?.kg ?? item?.kilos ?? item?.quantity_kg;
      const quantity = rawQuantity == null || rawQuantity === ""
        ? BONNY_DEFAULT_QUANTITY
        : parseBonnyQuantity(rawQuantity);

      if (!quantity) {
        return {
          status: "error",
          error: copy.emptyItems,
        };
      }

      const product = matchBonnyProduct(item, products);
      if (!product) {
        return {
          status: "error",
          error: copy.productMissing,
        };
      }

      const subtotal = Number((product.precioNumero * quantity).toFixed(2));

      resolvedLines.push({
        nombre: product.nombre,
        slug: product.slug,
        categoria: product.tipo_producto,
        cantidad_kg: quantity,
        precio_unitario_mxn: product.precioNumero,
        precio_unitario_mxn_formateado: formatBonnyMoney(product.precioNumero, copy.locale),
        subtotal_mxn: subtotal,
        subtotal_mxn_formateado: formatBonnyMoney(subtotal, copy.locale),
      });
    }

    const total = Number(
      resolvedLines.reduce((sum, line) => sum + line.subtotal_mxn, 0).toFixed(2)
    );
    const totalDisplay = formatBonnyMoney(total, copy.locale);
    const message = buildBonnyQuoteMessage(resolvedLines, totalDisplay, copy);

    return {
      status: "success",
      data: {
        resumen: copy.quoteSummary,
        lineas: resolvedLines,
        total_mxn: total,
        total_mxn_formateado: totalDisplay,
        mensaje_whatsapp: message,
        url_whatsapp: buildBonnyWhatsappUrl(message),
        supuestos: [
          "Precios estimados obtenidos de los productos publicados con precio visible.",
          `Si no se indica cantidad, la web suele sugerir ${BONNY_DEFAULT_QUANTITY} kg como punto de partida, pero esta accion requiere una cantidad explicita por linea.`,
          "El total no incluye envio ni ajustes comerciales finales.",
        ],
      },
    };
  } catch (error) {
    console.error("Bonny quote calculator failed:", error);
    return {
      status: "error",
      error: "No pude calcular la cotizacion en este momento. Intenta de nuevo en unos segundos.",
    };
  }
}

function registerBonnyQuoteTools() {
  if (typeof window.chatbase !== "function") return false;
  if (window.__bonnyQuoteToolsRegistered === "true") return true;

  window.__chatbaseRegisteredTools = {
    ...(window.__chatbaseRegisteredTools || {}),
    calculate_quote: runBonnyQuoteCalculator,
    calcular_cotizacion: runBonnyQuoteCalculator,
  };

  window.chatbase("registerTools", window.__chatbaseRegisteredTools);
  window.__bonnyQuoteToolsRegistered = "true";
  return true;
}

function initBonnyQuoteTools(attempt = 0) {
  if (registerBonnyQuoteTools()) return;
  if (attempt >= 20) return;

  window.setTimeout(() => {
    initBonnyQuoteTools(attempt + 1);
  }, 500);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    syncPageWhatsapp();
    initMobileNav();
    initFloatingWhatsapp();
    initSharedChatbase();
    initBonnyQuoteTools();
  });
} else {
  syncPageWhatsapp();
  initMobileNav();
  initFloatingWhatsapp();
  initSharedChatbase();
  initBonnyQuoteTools();
}
