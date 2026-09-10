import type { Metadata } from "next";
import { Container, SectionScheme } from "@/components/apple";
import { ResortDirectory } from "@/components/resorts/ResortDirectory";
import { MapCredit } from "@/components/resorts/MapCredit";
import { ResortMapLazy } from "@/components/resorts/ResortMapLazy";
import { liveResorts, resorts } from "@/content/resorts";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Ski resorts on Alpline",
  description:
    "Every resort Alpline maps today and the ones we are adding next, from the French Alps to Japan, Chile and the Rockies. Find yours and see what is live.",
  path: "/resorts",
});

const catalogued = resorts.filter((r) => r.coverage === "catalogued");

export default function ResortsPage() {
  return (
    <>
      <SectionScheme scheme="dark" className="relative">
        <div className="absolute inset-0">
          <ResortMapLazy resorts={resorts} />
        </div>
        {/* Legibility scrim over the map. */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/45 to-black/85"
          aria-hidden="true"
        />
        <MapCredit className="absolute bottom-3 right-gutter z-10" />
        <Container className="relative py-section text-center">
          <p className="type-eyebrow mb-1">Resorts</p>
          <h1 className="type-display-2 text-balance">Find your mountain.</h1>
          <p className="type-tagline mx-auto mt-3 max-w-[44ch] text-balance text-[var(--label-2)]">
            Alpline maps {liveResorts.length} resorts today, with{" "}
            {catalogued.length} more on the way.
          </p>
        </Container>
      </SectionScheme>

      <SectionScheme scheme="auto" className="py-section">
        <Container width="wide">
          <h2 className="type-display-3 mb-2">Available now</h2>
          <p className="type-body mb-8 max-w-[60ch] text-[var(--label-2)]">
            Every piste and lift in these resorts is mapped, so search, routing
            and turn-by-turn navigation all work.
          </p>
          <ResortDirectory resorts={liveResorts} />
        </Container>
      </SectionScheme>

      <SectionScheme scheme="auto" tone="elevated" className="py-section">
        <Container width="wide">
          <h2 className="type-display-3 mb-2">Coming next</h2>
          <p className="type-body mb-8 max-w-[60ch] text-[var(--label-2)]">
            These resorts are in the queue. We map a resort&rsquo;s full piste
            and lift network before listing it as available, so this list moves
            across as each one is finished.
          </p>
          <ResortDirectory resorts={catalogued} />
        </Container>
      </SectionScheme>
    </>
  );
}
