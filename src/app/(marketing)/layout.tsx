import { GlobalNav } from "@/components/apple/GlobalNav";
import { SiteFooter } from "@/components/apple/SiteFooter";

/** Public site chrome. Everything under /console deliberately opts out of it. */
export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-card focus:bg-[var(--bg)] focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <GlobalNav />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
