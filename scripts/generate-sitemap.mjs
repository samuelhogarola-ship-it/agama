import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://www.agama.com.mx";
const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  "agama-web.webflow",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
  "wordpress",
]);
const REDIRECTED_CANONICALS = new Set([`${SITE_URL}/blog-agama/`]);

function walkHtml(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;

    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkHtml(filePath, files);
    } else if (entry.name.endsWith(".html")) {
      files.push(filePath);
    }
  }

  return files;
}

function readMeta(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const metaName = tag.match(/\bname=["']([^"']+)["']/i)?.[1];
    if (metaName?.toLowerCase() !== name.toLowerCase()) continue;
    return tag.match(/\bcontent=["']([^"']+)["']/i)?.[1] ?? "";
  }
  return "";
}

function readCanonical(html) {
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const link of links) {
    const rel = link.match(/\brel=["']([^"']+)["']/i)?.[1] ?? "";
    if (!rel.split(/\s+/).some((value) => value.toLowerCase() === "canonical")) continue;
    return link.match(/\bhref=["']([^"']+)["']/i)?.[1] ?? null;
  }
  return null;
}

function routeSettings(url) {
  const pathname = new URL(url).pathname;

  if (pathname === "/") return { changefreq: "weekly", priority: "1.0", order: 0 };
  if (["/masterbatch/", "/pigmentos/", "/aditivos/"].includes(pathname)) {
    return { changefreq: "weekly", priority: "0.9", order: 1 };
  }
  if (pathname === "/productos/" || /^\/productos\/(pigmentos|masterbatch|aditivos)\/$/.test(pathname)) {
    return { changefreq: "weekly", priority: "0.9", order: 2 };
  }
  if (pathname.startsWith("/productos/")) {
    return { changefreq: "monthly", priority: "0.7", order: 3 };
  }
  if (pathname === "/blog/" || pathname === "/filiales/online/") {
    return { changefreq: "weekly", priority: "0.8", order: 4 };
  }
  if (pathname.startsWith("/entrada-de-blog/") || pathname.startsWith("/eventos/")) {
    return { changefreq: "monthly", priority: "0.7", order: 5 };
  }
  if (pathname.startsWith("/filiales/")) {
    return { changefreq: "monthly", priority: "0.7", order: 6 };
  }
  return { changefreq: "monthly", priority: "0.5", order: 7 };
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function generateSitemap(rootDirectory, outputPath) {
  const canonicalUrls = new Set();

  for (const filePath of walkHtml(rootDirectory)) {
    const html = fs.readFileSync(filePath, "utf8");
    if (/\bnoindex\b/i.test(readMeta(html, "robots"))) continue;

    const canonical = readCanonical(html);
    if (!canonical?.startsWith(`${SITE_URL}/`) && canonical !== `${SITE_URL}/`) continue;
    if (REDIRECTED_CANONICALS.has(canonical)) continue;
    canonicalUrls.add(canonical);
  }

  const urls = [...canonicalUrls]
    .map((url) => ({ url, ...routeSettings(url) }))
    .sort((left, right) => left.order - right.order || left.url.localeCompare(right.url));

  const entries = urls
    .map(
      ({ url, changefreq, priority }) =>
        `  <url><loc>${escapeXml(url)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
  fs.writeFileSync(outputPath, xml, "utf8");
  return urls.length;
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isCli) {
  const rootIndex = process.argv.indexOf("--root");
  const outputIndex = process.argv.indexOf("--output");
  const rootDirectory = path.resolve(rootIndex === -1 ? process.cwd() : process.argv[rootIndex + 1]);
  const outputPath = path.resolve(
    outputIndex === -1 ? path.join(rootDirectory, "sitemap.xml") : process.argv[outputIndex + 1],
  );
  const count = generateSitemap(rootDirectory, outputPath);
  console.log(`Generated ${count} sitemap URLs in ${outputPath}`);
}
