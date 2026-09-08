import { cn } from "@/lib/utils";
import { ChevronLink } from "./ChevronLink";
import { SectionScheme, type Scheme } from "./SectionScheme";
import type { TileAction } from "./HeroTile";
import type { ReactNode } from "react";

/** Half-width tile: the hero anatomy at display-3 scale, for the 2-up grid. */
export function HalfTile({
  scheme = "auto",
  tone = "elevated",
  eyebrow,
  headline,
  tagline,
  actions = [],
  media,
  className,
}: {
  scheme?: Scheme;
  tone?: "base" | "elevated";
  eyebrow?: ReactNode;
  headline: ReactNode;
  tagline?: ReactNode;
  actions?: TileAction[];
  media?: ReactNode;
  className?: string;
}) {
  return (
    <SectionScheme
      scheme={scheme}
      tone={tone}
      className={cn(
        "flex min-h-[560px] flex-col items-center overflow-hidden pt-[68px] text-center",
        className
      )}
    >
      <div className="px-gutter">
        {eyebrow ? (
          <p className="type-eyebrow mb-1 text-[var(--label)]">{eyebrow}</p>
        ) : null}
        <h3 className="type-display-3 text-balance">{headline}</h3>
        {tagline ? (
          <p className="type-tagline mx-auto mt-3 max-w-[32ch] text-balance text-[var(--label-2)]">
            {tagline}
          </p>
        ) : null}
        {actions.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {actions.map((a) => (
              <ChevronLink key={a.href + a.label} href={a.href} variant={a.variant}>
                {a.label}
              </ChevronLink>
            ))}
          </div>
        ) : null}
      </div>

      {media ? <div className="mt-auto w-full pt-8">{media}</div> : null}
    </SectionScheme>
  );
}
