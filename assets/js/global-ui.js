const GLOBAL_WHATSAPP_NUMBER = "525548604275";
const GLOBAL_WHATSAPP_ICON = "/assets/img/whatsapp-white.svg";
const CHATBASE_SCRIPT_ID = "syhmjssLBRg1bJZYYj3ag";
const CHATBASE_DOMAIN = "www.chatbase.co";
const CHATBASE_SRC = "https://www.chatbase.co/embed.min.js";
const MAX_BROWSER_TIMEOUT_MS = 2_147_483_647;
const WHATSAPP_NOTICE = Object.freeze({
  campaignId: "whatsapp-2026-10",
  expiresAt: Date.parse("2026-11-01T06:00:00Z"),
  href: "https://wa.me/525548604275",
  routes: new Set([
    "/",
    "/index.en.html",
    "/contacto/",
    "/contacto/index.en.html",
    "/puntosdeventa/",
    "/puntosdeventa/index.en.html",
    ...[
      "chalco",
      "cuautitlan",
      "ecatepec",
      "ermita",
      "guadalajara",
      "leon",
      "merced",
      "monterrey",
      "pantitlan",
      "puebla",
      "queretaro",
      "san-luis-potosi",
      "texcoco",
      "tlahuac",
      "toluca",
      "zaragoza",
    ].flatMap((slug) => [
      `/puntosdeventa/${slug}/`,
      `/puntosdeventa/${slug}/index.en.html`,
    ]),
    "/filiales/online/",
    "/filiales/online/index.en.html",
  ]),
  copy: {
    es: {
      heading: "Aviso importante · Nuevo WhatsApp de AGAMA",
      messageBefore: "Desde ahora, escríbenos al ",
      messageAfter:
        ". El número terminado en 5156 ya no pertenece a AGAMA. Atención únicamente por mensajes; no llamadas ni videollamadas.",
      cta: "Abrir WhatsApp",
      ctaLabel: "Abrir WhatsApp de AGAMA en una ventana nueva",
      close: "Cerrar aviso",
    },
    en: {
      heading: "Important notice · AGAMA has a new WhatsApp number",
      messageBefore: "From now on, message us at ",
      messageAfter:
        ". The previous number ending in 5156 no longer belongs to AGAMA. Messages only; no phone or video calls.",
      cta: "Open WhatsApp",
      ctaLabel: "Open WhatsApp (AGAMA) in a new window",
      close: "Dismiss notice",
    },
  },
});

function getMexicoCityDay(date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function isWhatsappNoticeRoute(pathname) {
  let normalizedPath = pathname.endsWith("/index.en") || pathname === "/index.en"
    ? `${pathname}.html`
    : pathname;

  if (normalizedPath === "/index.html") {
    normalizedPath = "/";
  } else if (normalizedPath.endsWith("/index.html")) {
    normalizedPath = normalizedPath.slice(0, -"index.html".length);
  }

  if (normalizedPath !== "/" && !normalizedPath.includes(".") && !normalizedPath.endsWith("/")) {
    normalizedPath = `${normalizedPath}/`;
  }

  return WHATSAPP_NOTICE.routes.has(normalizedPath);
}

function initWhatsappNumberNotice(now = new Date()) {
  if (!document.body || !isWhatsappNoticeRoute(window.location.pathname)) return;
  if (now.getTime() >= WHATSAPP_NOTICE.expiresAt) return;
  if (document.querySelector(".whatsapp-number-notice")) return;

  const dismissalKey = `agama:notice:${WHATSAPP_NOTICE.campaignId}:dismissed-on`;
  const mexicoDay = getMexicoCityDay(now);

  try {
    if (window.localStorage.getItem(dismissalKey) === mexicoDay) return;
  } catch {
    // Storage can be disabled; the notice must remain usable without it.
  }

  const language =
    window.location.pathname.endsWith("index.en.html") ||
    document.documentElement.lang.toLowerCase().startsWith("en")
      ? "en"
      : "es";
  const copy = WHATSAPP_NOTICE.copy[language];
  const headingId = `whatsapp-number-notice-${language}`;

  const notice = document.createElement("section");
  notice.className = "whatsapp-number-notice";
  notice.setAttribute("role", "region");
  notice.setAttribute("aria-labelledby", headingId);

  const inner = document.createElement("div");
  inner.className = "whatsapp-number-notice__inner";

  const mark = document.createElement("span");
  mark.className = "whatsapp-number-notice__mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = "!";

  const content = document.createElement("div");
  content.className = "whatsapp-number-notice__content";

  const heading = document.createElement("h2");
  heading.id = headingId;
  heading.className = "whatsapp-number-notice__heading";
  heading.textContent = copy.heading;

  const message = document.createElement("p");
  message.className = "whatsapp-number-notice__message";
  message.append(copy.messageBefore);
  const phone = document.createElement("strong");
  phone.textContent = "+52 55 4860 4275";
  message.append(phone, copy.messageAfter);

  const cta = document.createElement("a");
  cta.className = "whatsapp-number-notice__cta";
  cta.href = WHATSAPP_NOTICE.href;
  cta.target = "_blank";
  cta.rel = "noopener noreferrer";
  cta.setAttribute("aria-label", copy.ctaLabel);

  const ctaIcon = document.createElement("img");
  ctaIcon.src = GLOBAL_WHATSAPP_ICON;
  ctaIcon.alt = "";
  ctaIcon.width = 20;
  ctaIcon.height = 20;
  cta.append(ctaIcon, copy.cta);

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "whatsapp-number-notice__close";
  closeButton.setAttribute("aria-label", copy.close);
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => {
    try {
      window.localStorage.setItem(dismissalKey, getMexicoCityDay(new Date()));
    } catch {
      // The close action still works for the current page without storage.
    }
    notice.remove();
  });

  const scheduleExpiryRemoval = () => {
    const remaining = WHATSAPP_NOTICE.expiresAt - Date.now();
    if (remaining <= 0) {
      notice.remove();
      return;
    }

    window.setTimeout(scheduleExpiryRemoval, Math.min(remaining, MAX_BROWSER_TIMEOUT_MS));
  };
  scheduleExpiryRemoval();

  content.append(heading, message);
  inner.append(mark, content, cta, closeButton);
  notice.appendChild(inner);

  const pageWrapper = document.querySelector(".page-wrapper");
  const fixedNav = pageWrapper?.querySelector(".nav-fixed");
  const main = document.querySelector("main");

  if (fixedNav?.parentNode) {
    fixedNav.parentNode.insertBefore(notice, fixedNav.nextSibling);
  } else if (main?.parentNode) {
    main.parentNode.insertBefore(notice, main);
  }
}

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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initWhatsappNumberNotice();
    syncPageWhatsapp();
    initMobileNav();
    initFloatingWhatsapp();
    initSharedChatbase();
  });
} else {
  initWhatsappNumberNotice();
  syncPageWhatsapp();
  initMobileNav();
  initFloatingWhatsapp();
  initSharedChatbase();
}
