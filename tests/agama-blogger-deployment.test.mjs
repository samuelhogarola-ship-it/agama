import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";

const root = new URL("../", import.meta.url);
const read = (file) => readFile(new URL(file, root), "utf8");

test("container bundles and starts the Blogger service", async () => {
  const [dockerfile, start] = await Promise.all([read("Dockerfile"), read("scripts/start-agama-container.sh")]);
  assert.match(dockerfile, /\/app\/scripts \/app\/blogger\/scripts/);
  assert.match(dockerfile, /content\/blogger\/history\.json \/app\/blogger\/content\/blogger\/history\.json/);
  assert.doesNotMatch(dockerfile, /agama-blog-posts\.snapshot\.json/);
  assert.match(start, /node .*agama-blogger-server\.mjs/);
  assert.match(start, /AGAMA_CONTENT_DIR="\$\{AGAMA_CONTENT_DIR:-\/data\/agama-blogger\}"/);
  assert.match(start, /AGAMA_BLOG_SNAPSHOT="\/app\/blogger\/content\/blogger\/history\.json"/);
});

test("Blogger startup replays the persistent VPS volume before listening", async () => {
  const server = await read("scripts/agama-blogger-server.mjs");
  const replay = server.indexOf("await store.publishAll()");
  const listen = server.indexOf("server.listen(");

  assert.notEqual(replay, -1);
  assert.notEqual(listen, -1);
  assert.ok(replay < listen);
});

test("nginx proxies the Blogger API and keeps admin files static", async () => {
  const nginx = await read("nginx.conf");
  assert.match(nginx, /location \^~ \/api\/blogger\//);
  assert.match(nginx, /proxy_pass http:\/\/agama_blogger/);
});

test("Blogger subdomain serves only the editor and its API", async () => {
  const nginx = await read("nginx.conf");
  assert.match(nginx, /server_name blogger\.agama\.com\.mx;/);
  assert.match(nginx, /server\s*\{[\s\S]*?listen 80 default_server;[\s\S]*?server_name _;/);
  assert.match(nginx, /root \/usr\/share\/nginx\/html\/admin\/blogger;/);
  assert.match(nginx, /location \^~ \/api\/blogger\/ \{[\s\S]*?proxy_pass http:\/\/agama_blogger;/);
  assert.match(nginx, /add_header X-Robots-Tag "noindex, nofollow" always;/);
  assert.match(nginx, /location ~ \/\\\. \{ deny all; \}/);
  assert.match(nginx, /try_files \$uri \$uri\/ \$uri\/index\.html =404;/);
});

test("Blogger editor resolves published posts and uploads on the public origin", async () => {
  const [{ resolvePublicUrl }, app] = await Promise.all([
    import("../admin/blogger/urls.js"),
    read("admin/blogger/app.js"),
  ]);

  assert.equal(
    resolvePublicUrl("/entrada-de-blog/guia-de-pigmentos/"),
    "https://www.agama.com.mx/entrada-de-blog/guia-de-pigmentos/",
  );
  assert.equal(
    resolvePublicUrl("/assets/blogger/guia-de-pigmentos/foto.webp"),
    "https://www.agama.com.mx/assets/blogger/guia-de-pigmentos/foto.webp",
  );
  assert.match(app, /resolvePublicUrl\(post\.url\)/);
  assert.match(app, /resolvePublicUrl\(image\.url\)/);
});

test("Blogger editor exposes locale-aware history lifecycle controls", async () => {
  const [html, app] = await Promise.all([read("admin/blogger/index.html"), read("admin/blogger/app.js")]);

  assert.match(html, /<select id="locale">[\s\S]*value="es"[\s\S]*value="en"[\s\S]*<\/select>/);
  assert.match(html, /id="unpublish"/);
  assert.match(html, /id="deletePost"/);
  assert.match(app, /activeId/);
  assert.match(app, /\/unpublish/);
  assert.match(app, /method:\s*"DELETE"/);
  assert.match(app, /confirm\(/);
  assert.match(app, /post\.id/);
});

test("Blogger shell is subdomain-safe and branded", async () => {
  const [html, css] = await Promise.all([read("admin/blogger/index.html"), read("admin/blogger/styles.css")]);
  assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
  assert.match(html, /href="styles\.css"/);
  assert.match(html, /src="app\.js"/);
  assert.match(html, /autocomplete="username"/);
  assert.match(html, /autocomplete="current-password"/);
  assert.doesNotMatch(html, /(?:href|src)="\/admin\/blogger\//);
  assert.match(css, /--brand:#1745f5/);
  assert.match(css, /--brand-dark:#0f2f99/);
  assert.doesNotMatch(css, /--green:/);
});

test("subdomain verifier checks both hosts and public blog routes", async (context) => {
  const requests = [];
  const server = createServer((request, response) => {
    const key = `${request.headers.host} ${request.url}`;
    requests.push(key);
    const fixtures = new Map([
      ["blogger.agama.com.mx /", [200, "AGAMA Blogger"]],
      ["blogger.agama.com.mx /api/blogger/config", [200, '{"supabaseUrl":"https://example.supabase.co"}']],
      ["blogger.agama.com.mx /api/blogger/posts", [401, '{"error":"Inicia sesión"}']],
      ["blogger.agama.com.mx /blog/", [404, "Not found"]],
      ["blogger.agama.com.mx /ruta-que-no-existe", [404, "Not found"]],
      ["www.agama.com.mx /", [200, "AGAMA | Fabricante de pigmentos"]],
      ["www.agama.com.mx /blog/", [200, "Blog AGAMA"]],
      ["www.agama.com.mx /entrada-de-blog/001-que-significa-la-palabra-agama/", [200, "¿Qué significa la palabra AGAMA?"]],
      ["www.agama.com.mx /admin/blogger/", [200, "AGAMA Blogger"]],
    ]);
    const [status, body] = fixtures.get(key) || [500, "Unexpected request"];
    response.writeHead(status, { "Content-Type": request.url.includes("/api/") ? "application/json" : "text/html" });
    response.end(body);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const { verifyBloggerSubdomain } = await import("../scripts/verify-blogger-subdomain.mjs");
  const address = server.address();
  await verifyBloggerSubdomain({ baseUrl: `http://127.0.0.1:${address.port}` });

  assert.deepEqual(requests, [
    "blogger.agama.com.mx /",
    "blogger.agama.com.mx /api/blogger/config",
    "blogger.agama.com.mx /api/blogger/posts",
    "blogger.agama.com.mx /blog/",
    "blogger.agama.com.mx /ruta-que-no-existe",
    "www.agama.com.mx /",
    "www.agama.com.mx /blog/",
    "www.agama.com.mx /entrada-de-blog/001-que-significa-la-palabra-agama/",
    "www.agama.com.mx /admin/blogger/",
  ]);
});

test("subdomain verifier aborts a response that keeps streaming past the deadline", async (context) => {
  const server = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/plain" });
    const interval = setInterval(() => response.write("still-open\n"), 10);
    const finish = setTimeout(() => {
      clearInterval(interval);
      response.end("done");
    }, 250);
    response.on("close", () => {
      clearInterval(interval);
      clearTimeout(finish);
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const { requestWithHost } = await import("../scripts/verify-blogger-subdomain.mjs");
  const address = server.address();
  const url = new URL(`http://127.0.0.1:${address.port}/slow-stream`);

  await assert.rejects(
    requestWithHost({ url, host: "blogger.agama.com.mx", timeoutMs: 40 }),
    /timeout|aborted|tiempo de espera/i,
  );
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

