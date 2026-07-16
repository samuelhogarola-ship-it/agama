import { createPlaceholderAsset, createReferenceAsset } from "@/lib/configurator-renderer";
import type { AgamaConfiguratorProduct } from "@/lib/configurator-types";

export const agamaConfiguratorProducts: AgamaConfiguratorProduct[] = [
  {
    id: "bucket",
    name: "Cubeta",
    category: "industrial",
    placeholderLabel: "Referencia real AGAMA integrada",
    baseImage: "/products/bucket-base.webp",
    maskImage: "/products/bucket-mask.webp",
    supportsTint: true,
    asset: createReferenceAsset("/products/bucket-base.webp", true),
    status: "placeholder",
  },
  {
    id: "lid",
    name: "Tapa",
    category: "component",
    placeholderLabel: "Placeholder temporal · foto oficial pendiente",
    baseImage: null,
    maskImage: null,
    supportsTint: false,
    asset: createPlaceholderAsset(),
    status: "placeholder",
  },
  {
    id: "bottle",
    name: "Botella",
    category: "consumer",
    placeholderLabel: "Placeholder temporal · foto oficial pendiente",
    baseImage: null,
    maskImage: null,
    supportsTint: false,
    asset: createPlaceholderAsset(),
    status: "placeholder",
  },
  {
    id: "cup",
    name: "Taza",
    category: "consumer",
    placeholderLabel: "Referencia real AGAMA integrada",
    baseImage: "/products/cup-base.webp",
    maskImage: "/products/cup-mask.webp",
    supportsTint: true,
    asset: createReferenceAsset("/products/cup-base.webp", true),
    status: "placeholder",
  },
  {
    id: "chair",
    name: "Silla",
    category: "furniture",
    placeholderLabel: "Referencia real AGAMA integrada",
    baseImage: "/products/chair-base.webp",
    maskImage: "/products/chair-mask.webp",
    supportsTint: true,
    asset: createReferenceAsset("/products/chair-base.webp", true),
    status: "placeholder",
  },
];

export function getAgamaConfiguratorProduct(productId: string | null | undefined) {
  return agamaConfiguratorProducts.find((product) => product.id === productId) ?? agamaConfiguratorProducts[0];
}
