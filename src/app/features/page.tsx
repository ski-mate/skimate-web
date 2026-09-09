import Link from "next/link";
import type { Metadata } from "next";
import { Container, SectionScheme } from "@/components/apple";
import { featureAreas } from "@/content/features";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Features",
  description:
    "Everything Alpline does on the mountain: piste-aware routing, turn-by-turn navigation, resort search, live friend locations, tracking and safety features.",
  path: "/features",
});

export default function FeaturesIndex() {
  return (
    <SectionScheme scheme="auto" className="py-section">
      <Container>
        <h1 className="type-display-2 text-balance">What Alpline does.</h1>
        <p className="type-tagline mt-3 max-w-[52ch] text-balance text-[var(--label-2)]">
          Eight areas, from finding your way down a run to finding the people
          you came with.
        </p>

        <ul className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2">
          {featureAreas.map((area) => (
            <li key={area.slug}>
              <h2 className="type-title">
                <Link
                  href={`/features/${area.slug}`}
                  className="hover:underline underline-offset-[3px]"
                >
                  {area.headline}
                </Link>
              </h2>
              <p className="type-callout mt-1.5 text-[var(--label-2)]">
                {area.tagline}
              </p>
              <Link
                href={`/features/${area.slug}`}
                className="type-callout mt-2 inline-block text-[var(--link)] hover:underline underline-offset-[3px]"
              >
                {area.name}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </SectionScheme>
  );
}
