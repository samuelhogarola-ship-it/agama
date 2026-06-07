const AGAMA_POPUP_STORAGE_KEY = "agamaPopupTolucaDismissed";
const PLACEHOLDER_IMAGE = "assets/img/logo-circulo.webp";
const WHATSAPP_NUMBER = "525573515156";
const SUPABASE_CONFIG = window.AGAMA_SUPABASE_CONFIG || null;
const FORM_MIN_SUBMIT_DELAY_MS = 2500;

function parseSupabaseError(errorText, status) {
  if (!errorText) {
    return {
      status,
      message: `Supabase error ${status}`,
    };
  }

  try {
    const parsed = JSON.parse(errorText);
    return {
      status,
      ...parsed,
      message: parsed.message || parsed.error_description || parsed.error || errorText,
    };
  } catch (error) {
    return {
      status,
      message: errorText,
    };
  }
}

function isDuplicateEmailError(error) {
  const errorCode = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();
  const details = String(error?.details || "").toLowerCase();

  return (
    errorCode === "23505" ||
    message.includes("duplicate key") ||
    details.includes("already exists") ||
    details.includes("duplicate")
  );
}

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

function initHeroVideo() {
  const video = document.querySelector("[data-home-hero-video]");
  if (!video) return;

  const shouldLoadVideo =
    window.matchMedia("(min-width: 992px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!shouldLoadVideo) {
    video.remove();
    return;
  }

  const loadVideo = () => {
    if (video.dataset.loaded === "true") return;

    video.querySelectorAll("source[data-src]").forEach((source) => {
      source.src = source.dataset.src;
      source.removeAttribute("data-src");
    });

    video.dataset.loaded = "true";
    video.load();
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadVideo, { timeout: 1500 });
    return;
  }

  window.setTimeout(loadVideo, 800);
}

function initFloatingWhatsapp() {
  if (!document.body || document.querySelector(".mesenger-hldr")) return;

  const holder = document.createElement("div");
  holder.className = "mesenger-hldr";

  const link = document.createElement("a");
  link.href = `https://wa.me/${WHATSAPP_NUMBER}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "messenger w-inline-block";
  link.setAttribute("aria-label", "Escribir por WhatsApp");

  const image = document.createElement("img");
  image.src = "/assets/img/whatsapp-white.svg";
  image.alt = "WhatsApp";
  image.loading = "lazy";

  link.appendChild(image);
  holder.appendChild(link);
  document.body.appendChild(holder);
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

  try {
    const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        apikey: SUPABASE_CONFIG.publishableKey,
        Authorization: `Bearer ${SUPABASE_CONFIG.publishableKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw parseSupabaseError(errorText, response.status);
    }

    return response.json();
  } catch (restError) {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
    const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey);
    const { data, error } = await supabase.from(table).insert([payload]).select();

    if (error) {
      throw error;
    }

    return data;
  }
}

async function notifySubmission(table, record) {
  if (!SUPABASE_CONFIG?.url) return;

  try {
    await fetch(`${SUPABASE_CONFIG.url}/functions/v1/notify-contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "INSERT",
        table,
        record: {
          ...record,
          created_at: record.created_at || new Date().toISOString(),
        },
      }),
    });
  } catch (error) {
    console.warn(`[AGAMA notify] No se pudo notificar ${table}.`, error);
  }
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
      void notifySubmission(SUPABASE_CONFIG.tables.contacts, payload);
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
  const newsletterMessages = {
    es: {
      spam: "No pudimos validar este registro. Espera unos segundos y vuelve a intentarlo.",
      success:
        "Tu correo ya quedó registrado. Te avisaremos cuando publiquemos nuevas entradas del blog AGAMA.",
      duplicate:
        "Este correo ya estaba suscrito al boletin de AGAMA. Te seguiremos avisando cuando publiquemos nuevas entradas.",
      localFallback:
        "Registro guardado en modo local de desarrollo. Cuando el entorno esté conectado, este correo pasará a guardarse en Supabase.",
      error:
        "No pudimos registrar este correo en Supabase todavía. Prueba de nuevo en unos minutos o contáctanos por WhatsApp.",
    },
    en: {
      spam: "We could not validate this signup yet. Wait a few seconds and try again.",
      success:
        "Your email is now registered. We will let you know when new AGAMA blog posts go live.",
      duplicate:
        "This email was already subscribed to the AGAMA newsletter. We will keep notifying you about new posts.",
      localFallback:
        "Saved in local development mode. Once the environment is connected, this email will be stored in Supabase automatically.",
      error:
        "We could not register this email in Supabase right now. Please try again in a few minutes or contact us on WhatsApp.",
    },
  };

  const getNewsletterLocale = (form) => {
    const langSource =
      form.dataset.lang ||
      document.documentElement.lang ||
      window.navigator.language ||
      "es";

    return langSource.toLowerCase().startsWith("en") ? "en" : "es";
  };

  document.querySelectorAll("[data-newsletter-form]").forEach((form) => {
    const scope = form.closest(".form-block") || form.parentElement || document;
    const successBox =
      scope.querySelector(".newsletter-success") ||
      scope.querySelector("#newsletter-ok");
    const errorBox =
      scope.querySelector(".newsletter-error") ||
      scope.querySelector("#newsletter-fail");

    if (!successBox || !errorBox) {
      console.warn("[AGAMA newsletter] Missing success/error container.", {
        source: form.dataset.newsletterSource || null,
        lang: form.dataset.lang || document.documentElement.lang || null,
        scope,
      });
      return;
    }

    form.addEventListener("submit", async (event) => {
      const locale = getNewsletterLocale(form);
      const copy = newsletterMessages[locale];
      const errorTextNode =
        errorBox.querySelector("div") || errorBox.querySelector("span") || errorBox;

      event.preventDefault();
      errorBox.hidden = true;
      errorBox.style.display = "none";

      if (isSpamSubmission(form, ".nl-honeypot, #nl-website")) {
        errorBox.hidden = false;
        errorBox.style.display = "block";
        errorTextNode.textContent = copy.spam;
        return;
      }

      const emailInput = form.querySelector('input[type="email"]');
      const source = form.dataset.newsletterSource?.trim() || "agama-home";
      const payload = {
        source,
        email: emailInput?.value.trim(),
        page_path: window.location.pathname,
        user_agent: navigator.userAgent,
      };

      try {
        await insertIntoSupabase(SUPABASE_CONFIG.tables.newsletter, payload);
        void notifySubmission(SUPABASE_CONFIG.tables.newsletter, payload);
        form.hidden = true;
        successBox.hidden = false;
        successBox.style.display = "block";

        const textBlock = successBox.querySelector("div:last-child") || successBox;
        textBlock.textContent = copy.success;
      } catch (error) {
        if (isDuplicateEmailError(error)) {
          form.hidden = true;
          successBox.hidden = false;
          successBox.style.display = "block";

          const textBlock = successBox.querySelector("div:last-child") || successBox;
          textBlock.textContent = copy.duplicate;
          return;
        }

        if (isLocalFallbackHost()) {
          const saved = await saveLocalFallback("agama-local-newsletter", payload);
          if (saved) {
            form.hidden = true;
            successBox.hidden = false;
            successBox.style.display = "block";

            const textBlock = successBox.querySelector("div:last-child") || successBox;
            textBlock.textContent = copy.localFallback;
            return;
          }
        }

        errorBox.hidden = false;
        errorBox.style.display = "block";
        errorTextNode.textContent = copy.error;
        successBox.hidden = true;
        successBox.style.display = "none";
      }
    });
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
  initHeroVideo();
  initMobileNav();
  initMobileAccordion();
  initDesktopDropdown();
  initCurrentYear();
  initFloatingWhatsapp();
  markFormStartTimes();
  initContactForm();
  initNewsletterForm();
  initImageFallbacks();
});
