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

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const unit = selectedText(form.elements.unit);
      const process = selectedText(form.elements.process);
      const lines = [
        messages.opening,
        `- ${messages.family}: ${data.get("family")}`,
        `- ${messages.product}: ${data.get("product")}`,
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
        form.elements.product.value = product;

        const locale = form.dataset.locale === "en" ? "en" : "es";
        const status = form.querySelector("[data-quote-status]");
        if (status) status.textContent = copy[locale].selected;

        window.setTimeout(() => form.elements.quantity.focus(), 50);
      });
    });
  }

  document.querySelectorAll("[data-quick-quote]").forEach(initQuickQuote);
  initProductShortcuts();
})();
