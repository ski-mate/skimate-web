import { Analytics } from "@vercel/analytics/next";
import { siteConfig } from "@/lib/config";
import { fontInter } from "@/lib/fonts";
import { constructMetadata } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = constructMetadata({
  title: `${siteConfig.name} | ${siteConfig.description}`,
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
