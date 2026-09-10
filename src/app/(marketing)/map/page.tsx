import type { Metadata } from "next";
import type { Graph } from "schema-dts";
import { ChevronLink, Container, SectionScheme } from "@/components/apple";
import { JsonLd } from "@/components/marketing/JsonLd";
import { MapClient } from "./map-client";
import { CONTINENT_ORDER, liveResorts, resorts } from "@/content/resorts";
import { SITE_URL } from "@/lib/seo";

const countries = new Set(resorts.map((r) => r.country)).size;

export const metadata: Metadata = {
  title: "Atlas",
  description: `Explore every ski resort in Alpline's catalogue on an interactive globe — ${resorts.length} resorts across ${countries} countries, filtered by coverage, continent and vertical drop.`,
  alternates: { canonical: `${SITE_URL}/map` },
  openGraph: {
    title: "Alpline Atlas",
    description: `Every ski resort in Alpline's catalogue on one globe: ${resorts.length} resorts across ${countries} countries.`,
    url: `${SITE_URL}/map`,
    type: "website",
    locale: "en_GB",
  },
};

const graph: Graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Alpline", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Atlas", item: `${SITE_URL}/map` },
      ],
    },
  ],
};

export default function MapPage() {
  return (
    <>
      <JsonLd graph={graph} />

      <h1 className="sr-only">
        Alpline Atlas — every ski resort in the catalogue
      </h1>
      <MapClient resorts={resorts} />

      {/* The globe is the page, but it should not be the last word on it: the
          coverage story below is the same one /resorts tells, in prose. */}
      <SectionScheme scheme="auto" className="border-t border-[var(--separator)] bg-bg">
        <Container className="py-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="type-eyebrow text-label">About the Atlas</p>
              <p className="type-callout mt-2 text-label-2">
                Every resort Alpline knows about, plotted from the same dataset the
                directory is built from. Nothing here is illustrative — if a number is
                shown, it was counted.
              </p>
            </div>
            <div>
              <p className="type-eyebrow text-label">Coverage</p>
              <p className="type-callout mt-2 text-label-2">
                {liveResorts.length} of {resorts.length} resorts are mapped and navigable
                today. The other {resorts.length - liveResorts.length} are catalogued:
                we know where they are, and we have not ingested their piste and lift
                networks yet.
              </p>
              <ChevronLink href="/resorts" className="mt-3">
                Browse the directory
              </ChevronLink>
            </div>
            <div>
              <p className="type-eyebrow text-label">Reach</p>
              <p className="type-callout mt-2 text-label-2">
                {countries} countries across {CONTINENT_ORDER.length} continents. Terrain
                and piste detail load as you zoom into a resort.
              </p>
              <ChevronLink href="/features/resorts" className="mt-3">
                How resort data works
              </ChevronLink>
            </div>
          </div>
        </Container>
      </SectionScheme>
    </>
  );
}
