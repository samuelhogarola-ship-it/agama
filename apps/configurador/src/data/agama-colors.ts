import { GENERATED_AGAMA_COLORS, GENERATED_AGAMA_COLOR_FAMILY_ORDER } from "@/data/agama-colors.generated";
import { AGAMA_COLOR_VALIDATIONS } from "@/data/agama-color-validations";
import type { AgamaColor, AgamaColorFamily } from "@/lib/configurator-types";

export const agamaColors: AgamaColor[] = GENERATED_AGAMA_COLORS.map((color) => {
  const validation = AGAMA_COLOR_VALIDATIONS[color.code];
  if (!validation) {
    return color;
  }

  return {
    ...color,
    hex: validation.hex,
    validationStatus: "validated",
  };
});

export const agamaColorFamilyOrder = [...GENERATED_AGAMA_COLOR_FAMILY_ORDER] as AgamaColorFamily[];

export const agamaColorCounts = {
  total: agamaColors.length,
  validated: agamaColors.filter((color) => color.validationStatus === "validated").length,
  pending: agamaColors.filter((color) => color.validationStatus === "pending").length,
  withSwatch: agamaColors.filter((color) => color.swatchAssetUrl).length,
};

export function getAgamaColorByCode(code: string | null | undefined) {
  if (!code) return null;
  return agamaColors.find((color) => color.code === code) ?? null;
}

export function getAgamaColorFamilies() {
  const availableFamilies = new Set(agamaColors.map((color) => color.family));
  return agamaColorFamilyOrder.filter((family) => availableFamilies.has(family));
}
