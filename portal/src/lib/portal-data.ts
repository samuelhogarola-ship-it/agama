import { cache } from "react";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type {
  PortalCategory,
  PortalProduct,
  ProductCategorySlug,
  RawProduct,
} from "@/lib/types";
import { slugifyLabel } from "@/lib/utils";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  "https://ozexoekvshuhtkrleuze.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  "sb_publishable_nyvRHJ6eZ3aAfSQjVnBzYg_TdVPqpFL";

const PRODUCT_SELECT =
  "id,slug,nombre,tipo_producto,tipo,acabado,color,precio,descripcion,informacion,ficha_tecnica,portada,galeria,category_id,code,minimum_order_qty,applications,is_quote_only,is_featured,sort_order";

const CATEGORY_CATALOG: PortalCategory[] = [
  {
    slug: "pigmentos",
    name: "Pigmentos",
    shortName: "Pigmentos",
    description: "Color directo para formulaciones plasticas de alto impacto visual.",
    accent: "var(--amber)",
  },
  {
    slug: "masterbatch",
    name: "Masterbatch",
    shortName: "Masterbatch",
    description: "Masterbatch de color y funcional con acabados consistentes.",
    accent: "var(--brand)",
  },
  {
    slug: "aditivos",
    name: "Aditivos",
    shortName: "Aditivos",
    description: "Aditivos para mejorar proceso, estabilidad y desempeno.",
    accent: "var(--cyan)",
  },
  {
    slug: "desmoldantes",
    name: "Desmoldantes",
    shortName: "Desmoldantes",
    description: "Soluciones para liberar pieza y proteger moldes sin friccion.",
    accent: "var(--hot)",
  },
  {
    slug: "purgas",
    name: "Purgas",
    shortName: "Purgas",
    description: "Limpieza tecnica de husillo y cambio rapido entre corridas.",
    accent: "var(--brand-strong)",
  },
  {
    slug: "productos-especiales",
    name: "Productos especiales",
    shortName: "Especiales",
    description: "Productos de nicho para requerimientos no estandar.",
    accent: "var(--graphite)",
  },
];

const FEATURED_SLUGS = [
  "mb-119-mb-rosa-solferino",
  "mb-106-mb-azul-rey",
  "ad-318-purga",
  "mb-116-mb-rojo-bandera",
];

const PORTAL_PRODUCTS_SOURCE = process.env.PORTAL_PRODUCTS_SOURCE ?? "auto";

const FALLBACK_PRODUCTS: RawProduct[] = [
  {
    id: "fallback-mb-119",
    slug: "mb-119-mb-rosa-solferino",
    nombre: "MB-119 MB ROSA SOLFERINO",
    tipo_producto: "masterbatch",
    descripcion: "Masterbatch vibrante para productos de alto impacto comercial.",
    portada:
      "https://ozexoekvshuhtkrleuze.supabase.co/storage/v1/object/public/product-images/masterbatch/mb-119-mb-rosa-solferino/cover.webp",
    ficha_tecnica:
      "https://cdn.prod.website-files.com/63c6bdcc8c4ba686216459fb/69d28850a13c33bf1e6b0a30_MB-119%20Rosa%20Solferino.pdf",
    precio: 1780,
  },
  {
    id: "fallback-mb-106",
    slug: "mb-106-mb-azul-rey",
    nombre: "MB-106 MB AZUL REY",
    tipo_producto: "masterbatch",
    descripcion: "Color corporativo profundo para aplicaciones premium y tecnicas.",
    portada:
      "https://ozexoekvshuhtkrleuze.supabase.co/storage/v1/object/public/product-images/masterbatch/mb-106-mb-azul-rey/cover.webp",
    ficha_tecnica:
      "https://cdn.prod.website-files.com/63c6bdcc8c4ba686216459fb/69d27ff27c9991f90439a6fc_MB-106%20Azul%20Rey.pdf",
    precio: 1490,
  },
  {
    id: "fallback-ad-318",
    slug: "ad-318-purga",
    nombre: "AD-318 PURGA",
    tipo_producto: "aditivos",
    descripcion: "Purga de mantenimiento para cambios agiles y menor merma.",
    portada:
      "https://ozexoekvshuhtkrleuze.supabase.co/storage/v1/object/public/product-images/aditivos/ad-318-purga/cover.webp",
    ficha_tecnica:
      "https://cdn.prod.website-files.com/63c6bdcc8c4ba686216459fb/69a7266d343ae0718561d496_AD-318%20Purga.pdf",
    precio: null,
  },
];

function inferCode(raw: RawProduct) {
  if (raw.code) return raw.code;
  const byName = raw.nombre.match(/([A-Z]{2}-\d{3})/i)?.[1];
  if (byName) return byName.toUpperCase();

  return raw.slug
    .split("-")
    .slice(0, 2)
    .join("-")
    .toUpperCase();
}

function splitGallery(gallery?: string | null) {
  if (!gallery) return [];
  return gallery
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferApplications(raw: RawProduct) {
  const family = `${raw.tipo_producto ?? ""} ${raw.tipo ?? ""}`.toLowerCase();
  if (family.includes("masterbatch")) {
    return ["Inyeccion", "Extrusion", "Soplado"];
  }

  if (family.includes("pigment")) {
    return ["Compuesto", "Laminado", "Piezas decorativas"];
  }

  if (raw.slug.includes("purga")) {
    return ["Cambio de color", "Limpieza de husillo", "Arranque"];
  }

  if (raw.slug.includes("desmold")) {
    return ["Inyeccion", "Proteccion de molde", "Ciclos rapidos"];
  }

  return ["Inyeccion", "Extrusion", "Compuesto"];
}

function inferCategories(raw: RawProduct): ProductCategorySlug[] {
  const source = `${raw.nombre} ${raw.slug} ${raw.tipo ?? ""} ${raw.tipo_producto ?? ""}`.toLowerCase();
  const categories = new Set<ProductCategorySlug>();
  const slug = raw.slug.toLowerCase();

  if (
    raw.tipo_producto === "pigmentos" ||
    raw.tipo === "pigmentos" ||
    slug.startsWith("bp-") ||
    slug.includes("-pig-") ||
    source.includes("pigment")
  ) {
    categories.add("pigmentos");
  }

  if (
    raw.tipo_producto === "masterbatch" ||
    raw.tipo === "masterbatch" ||
    slug.startsWith("mb-") ||
    source.includes("masterbatch")
  ) {
    categories.add("masterbatch");
  }

  if (
    raw.tipo_producto === "aditivos" ||
    raw.tipo === "aditivos" ||
    slug.startsWith("ad-") ||
    source.includes("aditivo")
  ) {
    categories.add("aditivos");
  }

  if (source.includes("desmold") || source.includes("mold") || source.includes("slip")) {
    categories.add("desmoldantes");
  }

  if (source.includes("purga")) {
    categories.add("purgas");
  }

  if (
    categories.size === 0 ||
    source.includes("perla") ||
    source.includes("uv") ||
    source.includes("serie nb")
  ) {
    categories.add("productos-especiales");
  }

  return [...categories];
}

function inferAccent(slugs: ProductCategorySlug[]) {
  if (slugs.includes("purgas")) return "var(--hot)";
  if (slugs.includes("desmoldantes")) return "var(--cyan)";
  if (slugs.includes("masterbatch")) return "var(--brand)";
  if (slugs.includes("pigmentos")) return "var(--amber)";
  return "var(--graphite)";
}

function enrichProduct(raw: RawProduct): PortalProduct {
  const categorySlugs = inferCategories(raw);
  const primaryCategory = categorySlugs[0] ?? "productos-especiales";

  return {
    id: raw.id ?? raw.slug,
    slug: raw.slug,
    name: raw.nombre,
    code: inferCode(raw),
    type: raw.tipo ?? raw.tipo_producto ?? primaryCategory,
    family: primaryCategory,
    finish: raw.acabado ?? null,
    color: raw.color ?? null,
    price: raw.precio ?? null,
    description:
      raw.descripcion?.trim() ??
      "Solucion AGAMA para procesos plasticos con enfoque en rendimiento y control de color.",
    longDescription:
      raw.informacion?.trim() ??
      raw.descripcion?.trim() ??
      "Producto AGAMA disponible para cotizacion, repeticion de pedido y consulta tecnica.",
    cover: raw.portada ?? null,
    gallery: splitGallery(raw.galeria),
    techSheetUrl: raw.ficha_tecnica ?? null,
    minOrderQty:
      typeof raw.minimum_order_qty === "number"
        ? `${raw.minimum_order_qty} kg minimo`
        : raw.tipo_producto === "masterbatch"
          ? "25 kg minimo"
          : "10 kg minimo",
    applications: raw.applications?.length ? raw.applications : inferApplications(raw),
    isQuoteOnly: raw.is_quote_only ?? raw.precio == null,
    isFeatured: raw.is_featured ?? FEATURED_SLUGS.includes(raw.slug),
    categorySlugs,
    accent: inferAccent(categorySlugs),
  };
}

async function fetchRemoteProducts() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/products?published=eq.true&select=${PRODUCT_SELECT}&order=nombre.asc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      next: { revalidate: 900 },
    },
  );

  if (!response.ok) {
    throw new Error(`Supabase products fetch failed with ${response.status}`);
  }

  return (await response.json()) as RawProduct[];
}

async function readLocalProductsManifest() {
  const manifestPath = join(process.cwd(), "..", "data", "product-images-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Array<{
    slug: string;
    cover?: { publicUrl?: string };
  }>;

  return manifest.map((entry) => ({
    id: entry.slug,
    slug: entry.slug,
    nombre: entry.slug
      .split("-")
      .map((chunk) => chunk.toUpperCase())
      .join(" "),
    tipo_producto: entry.slug.startsWith("mb-")
      ? "masterbatch"
      : entry.slug.startsWith("pg-")
        ? "pigmentos"
        : "aditivos",
    portada: entry.cover?.publicUrl ?? null,
  })) as RawProduct[];
}

export const getPortalCategories = cache(async () => CATEGORY_CATALOG);

export const getPortalProducts = cache(async () => {
  if (PORTAL_PRODUCTS_SOURCE === "manifest") {
    try {
      const localManifest = await readLocalProductsManifest();
      return localManifest.map(enrichProduct);
    } catch {
      return FALLBACK_PRODUCTS.map(enrichProduct);
    }
  }

  if (PORTAL_PRODUCTS_SOURCE === "fallback") {
    return FALLBACK_PRODUCTS.map(enrichProduct);
  }

  try {
    const remote = await fetchRemoteProducts();
    return remote.map(enrichProduct);
  } catch {
    try {
      const localManifest = await readLocalProductsManifest();
      return localManifest.map(enrichProduct);
    } catch {
      return FALLBACK_PRODUCTS.map(enrichProduct);
    }
  }
});

export async function getFeaturedProducts() {
  const products = await getPortalProducts();

  const sorted = [...products].sort((left, right) => {
    const leftIndex = FEATURED_SLUGS.indexOf(left.slug);
    const rightIndex = FEATURED_SLUGS.indexOf(right.slug);

    if (leftIndex === -1 && rightIndex === -1) return 0;
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });

  return sorted.slice(0, 4);
}

export async function getSpotlightProducts() {
  const products = await getPortalProducts();
  return CATEGORY_CATALOG.map((category) => ({
    category,
    product:
      products.find((product) => product.categorySlugs.includes(category.slug) && product.cover) ??
      products[0],
  }));
}

export async function getProductBySlug(slug: string) {
  const products = await getPortalProducts();
  return products.find((product) => product.slug === slug) ?? null;
}

export async function getCategoryCounts() {
  const products = await getPortalProducts();

  return CATEGORY_CATALOG.map((category) => ({
    ...category,
    count: products.filter((product) => product.categorySlugs.includes(category.slug)).length,
  }));
}

export async function searchPortalProducts(query?: string) {
  const products = await getPortalProducts();
  if (!query) return products;

  const normalized = slugifyLabel(query);

  return products.filter((product) =>
    slugifyLabel(
      `${product.name} ${product.code} ${product.description} ${product.categorySlugs.join(" ")}`,
    ).includes(normalized),
  );
}
