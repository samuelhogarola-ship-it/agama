import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://www.agama.com.mx";
const inventory = JSON.parse(await readFile(path.join(ROOT, "data", "pr164-url-inventory.json"), "utf8"));
const failures = [];

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}

function count(html, pattern) {
  return [...html.matchAll(pattern)].length;
}

function pathForUrl(url) {
  const pathname = new URL(url, SITE_URL).pathname;
  if (pathname.endsWith("/")) return path.join(ROOT, pathname.slice(1), "index.html");
  return path.join(ROOT, pathname.slice(1));
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

for (const item of inventory) {
  const file = pathForUrl(item.url);
  const relative = path.relative(ROOT, file);
  if (!(await exists(file))) {
    fail(relative, "missing route file");
    continue;
  }
  const html = await readFile(file, "utf8");
  const h1Count = count(html, /<h1\b/gi);
  if (h1Count !== 1) fail(relative, `expected one H1, found ${h1Count}`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"\/>/)?.[1];
  if (canonical !== item.url) fail(relative, `canonical mismatch: ${canonical || "missing"}`);
  const description = html.match(/<meta name="description" content="([^"]+)"\/>/)?.[1];
  if (!description) fail(relative, "missing meta description");
  if (description && description.length > 180) fail(relative, `meta description is ${description.length} characters`);
  if (description && /[…]|\b(?:and|or|the|de|la|y)$/i.test(description)) fail(relative, "meta description appears truncated");
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  if (!title) fail(relative, "missing title");
  if (title && title.length > 72) fail(relative, `title is ${title.length} characters`);
  if (!html.includes('property="og:image"')) fail(relative, "missing social image");
  if (html.includes("/assets/img/meta-social-home.png")) fail(relative, "uses generic social image");
  if (item.type !== "category-landing") {
    if (!html.includes("assets/css/editorial.css")) fail(relative, "missing shared editorial stylesheet");
    if (!html.includes("assets/js/home.js")) fail(relative, "missing navigation behavior");
    if (html.includes("<style")) fail(relative, "contains embedded stylesheet");
    if (html.includes("site-footer-placeholder")) fail(relative, "contains provisional footer class");
  }
  for (const script of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(script[1]);
    } catch (error) {
      fail(relative, `invalid JSON-LD: ${error.message}`);
    }
  }
  if (item.type === "service" && (!html.includes('"@type":"Service"') || html.includes('"@type":"Event"'))) {
    fail(relative, "service schema is missing or uses Event");
  }
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (!value.startsWith("/") || value.startsWith("//")) continue;
    const local = pathForUrl(value.split("#")[0].split("?")[0]);
    if (!(await exists(local))) fail(relative, `broken local reference ${value}`);
  }
}

for (const item of inventory.filter((entry) => entry.type.startsWith("product-") && entry.locale === "es")) {
  const file = pathForUrl(item.url);
  const html = await readFile(file, "utf8");
  const en = html.match(/<link rel="alternate" hreflang="en" href="([^"]+)"\/>/)?.[1];
  if (!en) {
    fail(path.relative(ROOT, file), "missing English alternate");
    continue;
  }
  const enFile = pathForUrl(en);
  const enHtml = await readFile(enFile, "utf8");
  const back = enHtml.match(/<link rel="alternate" hreflang="es-MX" href="([^"]+)"\/>/)?.[1];
  if (back !== item.url) fail(path.relative(ROOT, enFile), "hreflang pair is not reciprocal");
  const esIntent = item.type;
  const enItem = inventory.find((entry) => entry.url === en);
  if (!enItem || enItem.type !== esIntent) fail(path.relative(ROOT, enFile), "hreflang pair has a different editorial intent");
}

const generatedFiles = inventory.filter((item) => item.type !== "category-landing").map((item) => pathForUrl(item.url));
for (const file of generatedFiles) {
  const html = await readFile(file, "utf8");
  const relative = path.relative(ROOT, file);
  if (/faqs\/index\.en\.html/i.test(html)) fail(relative, "links to nonexistent English FAQ route");
  if (/USMCA-eligible|same-day response|5(?:–|-| to )10 day|60(?:–|-)80%|Delta E < ?1/i.test(html)) fail(relative, "contains an unsupported commercial or performance claim");
  if (/AD-318[\s\S]{0,140}(?:works|funciona|compatible)[\s\S]{0,80}(?:hot runner|colada caliente|PET)/i.test(html)) fail(relative, "contradicts AD-318 restrictions");
  if (/MB-105[\s\S]{0,180}(?:FDA approved|FDA-approved for|food contact)/i.test(html)) fail(relative, "contradicts MB-105 restrictions");
}

const sitemap = await readFile(path.join(ROOT, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail("sitemap.xml", "contains duplicate URLs");
for (const item of inventory) {
  if (!sitemapUrls.includes(item.url)) fail("sitemap.xml", `missing reviewed URL ${item.url}`);
}
for (const url of sitemapUrls.filter((value) => /\/productos\/.+\/index\.en\.html$/.test(value))) {
  fail("sitemap.xml", `advertises unreviewed product localization ${url}`);
}

if (inventory.length !== 83) fail("data/pr164-url-inventory.json", `expected 83 URLs, found ${inventory.length}`);

if (failures.length) {
  console.error(`PR #164 validation failed with ${failures.length} issue(s):`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`PR #164 validation passed: ${inventory.length} scoped URLs, reciprocal locale pairs, local references, metadata, schema, and sitemap.`);
