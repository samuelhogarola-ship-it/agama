(() => {
  const SUPABASE_URL = "https://ozexoekvshuhtkrleuze.supabase.co";
  const SUPABASE_KEY = "sb_publishable_nyvRHJ6eZ3aAfSQjVnBzYg_TdVPqpFL";
  const WHATSAPP_NUMBER = "525573515156";
  const CART_STORAGE_KEY = "agama-online-cart-v1";
  const FAMILIES = ["pigmentos", "masterbatch", "aditivos"];
  const IS_EN = document.documentElement.lang?.toLowerCase().startsWith("en");
  const TEXT = IS_EN ? {
    allTones: "All shades and types",
    searchingFallback: "Search by shade, code, product, or use",
    noResults: "No products matched that search.",
    shown: (visible, total) => `Showing ${visible} of ${total} products`,
    found: (total) => `${total} products found`,
    priceConsult: "Price on request",
    add: "Add to purchase",
    details: "View details",
    cartEmpty: "Add products from featured items or the search panel.",
    cartOnline: "Online cart",
    totalConsult: "On request",
    totalPartial: (total, hasUnknown) => `$${total} MXN${hasUnknown ? " + on request" : ""}`,
    whatsappOpening: "Hello AGAMA, I want to quote this online purchase:",
    whatsappTotalKnown: (total, hasUnknown) => `Partial total seen online: $${total} MXN${hasUnknown ? " + items to confirm" : ""}.`,
    whatsappTotalUnknown: "Total: on request.",
    whatsappClosing: "Please confirm availability and purchase details.",
  } : {
    allTones: "Todos los tonos y tipos",
    searchingFallback: "Buscar por tono, codigo, producto o uso",
    noResults: "No encontramos productos con esa búsqueda.",
    shown: (visible, total) => `Mostrando ${visible} de ${total} productos`,
    found: (total) => `${total} productos encontrados`,
    priceConsult: "Precio por consultar",
    add: "Añadir a compra",
    details: "Ver ficha",
    cartEmpty: "Añade productos desde recomendados o desde el buscador.",
    cartOnline: "Cesta online",
    totalConsult: "Consultar",
    totalPartial: (total, hasUnknown) => `$${total} MXN${hasUnknown ? " + consultar" : ""}`,
    whatsappOpening: "Hola AGAMA, quiero cotizar esta compra online:",
    whatsappTotalKnown: (total, hasUnknown) => `Total parcial visto online: $${total} MXN${hasUnknown ? " + partidas por consultar" : ""}.`,
    whatsappTotalUnknown: "Total: por consultar.",
    whatsappClosing: "Me confirman disponibilidad y cierre de compra.",
  };

  const FALLBACK_PRODUCTS = [
    {
      nombre: "MB-110 Negro Kalo Económico",
      slug: "mb-110-mb-negro-kalo-economico",
      descripcion: "Masterbatch negro para extrusión de película y evaluación en inyección o soplado.",
      portada: "https://ozexoekvshuhtkrleuze.supabase.co/storage/v1/object/public/product-images/masterbatch/mb-110-mb-negro-kalo-economico/cover.webp",
      tipo_producto: "masterbatch",
      tipo: "Negro",
      acabado: "Económico",
      color: "Negro",
      precio: null,
    },
    {
      nombre: "MB-120 Blanco Shalom",
      slug: "mb-120-mb-blanco-shalom",
      descripcion: "Masterbatch blanco compatible con múltiples resinas y procesos de transformación.",
      portada: "https://ozexoekvshuhtkrleuze.supabase.co/storage/v1/object/public/product-images/masterbatch/mb-120-mb-blanco-shalom/cover.webp",
      tipo_producto: "masterbatch",
      tipo: "Blanco",
      acabado: "",
      color: "Blanco",
      precio: null,
    },
    {
      nombre: "BP-1019 Negro Humo Cristal",
      slug: "bp-1019-pig-negro-humo-cristal",
      descripcion: "Pigmento en polvo negro para aplicaciones que requieren transparencia.",
      portada: "https://ozexoekvshuhtkrleuze.supabase.co/storage/v1/object/public/product-images/pigmentos/bp-1019-pig-negro-humo-cristal/cover.webp",
      tipo_producto: "pigmentos",
      tipo: "Cristal",
      acabado: "Cristal",
      color: "Negro",
      precio: null,
    },
    {
      nombre: "AD-304 Protector UV",
      slug: "ad-304-protector-uv",
      descripcion: "Aditivo para ayudar a proteger piezas plásticas expuestas a luz solar.",
      portada: "https://ozexoekvshuhtkrleuze.supabase.co/storage/v1/object/public/product-images/aditivos/ad-304-protector-uv/cover.webp",
      tipo_producto: "aditivos",
      tipo: "Protector UV",
      acabado: "",
      color: "UV",
      precio: null,
    },
    {
      nombre: "AD-305 Slip Desmoldante en Polvo",
      slug: "ad-305-slip-desmoldante-en-polvo",
      descripcion: "Solución para mejorar deslizamiento y facilitar el desmoldeo en producción.",
      portada: "https://ozexoekvshuhtkrleuze.supabase.co/storage/v1/object/public/product-images/aditivos/ad-305-slip-desmoldante-en-polvo/cover.webp",
      tipo_producto: "aditivos",
      tipo: "Desmoldante",
      acabado: "Polvo",
      color: "",
      precio: null,
    },
    {
      nombre: "AD-318 Purga",
      slug: "ad-318-purga",
      descripcion: "Aditivo de limpieza para cambios de material o color en equipos de transformación.",
      portada: "https://ozexoekvshuhtkrleuze.supabase.co/storage/v1/object/public/product-images/aditivos/ad-318-purga/cover.webp",
      tipo_producto: "aditivos",
      tipo: "Purga",
      acabado: "",
      color: "Rojo",
      precio: null,
    },
  ];

  const state = {
    products: FALLBACK_PRODUCTS,
    renderedProducts: FALLBACK_PRODUCTS,
    family: "all",
    tone: "all",
    query: "",
    cart: readCart(),
  };

  function escapeHtml(value) {
    if (value == null) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function formatPrice(value) {
    return Number(value).toLocaleString("es-MX", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  function familyLabel(family) {
    return {
      pigmentos: "Pigmentos",
      masterbatch: "Masterbatch",
      aditivos: "Aditivos",
    }[family] || "Producto";
  }

  function productUrl(product) {
    return `/productos/${product.tipo_producto}/${product.slug}/`;
  }

  function productCode(product) {
    const match = String(product.nombre || "").match(/\b(?:MB|BP|AD)-\d+\b/i);
    return match ? match[0].toUpperCase() : familyLabel(product.tipo_producto);
  }

  function productPrice(product) {
    const price = Number(product.precio);
    if (!Number.isFinite(price) || price <= 0) return null;
    return price;
  }

  async function fetchFamily(family) {
    const url = `${SUPABASE_URL}/rest/v1/products`
      + `?tipo_producto=eq.${family}`
      + `&published=eq.true`
      + `&select=nombre,slug,descripcion,portada,precio,tipo_producto,tipo,acabado,color`
      + `&order=nombre.asc`;

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!response.ok) throw new Error(`Supabase ${response.status}`);
    return response.json();
  }

  async function loadCatalog() {
    const grid = document.querySelector("[data-online-grid]");
    if (!grid) return;

    renderCatalog();
    renderCart();

    try {
      const lists = await Promise.all(FAMILIES.map(fetchFamily));
      state.products = lists.flat().filter((product) => product && product.slug);
      buildToneOptions();
      renderCatalog();
    } catch (error) {
      console.warn("AGAMA Online usa recomendados como fallback.", error);
      buildToneOptions();
      renderCatalog();
    }
  }

  function buildToneOptions() {
    const toneFilter = document.querySelector("[data-tone-filter]");
    if (!toneFilter) return;

    const values = new Map();
    state.products.forEach((product) => {
      [product.color, product.tipo, product.acabado].forEach((value) => {
        const clean = String(value || "").trim();
        if (!clean) return;
        values.set(normalize(clean), clean);
      });
    });

    const current = toneFilter.value;
    const options = [...values.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], "es"))
      .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
      .join("");

    toneFilter.innerHTML = `<option value="all">${TEXT.allTones}</option>${options}`;
    toneFilter.value = [...values.keys()].includes(current) ? current : "all";
    state.tone = toneFilter.value;
  }

  function matchesProduct(product) {
    if (state.family !== "all" && product.tipo_producto !== state.family) return false;

    const haystack = normalize([
      product.nombre,
      product.descripcion,
      product.tipo,
      product.acabado,
      product.color,
      product.slug,
    ].join(" "));

    if (state.query && !haystack.includes(normalize(state.query))) return false;
    if (state.tone !== "all" && !haystack.includes(state.tone)) return false;
    return true;
  }

  function renderCatalog() {
    const grid = document.querySelector("[data-online-grid]");
    const count = document.querySelector("[data-online-count]");
    if (!grid) return;

    const products = state.products.filter(matchesProduct);
    state.renderedProducts = products;

    if (count) {
      const visibleCount = Math.min(products.length, 24);
      count.textContent = products.length > visibleCount
        ? TEXT.shown(visibleCount, products.length)
        : TEXT.found(products.length);
    }

    if (products.length === 0) {
      grid.innerHTML = `<div class="sales-cart-empty">${TEXT.noResults}</div>`;
      return;
    }

    grid.innerHTML = products.slice(0, 24).map(renderProductCard).join("");
    bindCartButtons(grid);
  }

  function renderProductCard(product) {
    const price = productPrice(product);
    const url = productUrl(product);
    const img = product.portada
      ? `<img src="${escapeHtml(product.portada)}" alt="${escapeHtml(product.nombre)}" loading="lazy"/>`
      : `<span class="icon-font" aria-hidden="true">inventory_2</span>`;

    return `
      <article class="sales-catalog-card">
        <a class="sales-catalog-card__image" href="${url}">${img}</a>
        <div class="sales-catalog-card__body">
          <div class="sales-catalog-card__meta">
            <span class="sales-pill">${escapeHtml(familyLabel(product.tipo_producto))}</span>
            <span class="sales-pill">${escapeHtml(productCode(product))}</span>
          </div>
          <h3><a href="${url}">${escapeHtml(product.nombre)}</a></h3>
          ${product.descripcion ? `<p>${escapeHtml(product.descripcion).slice(0, 130)}${product.descripcion.length > 130 ? "..." : ""}</p>` : ""}
          <div class="sales-catalog-card__price">${price ? `$${formatPrice(price)} MXN/kg` : TEXT.priceConsult}</div>
          <div class="sales-catalog-card__actions">
            <a href="${url}">${TEXT.details}</a>
            <button type="button"
              data-cart-add
              data-cart-family="${escapeHtml(product.tipo_producto)}"
              data-cart-slug="${escapeHtml(product.slug)}"
              data-cart-name="${escapeHtml(product.nombre)}"
              data-cart-image="${escapeHtml(product.portada || "")}"
              data-cart-url="${url}"
              data-cart-price="${price || ""}">
              ${TEXT.add}
            </button>
          </div>
        </div>
      </article>`;
  }

  function readCart() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
  }

  function addToCart(input) {
    const existing = state.cart.find((item) => item.slug === input.slug);
    if (existing) {
      existing.quantity = Number(existing.quantity || 1) + 1;
    } else {
      state.cart.push({
        id: `${input.family}-${input.slug}`,
        family: input.family,
        slug: input.slug,
        name: input.name,
        image: input.image,
        url: input.url,
        price: input.price ? Number(input.price) : null,
        quantity: 1,
        unit: input.family === "pigmentos" ? "kg" : "kg",
      });
    }
    saveCart();
    renderCart();
  }

  function bindCartButtons(root = document) {
    root.querySelectorAll("[data-cart-add]").forEach((button) => {
      if (button.dataset.cartBound === "true") return;
      button.dataset.cartBound = "true";
      button.addEventListener("click", () => {
        addToCart({
          family: button.dataset.cartFamily,
          slug: button.dataset.cartSlug,
          name: button.dataset.cartName,
          image: button.dataset.cartImage,
          url: button.dataset.cartUrl,
          price: button.dataset.cartPrice,
        });
        const cart = document.querySelector("[data-online-cart]");
        cart?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });
  }

  function renderCart() {
    const itemsHost = document.querySelector("[data-cart-items]");
    const count = document.querySelector("[data-cart-count]");
    const total = document.querySelector("[data-cart-total]");
    const send = document.querySelector("[data-cart-send]");
    if (!itemsHost || !count || !total || !send) return;

    count.textContent = String(state.cart.length);

    if (state.cart.length === 0) {
      itemsHost.innerHTML = `<div class="sales-cart-empty">${TEXT.cartEmpty}</div>`;
      total.textContent = TEXT.totalConsult;
      send.href = `https://wa.me/${WHATSAPP_NUMBER}`;
      send.classList.add("is-disabled");
      return;
    }

    itemsHost.innerHTML = state.cart.map(renderCartLine).join("");
    bindCartControls(itemsHost);

    const knownTotal = state.cart.reduce((sum, item) => {
      const price = Number(item.price);
      if (!Number.isFinite(price) || price <= 0) return sum;
      return sum + price * Number(item.quantity || 1);
    }, 0);
    const hasUnknown = state.cart.some((item) => !item.price);
    total.textContent = knownTotal > 0
      ? TEXT.totalPartial(formatPrice(knownTotal), hasUnknown)
      : TEXT.totalConsult;
    send.href = buildWhatsappUrl(knownTotal, hasUnknown);
    send.classList.remove("is-disabled");
  }

  function renderCartLine(item) {
    const price = item.price ? `$${formatPrice(item.price)} MXN/kg` : TEXT.priceConsult;
    return `
      <article class="sales-cart-line" data-cart-id="${escapeHtml(item.id)}">
        <img src="${escapeHtml(item.image || "/assets/img/logo-circulo.webp")}" alt="${escapeHtml(item.name)}" loading="lazy"/>
        <div>
          <h4>${escapeHtml(item.name)}</h4>
          <small>${escapeHtml(familyLabel(item.family))} · ${price}</small>
          <div class="sales-cart-controls">
            <input type="number" min="0.1" step="0.1" value="${escapeHtml(item.quantity)}" data-cart-quantity aria-label="Cantidad de ${escapeHtml(item.name)}"/>
            <select data-cart-unit aria-label="Unidad de ${escapeHtml(item.name)}">
              <option value="kg"${item.unit === "kg" ? " selected" : ""}>kg</option>
              <option value="g"${item.unit === "g" ? " selected" : ""}>g</option>
              <option value="ton"${item.unit === "ton" ? " selected" : ""}>ton</option>
            </select>
            <button type="button" data-cart-remove aria-label="Quitar ${escapeHtml(item.name)}"><span class="icon-font" aria-hidden="true">delete</span></button>
          </div>
        </div>
      </article>`;
  }

  function bindCartControls(root) {
    root.querySelectorAll("[data-cart-id]").forEach((line) => {
      const item = state.cart.find((entry) => entry.id === line.dataset.cartId);
      if (!item) return;

      line.querySelector("[data-cart-quantity]")?.addEventListener("input", (event) => {
        item.quantity = Math.max(0.1, Number(event.target.value) || 0.1);
        saveCart();
        renderCart();
      });

      line.querySelector("[data-cart-unit]")?.addEventListener("change", (event) => {
        item.unit = event.target.value;
        saveCart();
        renderCart();
      });

      line.querySelector("[data-cart-remove]")?.addEventListener("click", () => {
        state.cart = state.cart.filter((entry) => entry.id !== item.id);
        saveCart();
        renderCart();
      });
    });
  }

  function buildWhatsappUrl(knownTotal, hasUnknown) {
    const lines = [
      TEXT.whatsappOpening,
      ...state.cart.map((item, index) => {
        const price = item.price ? `${formatPrice(item.price)} MXN/kg` : "precio por consultar";
        return `${index + 1}. ${item.name} | ${item.quantity} ${item.unit} | ${price} | ${new URL(item.url, window.location.origin).href}`;
      }),
      knownTotal > 0
        ? TEXT.whatsappTotalKnown(formatPrice(knownTotal), hasUnknown)
        : TEXT.whatsappTotalUnknown,
      TEXT.whatsappClosing,
    ];
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  function bindFilters() {
    document.querySelectorAll("[data-family-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        state.family = button.dataset.familyFilter || "all";
        document.querySelectorAll("[data-family-filter]").forEach((item) => {
          item.classList.toggle("is-active", item === button);
        });
        renderCatalog();
      });
    });

    document.querySelector("[data-online-search]")?.addEventListener("input", (event) => {
      state.query = event.target.value;
      renderCatalog();
    });

    document.querySelector("[data-tone-filter]")?.addEventListener("change", (event) => {
      state.tone = event.target.value;
      renderCatalog();
    });
  }

  bindFilters();
  bindCartButtons();
  loadCatalog();
})();
