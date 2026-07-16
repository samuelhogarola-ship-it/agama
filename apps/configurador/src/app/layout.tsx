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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.agama.com.mx"),
  title: {
    default: "AGAMA Configurador",
    template: "%s | AGAMA Configurador",
  },
  description: "Configurador visual de colores AGAMA con datos reales y arquitectura extensible.",
  applicationName: "AGAMA Configurador",
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
    <html lang="es-MX" className={`${articulat.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
