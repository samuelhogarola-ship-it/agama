import { AGAMA_BUCKET_BASE_RENDER, getAgamaProductRender, withRenderAssetVersion } from "@/data/agama-product-renders";
import type {
  AgamaColor,
  AgamaConfiguratorProduct,
  ConfiguratorActiveSlot,
  ProductRendererAdapter,
  RenderModel,
  RenderableProductAsset,
} from "@/lib/configurator-types";

export const AGAMA_EMBOSS_LOGO_SRC = "/brand/agama.svg";

export const PNG_EXPORT_STATUS = {
  available: false,
  reason: "TODO: integrar exportacion PNG cuando exista una dependencia aprobada en el proyecto.",
} as const;

function mapRenderColor(color: AgamaColor | null) {
  if (!color) return null;

  return {
    code: color.code,
    name: color.name,
    hex: color.hex,
    validatedHex: color.validationStatus === "validated" ? color.hex : null,
    validationStatus: color.validationStatus,
    line: color.line,
    swatchAssetUrl: color.swatchAssetUrl,
  };
}

function getSelectedColor(activeSlot: ConfiguratorActiveSlot, primary: AgamaColor | null, compare: AgamaColor | null) {
  return activeSlot === "b" ? compare ?? primary : primary;
}

export function getSelectedColorHex(color: AgamaColor | null) {
  if (!color) {
    return null;
  }

  const validatedHex = color.validationStatus === "validated" ? color.hex : null;
  return validatedHex ?? color.hex ?? null;
}

export function getProductDisplayColor(color: AgamaColor | null) {
  return getSelectedColorHex(color);
}

function resolvePreviewSwatchUrl(activeSlot: ConfiguratorActiveSlot, primary: AgamaColor | null, compare: AgamaColor | null) {
  const activeColor = getSelectedColor(activeSlot, primary, compare);
  return activeColor?.swatchAssetUrl ?? null;
}

function resolvePreviewImage(product: AgamaConfiguratorProduct, color: AgamaColor | null) {
  if (product.id !== "bucket") {
    return {
      previewImageUrl: product.baseImage ?? product.asset.source,
      previewUsesFixedRender: false,
      showRenderPending: false,
    };
  }

  if (!color) {
    return {
      previewImageUrl: withRenderAssetVersion(AGAMA_BUCKET_BASE_RENDER),
      previewUsesFixedRender: false,
      showRenderPending: false,
    };
  }

  const fixedRenderUrl = getAgamaProductRender(product.id, color.code);
  if (fixedRenderUrl) {
    return {
      previewImageUrl: withRenderAssetVersion(fixedRenderUrl),
      previewUsesFixedRender: true,
      showRenderPending: false,
    };
  }

  return {
    previewImageUrl: withRenderAssetVersion(AGAMA_BUCKET_BASE_RENDER),
    previewUsesFixedRender: false,
    showRenderPending: true,
  };
}

export const defaultProductRenderer: ProductRendererAdapter = {
  buildRenderModel({ product, primaryColor, compareColor, activeSlot }): RenderModel {
    const selectedColor = getSelectedColor(activeSlot, primaryColor, compareColor);
    const tintHex = getProductDisplayColor(selectedColor);
    const previewSwatchUrl = resolvePreviewSwatchUrl(activeSlot, primaryColor, compareColor);
    const { previewImageUrl, previewUsesFixedRender, showRenderPending } = resolvePreviewImage(product, selectedColor);

    return {
      product,
      asset: product.asset,
      embossLogoSrc: AGAMA_EMBOSS_LOGO_SRC,
      primaryColor: mapRenderColor(primaryColor),
      compareColor: mapRenderColor(compareColor),
      activeSlot,
      selectedColor: mapRenderColor(selectedColor),
      previewImageUrl,
      previewUsesFixedRender,
      showRenderPending,
      tintHex,
      tintEnabled: Boolean(tintHex && product.supportsTint && product.maskImage),
      previewSwatchUrl,
      hasSelectedColor: selectedColor != null,
      showPendingState: selectedColor != null && tintHex == null,
    };
  },
};

export function createPlaceholderAsset(): RenderableProductAsset {
  return {
    kind: "svg-placeholder",
    source: null,
    supportsTint: true,
    supportsEmboss: true,
  };
}

export function createReferenceAsset(source: string, supportsTint = false): RenderableProductAsset {
  return {
    kind: "png-cutout",
    source,
    supportsTint,
    supportsEmboss: false,
  };
}
