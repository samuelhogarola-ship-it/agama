#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/publish-blog-post.mjs --slug "mi-post" --title "Mi Post" --url "https://www.agama.com.mx/blog/mi-post"
 *
 * Env vars required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_FUNCTION_URL  (e.g. https://ozexoekvshuhtkrleuze.supabase.co/functions/v1/notify-blog-post)
 */

import { parseArgs } from "node:util";

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    slug:  { type: "string" },
    title: { type: "string" },
    url:   { type: "string" },
    bootstrap: { type: "boolean", default: false },
  },
});

const SUPABASE_URL      = process.env.SUPABASE_URL      ?? "https://ozexoekvshuhtkrleuze.supabase.co";
const SERVICE_KEY       = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FUNCTION_URL      = process.env.SUPABASE_FUNCTION_URL
  ?? "https://ozexoekvshuhtkrleuze.supabase.co/functions/v1/notify-blog-post";

if (!SERVICE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "apikey": SERVICE_KEY,
};

// Bootstrap mode: register existing posts without sending notifications
if (values.bootstrap) {
  console.log("Bootstrap mode — marking existing posts as already notified...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts`, {
    method: "PATCH",
    headers: { ...headers, "Prefer": "return=representation" },
    body: JSON.stringify({ notified_at: new Date().toISOString() }),
  });
  const data = await res.json();
  console.log("Done:", data);
  process.exit(0);
}

if (!values.slug || !values.title || !values.url) {
  console.error("Required: --slug, --title, --url");
  process.exit(1);
}

// Insert post
const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts`, {
  method: "POST",
  headers: { ...headers, "Prefer": "return=representation" },
  body: JSON.stringify({ slug: values.slug, title: values.title, url: values.url }),
});

if (!insertRes.ok) {
  console.error("Insert failed:", await insertRes.text());
  process.exit(1);
}

const [post] = await insertRes.json();
console.log("Post registrado:", post.id, post.title);

// Trigger notification
const notifRes = await fetch(FUNCTION_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_KEY}` },
  body: JSON.stringify({ post_id: post.id }),
});

const result = await notifRes.json();
console.log("Notificación:", result);
