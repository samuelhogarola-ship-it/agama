import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BLOG_INDEXES = [
  { locale: "es", path: "blog/index.html" },
  { locale: "en", path: "blog/index.en.html" },
];

export async function buildHistoryCatalog({ root = DEFAULT_ROOT } = {}) {
  const legacyPath = path.join(root, "wordpress", "import", "agama-blog-posts.snapshot.json");
  const legacy = JSON.parse(await readFile(legacyPath, "utf8"));
  const legacyBySlug = new Map(legacy.map((post) => [post.slug, post]));
  const entries = [];

  for (const index of BLOG_INDEXES) {
    const indexHtml = await readFile(path.join(root, index.path), "utf8");
    const featuredUrls = extractFeaturedUrls(indexHtml);
    for (const url of extractEditorialUrls(indexHtml)) {
      const { slug, outputFile } = parseArticleUrl(url, index.locale);
      const sourcePath = path.posix.join("entrada-de-blog", slug, outputFile);
      const html = await readFile(path.join(root, sourcePath), "utf8");
      const old = index.locale === "es" ? legacyBySlug.get(slug) : null;
      const bodyRegion = extractBody(html);
      entries.push({
        id: index.locale === "en" ? `en-${slug}` : slug,
        slug,
        locale: index.locale,
        outputFile,
        title: old?.title || extractHeading(html),
        description: old?.description || extractMeta(html, "description"),
        date: normalizeDate(old?.date || extractStructuredDate(html)),
        category: old?.category || extractCategory(html, index.locale),
        author: old?.author || "AGAMA",
        image: old?.featured_image_url || extractPropertyMeta(html, "og:image"),
        status: "published",
        format: "html",
        body: old?.content_html || bodyRegion.html,
        bodyRegion: bodyRegion.kind,
        origin: "history",
        sourcePath,
        url,
        featured: featuredUrls.has(url),
      });
    }
  }

  return entries.sort((a, b) => a.id.localeCompare(b.id));
}

export async function writeHistoryCatalog({ root = DEFAULT_ROOT, output } = {}) {
  const target = output || path.join(root, "content", "blogger", "history.json");
  const catalog = await buildHistoryCatalog({ root });
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  return { target, count: catalog.length };
}

function extractEditorialUrls(html) {
  const urls = [];
  const seen = new Set();
  const anchor = /<a\s+href="([^"]+)"\s+class="post-card"[^>]*>/g;
  for (const match of html.matchAll(anchor)) {
    if (!match[1].startsWith("/entrada-de-blog/") || seen.has(match[1])) continue;
    seen.add(match[1]);
    urls.push(match[1]);
  }
  return urls;
}

function extractFeaturedUrls(html) {
  const urls = new Set();
  const anchor = /<a\s+href="([^"]+)"\s+class="hero-cover"[^>]*>/g;
  for (const match of html.matchAll(anchor)) {
    if (match[1].startsWith("/entrada-de-blog/")) urls.add(match[1]);
  }
  return urls;
}

function parseArticleUrl(url, locale) {
  const match = url.match(/^\/entrada-de-blog\/([a-z0-9]+(?:-[a-z0-9]+)*)\/(index\.en\.html)?$/);
  if (!match) throw new Error(`Ruta editorial no válida: ${url}`);
  const outputFile = match[2] || "index.html";
  if ((locale === "en") !== (outputFile === "index.en.html")) {
    throw new Error(`La ruta ${url} no coincide con el idioma ${locale}.`);
  }
  return { slug: match[1], outputFile };
}

function extractBody(html) {
  const rich = extractBalancedDiv(html, "post-content");
  if (rich) return { kind: "post-content", html: rich };
  const article = html.match(/<article\s+class="article-body"[^>]*>([\s\S]*?)<\/article>/);
  if (article) return { kind: "article-body", html: article[1].trim() };
  throw new Error("No se encontró un límite editorial conocido en el artículo.");
}

function extractBalancedDiv(html, className) {
  const open = new RegExp(`<div\\s+class="[^"]*\\b${className}\\b[^"]*"[^>]*>`, "g");
  const match = open.exec(html);
  if (!match) return "";
  const contentStart = match.index + match[0].length;
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = contentStart;
  let depth = 1;
  for (let tag = tags.exec(html); tag; tag = tags.exec(html)) {
    depth += tag[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(contentStart, tag.index).trim();
  }
  throw new Error(`El contenedor .${className} no está cerrado.`);
}

function extractHeading(html) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match) throw new Error("El artículo no tiene h1.");
  return textContent(match[1]);
}

function extractMeta(html, name) {
  const escaped = escapeRegExp(name);
  const match = html.match(new RegExp(`<meta\\s+name="${escaped}"\\s+content="([^"]*)"\\s*\\/?>(?:\\s*)`, "i"));
  if (!match) throw new Error(`Falta meta ${name}.`);
  return decodeEntities(match[1]).trim();
}

function extractPropertyMeta(html, property) {
  const escaped = escapeRegExp(property);
  const match = html.match(new RegExp(`<meta\\s+property="${escaped}"\\s+content="([^"]*)"\\s*\\/?>(?:\\s*)`, "i"));
  return match ? decodeEntities(match[1]).trim() : "";
}

function extractStructuredDate(html) {
  const published = html.match(/"datePublished"\s*:\s*"([^"]+)"/);
  const modified = html.match(/"dateModified"\s*:\s*"([^"]+)"/);
  const visible = html.match(/<time[^>]*datetime="([^"]+)"/i);
  const postMeta = html.match(/<div\s+class="post-meta"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || "";
  const numericDate = postMeta.match(/<span[^>]*>\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*<\/span>/i);
  const value = published?.[1] || modified?.[1] || visible?.[1] || numericDate?.[1];
  if (!value) throw new Error("El artículo no tiene fecha estructurada.");
  return value;
}

function extractCategory(html, locale) {
  const meta = html.match(/<div\s+class="post-meta"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || "";
  const pill = meta.match(/<span[^>]*class="[^"]*\bpill\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1];
  return pill ? textContent(pill) : (locale === "en" ? "AGAMA Blog" : "Blog");
}

function normalizeDate(value) {
  const raw = String(value || "").trim();
  const euro = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (euro) return `${euro[3]}-${euro[2].padStart(2, "0")}-${euro[1].padStart(2, "0")}`;
  return raw.slice(0, 10);
}

function textContent(value) {
  return decodeEntities(String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
}

function decodeEntities(value) {
  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseArgs(argv) {
  const options = { root: DEFAULT_ROOT, output: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--root") options.root = path.resolve(argv[++index]);
    else if (argv[index] === "--output") options.output = path.resolve(argv[++index]);
    else throw new Error(`Argumento desconocido: ${argv[index]}`);
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await writeHistoryCatalog(parseArgs(process.argv.slice(2)));
  console.log(`Saved ${result.count} editorial documents to ${result.target}`);
}
