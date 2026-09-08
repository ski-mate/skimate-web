import {
  ChevronLink,
  Container,
  Footnotes,
  HalfTile,
  HeroTile,
  PromoCard,
  Reveal,
  SectionScheme,
  TileGrid,
} from "@/components/apple";
import { EmailSignup } from "@/components/marketing/EmailSignup";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import Image from "next/image";
import {
  featureTiles,
  footnotes,
  halfTiles,
  hero,
  heroMedia,
  promos,
} from "@/content/home";

/** Muted label for capabilities that are not built yet. */
function ComingSoon() {
  return (
    <span className="type-caption ml-2 rounded-pill border border-[var(--separator)] px-2 py-0.5 align-middle text-[var(--label-3)]">
      Coming soon
    </span>
  );
}

/**
 * Placeholder media. Replaced with device-framed simulator screenshots and
 * MapTiler renders in the imagery phase.
 */
function MediaPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`w-full bg-[var(--fill)] ${className}`}
    />
  );
}

export default function HomePage() {
  return (
    <>
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
          <div className="mx-auto max-w-content overflow-hidden rounded-t-large">
            <Image
              src={heroMedia.src}
              alt={heroMedia.alt}
              width={heroMedia.width}
              height={heroMedia.height}
              placeholder="blur"
              blurDataURL={heroMedia.blurDataURL}
              priority
              sizes="(max-width: 734px) 100vw, 980px"
              quality={82}
              className="h-auto w-full"
            />
          </div>
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
            <MediaPlaceholder className="mx-auto h-[360px] max-w-content rounded-t-large" />
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
            media={<MediaPlaceholder className="h-[200px]" />}
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
