import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createBloggerStore,
  sanitizeImageName,
  slugify,
} from "../scripts/agama-blogger-core.mjs";

const snapshotPath = new URL("../wordpress/import/agama-blog-posts.snapshot.json", import.meta.url);

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "agama-blogger-"));
  const contentDir = path.join(root, "content");
  const publicDir = path.join(root, "public");
  await mkdir(path.join(publicDir, "blog"), { recursive: true });
  await writeFile(path.join(publicDir, "blog", "index.html"), "<html><body><!-- AGAMA_BLOGGER_POSTS --></body></html>");
  return createBloggerStore({ contentDir, publicDir, snapshotPath });
}

test("lists only the nine editorial posts from the AGAMA snapshot", async () => {
  const store = await fixture();
  const posts = await store.listPosts();

  assert.equal(posts.length, 9);
  assert.ok(posts.every((post) => post.url.startsWith("/entrada-de-blog/")));
  assert.equal(posts.some((post) => post.slug.includes("ad301-faq")), false);
});

test("creates and reads a persistent draft", async () => {
  const store = await fixture();
  const created = await store.savePost(null, {
    title: "Color estable en producción",
    description: "Consejos prácticos para mantener un color estable.",
    body: "<h2>Preparación</h2><p>Contenido de prueba.</p>",
    status: "draft",
  });

  assert.equal(created.slug, "color-estable-en-produccion");
  assert.equal(created.meta.status, "draft");
  assert.equal((await store.listPosts()).length, 10);
  assert.match((await store.readPost(created.slug)).body, /Contenido de prueba/);
});

test("validates required fields and rejects unsafe image names", async () => {
  const store = await fixture();
  await assert.rejects(() => store.savePost(null, { title: "Sin descripción", body: "texto" }), /descripción/i);
  assert.equal(slugify("ÁGAMA: Azul Rey"), "agama-azul-rey");
  assert.equal(sanitizeImageName("Foto producto ÁGAMA.jpg"), "foto-producto-agama.jpg");
  assert.throws(() => sanitizeImageName("../secret.txt"), /imagen inválida/i);
  assert.throws(() => sanitizeImageName("contenido-activo.svg"), /imagen inválida/i);
});

test("publishes a post page and adds it to the blog index", async () => {
  const store = await fixture();
  const draft = await store.savePost(null, {
    title: "Guía de pigmentos",
    description: "Una guía breve para elegir pigmentos.",
    body: "<h2>Elección</h2><p>Compara proceso y resina.</p>",
    author: "AGAMA",
    date: "2026-10-20",
  });

  const published = await store.publishPost(draft.slug);
  const page = await readFile(published.outputPath, "utf8");
  const index = await readFile(published.indexPath, "utf8");

  assert.match(page, /Guía de pigmentos/);
  assert.match(page, /Compara proceso y resina/);
  assert.match(index, /entrada-de-blog\/guia-de-pigmentos/);
  assert.match(index, /class="post-card-body"/);
  assert.equal((await store.readPost(draft.slug)).meta.status, "published");
});

