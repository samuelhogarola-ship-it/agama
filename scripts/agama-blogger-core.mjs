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

  async function managedPosts(history = null) {
    await mkdir(postsDir, { recursive: true });
    const files = (await readdir(postsDir)).filter((file) => file.endsWith(".json"));
    const catalog = history || await historyPosts();
    const historyById = new Map(catalog.map((post) => [post.id, post]));
    return Promise.all(files.map(async (file) => normalizeManagedPost(
      JSON.parse(await readFile(path.join(postsDir, file), "utf8")),
      historyById,
    )));
  }

  async function listPosts() {
    const history = await historyPosts();
    const managed = await managedPosts(history);
    const byId = new Map(history.map((post) => [post.id, post]));
    for (const post of managed) byId.set(post.id, post);
    return [...byId.values()]
      .filter((post) => !post.deleted)
      .map(summary)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.title.localeCompare(b.title));
  }

  async function rawPost(id) {
    assertSafeId(id);
    const history = await historyPosts();
    const historyById = new Map(history.map((post) => [post.id, post]));
    try {
      const managed = normalizeManagedPost(
        JSON.parse(await readFile(path.join(postsDir, `${id}.json`), "utf8")),
        historyById,
      );
      if (managed.deleted) throw statusError(404, "Post no encontrado.");
      return managed;
    } catch (error) {
      if (error.status === 404) throw error;
      if (error.code !== "ENOENT") throw error;
    }
    const post = historyById.get(id);
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
    if (current?.origin !== "history" && current && isPublic(current) && slug !== current.slug) {
      throw statusError(409, "Retira el post antes de cambiar una ruta que sigue publicada.");
    }
    const id = current?.origin === "history" ? current.id : postId(slug, locale);
    const history = await historyPosts();
    const historyById = new Map(history.map((post) => [post.id, post]));
    if (!currentId && historyById.has(id)) {
      throw statusError(409, "La identidad de esta ruta histórica está reservada.");
    }
    const existing = await managedPosts(history);
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
      status: "draft",
      format: input.format === "markdown" ? "markdown" : "html",
      body,
      source: "managed",
      origin: current?.origin || "managed",
      bodyRegion: current?.bodyRegion || "generated",
      sourcePath: current?.sourcePath || "",
      featured: Boolean(current?.featured),
      withdrawn: Boolean(current?.withdrawn),
      publishedRevision: current?.publishedRevision || null,
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
    const current = await rawPost(id);
    const post = {
      ...current,
      status: "published",
      withdrawn: false,
      deleted: false,
      publishedRevision: publicationSnapshot(current),
      updatedAt: new Date().toISOString(),
    };
    const published = publishedPost(post);
    const outputPath = postOutputPath(published);
    await mkdir(path.dirname(outputPath), { recursive: true });
    let pageHtml;
    if (published.origin === "history") {
      const template = await loadHistoryTemplate(post);
      pageHtml = patchHistoricalTemplate(template, published);
    } else {
      pageHtml = renderPost(published);
    }
    const preparedIndex = await prepareIndex(post.locale, post);
    const pageTemp = `${outputPath}.${process.pid}.tmp`;
    const indexTemp = `${preparedIndex.indexPath}.${process.pid}.tmp`;
    await writeFile(pageTemp, pageHtml, "utf8");
    await writeFile(indexTemp, preparedIndex.html, "utf8");
    try {
      await writeManaged(post);
      await rename(pageTemp, outputPath);
      await rename(indexTemp, preparedIndex.indexPath);
    } catch (error) {
      await removeFile(pageTemp);
      await removeFile(indexTemp);
      throw error;
    }
    return { ...present(post), outputPath, indexPath: preparedIndex.indexPath };
  }

  async function unpublishPost(id) {
    const current = await rawPost(id);
    if (current.featured) throw statusError(409, "Este artículo está destacado; elige otro destacado en una PR antes de retirarlo.");
    if (current.origin === "history") await preserveHistoryTemplate(current);
    const saved = {
      ...current,
      status: "draft",
      withdrawn: true,
      publishedRevision: null,
      updatedAt: new Date().toISOString(),
    };
    const preparedIndex = await prepareIndex(current.locale, saved);
    await writeManaged(saved);
    await removeFile(postOutputPath(current));
    await writeFile(preparedIndex.indexPath, preparedIndex.html, "utf8");
    return present(saved);
  }

  async function deletePost(id) {
    const current = await rawPost(id);
    if (isPublic(current)) throw statusError(409, "Retira el post primero antes de eliminarlo.");
    if (current.featured) throw statusError(409, "El artículo destacado no se puede eliminar desde Blogger.");
    const tombstone = {
      id: current.id,
      slug: current.slug,
      locale: current.locale,
      outputFile: current.outputFile,
      origin: current.origin,
      url: current.url,
      deleted: true,
      withdrawn: true,
      publishedRevision: null,
      updatedAt: new Date().toISOString(),
    };
    const preparedIndex = await prepareIndex(current.locale, tombstone);
    await writeManaged(tombstone);
    await removeFile(postOutputPath(current));
    await writeFile(preparedIndex.indexPath, preparedIndex.html, "utf8");
    return { id: current.id, deleted: true };
  }

  async function publishAll() {
    const managed = await managedPosts();
    for (const post of managed) {
      if (post.deleted || post.withdrawn) {
        if (post.origin === "history") await preserveHistoryTemplate(post);
        await removeFile(postOutputPath(post));
        continue;
      }
      if (!post.publishedRevision) {
        if (post.origin !== "history") await removeFile(postOutputPath(post));
        continue;
      }
      const published = publishedPost(post);
      const outputPath = postOutputPath(published);
      await mkdir(path.dirname(outputPath), { recursive: true });
      if (published.origin === "history") {
        const template = await loadHistoryTemplate(post);
        await writeFile(outputPath, patchHistoricalTemplate(template, published), "utf8");
      } else {
        await writeFile(outputPath, renderPost(published), "utf8");
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
    const prepared = await prepareIndex(locale);
    await writeFile(prepared.indexPath, prepared.html, "utf8");
    return prepared.indexPath;
  }

  async function prepareIndex(locale = "es", override = null) {
    const indexPath = path.join(publicDir, "blog", locale === "en" ? "index.en.html" : "index.html");
    const source = await readFile(indexPath, "utf8");
    const managed = await managedPosts();
    if (override) {
      const position = managed.findIndex((post) => post.id === override.id);
      if (position >= 0) managed[position] = override;
      else managed.push(override);
    }
    return { indexPath, html: buildIndexHtml(source, managed, locale) };
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
    withdrawn: false,
    publishedRevision: null,
    url: post.url || publicUrl(post.slug, locale),
  };
}

function normalizeManagedPost(raw, historyById) {
  const locale = raw.locale === "en" ? "en" : "es";
  const slug = String(raw.slug || "");
  assertSafeSlug(slug);
  const id = String(raw.id || postId(slug, locale));
  assertSafeId(id);
  const historical = historyById.get(id);
  const origin = historical ? "history" : (raw.origin === "history" ? "history" : "managed");
  if (origin === "history" && !historical) {
    throw statusError(409, `No existe el artículo histórico ${id} en el catálogo versionado.`);
  }
  const outputFile = outputFileFor(historical?.locale || locale);
  if (raw.outputFile && raw.outputFile !== outputFile) {
    throw statusError(400, "Archivo de salida editorial inválido.");
  }
  const base = historical || {};
  const post = {
    ...base,
    ...raw,
    id,
    slug: historical?.slug || slug,
    locale: historical?.locale || locale,
    outputFile,
    source: "managed",
    origin,
    bodyRegion: historical?.bodyRegion || raw.bodyRegion || "generated",
    sourcePath: historical?.sourcePath || raw.sourcePath || "",
    featured: Boolean(historical?.featured || raw.featured),
    url: publicUrl(historical?.slug || slug, historical?.locale || locale),
    withdrawn: Boolean(raw.withdrawn),
    deleted: Boolean(raw.deleted),
  };
  post.publishedRevision = normalizePublishedRevision(raw.publishedRevision)
    || (raw.status === "published" && !post.deleted ? publicationSnapshot(post) : null);
  post.status = raw.status === "published" ? "published" : "draft";
  return post;
}

function normalizePublishedRevision(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    title: String(value.title || "").trim(),
    description: String(value.description || "").trim(),
    date: normalizeDate(value.date),
    category: String(value.category || "").trim(),
    author: String(value.author || "").trim(),
    image: String(value.image || "").trim(),
    format: value.format === "markdown" ? "markdown" : "html",
    body: String(value.body || ""),
  };
}

function publicationSnapshot(post) {
  return {
    title: post.title,
    description: post.description,
    date: post.date,
    category: post.category,
    author: post.author,
    image: post.image,
    format: post.format || "html",
    body: post.body,
  };
}

function publishedPost(post) {
  if (!post.publishedRevision) throw statusError(409, "No existe una revisión publicada para este artículo.");
  return { ...post, ...post.publishedRevision, status: "published" };
}

function isPublic(post) {
  return !post.deleted && !post.withdrawn && (post.origin === "history" || Boolean(post.publishedRevision));
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
    published: isPublic(post),
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
    published: isPublic(post),
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
  html = replaceRequired(html, /<title>([\s\S]*?)<\/title>/i, (_, previousTitle) => {
    const separator = previousTitle.indexOf(" | ");
    const suffix = separator >= 0 ? previousTitle.slice(separator) : " | AGAMA";
    return `<title>${escapeHtml(post.title)}${suffix}</title>`;
  }, "title");
  html = replaceRequired(html, /<meta\s+name="description"\s+content="[^"]*"\s*\/?\s*>/i, () => `<meta name="description" content="${escapeHtml(post.description)}">`, "meta description");
  html = replaceRequired(html, /<h1([^>]*)>[\s\S]*?<\/h1>/i, (_, attributes) => `<h1${attributes}>${escapeHtml(post.title)}</h1>`, "h1");
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

function buildIndexHtml(source, managed, locale) {
  let html = String(source);
  const previousBlock = new RegExp(`${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}`);
  html = html.replace(previousBlock, () => `${START}\n${END}`);
  const scoped = managed.filter((post) => post.locale === locale);
  const missingHistoricalCards = [];
  for (const post of scoped.filter((item) => item.origin === "history")) {
    if (post.deleted || post.withdrawn) {
      html = removeStaticCard(html, post.url);
      continue;
    }
    if (!post.publishedRevision) continue;
    const replacement = renderCard(publishedPost(post));
    const result = replaceStaticCard(html, post.url, replacement);
    html = result.html;
    if (!result.replaced) missingHistoricalCards.push(replacement);
  }

  const managedCards = scoped
    .filter((post) => post.origin !== "history" && !post.deleted && !post.withdrawn && post.publishedRevision)
    .sort((a, b) => String(b.publishedRevision.date).localeCompare(String(a.publishedRevision.date)))
    .map((post) => renderCard(publishedPost(post)));
  const cards = [...missingHistoricalCards, ...managedCards].join("\n");
  const block = `${START}\n${cards}\n${END}`;
  return placeManagedBlock(html, block);
}

function placeManagedBlock(html, block) {
  const grid = findBalancedDivBounds(html, "post-grid");
  if (!grid) throw statusError(409, "No se encontró la cuadrícula del blog; no se modificó el índice.");
  const managedPattern = new RegExp(`${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}`);
  const managedMatch = managedPattern.exec(html);
  if (managedMatch) {
    if (managedMatch.index < grid.contentStart || managedMatch.index + managedMatch[0].length > grid.closeStart) {
      throw statusError(409, "El bloque administrado está fuera de la cuadrícula del blog.");
    }
    return html.replace(managedPattern, () => block);
  }
  const placeholder = "<!-- AGAMA_BLOGGER_POSTS -->";
  const placeholderIndex = html.indexOf(placeholder);
  if (placeholderIndex >= 0) {
    if (placeholderIndex < grid.contentStart || placeholderIndex > grid.closeStart) {
      throw statusError(409, "El marcador del Blogger está fuera de la cuadrícula del blog.");
    }
    return `${html.slice(0, placeholderIndex)}${block}${html.slice(placeholderIndex + placeholder.length)}`;
  }
  return `${html.slice(0, grid.closeStart)}${block}\n${html.slice(grid.closeStart)}`;
}

function findBalancedDivBounds(html, className) {
  const open = new RegExp(`<div\\s+class="[^"]*\\b${className}\\b[^"]*"[^>]*>`, "g");
  const match = open.exec(html);
  if (!match) return null;
  const contentStart = match.index + match[0].length;
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = contentStart;
  let depth = 1;
  for (let tag = tags.exec(html); tag; tag = tags.exec(html)) {
    depth += tag[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return { openStart: match.index, contentStart, closeStart: tag.index, closeEnd: tag.index + tag[0].length };
  }
  throw statusError(409, "La cuadrícula del blog no está cerrada; no se modificó el índice.");
}

function staticCardPattern(url) {
  return new RegExp(`\\s*<a\\s+href="${escapeRegExp(url)}"\\s+class="post-card"[^>]*>[\\s\\S]*?<\\/a>`);
}

function replaceStaticCard(html, url, replacement) {
  const pattern = staticCardPattern(url);
  const replaced = pattern.test(html);
  return { html: replaced ? html.replace(pattern, () => `\n${replacement}`) : html, replaced };
}

function removeStaticCard(html, url) {
  const pattern = new RegExp(`\\s*<a\\s+href="${escapeRegExp(url)}"\\s+class="post-card"[^>]*>[\\s\\S]*?<\\/a>`, "g");
  return html.replace(pattern, () => "");
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
