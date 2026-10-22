import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (file) => readFile(new URL(file, root), "utf8");

test("container bundles and starts the Blogger service", async () => {
  const [dockerfile, start] = await Promise.all([read("Dockerfile"), read("scripts/start-agama-container.sh")]);
  assert.match(dockerfile, /\/app\/scripts \/app\/blogger\/scripts/);
  assert.match(dockerfile, /agama-blog-posts\.snapshot\.json/);
  assert.match(start, /node .*agama-blogger-server\.mjs/);
});

test("nginx proxies the Blogger API and keeps admin files static", async () => {
  const nginx = await read("nginx.conf");
  assert.match(nginx, /location \^~ \/api\/blogger\//);
  assert.match(nginx, /proxy_pass http:\/\/agama_blogger/);
});

test("Blogger startup preserves the production Umami configuration", async () => {
  const start = await read("scripts/start-agama-container.sh");
  assert.doesNotMatch(start, /write-runtime-analytics-config/);
});

test("blog index contains the managed-post insertion marker", async () => {
  assert.match(await read("blog/index.html"), /AGAMA_BLOGGER_POSTS/);
});

test("static build includes the client admin panel", async () => {
  const build = await read("build.js");
  assert.match(build, /COPY_DIRS = \[[^\]]*'admin'/s);
});

