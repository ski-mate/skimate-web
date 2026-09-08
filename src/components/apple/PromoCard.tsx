import { cn } from "@/lib/utils";
import { ChevronLink } from "./ChevronLink";
import type { TileAction } from "./HeroTile";
import type { ReactNode } from "react";

/** Rounded promo card, used for secondary messages inside the content column. */
export function PromoCard({
  eyebrow,
  headline,
  body,
  actions = [],
  media,
  className,
}: {
  eyebrow?: ReactNode;
  headline: ReactNode;
  body?: ReactNode;
  actions?: TileAction[];
  media?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-large bg-[var(--bg-elevated)] p-8 text-center",
        className
      )}
    >
      {eyebrow ? (
        <p className="type-footnote font-semibold uppercase tracking-wide text-[var(--label-3)]">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="type-title mt-1 text-balance">{headline}</h3>
      {body ? (
        <p className="type-callout mt-2 text-balance text-[var(--label-2)]">
          {body}
        </p>
      ) : null}
      {actions.length > 0 ? (
        <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
          {actions.map((a) => (
            <ChevronLink key={a.href + a.label} href={a.href} variant={a.variant}>
              {a.label}
            </ChevronLink>
          ))}
        </div>
      ) : null}
      {media ? <div className="mt-6">{media}</div> : null}
    </div>
  );
}
