import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const portalRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ozexoekvshuhtkrleuze.supabase.co",
      },
      {
        protocol: "https",
        hostname: "cdn.prod.website-files.com",
      },
    ],
  },
  turbopack: {
    root: portalRoot,
  },
};

export default nextConfig;
