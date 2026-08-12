import { access, copyFile, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildFooter, buildNav } from "./shared-layout.mjs";

const snapshotPath = new URL("../wordpress/import/agama-blog-posts.snapshot.json", import.meta.url);
const importDir = new URL("../wordpress/import/", import.meta.url);
const publicImageDir = new URL("../blog-assets/featured-images/", import.meta.url);
const blogDir = new URL("../blog/", import.meta.url);
const legacyBlogDir = new URL("../blog-agama/", import.meta.url);
const postsDir = new URL("../entrada-de-blog/", import.meta.url);

const SITE_URL = "https://www.agama.com.mx";
const ASSET_VERSION = "20260617b";
const MANUAL_POST_SLUGS_TO_PRESERVE = [
  "el-precio-es-una-respuesta-no-una-explicacion",
  "en-que-momento-dejamos-de-ser-estudiantes",
];
const INLINE_IMAGE_SOURCE = [
  "https://cdn.prod.",
  "website-files.com/63c6bdcc8c4ba686216459fb/",
  "69d53e678dec41f980b79e17_WhatsApp%20Image%202026-04-07%20at%2011.23.47%20AM.jpeg",
].join("");
const INLINE_IMAGE_FILE = "mb-115-negro-kalo-mejora-su-dispersion-inline.jpeg";

const GLOBAL_CSS = `
  :root{
    --agama-blue:#1745f5;
    --agama-blue-dark:#0f2f99;
    --agama-ink:#111827;
    --agama-text:#475569;
    --agama-border:#dbe4f0;
    --agama-surface:#ffffff;
    --agama-surface-soft:#f5f8ff;
    --agama-shadow:0 24px 60px rgba(15, 23, 42, .10);
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{
    margin:0;
    font-family:"Geist","Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    color:var(--agama-ink);
    background:
      radial-gradient(circle at top left, rgba(23,69,245,.08), transparent 34%),
      linear-gradient(180deg, #ffffff 0%, #f7faff 55%, #ffffff 100%);
  }
  img{max-width:100%;display:block}
  a{color:inherit}
  .page-shell{min-height:100vh}
  .nav-fixed{
    position:sticky;
    top:0;
    z-index:40;
    background:rgba(255,255,255,.92);
    backdrop-filter:blur(18px);
    border-bottom:1px solid rgba(219,228,240,.9);
  }
  .nav_component,.container-large,.global-container,.container-medium{width:min(1180px,calc(100% - 2rem));margin:0 auto}
  .page-padding.padding-main-nav,.page-padding,.padding-main-nav{width:100%}
  .padding-vertical{padding:1rem 0}
  .primary-nav_nav-bar{display:flex;align-items:center;justify-content:space-between;gap:1rem}
  .global-brand-logo img{width:auto;height:52px}
  .main-nav-bar{display:flex;align-items:center;gap:1rem}
  .main-nav-menu{display:flex;align-items:center;gap:.35rem}
  .button-nav,.btn-modal-nav{
    text-decoration:none;
    font-size:.96rem;
    color:#253247;
    border-radius:999px;
    transition:background .15s ease,color .15s ease;
  }
  .button-nav{padding:.68rem .95rem}
  .button-nav:hover,.button-nav.is-current{background:rgba(23,69,245,.08);color:var(--agama-blue-dark)}
  .button-nav-line{display:none}
  .g-button{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:.65rem;
    text-decoration:none;
    background:var(--agama-blue);
    color:#fff;
    border-radius:12px;
    padding:.9rem 1.2rem;
    font-weight:600;
    line-height:1;
    transition:transform .15s ease,background .15s ease,box-shadow .15s ease;
    box-shadow:0 16px 36px rgba(23,69,245,.16);
  }
  .g-button:hover{background:var(--agama-blue-dark);transform:translateY(-1px)}
  .g-button.is-secondary{
    background:#fff;
    color:var(--agama-blue-dark);
    border:1px solid rgba(23,69,245,.15);
    box-shadow:none;
  }
  .g-button-svg img,.g-button .icon-font{width:18px;height:18px}
  .main-nav-brgr{display:none}
  .brgr{display:inline-flex;flex-direction:column;gap:.3rem;padding:.4rem}
  .brgr-pleca{width:26px;height:2px;background:#1e293b}
  .modal-nav-component{
    display:none;
    position:fixed;
    inset:0;
    background:rgba(15,23,42,.54);
    padding:1rem;
  }
  .modal-nav-component.show{display:block}
  .mobile-nav_nav-element{
    margin-left:auto;
    width:min(360px,100%);
    height:100%;
    background:#fff;
    border-radius:24px;
    padding:1rem;
    display:flex;
    flex-direction:column;
    gap:1rem;
  }
  .nav-element_header{display:flex;justify-content:flex-end}
  .close{display:inline-flex;text-decoration:none;padding:.4rem}
  .nav-element_body{display:flex;flex-direction:column;gap:.65rem}
  .btn-modal-nav{padding:.95rem 1rem;background:#f8fafc}
  .btn-modal-nav.cta-btn.whatsapp{background:var(--agama-blue);color:#fff}
  .icon-btn-container{display:flex;align-items:center;justify-content:space-between;gap:1rem}
  .icon-btn_icon img{width:18px;height:18px}
  .hero{
    padding:4.5rem 0 2.5rem;
  }
  .hero-grid{
    display:grid;
    grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);
    gap:2rem;
    align-items:stretch;
  }
  .hero-cover{
    overflow:hidden;
    border-radius:28px;
    min-height:360px;
    box-shadow:var(--agama-shadow);
  }
  .hero-cover img{width:100%;height:100%;object-fit:cover}
  .hero-copy{
    border-radius:28px;
    background:linear-gradient(180deg,#ffffff 0%, #f7faff 100%);
    border:1px solid rgba(219,228,240,.9);
    box-shadow:var(--agama-shadow);
    padding:2rem;
    display:flex;
    flex-direction:column;
    justify-content:center;
    gap:1rem;
  }
  .eyebrow{
    display:inline-flex;
    align-items:center;
    padding:.35rem .75rem;
    border-radius:999px;
    border:1px solid rgba(23,69,245,.22);
    color:var(--agama-blue);
    text-transform:uppercase;
    letter-spacing:.08em;
    font-size:.72rem;
    font-weight:700;
  }
  .hero-copy h1,.hero-copy h2,.section-heading,.post-header h1{
    margin:0;
    font-size:clamp(2rem,4vw,3.75rem);
    line-height:.98;
    letter-spacing:-.04em;
  }
  .hero-copy p,.lede,.blog-intro,.post-summary,.post-content,.newsletter-copy p,.faq-copy p,.post-meta,.post-content li{
    color:var(--agama-text);
    line-height:1.72;
    font-size:1rem;
  }
  .hero-actions{display:flex;flex-wrap:wrap;gap:.85rem;margin-top:.3rem}
  .section-shell{padding:1rem 0 4.25rem}
  .section-heading{
    font-size:clamp(1.7rem,3vw,2.4rem);
    margin-top:.9rem;
  }
  .blog-intro{max-width:64ch;margin:.9rem 0 0}
  .post-grid{
    display:grid;
    grid-template-columns:repeat(3,minmax(0,1fr));
    gap:1.2rem;
    margin-top:2rem;
  }
  .post-card{
    display:flex;
    flex-direction:column;
    text-decoration:none;
    background:#fff;
    border:1px solid rgba(219,228,240,.85);
    border-radius:24px;
    overflow:hidden;
    box-shadow:0 12px 32px rgba(15,23,42,.06);
    transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease;
  }
  .post-card:hover{transform:translateY(-3px);box-shadow:0 22px 40px rgba(15,23,42,.09);border-color:rgba(23,69,245,.26)}
  .post-card-image{aspect-ratio:16 / 10;overflow:hidden;background:#e2e8f0}
  .post-card-image img{width:100%;height:100%;object-fit:cover}
  .post-card-body{padding:1rem 1rem 1.2rem;display:flex;flex-direction:column;gap:.75rem}
  .post-card-meta,.post-meta{
    display:flex;
    flex-wrap:wrap;
    gap:.55rem;
    align-items:center;
    font-size:.82rem;
    color:#64748b;
  }
  .post-card h3{
    margin:0;
    font-size:1.2rem;
    line-height:1.18;
    letter-spacing:-.02em;
  }
  .post-card p{margin:0;color:var(--agama-text);line-height:1.6}
  .pill{
    display:inline-flex;
    align-items:center;
    border-radius:999px;
    padding:.28rem .6rem;
    background:rgba(23,69,245,.08);
    color:var(--agama-blue);
    font-weight:600;
  }
  .newsletter-panel,.faq-panel{
    display:grid;
    grid-template-columns:minmax(0,1fr) minmax(0,.96fr);
    gap:1.3rem;
    background:linear-gradient(135deg,rgba(23,69,245,.08),rgba(255,255,255,.98));
    border:1px solid rgba(23,69,245,.12);
    border-radius:32px;
    padding:1.5rem;
    box-shadow:var(--agama-shadow);
    align-items:center;
  }
  .newsletter-copy h2,.faq-copy h2{
    margin:.9rem 0 0;
    font-size:clamp(1.7rem,2.6vw,2.4rem);
    line-height:1.05;
    letter-spacing:-.03em;
  }
  .newsletter-form-shell{
    background:#14377f;
    border-radius:24px;
    padding:1rem;
    box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);
  }
  .newsletter-form-shell .form-block{margin:0}
  .newsletter-form{display:flex;flex-direction:column;gap:.9rem}
  .newsletter-input{
    width:100%;
    min-height:64px;
    border-radius:18px;
    border:1px solid rgba(255,255,255,.18);
    background:rgba(255,255,255,.12);
    color:#fff;
    padding:0 1.1rem;
    font-size:1rem;
  }
  .newsletter-input::placeholder{color:rgba(255,255,255,.76)}
  .newsletter-input:focus{outline:none;border-color:rgba(255,255,255,.42);background:rgba(255,255,255,.16)}
  .newsletter-submit{
    min-height:64px;
    border:none;
    border-radius:18px;
    font:inherit;
    font-weight:700;
    cursor:pointer;
  }
  .newsletter-submit .icon-font{font-family:'Material Icons'}
  .newsletter-success,.newsletter-error{
    display:none;
    border-radius:16px;
    padding:1rem 1.1rem;
    font-size:.94rem;
    line-height:1.55;
    margin-top:.85rem;
  }
  .newsletter-success{background:#f0fdf4;color:#166534;border:1px solid #bbf7d0}
  .newsletter-error{background:#fff5f5;color:#b91c1c;border:1px solid #fecaca}
  .nl-honeypot{position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none}
  .post-layout{padding:3rem 0 4.25rem}
  .post-header{
    background:#fff;
    border:1px solid rgba(219,228,240,.85);
    border-radius:32px;
    box-shadow:var(--agama-shadow);
    overflow:hidden;
  }
  .post-cover{
    width:100%;
    aspect-ratio:16 / 7;
    object-fit:cover;
  }
  .post-header-copy{padding:1.8rem}
  .breadcrumb{
    display:flex;
    flex-wrap:wrap;
    gap:.45rem;
    align-items:center;
    font-size:.86rem;
    color:#64748b;
    margin-bottom:1rem;
  }
  .breadcrumb a{text-decoration:none;color:var(--agama-blue-dark)}
  .post-summary{margin:1rem 0 0;max-width:68ch}
  .post-content-shell{
    margin-top:1.5rem;
    display:grid;
    grid-template-columns:minmax(0,1fr) minmax(260px,320px);
    gap:1.5rem;
    align-items:start;
  }
  .post-content-card,.post-side-card{
    background:#fff;
    border:1px solid rgba(219,228,240,.85);
    border-radius:28px;
    box-shadow:0 14px 34px rgba(15,23,42,.06);
  }
  .post-content-card{padding:1.5rem}
  .post-content-card h1,.post-content-card h2,.post-content-card h3,.post-content-card h4{
    color:#0f172a;
    line-height:1.14;
    letter-spacing:-.02em;
    margin:1.45rem 0 .7rem;
  }
  .post-content-card h1{font-size:2rem}
  .post-content-card h2{font-size:1.6rem}
  .post-content-card h3{font-size:1.25rem}
  .post-content-card h4{font-size:1.08rem}
  .post-content-card p,.post-content-card li,.post-content-card blockquote{
    font-size:1rem;
    color:var(--agama-text);
    line-height:1.82;
  }
  .post-content-card ul,.post-content-card ol{padding-left:1.25rem}
  .post-content-card a{color:var(--agama-blue-dark)}
  .post-content-card blockquote{
    margin:1.25rem 0;
    padding:1rem 1rem 1rem 1.15rem;
    border-left:4px solid rgba(23,69,245,.35);
    background:#f8fbff;
    border-radius:0 18px 18px 0;
  }
  .post-content-card figure{
    margin:1.25rem auto;
    width:min(100%,640px);
  }
  .post-content-card figure img{
    width:100%;
    height:auto;
    border-radius:22px;
    box-shadow:0 18px 40px rgba(15,23,42,.12);
  }
  .post-side-card{padding:1.25rem}
  .side-heading{
    margin:0 0 1rem;
    font-size:1.05rem;
    letter-spacing:-.02em;
  }
  .side-list{display:flex;flex-direction:column;gap:.85rem}
  .side-link{
    display:grid;
    grid-template-columns:88px minmax(0,1fr);
    gap:.8rem;
    text-decoration:none;
    padding:.55rem;
    border-radius:18px;
    transition:background .15s ease;
  }
  .side-link:hover{background:#f8fafc}
  .side-link img{
    width:88px;
    aspect-ratio:4 / 3;
    object-fit:cover;
    border-radius:14px;
  }
  .side-link strong{
    display:block;
    font-size:.96rem;
    line-height:1.26;
    margin-bottom:.3rem;
  }
  .side-link span{
    display:block;
    color:#64748b;
    font-size:.8rem;
  }
  .site-footer-placeholder{
    background:#fff;
    border-top:1px solid rgba(219,228,240,.9);
    padding:1.6rem 0 2rem;
    margin-top:4rem;
  }
  .sfp-inner{width:min(1180px,calc(100% - 2rem));margin:0 auto;display:flex;flex-direction:column;gap:1rem}
  .sfp-top{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:center}
  .sfp-logo img{height:26px;width:auto}
  .sfp-nav{display:flex;flex-wrap:wrap;gap:.4rem 1rem}
  .sfp-nav a{text-decoration:none;color:#475569;font-size:.82rem}
  .sfp-nav a:hover{color:var(--agama-blue-dark)}
  .sfp-bottom{
    display:flex;
    justify-content:space-between;
    gap:.6rem;
    flex-wrap:wrap;
    padding-top:.85rem;
    border-top:1px solid #eef2f7;
    color:#94a3b8;
    font-size:.76rem;
  }
  .sfp-credit a{color:#64748b;text-decoration:none}
  .sfp-credit a:hover{color:var(--agama-blue-dark)}
  .current-year{display:inline}
  @media (max-width: 980px){
    .hero-grid,.newsletter-panel,.faq-panel,.post-content-shell{grid-template-columns:1fr}
    .post-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
    .post-cover{aspect-ratio:16 / 9}
  }
  @media (max-width: 760px){
    .main-nav-menu,.man-nav-cta{display:none}
    .main-nav-brgr{display:block}
    .hero{padding:3.3rem 0 1.75rem}
    .hero-cover{min-height:240px}
    .hero-copy,.post-header-copy,.post-content-card,.post-side-card,.newsletter-panel,.faq-panel{padding:1.15rem}
    .post-grid{grid-template-columns:1fr}
    .site-footer-placeholder{margin-top:3rem}
  }
`;

function excerptFromHtml(html, maxLength = 190) {
  const text = String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}…` : text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugToImageFile(post) {
  return path.basename(post.featured_image_local_path);
}

function parseDate(dateText) {
  const [day, month, year] = String(dateText).split("/").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateIso(dateText) {
  return parseDate(dateText).toISOString();
}

function formatDateEn(dateText) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseDate(dateText));
}

function stripLeadingSlash(value) {
  return String(value).replace(/^\/+/, "");
}

function imagePath(prefix, fileName) {
  return `${prefix}blog-assets/featured-images/${stripLeadingSlash(fileName)}`;
}

function normalizeContentHtml(html, assetPrefix) {
  return String(html)
    .replaceAll('href="http://www.agama.com.mx/entrada-de-blog/', 'href="/entrada-de-blog/')
    .replaceAll('href="https://www.agama.com.mx/entrada-de-blog/', 'href="/entrada-de-blog/')
    .replaceAll('href="www.agama.com.mx/entrada-de-blog/', 'href="/entrada-de-blog/')
    .replaceAll('href="/entrada-de-blog/', 'href="/entrada-de-blog/')
    .replaceAll(`${INLINE_IMAGE_SOURCE}"`, `${assetPrefix}blog-assets/featured-images/${INLINE_IMAGE_FILE}"`)
    .replace(/<a([^>]+)href="\/entrada-de-blog\/([^"/]+)"([^>]*)>/g, '<a$1href="/entrada-de-blog/$2/"$3>');
}

function renderHead({
  title,
  description,
  canonicalPath,
  imageUrl,
  assetPrefix,
  lang = "es-MX",
  robots = "index,follow",
}) {
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const normalizedImagePath = imageUrl.startsWith("http")
    ? imageUrl
    : imageUrl.startsWith("/")
      ? imageUrl
      : `/${imageUrl.replace(/^(\.\.\/)+/, "")}`;
  const resolvedImage = normalizedImagePath.startsWith("http")
    ? normalizedImagePath
    : `${SITE_URL}${normalizedImagePath}`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="robots" content="${robots}"/>
  <link rel="canonical" href="${canonicalUrl}"/>
  <meta property="og:type" content="article"/>
  <meta property="og:title" content="${escapeHtml(title)}"/>
  <meta property="og:description" content="${escapeHtml(description)}"/>
  <meta property="og:url" content="${canonicalUrl}"/>
  <meta property="og:image" content="${resolvedImage}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${escapeHtml(title)}"/>
  <meta name="twitter:description" content="${escapeHtml(description)}"/>
  <meta name="twitter:image" content="${resolvedImage}"/>
  <link href="${assetPrefix}assets/css/normalize.css?v=${ASSET_VERSION}" rel="stylesheet"/>
  <link href="${assetPrefix}assets/css/webflow.css?v=${ASSET_VERSION}" rel="stylesheet"/>
  <link href="${assetPrefix}assets/css/webflow-base.css?v=${ASSET_VERSION}" rel="stylesheet"/>
  <link href="${assetPrefix}assets/img/logo-circulo.webp" rel="shortcut icon" type="image/webp"/>
  <link href="${assetPrefix}assets/img/logo-circulo.webp" rel="apple-touch-icon"/>
  <style>${GLOBAL_CSS}</style>
  <link href="${assetPrefix}assets/css/home-custom.css?v=20260722masterbatch2" rel="stylesheet"/>
</head>`;
}

function renderNewsletter(assetPrefix, source, lang = "es") {
  const copy =
    lang === "en"
      ? {
          eyebrow: "AGAMA BLOG",
          title: "Get new AGAMA blog posts in your inbox",
          text: "Leave your email and we will let you know when a new post, update or useful industry note goes live.",
          placeholder: "Your email address",
          button: "Sign me up",
        }
      : {
          eyebrow: "BOLETÍN AGAMA",
          title: "Recibe nuevas publicaciones del blog",
          text: "Dejanos tu correo y te avisaremos cuando publiquemos nuevas entradas, novedades y contenidos utiles de AGAMA.",
          placeholder: "Tu correo electronico",
          button: "Registrarse",
        };

  return `<section class="section-shell">
    <div class="global-container">
      <div class="newsletter-panel">
        <div class="newsletter-copy">
          <span class="eyebrow">${copy.eyebrow}</span>
          <h2>${copy.title}</h2>
          <p>${copy.text}</p>
        </div>
        <div class="newsletter-form-shell">
          <div class="form-block">
            <form class="newsletter-form" data-newsletter-form data-newsletter-source="${source}" data-lang="${lang}" novalidate>
              <input class="nl-honeypot" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"/>
              <input class="newsletter-input" type="email" name="email" placeholder="${copy.placeholder}" required/>
              <button class="g-button newsletter-submit" type="submit">
                <span>${copy.button}</span>
                <span class="icon-font">mail</span>
              </button>
            </form>
            <div id="newsletter-ok" class="newsletter-success">
              <div>Tu correo ya quedo registrado. Te avisaremos cuando publiquemos nuevas entradas del blog AGAMA.</div>
            </div>
            <div id="newsletter-fail" class="newsletter-error">
              <div>No pudimos registrar este correo todavia. Intentalo de nuevo en unos minutos.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

function renderScripts(assetPrefix) {
  return `<script src="${assetPrefix}assets/js/webflow-base.js?v=${ASSET_VERSION}"></script>
<script src="${assetPrefix}assets/js/supabase-config.js?v=${ASSET_VERSION}"></script>
<script src="${assetPrefix}assets/js/home.js?v=${ASSET_VERSION}"></script>`;
}

function renderArchiveCard(post, assetPrefix, locale = "es") {
  const imageUrl = imagePath(assetPrefix, slugToImageFile(post));
  const excerpt = excerptFromHtml(post.content_html, 145);
  const dateLabel = locale === "en" ? formatDateEn(post.date) : post.date;

  return `<a href="/entrada-de-blog/${post.slug}/" class="post-card">
    <div class="post-card-image">
      <img src="${imageUrl}" alt="${escapeHtml(post.title)}" loading="lazy"/>
    </div>
    <div class="post-card-body">
      <div class="post-card-meta">
        <span>${dateLabel}</span>
        <span class="pill">${post.category}</span>
      </div>
      <h3>${post.title}</h3>
      <p>${escapeHtml(excerpt)}</p>
    </div>
  </a>`;
}

function renderArchivePage(posts, {
  assetPrefix,
  canonicalPath,
  title,
  description,
  heroLabel,
  heroTitle,
  heroText,
  newsletterSource,
  lang = "es-MX",
  newsletterLang = "es",
}) {
  const [featured, ...rest] = posts;
  const featuredImage = imagePath(assetPrefix, slugToImageFile(featured));
  const archiveCards = rest.map((post) => renderArchiveCard(post, assetPrefix, newsletterLang)).join("\n");
  const switchHref = newsletterLang === "en" ? "/blog/" : "/blog/index.en.html";

  return `${renderHead({
    title,
    description,
    canonicalPath,
    imageUrl: featuredImage,
    assetPrefix,
    lang,
  })}
<body>
  <div class="page-shell">
    ${buildNav({ root: assetPrefix, locale: newsletterLang, switchHref, current: "blog" })}
    <main>
      <section class="hero">
        <div class="global-container">
          <div class="hero-grid">
            <a href="/entrada-de-blog/${featured.slug}/" class="hero-cover" aria-label="Abrir ${escapeHtml(featured.title)}">
              <img src="${featuredImage}" alt="${escapeHtml(featured.title)}" fetchpriority="high"/>
            </a>
            <div class="hero-copy">
              <span class="eyebrow">${heroLabel}</span>
              <h1>${heroTitle}</h1>
              <p>${heroText}</p>
              <div class="post-meta">
                <span>${featured.date}</span>
                <span class="pill">${featured.category}</span>
              </div>
              <h2 style="font-size:clamp(1.8rem,2.8vw,2.85rem)">${featured.title}</h2>
              <p class="lede">${escapeHtml(excerptFromHtml(featured.content_html, 180))}</p>
              <div class="hero-actions">
                <a href="/entrada-de-blog/${featured.slug}/" class="g-button">Leer mas</a>
                <a href="#archivo-blog" class="g-button is-secondary">Ver archivo</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-shell" id="archivo-blog">
        <div class="global-container">
          <span class="eyebrow">Noticias</span>
          <h2 class="section-heading">Todas las publicaciones del blog</h2>
          <div class="post-grid">
            ${archiveCards}
          </div>
        </div>
      </section>

      ${renderNewsletter(assetPrefix, newsletterSource, newsletterLang)}
    </main>
    ${buildFooter(assetPrefix, newsletterLang)}
  </div>
  ${renderScripts(assetPrefix)}
</body>
</html>
`;
}

function renderRelatedPosts(posts, currentSlug, assetPrefix) {
  const items = posts.filter((post) => post.slug !== currentSlug).slice(0, 3);

  return items
    .map((post) => {
      const imageUrl = imagePath(assetPrefix, slugToImageFile(post));
      return `<a href="/entrada-de-blog/${post.slug}/" class="side-link">
        <img src="${imageUrl}" alt="${escapeHtml(post.title)}" loading="lazy"/>
        <div>
          <strong>${post.title}</strong>
          <span>${post.date} · ${post.category}</span>
        </div>
      </a>`;
    })
    .join("\n");
}

function renderSinglePage(post, posts) {
  const assetPrefix = "../../";
  const featuredImage = imagePath(assetPrefix, slugToImageFile(post));
  const normalizedContent = normalizeContentHtml(post.content_html, assetPrefix);
  const relatedPosts = renderRelatedPosts(posts, post.slug, assetPrefix);

  return `${renderHead({
    title: `${post.title} | AGAMA Blog`,
    description: excerptFromHtml(post.content_html, 170),
    canonicalPath: `/entrada-de-blog/${post.slug}/`,
    imageUrl: featuredImage,
    assetPrefix,
  })}
<body>
  <div class="page-shell">
    ${buildNav({ root: assetPrefix, locale: "es", switchHref: "/blog/index.en.html", current: "blog" })}
    <main class="post-layout">
      <div class="container-medium">
        <article class="post-header">
          <img class="post-cover" src="${featuredImage}" alt="${escapeHtml(post.title)}" fetchpriority="high"/>
          <div class="post-header-copy">
            <div class="breadcrumb">
              <a href="/blog/">Blog AGAMA</a>
              <span>/</span>
              <span>${post.title}</span>
            </div>
            <div class="post-meta">
              <span>${post.date}</span>
              <span class="pill">${post.category}</span>
            </div>
            <h1>${post.title}</h1>
            <p class="post-summary">${escapeHtml(excerptFromHtml(post.content_html, 220))}</p>
          </div>
        </article>

        <div class="post-content-shell">
          <div class="post-content-card">
            <div class="post-content">${normalizedContent}</div>
          </div>
          <aside class="post-side-card">
            <h2 class="side-heading">Sigue leyendo</h2>
            <div class="side-list">
              ${relatedPosts}
            </div>
          </aside>
        </div>
      </div>

      ${renderNewsletter(assetPrefix, "agama-blog-post", "es")}
    </main>
    ${buildFooter(assetPrefix, "es")}
  </div>
  ${renderScripts(assetPrefix)}
</body>
</html>
`;
}

async function writePage(fileUrl, html) {
  await mkdir(new URL(".", fileUrl), { recursive: true });
  await writeFile(fileUrl, `${html.trim()}\n`, "utf8");
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function preserveManualPostDirs() {
  const postsDirPath = fileURLToPath(postsDir);
  const tmpRoot = await mkdtemp(path.join(tmpdir(), "agama-blog-preserve-"));
  const preserved = [];

  for (const slug of MANUAL_POST_SLUGS_TO_PRESERVE) {
    const sourcePath = path.join(postsDirPath, slug);
    if (!(await pathExists(sourcePath))) continue;

    const targetPath = path.join(tmpRoot, slug);
    await cp(sourcePath, targetPath, { recursive: true });
    preserved.push({ slug, sourcePath, targetPath });
  }

  return { preserved, tmpRoot };
}

async function restoreManualPostDirs({ preserved, tmpRoot }) {
  for (const entry of preserved) {
    await rm(entry.sourcePath, { recursive: true, force: true });
    await mkdir(path.dirname(entry.sourcePath), { recursive: true });
    await cp(entry.targetPath, entry.sourcePath, { recursive: true });
  }

  await rm(tmpRoot, { recursive: true, force: true });
}

async function copyFeaturedImages(posts) {
  await rm(publicImageDir, { recursive: true, force: true });
  await mkdir(publicImageDir, { recursive: true });

  for (const post of posts) {
    const sourcePath = new URL(post.featured_image_local_path, importDir);
    const targetPath = new URL(slugToImageFile(post), publicImageDir);
    await copyFile(sourcePath, targetPath);
  }

  const inlineSource = new URL(`featured-images/${INLINE_IMAGE_FILE}`, importDir);
  await copyFile(inlineSource, new URL(INLINE_IMAGE_FILE, publicImageDir));
}

async function main() {
  const posts = JSON.parse(await readFile(snapshotPath, "utf8"));
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error("Blog snapshot is empty or invalid.");
  }

  const manualPostDirs = await preserveManualPostDirs();

  try {
    await copyFeaturedImages(posts);
    await rm(postsDir, { recursive: true, force: true });

    await writePage(
      new URL("index.html", blogDir),
      renderArchivePage(posts, {
        assetPrefix: "../",
        canonicalPath: "/blog/",
        title: "Blog AGAMA | Sólo la mejor información para ti",
        description:
          "Noticias, explicaciones técnicas y publicaciones históricas de AGAMA sobre pigmentos, masterbatch, aditivos y coloración para plásticos.",
        heroLabel: "Blog AGAMA",
        heroTitle: "Plásticos con acento",
        heroText:
          "Sumérgete en nuestro blog con publicaciones históricas, novedades y explicaciones claras sobre pigmentos, masterbatch y aditivos para la industria del plástico.",
        newsletterSource: "agama-blog",
      })
    );

    await writePage(
      new URL("index.en.html", blogDir),
      renderArchivePage(posts, {
        assetPrefix: "../",
        canonicalPath: "/blog/index.en.html",
        title: "AGAMA Blog | Latest posts and plastics insights",
        description:
          "Explore AGAMA blog posts about pigments, masterbatch, additives and color formulation for plastics.",
        heroLabel: "AGAMA BLOG",
        heroTitle: "Plastics with a point of view",
        heroText:
          "Browse AGAMA posts, technical notes and practical explainers about pigments, masterbatch, additives and color formulation for plastics.",
        newsletterSource: "agama-blog-en",
        lang: "en",
        newsletterLang: "en",
      })
    );

    await writePage(
      new URL("index.html", legacyBlogDir),
      renderArchivePage(posts, {
        assetPrefix: "../",
        canonicalPath: "/blog/",
        title: "Blog AGAMA | Sólo la mejor información para ti",
        description:
          "Archivo histórico del blog AGAMA conservado dentro del sitio estático migrado.",
        heroLabel: "Archivo histórico",
        heroTitle: "Blog AGAMA",
        heroText:
          "Esta ruta histórica se mantiene activa y apunta al archivo actual del blog migrado, ya sin dependencia operativa de Webflow.",
        newsletterSource: "agama-blog-legacy",
      })
    );

    for (const post of posts) {
      await writePage(new URL(`${post.slug}/index.html`, postsDir), renderSinglePage(post, posts));
    }
  } finally {
    await restoreManualPostDirs(manualPostDirs);
  }

  console.log(`Generated static blog archive and ${posts.length} post pages.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
