import { copyFile, mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
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
  if (!ID_RE.test(String(slug || ""))) throw statusError(400, "Slug inválido: usa minúsculas, números y guiones.");
}

function assertSafeId(id) {
  if (!ID_RE.test(String(id || ""))) throw statusError(400, "Identificador de post inválido.");
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
  const templatesDir = path.join(contentDir, "templates");

  async function historyPosts() {
    const parsed = JSON.parse(await readFile(snapshotPath, "utf8"));
    if (!Array.isArray(parsed)) throw new Error("El histórico editorial de AGAMA no es válido.");
    return parsed.map((post) => normalizeHistoryPost(post));
  }

  async function managedPosts() {
    await mkdir(postsDir, { recursive: true });
    const files = (await readdir(postsDir)).filter((file) => file.endsWith(".json"));
    return Promise.all(files.map(async (file) => JSON.parse(await readFile(path.join(postsDir, file), "utf8"))));
  }

  async function listPosts() {
    const history = await historyPosts();
    const managed = await managedPosts();
    const byId = new Map(history.map((post) => [post.id, post]));
    for (const post of managed) byId.set(post.id, post);
    return [...byId.values()]
      .filter((post) => !post.deleted)
      .map(summary)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.title.localeCompare(b.title));
  }

  async function rawPost(id) {
    assertSafeId(id);
    try {
      const managed = JSON.parse(await readFile(path.join(postsDir, `${id}.json`), "utf8"));
      if (managed.deleted) throw statusError(404, "Post no encontrado.");
      return managed;
    } catch (error) {
      if (error.status === 404) throw error;
      if (error.code !== "ENOENT") throw error;
    }
    const post = (await historyPosts()).find((item) => item.id === id);
    if (!post) throw statusError(404, "Post no encontrado.");
    return post;
  }

  async function readPost(id) {
    return present(await rawPost(id));
  }

  async function savePost(currentId, input) {
    const current = currentId ? await rawPost(currentId) : null;
    const title = String(input.title || "").trim();
    const description = String(input.description || "").trim();
    const body = String(input.body || "").trim();
    const slug = slugify(input.slug || title);
    if (!title) throw statusError(400, "El título es obligatorio.");
    if (!description) throw statusError(400, "La descripción SEO es obligatoria.");
    if (!body) throw statusError(400, "El contenido es obligatorio.");
    assertSafeSlug(slug);
    if (currentId) assertSafeId(currentId);

    const locale = current?.locale || (input.locale === "en" ? "en" : "es");
    if (current?.origin === "history" && (slug !== current.slug || locale !== current.locale)) {
      throw statusError(409, "La ruta de una entrada histórica no se puede cambiar desde Blogger.");
    }
    const id = current?.origin === "history" ? current.id : postId(slug, locale);
    const existing = await listPosts();
    if (existing.some((post) => post.id === id && post.id !== currentId)) {
      throw statusError(409, "Ya existe otro post con esa ruta e idioma.");
    }

    const post = {
      id,
      slug,
      locale,
      outputFile: current?.outputFile || outputFileFor(locale),
      title,
      description,
      date: normalizeDate(input.date) || new Date().toISOString().slice(0, 10),
      category: String(input.category || (locale === "en" ? "AGAMA Blog" : "Blog")).trim(),
      author: String(input.author || "AGAMA").trim(),
      image: String(input.image || "").trim(),
      status: input.status === "published" ? "published" : "draft",
      format: input.format === "markdown" ? "markdown" : "html",
      body,
      source: "managed",
      origin: current?.origin || "managed",
      bodyRegion: current?.bodyRegion || "generated",
      sourcePath: current?.sourcePath || "",
      featured: Boolean(current?.featured),
      url: publicUrl(slug, locale),
      updatedAt: new Date().toISOString(),
    };

    await writeManaged(post);
    if (currentId && currentId !== id) await removeFile(path.join(postsDir, `${currentId}.json`));
    return present(post);
  }

  async function writeManaged(post) {
    await mkdir(postsDir, { recursive: true });
    const target = path.join(postsDir, `${post.id}.json`);
    const temp = `${target}.${process.pid}.tmp`;
    await writeFile(temp, `${JSON.stringify(post, null, 2)}\n`, "utf8");
    await rename(temp, target);
  }

  async function listImages(slug) {
    assertSafeSlug(slug);
    const dir = path.join(imagesDir, slug);
    try {
      const files = await readdir(dir);
      return files.filter((file) => IMAGE_RE.test(file)).map((file) => ({ file, url: `/assets/blogger/${slug}/${file}` }));
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

  async function publishPost(id) {
    const current = await readPost(id);
    const saved = await savePost(id, { ...current.meta, body: current.body, status: "published", format: current.format });
    const post = await rawPost(saved.id);
    const outputPath = postOutputPath(post);
    await mkdir(path.dirname(outputPath), { recursive: true });
    if (post.origin === "history") {
      const template = await loadHistoryTemplate(post);
      await writeFile(outputPath, patchHistoricalTemplate(template, post), "utf8");
    } else {
      await writeFile(outputPath, renderPost(post), "utf8");
    }
    const indexPath = await rebuildIndex(post.locale);
    return { ...saved, outputPath, indexPath };
  }

  async function unpublishPost(id) {
    const current = await rawPost(id);
    if (current.featured) throw statusError(409, "Este artículo está destacado; elige otro destacado en una PR antes de retirarlo.");
    if (current.origin === "history") await preserveHistoryTemplate(current);
    const saved = await savePost(id, { ...present(current).meta, body: current.body, status: "draft", format: current.format });
    await removeFile(postOutputPath(current));
    await rebuildIndex(current.locale);
    return saved;
  }

  async function deletePost(id) {
    const current = await rawPost(id);
    if (current.status === "published") throw statusError(409, "Retira el post primero antes de eliminarlo.");
    if (current.featured) throw statusError(409, "El artículo destacado no se puede eliminar desde Blogger.");
    await writeManaged({
      id: current.id,
      slug: current.slug,
      locale: current.locale,
      outputFile: current.outputFile,
      origin: current.origin,
      url: current.url,
      deleted: true,
      updatedAt: new Date().toISOString(),
    });
    await removeFile(postOutputPath(current));
    await rebuildIndex(current.locale);
    return { id: current.id, deleted: true };
  }

  async function publishAll() {
    const managed = await managedPosts();
    for (const post of managed) {
      if (post.deleted || post.status !== "published") {
        if (post.origin === "history") await preserveHistoryTemplate(post);
        await removeFile(postOutputPath(post));
        continue;
      }
      const outputPath = postOutputPath(post);
      await mkdir(path.dirname(outputPath), { recursive: true });
      if (post.origin === "history") {
        const template = await loadHistoryTemplate(post);
        await writeFile(outputPath, patchHistoricalTemplate(template, post), "utf8");
      } else {
        await writeFile(outputPath, renderPost(post), "utf8");
      }
      for (const image of await listImages(post.slug)) {
        const targetDir = path.join(publicDir, "assets", "blogger", post.slug);
        await mkdir(targetDir, { recursive: true });
        await copyFile(path.join(imagesDir, post.slug, image.file), path.join(targetDir, image.file));
      }
    }
    const paths = [];
    for (const locale of ["es", "en"]) {
      try { paths.push(await rebuildIndex(locale)); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
    }
    return paths[0] || null;
  }

  async function preserveHistoryTemplate(post) {
    const templatePath = path.join(templatesDir, `${post.id}.html`);
    try {
      await readFile(templatePath, "utf8");
      return templatePath;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    try {
      const html = await readFile(postOutputPath(post), "utf8");
      await mkdir(templatesDir, { recursive: true });
      const temp = `${templatePath}.${process.pid}.tmp`;
      await writeFile(temp, html, "utf8");
      await rename(temp, templatePath);
      return templatePath;
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }

  async function loadHistoryTemplate(post) {
    const saved = await preserveHistoryTemplate(post);
    if (!saved) throw statusError(409, "No se encontró la plantilla histórica; no se publicó ningún cambio.");
    return readFile(saved, "utf8");
  }

  async function rebuildIndex(locale = "es") {
    const indexPath = path.join(publicDir, "blog", locale === "en" ? "index.en.html" : "index.html");
    let html = await readFile(indexPath, "utf8");
    html = html.replace(new RegExp(`${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}`), `${START}\n${END}`);
    const managed = (await managedPosts()).filter((post) => post.locale === locale);
    for (const post of managed.filter((item) => item.origin === "history")) html = removeStaticCard(html, post.url);
    const cards = managed
      .filter((post) => !post.deleted && post.status === "published")
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .map(renderCard)
      .join("\n");
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

  function postOutputPath(post) {
    assertSafeSlug(post.slug);
    const expected = outputFileFor(post.locale);
    if (post.outputFile !== expected) throw statusError(400, "Archivo de salida editorial inválido.");
    return path.join(publicDir, "entrada-de-blog", post.slug, expected);
  }

  return { listPosts, readPost, savePost, listImages, savePostImage, publishPost, unpublishPost, deletePost, publishAll };
}

function normalizeHistoryPost(post) {
  const locale = post.locale === "en" ? "en" : "es";
  const outputFile = outputFileFor(locale);
  const id = String(post.id || postId(post.slug, locale));
  assertSafeId(id);
  assertSafeSlug(post.slug);
  if (post.outputFile && post.outputFile !== outputFile) throw new Error(`Salida histórica inválida para ${id}.`);
  return {
    id,
    slug: post.slug,
    locale,
    outputFile,
    title: post.title,
    description: post.description || plainText(post.content_html || post.body).slice(0, 160),
    date: normalizeDate(post.date),
    category: post.category || (locale === "en" ? "AGAMA Blog" : "Blog"),
    author: post.author || "AGAMA",
    image: post.image || post.featured_image_url || "",
    status: "published",
    format: post.format || "html",
    body: post.body || post.content_html || "",
    source: "history",
    origin: "history",
    bodyRegion: post.bodyRegion || "post-content",
    sourcePath: post.sourcePath || "",
    featured: Boolean(post.featured),
    url: post.url || publicUrl(post.slug, locale),
  };
}

function summary(post) {
  return {
    id: post.id,
    slug: post.slug,
    locale: post.locale,
    title: post.title,
    description: post.description,
    date: post.date,
    status: post.status,
    source: post.source,
    origin: post.origin,
    url: post.url,
    featured: Boolean(post.featured),
    words: plainText(post.body).split(/\s+/).filter(Boolean).length,
  };
}

function present(post) {
  return {
    id: post.id,
    slug: post.slug,
    meta: {
      title: post.title,
      slug: post.slug,
      locale: post.locale,
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
    outputFile: post.outputFile,
    origin: post.origin,
    bodyRegion: post.bodyRegion,
    featured: Boolean(post.featured),
  };
}

function postId(slug, locale) {
  return locale === "en" ? `en-${slug}` : slug;
}

function outputFileFor(locale) {
  if (locale !== "es" && locale !== "en") throw statusError(400, "Idioma editorial inválido.");
  return locale === "en" ? "index.en.html" : "index.html";
}

function publicUrl(slug, locale) {
  return locale === "en" ? `/entrada-de-blog/${slug}/index.en.html` : `/entrada-de-blog/${slug}/`;
}

function renderPost(post) {
  const image = post.image ? `<img class="hero" src="${escapeHtml(post.image)}" alt="">` : "";
  const back = post.locale === "en" ? "/blog/index.en.html" : "/blog/";
  const backText = post.locale === "en" ? "← Back to blog" : "← Volver al blog";
  return `<!doctype html>
<html lang="${post.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(post.title)} | AGAMA</title><meta name="description" content="${escapeHtml(post.description)}">
<link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/editorial.css">
<script src="/assets/js/analytics-config.js"></script><script defer src="/assets/js/analytics.js"></script>
<style>body{margin:0;background:#f7f5ef;color:#17211c;font-family:Arial,sans-serif}.post{max-width:850px;margin:auto;padding:48px 24px}.back{color:#176f4d}.hero{width:100%;max-height:480px;object-fit:cover;border-radius:18px}h1{font-size:clamp(2.2rem,6vw,4.6rem);line-height:1}.meta{color:#617067}.content{font-size:1.08rem;line-height:1.75}.content img{max-width:100%;height:auto}</style></head>
<body><main class="post"><a class="back" href="${back}">${backText}</a><p class="meta">${escapeHtml(post.category || "Blog")} · ${escapeHtml(post.date || "")}</p><h1>${escapeHtml(post.title)}</h1>${image}<article class="content">${post.body}</article></main></body></html>`;
}

function patchHistoricalTemplate(template, post) {
  let html = String(template);
  html = replaceRequired(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(post.title)} | AGAMA</title>`, "title");
  html = replaceRequired(html, /<meta\s+name="description"\s+content="[^"]*"\s*\/?\s*>/i, `<meta name="description" content="${escapeHtml(post.description)}">`, "meta description");
  html = replaceRequired(html, /<h1([^>]*)>[\s\S]*?<\/h1>/i, `<h1$1>${escapeHtml(post.title)}</h1>`, "h1");
  if (post.bodyRegion === "article-body") {
    html = replaceRequired(html, /(<article\s+class="article-body"[^>]*>)[\s\S]*?(<\/article>)/i, `$1${post.body}$2`, "article-body");
  } else if (post.bodyRegion === "post-content") {
    html = replaceBalancedDivContent(html, "post-content", post.body);
  } else {
    throw statusError(409, "La plantilla histórica no tiene una región editorial conocida.");
  }
  return html;
}

function replaceBalancedDivContent(html, className, replacement) {
  const open = new RegExp(`<div\\s+class="[^"]*\\b${className}\\b[^"]*"[^>]*>`, "g");
  const match = open.exec(html);
  if (!match) throw statusError(409, `Falta la región histórica .${className}; no se publicó ningún cambio.`);
  const contentStart = match.index + match[0].length;
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = contentStart;
  let depth = 1;
  for (let tag = tags.exec(html); tag; tag = tags.exec(html)) {
    depth += tag[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return `${html.slice(0, contentStart)}${replacement}${html.slice(tag.index)}`;
  }
  throw statusError(409, `La región histórica .${className} no está cerrada; no se publicó ningún cambio.`);
}

function replaceRequired(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw statusError(409, `Falta ${label} en la plantilla histórica; no se publicó ningún cambio.`);
  return html.replace(pattern, replacement);
}

function renderCard(post) {
  const image = post.image ? `<div class="post-card-image"><img src="${escapeHtml(post.image)}" alt="" loading="lazy"></div>` : "";
  return `<a href="${escapeHtml(post.url)}" class="post-card" data-blogger-post>${image}<div class="post-card-body"><div class="post-card-meta"><span>${escapeHtml(post.date || "")}</span><span class="pill">${escapeHtml(post.category || "Blog")}</span></div><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.description)}</p></div></a>`;
}

function removeStaticCard(html, url) {
  const pattern = new RegExp(`\\s*<a\\s+href="${escapeRegExp(url)}"\\s+class="post-card"[^>]*>[\\s\\S]*?<\\/a>`, "g");
  return html.replace(pattern, "");
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
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function removeFile(filePath) {
  try { await unlink(filePath); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}

function statusError(status, message) {
  return Object.assign(new Error(message), { status });
}
