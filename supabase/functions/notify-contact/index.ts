import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const NOTIFY_TO = "ventas@agama.com.mx";
const NOTIFY_FROM = "AGAMA Web <onboarding@resend.dev>";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function esc(value: unknown): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeMailto(email: unknown): string {
  const s = esc(email);
  // Only allow basic email characters to prevent header injection
  return /^[a-zA-Z0-9._%+\-@]+$/.test(String(email ?? "")) ? s : "";
}

function safeEmailAddress(email: unknown): string | undefined {
  const value = String(email ?? "").trim();
  return /^[a-zA-Z0-9._%+\-@]+$/.test(value) ? value : undefined;
}

const row = (label: string, value: unknown, href?: string) => {
  const safe = esc(value);
  if (!safe) return "";
  const cell = href
    ? `<a href="${esc(href)}" style="color:#0055b3">${safe}</a>`
    : safe;
  return `<tr>
    <td style="padding:8px;color:#555;width:140px;vertical-align:top"><strong>${esc(label)}</strong></td>
    <td style="padding:8px;color:#222">${cell}</td>
  </tr>`;
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const payload = await req.json();
  const record = payload?.record;
  if (!record) {
    return new Response("No record", { status: 400, headers: CORS_HEADERS });
  }

  const table = payload?.table ?? "";
  const isJobApp = table === "job_applications" || record.vacancy != null;
  const isNewsletterSignup = table === "newsletter_signups" || (record.email != null && record.name == null && record.message == null);

  const replyEmail = safeMailto(record.email);
  const subscriberEmail = safeEmailAddress(record.email);

  let subjectLine: string;
  let heading: string;
  let bodyRows: string;
  let recipient: string = NOTIFY_TO;
  let replyTo: string | undefined = replyEmail || undefined;

  if (isJobApp) {
    subjectLine = `[AGAMA Vacante] ${esc(record.vacancy ?? "Solicitud")} — ${esc(record.name)}`;
    heading = "Nueva solicitud de empleo";
    const socialLink = /^https?:\/\//.test(String(record.social_links ?? ""))
      ? esc(record.social_links)
      : undefined;
    bodyRows = [
      row("Vacante",       record.vacancy),
      row("Nombre",        record.name),
      row("Email",         record.email, replyEmail ? `mailto:${replyEmail}` : undefined),
      row("Cel",           record.phone_mobile),
      row("Tel fijo",      record.phone_fixed),
      row("Ciudad",        record.city_state),
      row("C.P.",          record.postal_code),
      row("LinkedIn / CV", record.social_links, socialLink),
      row("Mensaje",       String(record.message ?? "").replace(/\n/g, "<br>")),
      row("Fuente",        `${esc(record.source)} · ${esc(record.page_path)} · ${esc(record.created_at)}`),
    ].join("");
  } else if (isNewsletterSignup) {
    if (!subscriberEmail) {
      return new Response("Invalid newsletter email", { status: 400, headers: CORS_HEADERS });
    }

    subjectLine = "Confirmamos tu suscripción al blog de AGAMA";
    heading = "Suscripción confirmada";
    recipient = subscriberEmail;
    replyTo = NOTIFY_TO;
    bodyRows = [
      row("Correo registrado", record.email, `mailto:${subscriberEmail}`),
      row("Canal", "Blog AGAMA"),
      row("Origen", record.source),
      row("Fecha de alta", record.created_at),
    ].join("");
  } else {
    subjectLine = `[AGAMA Web] ${esc(record.subject ?? "Nuevo contacto")} — ${esc(record.name)}`;
    heading = "Nuevo mensaje de contacto";
    bodyRows = [
      row("Nombre",   record.name),
      row("Empresa",  record.company),
      row("Email",    record.email, replyEmail ? `mailto:${replyEmail}` : undefined),
      row("Teléfono", record.phone),
      row("Asunto",   record.subject),
      row("Mensaje",  String(record.message ?? "").replace(/\n/g, "<br>")),
      row("Fuente",   `${esc(record.source)} · ${esc(record.page_path)} · ${esc(record.created_at)}`),
    ].join("");
  }

  const replyHref = isNewsletterSignup
    ? `mailto:${esc(NOTIFY_TO)}?subject=${encodeURIComponent("Consulta sobre mi suscripción al blog de AGAMA")}`
    : replyEmail
      ? `mailto:${replyEmail}?subject=Re%3A%20${encodeURIComponent(String(record.vacancy ?? record.subject ?? "Tu consulta en AGAMA"))}`
      : "";

  const html = isNewsletterSignup ? `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#002f6c;padding:24px;border-radius:8px 8px 0 0;">
        <img src="https://www.agama.com.mx/assets/img/agama.svg" alt="AGAMA" style="height:32px;filter:brightness(0)invert(1)"/>
      </div>
      <div style="background:#f7f8fa;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">
        <h2 style="color:#002f6c;margin:0 0 16px">${esc(heading)}</h2>
        <p style="color:#222;line-height:1.6;margin:0 0 16px;">
          Tu correo quedó registrado correctamente para recibir nuevas publicaciones y actualizaciones del blog de AGAMA.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">${bodyRows}</table>
        <p style="color:#555;line-height:1.6;margin:20px 0 0;">
          Cuando publiquemos nuevas entradas del blog, utilizaremos este correo para avisarte.
        </p>
        ${replyHref ? `
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
          <a href="${replyHref}"
             style="background:#0055b3;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
            Contactar con AGAMA
          </a>
        </div>` : ""}
      </div>
      <p style="color:#aaa;font-size:11px;text-align:center;margin-top:12px">
        AGAMA Pigmentos &amp; Masterbatch · agama.com.mx
      </p>
    </div>
  ` : `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#002f6c;padding:24px;border-radius:8px 8px 0 0;">
        <img src="https://www.agama.com.mx/assets/img/agama.svg" alt="AGAMA" style="height:32px;filter:brightness(0)invert(1)"/>
      </div>
      <div style="background:#f7f8fa;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">
        <h2 style="color:#002f6c;margin:0 0 16px">${esc(heading)}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">${bodyRows}</table>
        ${replyHref ? `
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
          <a href="${replyHref}"
             style="background:#0055b3;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
            Responder a ${esc(record.name)}
          </a>
        </div>` : ""}
      </div>
      <p style="color:#aaa;font-size:11px;text-align:center;margin-top:12px">
        AGAMA Pigmentos &amp; Masterbatch · agama.com.mx
      </p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: NOTIFY_FROM,
      to: [recipient],
      reply_to: replyTo,
      subject: subjectLine,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
    return new Response(`Resend error: ${err}`, { status: 500, headers: CORS_HEADERS });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
