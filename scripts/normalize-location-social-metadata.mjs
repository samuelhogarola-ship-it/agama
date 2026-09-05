import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOCIAL_PATTERN = /\n\s*<meta property="og:type" content="website"\/>[\s\S]*?<meta name="twitter:image" content="https:\/\/www\.agama\.com\.mx\/assets\/img\/meta-social-home\.png"\/>\n?/;

function getMeta(html, pattern) {
  return html.match(pattern)?.[1]?.trim() || "";
}

function socialBlock({ title, description, canonical, locale }) {
  const image = "https://www.agama.com.mx/assets/img/puntos-de-venta-hero-v3.webp";
  return `
  <meta property="og:type" content="website"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${description}"/>
  <meta property="og:url" content="${canonical}"/>
  <meta property="og:image" content="${image}"/>
  <meta property="og:image:alt" content="${locale === "en" ? "AGAMA points of sale in Mexico" : "Puntos de venta AGAMA en México"}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${title}"/>
  <meta name="twitter:description" content="${description}"/>
  <meta name="twitter:image" content="${image}"/>
`;
}

const filialDir = path.join(ROOT, "filiales");
for (const fileName of ["index.html", "index.en.html"]) {
  const file = path.join(filialDir, fileName);
  const html = await readFile(file, "utf8");
  await writeFile(file, html.replace(SOCIAL_PATTERN, "\n").replace(/(hreflang="x-default"[^>]+>\n)\n{2,}/, "$1\n"), "utf8");
}

for (const entry of await readdir(filialDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === "online") continue;
  for (const fileName of ["index.html", "index.en.html"]) {
    const file = path.join(filialDir, entry.name, fileName);
    try {
      const html = await readFile(file, "utf8");
      await writeFile(file, html.replace(SOCIAL_PATTERN, "\n").replace(/(hreflang="x-default"[^>]+>\n)\n{2,}/, "$1\n"), "utf8");
    } catch {
      // Some legacy aliases may not have both locale files.
    }
  }
}

for (const fileName of ["index.html", "index.en.html"]) {
  const file = path.join(ROOT, "puntosdeventa", fileName);
  let html = await readFile(file, "utf8");
  if (!html.includes('property="og:type"')) {
    const title = getMeta(html, /<title>([^<]+)<\/title>/);
    const description = getMeta(html, /<meta name="description" content="([^"]+)"\/>/) || getMeta(html, /<meta content="([^"]+)" name="description"\/>/);
    const canonical = getMeta(html, /<link rel="canonical" href="([^"]+)"\/>/);
    if (title && description && canonical) {
      html = html.replace(/(<link rel="alternate" hreflang="x-default"[^>]+>)/, `$1${socialBlock({ title, description, canonical, locale: fileName.includes(".en.") ? "en" : "es" })}`);
      await writeFile(file, html, "utf8");
    }
  }
}

for (const entry of await readdir(path.join(ROOT, "puntosdeventa"), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  for (const fileName of ["index.html", "index.en.html"]) {
    const file = path.join(ROOT, "puntosdeventa", entry.name, fileName);
    try {
      let html = await readFile(file, "utf8");
      if (html.includes('property="og:type"')) continue;
      const title = getMeta(html, /<title>([^<]+)<\/title>/);
      const description = getMeta(html, /<meta (?:name="description" content="([^"]+)"|content="([^"]+)" name="description")\/>/);
      const canonical = getMeta(html, /<link rel="canonical" href="([^"]+)"\/>/);
      const resolvedDescription = description || getMeta(html, /<meta content="([^"]+)" name="description"\/>/);
      if (!title || !resolvedDescription || !canonical) continue;
      const block = socialBlock({ title, description: resolvedDescription, canonical, locale: fileName.includes(".en.") ? "en" : "es" });
      html = html.replace(/(<link rel="alternate" hreflang="x-default"[^>]+>)/, `$1${block}`);
      await writeFile(file, html, "utf8");
    } catch {
      // Ignore absent locale files.
    }
  }
}

console.log("Moved social metadata from redirect aliases to canonical point-of-sale pages.");
