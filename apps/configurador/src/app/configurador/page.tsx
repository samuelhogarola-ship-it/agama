import type { Metadata } from "next";

import { ConfiguratorPage } from "@/components/configurator/configurator-page";
import { getColorsFromSupabase } from "@/lib/configurator-db";

const CONFIGURATOR_SHARE_IMAGE = "/previews/configurador-default-preview.png";

export const metadata: Metadata = {
  title: "Configurador de Color",
  description: "Explora el configurador visual de colores AGAMA y encuentra la referencia ideal para tu producto.",
  alternates: {
    canonical: "/configurador",
    languages: {
      "es-MX": "/configurador",
    },
  },
  openGraph: {
    title: "AGAMA Colour Viewer",
    description: "Mejor compara nuestros colores. Encuentra lo que necesitas con visualización precisa de pigmentos y masterbatch.",
    url: "/configurador",
    type: "website",
    locale: "es_MX",
    images: [
      {
        url: CONFIGURATOR_SHARE_IMAGE,
        width: 1280,
        height: 1280,
        alt: "AGAMA Colour Viewer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AGAMA Colour Viewer",
    description: "Mejor compara nuestros colores y explora la gama AGAMA.",
    images: [CONFIGURATOR_SHARE_IMAGE],
  },
};

const SCHEMA_ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AGAMA Configurador de Color",
  description: "Configurador visual de colores AGAMA. Explora masterbatch y pigmentos con visualización en tiempo real.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "/configurador",
  provider: {
    "@type": "Organization",
    name: "AGAMA",
    url: "https://agama.mx",
  },
};

export default async function ConfiguratorRoute({
  searchParams,
}: {
  searchParams: Promise<{
    color?: string;
  }>;
}) {
  const params = await searchParams;
  const colors = await getColorsFromSupabase();
  const requestedColorCode = params.color?.trim().toUpperCase() ?? null;
  const initialColorCode = requestedColorCode && colors.some((color) => color.code === requestedColorCode)
    ? requestedColorCode
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_ORG_JSON_LD) }}
      />
      <ConfiguratorPage
        colors={colors}
        initialColorCode={initialColorCode}
      />
    </>
  );
}
