import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://www.agama.com.mx";
const START = "<!-- pr164-reviewed:start -->";
const END = "<!-- pr164-reviewed:end -->";
const LASTMOD = "2026-09-02";

function stripGeneratedBlocks(xml) {
  return xml
    .replace(/\n\s*<!-- EN SEO landing pages \(auto-injected 2026-08-26\) -->[\s\S]*?(?=<\/urlset>)/, "\n")
    .replace(new RegExp(`\\n?\\s*${START}[\\s\\S]*?${END}\\n?`, "g"), "\n");
}

function escapeXml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function urlToFile(url) {
  const pathname = new URL(url).pathname;
  if (pathname.endsWith("/")) return path.join(ROOT, pathname, "index.html");
  return path.join(ROOT, pathname);
}

function normalizeImage(src, pageUrl) {
  if (!src || src.startsWith("data:")) return "";
  if (src.startsWith("http")) return src;
  let normalized = src;
  if (normalized.startsWith("../..")) normalized = normalized.slice(5);
  if (normalized.startsWith("..")) {
    const page = new URL(pageUrl);
    const resolved = new URL(normalized, `${page.origin}${page.pathname.replace(/[^/]+$/, "")}`);
    return resolved.href;
  }
  if (normalized.startsWith("/")) return `${SITE_URL}${normalized}`;
  return new URL(normalized, pageUrl).href;
}

async function imagesForUrl(url) {
  try {
    const html = await readFile(urlToFile(url), "utf8");
    const seen = new Set();
    const images = [];
    const contentHtml = html.match(/<main[\s\S]*<\/main>/i)?.[0] || html;
    for (const match of contentHtml.matchAll(/<img\b[^>]*>/gi)) {
      const tag = match[0];
      const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] || "";
      const alt = tag.match(/\balt=["']([^"']*)["']/i)?.[1] || "";
      const loc = normalizeImage(src, url);
      if (!loc || seen.has(loc)) continue;
      if (/\/assets\/img\/(agama\.svg|logo-circulo|whats-app|whatsapp|favicon)/i.test(loc)) continue;
      seen.add(loc);
      images.push({ loc, alt: alt || "AGAMA plastic materials image" });
      if (images.length >= 6) break;
    }
    return images;
  } catch {
    return [];
  }
}

async function entry(url, priority) {
  const imageTags = (await imagesForUrl(url)).map((image) =>
    `<image:image><image:loc>${escapeXml(image.loc)}</image:loc><image:caption>${escapeXml(image.alt)}</image:caption><image:title>${escapeXml(image.alt)}</image:title></image:image>`
  );
  return `  <url><loc>${escapeXml(url)}</loc>${imageTags.join("")}<lastmod>${LASTMOD}</lastmod><changefreq>monthly</changefreq><priority>${priority}</priority></url>`;
}

const productUrls = [];
for (const category of ["aditivos", "masterbatch", "pigmentos"]) {
  const categoryDir = path.join(ROOT, "productos", category);
  const children = await readdir(categoryDir, { withFileTypes: true });
  for (const child of children) {
    if (!child.isDirectory()) continue;
    const indexPath = path.join(categoryDir, child.name, "index.html");
    try {
      await readFile(indexPath, "utf8");
      productUrls.push(`${SITE_URL}/productos/${category}/${child.name}/`);
    } catch {
      // A directory without a Spanish canonical page is not indexable here.
    }
  }
}

const inventory = JSON.parse(await readFile(path.join(ROOT, "data", "pr164-url-inventory.json"), "utf8"));
let sitemap = stripGeneratedBlocks(await readFile(path.join(ROOT, "sitemap.xml"), "utf8"));
const existing = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));

const additions = [];
for (const url of productUrls.sort()) {
  if (!existing.has(url)) {
    additions.push(await entry(url, "0.6"));
    existing.add(url);
  }
}
for (const item of inventory) {
  if (!existing.has(item.url)) {
    additions.push(await entry(item.url, item.type === "category-landing" ? "0.8" : "0.7"));
    existing.add(item.url);
  }
}

const block = `\n  ${START}\n  <!-- Reviewed Spanish product canonicals and PR #164 editorial URLs. -->\n${additions.join("\n")}\n  ${END}\n`;
sitemap = sitemap.replace(/\s*<\/urlset>\s*$/, `${block}</urlset>\n`);
await writeFile(path.join(ROOT, "sitemap.xml"), sitemap, "utf8");
console.log(`Sitemap includes ${productUrls.length} Spanish product pages and ${inventory.length} reviewed PR #164 URLs.`);
