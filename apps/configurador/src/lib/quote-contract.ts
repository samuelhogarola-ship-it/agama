export type QuoteRequestItem = {
  configurationId: string;
  productId: "bucket" | "cup" | "chair";
  colorCode: string;
  colorName: string;
  quantityKg: number;
  pricePerKgMxn: number | null;
  process: string;
  material: string;
};

export type QuoteRequest = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactCompany: string;
  notes: string;
  consent: true;
  source: "configurador";
  configurationUrl: string;
  website: string;
  items: QuoteRequestItem[];
};

export type QuoteResponse =
  | {
      ok: true;
      quoteId: string;
      notificationQueued: boolean;
      notificationDelivered: boolean;
      submittedAt: string;
      contactEmail: string;
    }
  | { ok: false; error: "invalid_request" | "rate_limited" | "storage_failed"; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d\s.-]{7,24}$/;
const COLOR_CODE_PATTERN = /^(?:MB|BP)-[A-Z0-9-]{2,12}$/;
const PUBLIC_PRODUCT_IDS = new Set(["bucket", "cup", "chair"]);
const BLOCKED_EMAIL_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "yopmail.com",
]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function parseQuoteRequest(value: unknown): QuoteRequest | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const contactName = cleanText(input.contactName, 100);
  const contactEmail = cleanText(input.contactEmail, 160).toLowerCase();
  const contactPhone = cleanText(input.contactPhone, 24);
  const contactCompany = cleanText(input.contactCompany, 120);
  const notes = cleanText(input.notes, 1000);
  const configurationUrl = cleanText(input.configurationUrl, 500);
  const website = cleanText(input.website, 200);

  if (!contactName || !contactCompany || input.consent !== true || website) return null;
  if (!contactEmail || !EMAIL_PATTERN.test(contactEmail)) return null;
  if (contactPhone && !PHONE_PATTERN.test(contactPhone)) return null;
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 20) return null;
  const emailDomain = contactEmail.split("@")[1] ?? "";
  if (!emailDomain || BLOCKED_EMAIL_DOMAINS.has(emailDomain)) return null;

  const items: QuoteRequestItem[] = [];
  for (const rawItem of input.items) {
    if (!rawItem || typeof rawItem !== "object") return null;
    const item = rawItem as Record<string, unknown>;
    const productId = cleanText(item.productId, 20);
    const colorCode = cleanText(item.colorCode, 20).toUpperCase();
    const quantityKg = Number(item.quantityKg);
    const rawPrice = item.pricePerKgMxn;
    const pricePerKgMxn = rawPrice === null ? null : Number(rawPrice);

    if (!PUBLIC_PRODUCT_IDS.has(productId) || !COLOR_CODE_PATTERN.test(colorCode)) return null;
    if (!Number.isFinite(quantityKg) || quantityKg < 1 || quantityKg > 1_000_000) return null;
    if (pricePerKgMxn !== null && (!Number.isFinite(pricePerKgMxn) || pricePerKgMxn < 0)) return null;

    items.push({
      configurationId: cleanText(item.configurationId, 100),
      productId: productId as QuoteRequestItem["productId"],
      colorCode,
      colorName: cleanText(item.colorName, 120),
      quantityKg,
      pricePerKgMxn,
      process: cleanText(item.process, 80),
      material: cleanText(item.material, 80),
    });
  }

  return {
    contactName,
    contactEmail,
    contactPhone,
    contactCompany,
    notes,
    consent: true,
    source: "configurador",
    configurationUrl,
    website: "",
    items,
  };
}
