import { Analytics } from "@vercel/analytics/next";
import { GlobalNav } from "@/components/apple/GlobalNav";
import { SiteFooter } from "@/components/apple/SiteFooter";
import { site } from "@/content/site";
import { fontInter } from "@/lib/fonts";
import { constructMetadata } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = constructMetadata({
  title: `${site.name} — ${site.tagline}`,
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // "auto" follows the OS. Marketing sections pin their own scheme locally,
    // so a dark tile stays dark under a light system theme.
    <html lang="en" data-scheme="auto" className={fontInter.variable}>
      <body className="min-h-screen scroll-smooth">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-card focus:bg-[var(--bg)] focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <GlobalNav />
        <main id="main">{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
