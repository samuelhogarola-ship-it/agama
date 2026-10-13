(function (window, document) {
  if (!window || !document) return;
  if (window.AGAMA_ANALYTICS && window.AGAMA_ANALYTICS.version) return;

  const config = window.AGAMA_ANALYTICS_CONFIG || {};
  const dataLayerName = clean(config.dataLayerName) || 'dataLayer';

  function clean(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function text(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  }

  function path() {
    return window.location && window.location.pathname ? window.location.pathname : '/';
  }

  function ensureDataLayer() {
    window[dataLayerName] = window[dataLayerName] || [];
    return window[dataLayerName];
  }

  function appendScript(src, attributes) {
    if (!src) return null;

    const script = document.createElement('script');
    script.async = true;
    script.src = src;

    for (const [name, value] of Object.entries(attributes || {})) {
      if (value === true) {
        script[name] = true;
      } else if (value) {
        script.setAttribute(name, value);
      }
    }

    if (attributes && attributes.defer) {
      script.async = false;
      script.defer = true;
    }

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else if (document.head) {
      document.head.appendChild(script);
    }

    return script;
  }

  function initGtm(gtmId) {
    const id = clean(gtmId);
    if (!id) return;

    const layer = ensureDataLayer();
    layer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    const suffix = dataLayerName !== 'dataLayer' ? `&l=${encodeURIComponent(dataLayerName)}` : '';
    appendScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}${suffix}`);
  }

  function initGa4(ga4Id) {
    const id = clean(ga4Id);
    if (!id) return;

    appendScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
    const layer = ensureDataLayer();
    window.gtag = window.gtag || function gtag() {
      layer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', id);
  }

  function initUmami(websiteId, src) {
    const id = clean(websiteId);
    const scriptSrc = clean(src);
    if (!id || !scriptSrc) return;

    appendScript(scriptSrc, {
      defer: true,
      'data-website-id': id,
    });
  }

  function trackConversion(name, payload) {
    const eventName = text(name).replace(/[^a-z0-9_]+/gi, '_').toLowerCase();
    if (!eventName) return;

    const eventPayload = {
      ...(payload || {}),
      path: path(),
    };
    ensureDataLayer().push({
      event: 'agama_conversion',
      agama_event: eventName,
      ...eventPayload,
    });

    if (typeof window.gtag === 'function') {
      window.gtag('event', `agama_${eventName}`, {
        event_category: 'conversion',
        ...eventPayload,
      });
    }

    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track(`agama_${eventName}`, eventPayload);
    }
  }

  function linkPayload(link) {
    return {
      href: link.href || link.getAttribute('href') || '',
      label: text(link.textContent),
    };
  }

  function classifyLink(link) {
    const href = (link.getAttribute('href') || link.href || '').toLowerCase();
    const explicit = clean(link.getAttribute('data-analytics-event'));
    if (explicit) return explicit;
    if (href.includes('wa.me/') || href.includes('api.whatsapp.com')) return 'whatsapp';
    if (href.startsWith('tel:')) return 'phone';
    if (href.startsWith('mailto:') || href.includes('/contacto')) return 'contact';
    if (link.matches('.g-button, .product-wa-btn, .prod-card-wa')) return 'primary_cta';
    return '';
  }

  function bindConversionEvents() {
    document.addEventListener('click', function (event) {
      const target = event.target;
      const closestLink = target && typeof target.closest === 'function'
        ? target.closest('a[href]')
        : null;
      const link = closestLink || (
        target && typeof target.matches === 'function' && target.matches('a[href]')
          ? target
          : null
      );

      if (!link) return;
      const eventName = classifyLink(link);
      if (!eventName) return;
      trackConversion(eventName, linkPayload(link));
    });

    document.addEventListener('submit', function (event) {
      const form = event.target;
      if (!form) return;

      trackConversion('form', {
        id: form.id || '',
        name: form.name || '',
        action: form.getAttribute ? form.getAttribute('action') || '' : '',
        source: form.dataset ? form.dataset.newsletterSource || form.dataset.analyticsSource || '' : '',
      });
    });
  }

  window.AGAMA_ANALYTICS = {
    version: '2026-10-13',
    trackConversion,
  };

  initGtm(config.gtmId);
  initGa4(config.ga4Id);
  initUmami(config.umamiWebsiteId, config.umamiSrc);
  bindConversionEvents();
})(window, document);
