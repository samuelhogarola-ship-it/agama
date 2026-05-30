import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const NOTIFY_TO = "ceo@agamaeu.com";
const NOTIFY_FROM = "AGAMA Web <onboarding@resend.dev>";

serve(async (req) => {
  // Solo acepta POST desde Supabase webhook
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.json();

  // Supabase database webhook manda { type, table, record, old_record }
  const record = payload?.record;
  if (!record) {
    return new Response("No record", { status: 400 });
  }

  const { name, email, company, phone, subject, message, source, page_path, created_at } = record;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#002f6c;padding:24px;border-radius:8px 8px 0 0;">
        <img src="https://www.agama.com.mx/assets/img/agama.svg" alt="AGAMA" style="height:32px;filter:brightness(0)invert(1)"/>
      </div>
      <div style="background:#f7f8fa;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">
        <h2 style="color:#002f6c;margin:0 0 16px">Nuevo mensaje de contacto</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px;color:#555;width:140px"><strong>Nombre</strong></td><td style="padding:8px;color:#222">${name}</td></tr>
          ${company ? `<tr><td style="padding:8px;color:#555"><strong>Empresa</strong></td><td style="padding:8px;color:#222">${company}</td></tr>` : ""}
          <tr><td style="padding:8px;color:#555"><strong>Email</strong></td><td style="padding:8px"><a href="mailto:${email}" style="color:#0055b3">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding:8px;color:#555"><strong>Teléfono</strong></td><td style="padding:8px;color:#222">${phone}</td></tr>` : ""}
          ${subject ? `<tr><td style="padding:8px;color:#555"><strong>Asunto</strong></td><td style="padding:8px;color:#222">${subject}</td></tr>` : ""}
          <tr><td style="padding:8px;color:#555;vertical-align:top"><strong>Mensaje</strong></td><td style="padding:8px;color:#222;white-space:pre-wrap">${message}</td></tr>
          <tr><td style="padding:8px;color:#555"><strong>Fuente</strong></td><td style="padding:8px;color:#888;font-size:12px">${source} · ${page_path} · ${created_at}</td></tr>
        </table>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
          <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject || 'Tu consulta en AGAMA')}"
             style="background:#0055b3;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
            Responder a ${name}
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
      reply_to: email,
      subject: `[AGAMA Web] ${subject || "Nuevo contacto"} — ${name}`,
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
