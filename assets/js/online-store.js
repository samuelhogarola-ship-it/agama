(() => {
  const WHATSAPP_NUMBER = "525573515156";

  const copy = {
    es: {
      opening: "Hola AGAMA, quiero solicitar una cotización:",
      family: "Familia",
      product: "Producto o necesidad",
      quantity: "Cantidad",
      process: "Proceso",
      location: "Entrega en",
      closing: "¿Me confirman disponibilidad, precio y opciones de envío?",
      ready: "Abriendo tu solicitud preparada en WhatsApp.",
      selected: "Producto añadido a la cotización. Completa cantidad y entrega.",
    },
    en: {
      opening: "Hello AGAMA, I would like to request a quote:",
      family: "Product family",
      product: "Product or requirement",
      quantity: "Quantity",
      process: "Process",
      location: "Delivery location",
      closing: "Please confirm availability, price, and shipping options.",
      ready: "Opening your prepared request in WhatsApp.",
      selected: "Product added to the quote. Complete quantity and delivery.",
    },
  };

  function selectedText(field) {
    if (!field) return "";
    if (field.tagName === "SELECT") {
      return field.options[field.selectedIndex]?.text?.trim() || "";
    }
    return field.value?.trim() || "";
  }

  function initQuickQuote(form) {
    const locale = form.dataset.locale === "en" ? "en" : "es";
    const messages = copy[locale];
    const status = form.querySelector("[data-quote-status]");
    const catalog = form.querySelector("[data-quote-catalog]");
    const customRequest = form.querySelector("[data-quote-custom]");
    const productInput = form.elements.product;
    const catalogSlugs = {
      Pigmentos: ["bp-028-pig-magenta","bp-033-pig-beige","bp-034-pig-beige-militar","bp-037-pig-cafe-passau","bp-060-pig-rosa-pastel-claro","bp-061-pig-rosa-carne-medio","bp-065-pig-verde-fluorescente","bp-080-pig-azul-rey","bp-1000-pig-rojo-cristal","bp-1001-pig-amarillo-cristal","bp-1003-pig-amarillo-cristal-rojizo","bp-1005-pig-naranja-cristal","bp-1007-pig-magenta-cristal","bp-1009-pig-azul-cristal","bp-101-pig-guinda-morena","bp-1012-pig-naranja-cristal-fluorescente","bp-1013-pig-rojo-cristal-fluorescente","bp-1014-pig-verde-cristal-fluorescente","bp-1015-pig-verde-cristal","bp-1016-pig-verde-cristal","bp-1018-pig-ambar-oscuro","bp-1019-pig-negro-humo-cristal","bp-1020-pig-morado-cristal","bp-1022-pig-verde-bandera-cristal","bp-1023-pig-azul-cristal","bp-106-pig-blanco-304","bp-107-pig-blanco-brillante","bp-109-pig-naranja-brillante","bp-110-pig-amarilo-huevo","bp-111-pig-rojo-chapulin","bp-114-pig-rojo-bandera","bp-115-pig-morado-101","bp-116-pig-morado-104","bp-127-pig-verde-electrico","bp-131-pig-naranja-fluorescente","bp-142-pig-azul-190","bp-144-pig-uva","bp-151-pig-azul-pastel","bp-153-pig-amarillo-electrico","bp-160-pig-azul-2000","bp-169-pig-gris","bp-174-pig-naranja-moy","bp-193-pig-marfil","bp-194-pig-amarillo-canario","bp-195-pig-blanco-104","bp-198-pig-rosa-especial","bp-208-pig-azul-tapa","bp-211-pig-gris-claro","bp-2228-pig-negro-brillante","bp-2248-pig-verde-pistache","bp-231-pig-azul-medio","bp-232-pig-blanco-204","bp-2497-pig-amarillo-pastel","bp-2502-pig-amarillo-clasico","bp-2505-pig-marfil-ii","bp-2513-pig-negro-ultrafino","bp-273-pig-gris-medio","bp-274-pig-gris-fuerte","bp-277-pig-rosa-mexicano","bp-279-pig-verde-cascada","bp-382-pig-marfil-hueso","bp-418-pig-verde-militar","bp-645-pig-rosa-solferino","bp-792-pig-verde-bandera"],
      Masterbatch: ["mb-101-mb-amarillo-huevo","mb-102-mb-amarillo-canario","mb-103-mb-amarillo-electrico","mb-104-mb-azul-pastel-claro","mb-105-mb-deslizante","mb-106-mb-azul-rey","mb-107-mb-aluminio","mb-109-mb-cafe","mb-110-mb-negro-kalo-economico","mb-111-mb-morado","mb-112-mb-naranja-brillante","mb-113-mb-rosa-pastel","mb-114-mb-naranja-fluorescente","mb-115-mb-negro-kalo-brillante","mb-116-mb-rojo-bandera","mb-117-mb-azul-juguete","mb-118-mb-verde-cascada","mb-119-mb-rosa-solferino","mb-120-mb-blanco-shalom","mb-121-mb-verde-electrico","mb-122-mb-rojo-coca","mb-123-mb-gris-claro","mb-124-mb-verde-limon","mb-125-mb-azul-pelicula-intenso","mb-126-mb-amarillo-pelicula-intenso","mb-127-mb-naranja-pelicula-intenso","mb-128-mb-verde-carioca","mb-131-mb-amarillo-clasico","mb-132-mb-morado-101","mb-137-mb-gris-medio","mb-138-mb-negro-kalo-premium","mb-148-mb-beige-marburgo","mb-149-mb-gris-fuerte","mb-150-mb-cafe-barro","mb-151-mb-cafe-maceta","mb-152-mb-terracota","mb-153-mb-cafe-chocolate","mb-154-mb-azul-bucarest","mb-155-mb-beige-bonn-militar","mb-171-mb-verde-bandera","mb-179-mb-amarillo-juguete","mb-180-mb-verde-juguete","mb-184-mb-morado-104","mb-189-mb-azul-molto","mb-195-mb-azul-tapa","mb-200-mb-deslizante-alta-transparencia","mb-201-mb-guinda-morena","mb-210-mb-rojo-pelicula","mb-221-mb-verde-pelicula","mb-225-mb-azul-lazo","mb-231-mb-rojo-lazo","mb-233-mb-naranja-especial"],
      Aditivos: ["ad-301-expanso-raywan","ad-302-pasta-de-silicon","ad-303-base-macro-en-polvo","ad-304-protector-uv","ad-305-slip-desmoldante-en-polvo","ad-307-serie-nb","ad-308-lubiwax","ad-309-desmoldante-granulado","ad-310-desmoldante-con-silicon","ad-311-protector-de-moldes","ad-312-limpiador-de-moldes","ad-313-perla-natural","ad-314-base-macro-batch","ad-315-phenil-o","ad-316-w-slip","ad-317-estearato-de-zinc","ad-318-purga","ad-320-desmoldante-sin-silicon","ad-321-secante-de-humedad"]
    };
    const catalogProducts = Object.fromEntries(Object.entries(catalogSlugs).map(([family, slugs]) => [
      locale === "en" ? ({ Pigmentos: "Pigments", Masterbatch: "Masterbatch", Aditivos: "Additives" }[family]) : family,
      slugs.map((slug) => slug.replace(/^(bp|mb|ad)-/, (m, p) => `${p.toUpperCase()}-`).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    ]));
    const chooseCategory = locale === "en" ? "Choose a category first" : "Primero elige una categoría";
    const chooseProduct = locale === "en" ? "Choose a product" : "Elige un producto";
    const noProduct = locale === "en" ? "Choose a product or tell us what you need." : "Elige un producto o escribe qué necesitas.";

    function populateCatalog() {
      if (!catalog) return;
      const family = form.querySelector('input[name="family"]:checked')?.value;
      const products = catalogProducts[family] || [];
      catalog.replaceChildren(new Option(products.length ? chooseProduct : chooseCategory, ""));
      products.forEach((product) => catalog.add(new Option(product, product)));
      catalog.disabled = !products.length;
      if (!products.length && family && customRequest) customRequest.open = true;
    }

    form.querySelectorAll('input[name="family"]').forEach((input) => {
      input.addEventListener("change", populateCatalog);
    });

    catalog?.addEventListener("change", () => {
      if (catalog.value) {
        productInput.value = catalog.value;
        if (customRequest) customRequest.open = false;
      }
    });

    customRequest?.addEventListener("toggle", () => {
      if (customRequest.open) {
        if (catalog) catalog.value = "";
        window.setTimeout(() => productInput?.focus(), 0);
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const product = catalog?.value || productInput?.value?.trim();
      if (!product) {
        if (status) status.textContent = noProduct;
        customRequest?.setAttribute("open", "");
        return;
      }
      const unit = selectedText(form.elements.unit);
      const process = selectedText(form.elements.process);
      const lines = [
        messages.opening,
        `- ${messages.family}: ${data.get("family")}`,
        `- ${messages.product}: ${product}`,
        `- ${messages.quantity}: ${data.get("quantity")} ${unit}`,
      ];

      if (process) lines.push(`- ${messages.process}: ${process}`);
      lines.push(`- ${messages.location}: ${data.get("location")}`);
      lines.push("", messages.closing);

      const whatsappUrl =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;

      if (status) status.textContent = messages.ready;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "agama_quick_quote",
        quote_family: data.get("family"),
        quote_process: process,
      });
      const whatsappWindow = window.open(
        whatsappUrl,
        "_blank",
        "noopener,noreferrer"
      );
      if (!whatsappWindow) window.location.href = whatsappUrl;
    });
  }

  function initProductShortcuts() {
    document.querySelectorAll("[data-quote-product]").forEach((shortcut) => {
      shortcut.addEventListener("click", () => {
        const form = document.querySelector("[data-quick-quote]");
        if (!form) return;

        const family = shortcut.dataset.quoteFamily;
        const product = shortcut.dataset.quoteProduct;
        const familyInput = Array.from(form.elements.family || []).find(
          (input) => input.value === family
        );

        if (familyInput) familyInput.checked = true;
        familyInput?.dispatchEvent(new Event("change", { bubbles: true }));
        form.elements.product.value = product;
        form.querySelector("[data-quote-custom]")?.setAttribute("open", "");

        const locale = form.dataset.locale === "en" ? "en" : "es";
        const status = form.querySelector("[data-quote-status]");
        if (status) status.textContent = copy[locale].selected;

        window.setTimeout(() => form.elements.quantity.focus(), 50);
      });
    });
  }

  function initSalesDetailsDisclosures() {
    document.querySelectorAll("[data-sales-details]").forEach((details) => {
      const closeButton = details.querySelector("[data-sales-details-close]");

      closeButton?.addEventListener("click", () => {
        details.removeAttribute("open");
        details.querySelector("summary")?.focus();
      });
    });
  }

  function initPigmentShowcase() {
    const image = document.querySelector("[data-pigment-image]");
    if (!image || image.dataset.pigmentInitialized === "true") return;

    const sources = (image.dataset.pigmentImages || image.getAttribute("src") || "")
      .split("|")
      .map((source) => source.trim())
      .filter(Boolean);
    const alts = (image.dataset.pigmentAlts || "")
      .split("|")
      .map((alt) => alt.trim());
    if (sources.length < 2) return;

    image.dataset.pigmentInitialized = "true";
    let index = Math.max(0, sources.indexOf(image.getAttribute("src")));

    const rotate = () => {
      index = (index + 1) % sources.length;
      const nextSource = sources[index];
      image.classList.add("is-switching");
      const preload = new Image();
      const finish = () => {
        image.src = nextSource;
        if (alts[index]) image.alt = alts[index];
        image.classList.remove("is-switching");
      };
      preload.onload = finish;
      preload.onerror = () => image.classList.remove("is-switching");
      preload.src = nextSource;
    };

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.setInterval(rotate, 4000);
    }
  }

  function initOnlineProductShowcase() {
    const showcase = document.querySelector("[data-online-products]");
    if (!showcase) return;

    const stage = showcase.querySelector(".sales-kalo-stage");
    const title = showcase.querySelector("[data-kalo-title]");
    const text = showcase.querySelector("[data-kalo-text]");
    const code = showcase.querySelector("[data-kalo-code]");
    const image = showcase.querySelector("[data-kalo-image]");
    const media = showcase.querySelector("[data-kalo-media]");
    const detailLink = showcase.querySelector("[data-kalo-link]");
    const tabs = Array.from(showcase.querySelectorAll("[data-kalo-tab]"));
    const additiveSlides = Array.from(showcase.querySelectorAll(".sales-additive-slide"));
    let kaloIndex = Math.max(0, tabs.findIndex((tab) => tab.classList.contains("is-active")));
    let additiveIndex = Math.max(0, additiveSlides.findIndex((slide) => slide.classList.contains("is-active")));
    let kaloTimer = null;
    const kaloTones = { "MB-115": "black", "MB-124": "green", "MB-106": "blue", "MB-122": "red" };
    if (tabs[kaloIndex]) {
      stage?.setAttribute("data-active-kalo", tabs[kaloIndex].dataset.code || "");
      stage?.setAttribute("data-kalo-tone", kaloTones[tabs[kaloIndex].dataset.code] || "black");
    }

    function setKalo(index) {
      const tab = tabs[index];
      if (!tab || !title || !text || !code || !image || !media || !detailLink) return;

      if (tab.classList.contains("is-active") && image.src === tab.dataset.image) return;

      tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      tabs.forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
      stage?.setAttribute("data-active-kalo", tab.dataset.code || "");
      stage?.setAttribute("data-kalo-tone", kaloTones[tab.dataset.code] || "black");
      stage?.classList.add("is-switching");

      const slug = tab.dataset.slug;
      const href = `/productos/masterbatch/${slug}/`;
      const nextImage = tab.dataset.image || "";
      const nextAlt = `${tab.dataset.code || ""} ${tab.dataset.title || ""}`.trim();

      title.textContent = tab.dataset.title || "";
      text.textContent = tab.dataset.text || "";
      code.textContent = tab.dataset.code || "";
      media.href = href;
      detailLink.href = href;
      const finish = () => {
        image.src = nextImage;
        image.alt = nextAlt;
        stage?.classList.remove("is-switching");
      };

      if (!nextImage) {
        finish();
        return;
      }

      const loader = new Image();
      const fallback = window.setTimeout(finish, 520);
      loader.onload = () => {
        window.clearTimeout(fallback);
        finish();
      };
      loader.onerror = () => {
        window.clearTimeout(fallback);
        finish();
      };
      loader.src = nextImage;
    }

    function setAdditive(index) {
      const nextSlide = additiveSlides[index];
      const currentSlide = additiveSlides[additiveIndex];
      if (!nextSlide || nextSlide === currentSlide) return;

      additiveSlides.forEach((slide) => slide.classList.remove("is-leaving"));
      currentSlide?.classList.remove("is-active");
      currentSlide?.classList.add("is-leaving");
      nextSlide.classList.add("is-active");

      window.setTimeout(() => currentSlide?.classList.remove("is-leaving"), 800);
    }

    tabs.forEach((tab, index) => {
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(tab.classList.contains("is-active")));
      tab.addEventListener("click", () => {
        kaloIndex = index;
        setKalo(kaloIndex);
        if (kaloTimer) window.clearInterval(kaloTimer);
      });
    });

    if (tabs.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      kaloTimer = window.setInterval(() => {
        kaloIndex = (kaloIndex + 1) % tabs.length;
        setKalo(kaloIndex);
      }, 4000);
    }

    if (additiveSlides.length > 1) {
      window.setInterval(() => {
        const nextIndex = (additiveIndex + 1) % additiveSlides.length;
        setAdditive(nextIndex);
        additiveIndex = nextIndex;
      }, 4200);
    }
  }

  function initColourViewerDevice() {
    const device = document.querySelector("[data-colour-viewer-device]");
    if (!device) return;

    const product = device.querySelector("[data-viewer-product]");
    const code = device.querySelector("[data-viewer-code]");
    const swatches = Array.from(device.querySelectorAll("[data-viewer-swatch]"));
    if (!product || !code || swatches.length < 2) return;

    let index = Math.max(0, swatches.findIndex((swatch) => swatch.classList.contains("is-active")));
    let hasStarted = false;

    const setColour = (nextIndex) => {
      const swatch = swatches[nextIndex];
      if (!swatch || nextIndex === index) return;

      const nextImage = swatch.dataset.image || "";
      swatches.forEach((item) => item.classList.toggle("is-active", item === swatch));
      code.textContent = swatch.dataset.code || "";
      product.classList.add("is-changing");

      const finish = () => {
        if (nextImage) product.src = nextImage;
        product.alt = swatch.dataset.name || "";
        product.classList.remove("is-changing");
        index = nextIndex;
      };

      if (!nextImage) {
        window.setTimeout(finish, 180);
        return;
      }

      const preload = new Image();
      const fallback = window.setTimeout(finish, 380);
      preload.onload = () => {
        window.clearTimeout(fallback);
        window.setTimeout(finish, 120);
      };
      preload.onerror = () => {
        window.clearTimeout(fallback);
        finish();
      };
      preload.src = nextImage;
    };

    const showDevice = () => {
      device.classList.add("is-visible");
      if (hasStarted || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      hasStarted = true;
      window.setInterval(() => {
        setColour((index + 1) % swatches.length);
      }, 2000);
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        showDevice();
        observer.disconnect();
      }, { threshold: 0.28 });
      observer.observe(device);
    } else {
      showDevice();
    }
  }

  document.querySelectorAll("[data-quick-quote]").forEach(initQuickQuote);
  initProductShortcuts();
  initSalesDetailsDisclosures();
  initPigmentShowcase();
  initOnlineProductShowcase();
  initColourViewerDevice();
})();
