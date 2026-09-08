import { type ClassValue, clsx } from "clsx";
import type { Metadata } from "next";
import { twMerge } from "tailwind-merge";
import { site } from "@/content/site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL || site.url}${path}`;
}

export function constructMetadata({
  title = site.name,
  description = site.description,
  image = absoluteUrl("/og"),
  ...props
}: {
  title?: string;
  description?: string;
  image?: string;
  [key: string]: Metadata[keyof Metadata];
}): Metadata {
  return {
    title: {
      template: `%s | ${site.name}`,
      default: `${site.name} — ${site.tagline}`,
    },
    description,
    keywords: [...site.keywords],
    openGraph: {
      title,
      description,
      url: site.url,
      siteName: site.name,
      images: [{ url: image, width: 1200, height: 630, alt: site.name }],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    icons: { icon: "/favicon.ico", apple: "/appicon.png" },
    metadataBase: new URL(site.url),
    ...props,
  };
}
