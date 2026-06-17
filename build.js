/**
 * AGAMA — SSG Build Script
 * Genera HTML estático para el catálogo de productos desde Supabase.
 * Node.js 18+ requerido (fetch nativo).
 *
 * Usage:
 *   node build.js
 *
 * Output: dist/
 *   dist/productos/pigmentos/index.html
 *   dist/productos/pigmentos/[slug]/index.html  (×64)
 *   dist/productos/masterbatch/index.html
 *   dist/productos/masterbatch/[slug]/index.html (×52)
 *   dist/productos/aditivos/index.html
 *   dist/productos/aditivos/[slug]/index.html    (×19)
 *   + todos los assets copiados desde raíz
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────

// Lee .env si existe (sin dependencias externas)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
}

const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const DIST              = path.join(__dirname, 'dist');
const SITE_URL          = 'https://www.agama.com.mx';
const HIDDEN_PRODUCT_SLUGS = new Set([
  'mb-118-mb-verde-cascada',
  'bp-279-pig-verde-cascada',
]);

const PRODUCT_IMAGES_MANIFEST = (() => {
  const manifestPath = path.join(__dirname, 'data', 'product-images-manifest.json');

  if (!fs.existsSync(manifestPath)) return [];

  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch (error) {
    console.warn(`⚠️  Could not read product images manifest: ${error.message}`);
    return [];
  }
})();

const PRODUCT_IMAGES_BY_SLUG = new Map(
  PRODUCT_IMAGES_MANIFEST
    .filter((entry) => entry?.slug)
    .map((entry) => [entry.slug, entry])
);

const WEBFLOW_FICHA_MAP = (() => {
  const filePath = path.join(__dirname, 'data', 'webflow-ficha-map.json');

  if (!fs.existsSync(filePath)) return {};

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.warn(`⚠️  Could not read Webflow ficha map: ${error.message}`);
    return {};
  }
})();

// ── Fetch products from Supabase (BUILD TIME) ─────────────────────────────────

async function fetchAllProducts() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  const url = `${SUPABASE_URL}/rest/v1/products`
    + `?published=eq.true`
    + `&select=*`
    + `&order=nombre.asc`;

  try {
    const res = await fetch(url, {
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) throw new Error(`Supabase error ${res.status}: ${await res.text()}`);
    return res.json();
  } catch (error) {
    console.warn(`⚠️  Supabase fetch failed, falling back to static pages: ${error.message}`);
    return null;
  }
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Strips Webflow HTML artifacts for cleaner output */
function cleanHtml(html) {
  if (!html) return '';
  return html
    .replace(/\s*id=""\s*/g, ' ')
    .replace(/<div data-rt-embed-type='true'>/g, '<div class="product-table-wrap">')
    .replace(/style="width:100%;[^"]*"/g, '')
    .trim();
}

function metaDescription(p) {
  const desc = p.descripcion || '';
  return desc.length > 155 ? desc.slice(0, 152) + '...' : desc;
}

function isBrokenTechSheetUrl() { return false; }

function buildWhatsAppQuoteUrl(productName, extraText = '') {
  const base = `Hola AGAMA, me interesa el producto: ${productName}`;
  const text = extraText ? `${base}. ${extraText}` : base;
  return `https://wa.me/525573515156?text=${encodeURIComponent(text)}`;
}

function splitGalleryUrls(value) {
  if (!value) return [];

  return String(value)
    .split(/[;,]\s*(?=https?:\/\/)/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isPackagingGalleryEntry(entry) {
  const source = `${entry?.sourceUrl || ''} ${entry?.bucketPath || ''}`.toLowerCase();
  return source.includes('empaque');
}

function getProductGallery(product) {
  const manifestEntry = PRODUCT_IMAGES_BY_SLUG.get(product.slug);
  const fichaUrl = WEBFLOW_FICHA_MAP[product.slug] || null;
  const packagingGallery = Array.isArray(manifestEntry?.gallery)
    ? manifestEntry.gallery
        .filter(isPackagingGalleryEntry)
        .map((entry) => entry.publicUrl || entry.sourceUrl)
        .filter(Boolean)
    : [];

  const fallbackGallery = splitGalleryUrls(product.galeria);
  const galleryUrls = packagingGallery.length > 0 ? packagingGallery : fallbackGallery;

  return [product.portada, fichaUrl, ...galleryUrls]
    .filter(Boolean)
    .filter((url, index, list) => list.indexOf(url) === index);
}

// ── NAV shared ────────────────────────────────────────────────────────────────

function buildNav(depth = 0, locale = 'es', switchHref = null) {
  const root = depth === 0 ? '/' : '../'.repeat(depth);
  const isEnglish = locale === 'en';
  const productsLabel = isEnglish ? 'Products' : 'Productos';
  const branchesLabel = isEnglish ? 'Branches' : 'Filiales';
  const contactLabel = isEnglish ? 'Contact' : 'Contacto';
  const homeLabel = isEnglish ? 'Home' : 'Inicio';
  const pigmentsLabel = isEnglish ? 'Pigments' : 'Pigmentos';
  const masterbatchLabel = 'Masterbatch';
  const additivesLabel = isEnglish ? 'Additives' : 'Aditivos';
  const whatsappLabel = 'WhatsApp';
  const switchLabel = isEnglish ? 'ES' : 'EN';
  const switchAria = isEnglish ? 'Cambiar a español' : 'Switch to English';
  const switchTarget = switchHref || (isEnglish ? `${root}index.html` : `${root}index.en.html`);
  const homeHref = isEnglish ? `${root}index.en.html` : `${root}`;
  const pigmentsHref = isEnglish ? `${root}productos/pigmentos/index.en.html` : `${root}productos/pigmentos/`;
  const masterbatchHref = isEnglish ? `${root}productos/masterbatch/index.en.html` : `${root}productos/masterbatch/`;
  const additivesHref = isEnglish ? `${root}productos/aditivos/index.en.html` : `${root}productos/aditivos/`;
  const branchesHref = isEnglish ? `${root}filiales/index.en.html` : `${root}filiales/`;
  const contactHref = isEnglish ? `${root}contacto/index.en.html` : `${root}contacto/`;
  return `
  <div class="nav-fixed">
    <nav class="nav_component">
      <div class="page-padding padding-main-nav">
        <div class="container-large">
          <div class="padding-vertical">
            <div class="primary-nav_nav-bar">
              <a href="${homeHref}" class="global-brand-logo w-inline-block">
                <img src="${root}assets/img/agama.svg" loading="lazy" alt="AGAMA"/>
              </a>
              <div class="main-nav-bar">
                <div class="main-nav-menu">
                  <div data-delay="0" data-hover="true" class="dropdown-megamenu w-dropdown">
                    <div class="button-nav w-dropdown-toggle">
                      <div class="dropdown-flex"><div>${productsLabel}</div><div class="dropdown-icon">add</div></div>
                      <div class="button-nav-line"></div>
                    </div>
                    <nav class="megamenu-dropper w-dropdown-list">
                      <div class="megamenu-beta">
                        <div class="page-padding padding-megamenu">
                          <div class="container-large"><div class="padding-vertical"><div class="grid _3g">
                            <div class="featured-product-card">
                              <a href="${pigmentsHref}" class="image-link hover-effect w-inline-block" aria-label="${isEnglish ? 'View pigments catalogue' : 'Ver catálogo de Pigmentos'}">
                                <img src="${root}assets/img/pigmento.jpg" alt="AGAMA Pigmentos" loading="eager" class="featured-product-card-img"/>
                              </a>
                              <div class="featured-product-card-brief"><h3 class="global-heaading"><div class="global-heading-text">${pigmentsLabel}</div></h3></div>
                            </div>
                            <div class="featured-product-card">
                              <a href="${masterbatchHref}" class="image-link hover-effect w-inline-block" aria-label="${isEnglish ? 'View masterbatch catalogue' : 'Ver catálogo de Masterbatch'}">
                                <img src="${root}assets/img/master.jpg" alt="AGAMA Masterbatch" loading="eager" class="featured-product-card-img"/>
                              </a>
                              <div class="featured-product-card-brief"><h3 class="global-heaading"><div class="global-heading-text">${masterbatchLabel}</div></h3></div>
                            </div>
                            <div class="featured-product-card">
                              <a href="${additivesHref}" class="image-link hover-effect w-inline-block" aria-label="${isEnglish ? 'View additives catalogue' : 'Ver catálogo de Aditivos'}">
                                <img src="${root}assets/img/aditivos.jpg" alt="AGAMA Aditivos" loading="eager" class="featured-product-card-img"/>
                              </a>
                              <div class="featured-product-card-brief"><h3 class="global-heaading"><div class="global-heading-text">${additivesLabel}</div></h3></div>
                            </div>
                          </div></div></div>
                        </div>
                      </div>
                    </nav>
                  </div>
                  <a href="${branchesHref}" class="button-nav w-inline-block"><div>${branchesLabel}</div><div class="button-nav-line"></div></a>
                  <a href="${contactHref}" class="button-nav w-inline-block"><div>${contactLabel}</div><div class="button-nav-line"></div></a>
                </div>
                <a href="${switchTarget}" class="language-switch" aria-label="${switchAria}">${switchLabel}</a>
                <div class="man-nav-cta">
                  <a href="https://wa.me/525573515156" target="_blank" class="g-button w-inline-block">
                    <div>${whatsappLabel}</div>
                    <div class="g-button-material"></div>
                    <div class="g-button-svg"><img src="${root}assets/img/whatsapp-white.svg" loading="lazy" alt=""/></div>
                  </a>
                </div>
                <div class="main-nav-brgr">
                  <a fs-scrolldisable-element="disable" href="#" class="brgr w-inline-block">
                    <div class="brgr-pleca one"></div>
                    <div class="brgr-pleca two"></div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-nav-component">
        <div class="mobile-nav_nav-element">
          <div class="nav-element_header">
            <a fs-scrolldisable-element="enable" href="#" class="close close-btn w-inline-block"><div class="icon-font">close</div></a>
          </div>
          <div class="nav-element_body">
            <a href="${homeHref}" class="btn-modal-nav w-button">${homeLabel}</a>
            <a href="${pigmentsHref}" class="btn-modal-nav w-button">${pigmentsLabel}</a>
            <a href="${masterbatchHref}" class="btn-modal-nav w-button">${masterbatchLabel}</a>
            <a href="${additivesHref}" class="btn-modal-nav w-button">${additivesLabel}</a>
            <a href="${branchesHref}" class="btn-modal-nav w-button">${branchesLabel}</a>
            <a href="${contactHref}" class="btn-modal-nav w-button">${contactLabel}</a>
            <a href="https://wa.me/525573515156" target="_blank" class="btn-modal-nav cta-btn whatsapp w-inline-block">
              <div class="icon-btn-container">
                <div class="icon-btn_text"><div>${whatsappLabel}</div></div>
                <div class="icon-btn_icon"><img src="${root}assets/img/whats-app.svg" loading="lazy" alt=""/></div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </nav>
  </div>`;
}

function buildFooter(root = '/', locale = 'es') {
  const isEnglish = locale === 'en';
  const homeHref = isEnglish ? `${root}index.en.html` : `${root}`;
  const pigmentsHref = isEnglish ? `${root}productos/pigmentos/index.en.html` : `${root}productos/pigmentos/`;
  const masterbatchHref = isEnglish ? `${root}productos/masterbatch/index.en.html` : `${root}productos/masterbatch/`;
  const additivesHref = isEnglish ? `${root}productos/aditivos/index.en.html` : `${root}productos/aditivos/`;
  const deliveryHref = isEnglish ? `${root}entregas/index.en.html` : `${root}entregas/`;
  const eventsHref = isEnglish ? `${root}eventos/index.en.html` : `${root}eventos/`;
  const blogHref = isEnglish ? `${root}blog/index.en.html` : `${root}blog/`;
  const jobsHref = isEnglish ? `${root}vacantes/index.en.html` : `${root}vacantes/`;
  const contactHref = isEnglish ? `${root}contacto/index.en.html` : `${root}contacto/`;
  const legalHref = isEnglish ? `${root}legal/index.en.html` : `${root}legal/`;
  const pigmentsLabel = isEnglish ? 'Pigments' : 'Pigmentos';
  const additivesLabel = isEnglish ? 'Additives' : 'Aditivos';
  const deliveryLabel = isEnglish ? 'Delivery' : 'Entregas';
  const eventsLabel = isEnglish ? 'Events' : 'Eventos';
  const blogLabel = 'Blog';
  const jobsLabel = isEnglish ? 'Jobs' : 'Vacantes';
  const contactLabel = isEnglish ? 'Contact' : 'Contacto';
  const legalLabel = 'Legal';
  const copy = isEnglish ? 'AGAMA - Pigments &amp; Masterbatch® 2025' : 'AGAMA - Pigmentos &amp; Masterbatch® 2025';
  return `
  <footer class="site-footer-placeholder">
    <div class="sfp-inner">
      <a href="${homeHref}" class="sfp-logo"><img src="${root}assets/img/agama-b.svg" alt="AGAMA" loading="lazy"/></a>
      <nav class="sfp-nav">
        <a href="${pigmentsHref}">${pigmentsLabel}</a>
        <a href="${masterbatchHref}">Masterbatch</a>
        <a href="${additivesHref}">${additivesLabel}</a>
        <a href="${deliveryHref}">${deliveryLabel}</a>
        <a href="${eventsHref}">${eventsLabel}</a>
        <a href="${blogHref}">${blogLabel}</a>
        <a href="${jobsHref}">${jobsLabel}</a>
        <a href="${contactHref}">${contactLabel}</a>
        <a href="${legalHref}">${legalLabel}</a>
      </nav>
      <div class="sfp-copy">${copy}</div>
    </div>
  </footer>`;
}

function buildHead({ title, description, canonical, image, root = '/' }) {
  const og_image = image || `${SITE_URL}/assets/img/agama.svg`;
  return `
  <meta charset="utf-8"/>
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(description)}"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <link rel="canonical" href="${canonical}"/>

  <!-- Open Graph -->
  <meta property="og:type" content="website"/>
  <meta property="og:title" content="${escHtml(title)}"/>
  <meta property="og:description" content="${escHtml(description)}"/>
  <meta property="og:url" content="${canonical}"/>
  <meta property="og:image" content="${escHtml(og_image)}"/>
  <meta property="og:site_name" content="AGAMA Pigmentos &amp; Masterbatch"/>

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${escHtml(title)}"/>
  <meta name="twitter:description" content="${escHtml(description)}"/>
  <meta name="twitter:image" content="${escHtml(og_image)}"/>

  <link href="${root}assets/css/normalize.css" rel="stylesheet"/>
  <link href="${root}assets/css/webflow.css" rel="stylesheet"/>
  <link href="${root}assets/css/webflow-base.css" rel="stylesheet"/>
  <link href="${root}assets/css/home-custom.css" rel="stylesheet"/>

  <link href="https://fonts.googleapis.com" rel="preconnect"/>
  <link href="https://fonts.gstatic.com" rel="preconnect" crossorigin="anonymous"/>
  <script src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"></script>
  <script>WebFont.load({google:{families:["Geist:400,600,700","Inter:300,400,500,600","Material Icons:400","Material Symbols:400"]}});</script>
  <script>!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);</script>
  <link href="${root}assets/img/logo-circulo.webp" rel="shortcut icon" type="image/webp"/>
  <link href="${root}assets/img/logo-circulo.webp" rel="apple-touch-icon"/>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TWHL8PV2');</script>`;
}

const BONNY = `<script>(function(){if(!window.chatbase||window.chatbase("getState")!=="initialized"){window.chatbase=(...arguments)=>{if(!window.chatbase.q){window.chatbase.q=[]}window.chatbase.q.push(arguments)};window.chatbase=new Proxy(window.chatbase,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const script=document.createElement("script");script.src="https://www.chatbase.co/embed.min.js";script.id="syhmjssLBRg1bJZYYj3ag";script.domain="www.chatbase.co";document.body.appendChild(script)};if(document.readyState==="complete"){onLoad()}else{window.addEventListener("load",onLoad)}})();</script>`;

// ── Index page (category listing) — FULL HTML, no fetch ──────────────────────

function buildIndexPage(tipo, products) {
  const LABELS = {
    pigmentos:   { title: 'Pigmentos',   desc: 'Concentrados de color para la industria del plástico. Opacos y cristal.' },
    masterbatch: { title: 'Masterbatch', desc: 'Masterbatch de color y funcionales para todas las resinas plásticas.' },
    aditivos:    { title: 'Aditivos',    desc: 'Aditivos químicos para mejorar las propiedades del plástico: deslizantes, espumantes, antioxidantes y más.' },
  };
  const { title, desc } = LABELS[tipo];
  const canonical = `${SITE_URL}/productos/${tipo}/`;
  const root = '../../';

  // Schema BreadcrumbList
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Productos', item: `${SITE_URL}/productos/` },
      { '@type': 'ListItem', position: 3, name: title, item: canonical },
    ],
  });

  // Pre-render all product cards
  const cards = products.map(p => {
    const img = p.portada
      ? `<img src="${escHtml(p.portada)}" alt="${escHtml(p.nombre)}" loading="lazy" class="prod-card-img"/>`
      : `<div class="prod-card-img prod-card-img--placeholder"><span class="icon-font">inventory_2</span></div>`;

    const badge = p.tipo
      ? `<span class="prod-badge">${escHtml(p.tipo)}</span>` : '';

    const pdf = p.ficha_tecnica && !isBrokenTechSheetUrl(p.ficha_tecnica)
      ? `<a href="${escHtml(p.ficha_tecnica)}" target="_blank" rel="noopener noreferrer" class="prod-card-pdf">
           <span class="icon-font">picture_as_pdf</span> Ficha técnica
         </a>`
      : `<a href="${buildWhatsAppQuoteUrl(p.nombre, 'Quisiera solicitar la ficha técnica.')}" target="_blank" rel="noopener" class="prod-card-pdf prod-card-pdf--fallback">
           <span class="icon-font">description</span> Solicitar ficha
         </a>`;

    const precio = p.precio
      ? `<span class="prod-card-precio">$${Number(p.precio).toLocaleString('es-MX')} MXN</span>` : '';

    const waUrl = buildWhatsAppQuoteUrl(p.nombre);

    return `<article class="prod-card" data-search="${escHtml((p.nombre + ' ' + (p.tipo||'') + ' ' + (p.descripcion||'')).toLowerCase())}">
      <a href="${p.slug}/" class="prod-card-cover" aria-label="${escHtml(p.nombre)}">
        <div class="prod-card-cover-inner">${img}</div>
      </a>
      <div class="prod-card-body">
        ${badge}
        <h2 class="prod-card-name">
          <a href="${p.slug}/">${escHtml(p.nombre)}</a>
        </h2>
        ${p.descripcion ? `<p class="prod-card-desc">${escHtml(p.descripcion)}</p>` : ''}
        <div class="prod-card-footer">
          ${precio}
          ${pdf}
          <a href="${waUrl}" target="_blank" rel="noopener" class="prod-card-wa">
            <img src="${root}assets/img/whatsapp-white.svg" alt="" width="16"/> Cotizar
          </a>
        </div>
      </div>
    </article>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="es-MX">
<head>${buildHead({ title: `${title} — AGAMA Pigmentos & Masterbatch`, description: desc, canonical, root })}
  <script type="application/ld+json">${schema}</script>
  <style>
    .prod-card-cover { display:flex; text-decoration:none; aspect-ratio:4/3; overflow:hidden; align-items:center; justify-content:center; background:transparent; }
    .prod-card-cover-inner { width:100%; height:100%; display:flex; align-items:center; justify-content:center; padding:14px; }
    .prod-card-img { width:auto; height:auto; max-width:100%; max-height:100%; object-fit:contain; object-position:center center; display:block; margin:auto; }
    .prod-card-name a { color:inherit; text-decoration:none; }
    .prod-card-name a:hover { color:#0055b3; }
    .prod-card-wa { white-space:nowrap; flex:0 0 auto; }
    .prod-card-wa img { width:16px; height:16px; max-width:16px; flex:0 0 16px; object-fit:contain; }
  </style>
</head>
<body id="top">
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TWHL8PV2" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<div class="page-wrapper">
${buildNav(2)}
  <section class="products-hero">
    <h1>${escHtml(title)}</h1>
    <p>${escHtml(desc)}</p>
  </section>
  <div class="products-toolbar">
    <input id="products-search" class="products-search" type="search"
           placeholder="Buscar ${title.toLowerCase()}..." autocomplete="off" aria-label="Buscar productos"/>
    <div class="products-count-label">
      <strong id="products-count">${products.length}</strong> productos
    </div>
  </div>
  <div id="products-calculator" class="products-calculator-wrap" hidden></div>
  <!-- CONTENIDO RENDERIZADO EN BUILD TIME — sin fetch cliente -->
  <div id="products-grid" class="products-grid">
${cards}
  </div>
${buildFooter(root)}
</div>
<script src="${root}assets/js/webflow-base.js"></script>
<script src="${root}assets/js/global-ui.js" defer></script>
<script type="module">
  import { initProductPage } from '${root}assets/js/products.js';
  initProductPage('${tipo}');
</script>
${BONNY}
</body>
</html>`;
}

// ── Product detail page — FULL HTML ──────────────────────────────────────────

function buildProductPage(p, tipo, locale = 'es') {
  const isEnglish = locale === 'en';
  const categoryLabel = tipo.charAt(0).toUpperCase() + tipo.slice(1);
  const localizedCategoryLabel = isEnglish
    ? ({ pigmentos: 'Pigments', masterbatch: 'Masterbatch', aditivos: 'Additives' }[tipo] || categoryLabel)
    : categoryLabel;
  const canonical = isEnglish
    ? `${SITE_URL}/productos/${tipo}/${p.slug}/index.en.html`
    : `${SITE_URL}/productos/${tipo}/${p.slug}/`;
  const root = '../../../';
  const title = `${p.nombre} — AGAMA Pigmentos & Masterbatch`;
  const description = metaDescription(p);
  const waUrl = buildWhatsAppQuoteUrl(p.nombre);
  const gallery = getProductGallery(p);
  const htmlLang = isEnglish ? 'en' : 'es-MX';
  const backLabel = isEnglish ? `Back to ${localizedCategoryLabel}` : `Volver a ${localizedCategoryLabel}`;
  const homeLabel = isEnglish ? 'Home' : 'Inicio';
  const quoteLabel = isEnglish ? 'Quote via WhatsApp' : 'Cotizar por WhatsApp';
  const pdfLabel = isEnglish ? 'Download technical sheet (PDF)' : 'Descargar ficha técnica (PDF)';
  const requestSheetLabel = isEnglish ? 'Request technical sheet' : 'Solicitar ficha técnica';
  const breadcrumbAria = isEnglish ? 'Breadcrumb' : 'Breadcrumb';
  const lightboxAria = isEnglish ? 'Product image viewer' : 'Visor de imágenes de producto';
  const closeLightboxAria = isEnglish ? 'Close image viewer' : 'Cerrar visor de imagen';
  const mainImageAria = isEnglish
    ? `Expand main image of ${p.nombre}`
    : `Ampliar imagen principal de ${p.nombre}`;
  const thumbAriaPrefix = isEnglish ? 'Open view' : 'Abrir vista';
  const thumbAltPrefix = isEnglish ? 'view' : 'vista';
  const categoryHref = isEnglish ? `${root}productos/${tipo}/index.en.html` : `${root}productos/${tipo}/`;
  const switchHref = isEnglish ? './' : './index.en.html';

  // Schema Product
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nombre,
    description: p.descripcion || '',
    url: canonical,
    brand: { '@type': 'Brand', name: 'AGAMA' },
    category: p.tipo_producto || tipo,
  };
  if (p.portada) schema.image = p.portada;
  if (p.precio)  schema.offers = { '@type': 'Offer', priceCurrency: 'MXN', price: p.precio, availability: 'https://schema.org/InStock' };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabel,    item: isEnglish ? `${SITE_URL}/index.en.html` : SITE_URL },
      { '@type': 'ListItem', position: 2, name: isEnglish ? 'Products' : 'Productos', item: isEnglish ? `${SITE_URL}/productos/index.en.html` : `${SITE_URL}/productos/` },
      { '@type': 'ListItem', position: 3, name: localizedCategoryLabel, item: isEnglish ? `${SITE_URL}/productos/${tipo}/index.en.html` : `${SITE_URL}/productos/${tipo}/` },
      { '@type': 'ListItem', position: 4, name: p.nombre,    item: canonical },
    ],
  };

  const imgHtml = p.portada
    ? `<div class="product-gallery${gallery.length > 1 ? ' product-gallery--with-thumbs' : ''}">
         <div class="product-hero-wrap">
           <button type="button" class="product-gallery-trigger product-gallery-trigger--hero" data-gallery-open="${escHtml(p.portada)}" data-gallery-alt="${escHtml(p.nombre)}" aria-label="${escHtml(mainImageAria)}">
             <img src="${escHtml(p.portada)}" alt="${escHtml(p.nombre)}" class="product-hero-img" loading="eager"/>
           </button>
         </div>
         ${gallery.length > 1 ? `
         <div class="product-gallery-grid" aria-label="Galería del producto">
           ${gallery.slice(1).map((image, index) => `
             <button type="button" class="product-gallery-thumb product-gallery-trigger" data-gallery-open="${escHtml(image)}" data-gallery-alt="${escHtml(`${p.nombre} ${thumbAltPrefix} ${index + 2}`)}" aria-label="${escHtml(`${thumbAriaPrefix} ${index + 2} de ${p.nombre}`)}">
               <img src="${escHtml(image)}" alt="${escHtml(`${p.nombre} ${thumbAltPrefix} ${index + 2}`)}" class="product-gallery-thumb-img" loading="lazy"/>
             </button>
           `).join('')}
         </div>` : ''}
       </div>`
    : `<div class="product-hero-wrap product-no-img"><span class="icon-font">inventory_2</span></div>`;

  const galleryModalHtml = p.portada
    ? `
    <div class="product-lightbox" data-gallery-modal hidden>
      <div class="product-lightbox-backdrop" data-gallery-close></div>
      <div class="product-lightbox-dialog" role="dialog" aria-modal="true" aria-label="${escHtml(lightboxAria)}">
        <button type="button" class="product-lightbox-close" data-gallery-close aria-label="${escHtml(closeLightboxAria)}">X</button>
        <img src="" alt="" class="product-lightbox-image" data-gallery-image/>
      </div>
    </div>`
    : '';

  const badges = [p.tipo, p.acabado, p.color].filter(Boolean)
    .map(b => `<span class="prod-badge">${escHtml(b)}</span>`).join(' ');

  const pdfHtml = p.ficha_tecnica && !isBrokenTechSheetUrl(p.ficha_tecnica)
    ? `<a href="${escHtml(p.ficha_tecnica)}" target="_blank" rel="noopener noreferrer" class="product-pdf-btn">
         <span class="icon-font">picture_as_pdf</span>
         ${pdfLabel}
       </a>`
    : `<a href="${buildWhatsAppQuoteUrl(p.nombre, isEnglish ? 'I would like to request the technical sheet.' : 'Quisiera solicitar la ficha técnica.')}" target="_blank" rel="noopener" class="product-pdf-btn product-pdf-btn--fallback">
         <span class="icon-font">description</span>
         ${requestSheetLabel}
       </a>`;

  const infoHtml = p.informacion ? cleanHtml(p.informacion) : '';

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>${buildHead({ title, description, canonical, image: p.portada, root })}
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
  <style>
    .product-detail { max-width:1100px; margin:0 auto; padding:3rem 1.5rem 5rem; display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1.2fr); gap:3rem; align-items:start; }
    .product-detail > div { min-width:0; }
    @media(max-width:768px){ .product-detail{grid-template-columns:1fr;gap:2rem;} }
    .product-gallery { display:grid; gap:1rem; }
    .product-gallery--with-thumbs { display:flex; align-items:flex-start; gap:1.35rem; min-width:0; }
    .product-hero-wrap { width:100%; display:flex; align-items:flex-start; justify-content:center; overflow:visible; padding:0; background:transparent; border-radius:0; }
    .product-gallery--with-thumbs .product-hero-wrap { order:2; flex:1 1 auto; min-width:0; }
    .product-gallery-trigger { appearance:none; border:none; background:transparent; padding:0; margin:0; cursor:zoom-in; width:100%; display:block; }
    .product-gallery-trigger--hero { width:100%; }
    .product-hero-img { width:100%; max-width:100%; height:auto; object-fit:contain; display:block; border-radius:0; }
    .product-gallery-grid { display:grid; gap:.8rem; }
    .product-gallery--with-thumbs .product-gallery-grid { order:1; flex:0 0 96px; grid-template-columns:1fr; align-content:start; }
    .product-gallery-thumb { aspect-ratio:1/1; border:1px solid #d9dee8; border-radius:0; background:#fff; padding:.4rem; display:flex; align-items:center; justify-content:center; text-decoration:none; transition:border-color .15s ease, transform .15s ease; }
    .product-gallery-thumb:hover { border-color:#0055b3; transform:translateY(-1px); }
    .product-gallery-thumb-img { width:100%; height:100%; object-fit:contain; display:block; border-radius:0; }
    .product-lightbox[hidden] { display:none; }
    .product-lightbox { position:fixed; inset:0; z-index:1200; display:flex; align-items:center; justify-content:center; padding:2rem; }
    .product-lightbox-backdrop { position:absolute; inset:0; background:rgba(7, 16, 38, 0.78); }
    .product-lightbox-dialog { position:relative; z-index:1; max-width:min(92vw, 1080px); max-height:88vh; width:auto; display:flex; align-items:center; justify-content:center; }
    .product-lightbox-image { max-width:100%; max-height:88vh; width:auto; height:auto; object-fit:contain; background:#fff; }
    .product-lightbox-close { position:absolute; top:-1rem; right:-1rem; width:2.75rem; height:2.75rem; border:none; border-radius:999px; background:#fff; color:#002f6c; font-family:Inter,sans-serif; font-size:1rem; font-weight:700; cursor:pointer; box-shadow:0 12px 30px rgba(0,0,0,.18); }
    .product-lightbox-close:hover { background:#f3f6ff; }
    @media(max-width:768px){
      .product-gallery--with-thumbs { display:grid; gap:1rem; }
      .product-gallery--with-thumbs .product-hero-wrap,
      .product-gallery--with-thumbs .product-gallery-grid { order:initial; }
      .product-gallery--with-thumbs .product-gallery-grid { flex:none; grid-template-columns:repeat(2, minmax(0, 110px)); }
      .product-lightbox { padding:1rem; }
      .product-lightbox-close { top:.75rem; right:.75rem; }
    }
    .product-no-img { width:100%; aspect-ratio:4/3; border-radius:12px; background:#f7f8fa; display:flex; align-items:center; justify-content:center; color:#ccc; }
    .product-no-img .icon-font { font-size:4rem; }
    .product-info { display:flex; flex-direction:column; gap:1rem; min-width:0; }
    .product-breadcrumb { font-family:Inter,sans-serif; font-size:.8rem; color:#888; margin-bottom:.5rem; }
    .product-breadcrumb a { color:#0055b3; text-decoration:none; }
    .product-breadcrumb a:hover { text-decoration:underline; }
    .product-title { font-family:'Geist',Inter,sans-serif; font-size:clamp(1.6rem,3vw,2.5rem); font-weight:700; color:#002f6c; margin:0; line-height:1.15; }
    .product-badges { display:flex; gap:.5rem; flex-wrap:wrap; }
    .product-desc { font-family:Inter,sans-serif; font-size:1rem; color:#444; line-height:1.7; margin:0; }
    .product-price { font-family:'Geist',Inter,sans-serif; font-size:1.5rem; font-weight:700; color:#002f6c; }
    .product-actions { display:flex; gap:1rem; flex-wrap:wrap; align-items:center; }
    .product-wa-btn { display:inline-flex; align-items:center; gap:.5rem; background:#25d366; color:#fff; font-family:Inter,sans-serif; font-weight:700; font-size:1rem; padding:.8rem 1.5rem; border-radius:8px; text-decoration:none; transition:background .2s; }
    .product-wa-btn:hover { background:#1da854; }
    .product-wa-btn img { width:20px; height:20px; }
    .product-pdf-btn { display:inline-flex; align-items:center; gap:.5rem; color:#e53e3e; font-family:Inter,sans-serif; font-size:.9rem; text-decoration:none; border:1.5px solid #e53e3e; border-radius:8px; padding:.65rem 1.25rem; transition:background .15s; }
    .product-pdf-btn:hover { background:#fff5f5; }
    .product-pdf-btn .icon-font { font-size:1.1rem; }
    .product-pdf-btn--fallback { color:#0f7a33; border-color:#25d366; }
    .product-pdf-btn--fallback:hover { background:#f0fdf4; }
    .product-info-section { max-width:1100px; margin:0 auto; padding:0 1.5rem 5rem; }
    .product-info-section h2 { font-family:'Geist',Inter,sans-serif; font-size:1.3rem; font-weight:700; color:#002f6c; margin:2rem 0 1rem; padding-top:1.5rem; border-top:1px solid #e5e7eb; }
    .product-info-section h2:first-child { border-top:none; margin-top:0; }
    .product-info-section h3 { font-family:'Geist',Inter,sans-serif; font-size:1.1rem; font-weight:600; color:#002f6c; margin:1.5rem 0 .5rem; }
    .product-info-section p { font-family:Inter,sans-serif; font-size:.95rem; color:#444; line-height:1.75; margin:0 0 .75rem; }
    .product-info-section ul { padding-left:1.4rem; margin:.5rem 0 1rem; }
    .product-info-section li { font-family:Inter,sans-serif; font-size:.95rem; color:#444; line-height:1.65; margin-bottom:.3rem; }
    .product-info-section table { width:100%; border-collapse:collapse; margin:1rem 0; font-family:Inter,sans-serif; font-size:.9rem; }
    .product-info-section td, .product-info-section th { border:1px solid #e5e7eb; padding:.6rem .8rem; text-align:left; }
    .product-info-section th { background:#f7f8fa; color:#002f6c; font-weight:600; }
    .product-back { display:inline-flex; align-items:center; gap:.4rem; font-family:Inter,sans-serif; font-size:.875rem; color:#0055b3; text-decoration:none; margin:0 1.5rem; padding-top:1.5rem; display:block; }
    .product-back:hover { text-decoration:underline; }
  </style>
</head>
<body id="top">
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TWHL8PV2" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <div class="page-wrapper" style="margin-top:95px;">
${buildNav(3, locale, switchHref)}
  <main>
    <a href="${isEnglish ? `../index.en.html` : '../'}" class="product-back">
      <span class="icon-font" style="font-family:'Material Icons';font-size:1rem;vertical-align:middle">arrow_back</span>
      ${backLabel}
    </a>
    <div class="product-detail">
      <div>${imgHtml}</div>
      <div class="product-info">
        <nav class="product-breadcrumb" aria-label="${breadcrumbAria}">
          <a href="${isEnglish ? `${root}index.en.html` : `${root}`}">${homeLabel}</a> /
          <a href="${categoryHref}">${localizedCategoryLabel}</a> /
          ${escHtml(p.nombre)}
        </nav>
        <h1 class="product-title">${escHtml(p.nombre)}</h1>
        ${badges ? `<div class="product-badges">${badges}</div>` : ''}
        ${p.descripcion ? `<p class="product-desc">${escHtml(p.descripcion)}</p>` : ''}
        ${p.precio ? `<div class="product-price">$${Number(p.precio).toLocaleString('es-MX')} MXN</div>` : ''}
        <div class="product-actions">
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="product-wa-btn">
            <img src="${root}assets/img/whatsapp-white.svg" alt=""/> ${quoteLabel}
          </a>
          ${pdfHtml}
        </div>
      </div>
    </div>
    ${galleryModalHtml}
    ${infoHtml ? `<section class="product-info-section">${infoHtml}</section>` : ''}
  </main>
${buildFooter(root, locale)}
</div>
<script src="${root}assets/js/webflow-base.js"></script>
<script src="${root}assets/js/global-ui.js" defer></script>
<script>
  (function () {
    const modal = document.querySelector('[data-gallery-modal]');
    if (!modal) return;

    const modalImage = modal.querySelector('[data-gallery-image]');
    const openers = Array.from(document.querySelectorAll('[data-gallery-open]'));
    const closers = Array.from(document.querySelectorAll('[data-gallery-close]'));
    const body = document.body;

    function closeModal() {
      modal.hidden = true;
      modalImage.src = '';
      modalImage.alt = '';
      body.style.overflow = '';
    }

    function openModal(src, alt) {
      modalImage.src = src;
      modalImage.alt = alt || '';
      modal.hidden = false;
      body.style.overflow = 'hidden';
    }

    openers.forEach((trigger) => {
      trigger.addEventListener('click', function () {
        openModal(this.dataset.galleryOpen || '', this.dataset.galleryAlt || '');
      });
    });

    closers.forEach((closer) => {
      closer.addEventListener('click', closeModal);
    });

    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) closeModal();
    });
  })();
</script>
${BONNY}
</body>
</html>`;
}

// ── File system helpers ───────────────────────────────────────────────────────

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function write(filePath, content) {
  mkdirp(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

/** Copy directory recursively, skipping dist/ and node_modules/ */
function copyDir(src, dest, skipDirs = []) {
  mkdirp(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skipDirs.includes(entry.name)) continue;
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, skipDirs);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/** Copy a single file if it exists */
function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    mkdirp(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

// ── Main build ────────────────────────────────────────────────────────────────

async function build() {
  const t0 = Date.now();
  console.log('\n🏗  AGAMA SSG Build\n');

  // 1. Fetch all products from Supabase (build time)
  console.log('📡  Fetching products from Supabase...');
  const allProducts = await fetchAllProducts();
  const useStaticProductPages = !Array.isArray(allProducts);

  if (useStaticProductPages) {
    console.log('    ↪ using committed static /productos pages');
  } else {
    console.log(`    ✓ ${allProducts.length} products fetched`);
  }

  // 2. Group by tipo
  const byTipo = { pigmentos: [], masterbatch: [], aditivos: [] };
  if (Array.isArray(allProducts)) {
    for (const p of allProducts) {
      if (HIDDEN_PRODUCT_SLUGS.has(p.slug)) continue;
      if (byTipo[p.tipo_producto]) byTipo[p.tipo_producto].push(p);
    }
  }

  // 3. Clean dist
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
  mkdirp(DIST);

  // 4. Copy static assets
  console.log('\n📁  Copying static assets...');
  copyDir(path.join(__dirname, 'assets'), path.join(DIST, 'assets'));

  // Copy all root-level static pages (not build.js, package*, .env, .git*, etc.)
  const ROOT_PAGES = ['index.html', 'index.en.html', 'robots.txt', 'sitemap.xml', '404.html'];
  for (const f of ROOT_PAGES) copyFile(path.join(__dirname, f), path.join(DIST, f));

  // Copy subdirectories (filiales, contacto, legal, FAQs, blog, legacy blog, vacantes, entregas, eventos)
  const COPY_DIRS = ['filiales', 'contacto', 'legal', 'faqs', 'blog', 'blog-agama', 'entrada-de-blog', 'blog-assets', 'vacantes', 'entregas', 'eventos', 'productos'];
  for (const dir of COPY_DIRS) {
    const src = path.join(__dirname, dir);
    if (fs.existsSync(src)) copyDir(src, path.join(DIST, dir));
  }

  // 5. Generate product index pages
  console.log('\n📄  Generating product index pages...');
  let pages = 0;

  if (!useStaticProductPages) {
    for (const [tipo, products] of Object.entries(byTipo)) {
      const html = buildIndexPage(tipo, products);
      write(path.join(DIST, 'productos', tipo, 'index.html'), html);
      console.log(`    ✓ /productos/${tipo}/ (${products.length} products)`);
      pages++;
    }
  } else {
    console.log('    ↪ skipped dynamic category generation');
  }

  // 6. Generate individual product pages
  console.log('\n📦  Generating individual product pages...');
  if (!useStaticProductPages) {
    for (const [tipo, products] of Object.entries(byTipo)) {
      for (const p of products) {
        const htmlEs = buildProductPage(p, tipo, 'es');
        const htmlEn = buildProductPage(p, tipo, 'en');
        write(path.join(DIST, 'productos', tipo, p.slug, 'index.html'), htmlEs);
        write(path.join(DIST, 'productos', tipo, p.slug, 'index.en.html'), htmlEn);
        pages++;
      }
      console.log(`    ✓ ${products.length} ${tipo} pages`);
    }
  } else {
    console.log('    ↪ skipped dynamic product detail generation');
  }

  // 7. Summary
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅  Build complete in ${elapsed}s`);
  console.log(`    📄  Pages generated: ${pages}`);
  console.log(`    📁  Output: dist/\n`);

  return pages;
}

build().catch(err => {
  console.error('❌  Build failed:', err);
  process.exit(1);
});
