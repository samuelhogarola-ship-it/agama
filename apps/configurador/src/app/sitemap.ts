import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.agama.com.mx";
  return [{ url: `${siteUrl}/configurador`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
}
