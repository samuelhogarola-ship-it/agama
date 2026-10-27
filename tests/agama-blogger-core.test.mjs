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
  await writeFile(path.join(publicDir, "blog", "index.html"), '<html><body><section id="keep">Conservar</section><div class="post-grid"><a href="/entrada-de-blog/el-precio-es-una-respuesta-no-una-explicacion/" class="post-card"><div class="post-card-body"><h3>Precio anterior</h3></div></a></div><!-- AGAMA_BLOGGER_POSTS --></body></html>');
  await writeFile(path.join(publicDir, "blog", "index.en.html"), '<html><body><section id="keep-en">Keep</section><div class="post-grid"><a href="/entrada-de-blog/agama-en-plastimagen-2026/index.en.html" class="post-card"><div class="post-card-body"><h3>Old title</h3></div></a></div><!-- AGAMA_BLOGGER_POSTS --></body></html>');
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

