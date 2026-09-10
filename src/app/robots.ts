import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /console is internal tooling behind authentication, and each of its
      // pages also sets `robots: noindex`. This is the belt to those braces.
      disallow: ["/api/", "/style", "/console"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
