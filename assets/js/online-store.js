(() => {
  const WHATSAPP_NUMBER = "525573515156";

  const copy = {
    es: {
      opening: "Hola AGAMA, quiero solicitar una cotización:",
      family: "Familia",
      product: "Producto o necesidad",
      quantity: "Cantidad",
      process: "Proceso",
      resin: "Resina",
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
      resin: "Resin",
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
    const catalogProducts = locale === "en" ? {
      Pigments: ["BP-1019 Black Smoke Crystal", "Yellow pigment", "Red pigment", "Blue pigment"],
      Masterbatch: ["MB-115 Glossy Kalo Black", "MB-120 Shalom White", "MB-124 Lime Green", "MB-106 Royal Blue", "MB-122 Coca Red"],
      Additives: ["AD-304 UV Protector", "AD-305 Slip mould-release", "AD-318 Plastic purge", "AD-321 Moisture absorber", "AD-309 Granulated mould-release"],
    } : {
      Pigmentos: ["BP-1019 Negro Humo Cristal", "Pigmento amarillo", "Pigmento rojo", "Pigmento azul"],
      Masterbatch: ["MB-115 Negro Kalo Brillante", "MB-120 Blanco Shalom", "MB-124 Verde Limón", "MB-106 Azul Rey", "MB-122 Rojo Coca"],
      Aditivos: ["AD-304 Protector UV", "AD-305 Slip desmoldante", "AD-318 Purga para plástico", "AD-321 Absorbente de humedad", "AD-309 Desmoldante granulado"],
    };
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
      if (data.get("resin")) lines.push(`- ${messages.resin}: ${data.get("resin")}`);
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

      document.addEventListener("click", (event) => {
        if (!details.open || details.contains(event.target)) return;
        details.removeAttribute("open");
      });

      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !details.open) return;
        details.removeAttribute("open");
        details.querySelector("summary")?.focus();
      });
    });
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

  document.querySelectorAll("[data-quick-quote]").forEach(initQuickQuote);
  initProductShortcuts();
  initSalesDetailsDisclosures();
  initOnlineProductShowcase();
})();
