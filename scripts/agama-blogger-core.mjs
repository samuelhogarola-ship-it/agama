import { copyFile, mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_RE = /\.(avif|gif|jpe?g|png|webp)$/i;
const START = "<!-- AGAMA_BLOGGER_POSTS_START -->";
const END = "<!-- AGAMA_BLOGGER_POSTS_END -->";

export function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function assertSafeSlug(slug) {
  if (!SLUG_RE.test(String(slug || ""))) {
    throw statusError(400, "Slug inválido: usa minúsculas, números y guiones.");
  }
}

export function sanitizeImageName(value) {
  const original = String(value || "");
  if (path.basename(original) !== original || original.includes("..")) {
    throw statusError(400, "Imagen inválida: usa un nombre simple y formato jpg, png, webp, avif o gif.");
  }
  const base = path.basename(original)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!base || !IMAGE_RE.test(base)) {
    throw statusError(400, "Imagen inválida: usa un nombre simple y formato jpg, png, webp, avif o gif.");
  }
  return base;
}

export function createBloggerStore({ contentDir, publicDir, snapshotPath }) {
  const postsDir = path.join(contentDir, "posts");
  const imagesDir = path.join(contentDir, "images");

  async function legacyPosts() {
    const parsed = JSON.parse(await readFile(snapshotPath, "utf8"));
    if (!Array.isArray(parsed)) throw new Error("El snapshot editorial de AGAMA no es válido.");
    return parsed.map((post) => ({
      slug: post.slug,
      title: post.title,
      description: post.description || plainText(post.content_html).slice(0, 160),
      date: normalizeDate(post.date),
      category: post.category || "Blog",
      author: post.author || "AGAMA",
      image: post.featured_image_url || "",
      status: "published",
      format: "html",
      body: post.content_html || "",
      source: "legacy",
      url: `/entrada-de-blog/${post.slug}/`,
    }));
  }

  async function managedPosts() {
    await mkdir(postsDir, { recursive: true });
    const files = (await readdir(postsDir)).filter((file) => file.endsWith(".json"));
    return Promise.all(files.map(async (file) => JSON.parse(await readFile(path.join(postsDir, file), "utf8"))));
  }

  async function listPosts() {
    const legacy = await legacyPosts();
    const managed = await managedPosts();
    const bySlug = new Map(legacy.map((post) => [post.slug, post]));
    for (const post of managed) bySlug.set(post.slug, post);
    return [...bySlug.values()]
      .map(summary)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.title.localeCompare(b.title));
  }

  async function readPost(slug) {
    assertSafeSlug(slug);
    try {
      return present(JSON.parse(await readFile(path.join(postsDir, `${slug}.json`), "utf8")));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const post = (await legacyPosts()).find((item) => item.slug === slug);
    if (!post) throw statusError(404, "Post no encontrado.");
    return present(post);
  }

  async function savePost(currentSlug, input) {
    const title = String(input.title || "").trim();
    const description = String(input.description || "").trim();
    const body = String(input.body || "").trim();
    const slug = slugify(input.slug || title);
    if (!title) throw statusError(400, "El título es obligatorio.");
    if (!description) throw statusError(400, "La descripción SEO es obligatoria.");
    if (!body) throw statusError(400, "El contenido es obligatorio.");
    assertSafeSlug(slug);
    if (currentSlug) assertSafeSlug(currentSlug);

    const existing = await listPosts();
    if (existing.some((post) => post.slug === slug && post.slug !== currentSlug)) {
      throw statusError(409, "Ya existe otro post con ese slug.");
    }

    const post = {
      slug,
      title,
      description,
      date: normalizeDate(input.date) || new Date().toISOString().slice(0, 10),
      category: String(input.category || "Blog").trim(),
      author: String(input.author || "AGAMA").trim(),
      image: String(input.image || "").trim(),
      status: input.status === "published" ? "published" : "draft",
      format: input.format === "markdown" ? "markdown" : "html",
      body,
      source: "managed",
      url: `/entrada-de-blog/${slug}/`,
      updatedAt: new Date().toISOString(),
    };

    await mkdir(postsDir, { recursive: true });
    const target = path.join(postsDir, `${slug}.json`);
    const temp = `${target}.${process.pid}.tmp`;
    await writeFile(temp, `${JSON.stringify(post, null, 2)}\n`, "utf8");
    await rename(temp, target);
    if (currentSlug && currentSlug !== slug) {
      const oldPath = path.join(postsDir, `${currentSlug}.json`);
      try { await rename(oldPath, `${oldPath}.renamed`); } catch (error) { if (error.code !== "ENOENT") throw error; }
    }
    return present(post);
  }

  async function listImages(slug) {
    assertSafeSlug(slug);
    const dir = path.join(imagesDir, slug);
    try {
      const files = await readdir(dir);
      return files.filter((file) => IMAGE_RE.test(file)).map((file) => ({
        file,
        url: `/assets/blogger/${slug}/${file}`,
      }));
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }

  async function savePostImage(slug, fileName, data) {
    assertSafeSlug(slug);
    const safeName = sanitizeImageName(fileName);
    const encoded = String(data || "").replace(/^data:[^;]+;base64,/, "");
    if (!encoded) throw statusError(400, "La imagen no contiene datos.");
    const sourceDir = path.join(imagesDir, slug);
    const publishedDir = path.join(publicDir, "assets", "blogger", slug);
    await mkdir(sourceDir, { recursive: true });
    await mkdir(publishedDir, { recursive: true });
    await writeFile(path.join(sourceDir, safeName), Buffer.from(encoded, "base64"));
    await copyFile(path.join(sourceDir, safeName), path.join(publishedDir, safeName));
    return { file: safeName, url: `/assets/blogger/${slug}/${safeName}` };
  }

  async function publishPost(slug) {
    const current = await readPost(slug);
    const saved = await savePost(slug, { ...current.meta, body: current.body, status: "published", format: current.format });
    const post = { ...saved.meta, body: saved.body, source: "managed" };
    const outputDir = path.join(publicDir, "entrada-de-blog", post.slug);
    await mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, "index.html");
    await writeFile(outputPath, renderPost(post), "utf8");
    const indexPath = await rebuildIndex();
    return { ...saved, outputPath, indexPath };
  }

  async function publishAll() {
    const managed = await managedPosts();
    for (const post of managed.filter((item) => item.status === "published")) {
      const outputDir = path.join(publicDir, "entrada-de-blog", post.slug);
      await mkdir(outputDir, { recursive: true });
      await writeFile(path.join(outputDir, "index.html"), renderPost(post), "utf8");
      for (const image of await listImages(post.slug)) {
        const targetDir = path.join(publicDir, "assets", "blogger", post.slug);
        await mkdir(targetDir, { recursive: true });
        await copyFile(path.join(imagesDir, post.slug, image.file), path.join(targetDir, image.file));
      }
    }
    return rebuildIndex();
  }

  async function rebuildIndex() {
    const indexPath = path.join(publicDir, "blog", "index.html");
    let html = await readFile(indexPath, "utf8");
    const managed = (await managedPosts()).filter((post) => post.status === "published");
    const cards = managed.sort((a, b) => String(b.date).localeCompare(String(a.date))).map(renderCard).join("\n");
    const block = `${START}\n${cards}\n${END}`;
    if (html.includes(START) && html.includes(END)) {
      html = html.replace(new RegExp(`${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}`), block);
    } else if (html.includes("<!-- AGAMA_BLOGGER_POSTS -->")) {
      html = html.replace("<!-- AGAMA_BLOGGER_POSTS -->", block);
    } else {
      html = html.replace("</body>", `${block}\n</body>`);
    }
    await writeFile(indexPath, html, "utf8");
    return indexPath;
  }

  return { listPosts, readPost, savePost, listImages, savePostImage, publishPost, publishAll };
}

function summary(post) {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.date,
    status: post.status,
    source: post.source,
    url: post.url,
    words: plainText(post.body).split(/\s+/).filter(Boolean).length,
  };
}

function present(post) {
  return {
    slug: post.slug,
    meta: {
      title: post.title,
      slug: post.slug,
      description: post.description,
      date: post.date,
      category: post.category,
      author: post.author,
      image: post.image,
      status: post.status,
    },
    body: post.body,
    format: post.format || "html",
    url: post.url,
  };
}

function renderPost(post) {
  const image = post.image ? `<img class="hero" src="${escapeHtml(post.image)}" alt="">` : "";
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(post.title)} | AGAMA</title><meta name="description" content="${escapeHtml(post.description)}">
<link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/editorial.css">
<script src="/assets/js/analytics-config.js"></script><script defer src="/assets/js/analytics.js"></script>
<style>body{margin:0;background:#f7f5ef;color:#17211c;font-family:Arial,sans-serif}.post{max-width:850px;margin:auto;padding:48px 24px}.back{color:#176f4d}.hero{width:100%;max-height:480px;object-fit:cover;border-radius:18px}h1{font-size:clamp(2.2rem,6vw,4.6rem);line-height:1}.meta{color:#617067}.content{font-size:1.08rem;line-height:1.75}.content img{max-width:100%;height:auto}</style></head>
<body><main class="post"><a class="back" href="/blog/">← Volver al blog</a><p class="meta">${escapeHtml(post.category || "Blog")} · ${escapeHtml(post.date || "")}</p><h1>${escapeHtml(post.title)}</h1>${image}<article class="content">${post.body}</article></main></body></html>`;
}

function renderCard(post) {
  const image = post.image ? `<div class="post-card-image"><img src="${escapeHtml(post.image)}" alt="" loading="lazy"></div>` : "";
  return `<a href="/entrada-de-blog/${escapeHtml(post.slug)}/" class="post-card" data-blogger-post>${image}<div class="post-card-body"><div class="post-card-meta"><span>${escapeHtml(post.date || "")}</span><span class="pill">${escapeHtml(post.category || "Blog")}</span></div><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.description)}</p></div></a>`;
}

function normalizeDate(value) {
  const raw = String(value || "").trim();
  const euro = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (euro) return `${euro[3]}-${euro[2].padStart(2, "0")}-${euro[1].padStart(2, "0")}`;
  return raw;
}

function plainText(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function statusError(status, message) {
  return Object.assign(new Error(message), { status });
}

