import { createServerClient } from "@/lib/supabase";
import { agamaColors } from "@/data/agama-colors";
import { AGAMA_COLOR_VALIDATIONS } from "@/data/agama-color-validations";
import type { AgamaColor, AgamaColorFamily, AgamaConfiguratorProduct, AgamaConfiguratorProductId } from "@/lib/configurator-types";
import { createPlaceholderAsset, createReferenceAsset } from "@/lib/configurator-renderer";
import type { DemoConfiguratorColor } from "@/data/agama-configurator-demo";

// ── Color family mapping ────────────────────────────────────────────────────
const COLOR_FAMILY_MAP: Record<string, AgamaColorFamily> = {
  Amarillo: "amarillos",
  Azul: "azules",
  Verde: "verdes",
  Naranja: "naranjas",
  Rojo: "rojos",
  Rosa: "rosas",
  Magenta: "rosas",
  Morado: "morados",
  Negro: "negros",
  Blanco: "blancos",
  Gris: "grises",
  Café: "cafes",
  Beige: "naturales",
  Natural: "naturales",
  Marfil: "naturales",
  Transparente: "transparentes",
  Ámbar: "ambar",
  Ambar: "ambar",
  Metálico: "metalicos",
  Aluminio: "metalicos",
};

const FAMILY_ORDER: AgamaColorFamily[] = [
  "amarillos", "azules", "verdes", "naranjas", "rojos", "rosas",
  "morados", "negros", "blancos", "grises", "naturales",
  "transparentes", "cafes", "ambar", "metalicos",
];

// ── Row-to-type mappers ────────────────────────────────────────────────────

type ProductRow = {
  code: string;
  nombre: string;
  color: string;
  hex: string | null;
  hex_is_approximate: boolean | null;
  tipo_producto: string;
  slug: string;
  acabado: string | null;
  portada: string | null;
  ficha_tecnica: string | null;
  precio: number | null;
};

function parseDisplayName(nombre: string): string {
  // "MB-103 MB. AMARILLO ELÉCTRICO" → "Amarillo Eléctrico"
  // "BP-028 PIG. MAGENTA" → "Magenta"
  const dotIdx = nombre.indexOf(". ");
  if (dotIdx === -1) return nombre;
  const raw = nombre.slice(dotIdx + 2);
  return raw
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

function finishFromAcabado(acabado: string | null): string | null {
  if (!acabado) return null;
  if (acabado.includes("solido")) return "Opaco";
  if (acabado.includes("translucido")) return "Translúcido";
  if (acabado.includes("transparente")) return "Transparente";
  if (acabado.includes("metalico")) return "Metálico";
  return acabado;
}

function rowToAgamaColor(row: ProductRow): AgamaColor {
  const family = COLOR_FAMILY_MAP[row.color] ?? "naturales";
  const validation = AGAMA_COLOR_VALIDATIONS[row.code];
  return {
    code: row.code,
    name: parseDisplayName(row.nombre),
    family,
    hex: validation?.hex ?? row.hex ?? null,
    validationStatus: validation ? "validated" : row.hex_is_approximate === false ? "validated" : "pending",
    line: row.tipo_producto === "masterbatch" ? "masterbatch" : "pigmentos",
    slug: row.slug,
    finish: finishFromAcabado(row.acabado),
    swatchAssetUrl: row.portada ?? null,
    swatchSource: row.portada ? "product-image" : null,
    sourceSheetUrl: row.ficha_tecnica ?? null,
    sourceImageUrl: row.portada ?? null,
  };
}

function agamaColorToDemo(color: AgamaColor, precio: number | null): DemoConfiguratorColor {
  return {
    ...color,
    shortDescription: "Colorante AGAMA de alta calidad para plásticos. Solicita muestra o cotización.",
    availabilityLabel: "Consultar disponibilidad",
    visualNote: null,
    pricePerKgMxn: precio,
  };
}

function sortConfiguratorColors(colors: DemoConfiguratorColor[]): DemoConfiguratorColor[] {
  return colors.sort((a, b) => {
    const aIdx = FAMILY_ORDER.indexOf(a.family);
    const bIdx = FAMILY_ORDER.indexOf(b.family);
    if (aIdx !== bIdx) return aIdx - bIdx;
    return a.code.localeCompare(b.code);
  });
}

function getGeneratedCatalogFallback(): DemoConfiguratorColor[] {
  return sortConfiguratorColors(agamaColors.map((color) => agamaColorToDemo(color, null)));
}

// ── Color queries ───────────────────────────────────────────────────────────

export async function getColorsFromSupabase(): Promise<DemoConfiguratorColor[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("code, nombre, color, hex, hex_is_approximate, tipo_producto, slug, acabado, portada, ficha_tecnica, precio")
      .in("tipo_producto", ["masterbatch", "pigmentos"])
      .not("hex", "is", null)
      .order("tipo_producto")
      .order("code");

    if (error) throw new Error(`Error fetching colors: ${error.message}`);

    const colors = (data as ProductRow[]).map((row) => agamaColorToDemo(rowToAgamaColor(row), row.precio));
    if (colors.length === 0) {
      console.warn("AGAMA configurador: Supabase returned an empty color catalog, using generated fallback.");
      return getGeneratedCatalogFallback();
    }

    return sortConfiguratorColors(colors);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(`AGAMA configurador: Supabase color catalog unavailable, using generated fallback. ${detail}`);
    return getGeneratedCatalogFallback();
  }
}

export async function getColorByCodeFromSupabase(code: string | null | undefined): Promise<DemoConfiguratorColor | null> {
  if (!code) return null;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("code, nombre, color, hex, hex_is_approximate, tipo_producto, slug, acabado, portada, ficha_tecnica, precio")
    .eq("code", code)
    .single();

  if (error || !data) return null;
  const row = data as ProductRow;
  return agamaColorToDemo(rowToAgamaColor(row), row.precio);
}

// ── Visual product queries ──────────────────────────────────────────────────

type VisualProductRow = {
  id: string;
  name: string;
  category: string;
  placeholder_label: string | null;
  base_image_path: string | null;
  mask_image_path: string | null;
  supports_tint: boolean;
  sort_order: number;
};

function rowToVisualProduct(row: VisualProductRow): AgamaConfiguratorProduct {
  const hasTint = row.supports_tint && row.base_image_path !== null;
  return {
    id: row.id as AgamaConfiguratorProductId,
    name: row.name,
    category: row.category as AgamaConfiguratorProduct["category"],
    placeholderLabel: row.placeholder_label ?? "Foto oficial pendiente",
    baseImage: row.base_image_path,
    maskImage: row.mask_image_path,
    supportsTint: hasTint,
    asset: hasTint
      ? createReferenceAsset(row.base_image_path!, true)
      : createPlaceholderAsset(),
    status: "placeholder",
  };
}

export async function getVisualProductsFromSupabase(): Promise<AgamaConfiguratorProduct[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("configurator_visual_products")
    .select("id, name, category, placeholder_label, base_image_path, mask_image_path, supports_tint, sort_order")
    .eq("active", true)
    .order("sort_order");

  if (error) throw new Error(`Error fetching visual products: ${error.message}`);
  return (data as VisualProductRow[]).map(rowToVisualProduct);
}

// ── Render queries ──────────────────────────────────────────────────────────

export async function getRendersFromSupabase(
  productId: string,
): Promise<Record<string, string>> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("configurator_renders")
    .select("color_code, render_url")
    .eq("visual_product_id", productId);

  if (error) return {};
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.color_code as string] = row.render_url as string;
  }
  return map;
}
