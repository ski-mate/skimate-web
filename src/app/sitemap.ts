import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { guideSections, publishedArticles } from "@/content/guide";

/**
 * Static list rather than sniffing the request host, which made this route
 * dynamic and emitted preview-domain URLs into the sitemap.
 *
 * /style is deliberately excluded — it is an internal, noindex surface.
 */
const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/map", priority: 0.6, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes = routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Only published articles are listed; planned ones have no route.
  const guideRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/guide`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...guideSections.map((s) => ({
      url: `${SITE_URL}/guide/${s.id}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...publishedArticles.map((a) => ({
      url: `${SITE_URL}/guide/${a.section}/${a.slug}`,
      lastModified: new Date(a.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [...staticRoutes, ...guideRoutes];
}
