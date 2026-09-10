import type { Metadata } from "next";
import { ChevronLink, Container, SectionScheme } from "@/components/apple";
import { GlobalNav } from "@/components/apple/GlobalNav";
import { SiteFooter } from "@/components/apple/SiteFooter";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * Apple's 404 does one useful thing: it offers the places you were probably
 * trying to reach. A dead end with a joke on it is worse than a short menu.
 */
export default function NotFound() {
  return (
    <>
      <GlobalNav />
      <SectionScheme scheme="auto" className="py-section">
        <Container className="text-center">
          <p className="type-eyebrow text-[var(--label-3)]">Error 404</p>
          <h1 className="type-display-3 mt-1 text-balance">
            We can&rsquo;t find that page.
          </h1>
          <p className="type-tagline mx-auto mt-3 max-w-[44ch] text-balance text-[var(--label-2)]">
            The link may be out of date, or the page may have moved. Here is
            where most people are heading.
          </p>

          <nav
            aria-label="Popular pages"
            className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          >
            <ChevronLink href="/">Home</ChevronLink>
            <ChevronLink href="/features">Features</ChevronLink>
            <ChevronLink href="/resorts">Resorts</ChevronLink>
            <ChevronLink href="/guide">Guide</ChevronLink>
            <ChevronLink href="/pricing">Pricing</ChevronLink>
          </nav>
        </Container>
      </SectionScheme>
      <SiteFooter />
    </>
  );
}
