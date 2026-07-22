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

const PRODUCT_CONTENT_EN = (() => {
  const filePath = path.join(__dirname, 'data', 'product-content-en.json');

  if (!fs.existsSync(filePath)) return {};

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.warn(`⚠️  Could not read English product content map: ${error.message}`);
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

function translateBadgeValue(value, locale = 'es') {
  if (!value || locale !== 'en') return value;

  const BADGE_TRANSLATIONS = {
    aditivos: 'Additives',
    Opaco: 'Opaque',
    Cristal: 'Crystal',
    Deslizante: 'Slip',
    Verde: 'Green',
    Azul: 'Blue',
    Amarillo: 'Yellow',
    Naranja: 'Orange',
    Rojo: 'Red',
    Rosa: 'Pink',
    Gris: 'Gray',
    Café: 'Brown',
    Negro: 'Black',
    Morado: 'Purple',
    Blanco: 'White',
    Beige: 'Beige',
    Marfil: 'Ivory',
    Guinda: 'Maroon',
    Magenta: 'Magenta',
    Aluminio: 'Aluminum',
    Ambar: 'Amber',
    Uva: 'Grape',
    'acabado-solido': 'solid finish',
    'acabado-translucido': 'translucent finish',
  };

  return BADGE_TRANSLATIONS[value] || value;
}

function getEnglishProductContent(product) {
  const copy = PRODUCT_CONTENT_EN[product.slug];

  return {
    description: copy?.description || product.descripcion || '',
    information: copy?.information || product.informacion || '',
  };
}

function normalizeEnglishVisibleCopy(value) {
  if (!value) return value;

  return String(value)
    .replaceAll('Este aditivo se usa como agente espumante en plastics. Al procesarlo, libera gases que forman una estructura celular en el material. Así se reduce la densidad, obteniendo parts un poco más ligeras.', 'This additive is used in plastics as a foaming agent. During processing, it releases gases that form a cellular structure in the material, reducing density and producing slightly lighter parts.')
    .replaceAll('Compatible con <strong >molding por injection</strong>, <strong >extrusion</strong> y <strong >rotational molding</strong>.', 'Compatible with <strong >injection molding</strong>, <strong >extrusion</strong>, and <strong >rotational molding</strong>.')
    .replaceAll('Expanso Raywan decomposes between <strong >190 °C y 210 °C</strong> to produce the necessary gases.', 'Expanso Raywan decomposes between <strong >190 °C and 210 °C</strong> to produce the necessary gases.')
    .replaceAll('Su función principal es cuidar la estructura del polymer y prolongar la vida útil de las parts. ', 'Its main role is to protect the polymer structure and extend the service life of the parts. ')
    .replaceAll('1 g por kilo de resin', '1 g per kilogram of resin')
    .replaceAll('Forma una capa interna que ayuda al desmolding.', 'It forms an internal layer that helps release the part.')
    .replaceAll('Puede generar una capa ligera sobre la part que afecte decoraciones superficiales como serigrafía, hot stamping o etiquetado.', 'It may create a light layer on the part that can affect surface decoration such as screen printing, hot stamping, or labeling.')
    .replaceAll('AD-309 es un internal-release agent presented in microsphere form. Está hecho con ácidos grasos de alta pureza. Funciona igual que su versión en polvo (AD-305), pero cambia su forma física.', 'AD-309 is an internal-release agent presented in microsphere form. It is made with high-purity fatty acids and works like its powder version (AD-305), while offering a different physical format.')
    .replaceAll('Facilita la liberación de parts moldeadas por <strong >injection</strong> o <strong >blow molding</strong>.', 'It facilitates the release of molded parts made by <strong >injection</strong> or <strong >blow molding</strong>.')
    .replaceAll('Evita la necesidad de aplicar desmoldante externo en molds en producción.', 'It eliminates the need to apply an external release agent to molds during production.')
    .replaceAll('Mantiene su efecto constante durante todo el process.', 'It maintains a consistent effect throughout the entire process.')
    .replaceAll('<h3 ><strong >Diferencias con el AD-305</strong></h3><ul ><li >Mismo efecto químico, misma pureza, misma función</li><li >Se diferencian en la presentación física: el AD-305 es polvo; el AD-309 microsphere (granulado)</li></ul>', '<h3 ><strong >Differences vs. AD-305</strong></h3><ul ><li >Same chemical effect, same purity, same function</li><li >The difference is the physical presentation: AD-305 is a powder, while AD-309 is a granulated microsphere</li></ul>')
    .replaceAll('<th style="text-align:left; padding:8px; border-bottom:1px solid #ccc;">resin</th>', '<th style="text-align:left; padding:8px; border-bottom:1px solid #ccc;">Resin</th>')
    .replaceAll('Initial dosage: between <strong >0.2 % y 8.0 %</strong> (2 a 8 gramos por kg de resin), depending on the application and performance requirements.', 'Initial dosage: between <strong >0.2% and 8.0%</strong> (2 to 8 grams per kg of resin), depending on the application and performance requirements.')
    .replaceAll('Ajustes pueden requerirse con mineral fillers, pigmentos u otros aditivos presentes.', 'Adjustments may be required depending on the mineral fillers, pigments, or other additives present.')
    .replaceAll('<td style="padding:8px; border-bottom:1px solid #eee;">Moldeo por injection</td>', '<td style="padding:8px; border-bottom:1px solid #eee;">Injection molding</td>')
    .replaceAll('Lubiwax is a blend of polyethylene waxes usada como lubricante interno en plastics.', 'Lubiwax is a blend of polyethylene waxes used as an internal lubricant in plastics.')
    .replaceAll('Mejora el flujo del plástico, sobre todo cuando tiene pigmentos o mineral fillers.', 'It improves plastic flow, especially when pigments or mineral fillers are present.')
    .replaceAll('Buena: facilita desmolding y mejora acabado', 'Good: it facilitates release and improves finish')
    .replaceAll('It can be be used starting from<strong > 5 gramos por kilo</strong>. Se puede incrementar o disminuir la aplicación, dependiendo del resultado obtenido.', 'It can be used starting from <strong >5 grams per kilogram</strong>. The dosage can be increased or decreased depending on the result obtained.')
    .replaceAll('Dosage: between <strong >20 y 15 gramos</strong> in extrusion; <strong >10 a 100 gramos</strong> en injection and blow molding (depending on the application).', 'Dosage: between <strong >15 and 20 grams</strong> in extrusion, and <strong >10 to 100 grams</strong> in injection and blow molding, depending on the application.')
    .replaceAll('Asegurar buena dispersion del polvo para evitar grumos.', 'Ensure good powder dispersion to avoid clumps.')
    .replaceAll('>injection<', '>Injection<')
    .replace(/ y <strong[^>]*>\s*rotational molding\s*<\/strong>/gi, ' and <strong >rotational molding</strong>')
    .replace(/ y <strong[^>]*>\s*blow molding\s*<\/strong>/gi, ' and <strong >blow molding</strong>')
    .replace(/Compatible con <strong[^>]*>\s*molding por injection\s*<\/strong>, <strong[^>]*>\s*extrusion\s*<\/strong> and <strong[^>]*>\s*rotational molding\s*<\/strong>\./gi, 'Compatible with <strong >injection molding</strong>, <strong >extrusion</strong>, and <strong >rotational molding</strong>.')
    .replace(/Compatible con <strong[^>]*>\s*molding por injection\s*<\/strong>, <strong[^>]*>\s*extrusion\s*<\/strong> y <strong[^>]*>\s*rotational molding\s*<\/strong>\./gi, 'Compatible with <strong >injection molding</strong>, <strong >extrusion</strong>, and <strong >rotational molding</strong>.')
    .replace(/Dosage: between <strong[^>]*>\s*20 y 15 gramos\s*<\/strong> in extrusion; <strong[^>]*>\s*10 a 100 gramos\s*<\/strong> en injection and blow molding \(depending on the application\)\./gi, 'Dosage: between <strong >15 and 20 grams</strong> in extrusion, and <strong >10 to 100 grams</strong> in injection and blow molding, depending on the application.')
    .replace(/Initial dosage: between <strong[^>]*>\s*0\.2 % y 8\.0 %\s*<\/strong> \(2 a 8 gramos por kg de resin\), depending on the application and performance requirements\./gi, 'Initial dosage: between <strong >0.2% and 8.0%</strong> (2 to 8 grams per kg of resin), depending on the application and performance requirements.')
    .replace(/In general, we recommend using between <strong[^>]*>\s*1\.0 y 1\.5 grams per kilogram of resin\s*<\/strong>\./gi, 'In general, we recommend using between <strong >1.0 and 1.5 grams per kilogram of resin</strong>.')
    .replace(/It can be be used starting from\s*<strong[^>]*>\s*5 gramos por kilo\s*<\/strong>\.\s*Se puede incrementar o disminuir la aplicación, dependiendo del resultado obtenido\./gi, 'It can be used starting from <strong >5 grams per kilogram</strong>. The dosage can be increased or decreased depending on the result obtained.')
    .replace(/Ajustes pueden requerirse con mineral fillers, pigmentos u otros aditivos presentes\./gi, 'Adjustments may be required depending on the mineral fillers, pigments, or other additives present.')
    .replace(/Mejora el flujo y la dispersion de pigmentos\/cargas/gi, 'Improves flow and the dispersion of pigments and fillers')
    .replace(/Moldeo por injection/gi, 'Injection molding')
    .replace(/Facilita el desmolding, reduce desgaste del molde/gi, 'Facilitates release and reduces mold wear')
    .replace(/Actúa como aditivo auxiliar para mejorar dispersion/gi, 'Acts as an auxiliary additive to improve dispersion')
    .replace(/Integrarlo al polymer junto con otros aditivos\./gi, 'Blend it into the polymer together with the other additives.')
    .replace(/En polymers transparentes, dosis altas pueden generar nubosidad o efecto de “neblina”\./gi, 'In transparent polymers, high dosages may create haze or a cloudy effect.')
    .replace(/Almacenar en lugar seco, fresco y bien cerrado para evitar moisture o contaminación\./gi, 'Store in a dry, cool, tightly closed place to avoid moisture or contamination.')
    .replace(/Expanso Raywan decomposes between <strong[^>]*>\s*190 °C y 210 °C\s*<\/strong> to produce the necessary gases\./gi, 'Expanso Raywan decomposes between <strong >190 °C and 210 °C</strong> to produce the necessary gases.')
    .replace(/Su función principal es cuidar la estructura del polymer y prolongar la vida útil de las parts\.\s*/gi, 'Its main role is to protect the polymer structure and extend the service life of the parts. ')
    .replace(/Este aditivo se usa como agente espumante en plastics\./gi, 'This additive is used in plastics as a foaming agent.')
    .replace(/Al procesarlo, libera gases que forman una estructura celular en el material\./gi, 'During processing, it releases gases that form a cellular structure in the material.')
    .replace(/Así se reduce la densidad, obteniendo parts un poco más ligeras\./gi, 'This reduces density and produces slightly lighter parts.')
    .replace(/1 g por kilo de resin/gi, '1 g per kilogram of resin')
    .replace(/Forma una capa interna que ayuda al desmolding\./gi, 'It forms an internal layer that helps release the part.')
    .replace(/Puede generar una capa ligera sobre la part que afecte decoraciones superficiales como serigrafía, hot stamping o etiquetado\./gi, 'It may create a light layer on the part that can affect surface decoration such as screen printing, hot stamping, or labeling.')
    .replace(/Lubiwax is a blend of polyethylene waxes usada como lubricante interno en plastics\./gi, 'Lubiwax is a blend of polyethylene waxes used as an internal lubricant in plastics.')
    .replace(/Mejora el flujo del plástico, sobre todo cuando tiene pigmentos o mineral fillers\./gi, 'It improves plastic flow, especially when pigments or mineral fillers are present.')
    .replace(/Buena: facilita desmolding y mejora acabado/gi, 'Good: it facilitates release and improves finish')
    .replace(/Se puede incrementar o disminuir la aplicación, dependiendo del resultado obtenido\./gi, 'The dosage can be increased or decreased depending on the result obtained.')
    .replace(/Diferencias con el AD-305/gi, 'Differences vs. AD-305')
    .replace(/Mismo efecto químico, misma pureza, misma función/gi, 'Same chemical effect, same purity, same function')
    .replace(/Se diferencian en la presentación física: el AD-305 es polvo; el AD-309 microsphere \(granulado\)/gi, 'The difference is the physical presentation: AD-305 is a powder, while AD-309 is a granulated microsphere')
    .replace(/AD-309 es un internal-release agent presented in microsphere form\./gi, 'AD-309 is an internal-release agent presented in microsphere form.')
    .replace(/Está hecho con ácidos grasos de alta pureza\./gi, 'It is made with high-purity fatty acids.')
    .replace(/Funciona igual que su versión en polvo \(AD-305\), pero cambia su forma física\./gi, 'It works like its powder version (AD-305), while offering a different physical format.')
    .replace(/Para productos transparentes, cuida la dosis para evitar nubosidad o pérdida de claridad\./gi, 'For transparent products, control the dosage to avoid haze or loss of clarity.')
    .replace(/Evitar concentraciones muy altas; pueden afectar el acabado superficial o la estabilidad térmica del material\./gi, 'Avoid very high concentrations, as they may affect the surface finish or the thermal stability of the material.')
    .replace(/Almacenar en lugar seco y fresco para evitar que absorba moisture, lo cual puede afectar su rendimiento\./gi, 'Store in a dry, cool place to prevent moisture absorption, which may affect performance.')
    .replace(/Ventajas frente al estearato de calcio/gi, 'Advantages over calcium stearate')
    .replace(/Ofrece mejor dispersion y lubricación, lo que mejora la eficiencia del procesamiento\./gi, 'It offers better dispersion and lubrication, improving processing efficiency.')
    .replace(/Soporta mejor las temperaturas elevadas, útil en aplicaciones exigentes\./gi, 'It withstands elevated temperatures better, which is useful in demanding applications.')
    .replace(/Menor impacto sobre la transparency: ideal para plastics donde se busca claridad\./gi, 'Lower impact on transparency: ideal for plastics where clarity is required.')
    .replace(/([A-Z]{2}-\d{3,4}) es perfecto para processes de molding por <strong[^>]*>\s*extrusion para fabricación de película principalmente\.\s*<\/strong>/gi, '$1 is ideal for <strong >extrusion processes, mainly for film production.</strong>')
    .replace(/([A-Z]{2}-\d{3,4}) es perfecto para processes de molding por <strong[^>]*>\s*extrusion para la fabricación de película plástica\.\s*<\/strong>/gi, '$1 is ideal for <strong >extrusion processes for plastic film manufacturing.</strong>')
    .replace(/([A-Z]{2}-\d{3,4}) es perfecto para processes de molding por <strong[^>]*>\s*injection y extrusion principalmente\.\s*<\/strong>/gi, '$1 is ideal for <strong >injection and extrusion processes primarily.</strong>')
    .replace(/es perfecto para processes de molding por <strong[^>]*>\s*injection y extrusion principalmente\.\s*<\/strong>/gi, 'is ideal for <strong >injection and extrusion processes primarily.</strong>')
    .replace(/Puede evaluarse en\s*<strong[^>]*>\s*injection\s*<\/strong>\s*o\s*<strong[^>]*>\s*blow molding\s*<\/strong>, pero podría presentar inconvenientes de dispersion\./gi, 'It can be evaluated in <strong >injection</strong> or <strong >blow molding</strong>, although it may present dispersion issues.')
    .replace(/Su formulación permite una integración fluida con\s*<strong[^>]*>\s*resins recicladas\s*<\/strong>, asegurando resultados de high quality\./gi, 'Its formulation allows smooth integration with <strong >recycled resins</strong>, ensuring high-quality results.')
    .replace(/Su formulación permite una integración fluida con resins\s*<strong[^>]*>\s*recicladas\s*<\/strong>, asegurando resultados de high quality\./gi, 'Its formulation allows smooth integration with <strong >recycled resins</strong>, ensuring high-quality results.')
    .replace(/Su formulación permite una integración fluida con resins <strong >recicladas<\/strong>, asegurando resultados de high quality\./gi, 'Its formulation allows smooth integration with <strong >recycled resins</strong>, ensuring high-quality results.')
    .replace(/extrusion \(evaluar\)\./gi, 'Extrusion (evaluate).')
    .replace(/Soplado \(evaluar\)\./gi, 'Blow molding (evaluate).')
    .replace(/logra un tono translucent con menor dosificación\./gi, 'achieves a translucent tone with a lower dosage.')
    .replace(/traslúcido tone/gi, 'translucent tone')
    .replace(/Posible migración:\s*<\/strong>\s*en polietilenos y polipropilenos\./gi, 'Possible migration: </strong>in polyethylenes and polypropylenes.')
    .replace(/1 a 1\.5 g\/kg/gi, '1 to 1.5 g/kg')
    .replace(/Otros \(hacer pruebas de migración\)/gi, 'Others (run migration tests)')
    .replace(/Alta migración:\s*<\/strong>\s*no utilizar en resins virgenes\./gi, 'High migration: </strong>do not use in virgin resins.')
    .replace(/No utilizar en resins vírgenes, debido a la migración que presenta\./gi, 'Do not use in virgin resins due to the migration it presents.')
    .replace(/No utilizar en resins vírgenes:\s*<\/strong>\s*debido a que puede presentar inconvenientes con la dispersion\./gi, 'Do not use in virgin resins: </strong>it may present dispersion issues.')
    .replace(/Alta migración:\s*<\/strong>\s*no utilizar en resins virgenes\./gi, 'High migration: </strong>do not use in virgin resins.')
    .replace(/No utilizar en resins vírgenes, debido a la migración que presenta\./gi, 'Do not use in virgin resins due to migration.')
    .replace(/<strong >Alta migración: <\/strong>no utilizar en resins virgenes\./gi, '<strong >High migration: </strong>do not use in virgin resins.')
    .replace(/No utilizar en resins vírgenes:\s*<\/strong>\s*debido a que puede presentar inconvenientes con la dispersion\./gi, 'Do not use in virgin resins: </strong>it may present dispersion issues.')
    .replace(/<strong >No utilizar en resins vírgenes: <\/strong>debido a que puede presentar inconvenientes con la dispersion\./gi, '<strong >Do not use in virgin resins: </strong>it may present dispersion issues.');
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
  const eventsLabel = isEnglish ? 'Events' : 'Eventos';
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
  const eventsHref = isEnglish ? `${root}eventos/index.en.html` : `${root}eventos/`;
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
                                <img src="${root}assets/img/master-clean.jpg" alt="AGAMA Masterbatch" loading="eager" class="featured-product-card-img"/>
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
                  <a href="${eventsHref}" class="button-nav w-inline-block"><div>${eventsLabel}</div><div class="button-nav-line"></div></a>
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
            <a href="${eventsHref}" class="btn-modal-nav w-button">${eventsLabel}</a>
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

  <link href="${root}assets/css/normalize.css?v=${ASSET_VERSION}" rel="stylesheet"/>
  <link href="${root}assets/css/webflow.css?v=${ASSET_VERSION}" rel="stylesheet"/>
  <link href="${root}assets/css/webflow-base.css?v=${ASSET_VERSION}" rel="stylesheet"/>
  <link href="${root}assets/css/home-custom.css?v=${ASSET_VERSION}" rel="stylesheet"/>

  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700&display=swap" onload="this.onload=null;this.rel='stylesheet'"/>
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700&display=swap"/></noscript>
  <script>!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);</script>
  <link href="${root}assets/img/logo-circulo.webp" rel="shortcut icon" type="image/webp"/>
  <link href="${root}assets/img/logo-circulo.webp" rel="apple-touch-icon"/>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TWHL8PV2');</script>`;
}

const BONNY = `<script>(function(){if(!window.chatbase||window.chatbase("getState")!=="initialized"){window.chatbase=(...arguments)=>{if(!window.chatbase.q){window.chatbase.q=[]}window.chatbase.q.push(arguments)};window.chatbase=new Proxy(window.chatbase,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const script=document.createElement("script");script.src="https://www.chatbase.co/embed.min.js";script.id="syhmjssLBRg1bJZYYj3ag";script.domain="www.chatbase.co";document.body.appendChild(script)};if(document.readyState==="complete"){onLoad()}else{window.addEventListener("load",onLoad)}})();</script>`;
const ASSET_VERSION = '20260617b';

// ── Index page (category listing) — FULL HTML, no fetch ──────────────────────

function buildIndexPage(tipo, products, locale = 'es') {
  const isEnglish = locale === 'en';
  const LABELS = {
    es: {
      pigmentos:   { title: 'Pigmentos',   desc: 'Concentrados de color para la industria del plástico. Opacos y cristal.' },
      masterbatch: { title: 'Masterbatch', desc: 'Masterbatch de color y funcionales para todas las resinas plásticas.' },
      aditivos:    { title: 'Aditivos',    desc: 'Aditivos químicos para mejorar las propiedades del plástico: deslizantes, espumantes, antioxidantes y más.' },
    },
    en: {
      pigmentos:   { title: 'Pigments',   desc: 'Color concentrates for the plastics industry. Opaque and crystal grades.' },
      masterbatch: { title: 'Masterbatch', desc: 'Color and functional masterbatch for all plastic resins.' },
      aditivos:    { title: 'Additives',    desc: 'Chemical additives to improve plastic properties, including slip, foaming, antioxidants, and more.' },
    },
  };
  const { title, desc } = LABELS[locale][tipo];
  const canonical = isEnglish
    ? `${SITE_URL}/productos/${tipo}/index.en.html`
    : `${SITE_URL}/productos/${tipo}/`;
  const root = '../../';
  const homeLabel = isEnglish ? 'Home' : 'Inicio';
  const productsLabel = isEnglish ? 'Products' : 'Productos';
  const techSheetLabel = isEnglish ? 'Technical sheet' : 'Ficha técnica';
  const requestSheetLabel = isEnglish ? 'Request sheet' : 'Solicitar ficha';
  const requestSheetMessage = isEnglish
    ? 'I would like to request the technical sheet.'
    : 'Quisiera solicitar la ficha técnica.';
  const quoteLabel = isEnglish ? 'Quote' : 'Cotizar';
  const searchPlaceholder = isEnglish
    ? `Search ${title.toLowerCase()}...`
    : `Buscar ${title.toLowerCase()}...`;
  const searchAria = isEnglish ? 'Search products' : 'Buscar productos';
  const productsCountLabel = isEnglish ? 'products' : 'productos';
  const htmlLang = isEnglish ? 'en-US' : 'es-MX';
  const productHref = (slug) => (isEnglish ? `${slug}/index.en.html` : `${slug}/`);
  const categoryLanding = {
    pigmentos: { href: '../../pigmentos/', label: 'Conocer la solución de pigmentos', copy: 'Antes de revisar fichas, consulta criterios de compatibilidad, dispersión y selección de pigmentos para plástico.' },
    masterbatch: { href: '../../masterbatch/', label: 'Masterbatch en México: guía de selección', copy: 'Si estás comparando masterbatch o masterbatches, revisa primero criterios de resina, proceso, dosificación y uso final antes de elegir una clave.' },
    aditivos: { href: '../../aditivos/', label: 'Conocer la solución de aditivos', copy: 'Ordena la conversación por necesidad de proceso, estabilidad y desempeño antes de elegir un aditivo.' },
  }[tipo];
  const categoryGuidance = !isEnglish ? `
  <section class="catalog-guidance" aria-label="Orientación comercial">
    <div>
      <strong>${escHtml(categoryLanding.label)}</strong>
      <p>${escHtml(categoryLanding.copy)}</p>
    </div>
    <div class="catalog-guidance-actions">
      <a href="${categoryLanding.href}">${tipo === 'masterbatch' ? 'Guía masterbatch México' : 'Conocer solución'}</a>
      <a href="../../filiales/online/">Contactar AGAMA Online</a>
      <a href="https://wa.me/525573515156" target="_blank" rel="noopener">WhatsApp</a>
    </div>
  </section>` : '';

  // Schema BreadcrumbList
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabel, item: isEnglish ? `${SITE_URL}/index.en.html` : SITE_URL },
      { '@type': 'ListItem', position: 2, name: productsLabel, item: isEnglish ? `${SITE_URL}/productos/index.en.html` : `${SITE_URL}/productos/` },
      { '@type': 'ListItem', position: 3, name: title, item: canonical },
    ],
  });

  // Pre-render all product cards
  const cards = products.map(p => {
    const localizedContent = isEnglish ? getEnglishProductContent(p) : null;
    const productDescription = isEnglish
      ? normalizeEnglishVisibleCopy(localizedContent.description)
      : p.descripcion;
    const productType = translateBadgeValue(p.tipo, locale);
    const img = p.portada
      ? `<img src="${escHtml(p.portada)}" alt="${escHtml(p.nombre)}" loading="lazy" class="prod-card-img"/>`
      : `<div class="prod-card-img prod-card-img--placeholder"><span class="icon-font">inventory_2</span></div>`;

    const badge = productType
      ? `<span class="prod-badge">${escHtml(productType)}</span>` : '';

    const pdf = p.ficha_tecnica && !isBrokenTechSheetUrl(p.ficha_tecnica)
      ? `<a href="${escHtml(p.ficha_tecnica)}" target="_blank" rel="noopener noreferrer" class="prod-card-pdf">
           <span class="icon-font">picture_as_pdf</span> ${techSheetLabel}
         </a>`
      : `<a href="${buildWhatsAppQuoteUrl(p.nombre, requestSheetMessage)}" target="_blank" rel="noopener" class="prod-card-pdf prod-card-pdf--fallback">
           <span class="icon-font">description</span> ${requestSheetLabel}
         </a>`;

    const precio = p.precio
      ? `<span class="prod-card-precio">$${Number(p.precio).toLocaleString('es-MX')} MXN</span>` : '';

    const waUrl = buildWhatsAppQuoteUrl(p.nombre);

    return `<article class="prod-card" data-search="${escHtml((p.nombre + ' ' + (productType || '') + ' ' + (productDescription || '')).toLowerCase())}">
      <a href="${productHref(p.slug)}" class="prod-card-cover" aria-label="${escHtml(p.nombre)}">
        <div class="prod-card-cover-inner">${img}</div>
      </a>
      <div class="prod-card-body">
        ${badge}
        <h2 class="prod-card-name">
          <a href="${productHref(p.slug)}">${escHtml(p.nombre)}</a>
        </h2>
        ${productDescription ? `<p class="prod-card-desc">${escHtml(productDescription)}</p>` : ''}
        <div class="prod-card-footer">
          ${precio}
          ${pdf}
          <a href="${waUrl}" target="_blank" rel="noopener" class="prod-card-wa">
            <img src="${root}assets/img/whatsapp-white.svg" alt="" width="16"/> ${quoteLabel}
          </a>
        </div>
      </div>
    </article>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
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
    .catalog-guidance { max-width:1200px; margin:-1rem auto 1.5rem; padding:1rem 1.25rem; border:1px solid rgba(219,228,240,.95); border-radius:22px; background:#fff; display:flex; gap:1rem; align-items:center; justify-content:space-between; box-shadow:0 18px 50px rgba(15,23,42,.06); }
    .catalog-guidance p { margin:.35rem 0 0; color:#475569; line-height:1.55; }
    .catalog-guidance-actions { display:flex; flex-wrap:wrap; gap:.65rem; justify-content:flex-end; }
    .catalog-guidance-actions a { display:inline-flex; align-items:center; justify-content:center; border-radius:999px; padding:.65rem .9rem; text-decoration:none; font-weight:600; color:#0f2f99; background:rgba(23,69,245,.08); }
    @media(max-width:780px){ .catalog-guidance { margin:0 1rem 1.25rem; align-items:flex-start; flex-direction:column; } .catalog-guidance-actions { justify-content:flex-start; } }
  </style>
</head>
<body id="top">
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TWHL8PV2" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<div class="page-wrapper">
${buildNav(2, locale)}
  <section class="products-hero">
    <h1>${escHtml(title)}</h1>
    <p>${escHtml(desc)}</p>
  </section>
  ${categoryGuidance}
  <div class="products-toolbar">
    <input id="products-search" class="products-search" type="search"
           placeholder="${escHtml(searchPlaceholder)}" autocomplete="off" aria-label="${escHtml(searchAria)}"/>
    <div class="products-count-label">
      <strong id="products-count">${products.length}</strong> ${productsCountLabel}
    </div>
  </div>
  <div id="products-calculator" class="products-calculator-wrap" hidden></div>
  <!-- CONTENIDO RENDERIZADO EN BUILD TIME — sin fetch cliente -->
  <div id="products-grid" class="products-grid">
${cards}
  </div>
${buildFooter(root, locale)}
</div>
<script src="${root}assets/js/webflow-base.js?v=${ASSET_VERSION}"></script>
<script src="${root}assets/js/global-ui.js?v=${ASSET_VERSION}" defer></script>
<script type="module">
  import { initProductPage } from '${root}assets/js/products.js?v=${ASSET_VERSION}';
  initProductPage('${tipo}');
</script>
${BONNY}
</body>
</html>`;
}

// ── Product detail page — FULL HTML ──────────────────────────────────────────

function buildProductPage(p, tipo, locale = 'es') {
  const isEnglish = locale === 'en';
  const localizedContent = isEnglish ? getEnglishProductContent(p) : null;
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
  const htmlLang = isEnglish ? 'en-US' : 'es-MX';
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
    .map((b) => `<span class="prod-badge">${escHtml(translateBadgeValue(b, locale))}</span>`).join(' ');

  const pdfHtml = p.ficha_tecnica && !isBrokenTechSheetUrl(p.ficha_tecnica)
    ? `<a href="${escHtml(p.ficha_tecnica)}" target="_blank" rel="noopener noreferrer" class="product-pdf-btn">
         <span class="icon-font">picture_as_pdf</span>
         ${pdfLabel}
       </a>`
    : `<a href="${buildWhatsAppQuoteUrl(p.nombre, isEnglish ? 'I would like to request the technical sheet.' : 'Quisiera solicitar la ficha técnica.')}" target="_blank" rel="noopener" class="product-pdf-btn product-pdf-btn--fallback">
         <span class="icon-font">description</span>
         ${requestSheetLabel}
       </a>`;

  const visibleDescription = isEnglish
    ? normalizeEnglishVisibleCopy(localizedContent.description)
    : p.descripcion;
  const infoHtmlSource = isEnglish
    ? normalizeEnglishVisibleCopy(localizedContent.information)
    : p.informacion;
  const infoHtml = infoHtmlSource ? cleanHtml(infoHtmlSource) : '';

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
        ${visibleDescription ? `<p class="product-desc">${escHtml(visibleDescription)}</p>` : ''}
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
<script src="${root}assets/js/webflow-base.js?v=${ASSET_VERSION}"></script>
<script src="${root}assets/js/global-ui.js?v=${ASSET_VERSION}" defer></script>
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
  const COPY_DIRS = ['filiales', 'contacto', 'legal', 'faqs', 'blog', 'blog-agama', 'entrada-de-blog', 'blog-assets', 'vacantes', 'entregas', 'eventos', 'pigmentos', 'masterbatch', 'aditivos', 'productos'];
  for (const dir of COPY_DIRS) {
    const src = path.join(__dirname, dir);
    if (fs.existsSync(src)) copyDir(src, path.join(DIST, dir));
  }

  // 5. Generate product index pages
  console.log('\n📄  Generating product index pages...');
  let pages = 0;

  if (!useStaticProductPages) {
    for (const [tipo, products] of Object.entries(byTipo)) {
      const htmlEs = buildIndexPage(tipo, products, 'es');
      const htmlEn = buildIndexPage(tipo, products, 'en');
      write(path.join(DIST, 'productos', tipo, 'index.html'), htmlEs);
      write(path.join(DIST, 'productos', tipo, 'index.en.html'), htmlEn);
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
