import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /console is internal tooling behind authentication, and each of its
      // pages also sets `robots: noindex`. This is the belt to those braces.
      // /guide/console is the analyst manual: same allow-list as the console,
      // so it is disallowed here, noindexed in its layout, and served with an
      // x-robots-tag by middleware. Three belts, because a leak here is a leak
      // of internal cost and policy detail.
      disallow: ["/api/", "/style", "/console", "/guide/console"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
