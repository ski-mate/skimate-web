import Image from "next/image";
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

        <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2">
          {featureAreas.map((area, i) => (
            <li key={area.slug}>
              {/* The whole card is one link; the heading carries the accessible
                  name, so the image is decorative here and takes empty alt. */}
              <Link href={`/features/${area.slug}`} className="group block">
                <div className="relative aspect-[16/9] overflow-hidden rounded-tile bg-[var(--bg-elevated)]">
                  <Image
                    src={area.photo.src}
                    alt=""
                    fill
                    placeholder="blur"
                    blurDataURL={area.photo.blurDataURL}
                    // Only the first row is above the fold on a laptop.
                    loading={i < 2 ? "eager" : "lazy"}
                    sizes="(max-width: 734px) 100vw, 480px"
                    quality={80}
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                </div>
                <p className="type-caption mt-4 font-semibold uppercase tracking-[0.06em] text-[var(--label-3)]">
                  {area.name}
                </p>
                <h2 className="type-title mt-1 group-hover:underline underline-offset-[3px]">
                  {area.headline}
                </h2>
                <p className="type-callout mt-1.5 text-[var(--label-2)]">
                  {area.tagline}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </SectionScheme>
  );
}
