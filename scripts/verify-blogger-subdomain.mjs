import http from "node:http";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BLOGGER_HOST = "blogger.agama.com.mx";
const PUBLIC_HOST = "www.agama.com.mx";

const CHECKS = [
  { host: BLOGGER_HOST, path: "/", status: 200, includes: "AGAMA Blogger" },
  { host: BLOGGER_HOST, path: "/api/blogger/config", status: 200, includes: '"supabaseUrl"' },
  { host: BLOGGER_HOST, path: "/api/blogger/posts", status: 401, includes: '"error"' },
  { host: BLOGGER_HOST, path: "/blog/", status: 404 },
  { host: BLOGGER_HOST, path: "/ruta-que-no-existe", status: 404 },
  { host: PUBLIC_HOST, path: "/", status: 200, includes: "AGAMA", excludes: "AGAMA Blogger" },
  { host: PUBLIC_HOST, path: "/blog/", status: 200, includes: "Blog" },
  { host: PUBLIC_HOST, path: "/entrada-de-blog/001-que-significa-la-palabra-agama/", status: 200, includes: "AGAMA" },
  { host: PUBLIC_HOST, path: "/admin/blogger/", status: 200, includes: "AGAMA Blogger" },
];

export async function verifyBloggerSubdomain({
  baseUrl = process.env.BLOGGER_VERIFY_BASE_URL || "http://127.0.0.1",
  requestImpl = requestWithHost,
  logger = null,
} = {}) {
  const base = new URL(baseUrl);
  const results = [];

  for (const check of CHECKS) {
    const url = new URL(check.path, base);
    const response = await requestImpl({ url, host: check.host, timeoutMs: 10_000 });
    const body = response.body;

    if (response.status !== check.status) {
      throw new Error(`${check.host}${check.path}: esperaba ${check.status}, recibió ${response.status}.`);
    }
    if (check.includes && !body.includes(check.includes)) {
      throw new Error(`${check.host}${check.path}: falta el marcador esperado ${JSON.stringify(check.includes)}.`);
    }
    if (check.excludes && body.includes(check.excludes)) {
      throw new Error(`${check.host}${check.path}: contiene el marcador prohibido ${JSON.stringify(check.excludes)}.`);
    }

    const result = `${check.host}${check.path} → ${response.status}`;
    results.push(result);
    logger?.log(`✓ ${result}`);
  }

  return results;
}

export function requestWithHost({ url, host, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request(url, {
      headers: { Host: host },
      method: "GET",
      servername: url.hostname,
      timeout: timeoutMs,
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({
        body: Buffer.concat(chunks).toString("utf8"),
        status: response.statusCode || 0,
      }));
    });
    request.on("error", reject);
    request.on("timeout", () => request.destroy(new Error(`${host}${url.pathname}: tiempo de espera agotado.`)));
    request.end();
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  verifyBloggerSubdomain({ logger: console }).catch((error) => {
    console.error(`✗ ${error.message}`);
    process.exitCode = 1;
  });
}
