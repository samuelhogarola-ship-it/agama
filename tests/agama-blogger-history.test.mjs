import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts", "agama-blogger-history.mjs");
const COMMITTED = path.join(ROOT, "content", "blogger", "history.json");

const EXPECTED_ES = [
  "001-que-significa-la-palabra-agama",
  "002-claves-de-productos",
  "003-que-es-un-vehiculo",
  "004-como-formulamos-los-masterbatch-de-linea",
  "005-que-es-realmente-el-plastico",
  "006-por-que-hay-colores-que-se-salen-del-plastico",
  "aditivos-para-plastico-en-mexico-7-preguntas-para-una-reunion-util-en-feria",
  "agama-en-meximold-2026",
  "agama-en-plastimagen-2026",
  "como-comparar-proveedores-de-masterbatch-durante-meximold",
  "el-precio-es-una-respuesta-no-una-explicacion",
  "mb-115-negro-kalo-mejora-su-dispersion",
  "pigmentos-para-plastico-en-mexico-que-evaluar-antes-de-cambiar-de-proveedor",
  "plan-de-marketing-b2b-para-ferias-industriales-en-mexico",
  "por-que-necesitaria-color-un-plastico",
  "por-que-varia-el-color-en-materiales-lechosos-o-con-base-blanca",
  "que-es-un-pigmento-y-que-es-un-masterbatch",
];

const EXPECTED_EN = [
  "en-aditivos-para-plastico-en-mexico-7-preguntas-para-una-reunion-util-en-feria",
  "en-agama-en-meximold-2026",
  "en-agama-en-plastimagen-2026",
  "en-como-comparar-proveedores-de-masterbatch-durante-meximold",
  "en-pigmentos-para-plastico-en-mexico-que-evaluar-antes-de-cambiar-de-proveedor",
  "en-plan-de-marketing-b2b-para-ferias-industriales-en-mexico",
];

async function generate(name) {
  const temp = await mkdtemp(path.join(os.tmpdir(), "agama-blogger-history-"));
  const output = path.join(temp, name);
  const result = spawnSync(process.execPath, [SCRIPT, "--root", ROOT, "--output", output], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
  return { output, text: await readFile(output, "utf8"), catalog: JSON.parse(await readFile(output, "utf8")) };
}

test("builds the exact editorial catalog exposed by both blog indexes", async () => {
  const { catalog } = await generate("history.json");

  assert.equal(catalog.length, 23);
  assert.deepEqual(catalog.filter((post) => post.locale === "es").map((post) => post.id).sort(), EXPECTED_ES);
  assert.deepEqual(catalog.filter((post) => post.locale === "en").map((post) => post.id).sort(), EXPECTED_EN);
  assert.equal(new Set(catalog.map((post) => post.id)).size, 23);
  assert.equal(catalog.some((post) => post.slug === "masterbatch-azul-rey-mb106"), false);

  for (const post of catalog) {
    assert.match(post.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(["es", "en"].includes(post.locale));
    assert.equal(post.outputFile, post.locale === "en" ? "index.en.html" : "index.html");
    assert.ok(post.title && post.description && post.body);
    assert.equal((await stat(path.join(ROOT, post.sourcePath))).isFile(), true);
  }
});

test("preserves legacy editorial HTML and generates a deterministic Git artifact", async () => {
  const first = await generate("first.json");
  const second = await generate("second.json");
  const legacy = JSON.parse(await readFile(path.join(ROOT, "wordpress", "import", "agama-blog-posts.snapshot.json"), "utf8"));
  const original = legacy.find((post) => post.slug === "001-que-significa-la-palabra-agama");
  const migrated = first.catalog.find((post) => post.id === original.slug);

  assert.equal(first.text, second.text);
  assert.equal(migrated.body, original.content_html);
  assert.equal(migrated.title, original.title);
  assert.equal(await readFile(COMMITTED, "utf8"), first.text);
});
