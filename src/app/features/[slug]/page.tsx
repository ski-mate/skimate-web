import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ChevronLink,
  Container,
  Footnotes,
  HeroTile,
  SectionScheme,
} from "@/components/apple";
import Image from "next/image";
import { Breadcrumbs } from "@/components/guide/Breadcrumbs";
import { StatusBadge } from "@/components/marketing/StatusBadge";
import { featureAreas, getFeatureArea } from "@/content/features";
import { guideSections } from "@/content/guide";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return featureAreas.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const area = getFeatureArea(params.slug);
  if (!area) return {};
  return pageMetadata({
    title: area.name,
    description: `${area.tagline} ${area.intro}`.slice(0, 158),
    path: `/features/${area.slug}`,
  });
}

export default function FeatureAreaPage({
  params,
}: {
  params: { slug: string };
}) {
  const area = getFeatureArea(params.slug);
  if (!area) notFound();

  const guide = area.guideSection
    ? guideSections.find(
        (s) =>
          s.id === area.guideSection &&
          s.articles.some((a) => a.status === "published")
      )
    : undefined;

  const anySoon = area.capabilities.some((c) => c.status === "soon");

  return (
    <>
      <HeroTile
        scheme="dark"
        size="tile"
        eyebrow={area.eyebrow}
        headline={area.headline}
        tagline={area.tagline}
        media={
          <Image
            src={area.photo.src}
            alt={area.photo.alt}
            width={area.photo.width}
            height={area.photo.height}
            placeholder="blur"
            blurDataURL={area.photo.blurDataURL}
            priority
            sizes="100vw"
            quality={78}
            className="h-auto w-full"
          />
        }
      />

      <SectionScheme scheme="auto" className="py-section">
        <Container>
          <Breadcrumbs
            trail={[
              { href: "/features", label: "Features" },
              { href: `/features/${area.slug}`, label: area.name },
            ]}
          />
          <p className="type-body max-w-[62ch] text-[var(--label-2)]">
            {area.intro}
          </p>

          <ul className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {area.capabilities.map((c) => (
              <li key={c.title}>
                <h2 className="type-title">
                  {c.title}
                  <StatusBadge status={c.status} pro={c.pro} />
                </h2>
                <p className="type-callout mt-1.5 text-[var(--label-2)]">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3">
            {guide ? (
              <ChevronLink href={`/guide/${guide.id}`}>
                How to use it
              </ChevronLink>
            ) : null}
            <ChevronLink href="/pricing">What Pro adds</ChevronLink>
            <ChevronLink href="/#waitlist" variant="pill">
              Get early access
            </ChevronLink>
          </div>
        </Container>
      </SectionScheme>

      <Footnotes
        items={[
          ...(anySoon
            ? [
                "Features marked “Coming soon” are in development and are not available today.",
              ]
            : []),
          "Features marked “Pro” require an Alpline Pro subscription. Safety features are never part of a paid tier.",
        ]}
      />
    </>
  );
}
