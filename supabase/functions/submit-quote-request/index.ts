import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const AGAMA_WHATSAPP_NUMBER = Deno.env.get("AGAMA_WHATSAPP_NUMBER") ?? "525573515156";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type QuoteItem = {
  nombre?: string;
  product?: string;
  slug?: string;
  cantidad_kg?: number;
  quantity_kg?: number;
  quantity?: number;
  subtotal_mxn?: number;
  subtotal_mxn_formateado?: string;
  precio_unitario_mxn?: number;
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

function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function getItemName(item: QuoteItem): string {
  return String(item.nombre ?? item.product ?? item.slug ?? "").trim();
}

function getItemQuantity(item: QuoteItem): number {
  const quantity = Number(item.cantidad_kg ?? item.quantity_kg ?? item.quantity ?? 0);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
}

function getItemSubtotal(item: QuoteItem): number {
  const explicitSubtotal = Number(item.subtotal_mxn);
  if (Number.isFinite(explicitSubtotal) && explicitSubtotal > 0) return explicitSubtotal;

  const unitPrice = Number(item.precio_unitario_mxn);
  const quantity = getItemQuantity(item);

  if (Number.isFinite(unitPrice) && unitPrice > 0 && quantity > 0) {
    return Number((unitPrice * quantity).toFixed(2));
  }

  return 0;
}

function normalizeItems(rawItems: unknown): QuoteItem[] {
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map((item) => (item && typeof item === "object" ? item as QuoteItem : null))
    .filter((item): item is QuoteItem => !!item)
    .filter((item) => getItemName(item) && getItemQuantity(item) > 0);
}

function buildSalesMessage(items: QuoteItem[], total: string, notes: string): string {
  const lines = items.map((item, index) => {
    const quantity = getItemQuantity(item);
    const subtotal = getItemSubtotal(item);

    return [
      `${index + 1}. ${getItemName(item)}`,
      `   Cantidad: ${quantity} kg`,
      subtotal > 0 ? `   Subtotal estimado: $${formatMoney(subtotal)} MXN` : "",
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [
    "Solicitud de cotizacion generada desde Bonny.",
    "",
    "Productos:",
    ...lines,
    "",
    `Total estimado: $${total} MXN`,
    notes ? `Notas del cliente: ${notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildWhatsappMessage(contactName: string, items: QuoteItem[], total: string, notes: string): string {
  const lines = items.map((item) => {
    const quantity = getItemQuantity(item);
    return `- ${getItemName(item)}: ${quantity} kg`;
  });

  return [
    `Hola AGAMA, soy ${contactName}.`,
    "Quiero solicitar esta cotizacion:",
    ...lines,
    `Total estimado visto con Bonny: $${total} MXN.`,
    notes ? `Notas: ${notes}` : "",
    "Quedo pendiente de confirmacion por ventas.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function insertLandingContact(record: Record<string, unknown>) {
  const authKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !authKey) {
    throw new Error("Missing Supabase environment variables for landing_contacts insert.");
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/landing_contacts`, {
    method: "POST",
    headers: {
      apikey: authKey,
      Authorization: `Bearer ${authKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error(`landing_contacts insert failed with ${response.status}: ${await response.text()}`);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

async function notifySales(record: Record<string, unknown>) {
  if (!SUPABASE_URL) {
    throw new Error("Missing SUPABASE_URL for notify-contact.");
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/notify-contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      table: "landing_contacts",
      record,
    }),
  });

  if (!response.ok) {
    throw new Error(`notify-contact failed with ${response.status}: ${await response.text()}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    const payload = await req.json();

    const contactName = String(payload?.contact_name ?? payload?.name ?? "").trim();
    const email = String(payload?.email ?? "").trim();
    const phone = String(payload?.phone ?? "").trim();
    const company = String(payload?.company ?? "").trim();
    const notes = String(payload?.notes ?? payload?.message ?? "").trim();
    const pagePath = String(payload?.page_path ?? "/chatbase/bonny").trim();
    const source = String(payload?.source ?? "chatbase-bonny").trim();

    if (!contactName || !email) {
      return jsonResponse({
        ok: false,
        error: "contact_name and email are required.",
      }, 400);
    }

    const items = normalizeItems(payload?.items);
    if (items.length === 0) {
      return jsonResponse({
        ok: false,
        error: "At least one quote item is required.",
      }, 400);
    }

    const computedTotal = Number(
      items.reduce((sum, item) => sum + getItemSubtotal(item), 0).toFixed(2)
    );
    const total = Number.isFinite(Number(payload?.total_mxn)) && Number(payload.total_mxn) > 0
      ? Number(payload.total_mxn)
      : computedTotal;
    const totalFormatted = formatMoney(total);

    const salesMessage = buildSalesMessage(items, totalFormatted, notes);
    const whatsappMessage = buildWhatsappMessage(contactName, items, totalFormatted, notes);
    const whatsappUrl = `https://wa.me/${AGAMA_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

    const record = {
      source,
      name: contactName,
      company: company || null,
      email,
      phone: phone || null,
      subject: "Solicitud de cotizacion desde Bonny",
      message: salesMessage,
      page_path: pagePath,
      user_agent: "chatbase-bonny",
      created_at: new Date().toISOString(),
    };

    let savedRecord: Record<string, unknown> | null = null;
    let salesNotified = false;

    try {
      savedRecord = await insertLandingContact(record);
    } catch (error) {
      console.error("submit-quote-request insert failed:", error);
    }

    try {
      await notifySales(savedRecord ?? record);
      salesNotified = true;
    } catch (error) {
      console.error("submit-quote-request notify failed:", error);
    }

    return jsonResponse({
      ok: true,
      saved: !!savedRecord,
      sales_notified: salesNotified,
      resumen: "Solicitud preparada para el equipo comercial.",
      contacto: {
        name: contactName,
        email,
        phone: phone || null,
      },
      lineas: items.map((item) => ({
        nombre: getItemName(item),
        cantidad_kg: getItemQuantity(item),
        subtotal_mxn_formateado: formatMoney(getItemSubtotal(item)),
      })),
      total_mxn_formateado: totalFormatted,
      mensaje_ventas: salesMessage,
      mensaje_whatsapp: whatsappMessage,
      url_whatsapp: whatsappUrl,
      next_step: salesNotified
        ? "La solicitud ya quedo enviada a ventas."
        : "La solicitud se preparo, pero ventas necesita una segunda verificacion del envio.",
      widget_mode: "sales_request",
    });
  } catch (error) {
    console.error("submit-quote-request fatal error:", error);
    return jsonResponse({
      ok: false,
      error: "No se pudo procesar la solicitud de cotizacion.",
      details: esc(error instanceof Error ? error.message : String(error)),
    }, 500);
  }
});
