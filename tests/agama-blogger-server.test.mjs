import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";

import { createBloggerHandler } from "../scripts/agama-blogger-server.mjs";

async function withServer({ authEmail = "admin@example.com", allowed = ["admin@example.com"] } = {}, run) {
  const calls = [];
  const store = {
    async listPosts() { return [{ slug: "uno", title: "Uno" }]; },
    async readPost(slug) { return { slug, meta: { title: "Uno" }, body: "<p>Texto</p>" }; },
    async savePost(slug, payload) { calls.push(["save", slug, payload]); return { slug: payload.slug || "nuevo" }; },
    async savePostImage(slug, fileName) { calls.push(["image", slug, fileName]); return { file: fileName }; },
    async publishPost(slug) { calls.push(["publish", slug]); return { slug }; },
    async publishAll() {},
  };
  const handler = createBloggerHandler({
    store,
    supabaseUrl: "https://supabase.example.test",
    supabaseAnonKey: "anon",
    adminEmails: allowed,
    fetchImpl: async () => new Response(JSON.stringify({ id: "user-1", email: authEmail }), { status: 200 }),
  });
  await run({ request: (url, options = {}) => dispatch(handler, url, options), calls });
}

async function dispatch(handler, url, { method = "GET", headers = {}, body = "" } = {}) {
  const req = Readable.from(body ? [body] : []);
  req.url = url;
  req.method = method;
  req.headers = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
  let status = 200;
  let responseBody = "";
  const responseHeaders = {};
  const res = {
    setHeader(name, value) { responseHeaders[name.toLowerCase()] = value; },
    writeHead(nextStatus, nextHeaders = {}) { status = nextStatus; Object.assign(responseHeaders, nextHeaders); },
    end(chunk = "") { responseBody += chunk; },
  };
  await handler(req, res);
  return { status, async json() { return JSON.parse(responseBody); } };
}

test("rejects Blogger API calls without a bearer token", async () => {
  await withServer({}, async ({ request }) => {
    const response = await request("/api/blogger/posts");
    assert.equal(response.status, 401);
  });
});

test("rejects authenticated users outside the admin allowlist", async () => {
  await withServer({ authEmail: "other@example.com" }, async ({ request }) => {
    const response = await request("/api/blogger/posts", { headers: { Authorization: "Bearer token" } });
    assert.equal(response.status, 403);
  });
});

test("lists posts and publishes through authenticated routes", async () => {
  await withServer({}, async ({ request, calls }) => {
    const headers = { Authorization: "Bearer token", "Content-Type": "application/json" };
    const list = await request("/api/blogger/posts", { headers });
    assert.equal(list.status, 200);
    assert.deepEqual((await list.json()).posts, [{ slug: "uno", title: "Uno" }]);

    const publish = await request("/api/blogger/posts/uno/publish", { method: "POST", headers, body: "{}" });
    assert.equal(publish.status, 200);
    assert.deepEqual(calls, [["publish", "uno"]]);
  });
});

