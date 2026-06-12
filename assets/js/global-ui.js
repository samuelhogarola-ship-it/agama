const GLOBAL_WHATSAPP_NUMBER = "525573515156";
const GLOBAL_WHATSAPP_ICON = "/assets/img/whatsapp-white.svg";
const CHATBASE_SCRIPT_ID = "syhmjssLBRg1bJZYYj3ag";
const CHATBASE_DOMAIN = "www.chatbase.co";
const CHATBASE_SRC = "https://www.chatbase.co/embed.min.js";

function initFloatingWhatsapp() {
  if (!document.body) return;

  const existingHolders = Array.from(document.querySelectorAll(".mesenger-hldr"));
  const holder =
    existingHolders[0] || document.createElement("div");

  existingHolders.slice(1).forEach((duplicate) => duplicate.remove());
  holder.className = "mesenger-hldr";
  holder.replaceChildren();

  const link = document.createElement("a");

  link.href = `https://wa.me/${GLOBAL_WHATSAPP_NUMBER}`;
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

function initFilialesChatbase() {
  if (!window.location.pathname.includes("/filiales/")) return;

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
    initFloatingWhatsapp();
    initFilialesChatbase();
  });
} else {
  initFloatingWhatsapp();
  initFilialesChatbase();
}
