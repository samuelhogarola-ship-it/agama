import type { QuoteRequest } from "@/lib/quote-contract";

export type ProductQuoteRow = {
  code: string;
  nombre: string;
  precio: number | null;
};

export function parseQuoteProductDisplayName(nombre: string): string {
  const dotIdx = nombre.indexOf(". ");
  const raw = dotIdx === -1 ? nombre : nombre.slice(dotIdx + 2);
  return raw
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function enrichQuoteWithCatalogRows(quote: QuoteRequest, rows: ProductQuoteRow[]) {
  const rowsByCode = new Map(rows.map((row) => [row.code, row]));
  const requestedCodes = Array.from(new Set(quote.items.map((item) => item.colorCode)));

  if (requestedCodes.some((code) => !rowsByCode.has(code))) {
    return null;
  }

  return {
    ...quote,
    items: quote.items.map((item) => {
      const catalogRow = rowsByCode.get(item.colorCode)!;
      return {
        ...item,
        colorName: parseQuoteProductDisplayName(catalogRow.nombre),
        pricePerKgMxn: catalogRow.precio,
      };
    }),
  };
}
