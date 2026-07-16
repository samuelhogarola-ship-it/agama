export type AgamaDemoPricingEntry = {
  code: string;
  pricePerKgMxn: number;
  sourcePagePath: string;
  sourceType: "product-offer-schema";
  sourceCurrency: "MXN";
};

export const AGAMA_DEMO_PRICING: Record<string, AgamaDemoPricingEntry> = {
  "MB-103": {
    code: "MB-103",
    pricePerKgMxn: 132,
    sourcePagePath: "/productos/masterbatch/mb-103-mb-amarillo-electrico/",
    sourceType: "product-offer-schema",
    sourceCurrency: "MXN",
  },
  "MB-106": {
    code: "MB-106",
    pricePerKgMxn: 149,
    sourcePagePath: "/productos/masterbatch/mb-106-mb-azul-rey/",
    sourceType: "product-offer-schema",
    sourceCurrency: "MXN",
  },
  "MB-110": {
    code: "MB-110",
    pricePerKgMxn: 66,
    sourcePagePath: "/productos/masterbatch/mb-110-mb-negro-kalo-economico/",
    sourceType: "product-offer-schema",
    sourceCurrency: "MXN",
  },
};

export function getAgamaDemoPriceByCode(code: string) {
  return AGAMA_DEMO_PRICING[code] ?? null;
}
