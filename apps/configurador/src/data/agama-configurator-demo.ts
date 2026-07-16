import { getAgamaColorByCode } from "@/data/agama-colors";
import type { AgamaColor } from "@/lib/configurator-types";

export type DemoConfiguratorColor = AgamaColor & {
  shortDescription: string;
  availabilityLabel: string;
  visualNote?: string | null;
  pricePerKgMxn?: number | null;
};

function requireColor(code: string) {
  const color = getAgamaColorByCode(code);
  if (!color) {
    throw new Error(`No se encontro el color requerido para el MVP: ${code}`);
  }

  return color;
}

const mb103 = requireColor("MB-103");
const mb106 = requireColor("MB-106");
const mb110 = requireColor("MB-110");

const mb110Demo: DemoConfiguratorColor = {
  ...mb110,
  shortDescription: "Negro técnico de lectura sólida para validar contraste, volumen y presencia visual del render.",
  availabilityLabel: "Consultar disponibilidad",
  visualNote: "MB-110 se utiliza en este MVP como tercera referencia visual claramente diferenciada.",
};

export const DEMO_CONFIGURATOR_COLORS: DemoConfiguratorColor[] = [
  {
    ...mb103,
    shortDescription: "Tono vibrante pensado para piezas de alta visibilidad y lectura inmediata en exhibición.",
    availabilityLabel: "Consultar disponibilidad",
    visualNote: null,
  },
  {
    ...mb106,
    shortDescription: "Azul corporativo de presencia limpia, adecuado para aplicaciones industriales y comerciales.",
    availabilityLabel: "Consultar disponibilidad",
    visualNote: null,
  },
  mb110Demo,
];

export function getDemoConfiguratorColorByCode(code: string | null | undefined) {
  if (!code) return null;
  return DEMO_CONFIGURATOR_COLORS.find((color) => color.code === code) ?? null;
}
