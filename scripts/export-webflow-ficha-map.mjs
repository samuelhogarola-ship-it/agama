import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const manifestPath = path.join(ROOT, 'data', 'product-images-manifest.json');
const outPath = path.join(ROOT, 'data', 'webflow-ficha-map.json');

function readManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function findFichaUrl(html) {
  const matches = html.match(/https:\/\/cdn\.prod\.website-files\.com\/[^"'<>]+FICHA[^"'<>]+/gi);
  if (!matches?.length) return null;
  return matches[0].replace(/&amp;/g, '&');
}

async function fetchHtml(slug) {
  const url = `https://agama-web.webflow.io/productos/${slug}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${slug}: ${response.status}`);
  }

  return response.text();
}

async function main() {
  const manifest = readManifest();
  const result = {};

  for (const entry of manifest) {
    if (!entry?.slug) continue;

    try {
      const html = await fetchHtml(entry.slug);
      const fichaUrl = findFichaUrl(html);

      if (fichaUrl) {
        result[entry.slug] = fichaUrl;
      }
    } catch (error) {
      console.warn(`Skipping ${entry.slug}: ${error.message}`);
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
  console.log(`Wrote ${Object.keys(result).length} ficha URLs to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
