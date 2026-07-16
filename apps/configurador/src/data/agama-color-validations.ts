import type { AgamaColorValidationMap } from "@/lib/configurator-types";

// HEX values extracted from Agama_productos_pigmentos_masterbatch_hex_rgb_completo.xlsx
// Source: visual analysis of product plates/fichas. Confidence level noted where below "Alta".
export const AGAMA_COLOR_VALIDATIONS: AgamaColorValidationMap = {
  // ── Amarillos ──────────────────────────────────────────────────────────────
  "MB-101": { hex: "#F6C400", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-102": { hex: "#FFD200", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-103": { hex: "#FFE600", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "MB-126": { hex: "#F4C400", notes: "HEX desde ficha AGAMA — confianza media, película translúcida", validatedAt: "2026-07-11" },
  "MB-131": { hex: "#F5B800", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-179": { hex: "#FFD100", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "BP-110": { hex: "#F7C600", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-153": { hex: "#F7E600", notes: "HEX desde ficha AGAMA — confianza media-baja", validatedAt: "2026-07-11" },
  "BP-194": { hex: "#FFD200", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-1001": { hex: "#ECF001", notes: "HEX desde ficha AGAMA — confianza media, cristal translúcido", validatedAt: "2026-07-11" },
  "BP-1003": { hex: "#F6F111", notes: "HEX desde ficha AGAMA — confianza media, cristal translúcido", validatedAt: "2026-07-11" },
  "BP-2497": { hex: "#F6E08E", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-2502": { hex: "#F2C400", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },

  // ── Azules ─────────────────────────────────────────────────────────────────
  "MB-104": { hex: "#A7CDEB", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-106": { hex: "#0047AB", notes: "HEX desde ficha AGAMA — Azul Rey", validatedAt: "2026-07-11" },
  "MB-117": { hex: "#0072CE", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "MB-125": { hex: "#0066CC", notes: "HEX desde ficha AGAMA — confianza media, película translúcida", validatedAt: "2026-07-11" },
  "MB-154": { hex: "#0067A5", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "MB-189": { hex: "#0057B8", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "MB-195": { hex: "#0065B3", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "MB-225": { hex: "#0057A8", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  // MB-204 is a known duplicate alias of MB-106 (same color family). Kept here
  // because some catalog sheets reference both codes. Remove when AGAMA confirms MB-204 is retired.
  "MB-204": { hex: "#0047AB", notes: "Alias duplicado de MB-106 (Azul Rey). Confirmar con AGAMA si se retira.", validatedAt: "2026-06-24" },
  "BP-080": { hex: "#082C9C", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "BP-142": { hex: "#0054B8", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-151": { hex: "#7DB5E8", notes: "HEX desde ficha AGAMA — confianza media, azul pastel", validatedAt: "2026-07-11" },
  "BP-160": { hex: "#003C9E", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-208": { hex: "#005DAA", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-231": { hex: "#0072BC", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-1009": { hex: "#006BF7", notes: "HEX desde ficha AGAMA — confianza media, cristal translúcido", validatedAt: "2026-07-11" },
  "BP-1023": { hex: "#01C2F8", notes: "HEX desde ficha AGAMA — confianza media, cristal translúcido", validatedAt: "2026-07-11" },

  // ── Verdes ─────────────────────────────────────────────────────────────────
  "MB-118": { hex: "#00A676", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "MB-121": { hex: "#39FF14", notes: "HEX desde ficha AGAMA — confianza media, verde eléctrico", validatedAt: "2026-07-11" },
  "MB-124": { hex: "#A7D600", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-128": { hex: "#009F4D", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "MB-171": { hex: "#00843D", notes: "HEX desde ficha AGAMA — verde bandera", validatedAt: "2026-07-11" },
  "MB-180": { hex: "#00A651", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-221": { hex: "#00A86B", notes: "HEX desde ficha AGAMA — confianza media, película translúcida", validatedAt: "2026-07-11" },
  "BP-065": { hex: "#78B82A", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-127": { hex: "#00A95C", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-279": { hex: "#008C72", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-418": { hex: "#556B2F", notes: "HEX desde ficha AGAMA — confianza media, verde militar", validatedAt: "2026-07-11" },
  "BP-792": { hex: "#00843D", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-1014": { hex: "#B7E217", notes: "HEX desde ficha AGAMA — confianza media, cristal translúcido", validatedAt: "2026-07-11" },
  "BP-1015": { hex: "#BAE331", notes: "HEX desde ficha AGAMA — confianza media, cristal translúcido", validatedAt: "2026-07-11" },
  "BP-1016": { hex: "#01DDCC", notes: "HEX desde ficha AGAMA — confianza media, cristal translúcido", validatedAt: "2026-07-11" },
  "BP-1022": { hex: "#96EF58", notes: "HEX desde ficha AGAMA — confianza media, cristal translúcido", validatedAt: "2026-07-11" },
  "BP-2248": { hex: "#9ACD32", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },

  // ── Naranjas ───────────────────────────────────────────────────────────────
  "MB-112": { hex: "#FF7A00", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-114": { hex: "#FF5A00", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "MB-127": { hex: "#FF8200", notes: "HEX desde ficha AGAMA — confianza media, película translúcida", validatedAt: "2026-07-11" },
  "MB-233": { hex: "#F37021", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-109": { hex: "#F26A21", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-131": { hex: "#FF5A1F", notes: "HEX desde ficha AGAMA — confianza media-baja", validatedAt: "2026-07-11" },
  "BP-174": { hex: "#E85C0D", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-1005": { hex: "#E88500", notes: "HEX desde ficha AGAMA — confianza media, cristal translúcido", validatedAt: "2026-07-11" },
  "BP-1012": { hex: "#F25444", notes: "HEX desde ficha AGAMA — confianza media, cristal translúcido", validatedAt: "2026-07-11" },

  // ── Rojos ──────────────────────────────────────────────────────────────────
  "MB-116": { hex: "#CE1126", notes: "HEX desde ficha AGAMA — rojo bandera", validatedAt: "2026-07-11" },
  "MB-122": { hex: "#E30613", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-201": { hex: "#6F1028", notes: "HEX desde ficha AGAMA — guinda oscuro", validatedAt: "2026-07-11" },
  "MB-210": { hex: "#D50032", notes: "HEX desde ficha AGAMA — confianza media, película translúcida", validatedAt: "2026-07-11" },
  "MB-231": { hex: "#B01924", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-101": { hex: "#6A2747", notes: "HEX desde ficha AGAMA — confianza media-baja, guinda pigmento", validatedAt: "2026-07-11" },
  "BP-111": { hex: "#D71920", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-114": { hex: "#CE1126", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-1000": { hex: "#E4181E", notes: "HEX desde ficha AGAMA — confianza media, cristal translúcido", validatedAt: "2026-07-11" },
  "BP-1013": { hex: "#EF0377", notes: "HEX desde ficha AGAMA — confianza media, cristal translúcido", validatedAt: "2026-07-11" },

  // ── Rosas ──────────────────────────────────────────────────────────────────
  "MB-113": { hex: "#F6A6C8", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-119": { hex: "#D1006F", notes: "HEX desde ficha AGAMA — solferino", validatedAt: "2026-07-11" },
  "BP-028": { hex: "#C90D57", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "BP-060": { hex: "#D89A91", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-061": { hex: "#D98C8C", notes: "HEX desde ficha AGAMA — confianza media-baja", validatedAt: "2026-07-11" },
  "BP-198": { hex: "#E870A5", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-277": { hex: "#E4007F", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-645": { hex: "#D1006F", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-1007": { hex: "#DD32CE", notes: "HEX desde ficha AGAMA — confianza media, cristal translúcido", validatedAt: "2026-07-11" },

  // ── Morados ────────────────────────────────────────────────────────────────
  "MB-111": { hex: "#5B2A86", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-132": { hex: "#6A1B9A", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "MB-184": { hex: "#7B2CBF", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-115": { hex: "#63318C", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-116": { hex: "#53257E", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-144": { hex: "#7A3E98", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-1020": { hex: "#6C3578", notes: "HEX desde ficha AGAMA — confianza media, cristal translúcido", validatedAt: "2026-07-11" },

  // ── Negros ─────────────────────────────────────────────────────────────────
  "MB-110": { hex: "#101010", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-115": { hex: "#050505", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-138": { hex: "#030303", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "BP-1019": { hex: "#524A46", notes: "HEX desde ficha AGAMA — confianza media, cristal humo translúcido", validatedAt: "2026-07-11" },
  "BP-2228": { hex: "#111111", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-2513": { hex: "#070707", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },

  // ── Blancos ────────────────────────────────────────────────────────────────
  "MB-120": { hex: "#F7F7F2", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "BP-106": { hex: "#F1F1EA", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-107": { hex: "#F7F7F5", notes: "HEX desde ficha AGAMA — confianza media-baja", validatedAt: "2026-07-11" },
  "BP-195": { hex: "#F2F2EE", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-232": { hex: "#F5F5F1", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },

  // ── Grises ─────────────────────────────────────────────────────────────────
  "MB-123": { hex: "#C8C8C8", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-137": { hex: "#808080", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-149": { hex: "#505050", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "BP-169": { hex: "#7C7C7C", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-211": { hex: "#B8B8BA", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-273": { hex: "#808285", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-274": { hex: "#5A5B5D", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },

  // ── Naturales ──────────────────────────────────────────────────────────────
  "MB-148": { hex: "#C6A77B", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "MB-155": { hex: "#B6A17A", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-033": { hex: "#C39575", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-034": { hex: "#B88A72", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-193": { hex: "#E6D6B7", notes: "HEX desde ficha AGAMA — confianza media, marfil", validatedAt: "2026-07-11" },
  "BP-382": { hex: "#D8C7A3", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "BP-2505": { hex: "#E3D4B7", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },

  // ── Cafés ──────────────────────────────────────────────────────────────────
  "MB-109": { hex: "#6B3F2A", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-150": { hex: "#8B4A2F", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "MB-151": { hex: "#944B2A", notes: "HEX desde ficha AGAMA — confianza media", validatedAt: "2026-07-11" },
  "MB-152": { hex: "#B85C38", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "MB-153": { hex: "#4E2A1E", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },
  "BP-037": { hex: "#532E1F", notes: "HEX desde ficha AGAMA", validatedAt: "2026-07-11" },

  // ── Metálicos ──────────────────────────────────────────────────────────────
  "MB-107": { hex: "#B7B9BB", notes: "HEX desde ficha AGAMA — confianza media, aluminio metalizado", validatedAt: "2026-07-11" },

  // ── Funcionales / Neutros ──────────────────────────────────────────────────
  "MB-105": { hex: "#E7E9E5", notes: "HEX desde ficha AGAMA — confianza media-baja, aditivo funcional/neutro", validatedAt: "2026-07-11" },
  "MB-200": { hex: "#F3F6F4", notes: "HEX desde ficha AGAMA — confianza media-baja, alta transparencia", validatedAt: "2026-07-11" },

  // ── Transparentes ──────────────────────────────────────────────────────────
  "BP-1018": { hex: "#AD542D", notes: "HEX desde ficha AGAMA — confianza media, ámbar translúcido", validatedAt: "2026-07-11" },
};
