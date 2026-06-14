import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const articulat = localFont({
  src: [
    {
      path: "../fonts/ArticulatCF-Normal.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/ArticulatCF-DemiBold.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/ArticulatCF-Bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-articulat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://clientes.agama.com.mx"),
  title: {
    default: "AGAMA Commerce Portal",
    template: "%s | AGAMA Commerce Portal",
  },
  description:
    "Portal B2B/B2C de AGAMA Colores para catalogo, pedidos, mensajes y gestion comercial.",
  applicationName: "AGAMA Commerce Portal",
  appleWebApp: {
    capable: true,
    title: "AGAMA Portal",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/brand/logo-circulo.png",
    apple: "/brand/logo-circulo.png",
    shortcut: "/brand/logo-circulo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-MX"
      className={`${articulat.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
