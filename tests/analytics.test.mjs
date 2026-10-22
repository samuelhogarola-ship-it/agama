import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyticsConfigFromEnv } from '../scripts/inject-analytics-loader.mjs';

test('production Umami config is available when deploy variables are absent', () => {
  const config = analyticsConfigFromEnv({});

  assert.equal(config.umamiWebsiteId, '27d57bb0-63e0-4523-9c08-6cb36d009a2f');
  assert.equal(config.umamiSrc, 'https://analytics.2.24.10.239.sslip.io/script.js');
});

function createDocument() {
  const inserted = [];
  const listeners = new Map();
  const firstScript = {
    parentNode: {
      insertBefore(node) {
        inserted.push({ method: 'insertBefore', node });
      },
    },
  };

  return {
    inserted,
    listeners,
    createElement(tagName) {
      const attributes = new Map();
      return {
        tagName: tagName.toUpperCase(),
        async: false,
        defer: false,
        setAttribute(name, value) {
          attributes.set(name, String(value));
          this[name] = String(value);
        },
        getAttribute(name) {
          return attributes.get(name) || null;
        },
      };
    },
    getElementsByTagName(tagName) {
      return tagName === 'script' ? [firstScript] : [];
    },
    head: {
      appendChild(node) {
        inserted.push({ method: 'appendChild', node });
      },
    },
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
  };
}

async function loadAnalytics(config = {}) {
  const document = createDocument();
  const window = {
    location: { pathname: '/contacto/' },
    AGAMA_ANALYTICS_CONFIG: config,
  };

  globalThis.window = window;
  globalThis.document = document;
  globalThis.Event = class Event {
    constructor(type) {
      this.type = type;
    }
  };
  await import(`../assets/js/analytics.js?test=${Date.now()}-${Math.random()}`);

  return { document, window };
}

test('analytics loader is inert when runtime IDs are missing', async () => {
  const { document, window } = await loadAnalytics();

  assert.equal(document.inserted.length, 0);
  assert.equal(typeof window.AGAMA_ANALYTICS.trackConversion, 'function');
});

test('analytics loader initializes GTM, GA4 and Umami from runtime config', async () => {
  const { document, window } = await loadAnalytics({
    gtmId: 'GTM-TEST123',
    ga4Id: 'G-TEST123',
    umamiWebsiteId: 'umami-site',
    umamiSrc: 'https://analytics.example.test/script.js',
  });

  const scriptUrls = document.inserted.map((entry) => entry.node.src);
  assert.ok(scriptUrls.some((src) => src === 'https://www.googletagmanager.com/gtm.js?id=GTM-TEST123'));
  assert.ok(scriptUrls.some((src) => src === 'https://www.googletagmanager.com/gtag/js?id=G-TEST123'));
  assert.ok(scriptUrls.some((src) => src === 'https://analytics.example.test/script.js'));
  assert.equal(document.inserted.at(-1).node.getAttribute('data-website-id'), 'umami-site');
  assert.deepEqual(window.dataLayer[0].event, 'gtm.js');
});

test('conversion events reach dataLayer, gtag and Umami with stable names', async () => {
  const { window } = await loadAnalytics({ ga4Id: 'G-TEST123' });
  const gtagCalls = [];
  const umamiCalls = [];
  window.gtag = (...args) => gtagCalls.push(args);
  window.umami = { track: (...args) => umamiCalls.push(args) };

  window.AGAMA_ANALYTICS.trackConversion('whatsapp', { href: 'https://wa.me/525573515156' });

  assert.deepEqual(window.dataLayer.at(-1), {
    event: 'agama_conversion',
    agama_event: 'whatsapp',
    href: 'https://wa.me/525573515156',
    path: '/contacto/',
  });
  assert.deepEqual(gtagCalls.at(-1), [
    'event',
    'agama_whatsapp',
    {
      event_category: 'conversion',
      href: 'https://wa.me/525573515156',
      path: '/contacto/',
    },
  ]);
  assert.deepEqual(umamiCalls.at(-1), [
    'agama_whatsapp',
    {
      href: 'https://wa.me/525573515156',
      path: '/contacto/',
    },
  ]);
});

test('delegated interactions classify contact, phone, forms and primary CTAs', async () => {
  const { document, window } = await loadAnalytics({ ga4Id: 'G-TEST123' });

  const contactLink = {
    closest() {
      return null;
    },
    matches(selector) {
      return selector === 'a[href]';
    },
    href: 'https://www.agama.com.mx/contacto/',
    textContent: 'Contacto',
    getAttribute(name) {
      return name === 'href' ? '/contacto/' : null;
    },
    classList: { contains: () => false },
  };
  document.listeners.get('click')({ target: contactLink });

  const phoneLink = {
    closest() {
      return null;
    },
    matches(selector) {
      return selector === 'a[href]';
    },
    href: 'tel:+525573515156',
    textContent: 'Llamar',
    getAttribute(name) {
      return name === 'href' ? 'tel:+525573515156' : null;
    },
    classList: { contains: () => false },
  };
  document.listeners.get('click')({ target: phoneLink });

  const primaryCta = {
    closest(selector) {
      return selector === 'a[href]' ? this : null;
    },
    matches(selector) {
      return selector === '.g-button, .product-wa-btn, .prod-card-wa';
    },
    href: 'https://www.agama.com.mx/puntosdeventa/',
    textContent: 'Encuentra tu tienda',
    getAttribute(name) {
      return name === 'href' ? '/puntosdeventa/' : null;
    },
    classList: { contains: (name) => name === 'g-button' },
  };
  document.listeners.get('click')({ target: primaryCta });

  document.listeners.get('submit')({
    target: {
      id: 'home-newsletter-form',
      name: 'home-newsletter-form',
      getAttribute: () => null,
      dataset: { newsletterSource: 'agama-home' },
    },
  });

  assert.deepEqual(
    window.dataLayer
      .filter((entry) => entry.event === 'agama_conversion')
      .map((entry) => entry.agama_event),
    ['contact', 'phone', 'primary_cta', 'form']
  );
});

test('runtime analytics code does not hardcode production measurement IDs', () => {
  const executableFiles = [
    'assets/js/analytics-config.js',
    'assets/js/analytics.js',
    'build.js',
    'portal/src/app/layout.tsx',
  ];

  for (const filePath of executableFiles) {
    const source = readFileSync(new URL(`../${filePath}`, import.meta.url), 'utf8');
    assert.equal(source.includes('GTM-TWHL8PV2'), false, filePath);
    assert.equal(source.includes('G-QV3KKP101K'), false, filePath);
  }
});
