import type { MetadataRoute } from "next";
import { traditions } from "@/lib/traditions";
import { getAllTextSlugs } from "@/lib/texts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://esophilo.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/traditions`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/library`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/ask`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  const traditionPages: MetadataRoute.Sitemap = traditions.map((t) => ({
    url: `${base}/tradition/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const textSlugs = await getAllTextSlugs();
  const textPages: MetadataRoute.Sitemap = textSlugs.map((slug) => ({
    url: `${base}/text/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...traditionPages, ...textPages];
}
