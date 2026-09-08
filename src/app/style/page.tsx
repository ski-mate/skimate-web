import type { Metadata } from "next";
import {
  ChevronLink,
  Container,
  Footnotes,
  GalleryStrip,
  HalfTile,
  HeroTile,
  PromoCard,
  Reveal,
  SectionScheme,
  TileGrid,
} from "@/components/apple";

export const metadata: Metadata = {
  title: "Style reference",
  robots: { index: false, follow: false },
};

const TYPE_STEPS = [
  "type-display-1",
  "type-display-2",
  "type-display-3",
  "type-headline",
  "type-title",
  "type-eyebrow",
  "type-tagline",
  "type-body",
  "type-callout",
  "type-nav",
  "type-footnote",
  "type-caption",
];

const SWATCHES: { name: string; varName: string }[] = [
  { name: "bg", varName: "--bg" },
  { name: "bg-elevated", varName: "--bg-elevated" },
  { name: "label", varName: "--label" },
  { name: "label-2", varName: "--label-2" },
  { name: "label-3", varName: "--label-3" },
  { name: "link", varName: "--link" },
  { name: "separator", varName: "--separator" },
];

const PISTE = ["green", "blue", "red", "black", "orange"] as const;

/** Internal visual-QA surface. Not linked, not indexed, not in the sitemap. */
export default function StylePage() {
  return (
    <>
      <Container as="section" className="py-12">
        <h1 className="type-display-3">Style reference</h1>
        <p className="type-body mt-2 text-[var(--label-2)]">
          Every primitive in both schemes. Internal only.
        </p>
      </Container>

      <Container as="section" className="pb-12">
        <h2 className="type-title mb-4">Type ramp</h2>
        <div className="space-y-3 border-t border-[var(--separator)] pt-4">
          {TYPE_STEPS.map((step) => (
            <div key={step} className="flex flex-wrap items-baseline gap-x-4">
              <code className="type-caption w-32 shrink-0 text-[var(--label-3)]">
                {step}
              </code>
              <span className={step}>Navigate smarter, ski better</span>
            </div>
          ))}
        </div>
      </Container>

      {(["light", "dark"] as const).map((scheme) => (
        <SectionScheme key={scheme} scheme={scheme} className="py-12">
          <Container>
            <h2 className="type-title mb-4">Palette — {scheme}</h2>
            <div className="flex flex-wrap gap-3">
              {SWATCHES.map((s) => (
                <div key={s.name} className="w-28">
                  <div
                    className="h-14 w-full rounded-card border border-[var(--separator)]"
                    style={{ background: `var(${s.varName})` }}
                  />
                  <p className="type-caption mt-1 text-[var(--label-2)]">
                    {s.name}
                  </p>
                </div>
              ))}
            </div>

            <h3 className="type-title mb-3 mt-8">Piste difficulty</h3>
            <div className="flex flex-wrap gap-3">
              {PISTE.map((p) => (
                <div key={p} className="w-24">
                  <div
                    className="h-10 w-full rounded-card"
                    style={{ background: `var(--piste-${p})` }}
                  />
                  <p className="type-caption mt-1 text-[var(--label-2)]">{p}</p>
                </div>
              ))}
            </div>

            <h3 className="type-title mb-3 mt-8">Links</h3>
            <div className="flex flex-wrap items-center gap-6">
              <ChevronLink href="/style">Learn more</ChevronLink>
              <ChevronLink href="/style" variant="pill">
                Get Alpline
              </ChevronLink>
            </div>
          </Container>
        </SectionScheme>
      ))}

      <HeroTile
        scheme="dark"
        eyebrow="Alpline"
        headline="Know the mountain."
        tagline="Turn-by-turn guidance for every run, in your ears."
        actions={[
          { href: "/style", label: "Learn more" },
          { href: "/style", label: "Get Alpline", variant: "pill" },
        ]}
        media={
          <div className="mx-auto h-64 w-full max-w-[980px] rounded-t-large bg-[var(--bg-elevated)]" />
        }
      />

      <TileGrid className="mt-3">
        <HalfTile
          scheme="light"
          eyebrow="Tracking"
          headline="Every run, counted."
          tagline="Vertical, distance and speed, recorded automatically."
          actions={[{ href: "/style", label: "Learn more" }]}
          media={<div className="h-40 w-full bg-[var(--fill)]" />}
        />
        <HalfTile
          scheme="dark"
          eyebrow="Social"
          headline="Find your crew."
          tagline="See where everyone is, without the group chat."
          actions={[{ href: "/style", label: "Learn more" }]}
          media={<div className="h-40 w-full bg-[var(--fill)]" />}
        />
      </TileGrid>

      <SectionScheme scheme="auto" tone="elevated" className="py-12">
        <Container>
          <h2 className="type-title mb-4">Promo cards</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <PromoCard
              eyebrow="Alpline Pro"
              headline="Take the mountain offline."
              body="Download map packs before you lose signal."
              actions={[{ href: "/style", label: "See what's included" }]}
              className="!bg-[var(--bg)]"
            />
            <PromoCard
              eyebrow="Guide"
              headline="Learn every feature."
              body="Step-by-step help for everything Alpline does."
              actions={[{ href: "/style", label: "Open the guide" }]}
              className="!bg-[var(--bg)]"
            />
          </div>
        </Container>
      </SectionScheme>

      <SectionScheme scheme="auto" className="py-12">
        <Container className="mb-4">
          <h2 className="type-title">Gallery strip</h2>
        </Container>
        <GalleryStrip label="Example gallery">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 w-64 shrink-0 snap-start rounded-tile bg-[var(--bg-elevated)]"
            />
          ))}
        </GalleryStrip>
      </SectionScheme>

      <SectionScheme scheme="auto" className="py-12">
        <Container>
          <h2 className="type-title mb-4">Reveal</h2>
          <Reveal>
            <p className="type-body">This paragraph fades up on scroll.</p>
          </Reveal>
        </Container>
      </SectionScheme>

      <Footnotes
        items={[
          "Alpline Pro is required for offline map packs and live trail status.",
          "Feature availability varies by resort.",
        ]}
      />
    </>
  );
}
