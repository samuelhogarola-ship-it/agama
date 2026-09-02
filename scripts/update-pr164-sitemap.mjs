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

function entry(url, priority) {
  return `  <url><loc>${url}</loc><lastmod>${LASTMOD}</lastmod><changefreq>monthly</changefreq><priority>${priority}</priority></url>`;
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
    additions.push(entry(url, "0.6"));
    existing.add(url);
  }
}
for (const item of inventory) {
  if (!existing.has(item.url)) {
    additions.push(entry(item.url, item.type === "category-landing" ? "0.8" : "0.7"));
    existing.add(item.url);
  }
}

const block = `\n  ${START}\n  <!-- Reviewed Spanish product canonicals and PR #164 editorial URLs. -->\n${additions.join("\n")}\n  ${END}\n`;
sitemap = sitemap.replace(/\s*<\/urlset>\s*$/, `${block}</urlset>\n`);
await writeFile(path.join(ROOT, "sitemap.xml"), sitemap, "utf8");
console.log(`Sitemap includes ${productUrls.length} Spanish product pages and ${inventory.length} reviewed PR #164 URLs.`);
