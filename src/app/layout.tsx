import { Analytics } from "@vercel/analytics/next";
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

/**
 * The root layout carries only the document. Site chrome lives one level down:
 * the (marketing) group owns the global nav and footer, the (console) group
 * owns the workstation shell. They share nothing but tokens.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // "auto" follows the OS. Marketing sections pin their own scheme locally,
    // so a dark tile stays dark under a light system theme.
    <html lang="en" data-scheme="auto" className={fontInter.variable}>
      <body className="min-h-screen scroll-smooth">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
