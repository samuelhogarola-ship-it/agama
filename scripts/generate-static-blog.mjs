import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const snapshotPath = new URL("../wordpress/import/agama-blog-posts.snapshot.json", import.meta.url);
const importDir = new URL("../wordpress/import/", import.meta.url);
const cacheDir = new URL("../.cache/blog-source/", import.meta.url);
const legacyArchiveDir = new URL("../blog-agama/", import.meta.url);
const liveArchiveDir = new URL("../blog/", import.meta.url);
const postsDir = new URL("../entrada-de-blog/", import.meta.url);
const publicImageDir = new URL("../blog-assets/featured-images/", import.meta.url);

const SITE_URL = "https://www.agama.com.mx";
const ARCHIVE_SOURCE_URL = `${SITE_URL}/blog-agama`;
const LIVE_ARCHIVE_PATH = "/blog";
const LEGACY_ARCHIVE_PATH = "/blog-agama";
const FOOTER_BOTTOM_TEMPLATE = (assetPrefix) => `
<div class="site-footer-placeholder">
  <div class="sfp-inner">
    <div class="sfp-top">
      <a href="/" class="sfp-logo">
        <img src="${assetPrefix}/assets/img/agama.svg" alt="AGAMA" loading="lazy" height="26"/>
      </a>
      <nav class="sfp-nav">
        <a href="/productos/pigmentos/">Pigmentos</a>
        <a href="/productos/masterbatch/">Masterbatch</a>
        <a href="/productos/aditivos/">Aditivos</a>
        <a href="/entregas/">Entregas</a>
        <a href="/eventos/">Eventos</a>
        <a href="/blog/">Blog</a>
        <a href="/vacantes/">Vacantes</a>
        <a href="/contacto/">Contacto</a>
        <a href="/legal/">Legal</a>
      </nav>
    </div>
    <div class="sfp-bottom">
      <span class="sfp-copy">AGAMA - Pigmentos &amp; Masterbatch® 2025</span>
      <span class="sfp-credit">Diseñado y mantenido por <a href="https://webfuengirola.com" target="_blank" rel="noopener noreferrer">Samuel Hogarola · Web Fuengirola Studio</a></span>
    </div>
  </div>
</div>`;
const BLOG_STYLE_OVERRIDES = `
.news-letter-form .ph-honeypot{position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;}
.site-footer-placeholder{background:#fff;padding:1.75rem 1.5rem;border-top:1px solid #e5e7eb;}
.sfp-inner{max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:.875rem;}
.sfp-top{display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;}
.sfp-logo img{height:26px;}
.sfp-nav{display:flex;flex-wrap:wrap;gap:.25rem 1rem;align-items:center;}
.sfp-nav a{font-family:'Inter',sans-serif;font-size:.8rem;color:#555;text-decoration:none;transition:color .15s;white-space:nowrap;}
.sfp-nav a:hover{color:#002f6c;}
.sfp-bottom{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.4rem;padding-top:.75rem;border-top:1px solid #f3f4f6;}
.sfp-copy,.sfp-credit,.sfp-credit a{font-family:'Inter',sans-serif;font-size:.72rem;color:#aaa;text-decoration:none;}
.sfp-credit a:hover{color:#002f6c;text-decoration:underline;}
.global-brand-logo img,.post-card-cover,.featured-blog-slide_image{display:block;}
.slider-featured-blog .w-slider-mask,.slider-featured-blog .w-slide,.featured-blog-slide{height:auto!important;}
.featured-blog-slide_image,.post-card-cover{width:100%;height:100%;object-fit:cover;}
.post-card-cover-hldr{aspect-ratio:16/10;overflow:hidden;}
.grid.feed-blog .w-dyn-item{content-visibility:auto;contain-intrinsic-size:420px;}
.text-rich-text img,.text-rich-text figure{max-width:100%!important;height:auto;}
.text-rich-text figure>div{max-width:100%!important;}
@media screen and (max-width:991px){
  .featured-blog-slide{grid-template-columns:1fr!important;}
  .featured-blog-slide_image{min-height:16rem;}
}
@media screen and (max-width:767px){
  .blog-page .page-padding,.blog-feed .page-padding,.post-body .page-padding{padding-left:1rem!important;padding-right:1rem!important;}
  .blog-page .padding-page{padding-top:1rem!important;padding-bottom:1.5rem!important;}
  .blog-feed .page-padding{padding-top:0!important;padding-bottom:2rem!important;}
  .padding-main-nav .padding-vertical{padding-top:.9rem!important;padding-bottom:.9rem!important;}
  .global-brand-logo img{max-height:2.75rem!important;width:auto!important;}
  .featured-blog-post{gap:1rem!important;padding:1.125rem!important;align-self:start!important;}
  .featured-blog-post .f-vertical{gap:.85rem!important;}
  .featured-blog-post h2{font-size:2rem!important;line-height:1.02!important;}
  .featured-blog-post .g-paragraph{font-size:1rem!important;line-height:1.5!important;}
  .featured-blog-post .g-button{margin-top:.25rem!important;}
  .featured-blog-slide_image{min-height:13rem!important;}
  .slider-featured-blog{padding-bottom:2.5rem!important;margin-bottom:1.75rem!important;}
  .slider-featured-blog_arrow.left{left:.25rem!important;top:auto!important;bottom:0!important;transform:none!important;}
  .slider-featured-blog_arrow.w-slider-arrow-right{right:.25rem!important;top:auto!important;bottom:0!important;transform:none!important;}
  .grid.feed-blog{grid-template-columns:1fr!important;gap:1rem!important;}
  .post-card{gap:.65rem!important;}
  .post-card .global-heading-text{font-size:1.4rem!important;line-height:1.14!important;}
  .post-body-card{padding:1.25rem!important;}
  .post-header-hldr-title h1{font-size:2rem!important;line-height:1.05!important;}
  .footer-v2-a .page-padding,.site-footer-placeholder{padding-left:1rem!important;padding-right:1rem!important;}
  .sfp-top,.sfp-bottom{align-items:flex-start;}
}
@media screen and (max-width:479px){
  .slider-featured-blog{margin-bottom:1.5rem!important;padding-bottom:2rem!important;}
  .featured-blog-post h2{font-size:1.75rem!important;}
  .post-card .global-heading-text{font-size:1.2rem!important;line-height:1.18!important;}
  .post-card-data{gap:.35rem!important;}
  .post-header-hldr-title .padding-hdr-post{padding-top:7rem!important;padding-bottom:2.5rem!important;}
}`;

function slugToCacheKey(slug) {
  return slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

function excerptFromHtml(html, maxLength = 180) {
  const text = String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 3).trim()}...` : text;
}

function fetchHtml(url) {
  return execFileSync("curl", ["-L", "-s", url], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

async function fetchOrReadCache(cacheKey, url) {
  const cacheFile = new URL(`${cacheKey}.html`, cacheDir);

  try {
    const html = fetchHtml(url);
    if (!html.includes("<html")) {
      throw new Error(`Unexpected HTML response for ${url}`);
    }
    await mkdir(cacheDir, { recursive: true });
    await writeFile(cacheFile, html, "utf8");
    return html;
  } catch (error) {
    try {
      return await readFile(cacheFile, "utf8");
    } catch {
      throw new Error(`Could not fetch or read cached source for ${url}: ${error.message}`);
    }
  }
}

function injectNewsletterForm(html, source) {
  let output = html.replace(
    /<form id="wf-form-Contacto-de-Bolet-n-Web"[\s\S]*?class="news-letter-form"[^>]*>/,
    `<form id="legacy-blog-newsletter-form" name="legacy-blog-newsletter-form" data-name="Legacy Blog Newsletter" method="post" class="news-letter-form" data-newsletter-form data-newsletter-source="${source}" novalidate>`
  );

  output = output.replace(
    "Suscríbete a nuestro boletín y entérate de ofertas, nuevos productos y más!",
    "Suscríbete para recibir nuevas publicaciones y actualizaciones del blog AGAMA."
  );

  output = output.replace(
    '<input type="submit" data-wait="Please wait..." class="g-button is-newsletter w-button" value="Registrarse"/>',
    '<input id="nl-website" class="ph-honeypot" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"/><input type="submit" data-wait="Please wait..." class="g-button is-newsletter w-button" value="Registrarse"/>'
  );

  output = output.replace(
    '<div class="form-success w-form-done">',
    '<div id="newsletter-ok" class="form-success w-form-done" hidden style="display:none;">'
  );

  output = output.replace(
    '<div class="w-form-fail">',
    '<div id="newsletter-fail" class="w-form-fail" hidden style="display:none;">'
  );

  output = output.replace(
    "Pronto podrás saber más de nuestros productos, eventos y noticias.",
    "Te avisaremos cuando publiquemos nuevas entradas del blog AGAMA."
  );

  return output;
}

function injectLocalSupport(html, assetPrefix) {
  let output = html;

  if (!output.includes(".site-footer-placeholder")) {
    output = output.replace("</head>", `<style>${BLOG_STYLE_OVERRIDES}</style></head>`);
  }

  if (!output.includes(`${assetPrefix}/assets/js/home.js`)) {
    output = output.replace(
      "</body>",
      `<script src="${assetPrefix}/assets/js/supabase-config.js"></script><script src="${assetPrefix}/assets/js/home.js" defer></script></body>`
    );
  }

  return output;
}

function stripThirdPartyWeight(html) {
  return html
    .replace(
      /(<link href="https:\/\/www\.agama\.com\.mx[^"]*" rel="canonical"\/>)[\s\S]*?(<!-- Please keep this css code to improve the font quality-->)/,
      "$1$2"
    )
    .replace(/<!-- Google tag \(gtag\.js\) -->[\s\S]*?<!-- End Facebook Pixel Code -->/g, "")
    .replace(/<script type="text\/javascript" src="https:\/\/platform-api\.sharethis\.com\/js\/sharethis\.js#[^"]*" async="async"><\/script>/g, "")
    .replace(/<script>\s*gtag\('event', 'conversion'[\s\S]*?<\/script>/g, "");
}

function replaceFooter(html, assetPrefix) {
  return html.replace(/<div class="footer-v2-b">[\s\S]*?<\/footer>/, `${FOOTER_BOTTOM_TEMPLATE(assetPrefix)}</footer>`);
}

function replaceArchiveLinks(html, archivePath) {
  return html
    .replaceAll(`${SITE_URL}/blog-agama`, `${SITE_URL}${archivePath}`)
    .replaceAll('href="/blog-agama"', `href="${archivePath}"`);
}

function normalizeArticleLinks(html) {
  return html
    .replaceAll('href="http://www.agama.com.mx/entrada-de-blog/', 'href="/entrada-de-blog/')
    .replaceAll('href="https://www.agama.com.mx/entrada-de-blog/', 'href="/entrada-de-blog/');
}

function buildArchivePage(sourceHtml, archivePath) {
  let output = replaceArchiveLinks(sourceHtml, archivePath);
  output = stripThirdPartyWeight(output);
  output = injectNewsletterForm(output, "agama-blog");
  output = replaceFooter(output, "..");
  return injectLocalSupport(output, "..");
}

function buildSinglePage(sourceHtml, post) {
  let output = replaceArchiveLinks(sourceHtml, LIVE_ARCHIVE_PATH);
  output = stripThirdPartyWeight(output);
  output = normalizeArticleLinks(output);
  output = output.replace('<a href="#">Blog AGAMA</a>', `<a href="${LIVE_ARCHIVE_PATH}">Blog AGAMA</a>`);
  output = output.replace(/<div id="w-node-[^"]*" class="addthis">[\s\S]*?<\/div>/, "");
  output = output.replace(/<div class="audio-player-hldr w-condition-invisible">[\s\S]*?<\/div>\s*<div class="post-body-card">/, '<div class="post-body-card">');
  output = output.replace(
    `<link href="${SITE_URL}/entrada-de-blog/${post.slug}" rel="canonical"/>`,
    `<link href="${SITE_URL}/entrada-de-blog/${post.slug}" rel="canonical"/>`
  );
  output = injectNewsletterForm(output, "agama-blog");
  output = replaceFooter(output, "../..");
  output = output.replace(/<script[^>]*src="https:\/\/trueaudioplayer\.b-cdn\.net\/true-audio-player@1\.1\.1\.min\.js"[^>]*><\/script>/g, "");
  return injectLocalSupport(output, "../..");
}

async function writePage(fileUrl, html) {
  await mkdir(new URL(".", fileUrl), { recursive: true });
  await writeFile(fileUrl, `${html.trim()}\n`, "utf8");
}

async function copyFeaturedImages(posts) {
  await rm(publicImageDir, { recursive: true, force: true });
  await mkdir(publicImageDir, { recursive: true });

  for (const post of posts) {
    const sourcePath = new URL(post.featured_image_local_path, importDir);
    const fileName = path.basename(post.featured_image_local_path);
    await copyFile(sourcePath, new URL(fileName, publicImageDir));
  }
}

async function main() {
  const posts = JSON.parse(await readFile(snapshotPath, "utf8"));
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error("Blog snapshot is empty or invalid.");
  }

  await mkdir(liveArchiveDir, { recursive: true });
  await mkdir(legacyArchiveDir, { recursive: true });
  await rm(postsDir, { recursive: true, force: true });

  await copyFeaturedImages(posts);

  const archiveSource = await fetchOrReadCache("archive", ARCHIVE_SOURCE_URL);
  await writePage(new URL("index.html", liveArchiveDir), buildArchivePage(archiveSource, LIVE_ARCHIVE_PATH));
  await writePage(new URL("index.html", legacyArchiveDir), buildArchivePage(archiveSource, LEGACY_ARCHIVE_PATH));

  for (const post of posts) {
    const sourceHtml = await fetchOrReadCache(slugToCacheKey(post.slug), post.source_url);
    await writePage(new URL(`${post.slug}/index.html`, postsDir), buildSinglePage(sourceHtml, post));
  }

  console.log(
    `Generated static blog from live Webflow source (${posts.length} posts, archive excerpt: "${excerptFromHtml(archiveSource, 60)}").`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
