import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Graph } from "schema-dts";
import { ChevronLink, Container, SectionScheme } from "@/components/apple";
import { Breadcrumbs } from "@/components/guide/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { ResortMapLazy } from "@/components/resorts/ResortMapLazy";
import { getResort, liveResorts, relatedResorts, verticalDrop } from "@/content/resorts";
import type { Resort } from "@/content/resorts/types";
import { SITE_URL, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

/**
 * Only resorts Alpline has actually mapped get a page. Generating 200 thin
 * pages for resorts with no piste data would be padding, and would imply
 * coverage that does not exist.
 */
export function generateStaticParams() {
  return liveResorts.map((r) => ({ slug: r.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const resort = getResort(params.slug);
  if (!resort) return {};
  return pageMetadata({
    title: `${resort.name} piste map`,
    description: `Ski ${resort.name} with Alpline: the full piste and lift map for ${resort.region}, ${resort.country}, with skill-aware routing and turn-by-turn navigation.`,
    path: `/resorts/${resort.slug}`,
  });
}

function resortGraph(resort: Resort): Graph {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SkiResort",
        name: resort.name,
        url: `${SITE_URL}/resorts/${resort.slug}`,
        address: {
          "@type": "PostalAddress",
          addressRegion: resort.region,
          addressCountry: resort.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: resort.lat,
          longitude: resort.lng,
          elevation: resort.altitudeMax,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem" as const, position: 1, name: "Resorts", item: `${SITE_URL}/resorts` },
          {
            "@type": "ListItem" as const,
            position: 2,
            name: resort.name,
            item: `${SITE_URL}/resorts/${resort.slug}`,
          },
        ],
      },
    ],
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="type-caption text-[var(--label-3)]">{label}</dt>
      <dd className="type-title mt-0.5">{value}</dd>
    </div>
  );
}

export default function ResortPage({ params }: { params: { slug: string } }) {
  const resort = getResort(params.slug);
  if (!resort) notFound();

  const related = relatedResorts(resort);

  return (
    <>
      <JsonLd graph={resortGraph(resort)} />

      <SectionScheme scheme="dark" className="relative">
        <div className="absolute inset-0" aria-hidden="true">
          <ResortMapLazy resorts={[resort]} />
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black/90"
          aria-hidden="true"
        />
        <Container className="relative py-section">
          <Breadcrumbs
            trail={[
              { href: "/resorts", label: "Resorts" },
              { href: `/resorts/${resort.slug}`, label: resort.name },
            ]}
          />
          <p className="type-eyebrow mb-1">
            {resort.region}, {resort.country}
          </p>
          <h1 className="type-display-2 text-balance">{resort.name}</h1>

          <dl className="mt-8 grid max-w-[520px] grid-cols-2 gap-6 sm:grid-cols-3">
            <Stat label="Base" value={`${resort.altitudeMin.toLocaleString()} m`} />
            <Stat label="Summit" value={`${resort.altitudeMax.toLocaleString()} m`} />
            <Stat label="Vertical" value={`${verticalDrop(resort).toLocaleString()} m`} />
          </dl>
        </Container>
      </SectionScheme>

      <SectionScheme scheme="auto" className="py-section">
        <Container>
          <h2 className="type-display-3 text-balance">
            Every run and lift, mapped.
          </h2>
          <p className="type-body mt-3 max-w-[60ch] text-[var(--label-2)]">
            {resort.name} is fully mapped in Alpline. Search any run, lift or
            mountain restaurant, route between them along pistes rather than
            roads, and follow turn-by-turn guidance matched to the level you
            ski.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3">
            <ChevronLink href="/guide/navigation/get-directions">
              How routing works
            </ChevronLink>
            <ChevronLink href="/#waitlist" variant="pill">
              Get early access
            </ChevronLink>
          </div>

          {/* Weather, snow report and webcams land here once those feeds ship. */}
          <div className="mt-10 rounded-large border border-[var(--separator)] p-6">
            <p className="type-callout font-semibold">
              Conditions and webcams
            </p>
            <p className="type-callout mt-1 text-[var(--label-2)]">
              Live weather, snow depth and resort webcams are coming to resort
              pages in a future update.
            </p>
          </div>
        </Container>
      </SectionScheme>

      {related.length > 0 ? (
        <SectionScheme scheme="auto" tone="elevated" className="py-section">
          <Container>
            <h2 className="type-title mb-4">Nearby in {resort.country}</h2>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {related.map((r) => (
                <li key={r.slug}>
                  {r.coverage === "live" ? (
                    <Link
                      href={`/resorts/${r.slug}`}
                      className="type-callout text-[var(--link)] hover:underline underline-offset-[3px]"
                    >
                      {r.name}
                    </Link>
                  ) : (
                    <span className="type-callout text-[var(--label-3)]">
                      {r.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Container>
        </SectionScheme>
      ) : null}
    </>
  );
}
