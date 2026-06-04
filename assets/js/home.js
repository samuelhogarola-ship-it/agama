const AGAMA_POPUP_STORAGE_KEY = "agamaPopupTolucaDismissed";
const PLACEHOLDER_IMAGE = "assets/img/logo-circulo.webp";
const WHATSAPP_NUMBER = "525573515156";
const SUPABASE_CONFIG = window.AGAMA_SUPABASE_CONFIG || null;
const FORM_MIN_SUBMIT_DELAY_MS = 2500;

function dismissAgamaPopup() {
  const popup = document.getElementById("agamaPopupToluca");
  if (popup) {
    popup.hidden = true;
  }

  try {
    localStorage.setItem(AGAMA_POPUP_STORAGE_KEY, "true");
  } catch (error) {
    console.warn("No se pudo guardar el estado del popup.", error);
  }
}

function initAgamaPopup() {
  const popup = document.getElementById("agamaPopupToluca");
  if (!popup) return;

  let dismissed = false;
  try {
    dismissed = localStorage.getItem(AGAMA_POPUP_STORAGE_KEY) === "true";
  } catch (error) {
    dismissed = false;
  }

  popup.hidden = dismissed;

  document.querySelectorAll("[data-dismiss-popup]").forEach((button) => {
    button.addEventListener("click", dismissAgamaPopup);
  });
}

function setBodyScrollLocked(locked) {
  document.body.classList.toggle("is-scroll-locked", locked);
}

function initMobileNav() {
  const modalNav = document.querySelector(".modal-nav-component");
  const openButton = document.querySelector(".brgr");
  const closeButton = document.querySelector(".close.close-btn");

  if (!modalNav || !openButton || !closeButton) return;

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
}

function initMobileAccordion() {
  const header = document.querySelector(".accordion_header.on-mobile");
  const content = document.querySelector(".accordion_display");

  if (!header || !content) return;

  header.addEventListener("click", () => {
    content.classList.toggle("opened");
  });
}

function initDesktopDropdown() {
  const dropdown = document.querySelector(".dropdown-megamenu");
  const toggle = dropdown?.querySelector(".w-dropdown-toggle");
  const list = dropdown?.querySelector(".w-dropdown-list");

  if (!dropdown || !toggle || !list) return;

  const close = () => {
    dropdown.classList.remove("is-open");
    list.classList.remove("w--open");
  };

  const open = () => {
    dropdown.classList.add("is-open");
    list.classList.add("w--open");
  };

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    if (dropdown.classList.contains("is-open")) {
      close();
      return;
    }
    open();
  });

  dropdown.addEventListener("mouseenter", open);
  dropdown.addEventListener("mouseleave", close);

  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) {
      close();
    }
  });
}

function initCurrentYear() {
  const yearSpan = document.querySelector(".current-year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}

function buildWhatsappMessage(data) {
  const lines = [
    "Hola AGAMA, quiero solicitar informacion.",
    `Nombre: ${data.nombre || "-"}`,
    `Empresa: ${data.empresa || "-"}`,
    `Email: ${data.email || "-"}`,
    `Telefono: ${data.telefono || "-"}`,
    `Asunto: ${data.asunto || "-"}`,
    `Mensaje: ${data.mensaje || "-"}`,
  ];

  return encodeURIComponent(lines.join("\n"));
}

function isLocalFallbackHost() {
  return (
    SUPABASE_CONFIG?.localFallbackHosts || []
  ).includes(window.location.hostname);
}

async function saveLocalFallback(key, payload) {
  try {
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    current.push({
      ...payload,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(key, JSON.stringify(current));
    return true;
  } catch (error) {
    return false;
  }
}

async function insertIntoSupabase(table, payload) {
  if (!SUPABASE_CONFIG?.url || !SUPABASE_CONFIG?.publishableKey) {
    throw new Error("Supabase no configurado");
  }

  const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_CONFIG.publishableKey,
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Supabase error ${response.status}`);
  }

  return response.json();
}

function markFormStartTimes() {
  document
    .querySelectorAll("[data-contact-form], [data-newsletter-form]")
    .forEach((form) => {
      form.dataset.startedAt = String(Date.now());
    });
}

function isSpamSubmission(form, honeypotSelector) {
  const honeypotValue = form.querySelector(honeypotSelector)?.value?.trim();
  if (honeypotValue) {
    return true;
  }

  const startedAt = Number(form.dataset.startedAt || 0);
  if (!startedAt) {
    return true;
  }

  return Date.now() - startedAt < FORM_MIN_SUBMIT_DELAY_MS;
}

function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  const successBox = document.getElementById("form-ok");
  const errorBox = document.getElementById("form-fail");

  if (!form || !successBox || !errorBox) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    errorBox.style.display = "none";

    if (isSpamSubmission(form, "#cf-website")) {
      errorBox.hidden = false;
      errorBox.style.display = "block";
      errorBox.querySelector("div").textContent =
        "No pudimos validar el envío. Espera unos segundos y vuelve a intentarlo.";
      return;
    }

    const data = {
      nombre: document.getElementById("cf-nombre")?.value.trim(),
      empresa: document.getElementById("cf-empresa")?.value.trim(),
      email: document.getElementById("cf-email")?.value.trim(),
      telefono: document.getElementById("cf-tel")?.value.trim(),
      asunto: document.getElementById("cf-asunto")?.value.trim(),
      mensaje: document.getElementById("cf-mensaje")?.value.trim(),
    };

    const payload = {
      source: "agama-home",
      name: data.nombre,
      company: data.empresa || null,
      email: data.email,
      phone: data.telefono || null,
      subject: data.asunto || null,
      message: data.mensaje,
      page_path: window.location.pathname,
      user_agent: navigator.userAgent,
    };

    try {
      await insertIntoSupabase(SUPABASE_CONFIG.tables.contacts, payload);
      form.hidden = true;
      successBox.hidden = false;
      successBox.style.display = "block";
      successBox.innerHTML = `
        <div class="icon-font" style="font-size:2rem;color:#1745F5;margin-bottom:.5rem;">thumb_up</div>
        Tu solicitud ya quedó guardada en nuestra base de datos. Te contactaremos lo antes posible.
      `;
    } catch (error) {
      if (isLocalFallbackHost()) {
        const saved = await saveLocalFallback("agama-local-contacts", payload);
        if (saved) {
          form.hidden = true;
          successBox.hidden = false;
          successBox.style.display = "block";
          successBox.innerHTML = `
            <div class="icon-font" style="font-size:2rem;color:#1745F5;margin-bottom:.5rem;">thumb_up</div>
            Guardado en modo local de desarrollo. Cuando actives las tablas en Supabase, este formulario enviará allí automáticamente.
          `;
          return;
        }
      }

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsappMessage(data)}`;
      errorBox.hidden = false;
      errorBox.style.display = "block";
      errorBox.querySelector("div").innerHTML =
        `No pudimos guardar el lead en Supabase todavía. Puedes intentarlo de nuevo o escribirnos por <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">WhatsApp</a>.`;
    }
  });
}

function initNewsletterForm() {
  const form = document.querySelector("[data-newsletter-form]");
  const successBox = document.getElementById("newsletter-ok");
  const errorBox = document.getElementById("newsletter-fail");

  if (!form || !successBox || !errorBox) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    errorBox.style.display = "none";

    if (isSpamSubmission(form, "#nl-website")) {
      errorBox.hidden = false;
      errorBox.style.display = "block";
      errorBox.querySelector("div").textContent =
        "No pudimos validar este registro. Espera unos segundos y vuelve a intentarlo.";
      return;
    }

    const emailInput = form.querySelector('input[type="email"]');
    const payload = {
      source: "agama-home",
      email: emailInput?.value.trim(),
      page_path: window.location.pathname,
      user_agent: navigator.userAgent,
    };

    try {
      await insertIntoSupabase(SUPABASE_CONFIG.tables.newsletter, payload);
      form.hidden = true;
      successBox.hidden = false;
      successBox.style.display = "block";

      const textBlock = successBox.querySelector("div:last-child");
      if (textBlock) {
        textBlock.textContent =
          "Tu correo ya quedó registrado para futuras comunicaciones de AGAMA.";
      }
    } catch (error) {
      if (isLocalFallbackHost()) {
        const saved = await saveLocalFallback("agama-local-newsletter", payload);
        if (saved) {
          form.hidden = true;
          successBox.hidden = false;
          successBox.style.display = "block";

          const textBlock = successBox.querySelector("div:last-child");
          if (textBlock) {
            textBlock.textContent =
              "Registro guardado en modo local de desarrollo. Cuando el entorno esté conectado, este correo pasará a guardarse en Supabase.";
          }
          return;
        }
      }

      const textBlock = successBox.querySelector("div:last-child");
      errorBox.hidden = false;
      errorBox.style.display = "block";
      errorBox.querySelector("div").innerHTML =
        "No pudimos registrar este correo en Supabase todavía. Prueba de nuevo en unos minutos o contáctanos por WhatsApp.";
      successBox.hidden = true;
      successBox.style.display = "none";
    }
  });
}

function initImageFallbacks() {
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        if (img.dataset.placeholderApplied === "true") return;
        img.dataset.placeholderApplied = "true";
        img.removeAttribute("srcset");
        img.src = PLACEHOLDER_IMAGE;
        img.classList.add("is-placeholder");
      },
      { once: true }
    );
  });
}

window.dismissAgamaPopup = dismissAgamaPopup;

document.addEventListener("DOMContentLoaded", () => {
  initAgamaPopup();
  initMobileNav();
  initMobileAccordion();
  initDesktopDropdown();
  initCurrentYear();
  markFormStartTimes();
  initContactForm();
  initNewsletterForm();
  initImageFallbacks();
});
