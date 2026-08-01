(function () {
  "use strict";

  const ROOT = document.documentElement;
  const PRODUCTION_HOSTS = new Set(["agama.com.mx", "www.agama.com.mx"]);
  const CHATBASE_SCRIPT_ID = "syhmjssLBRg1bJZYYj3ag";
  const CHATBASE_SRC = "https://www.chatbase.co/embed.min.js";
  const CHATBASE_DOMAIN = "www.chatbase.co";

  function initNavigation() {
    const navigation = document.querySelector("[data-home-v2-navigation]");
    if (!navigation || navigation.dataset.homeV2Enhanced === "true") return;

    navigation.dataset.homeV2Enhanced = "true";
    window.__AGAMA_HOME_V2_NAV_INIT_COUNT__ =
      (window.__AGAMA_HOME_V2_NAV_INIT_COUNT__ || 0) + 1;

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => navigation.removeAttribute("open"));
    });

    navigation.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        navigation.removeAttribute("open");
        navigation.querySelector("summary")?.focus();
      }
    });
  }

  function initHeroCinematic() {
    const video = document.querySelector("[data-home-v2-cinematic-video]");
    const intro = document.querySelector("[data-home-v2-hero-intro]");
    const finalFrame = document.querySelector("[data-home-v2-hero-final]");
    if (!video || video.dataset.homeV2Enhanced === "true") return;
    video.dataset.homeV2Enhanced = "true";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    video.loop = false;
    video.playbackRate = 0.65;
    let phase = 0;
    let rafId;
    const tick = () => {
      if (video.paused || video.ended) return;
      const time = video.currentTime;
      if (phase === 0 && time >= 10) {
        phase = 1;
        video.playbackRate = 3;
      }
      if (phase === 1 && time >= 17) {
        phase = 2;
        video.playbackRate = 0.5;
        video.style.transform = "scale(1.6)";
        video.style.transformOrigin = "55% 40%";
      }
      if (phase === 2 && time >= 21) {
        phase = 3;
        video.pause();
        video.style.transform = "scale(1.8)";
        finalFrame?.classList.add("is-visible");
      }
      if (phase < 3) rafId = window.requestAnimationFrame(tick);
    };
    video.addEventListener("play", () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(tick);
    }, { once: true });
    video.addEventListener("error", () => {
      window.cancelAnimationFrame(rafId);
      intro?.setAttribute("data-done", "true");
    }, { once: true });
  }

  function initBranchMap() {
    const list = document.querySelector("[data-home-v2-branch-list]");
    const map = document.querySelector("[data-home-v2-map]");
    if (!list || !map || list.dataset.homeV2Enhanced === "true") return;

    list.dataset.homeV2Enhanced = "true";
    const links = [...list.querySelectorAll("[data-branch-id]")];
    const markers = [...map.querySelectorAll("[data-branch-marker]")];
    const mapVisual = map.querySelector("[data-map-visual]");
    const activeLabel = map.querySelector("[data-map-active-label]");
    const zoneConfig = {
      norte: { origin: "72% 30%", halo: "norte" },
      bajio: { origin: "54% 51%", halo: "bajio" },
      occidente: { origin: "35% 60%", halo: "occidente" },
      centro: { origin: "64% 62%", halo: "centro" },
      "centro-oriente": { origin: "76% 68%", halo: "centro-oriente" },
    };
    const branchLocations = {
      monterrey: [25.681965, -100.2982, "Monterrey"],
      "san-luis-potosi": [22.151831, -100.957253, "San Luis Potosí"],
      guadalajara: [20.657431, -103.378991, "Guadalajara"],
      leon: [21.086443, -101.67987, "León"],
      queretaro: [20.579345, -100.377199, "Querétaro"],
      puebla: [19.079341, -98.203897, "Puebla"],
      toluca: [19.271705, -99.552824, "Toluca"],
      cuautitlan: [19.649992, -99.183946, "Cuautitlán"],
      ecatepec: [19.516449, -99.087556, "Ecatepec"],
      texcoco: [19.395076, -99.044888, "Texcoco"],
      tlahuac: [19.313987, -99.070566, "Tláhuac"],
      pantitlan: [19.396918, -99.021332, "Pantitlán"],
      zaragoza: [19.414506, -99.08799, "Zaragoza"],
      ermita: [19.344371, -99.029993, "Ermita"],
      merced: [19.422143, -99.121284, "Merced"],
      chalco: [19.26657, -98.882149, "Chalco"],
    };

    function setActive(id) {
      links.forEach((link) => link.classList.toggle("is-active", link.dataset.branchId === id));
      markers.forEach((marker) => marker.classList.remove("is-active"));
      const activeLink = links.find((link) => link.dataset.branchId === id);
      const zone = activeLink?.dataset.zone;
      if (!zone || !zoneConfig[zone]) {
        map.removeAttribute("data-active-zone");
        mapVisual?.style.removeProperty("transform-origin");
        if (activeLabel) activeLabel.textContent = "";
        return;
      }
      map.dataset.activeZone = zone;
      mapVisual?.style.setProperty("transform-origin", zoneConfig[zone].origin);
      if (activeLabel) activeLabel.textContent = activeLink.querySelector("span")?.textContent || "";
    }

    links.forEach((link) => {
      link.addEventListener("mouseenter", () => setActive(link.dataset.branchId));
      link.addEventListener("focus", () => setActive(link.dataset.branchId));
      link.addEventListener("mouseleave", () => setActive(""));
      link.addEventListener("blur", () => setActive(""));
    });

    markers.forEach((marker) => {
      marker.addEventListener("mouseenter", () => setActive(marker.dataset.branchMarker));
      marker.addEventListener("mouseleave", () => setActive(""));
    });

    map.querySelectorAll("[data-inset-branch]").forEach((point) => {
      point.addEventListener("click", () => {
        const id = point.dataset.insetBranch;
        setActive(id);
        document.querySelector(`[data-branch-id="${id}"]`)?.scrollIntoView({ block: "nearest" });
        document.querySelector(`[data-branch-id="${id}"]`)?.focus({ preventScroll: true });
      });
    });

    const form = document.querySelector("[data-home-v2-postcode-form]");
    const result = document.querySelector("[data-home-v2-postcode-result]");
    if (form && result) {
      const postcodeCenters = {
        "15000": [19.4145, -99.088],
        "09500": [19.3444, -99.03],
        "15810": [19.4221, -99.1213],
        "54759": [19.65, -99.184],
      };
      const distance = (a, b) => {
        const radians = (value) => (value * Math.PI) / 180;
        const earthRadius = 6371;
        const dLat = radians(b[0] - a[0]);
        const dLon = radians(b[1] - a[1]);
        const latA = radians(a[0]);
        const latB = radians(b[0]);
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(latA) * Math.cos(latB) * Math.sin(dLon / 2) ** 2;
        return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
      };

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const postcode = form.elements.postcode.value.trim();
        const center = postcodeCenters[postcode];
        if (!center) {
          result.textContent = document.documentElement.lang.startsWith("en")
            ? "We need to confirm this postcode individually. Please contact the branch team."
            : "Este código postal requiere confirmación individual. Contacta con el equipo de filiales.";
          return;
        }
        const nearest = Object.entries(branchLocations).sort(([, a], [, b]) => distance(center, a) - distance(center, b))[0];
        setActive(nearest[0]);
        result.textContent = document.documentElement.lang.startsWith("en")
          ? `Nearest branch: ${nearest[1][2]}.`
          : `Filial más cercana: ${nearest[1][2]}.`;
        document.querySelector(`[data-branch-id="${nearest[0]}"]`)?.scrollIntoView({ block: "nearest" });
      });
    }
  }

  function isProductionHost() {
    return PRODUCTION_HOSTS.has(window.location.hostname);
  }

  function getNewsletterCopy() {
    const english = document.documentElement.lang.toLowerCase().startsWith("en");

    return english
      ? {
          preview: "Preview signup saved only in this browser. It was not sent as a production lead.",
          success: "Your email is registered. We will let you know when AGAMA publishes new content.",
          error: "We could not register this email right now. Please try again later.",
        }
      : {
          preview: "Registro de prueba guardado solo en este navegador. No se envió como lead de producción.",
          success: "Tu correo quedó registrado. Te avisaremos cuando AGAMA publique nuevo contenido.",
          error: "No pudimos registrar este correo ahora. Inténtalo de nuevo más tarde.",
        };
  }

  function savePreviewSignup(payload) {
    const key = "agama-home-v2-newsletter-preview";
    const current = JSON.parse(window.localStorage.getItem(key) || "[]");
    current.push({ ...payload, created_at: new Date().toISOString() });
    window.localStorage.setItem(key, JSON.stringify(current));
  }

  async function insertNewsletter(payload) {
    const config = window.AGAMA_SUPABASE_CONFIG;
    if (!config?.url || !config?.publishableKey || !config?.tables?.newsletter) {
      throw new Error("Supabase newsletter configuration is unavailable.");
    }

    const response = await fetch(`${config.url}/rest/v1/${config.tables.newsletter}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.publishableKey,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Newsletter request failed with status ${response.status}.`);
    }

    void fetch(`${config.url}/functions/v1/notify-contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "INSERT",
        table: config.tables.newsletter,
        record: { ...payload, created_at: new Date().toISOString() },
      }),
    }).catch(() => {});
  }

  function initNewsletter() {
    const form = document.querySelector("[data-home-v2-newsletter]");
    const message = document.querySelector("[data-home-v2-newsletter-message]");
    if (!form || !message || form.dataset.homeV2Enhanced === "true") return;

    form.dataset.homeV2Enhanced = "true";
    form.noValidate = false;

    form.addEventListener("submit", async (event) => {
      if (!form.reportValidity()) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      if (form.elements.website?.value) return;

      const copy = getNewsletterCopy();
      const submit = form.querySelector('button[type="submit"]');
      const payload = {
        source: isProductionHost() ? "agama-home-v2" : "agama-home-v2-preview",
        email: form.elements.email.value.trim(),
        page_path: window.location.pathname,
        user_agent: window.navigator.userAgent,
      };

      submit.disabled = true;
      message.hidden = true;

      try {
        if (isProductionHost()) {
          await insertNewsletter(payload);
          message.textContent = copy.success;
        } else {
          savePreviewSignup(payload);
          message.textContent = copy.preview;
        }
        form.reset();
      } catch (error) {
        message.textContent = copy.error;
      } finally {
        submit.disabled = false;
        message.hidden = false;
      }
    });
  }

  function ensureChatbaseQueue() {
    if (window.chatbase && window.chatbase("getState") === "initialized") return;
    if (window.chatbase?.q) return;

    const queuedChatbase = (...args) => {
      queuedChatbase.q = queuedChatbase.q || [];
      queuedChatbase.q.push(args);
    };

    window.chatbase = new Proxy(queuedChatbase, {
      get(target, property) {
        if (property === "q") return target.q;
        return (...args) => target(property, ...args);
      },
    });
  }

  function loadChatbaseOnce() {
    if (document.getElementById(CHATBASE_SCRIPT_ID)) return;
    if (window.chatbase && window.chatbase("getState") === "initialized") return;

    ensureChatbaseQueue();

    const script = document.createElement("script");
    script.src = CHATBASE_SRC;
    script.id = CHATBASE_SCRIPT_ID;
    script.domain = CHATBASE_DOMAIN;
    script.async = true;
    document.body.appendChild(script);

    window.__AGAMA_HOME_V2_CHATBASE_LOAD_COUNT__ =
      (window.__AGAMA_HOME_V2_CHATBASE_LOAD_COUNT__ || 0) + 1;
  }

  function scheduleChatbase() {
    const events = ["pointerdown", "keydown", "touchstart"];
    const loadFromInteraction = () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, loadFromInteraction);
      });
      loadChatbaseOnce();
    };

    events.forEach((eventName) => {
      window.addEventListener(eventName, loadFromInteraction, {
        once: true,
        passive: true,
      });
    });

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(loadChatbaseOnce, { timeout: 5000 });
    } else {
      window.setTimeout(loadChatbaseOnce, 5000);
    }
  }

  function init() {
    if (ROOT.dataset.homeV2Initialized === "true") return;
    ROOT.dataset.homeV2Initialized = "true";

    initNavigation();
    initHeroCinematic();
    initBranchMap();
    initNewsletter();
    scheduleChatbase();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
