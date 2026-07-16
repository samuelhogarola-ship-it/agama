import type { AgamaConfiguratorProductId } from "@/lib/configurator-types";

type ProductRenderMap = Partial<Record<AgamaConfiguratorProductId, Partial<Record<string, string>>>>;

export const AGAMA_RENDER_ASSET_VERSION = "2026-06-24-bucket-v2";
export const AGAMA_BUCKET_BASE_RENDER = "/renders/bucket/bucket-base.webp";

export const AGAMA_PRODUCT_RENDERS: ProductRenderMap = {
  bucket: {
    "MB-103": "/renders/bucket/MB-103.webp",
    "MB-106": "/renders/bucket/MB-106.webp",
    "MB-110": "/renders/bucket/MB-110.webp",
  },
};

export function getAgamaProductRender(productId: AgamaConfiguratorProductId, colorCode: string | null | undefined) {
  if (!colorCode) return null;
  return AGAMA_PRODUCT_RENDERS[productId]?.[colorCode] ?? null;
}

export function withRenderAssetVersion(url: string | null) {
  if (!url) return null;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${AGAMA_RENDER_ASSET_VERSION}`;
}
