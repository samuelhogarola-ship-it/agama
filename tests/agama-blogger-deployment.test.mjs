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
  assert.match(dockerfile, /agama-blog-posts\.snapshot\.json/);
  assert.match(start, /node .*agama-blogger-server\.mjs/);
});

test("nginx proxies the Blogger API and keeps admin files static", async () => {
  const nginx = await read("nginx.conf");
  assert.match(nginx, /location \^~ \/api\/blogger\//);
  assert.match(nginx, /proxy_pass http:\/\/agama_blogger/);
});

test("Blogger subdomain serves only the editor and its API", async () => {
  const nginx = await read("nginx.conf");
  assert.match(nginx, /server_name blogger\.agama\.com\.mx;/);
  assert.match(nginx, /root \/usr\/share\/nginx\/html\/admin\/blogger;/);
  assert.match(nginx, /location \^~ \/api\/blogger\/ \{[\s\S]*?proxy_pass http:\/\/agama_blogger;/);
  assert.match(nginx, /add_header X-Robots-Tag "noindex, nofollow" always;/);
  assert.match(nginx, /location ~ \/\\\. \{ deny all; \}/);
  assert.match(nginx, /try_files \$uri \$uri\/ \$uri\/index\.html =404;/);
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

