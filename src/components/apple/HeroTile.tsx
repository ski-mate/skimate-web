import { cn } from "@/lib/utils";
import { ChevronLink } from "./ChevronLink";
import { Container } from "./Container";
import { SectionScheme, type Scheme } from "./SectionScheme";
import type { ReactNode } from "react";

export interface TileAction {
  href: string;
  /**
   * ReactNode rather than string so a repeated visible label like "Learn more"
   * can carry a visually-hidden suffix naming its destination. Six identical
   * "Learn more" links on one page are ambiguous to a screen reader and are
   * flagged by Lighthouse as non-descriptive.
   */
  label: ReactNode;
  variant?: "default" | "pill";
}

/**
 * The full-bleed hero tile.
 *
 * Anatomy, top to bottom: eyebrow, a very large tight-tracked headline, a
 * one-line tagline, a pair of CTAs, then media. `mediaFit="bleed"` lets the
 * image run to the section's bottom edge, which is what gives these tiles
 * their characteristic silhouette; `contain` keeps it inside the padding.
 */
export function HeroTile({
  scheme = "auto",
  tone = "base",
  eyebrow,
  headline,
  tagline,
  actions = [],
  media,
  mediaFit = "bleed",
  size = "hero",
  className,
}: {
  scheme?: Scheme;
  tone?: "base" | "elevated";
  eyebrow?: ReactNode;
  headline: ReactNode;
  tagline?: ReactNode;
  actions?: TileAction[];
  media?: ReactNode;
  mediaFit?: "bleed" | "contain";
  /** `hero` is the flagship top-of-page size; `tile` is the repeating size. */
  size?: "hero" | "tile";
  className?: string;
}) {
  return (
    <SectionScheme
      scheme={scheme}
      tone={tone}
      className={cn(
        "relative overflow-hidden text-center",
        mediaFit === "bleed" ? "pb-0" : "pb-[var(--section-y)]",
        className
      )}
    >
      <Container className="pt-[var(--section-y)]">
        {eyebrow ? (
          <p className="type-eyebrow mb-1 text-[var(--label)]">{eyebrow}</p>
        ) : null}

        <h2
          className={cn(
            "text-balance",
            size === "hero" ? "type-display-1" : "type-display-2"
          )}
        >
          {headline}
        </h2>

        {tagline ? (
          <p className="type-tagline mx-auto mt-3 max-w-[36ch] text-balance text-[var(--label-2)]">
            {tagline}
          </p>
        ) : null}

        {actions.length > 0 ? (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            {actions.map((a, i) => (
              <ChevronLink key={`${a.href}-${i}`} href={a.href} variant={a.variant}>
                {a.label}
              </ChevronLink>
            ))}
          </div>
        ) : null}
      </Container>

      {media ? (
        <div
          className={cn(
            "mt-8",
            mediaFit === "contain" && "container-content"
          )}
        >
          {media}
        </div>
      ) : null}
    </SectionScheme>
  );
}
