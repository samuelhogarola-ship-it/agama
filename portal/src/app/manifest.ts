import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AGAMA Commerce Portal",
    short_name: "AGAMA Portal",
    description: "Portal comercial B2B/B2C de AGAMA Colores.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1439ab",
    lang: "es-MX",
    icons: [
      {
        src: "/brand/logo-circulo.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/brand/logo-circulo.webp",
        sizes: "512x512",
        type: "image/webp",
      },
    ],
  };
}
