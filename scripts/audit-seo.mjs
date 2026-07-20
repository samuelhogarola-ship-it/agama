import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://www.agama.com.mx";
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const auditRoot = path.resolve(process.argv[2] ?? PROJECT_ROOT);
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function htmlFileForUrl(url) {
  const pathname = decodeURIComponent(new URL(url).pathname);
  if (pathname === "/") return path.join(auditRoot, "index.html");
  if (pathname.endsWith("/")) return path.join(auditRoot, pathname, "index.html");
  return path.join(auditRoot, pathname);
}

function canonicalOf(html) {
  return html.match(/<link\b[^>]*\brel=["'][^"']*canonical[^"']*["'][^>]*\bhref=["']([^"']+)["'][^>]*>/i)?.[1]
    ?? html.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["'][^"']*canonical[^"']*["'][^>]*>/i)?.[1]
    ?? null;
}

function linksToBlogEntries(html) {
  return new Set(
    [...html.matchAll(/href=["'](\/entrada-de-blog\/[^"'#?]+\/?)["']/gi)].map((match) => match[1]),
  );
}

const sitemapPath = path.join(auditRoot, "sitemap.xml");
if (!fs.existsSync(sitemapPath)) {
  fail("sitemap.xml no existe");
} else {
  const sitemap = read(sitemapPath);
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const uniqueUrls = new Set(urls);

  if (urls.length !== uniqueUrls.size) fail("El sitemap contiene URLs duplicadas");
  if (urls.some((url) => !url.startsWith(`${SITE_URL}/`) && url !== `${SITE_URL}/`)) {
    fail("El sitemap contiene una URL fuera del host HTTPS canónico");
  }
  if (urls.some((url) => url.includes("/blog-agama/"))) fail("El sitemap incluye /blog-agama/");

  for (const url of urls) {
    const filePath = htmlFileForUrl(url);
    if (!fs.existsSync(filePath)) {
      fail(`No existe el archivo de ${url}`);
      continue;
    }

    const html = read(filePath);
    if (/\bnoindex\b/i.test(html.match(/<meta\b[^>]*\bname=["']robots["'][^>]*>/i)?.[0] ?? "")) {
      fail(`${url} está en sitemap y tiene noindex`);
    }
    if (canonicalOf(html) !== url) fail(`${url} no coincide con su canonical`);
  }

  for (const route of ["/masterbatch/", "/pigmentos/", "/aditivos/", "/productos/", "/filiales/online/"]) {
    if (!uniqueUrls.has(`${SITE_URL}${route}`)) fail(`Falta ${route} en sitemap`);
  }

  console.log(`Sitemap: ${urls.length} URLs únicas, indexables y con canonical coincidente`);
}

const landingExpectations = [
  ["masterbatch", "Masterbatch en México | AGAMA", "/productos/masterbatch/"],
  ["pigmentos", "Pigmentos en México | AGAMA", "/productos/pigmentos/"],
  ["aditivos", "Aditivos para plástico en México | AGAMA", "/productos/aditivos/"],
];

for (const [slug, expectedTitle, catalogHref] of landingExpectations) {
  const filePath = path.join(auditRoot, slug, "index.html");
  if (!fs.existsSync(filePath)) {
    fail(`Falta /${slug}/`);
    continue;
  }

  const html = read(filePath);
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  if (title !== expectedTitle) fail(`Title inesperado en /${slug}/`);
  if (h1Count !== 1) fail(`/${slug}/ tiene ${h1Count} H1`);
  if (!html.includes(`href="${catalogHref}"`)) fail(`/${slug}/ no enlaza a ${catalogHref}`);
  if (!html.includes('href="/filiales/online/"')) fail(`/${slug}/ no enlaza a /filiales/online/`);
  if (!html.includes('"@type":"BreadcrumbList"')) fail(`/${slug}/ no incluye BreadcrumbList`);
  if (!html.includes('"@type":"FAQPage"')) fail(`/${slug}/ no incluye FAQPage`);
  if (/href=["']\/online(?:\/|["'])/i.test(html)) fail(`/${slug}/ enlaza al portal /online/ excluido`);
}

const productHub = read(path.join(auditRoot, "productos", "index.html"));
for (const slug of ["masterbatch", "pigmentos", "aditivos"]) {
  if (!productHub.includes(`href="/${slug}/"`)) fail(`/productos/ no enlaza a /${slug}/`);
}

for (const slug of ["masterbatch", "pigmentos", "aditivos"]) {
  const category = read(path.join(auditRoot, "productos", slug, "index.html"));
  if (!category.includes(`href="../../${slug}/"`)) fail(`/productos/${slug}/ no enlaza a /${slug}/`);
  if (!category.includes('href="../../filiales/online/"')) {
    fail(`/productos/${slug}/ no enlaza a /filiales/online/`);
  }
}

const productCounts = Object.fromEntries(
  ["masterbatch", "pigmentos", "aditivos"].map((slug) => {
    const categoryDirectory = path.join(auditRoot, "productos", slug);
    const count = fs.readdirSync(categoryDirectory, { withFileTypes: true }).filter((entry) => (
      entry.isDirectory() && fs.existsSync(path.join(categoryDirectory, entry.name, "index.html"))
    )).length;
    return [slug, count];
  }),
);
const totalProducts = Object.values(productCounts).reduce((sum, count) => sum + count, 0);
if (totalProducts !== 135) fail(`Se esperaban 135 fichas ES y se encontraron ${totalProducts}`);
console.log(`Catálogo ES: ${totalProducts} fichas intactas (${JSON.stringify(productCounts)})`);

const blog = linksToBlogEntries(read(path.join(auditRoot, "blog", "index.html")));
const legacyBlog = linksToBlogEntries(read(path.join(auditRoot, "blog-agama", "index.html")));
const missingLegacyEntries = [...legacyBlog].filter((entry) => !blog.has(entry));
if (missingLegacyEntries.length) fail(`/blog/ no conserva ${missingLegacyEntries.length} entradas del índice legacy`);

const nginx = read(path.join(PROJECT_ROOT, "nginx.conf"));
if (!/location = \/blog-agama\s+\{ return 301 \/blog\/; \}/.test(nginx)) {
  fail("/blog-agama no redirige directamente a /blog/");
}
if (!/location = \/blog-agama\/\s+\{ return 301 \/blog\/; \}/.test(nginx)) {
  fail("/blog-agama/ no redirige directamente a /blog/");
}
if (/return 30[1278]\s+http:\/\//.test(nginx)) fail("Nginx contiene un redirect temporal o a HTTP");
console.log(`Blog: ${blog.size} entradas modernas cubren las ${legacyBlog.size} del índice legacy`);

const productRedirects = [...nginx.matchAll(
  /location = (\/productos\/[^\s{]+)\s+\{\s*return 301 (\/productos\/(?:pigmentos|masterbatch|aditivos)\/[^\s;]+\/);\s*\}/g,
)].map((match) => ({ source: match[1], target: match[2] }));
const redirectSources = new Set(productRedirects.map(({ source }) => source));
if (productRedirects.length !== totalProducts * 2) {
  fail(`Se esperaban ${totalProducts * 2} redirects históricos de producto y se encontraron ${productRedirects.length}`);
}
for (const { source, target } of productRedirects) {
  if (redirectSources.has(target)) fail(`${source} inicia una cadena de redirects hacia ${target}`);
  if (!fs.existsSync(path.join(auditRoot, target, "index.html"))) {
    fail(`${source} redirige a un producto inexistente: ${target}`);
  }
}
console.log(`Redirects: ${productRedirects.length} variantes históricas apuntan en un salto a fichas existentes`);

if (failures.length) {
  console.error("\nAuditoría SEO fallida:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Auditoría SEO crítica: OK");
}
