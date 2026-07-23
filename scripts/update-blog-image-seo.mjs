import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(await fs.readFile(path.join(root, 'docs/blog-image-prompts.json'), 'utf8'));
const posts = new Map(manifest.posts.map((post) => [post.slug, post]));

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapeHtml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const escapeXml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function replaceMeta(html, selector, value) {
  const pattern = new RegExp(`(<meta\\s+${selector}\\s+content=")[^"]*("/>)`, 'i');
  return pattern.test(html) ? html.replace(pattern, `$1${escapeHtml(value)}$2`) : html;
}

function updateLinkedImages(html, prefix, isEnglish = false) {
  for (const post of posts.values()) {
    const hrefPattern = new RegExp(
      `(<a\\b[^>]*href="/entrada-de-blog/${escapeRegExp(post.slug)}/(?:index\\.en\\.html)?[^"]*"[^>]*>)([\\s\\S]*?)(</a>)`,
      'g',
    );
    html = html.replace(hrefPattern, (full, open, body, close) => {
      if (!/<img\b/i.test(body)) return full;
      const image = `${prefix}blog-assets/featured-images/generated/${post.slug}-agama.webp`;
      const linkedAlt = isEnglish && post.altEn ? post.altEn : post.alt;
      const updatedBody = body.replace(
        /<img\b([^>]*?)src="[^"]*"([^>]*?)alt="[^"]*"([^>]*)>/i,
        `<img$1src="${image}"$2alt="${escapeHtml(linkedAlt)}"$3>`,
      );
      return `${open}${updatedBody}${close}`;
    });
  }
  return html;
}

for (const post of posts.values()) {
  const directory = path.join(root, 'entrada-de-blog', post.slug);
  const filenames = (await fs.readdir(directory)).filter((name) => /^index(?:\.en)?\.html$/.test(name));
  for (const filename of filenames) {
    const file = path.join(directory, filename);
    let html = await fs.readFile(file, 'utf8');
    const publicImage = `https://www.agama.com.mx/blog-assets/featured-images/generated/${post.slug}-agama.webp`;
    const relativeImage = `../../blog-assets/featured-images/generated/${post.slug}-agama.webp`;
    const isEnglish = filename.includes('.en.');
    const existingHeroAlt =
      html.match(/<img class="post-cover[^>]*alt="([^"]*)"/i)?.[1] ||
      html.match(/<img[^>]*class="[^"]*\bpost-cover\b[^"]*"[^>]*alt="([^"]*)"/i)?.[1];
    const pageAlt = isEnglish && existingHeroAlt ? existingHeroAlt : post.alt;
    const pageTitle = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]+>/g, '').trim() || post.title;
    const pageDescription =
      html.match(/<meta name="description" content="([^"]*)"/i)?.[1] || post.description;

    html = replaceMeta(html, 'property="og:image"', publicImage);
    html = replaceMeta(html, 'name="twitter:image"', publicImage);
    html = html.replace(/("image"\s*:\s*")[^"]*(")/g, `$1${publicImage}$2`);
    html = html.replace(
      /<meta name="robots" content="[^"]*"\/>/i,
      '<meta name="robots" content="index,follow,max-image-preview:large"/>',
    );
    if (!/<meta name="googlebot"/i.test(html)) {
      html = html.replace(
        /(<meta name="robots"[^>]*\/>)/i,
        '$1\n  <meta name="googlebot" content="index,follow,max-image-preview:large"/>',
      );
    }

    if (/<meta property="og:image:alt"/i.test(html)) {
      html = replaceMeta(html, 'property="og:image:alt"', pageAlt);
    } else {
      html = html.replace(
        /(<meta property="og:image"[^>]*\/>)/i,
        `$1\n  <meta property="og:image:alt" content="${escapeHtml(pageAlt)}"/>`,
      );
    }
    for (const [property, value] of [
      ['og:image:type', 'image/webp'],
      ['og:image:width', '1600'],
      ['og:image:height', '900'],
    ]) {
      if (!new RegExp(`<meta property="${property}"`, 'i').test(html)) {
        html = html.replace(
          /(<meta property="og:image:alt"[^>]*\/>)/i,
          `$1\n  <meta property="${property}" content="${value}"/>`,
        );
      }
    }
    if (/<meta name="twitter:image:alt"/i.test(html)) {
      html = replaceMeta(html, 'name="twitter:image:alt"', pageAlt);
    } else {
      html = html.replace(
        /(<meta name="twitter:image"[^>]*\/>)/i,
        `$1\n  <meta name="twitter:image:alt" content="${escapeHtml(pageAlt)}"/>`,
      );
    }
    html = html.replace(
      /<img\b([^>]*class="[^"]*\bpost-cover\b[^"]*"[^>]*)>/i,
      (tag, attrs) => {
        let next = attrs.replace(/\s*\/\s+(?=\w+=")/g, ' ').replace(/\s*\/\s*$/, '');
        next = next.replace(/\s+src="[^"]*"/i, ` src="${relativeImage}"`);
        next = next.replace(/\s+alt="[^"]*"/i, ` alt="${escapeHtml(pageAlt)}"`);
        if (!/\swidth="/i.test(next)) next += ' width="1600"';
        if (!/\sheight="/i.test(next)) next += ' height="900"';
        return `<img${next}/>`;
      },
    );
    html = html.replace(
      /\n?\s*<script type="application\/ld\+json" data-agama-image-seo>[\s\S]*?<\/script>/i,
      '',
    );
    const imageObject = {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      '@id': `${publicImage}#image`,
      contentUrl: publicImage,
      url: publicImage,
      name: pageTitle,
      caption: pageAlt,
      description: pageDescription,
      width: 1600,
      height: 900,
      encodingFormat: 'image/webp',
      representativeOfPage: true,
      creator: { '@type': 'Organization', name: 'AGAMA Pigmentos & Masterbatch' },
      copyrightHolder: { '@type': 'Organization', name: 'AGAMA Pigmentos & Masterbatch' },
      creditText: 'AGAMA Pigmentos & Masterbatch',
    };
    html = html.replace(
      '</head>',
      `  <script type="application/ld+json" data-agama-image-seo>${JSON.stringify(imageObject)}</script>\n</head>`,
    );
    html = updateLinkedImages(html, '../../', isEnglish);
    await fs.writeFile(file, html);
  }
}

for (const [relativeFile, prefix, isEnglish] of [
  ['blog/index.html', '../', false],
  ['blog/index.en.html', '../', true],
  ['blog-agama/index.html', '../', false],
]) {
  const file = path.join(root, relativeFile);
  let html = await fs.readFile(file, 'utf8');
  html = updateLinkedImages(html, prefix, isEnglish);
  await fs.writeFile(file, html);
}

const sitemapFile = path.join(root, 'sitemap.xml');
let sitemap = await fs.readFile(sitemapFile, 'utf8');
for (const post of posts.values()) {
  const canonicalBase = `https://www.agama.com.mx/entrada-de-blog/${post.slug}/`;
  const publicImage = `https://www.agama.com.mx/blog-assets/featured-images/generated/${post.slug}-agama.webp`;
  sitemap = sitemap.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
    if (!block.includes(`<loc>${canonicalBase}`)) return block;
    const cleaned = block.replace(/\s*<image:image>[\s\S]*?<\/image:image>/g, '').replace(
      /<lastmod>[^<]*<\/lastmod>/,
      '<lastmod>2026-07-23</lastmod>',
    );
    const imageEntry = `\n    <image:image><image:loc>${publicImage}</image:loc><image:caption>${escapeXml(post.description)}</image:caption><image:title>${escapeXml(post.alt)}</image:title></image:image>`;
    let updated = cleaned.replace(/(<loc>[^<]+<\/loc>)/, `$1${imageEntry}`);
    if (!/<lastmod>/.test(updated)) {
      updated = updated.replace('</image:image>', '</image:image>\n    <lastmod>2026-07-23</lastmod>');
    }
    return updated;
  });
  const variants = [canonicalBase];
  try {
    await fs.access(path.join(root, 'entrada-de-blog', post.slug, 'index.en.html'));
    variants.push(`${canonicalBase}index.en.html`);
  } catch {
    // This post has no English version.
  }
  for (const url of variants) {
    if (sitemap.includes(`<loc>${url}</loc>`)) continue;
    const entry = `\n  <url>\n    <loc>${url}</loc>\n    <image:image><image:loc>${publicImage}</image:loc><image:caption>${escapeXml(post.description)}</image:caption><image:title>${escapeXml(post.alt)}</image:title></image:image>\n    <lastmod>2026-07-23</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    sitemap = sitemap.replace('</urlset>', `${entry}</urlset>`);
  }
}
await fs.writeFile(sitemapFile, sitemap);

console.log(`Updated image SEO for ${posts.size} posts, public blog listings, and sitemap.xml.`);
