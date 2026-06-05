import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NOTIFY_FROM = "AGAMA Blog <onboarding@resend.dev>";
const CONTACT_EMAIL = "ceo@agamaeu.com";
const BLOG_SOURCE_PREFIX = "agama-blog";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type BlogPostPayload = {
  title: string;
  slug: string;
  url: string;
  date?: string;
  category?: string;
  source_url?: string;
  excerpt?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

function esc(value: unknown): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(email: unknown): email is string {
  return /^[a-zA-Z0-9._%+\-@]+$/.test(String(email ?? "").trim());
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://www.agama.com.mx${url.startsWith("/") ? "" : "/"}${url}`;
}

function excerptFromHtml(html: string, maxLength = 220): string {
  const plainText = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length <= maxLength) return plainText;
  return `${plainText.slice(0, maxLength - 3).trim()}...`;
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("apikey", SUPABASE_SERVICE_ROLE_KEY);
  headers.set("Authorization", `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${SUPABASE_URL}${path}`, {
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

function buildEmailHtml(post: BlogPostPayload) {
  const safeUrl = esc(normalizeUrl(post.url));
  const safeTitle = esc(post.title);
  const safeCategory = esc(post.category || "Blog AGAMA");
  const safeDate = esc(post.date || "");
  const safeExcerpt = esc(post.excerpt || "");

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#002f6c;padding:24px;border-radius:8px 8px 0 0;">
        <img src="https://www.agama.com.mx/assets/img/agama.svg" alt="AGAMA" style="height:32px;filter:brightness(0)invert(1)"/>
      </div>
      <div style="background:#f7f8fa;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">
        <div style="display:inline-block;background:#1745F5;color:#fff;font-size:12px;font-weight:700;border-radius:999px;padding:6px 12px;margin-bottom:16px;">
          Nueva publicación del blog
        </div>
        <h2 style="color:#002f6c;margin:0 0 12px;line-height:1.2;">${safeTitle}</h2>
        <p style="color:#666;font-size:14px;margin:0 0 16px;">${safeCategory}${safeDate ? ` · ${safeDate}` : ""}</p>
        ${safeExcerpt ? `<p style="color:#222;line-height:1.7;margin:0 0 20px;">${safeExcerpt}</p>` : ""}
        <a href="${safeUrl}"
           style="background:#0055b3;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
          Visitar el blog
        </a>
        <p style="color:#555;line-height:1.6;margin:24px 0 0;">
          Recibes este aviso porque te suscribiste para conocer nuevas publicaciones del blog de AGAMA.
        </p>
      </div>
      <p style="color:#aaa;font-size:11px;text-align:center;margin-top:12px">
        AGAMA Pigmentos &amp; Masterbatch · agama.com.mx
      </p>
    </div>
  `;
}

async function upsertNotification(post: BlogPostPayload, patch: Record<string, unknown>) {
  await supabaseFetch("/rest/v1/blog_post_notifications", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([
      {
        post_slug: post.slug,
        post_title: post.title,
        post_url: normalizeUrl(post.url),
        post_date: post.date ?? null,
        post_category: post.category ?? null,
        source_url: post.source_url ?? null,
        ...patch,
      },
    ]),
  });
}

async function upsertRecipient(postSlug: string, email: string, status: "sent" | "failed", errorText?: string) {
  await supabaseFetch("/rest/v1/blog_post_notification_recipients", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([
      {
        post_slug: postSlug,
        email,
        delivery_status: status,
        sent_at: status === "sent" ? new Date().toISOString() : null,
        error_text: errorText ?? null,
      },
    ]),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!bearerToken || bearerToken !== SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const payload = await req.json().catch(() => null);
  const post = payload?.post as BlogPostPayload | undefined;

  if (!post?.slug || !post?.title || !post?.url) {
    return jsonResponse({ error: "Invalid post payload" }, 400);
  }

  post.excerpt = excerptFromHtml(post.excerpt || "");

  const existingNotification = await supabaseFetch(
    `/rest/v1/blog_post_notifications?post_slug=eq.${encodeURIComponent(post.slug)}&select=post_slug,notification_status,notified_at`
  ) as Array<{ post_slug: string; notification_status: string; notified_at: string | null }>;

  if (existingNotification?.[0]?.notification_status === "sent" && existingNotification[0]?.notified_at) {
    return jsonResponse({ ok: true, status: "already_notified", post_slug: post.slug });
  }

  await upsertNotification(post, {
    notification_status: "pending",
  });

  const newsletterRows = await supabaseFetch(
    "/rest/v1/newsletter_signups?select=email,source"
  ) as Array<{ email: string; source: string }>;

  const recipients = [...new Set(
    (newsletterRows || [])
      .filter((row) => isValidEmail(row.email))
      .filter((row) => String(row.source || "").startsWith(BLOG_SOURCE_PREFIX))
      .map((row) => row.email.trim().toLowerCase())
  )];

  if (recipients.length === 0) {
    await upsertNotification(post, {
      notification_status: "sent",
      notified_at: new Date().toISOString(),
      subscriber_count: 0,
      delivery_count: 0,
      last_error: null,
    });

    return jsonResponse({ ok: true, post_slug: post.slug, subscribers: 0, delivered: 0 });
  }

  const existingRecipientRows = await supabaseFetch(
    `/rest/v1/blog_post_notification_recipients?post_slug=eq.${encodeURIComponent(post.slug)}&select=email,delivery_status`
  ) as Array<{ email: string; delivery_status: string }>;

  const sentEmails = new Set(
    (existingRecipientRows || [])
      .filter((row) => row.delivery_status === "sent")
      .map((row) => row.email.trim().toLowerCase())
  );

  const pendingRecipients = recipients.filter((email) => !sentEmails.has(email));
  const emailHtml = buildEmailHtml(post);
  const deliveryErrors: string[] = [];

  for (const email of pendingRecipients) {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: NOTIFY_FROM,
        to: [email],
        reply_to: CONTACT_EMAIL,
        subject: `Nueva publicación en el blog de AGAMA: ${post.title}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      deliveryErrors.push(`${email}: ${errorText}`);
      await upsertRecipient(post.slug, email, "failed", errorText.slice(0, 500));
      continue;
    }

    await upsertRecipient(post.slug, email, "sent");
  }

  const finalRecipientRows = await supabaseFetch(
    `/rest/v1/blog_post_notification_recipients?post_slug=eq.${encodeURIComponent(post.slug)}&select=delivery_status`
  ) as Array<{ delivery_status: string }>;

  const deliveryCount = (finalRecipientRows || []).filter((row) => row.delivery_status === "sent").length;
  const failedCount = (finalRecipientRows || []).filter((row) => row.delivery_status === "failed").length;

  await upsertNotification(post, {
    notification_status: failedCount > 0 ? "failed" : "sent",
    notified_at: deliveryCount > 0 || recipients.length === 0 ? new Date().toISOString() : null,
    subscriber_count: recipients.length,
    delivery_count: deliveryCount,
    last_error: deliveryErrors.length > 0 ? deliveryErrors.slice(0, 3).join(" | ") : null,
  });

  return jsonResponse({
    ok: failedCount === 0,
    post_slug: post.slug,
    subscribers: recipients.length,
    delivered: deliveryCount,
    failed: failedCount,
  }, failedCount > 0 ? 207 : 200);
});
