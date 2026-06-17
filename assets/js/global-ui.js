const GLOBAL_WHATSAPP_NUMBER = "525573515156";
const GLOBAL_WHATSAPP_ICON = "/assets/img/whatsapp-white.svg";
const CHATBASE_SCRIPT_ID = "syhmjssLBRg1bJZYYj3ag";
const CHATBASE_DOMAIN = "www.chatbase.co";
const CHATBASE_SRC = "https://www.chatbase.co/embed.min.js";

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
    syncPageWhatsapp();
    initMobileNav();
    initFloatingWhatsapp();
    initSharedChatbase();
  });
} else {
  syncPageWhatsapp();
  initMobileNav();
  initFloatingWhatsapp();
  initSharedChatbase();
}
