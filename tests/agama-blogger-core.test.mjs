import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createBloggerStore,
  sanitizeImageName,
  slugify,
} from "../scripts/agama-blogger-core.mjs";

const snapshotPath = new URL("../content/blogger/history.json", import.meta.url);

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "agama-blogger-"));
  const contentDir = path.join(root, "content");
  const publicDir = path.join(root, "public");
  await mkdir(path.join(publicDir, "blog"), { recursive: true });
  await writeFile(path.join(publicDir, "blog", "index.html"), '<html><body><section id="keep">Conservar</section><div class="post-grid"><!-- AGAMA_BLOGGER_POSTS --><a href="/entrada-de-blog/el-precio-es-una-respuesta-no-una-explicacion/" class="post-card"><div class="post-card-body"><h3>Precio anterior</h3></div></a></div></body></html>');
  await writeFile(path.join(publicDir, "blog", "index.en.html"), '<html><body><section id="keep-en">Keep</section><div class="post-grid"><!-- AGAMA_BLOGGER_POSTS --><a href="/entrada-de-blog/agama-en-plastimagen-2026/index.en.html" class="post-card"><div class="post-card-body"><h3>Old title</h3></div></a></div></body></html>');
  return { store: createBloggerStore({ contentDir, publicDir, snapshotPath }), root, contentDir, publicDir };
}

test("lists the 23 locale-aware editorial documents from the Git history", async () => {
  const { store } = await fixture();
  const posts = await store.listPosts();

  assert.equal(posts.length, 23);
  assert.ok(posts.every((post) => post.url.startsWith("/entrada-de-blog/")));
  assert.equal(posts.some((post) => post.slug === "masterbatch-azul-rey-mb106"), false);
  assert.equal(posts.find((post) => post.id === "en-agama-en-plastimagen-2026").locale, "en");
});

test("creates and reads a persistent draft", async () => {
  const { store } = await fixture();
  const created = await store.savePost(null, {
    title: "Color estable en producción",
    description: "Consejos prácticos para mantener un color estable.",
    body: "<h2>Preparación</h2><p>Contenido de prueba.</p>",
    status: "draft",
  });

  assert.equal(created.slug, "color-estable-en-produccion");
  assert.equal(created.meta.status, "draft");
  assert.equal((await store.listPosts()).length, 24);
  assert.match((await store.readPost(created.id)).body, /Contenido de prueba/);
});

test("validates required fields and rejects unsafe image names", async () => {
  const { store } = await fixture();
  await assert.rejects(() => store.savePost(null, { title: "Sin descripción", body: "texto" }), /descripción/i);
  assert.equal(slugify("ÁGAMA: Azul Rey"), "agama-azul-rey");
  assert.equal(sanitizeImageName("Foto producto ÁGAMA.jpg"), "foto-producto-agama.jpg");
  assert.throws(() => sanitizeImageName("../secret.txt"), /imagen inválida/i);
  assert.throws(() => sanitizeImageName("contenido-activo.svg"), /imagen inválida/i);
});

test("publishes a post page and adds it to the blog index", async () => {
  const { store } = await fixture();
  const draft = await store.savePost(null, {
    title: "Guía de pigmentos",
    description: "Una guía breve para elegir pigmentos.",
    body: "<h2>Elección</h2><p>Compara proceso y resina.</p>",
    author: "AGAMA",
    date: "2026-10-20",
  });

  const published = await store.publishPost(draft.id);
  const page = await readFile(published.outputPath, "utf8");
  const index = await readFile(published.indexPath, "utf8");

  assert.match(page, /Guía de pigmentos/);
  assert.match(page, /Compara proceso y resina/);
  assert.match(index, /entrada-de-blog\/guia-de-pigmentos/);
  assert.match(index, /class="post-card-body"/);
  assert.equal((await store.readPost(draft.id)).meta.status, "published");
});

test("a historical draft override keeps its locale and does not touch the public page", async () => {
  const { store, publicDir } = await fixture();
  const id = "en-agama-en-plastimagen-2026";
  const source = await store.readPost(id);
  const output = path.join(publicDir, "entrada-de-blog", source.meta.slug, "index.en.html");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, "<html>public original</html>");

  const saved = await store.savePost(id, { ...source.meta, title: "Draft title", body: "<p>Draft only</p>", status: "draft" });

  assert.equal(saved.id, id);
  assert.equal(saved.meta.locale, "en");
  assert.equal(saved.outputFile, "index.en.html");
  assert.equal(saved.origin, "history");
  assert.equal(await readFile(output, "utf8"), "<html>public original</html>");
  await assert.rejects(
    () => store.savePost(id, { ...source.meta, slug: "changed-route", body: source.body, status: "draft" }),
    /ruta.*histórica/i,
  );
});

test("publishing historical content patches only editable regions and replaces its exact card", async () => {
  const { store, publicDir } = await fixture();
  const id = "el-precio-es-una-respuesta-no-una-explicacion";
  const post = await store.readPost(id);
  const output = path.join(publicDir, "entrada-de-blog", post.meta.slug, "index.html");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, '<!doctype html><html><head><title>Old | AGAMA</title><meta name="description" content="Old description"><style>.keep{color:blue}</style></head><body><nav data-keep="yes">Menu</nav><h1>Old heading</h1><div class="post-content"><p>Old body</p><div class="nested">Nested</div></div><footer>Keep footer</footer></body></html>');
  await store.savePost(id, { ...post.meta, title: "Una explicación mejor", description: "Descripción actualizada", body: "<h2>Contenido nuevo</h2><p>Conservado.</p>", status: "draft" });

  const published = await store.publishPost(id);
  const page = await readFile(published.outputPath, "utf8");
  const index = await readFile(published.indexPath, "utf8");

  assert.match(page, /<title>Una explicación mejor \| AGAMA<\/title>/);
  assert.match(page, /content="Descripción actualizada"/);
  assert.match(page, /<h1>Una explicación mejor<\/h1>/);
  assert.match(page, /<div class="post-content"><h2>Contenido nuevo<\/h2><p>Conservado\.<\/p><\/div>/);
  assert.match(page, /<style>\.keep\{color:blue\}<\/style>/);
  assert.match(page, /<nav data-keep="yes">Menu<\/nav>/);
  assert.match(page, /<footer>Keep footer<\/footer>/);
  assert.match(index, /<section id="keep">Conservar<\/section>/);
  assert.equal((index.match(/el-precio-es-una-respuesta-no-una-explicacion\//g) || []).length, 1);
  assert.match(index, /Una explicación mejor/);
});

test("withdrawal and deletion persist as safe VPS overrides and replay on startup", async () => {
  const { store, contentDir, publicDir } = await fixture();
  const id = "el-precio-es-una-respuesta-no-una-explicacion";
  const post = await store.readPost(id);
  const output = path.join(publicDir, "entrada-de-blog", post.meta.slug, "index.html");
  const original = '<html><head><title>Original | AGAMA</title><meta name="description" content="Original"></head><body><h1>Original</h1><div class="post-content"><p>Original body</p></div></body></html>';
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, original);

  const withdrawn = await store.unpublishPost(id);
  assert.equal(withdrawn.meta.status, "draft");
  await assert.rejects(() => access(output), /ENOENT/);
  await writeFile(output, original);
  const restarted = createBloggerStore({ contentDir, publicDir, snapshotPath });
  await restarted.publishAll();
  await assert.rejects(() => access(output), /ENOENT/);

  await restarted.deletePost(id);
  assert.equal((await restarted.listPosts()).some((item) => item.id === id), false);
  await assert.rejects(() => restarted.readPost(id), /no encontrado/i);
  const tombstone = JSON.parse(await readFile(path.join(contentDir, "posts", `${id}.json`), "utf8"));
  assert.equal(tombstone.deleted, true);
});

test("published posts must be withdrawn first and featured history fails closed", async () => {
  const { store } = await fixture();
  await assert.rejects(() => store.deletePost("el-precio-es-una-respuesta-no-una-explicacion"), /retira.*primero/i);
  await assert.rejects(() => store.unpublishPost("por-que-necesitaria-color-un-plastico"), /destacado/i);
});

test("migrates legacy VPS records before replaying a populated volume", async () => {
  const { store, contentDir, publicDir } = await fixture();
  const postsDir = path.join(contentDir, "posts");
  await mkdir(postsDir, { recursive: true });
  await writeFile(path.join(postsDir, "entrada-legada.json"), JSON.stringify({
    slug: "entrada-legada",
    title: "Entrada legada",
    description: "Contenido ya persistido en el VPS anterior.",
    date: "2026-10-01",
    category: "Blog",
    author: "AGAMA",
    image: "",
    status: "published",
    format: "html",
    body: "<p>Publicación anterior.</p>",
    source: "managed",
    url: "/entrada-de-blog/entrada-legada/",
  }));

  await store.publishAll();

  const post = await store.readPost("entrada-legada");
  assert.equal(post.meta.locale, "es");
  assert.equal(post.outputFile, "index.html");
  assert.equal(post.published, true);
  assert.match(await readFile(path.join(publicDir, "entrada-de-blog", "entrada-legada", "index.html"), "utf8"), /Publicación anterior/);
});

test("derives historical provenance when migrating an old VPS override", async () => {
  const { store, contentDir, publicDir } = await fixture();
  const id = "el-precio-es-una-respuesta-no-una-explicacion";
  const output = path.join(publicDir, "entrada-de-blog", id, "index.html");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, '<html><head><title>Original | AGAMA Blog</title><meta name="description" content="Original"></head><body><nav>Conservar navegación</nav><h1>Original</h1><div class="post-content"><p>Original body</p></div><footer>Conservar pie</footer></body></html>');
  const postsDir = path.join(contentDir, "posts");
  await mkdir(postsDir, { recursive: true });
  await writeFile(path.join(postsDir, `${id}.json`), JSON.stringify({
    slug: id,
    title: "Edición anterior",
    description: "Persistida por la versión anterior.",
    date: "2026-10-01",
    category: "Blog",
    author: "AGAMA",
    image: "",
    status: "published",
    format: "html",
    body: "<p>Cuerpo persistido.</p>",
    source: "managed",
    url: `/entrada-de-blog/${id}/`,
  }));

  await store.publishAll();

  const migrated = await store.readPost(id);
  const page = await readFile(output, "utf8");
  assert.equal(migrated.origin, "history");
  assert.equal(migrated.published, true);
  assert.match(page, /<nav>Conservar navegación<\/nav>/);
  assert.match(page, /Cuerpo persistido/);
  assert.match(page, /<footer>Conservar pie<\/footer>/);
});

test("keeps the last published revision live while a newer draft is saved and replayed", async () => {
  const { store, contentDir, publicDir } = await fixture();
  const draft = await store.savePost(null, {
    title: "Versión pública",
    slug: "version-publica",
    description: "Descripción pública.",
    body: "<p>Cuerpo público.</p>",
    status: "draft",
  });
  await store.publishPost(draft.id);
  await store.savePost(draft.id, {
    ...draft.meta,
    title: "Borrador privado",
    description: "Descripción privada.",
    body: "<p>No publicar todavía.</p>",
    status: "draft",
  });

  const restarted = createBloggerStore({ contentDir, publicDir, snapshotPath });
  await restarted.publishAll();

  const page = await readFile(path.join(publicDir, "entrada-de-blog", "version-publica", "index.html"), "utf8");
  const index = await readFile(path.join(publicDir, "blog", "index.html"), "utf8");
  assert.match(page, /Versión pública/);
  assert.doesNotMatch(page, /Borrador privado|No publicar todavía/);
  assert.match(index, /Versión pública/);
  assert.equal((await restarted.readPost(draft.id)).published, true);
  assert.equal((await restarted.readPost(draft.id)).meta.status, "draft");
});

test("requires withdrawal before changing the route of a managed public post", async () => {
  const { store } = await fixture();
  const draft = await store.savePost(null, {
    title: "Ruta pública",
    slug: "ruta-publica",
    description: "Descripción pública.",
    body: "<p>Contenido.</p>",
  });
  await store.publishPost(draft.id);

  await assert.rejects(() => store.savePost(draft.id, {
    ...draft.meta,
    slug: "ruta-cambiada",
    body: "<p>Borrador.</p>",
  }), /retira.*antes.*ruta/i);
});

test("saving a featured historical draft never withdraws it during replay", async () => {
  const { store, contentDir, publicDir } = await fixture();
  const id = "por-que-necesitaria-color-un-plastico";
  const current = await store.readPost(id);
  const output = path.join(publicDir, "entrada-de-blog", current.meta.slug, "index.html");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, '<html><head><title>Featured | AGAMA</title><meta name="description" content="Featured"></head><body><h1>Featured</h1><div class="post-content"><p>Featured body</p></div></body></html>');
  await store.savePost(id, { ...current.meta, title: "Borrador destacado", body: "<p>Privado</p>", status: "draft" });

  const restarted = createBloggerStore({ contentDir, publicDir, snapshotPath });
  await restarted.publishAll();

  assert.match(await readFile(output, "utf8"), /Featured body/);
});

test("publishes an English historical card inside the real post grid", async () => {
  const { store, publicDir } = await fixture();
  const realEnglishIndex = await readFile(new URL("../blog/index.en.html", import.meta.url), "utf8");
  await writeFile(path.join(publicDir, "blog", "index.en.html"), realEnglishIndex);
  const id = "en-agama-en-meximold-2026";
  const current = await store.readPost(id);
  const output = path.join(publicDir, "entrada-de-blog", current.meta.slug, "index.en.html");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, '<html><head><title>Old | AGAMA Blog</title><meta name="description" content="Old"></head><body><h1>Old</h1><div class="post-content"><p>Old body</p></div></body></html>');
  await store.savePost(id, { ...current.meta, title: "Updated Meximold", body: "<p>Updated body.</p>", status: "draft" });

  await store.publishPost(id);

  const index = await readFile(path.join(publicDir, "blog", "index.en.html"), "utf8");
  const card = index.indexOf("Updated Meximold");
  const grid = index.indexOf('<div class="post-grid">');
  const clusters = index.indexOf("pr164-clusters:start");
  const footer = index.indexOf('<footer class="site-footer-placeholder">');
  assert.ok(grid >= 0 && card > grid && card < clusters && card < footer);
  assert.equal((index.match(/agama-en-meximold-2026\/index\.en\.html/g) || []).length, 1);
});

test("publishes a Spanish historical card inside the real post grid", async () => {
  const { store, publicDir } = await fixture();
  const realSpanishIndex = await readFile(new URL("../blog/index.html", import.meta.url), "utf8");
  await writeFile(path.join(publicDir, "blog", "index.html"), realSpanishIndex);
  const id = "el-precio-es-una-respuesta-no-una-explicacion";
  const current = await store.readPost(id);
  const output = path.join(publicDir, "entrada-de-blog", current.meta.slug, "index.html");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, '<html><head><title>Old | AGAMA Blog</title><meta name="description" content="Old"></head><body><h1>Old</h1><div class="post-content"><p>Old body</p></div></body></html>');
  await store.savePost(id, { ...current.meta, title: "Precio actualizado", body: "<p>Contenido actualizado.</p>", status: "draft" });

  await store.publishPost(id);

  const index = await readFile(path.join(publicDir, "blog", "index.html"), "utf8");
  const card = index.indexOf("Precio actualizado");
  const grid = index.indexOf('class="post-grid"');
  const newsletter = index.indexOf('class="newsletter-panel"');
  assert.ok(grid >= 0 && card > grid && card < newsletter);
  assert.equal((index.match(/el-precio-es-una-respuesta-no-una-explicacion\//g) || []).length, 1);
});

test("publishes literal replacement tokens without expanding old HTML", async () => {
  const { store, publicDir } = await fixture();
  const id = "el-precio-es-una-respuesta-no-una-explicacion";
  const current = await store.readPost(id);
  const output = path.join(publicDir, "entrada-de-blog", current.meta.slug, "index.html");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, '<html><head><title>Old | AGAMA Blog</title><meta name="description" content="Old"></head><body><h1 data-label="$&">Old</h1><div class="post-content"><p>Old body</p></div></body></html>');
  await store.savePost(id, { ...current.meta, title: "Precio $& $' $$", description: "Detalle $& $' $$", body: "<p>Nuevo.</p>", status: "draft" });

  await store.publishPost(id);

  const page = await readFile(output, "utf8");
  assert.match(page, /<title>Precio \$&amp; \$&#39; \$\$ \| AGAMA Blog<\/title>/);
  assert.match(page, /content="Detalle \$&amp; \$&#39; \$\$"/);
  assert.match(page, /<h1 data-label="\$&">Precio \$&amp; \$&#39; \$\$<\/h1>/);
  assert.equal((page.match(/<title>/g) || []).length, 1);
});

test("keeps deleted historical identities reserved", async () => {
  const { store } = await fixture();
  const id = "el-precio-es-una-respuesta-no-una-explicacion";
  await store.unpublishPost(id);
  await store.deletePost(id);

  await assert.rejects(() => store.savePost(null, {
    title: "Intento de recreación",
    slug: id,
    locale: "es",
    description: "No debe sustituir una ruta histórica.",
    body: "<p>No publicar.</p>",
  }), /histórica.*reservada/i);
});

test("cannot rename a managed draft onto an untouched historical identity", async () => {
  const { store } = await fixture();
  const draft = await store.savePost(null, {
    title: "Borrador independiente",
    slug: "borrador-independiente",
    description: "No debe apropiarse del histórico.",
    body: "<p>Borrador.</p>",
  });

  await assert.rejects(() => store.savePost(draft.id, {
    ...draft.meta,
    slug: "001-que-significa-la-palabra-agama",
    body: draft.body,
  }), /histórica.*reservada/i);
});

test("preserves noncatalog public routes when replaying or deleting an old colliding draft", async () => {
  const { store, contentDir, publicDir } = await fixture();
  const slug = "masterbatch-azul-rey-mb106";
  const output = path.join(publicDir, "entrada-de-blog", slug, "index.html");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, "<html><body>SEO público protegido</body></html>");
  const postsDir = path.join(contentDir, "posts");
  await mkdir(postsDir, { recursive: true });
  await writeFile(path.join(postsDir, `${slug}.json`), JSON.stringify({
    slug,
    title: "Borrador antiguo",
    description: "Colisión creada por una versión anterior.",
    date: "2026-10-01",
    category: "Blog",
    author: "AGAMA",
    status: "draft",
    format: "html",
    body: "<p>No publicado.</p>",
    source: "managed",
    url: `/entrada-de-blog/${slug}/`,
  }));

  await store.publishAll();
  assert.match(await readFile(output, "utf8"), /SEO público protegido/);
  await store.deletePost(slug);
  assert.match(await readFile(output, "utf8"), /SEO público protegido/);

  await assert.rejects(() => store.savePost(null, {
    title: "Otra colisión",
    slug,
    description: "Debe quedar bloqueada.",
    body: "<p>No.</p>",
  }), /ruta pública ya existe|ya existe otro post/i);
});

test("serializes concurrent publications so both cards remain in the index", async () => {
  const { store, publicDir } = await fixture();
  const first = await store.savePost(null, {
    title: "Publicación concurrente A",
    slug: "concurrente-a",
    description: "Primera publicación.",
    body: "<p>A</p>",
  });
  const second = await store.savePost(null, {
    title: "Publicación concurrente B",
    slug: "concurrente-b",
    description: "Segunda publicación.",
    body: "<p>B</p>",
  });

  await Promise.all([store.publishPost(first.id), store.publishPost(second.id)]);

  const index = await readFile(path.join(publicDir, "blog", "index.html"), "utf8");
  assert.equal((index.match(/concurrente-a\//g) || []).length, 1);
  assert.equal((index.match(/concurrente-b\//g) || []).length, 1);
  assert.equal((await store.readPost(first.id)).published, true);
  assert.equal((await store.readPost(second.id)).published, true);
});

test("serializes publication followed by withdrawal without leaving partial output", async () => {
  const { store, publicDir } = await fixture();
  const draft = await store.savePost(null, {
    title: "Ciclo concurrente",
    slug: "ciclo-concurrente",
    description: "Publicación y retirada ordenadas.",
    body: "<p>Contenido.</p>",
  });

  await Promise.all([store.publishPost(draft.id), store.unpublishPost(draft.id)]);

  const post = await store.readPost(draft.id);
  const index = await readFile(path.join(publicDir, "blog", "index.html"), "utf8");
  assert.equal(post.published, false);
  assert.equal(post.meta.status, "draft");
  assert.doesNotMatch(index, /ciclo-concurrente\//);
  await assert.rejects(() => access(path.join(publicDir, "entrada-de-blog", "ciclo-concurrente", "index.html")), /ENOENT/);
});

test("keeps literal replacement tokens in an article-body history region", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "agama-blogger-article-"));
  const contentDir = path.join(root, "content");
  const publicDir = path.join(root, "public");
  const customSnapshot = path.join(root, "history.json");
  const slug = "historia-article-body";
  await mkdir(path.join(publicDir, "blog"), { recursive: true });
  await mkdir(path.join(publicDir, "entrada-de-blog", slug), { recursive: true });
  await writeFile(path.join(publicDir, "blog", "index.html"), `<html><body><div class="post-grid"><!-- AGAMA_BLOGGER_POSTS --><a href="/entrada-de-blog/${slug}/" class="post-card">Original</a></div></body></html>`);
  await writeFile(path.join(publicDir, "blog", "index.en.html"), '<html><body><div class="post-grid"><!-- AGAMA_BLOGGER_POSTS --></div></body></html>');
  await writeFile(path.join(publicDir, "entrada-de-blog", slug, "index.html"), '<html><head><title>Original | AGAMA</title><meta name="description" content="Original"></head><body><h1>Original</h1><article class="article-body"><p>Original.</p></article></body></html>');
  await writeFile(customSnapshot, JSON.stringify([{
    id: slug,
    slug,
    locale: "es",
    outputFile: "index.html",
    title: "Original",
    description: "Original",
    date: "2026-10-01",
    category: "Blog",
    author: "AGAMA",
    image: "",
    status: "published",
    format: "html",
    body: "<p>Original.</p>",
    bodyRegion: "article-body",
    origin: "history",
    sourcePath: `entrada-de-blog/${slug}/index.html`,
    url: `/entrada-de-blog/${slug}/`,
    featured: false,
  }]));
  const store = createBloggerStore({ contentDir, publicDir, snapshotPath: customSnapshot });
  const current = await store.readPost(slug);
  await store.savePost(slug, { ...current.meta, body: "<p>$& $' $$</p>" });

  await store.publishPost(slug);

  const page = await readFile(path.join(publicDir, "entrada-de-blog", slug, "index.html"), "utf8");
  assert.match(page, /<article class="article-body"><p>\$& \$' \$\$<\/p><\/article>/);
  assert.equal((page.match(/<article class="article-body">/g) || []).length, 1);
});

test("failed historical publication stays a draft and remains replayable", async () => {
  const { store, contentDir, publicDir } = await fixture();
  const id = "el-precio-es-una-respuesta-no-una-explicacion";
  const current = await store.readPost(id);
  const output = path.join(publicDir, "entrada-de-blog", current.meta.slug, "index.html");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, "<html><body>Plantilla incompleta</body></html>");
  await store.savePost(id, { ...current.meta, title: "No persistir", body: "<p>Borrador.</p>", status: "draft" });

  await assert.rejects(() => store.publishPost(id), /plantilla histórica|falta title/i);
  assert.equal((await store.readPost(id)).meta.status, "draft");

  const restarted = createBloggerStore({ contentDir, publicDir, snapshotPath });
  await restarted.publishAll();
  assert.equal(await readFile(output, "utf8"), "<html><body>Plantilla incompleta</body></html>");
});

test("replays a historical article republished after withdrawal without losing its card", async () => {
  const { store, contentDir, publicDir } = await fixture();
  const id = "el-precio-es-una-respuesta-no-una-explicacion";
  const current = await store.readPost(id);
  const output = path.join(publicDir, "entrada-de-blog", current.meta.slug, "index.html");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, '<html><head><title>Original | AGAMA</title><meta name="description" content="Original"></head><body><h1>Original</h1><div class="post-content"><p>Original body</p></div></body></html>');
  await store.unpublishPost(id);
  const withdrawn = await store.readPost(id);
  await store.savePost(id, { ...withdrawn.meta, title: "Republicado", description: "Regresa de forma segura.", body: "<p>Versión republicada.</p>" });
  await store.publishPost(id);

  const restarted = createBloggerStore({ contentDir, publicDir, snapshotPath });
  await restarted.publishAll();

  const index = await readFile(path.join(publicDir, "blog", "index.html"), "utf8");
  assert.equal((index.match(/el-precio-es-una-respuesta-no-una-explicacion\//g) || []).length, 1);
  assert.match(index, /Republicado/);
});

