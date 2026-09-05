import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildFooter, buildNav } from "./shared-layout.mjs";
import { generalPages, productFamilies } from "./seo-content-data.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://www.agama.com.mx";
const SUPABASE_IMAGES = "https://ozexoekvshuhtkrleuze.supabase.co/storage/v1/object/public/product-images";
const UPDATED = "2026-09-02";
const intents = ["spotlight", "guide", "faq"];

const labels = {
  es: {
    blog: "Blog AGAMA",
    spotlight: "Ficha práctica",
    guide: "Guía de aplicación",
    faq: "Preguntas frecuentes",
    read: "Consultar",
    product: "Ver producto",
    contact: "Hablar con AGAMA",
    series: "Contenido de esta serie",
    scope: "El alcance de esta página se limita a la información publicada por AGAMA. La validación final corresponde a la resina, el proceso y la pieza reales.",
    related: "Siguiente paso",
  },
  en: {
    blog: "AGAMA Blog",
    spotlight: "Product brief",
    guide: "Application guide",
    faq: "Frequently asked questions",
    read: "Open",
    product: "View product",
    contact: "Contact AGAMA",
    series: "In this series",
    scope: "This page is limited to information published by AGAMA. Final validation belongs to the actual resin, process, and finished part.",
    related: "Next step",
  },
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function absoluteImage(src) {
  if (!src) return "";
  return src.startsWith("http") ? src : `${SITE_URL}${src}`;
}

function productHref(link, locale) {
  if (locale !== "en") return link;
  if (link.endsWith("/productos/pigmentos/") || link.endsWith("/productos/masterbatch/") || link.endsWith("/productos/aditivos/")) {
    return `${link}index.en.html`;
  }
  return `${link}index.en.html`;
}

function routeUrl(family, locale, intent) {
  const suffix = locale === "en" ? "/index.en.html" : "/";
  return `/entrada-de-blog/${family.routes[locale][intent]}${suffix}`;
}

function pageTitle(copy, locale, intent) {
  if (copy.code.includes("Kalo") && intent === "faq") {
    return locale === "es" ? "Serie Kalo: preguntas frecuentes | AGAMA" : "Kalo Black Masterbatch: FAQ | AGAMA";
  }
  if (locale === "es") {
    if (intent === "spotlight") return `${copy.code}: ficha práctica | AGAMA`;
    if (intent === "guide") return `Cómo aplicar ${copy.code} | AGAMA`;
    return `${copy.code}: preguntas frecuentes | AGAMA`;
  }
  if (intent === "spotlight") return `${copy.code}: Product Brief | AGAMA`;
  if (intent === "guide") return `How to Apply ${copy.code} | AGAMA`;
  return `${copy.code}: Frequently Asked Questions | AGAMA`;
}

function pageHeading(copy, locale, intent) {
  if (locale === "es") {
    if (intent === "spotlight") return `${copy.name}: alcance y criterios de selección`;
    if (intent === "guide") return `Cómo preparar una prueba con ${copy.code}`;
    return `Preguntas frecuentes sobre ${copy.code}`;
  }
  if (intent === "spotlight") return `${copy.name}: scope and selection criteria`;
  if (intent === "guide") return `How to prepare a trial with ${copy.code}`;
  return `Frequently asked questions about ${copy.code}`;
}

function pageDescription(copy, locale, intent) {
  if (locale === "es") {
    if (intent === "spotlight") return `${copy.code}: uso documentado, resinas, procesos, límites y criterios para decidir si encaja en una pieza plástica.`;
    if (intent === "guide") return `Guía para preparar, dosificar, probar y evaluar ${copy.code} con la resina y el proceso reales.`;
    return `Respuestas verificadas sobre compatibilidad, proceso, dosificación, límites y evaluación de ${copy.code}.`;
  }
  if (intent === "spotlight") return `${copy.code}: documented use, resins, processes, limits, and criteria for deciding whether it fits a plastic part.`;
  if (intent === "guide") return `A practical guide to preparing, dosing, trialing, and evaluating ${copy.code} in the actual resin and process.`;
  return `Verified answers about compatibility, processing, dosage, limitations, and evaluation of ${copy.code}.`;
}

function productLinksHtml(family, locale) {
  const intro = locale === "es" ? "Referencias oficiales" : "Official references";
  return `<h2>${intro}</h2><p>${locale === "es" ? "Consulta la ficha viva antes de cotizar o repetir una prueba. Allí se mantienen la presentación y los datos comerciales vigentes." : "Check the live product page before quoting or repeating a trial. Current packaging and commercial information are maintained there."}</p><ul>${family.productLinks.map(([name, href]) => `<li><a href="${productHref(href, locale)}">${escapeHtml(name)}</a></li>`).join("")}</ul>`;
}

function productImageFromHref(href) {
  const match = href.match(/^\/productos\/([^/]+)\/([^/]+)\//);
  if (!match) return "";
  return `${SUPABASE_IMAGES}/${match[1]}/${match[2]}/cover.webp`;
}

function productVariantGalleryHtml(family, locale) {
  const productLinks = family.productLinks.filter(([, href]) => /^\/productos\/[^/]+\/[^/]+\//.test(href));
  if (productLinks.length < 2) return "";
  const heading = locale === "es" ? "Variantes visuales del catálogo" : "Catalog image variants";
  const intro = locale === "es"
    ? "Estas imágenes mantienen visibles las claves de la serie y enlazan con su ficha oficial para reforzar búsqueda visual e intención de compra."
    : "These images keep each grade visible and link to the official product page, reinforcing visual search and purchase intent.";
  return `<section class="product-variant-gallery" aria-labelledby="variant-gallery"><h2 id="variant-gallery">${heading}</h2><p>${intro}</p><div class="image-index-gallery">${productLinks.map(([name, href]) => `<figure><a href="${productHref(href, locale)}"><img src="${productImageFromHref(href)}" alt="${escapeHtml(`AGAMA ${name} official catalog image`)}" loading="lazy" width="900" height="675"/></a><figcaption><strong>${escapeHtml(name)}</strong><span>${locale === "es" ? "Ficha oficial AGAMA" : "Official AGAMA product page"}</span></figcaption></figure>`).join("")}</div></section>`;
}

function renderSpotlight(family, locale) {
  const copy = family[locale];
  if (locale === "es") {
    return `<p>${escapeHtml(copy.purpose)}</p>
      <h2>Dónde puede encajar</h2>${list(copy.applications)}
      <h2>Resinas y procesos documentados</h2><p>La compatibilidad publicada ofrece un punto de partida, no una aprobación automática de la pieza.</p>${list(copy.resins)}${list(copy.processes)}
      <h2>Qué aporta la formulación</h2>${list(copy.benefits)}
      <h2>Antes de elegir la clave</h2><p>Define la resina, el proceso, el espesor, la apariencia buscada y el criterio de aceptación. Una muestra en un material distinto no sustituye la prueba en producción.</p>
      <div class="notice"><strong>Aspectos que deben respetarse:</strong>${list(copy.cautions)}</div>
      ${productLinksHtml(family, locale)}
      ${productVariantGalleryHtml(family, locale)}`;
  }
  return `<p>${escapeHtml(copy.purpose)}</p>
    <h2>Where it may fit</h2>${list(copy.applications)}
    <h2>Documented resins and processes</h2><p>Published compatibility is a starting point, not automatic approval of the finished part.</p>${list(copy.resins)}${list(copy.processes)}
    <h2>What the formulation contributes</h2>${list(copy.benefits)}
    <h2>Before selecting the grade</h2><p>Define the resin, process, wall thickness, target appearance, and acceptance method. A sample in a different material does not replace a production-representative trial.</p>
    <div class="notice"><strong>Limits to respect:</strong>${list(copy.cautions)}</div>
    ${productLinksHtml(family, locale)}
    ${productVariantGalleryHtml(family, locale)}`;
}

function renderGuide(family, locale) {
  const copy = family[locale];
  if (locale === "es") {
    return `<p>Una prueba útil empieza antes de encender la máquina. El objetivo es comprobar ${escapeHtml(copy.code)} en condiciones que representen la pieza final y dejar un registro que pueda repetirse.</p>
      <h2>1. Documenta el punto de partida</h2><p>Registra clave y lote del producto, resina, porcentaje de material reciclado, proceso, máquina, temperatura habitual, espesor y estándar visual o funcional.</p>
      <h2>2. Confirma el alcance</h2><h3>Resinas</h3>${list(copy.resins)}<h3>Procesos</h3>${list(copy.processes)}
      <h2>3. Prepara la mezcla</h2><p>Trabaja por peso, usa equipo limpio y evita contaminar la muestra con remanentes del lote anterior. Conserva una parte de la resina y del concentrado utilizados.</p>
      <table class="fact-table"><thead><tr><th>Variable</th><th>Referencia publicada</th></tr></thead><tbody><tr><td>Temperatura</td><td>${escapeHtml(copy.temperature)}</td></tr><tr><td>Dosificación o incorporación</td><td>${escapeHtml(copy.dosage)}</td></tr></tbody></table>
      <h2>4. Ejecuta una prueba controlada</h2><ol><li>Estabiliza el equipo con la resina base.</li><li>Introduce la mezcla sin cambiar varias variables a la vez.</li><li>Separa las primeras piezas de transición.</li><li>Registra cualquier ajuste de temperatura, dosificación o tiempo.</li><li>Retén muestras identificadas del resultado estable.</li></ol>
      <h2>5. Evalúa y decide</h2><p>Compara apariencia, dispersión, proceso y requisitos de la pieza contra el criterio definido al inicio. Si el resultado exige una modificación, documenta un cambio por prueba.</p>
      <div class="notice"><strong>No omitir:</strong>${list(copy.cautions)}</div>
      ${productLinksHtml(family, locale)}`;
  }
  return `<p>A useful trial begins before the machine starts. The goal is to evaluate ${escapeHtml(copy.code)} under conditions representative of the finished part and leave a record that can be repeated.</p>
    <h2>1. Document the baseline</h2><p>Record product grade and lot, resin, recycled content, process, machine, normal temperature, wall thickness, and the visual or functional standard.</p>
    <h2>2. Confirm the documented scope</h2><h3>Resins</h3>${list(copy.resins)}<h3>Processes</h3>${list(copy.processes)}
    <h2>3. Prepare the blend</h2><p>Measure by weight, use clean equipment, and prevent carryover from the previous material. Retain samples of the resin and concentrate used in the trial.</p>
    <table class="fact-table"><thead><tr><th>Variable</th><th>Published reference</th></tr></thead><tbody><tr><td>Temperature</td><td>${escapeHtml(copy.temperature)}</td></tr><tr><td>Dosage or incorporation</td><td>${escapeHtml(copy.dosage)}</td></tr></tbody></table>
    <h2>4. Run a controlled trial</h2><ol><li>Stabilize the equipment with the base resin.</li><li>Introduce the blend without changing several variables at once.</li><li>Separate the first transition parts.</li><li>Record every dosage, temperature, or residence-time adjustment.</li><li>Retain identified samples from the stable run.</li></ol>
    <h2>5. Evaluate and decide</h2><p>Compare appearance, dispersion, processing behavior, and part requirements against the initial acceptance criteria. When a change is needed, alter one controlled variable per trial.</p>
    <div class="notice"><strong>Do not overlook:</strong>${list(copy.cautions)}</div>
    ${productLinksHtml(family, locale)}`;
}

function faqData(family, locale) {
  const copy = family[locale];
  if (locale === "es") {
    return [
      [`¿Qué es ${copy.code}?`, copy.purpose],
      ["¿En qué resinas puede evaluarse?", `La información publicada menciona: ${copy.resins.join("; ")}. La compatibilidad final debe verificarse en la formulación real.`],
      ["¿Qué procesos están documentados?", copy.processes.join("; ") + "."],
      ["¿Qué referencia de temperatura debe usarse?", copy.temperature],
      ["¿Qué dosificación o método de incorporación se recomienda?", copy.dosage],
      ["¿Qué límites deben revisarse antes de producir?", copy.cautions.join(" ")],
    ];
  }
  return [
    [`What is ${copy.code}?`, copy.purpose],
    ["Which resins can be evaluated?", `Published information lists: ${copy.resins.join("; ")}. Final compatibility must be confirmed in the actual formulation.`],
    ["Which processes are documented?", copy.processes.join("; ") + "."],
    ["Which temperature reference should be used?", copy.temperature],
    ["What dosage or incorporation method is recommended?", copy.dosage],
    ["Which limits should be reviewed before production?", copy.cautions.join(" ")],
  ];
}

function renderFaq(family, locale) {
  const items = faqData(family, locale);
  return `<p>${locale === "es" ? "Estas respuestas resumen únicamente el alcance publicado para la familia. Cuando la resina, la máquina o el uso final cambian, la recomendación debe revisarse." : "These answers summarize only the published scope for the family. When resin, equipment, or end use changes, the recommendation must be reviewed."}</p><div class="faq-list">${items.map(([question, answer]) => `<section class="faq-item"><h2>${escapeHtml(question)}</h2><p>${escapeHtml(answer)}</p></section>`).join("")}</div>${productLinksHtml(family, locale)}`;
}

function renderSeriesNav(family, locale, currentIntent) {
  const l = labels[locale];
  return `<aside class="article-aside"><nav class="series-nav" aria-label="${escapeHtml(l.series)}"><h2>${escapeHtml(l.series)}</h2>${intents.map((intent) => `<a href="${routeUrl(family, locale, intent)}"${intent === currentIntent ? ' aria-current="page"' : ""}>${escapeHtml(l[intent])}</a>`).join("")}<a href="${productHref(family.productLinks[0][1], locale)}">${escapeHtml(family.productLinks[0][0])}</a></nav><p class="scope-note">${escapeHtml(l.scope)}</p></aside>`;
}

function jsonLdForProduct(family, locale, intent, canonical, title, description) {
  const copy = family[locale];
  const images = [family.image, ...family.productLinks.map(([, href]) => productImageFromHref(href)).filter(Boolean)];
  const graph = [{
    "@type": "BlogPosting",
    "@id": `${canonical}#article`,
    headline: title,
    description,
    inLanguage: locale === "es" ? "es-MX" : "en-US",
    dateModified: UPDATED,
    mainEntityOfPage: canonical,
    image: images.map(absoluteImage),
    author: { "@type": "Organization", name: "AGAMA Pigmentos & Masterbatch" },
    publisher: { "@type": "Organization", name: "AGAMA Pigmentos & Masterbatch", logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/img/agama.svg` } },
    about: { "@type": "Product", name: copy.code, url: `${SITE_URL}${productHref(family.productLinks[0][1], locale)}` },
  }];
  if (intent === "faq") {
    graph.push({ "@type": "FAQPage", mainEntity: faqData(family, locale).map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

function renderHead({ locale, title, description, canonicalPath, alternateEs, alternateEn, image, alt, schema, ogType = "article" }) {
  const canonical = `${SITE_URL}${canonicalPath}`;
  return `<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="robots" content="index,follow,max-image-preview:large"/>
  <link rel="canonical" href="${canonical}"/>
  ${alternateEs ? `<link rel="alternate" hreflang="es-MX" href="${SITE_URL}${alternateEs}"/>` : ""}
  ${alternateEn ? `<link rel="alternate" hreflang="en" href="${SITE_URL}${alternateEn}"/>` : ""}
  ${alternateEs ? `<link rel="alternate" hreflang="x-default" href="${SITE_URL}${alternateEs}"/>` : ""}
  <meta property="og:type" content="${ogType}"/>
  <meta property="og:title" content="${escapeHtml(title)}"/>
  <meta property="og:description" content="${escapeHtml(description)}"/>
  <meta property="og:url" content="${canonical}"/>
  <meta property="og:image" content="${image}"/>
  <meta property="og:image:alt" content="${escapeHtml(alt)}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${escapeHtml(title)}"/>
  <meta name="twitter:description" content="${escapeHtml(description)}"/>
  <meta name="twitter:image" content="${image}"/>
  <meta name="twitter:image:alt" content="${escapeHtml(alt)}"/>
  <link href="../../assets/css/normalize.css?v=20260617b" rel="stylesheet"/>
  <link href="../../assets/css/webflow.css?v=20260617b" rel="stylesheet"/>
  <link href="../../assets/css/webflow-base.css?v=20260617b" rel="stylesheet"/>
  <link href="../../assets/css/home-custom.css?v=20260722masterbatch2" rel="stylesheet"/>
  <link href="../../assets/css/editorial.css?v=20260902" rel="stylesheet"/>
  <link href="../../assets/img/logo-circulo.webp" rel="icon" type="image/webp"/>
  <script type="application/ld+json">${schema}</script>
</head>`;
}

function renderProductPage(family, locale, intent) {
  const copy = family[locale];
  const l = labels[locale];
  const canonicalPath = routeUrl(family, locale, intent);
  const alternateEs = routeUrl(family, "es", intent);
  const alternateEn = routeUrl(family, "en", intent);
  const title = pageTitle(copy, locale, intent);
  const heading = pageHeading(copy, locale, intent);
  const description = pageDescription(copy, locale, intent);
  const body = intent === "spotlight" ? renderSpotlight(family, locale) : intent === "guide" ? renderGuide(family, locale) : renderFaq(family, locale);
  const switchHref = locale === "es" ? alternateEn : alternateEs;
  const schema = jsonLdForProduct(family, locale, intent, `${SITE_URL}${canonicalPath}`, heading, description);
  return `<!doctype html>
<html lang="${locale === "es" ? "es-MX" : "en-US"}">
${renderHead({ locale, title, description, canonicalPath, alternateEs, alternateEn, image: family.image, alt: copy.alt, schema })}
<body class="editorial-page" data-seo-content="product-${intent}">
  ${buildNav({ root: "../../", locale, switchHref, current: "blog" })}
  <main>
    <header class="editorial-hero"><div class="editorial-hero-inner"><div class="hero-copy">
      <nav class="breadcrumbs" aria-label="${locale === "es" ? "Migas de pan" : "Breadcrumb"}"><a href="${locale === "es" ? "/blog/" : "/blog/index.en.html"}">${l.blog}</a><span aria-hidden="true">/</span><span>${escapeHtml(l[intent])}</span></nav>
      <span class="eyebrow">${escapeHtml(l[intent])}</span><h1>${escapeHtml(heading)}</h1><p class="hero-summary">${escapeHtml(copy.summary)}</p>
      <div class="hero-actions"><a class="g-button" href="${productHref(family.productLinks[0][1], locale)}">${l.product}</a><a class="g-button is-secondary" href="${locale === "es" ? "/contacto/" : "/contacto/index.en.html"}">${l.contact}</a></div>
    </div><figure class="hero-media"><img src="${family.image}" alt="${escapeHtml(copy.alt)}" width="900" height="675" fetchpriority="high"/></figure></div></header>
    <section class="article-band"><div class="article-layout"><article class="article-body">${body}</article>${renderSeriesNav(family, locale, intent)}</div></section>
    <section class="related-band"><div class="related-inner"><h2>${escapeHtml(l.related)}</h2><div class="related-grid">${family.productLinks.map(([name, href]) => `<a class="related-card" href="${productHref(href, locale)}"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(l.product)} →</span></a>`).join("")}<a class="related-card" href="${locale === "es" ? "/contacto/" : "/contacto/index.en.html"}"><strong>${locale === "es" ? "Revisar una aplicación con el equipo de AGAMA" : "Review an application with the AGAMA team"}</strong><span>${escapeHtml(l.contact)} →</span></a></div></div></section>
  </main>
  ${buildFooter("../../", locale)}
  <script src="../../assets/js/webflow-base.js?v=20260617b"></script>
  <script src="../../assets/js/supabase-config.js?v=20260617b"></script>
  <script src="../../assets/js/home.js?v=20260617b"></script>
</body></html>\n`;
}

function imageGalleryHtml(page) {
  const images = page.images?.length ? page.images : [{ src: page.image, alt: page.alt, caption: page.description }];
  if (!images.length) return "";
  return `<section class="image-index-gallery" aria-label="Indexable visual references">${images.map((image) => `<figure><img src="../..${image.src}" alt="${escapeHtml(image.alt)}" loading="lazy" width="1200" height="900"/><figcaption><strong>${escapeHtml(image.title || image.alt)}</strong><span>${escapeHtml(image.caption || page.description)}</span></figcaption></figure>`).join("")}</section>`;
}

function renderGeneralPage(page) {
  const canonical = `${SITE_URL}${page.canonical}`;
  const image = `${SITE_URL}${page.image}`;
  const images = (page.images?.length ? page.images : [{ src: page.image, alt: page.alt, caption: page.description }]).map((item) => ({
    "@type": "ImageObject",
    contentUrl: absoluteImage(item.src),
    name: item.title || item.alt,
    caption: item.caption || page.description,
  }));
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [{
      "@type": page.schemaType || "BlogPosting",
      name: page.h1,
      headline: page.h1,
      description: page.description,
      url: canonical,
      inLanguage: "en-US",
      dateModified: UPDATED,
      image: images,
      provider: page.schemaType === "Service" ? { "@type": "Organization", name: "AGAMA Pigmentos & Masterbatch", url: SITE_URL } : undefined,
      author: page.schemaType ? undefined : { "@type": "Organization", name: "AGAMA Pigmentos & Masterbatch" },
      publisher: { "@type": "Organization", name: "AGAMA Pigmentos & Masterbatch", logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/img/agama.svg` } },
    }, ...images],
  });
  const isService = page.schemaType === "Service";
  const asideTitle = isService ? "Scheduling details" : "Buyer checklist";
  const asideText = page.aside || (isService
    ? "Share your company, event, preferred date, application topic, and the product family you want to review with AGAMA."
    : "Use this guide to prepare resin, process, part requirements, samples, logistics questions, and documentation checks before contacting AGAMA.");
  return `<!doctype html>
<html lang="en-US">
${renderHead({ locale: "en", title: page.title, description: page.description, canonicalPath: page.canonical, image, alt: page.alt, schema, ogType: isService ? "website" : "article" })}
<body class="editorial-page" data-seo-content="${isService ? "service" : "educational"}">
  ${buildNav({ root: "../../", locale: "en", switchHref: isService ? "/contacto/" : "/blog/", current: isService ? "contacto" : "blog" })}
  <main>
    <header class="editorial-hero"><div class="editorial-hero-inner"><div class="hero-copy">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${isService ? "/contacto/index.en.html" : "/blog/index.en.html"}">${isService ? "Contact" : "AGAMA Blog"}</a><span aria-hidden="true">/</span><span>${escapeHtml(page.eyebrow)}</span></nav>
      <span class="eyebrow">${escapeHtml(page.eyebrow)}</span><h1>${escapeHtml(page.h1)}</h1><p class="hero-summary">${escapeHtml(page.description)}</p>
      <div class="hero-actions"><a class="g-button" href="/contacto/index.en.html">Contact AGAMA</a>${isService ? "" : '<a class="g-button is-secondary" href="/productos/">Browse products</a>'}</div>
    </div><figure class="hero-media"><img src="../..${page.image}" alt="${escapeHtml(page.alt)}" width="1200" height="900" fetchpriority="high"/><img class="hero-brand-logo" src="../../assets/img/agama.svg" alt="AGAMA Pigmentos & Masterbatch" loading="lazy"/></figure></div></header>
    <section class="article-band"><div class="article-layout"><article class="article-body">${page.body}${imageGalleryHtml(page)}</article><aside class="article-aside"><div class="series-nav"><h2>${escapeHtml(asideTitle)}</h2><p class="scope-note">${escapeHtml(asideText)}</p><a href="/contacto/index.en.html">Discuss your application</a><a href="/productos/">Product catalog</a></div></aside></div></section>
  </main>
  ${buildFooter("../../", "en")}
  <script src="../../assets/js/webflow-base.js?v=20260617b"></script><script src="../../assets/js/supabase-config.js?v=20260617b"></script><script src="../../assets/js/home.js?v=20260617b"></script>
</body></html>\n`;
}

async function writePage(relativePath, html) {
  const output = path.join(ROOT, relativePath);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, html.replace(/[ \t]+$/gm, ""), "utf8");
}

function buildScopeDocument() {
  const categoryNames = {
    masterbatch: "Masterbatch",
    pigment: "Pigments",
    additive: "Additives",
  };
  const intentNames = {
    spotlight: "product scope",
    guide: "application guide",
    faq: "FAQ",
  };
  const lines = [
    "# PR #164 URL Scope",
    "",
    "Reviewed on 2026-09-02. This pull request covers exactly 83 public URLs: 72 bilingual product resources, 6 English educational articles, 2 English service pages, and 3 English category landings.",
    "",
    "## English category landings (3)",
    "",
    `- [Masterbatch](${SITE_URL}/masterbatch/index.en.html)`,
    `- [Pigments](${SITE_URL}/pigmentos/index.en.html)`,
    `- [Additives](${SITE_URL}/aditivos/index.en.html)`,
    "",
  ];

  for (const category of ["masterbatch", "pigment", "additive"]) {
    const families = productFamilies.filter((family) => family.category === category);
    lines.push(`## ${categoryNames[category]} resources (${families.length * 6})`, "");
    for (const family of families) {
      lines.push(`### ${family.es.code}`, "");
      for (const locale of ["es", "en"]) {
        for (const intent of intents) {
          const label = `${locale.toUpperCase()} ${intentNames[intent]}`;
          lines.push(`- [${label}](${SITE_URL}${routeUrl(family, locale, intent)})`);
        }
      }
      lines.push("");
    }
  }

  const educational = generalPages.filter((page) => page.schemaType !== "Service");
  const services = generalPages.filter((page) => page.schemaType === "Service");
  lines.push("## Educational articles (6)", "");
  for (const page of educational) lines.push(`- [${page.h1}](${SITE_URL}${page.canonical})`);
  lines.push("", "## Service pages (2)", "");
  for (const page of services) lines.push(`- [${page.h1}](${SITE_URL}${page.canonical})`);
  return `${lines.join("\n")}\n`;
}

const inventory = [];
for (const family of productFamilies) {
  for (const locale of ["es", "en"]) {
    for (const intent of intents) {
      const relative = `entrada-de-blog/${family.routes[locale][intent]}/${locale === "en" ? "index.en.html" : "index.html"}`;
      await writePage(relative, renderProductPage(family, locale, intent));
      inventory.push({ url: `${SITE_URL}${routeUrl(family, locale, intent)}`, type: `product-${intent}`, locale, family: family.key });
    }
  }
}

for (const page of generalPages) {
  await writePage(page.route, renderGeneralPage(page));
  inventory.push({ url: `${SITE_URL}${page.canonical}`, type: page.schemaType === "Service" ? "service" : "educational", locale: "en" });
}

inventory.push(
  { url: `${SITE_URL}/masterbatch/index.en.html`, type: "category-landing", locale: "en", family: "masterbatch" },
  { url: `${SITE_URL}/pigmentos/index.en.html`, type: "category-landing", locale: "en", family: "pigment" },
  { url: `${SITE_URL}/aditivos/index.en.html`, type: "category-landing", locale: "en", family: "additive" },
);

await writeFile(path.join(ROOT, "data", "pr164-url-inventory.json"), `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
await writeFile(path.join(ROOT, "docs", "pr-164-url-scope.md"), buildScopeDocument(), "utf8");
console.log(`Reviewed ${inventory.length} PR #164 URLs; generated ${inventory.length - 3} content pages.`);
