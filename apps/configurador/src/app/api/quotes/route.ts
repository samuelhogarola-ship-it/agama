import { after, NextRequest, NextResponse } from "next/server";

import { parseQuoteRequest, type QuoteRequest, type QuoteResponse } from "@/lib/quote-contract";
import { enrichQuoteWithCatalogRows, type ProductQuoteRow } from "@/lib/quote-catalog";
import { createServerClient } from "@/lib/supabase";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, number[]>();
const DEFAULT_CONFIGURATOR_PATH = "/configurador";

function isRateLimited(key: string) {
  const now = Date.now();
  const active = (attempts.get(key) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  active.push(now);
  attempts.set(key, active);
  return active.length > 5;
}

function resolveSalesWebhookUrl() {
  const configuredUrl = process.env.AGAMA_SALES_WEBHOOK_URL?.trim();
  if (configuredUrl) return configuredUrl;

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)?.trim();
  if (!supabaseUrl) return null;

  return new URL("/functions/v1/notify-contact", supabaseUrl).toString();
}

function buildQuoteMessage(quoteId: string, quote: NonNullable<ReturnType<typeof parseQuoteRequest>>) {
  const totalKg = quote.items.reduce((sum, item) => sum + item.quantityKg, 0);
  const totalKnownAmount = quote.items.reduce((sum, item) => sum + ((item.pricePerKgMxn ?? 0) * item.quantityKg), 0);
  const hasPendingPricing = quote.items.some((item) => item.pricePerKgMxn == null);

  const itemLines = quote.items.map((item, index) => {
    const unitPrice = item.pricePerKgMxn != null ? `${item.pricePerKgMxn} MXN/kg` : "Precio por validar";
    const lineAmount = item.pricePerKgMxn != null ? `${item.pricePerKgMxn * item.quantityKg} MXN` : "Monto por validar";
    return `${index + 1}. ${item.productId} | ${item.colorCode} ${item.colorName} | ${item.quantityKg} kg | ${unitPrice} | ${lineAmount}`;
  });

  return [
    "Nueva solicitud desde el configurador AGAMA.",
    `Referencia: ${quoteId}`,
    `Empresa: ${quote.contactCompany}`,
    `Contacto: ${quote.contactName}`,
    `Email: ${quote.contactEmail}`,
    `Telefono: ${quote.contactPhone || "No indicado"}`,
    "",
    "Pedido:",
    ...itemLines,
    "",
    `Peso total: ${totalKg} kg`,
    `Monto total: ${hasPendingPricing ? `${totalKnownAmount} MXN + partidas por validar` : `${totalKnownAmount} MXN`}`,
    `Configuracion: ${quote.configurationUrl || DEFAULT_CONFIGURATOR_PATH}`,
    quote.notes ? `Notas: ${quote.notes}` : "",
  ].filter(Boolean).join("\n");
}

async function enrichQuoteWithCatalogData(quote: QuoteRequest, supabase: ReturnType<typeof createServerClient>) {
  const requestedCodes = Array.from(new Set(quote.items.map((item) => item.colorCode)));
  const { data, error } = await supabase
    .from("products")
    .select("code, nombre, precio")
    .in("code", requestedCodes);

  if (error || !data) {
    throw new Error("catalog_lookup_failed");
  }

  return enrichQuoteWithCatalogRows(quote, data as ProductQuoteRow[]);
}

async function notifySales(payload: { quoteId: string; quote: NonNullable<ReturnType<typeof parseQuoteRequest>>; submittedAt: string }) {
  const webhookUrl = resolveSalesWebhookUrl();
  if (!webhookUrl) return false;

  const record = {
    name: payload.quote.contactName,
    company: payload.quote.contactCompany,
    email: payload.quote.contactEmail,
    phone: payload.quote.contactPhone || null,
    subject: `Solicitud configurador ${payload.quoteId}`,
    message: buildQuoteMessage(payload.quoteId, payload.quote),
    source: payload.quote.source,
    page_path: payload.quote.configurationUrl || DEFAULT_CONFIGURATOR_PATH,
    created_at: payload.submittedAt,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        type: "INSERT",
        table: "configurator_quotes",
        record,
      }),
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function queueSalesNotification(payload: { quoteId: string; quote: NonNullable<ReturnType<typeof parseQuoteRequest>>; submittedAt: string }) {
  const webhookUrl = resolveSalesWebhookUrl();
  if (!webhookUrl) return false;

  after(async () => {
    const delivered = await notifySales(payload);
    if (!delivered) {
      console.warn("AGAMA configurador: sales notification not delivered", payload.quoteId);
    }
  });

  return true;
}

export async function POST(request: NextRequest) {
  const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (isRateLimited(clientKey)) {
    const body: QuoteResponse = { ok: false, error: "rate_limited", message: "Demasiados intentos. Prueba de nuevo en unos minutos." };
    return NextResponse.json(body, { status: 429 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    input = null;
  }

  const quote = parseQuoteRequest(input);
  if (!quote) {
    const body: QuoteResponse = { ok: false, error: "invalid_request", message: "Revisa los datos de contacto y del pedido." };
    return NextResponse.json(body, { status: 400 });
  }

  const supabase = createServerClient();
  let validatedQuote: QuoteRequest;
  try {
    const enrichedQuote = await enrichQuoteWithCatalogData(quote, supabase);
    if (!enrichedQuote) {
      const body: QuoteResponse = { ok: false, error: "invalid_request", message: "Revisa los datos de contacto y del pedido." };
      return NextResponse.json(body, { status: 400 });
    }
    validatedQuote = enrichedQuote;
  } catch (error) {
    console.error("AGAMA configurador: quote catalog validation failed", error instanceof Error ? error.message : error);
    const body: QuoteResponse = { ok: false, error: "storage_failed", message: "No pudimos validar el catálogo. Puedes continuar por WhatsApp." };
    return NextResponse.json(body, { status: 503 });
  }

  const { data, error } = await supabase.from("configurator_quotes").insert({
    contact_name: validatedQuote.contactName,
    contact_email: validatedQuote.contactEmail,
    contact_phone: validatedQuote.contactPhone || null,
    contact_company: validatedQuote.contactCompany,
    items: validatedQuote.items,
    total_kg: validatedQuote.items.reduce((sum, item) => sum + item.quantityKg, 0),
    notes: validatedQuote.notes || null,
    source: validatedQuote.source,
    status: "new",
  }).select("id, created_at, contact_email").single();

  if (error || !data) {
    console.error("AGAMA configurador: quote storage failed", error?.message);
    const body: QuoteResponse = { ok: false, error: "storage_failed", message: "No pudimos guardar la solicitud. Puedes continuar por WhatsApp." };
    return NextResponse.json(body, { status: 503 });
  }

  const quoteId = String(data.id);
  const submittedAt = String(data.created_at);
  const notificationQueued = queueSalesNotification({ quoteId, quote: validatedQuote, submittedAt });
  const body: QuoteResponse = {
    ok: true,
    quoteId,
    notificationQueued,
    notificationDelivered: false,
    submittedAt,
    contactEmail: String(data.contact_email),
  };
  return NextResponse.json(body, { status: 201 });
}
