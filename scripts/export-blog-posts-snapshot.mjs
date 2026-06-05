import { readFile, writeFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const manifestPath = new URL("../wordpress/import/agama-blog-posts.json", import.meta.url);
const outputPath = new URL("../wordpress/import/agama-blog-posts.snapshot.json", import.meta.url);
const imageDirPath = new URL("../wordpress/import/featured-images/", import.meta.url);

function extractRichText(html, sourceUrl) {
  const marker = '<div class="post-body-card"><div class="text-rich-text w-richtext">';
  const start = html.indexOf(marker);
  if (start === -1) {
    throw new Error(`No rich text marker found in ${sourceUrl}`);
  }

  const afterStart = html.slice(start + marker.length);
  const endMarker = "</div></div></div></div></div></div><div><div class=\"page-padding\">";
  const end = afterStart.indexOf(endMarker);
  if (end === -1) {
    throw new Error(`No rich text end marker found in ${sourceUrl}`);
  }

  return afterStart.slice(0, end).trim();
}

function stripEmptyParagraphs(html) {
  return html
    .replace(/<p>(?:\s|&nbsp;|&#8205;|&#x200d;|‍|<br\s*\/?>)*<\/p>/giu, "")
    .replace(/<p><br\s*\/?><\/p>/giu, "")
    .trim();
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "AGAMA Blog Snapshot Exporter/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }

  return response.text();
}

async function downloadImage(url, slug) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "AGAMA Blog Snapshot Exporter/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while downloading ${url}`);
  }

  const pathname = new URL(url).pathname;
  const ext = path.extname(pathname) || ".jpg";
  const fileName = `${slug}${ext}`;
  const imagePath = new URL(fileName, imageDirPath);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(imagePath, buffer);

  return `featured-images/${fileName}`;
}

async function main() {
  const rawManifest = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(rawManifest);
  await mkdir(imageDirPath, { recursive: true });

  const snapshot = [];

  for (const entry of manifest) {
    console.log(`Fetching ${entry.slug}...`);
    const html = await fetchHtml(entry.source_url);
    const contentHtml = stripEmptyParagraphs(extractRichText(html, entry.source_url));
    const featuredImageLocalPath = await downloadImage(entry.featured_image_url, entry.slug);

    snapshot.push({
      ...entry,
      content_html: contentHtml,
      featured_image_local_path: featuredImageLocalPath,
    });
  }

  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`Saved snapshot to ${outputPath.pathname}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
