import fs from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const envPath = path.join(repoRoot, ".env");
const snapshotPath = new URL("../wordpress/import/agama-blog-posts.snapshot.json", import.meta.url);

if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  });
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes("--dry-run");

function excerptFromHtml(html, maxLength = 220) {
  const plainText = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length <= maxLength) return plainText;
  return `${plainText.slice(0, maxLength - 3).trim()}...`;
}

function normalizeBlogPost(post) {
  return {
    title: post.title,
    slug: post.slug,
    url: `/entrada-de-blog/${post.slug}/`,
    date: post.date ?? null,
    category: post.category ?? "Noticias",
    source_url: post.source_url ?? null,
    excerpt: excerptFromHtml(post.content_html),
  };
}

async function supabaseFetch(pathname, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("apikey", SUPABASE_SERVICE_ROLE_KEY);
  headers.set("Authorization", `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${SUPABASE_URL}${pathname}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase ${response.status}: ${text}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function buildBootstrapRows(posts) {
  const now = new Date().toISOString();
  return posts.map((post) => ({
    post_slug: post.slug,
    post_title: post.title,
    post_url: `https://www.agama.com.mx/entrada-de-blog/${post.slug}/`,
    post_date: post.date ?? null,
    post_category: post.category ?? "Noticias",
    source_url: post.source_url ?? null,
    first_seen_at: now,
    notified_at: now,
    notification_status: "bootstrapped",
    subscriber_count: 0,
    delivery_count: 0,
    last_error: null,
  }));
}

async function bootstrapExistingPosts(posts) {
  const rows = buildBootstrapRows(posts);

  if (dryRun) {
    console.log(`DRY RUN: bootstrap would mark ${rows.length} existing posts as already notified.`);
    return;
  }

  await supabaseFetch("/rest/v1/blog_post_notifications", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  console.log(`Bootstrapped ${rows.length} existing posts without sending emails.`);
}

async function notifyPost(post) {
  if (dryRun) {
    console.log(`DRY RUN: would notify subscribers about ${post.slug}`);
    return;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/notify-blog-post`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post: normalizeBlogPost(post),
    }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok && response.status !== 207) {
    throw new Error(`Notify ${post.slug} failed: ${response.status} ${JSON.stringify(result)}`);
  }

  console.log(
    `Post ${post.slug}: subscribers=${result?.subscribers ?? 0}, delivered=${result?.delivered ?? 0}, failed=${result?.failed ?? 0}`
  );
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para notificar nuevos posts.");
  }

  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
  if (!Array.isArray(snapshot) || snapshot.length === 0) {
    throw new Error("Blog snapshot vacío o inválido.");
  }

  const existingRows = await supabaseFetch(
    "/rest/v1/blog_post_notifications?select=post_slug,notification_status"
  );
  const existingNotifications = Array.isArray(existingRows) ? existingRows : [];

  if (existingNotifications.length === 0) {
    await bootstrapExistingPosts(snapshot);
    return;
  }

  const notificationBySlug = new Map(
    existingNotifications.map((row) => [row.post_slug, row.notification_status])
  );
  const newPosts = snapshot.filter((post) => {
    const status = notificationBySlug.get(post.slug);
    return !status || status === "pending" || status === "failed";
  });

  if (newPosts.length === 0) {
    console.log("No hay posts nuevos pendientes de notificación.");
    return;
  }

  console.log(`Detected ${newPosts.length} new blog post(s) to notify.`);

  for (const post of newPosts) {
    await notifyPost(post);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
