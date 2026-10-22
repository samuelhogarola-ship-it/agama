import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createBloggerStore } from "./agama-blogger-core.mjs";

export function createBloggerServer({ store, supabaseUrl, supabaseAnonKey, adminEmails, fetchImpl = fetch }) {
  return http.createServer(createBloggerHandler({ store, supabaseUrl, supabaseAnonKey, adminEmails, fetchImpl }));
}

export function createBloggerHandler({ store, supabaseUrl, supabaseAnonKey, adminEmails, fetchImpl = fetch }) {
  const allowlist = new Set((adminEmails || []).map((email) => String(email).trim().toLowerCase()).filter(Boolean));

  return async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      res.setHeader("Cache-Control", "no-store");

      if (url.pathname === "/health" && req.method === "GET") return json(res, 200, { ok: true, service: "agama-blogger" });
      if (url.pathname === "/api/blogger/config" && req.method === "GET") {
        return json(res, 200, { supabaseUrl, supabaseAnonKey });
      }
      if (!url.pathname.startsWith("/api/blogger/")) return json(res, 404, { error: "Ruta no encontrada." });

      const authError = await authorize(req, { supabaseUrl, supabaseAnonKey, allowlist, fetchImpl });
      if (authError) return json(res, authError.status, { error: authError.message });

      if (url.pathname === "/api/blogger/posts" && req.method === "GET") {
        return json(res, 200, { posts: await store.listPosts() });
      }
      if (url.pathname === "/api/blogger/posts" && req.method === "POST") {
        return json(res, 201, await store.savePost(null, await readJson(req)));
      }

      const postMatch = url.pathname.match(/^\/api\/blogger\/posts\/([a-z0-9-]+)$/);
      if (postMatch && req.method === "GET") return json(res, 200, await store.readPost(postMatch[1]));
      if (postMatch && req.method === "PUT") return json(res, 200, await store.savePost(postMatch[1], await readJson(req)));

      const imageMatch = url.pathname.match(/^\/api\/blogger\/posts\/([a-z0-9-]+)\/images$/);
      if (imageMatch && req.method === "POST") {
        const payload = await readJson(req, 24 * 1024 * 1024);
        return json(res, 201, await store.savePostImage(imageMatch[1], payload.fileName, payload.data));
      }

      const publishMatch = url.pathname.match(/^\/api\/blogger\/posts\/([a-z0-9-]+)\/publish$/);
      if (publishMatch && req.method === "POST") return json(res, 200, await store.publishPost(publishMatch[1]));

      return json(res, 404, { error: "Ruta no encontrada." });
    } catch (error) {
      return json(res, error.status || 500, { error: error.status ? error.message : "Error inesperado." });
    }
  };
}

async function authorize(req, { supabaseUrl, supabaseAnonKey, allowlist, fetchImpl }) {
  const token = String(req.headers.authorization || "").match(/^Bearer\s+([^\s]+)$/i)?.[1];
  if (!token) return { status: 401, message: "Inicia sesión como administrador." };
  if (!supabaseUrl || !supabaseAnonKey) return { status: 503, message: "La autenticación del Blogger no está configurada." };
  try {
    const response = await fetchImpl(`${String(supabaseUrl).replace(/\/$/, "")}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
    if (response.status === 401 || response.status === 403) return { status: 401, message: "Sesión inválida o caducada." };
    if (!response.ok) return { status: 503, message: "No se pudo verificar la sesión." };
    const user = await response.json();
    const email = String(user.email || "").toLowerCase();
    if (!user.id || !allowlist.has(email)) return { status: 403, message: "Acceso reservado al administrador." };
    return null;
  } catch {
    return { status: 503, message: "No se pudo verificar la sesión." };
  }
}

async function readJson(req, maxBytes = 2 * 1024 * 1024) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > maxBytes) throw Object.assign(new Error("La petición es demasiado grande."), { status: 413 });
    chunks.push(chunk);
  }
  try { return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}; }
  catch { throw Object.assign(new Error("JSON inválido."), { status: 400 }); }
}

function json(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function startFromEnvironment() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const appRoot = path.resolve(here, "..");
  const store = createBloggerStore({
    contentDir: process.env.AGAMA_CONTENT_DIR || "/data/agama-blogger",
    publicDir: process.env.AGAMA_PUBLIC_DIR || "/usr/share/nginx/html",
    snapshotPath: process.env.AGAMA_BLOG_SNAPSHOT || path.join(appRoot, "wordpress/import/agama-blog-posts.snapshot.json"),
  });
  await store.publishAll();
  const server = createBloggerServer({
    store,
    supabaseUrl: process.env.SUPABASE_URL || "https://ozexoekvshuhtkrleuze.supabase.co",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    adminEmails: String(process.env.AGAMA_ADMIN_EMAILS || "info@webfuengirola.com").split(","),
  });
  const host = process.env.BLOGGER_HOST || "127.0.0.1";
  const port = Number(process.env.BLOGGER_PORT || 3010);
  server.listen(port, host, () => console.log(`AGAMA Blogger listo en http://${host}:${port}`));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startFromEnvironment().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

