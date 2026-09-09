import {
  ChevronLink,
  Container,
  DeviceFrame,
  Footnotes,
  HalfTile,
  HeroTile,
  PromoCard,
  Reveal,
  SectionScheme,
  TileGrid,
} from "@/components/apple";
import type { Metadata } from "next";
import { EmailSignup } from "@/components/marketing/EmailSignup";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import Image from "next/image";
import {
  featureTiles,
  footnotes,
  halfTiles,
  hero,
  heroMedia,
  promos,
  type Media,
} from "@/content/home";
import { homeGraph } from "@/content/structured-data";
import { pageMetadata } from "@/lib/seo";

/** Muted label for capabilities that are not built yet. */
function ComingSoon() {
  return (
    <span className="type-caption ml-2 rounded-pill border border-[var(--separator)] px-2 py-0.5 align-middle text-[var(--label-3)]">
      Coming soon
    </span>
  );
}

/**
 * An atmospheric photograph, cropped to a band at the foot of a tile.
 *
 * `object-cover` at a fixed height rather than a fixed aspect ratio: these are
 * environment shots, so the crop can move without losing the subject, and a
 * consistent band height is what gives the tile stack its rhythm.
 */
function TilePhoto({ photo, height }: { photo: Media; height: string }) {
  return (
    <div className={`relative w-full overflow-hidden ${height}`}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        placeholder="blur"
        blurDataURL={photo.blurDataURL}
        sizes="(max-width: 1068px) 100vw, 720px"
        quality={82}
        style={{ objectPosition: photo.position ?? "center" }}
        className="object-cover"
      />
    </div>
  );
}

export const metadata: Metadata = pageMetadata({
  title: "Ski navigation with turn-by-turn guidance",
  description:
    "Alpline routes you along pistes and lifts, matches runs to your ability and shows your friends on the map. Free on iPhone, no ads.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <JsonLd graph={homeGraph()} />
      <HeroTile
        scheme="dark"
        eyebrow={hero.eyebrow}
        headline={hero.headline}
        tagline={hero.tagline}
        actions={[
          { href: hero.primary.href, label: hero.primary.label, variant: "pill" },
          { href: hero.secondary.href, label: hero.secondary.label },
        ]}
        media={
          <Image
            src={heroMedia.src}
            alt={heroMedia.alt}
            width={heroMedia.width}
            height={heroMedia.height}
            placeholder="blur"
            blurDataURL={heroMedia.blurDataURL}
            priority
            sizes="100vw"
            quality={78}
            className="h-auto w-full"
          />
        }
      />

      {featureTiles.map((tile, i) => (
        <HeroTile
          key={tile.id}
          size="tile"
          // Pinned, not "auto": on apple.com the tile rhythm is fixed, so a
          // light tile stays light even when the visitor's OS is dark.
          scheme={i % 2 === 0 ? "light" : "dark"}
          tone={i % 2 === 0 ? "elevated" : "base"}
          eyebrow={tile.eyebrow}
          headline={tile.headline}
          tagline={tile.tagline}
          actions={[{ href: tile.href, label: "Learn more" }]}
          media={
            tile.media ? (
              <DeviceFrame
                src={tile.media.src}
                alt={tile.media.alt}
                blurDataURL={tile.media.blurDataURL}
                width={300}
                className="-mb-24"
              />
            ) : tile.photo ? (
              <TilePhoto photo={tile.photo} height="h-[280px] md:h-[420px]" />
            ) : undefined
          }
          className="mt-3"
        />
      ))}

      <TileGrid className="mt-3">
        {halfTiles.map((tile, i) => (
          <HalfTile
            key={tile.id}
            scheme={i % 2 === 0 ? "light" : "dark"}
            tone={i % 2 === 0 ? "elevated" : "base"}
            eyebrow={tile.eyebrow}
            headline={tile.headline}
            tagline={
              <>
                {tile.tagline}
                {tile.status === "soon" ? <ComingSoon /> : null}
              </>
            }
            actions={[{ href: tile.href, label: "Learn more" }]}
            media={
              tile.media ? (
                <DeviceFrame
                  src={tile.media.src}
                  alt={tile.media.alt}
                  blurDataURL={tile.media.blurDataURL}
                  width={260}
                  className="-mb-20"
                />
              ) : tile.photo ? (
                <TilePhoto photo={tile.photo} height="h-[220px]" />
              ) : undefined
            }
          />
        ))}
      </TileGrid>

      <SectionScheme scheme="auto" className="py-section">
        <Container>
          <Reveal>
            <div className="grid gap-4 md:grid-cols-2">
              {promos.map((promo) => (
                <PromoCard
                  key={promo.id}
                  eyebrow={promo.eyebrow}
                  headline={promo.headline}
                  body={promo.body}
                  actions={[{ href: promo.href, label: promo.ctaLabel }]}
                />
              ))}
            </div>
          </Reveal>
        </Container>
      </SectionScheme>

      <SectionScheme scheme="auto" tone="elevated" className="py-section">
        <Container className="text-center">
          <h2 className="type-display-3 text-balance">
            Free to use. Pro when you need it.
          </h2>
          <p className="type-tagline mx-auto mt-3 max-w-[44ch] text-balance text-[var(--label-2)]">
            The map, routing, navigation and friends are free, with no ads.
            Alpline Pro adds offline maps and live trail status.
          </p>
          <div className="mt-5 flex justify-center">
            <ChevronLink href="/pricing">Compare Free and Pro</ChevronLink>
          </div>
        </Container>
      </SectionScheme>

      <FaqAccordion />
      <EmailSignup />
      <Footnotes items={footnotes} />
    </>
  );
}
