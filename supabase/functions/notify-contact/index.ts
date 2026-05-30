import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const NOTIFY_TO = "ceo@agamaeu.com";
const NOTIFY_FROM = "AGAMA Web <onboarding@resend.dev>";

const row = (label: string, value: string | null | undefined, link?: string) =>
  value
    ? `<tr>
        <td style="padding:8px;color:#555;width:140px;vertical-align:top"><strong>${label}</strong></td>
        <td style="padding:8px;color:#222">${link ? `<a href="${link}" style="color:#0055b3">${value}</a>` : value}</td>
       </tr>`
    : "";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.json();
  const record = payload?.record;
  if (!record) return new Response("No record", { status: 400 });

  const table = payload?.table ?? "";
  const isJobApp = table === "job_applications" || record.vacancy != null;

  let subjectLine: string;
  let heading: string;
  let bodyRows: string;
  const replyEmail: string = record.email ?? "";

  if (isJobApp) {
    subjectLine = `[AGAMA Vacante] ${record.vacancy ?? "Solicitud"} — ${record.name}`;
    heading = "Nueva solicitud de empleo";
    bodyRows = [
      row("Vacante",   record.vacancy),
      row("Nombre",    record.name),
      row("Email",     record.email, `mailto:${record.email}`),
      row("Cel",       record.phone_mobile),
      row("Tel fijo",  record.phone_fixed),
      row("Ciudad",    record.city_state),
      row("C.P.",      record.postal_code),
      row("LinkedIn / CV", record.social_links, record.social_links ?? undefined),
      row("Mensaje",   record.message ? record.message.replace(/\n/g, "<br>") : null),
      row("Fuente",    `${record.source ?? ""} · ${record.page_path ?? ""} · ${record.created_at ?? ""}`),
    ].join("");
  } else {
    subjectLine = `[AGAMA Web] ${record.subject ?? "Nuevo contacto"} — ${record.name}`;
    heading = "Nuevo mensaje de contacto";
    bodyRows = [
      row("Nombre",   record.name),
      row("Empresa",  record.company),
      row("Email",    record.email, `mailto:${record.email}`),
      row("Teléfono", record.phone),
      row("Asunto",   record.subject),
      row("Mensaje",  record.message ? record.message.replace(/\n/g, "<br>") : null),
      row("Fuente",   `${record.source ?? ""} · ${record.page_path ?? ""} · ${record.created_at ?? ""}`),
    ].join("");
  }

  const replyLabel = isJobApp ? `${record.vacancy} — ${record.name}` : (record.subject || "Tu consulta en AGAMA");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#002f6c;padding:24px;border-radius:8px 8px 0 0;">
        <img src="https://www.agama.com.mx/assets/img/agama.svg" alt="AGAMA" style="height:32px;filter:brightness(0)invert(1)"/>
      </div>
      <div style="background:#f7f8fa;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">
        <h2 style="color:#002f6c;margin:0 0 16px">${heading}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">${bodyRows}</table>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
          <a href="mailto:${replyEmail}?subject=Re: ${encodeURIComponent(replyLabel)}"
             style="background:#0055b3;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
            Responder a ${record.name}
          </a>
        </div>
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
      to: [NOTIFY_TO],
      reply_to: replyEmail || undefined,
      subject: subjectLine,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
    return new Response(`Resend error: ${err}`, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
