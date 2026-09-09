import type { Metadata } from "next";
import { site } from "@/content/site";

/** Canonical origin. Previews may override; production is always getalpline.com. */
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || site.url;

export function absoluteUrl(path = "") {
  return `${SITE_URL}${path}`;
}

/**
 * Per-route metadata.
 *
 * `title` is the page-specific part; the root layout's template appends the
 * brand, so keep it short enough that the composed string lands in 50-60 chars.
 * Descriptions should sit in the 150-160 range.
 */
export function pageMetadata({
  title,
  description,
  path = "",
  image,
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      type: "website",
      locale: "en_GB",
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
