const GLOBAL_WHATSAPP_NUMBER = "525573515156";
const GLOBAL_WHATSAPP_ICON = "/assets/img/whatsapp-white.svg";

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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFloatingWhatsapp);
} else {
  initFloatingWhatsapp();
}
