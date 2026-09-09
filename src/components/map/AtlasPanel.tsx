import type { ReactNode } from "react";

/**
 * The floating chrome every Atlas panel is built from: iOS chrome material
 * (72% white + saturate/blur), hairline border, and the double-shadow recipe
 * from apple-ui-brain/00-foundations/materials.md. The `@supports` fallback
 * lives in globals.css so browsers without backdrop-filter get an opaque card
 * rather than unreadable text over terrain.
 */
export function AtlasPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`material-panel rounded-tile border border-[var(--separator)] shadow-float ${className}`}
    >
      {children}
    </div>
  );
}

export function AtlasPanelTitle({
  children,
  count,
}: {
  children: ReactNode;
  count?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 pt-3 pb-2">
      <h2 className="type-caption font-semibold uppercase tracking-[0.06em] text-[var(--label-3)]">
        {children}
      </h2>
      {count ? (
        <span className="type-caption tabular-nums text-[var(--label-4)]">{count}</span>
      ) : null}
    </div>
  );
}

/** A single selectable facet row: dot, label, count. */
export function AtlasFacetRow({
  label,
  count,
  selected,
  dot,
  onClick,
}: {
  label: string;
  count: number;
  selected: boolean;
  dot?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-2 rounded-sm px-2 py-[5px] text-left transition-colors hover:bg-[var(--fill)] ${
        selected ? "bg-[var(--fill-strong)]" : ""
      }`}
    >
      <span
        aria-hidden="true"
        className="h-[7px] w-[7px] shrink-0 rounded-full"
        style={{ background: dot ?? "var(--label-4)" }}
      />
      <span
        className={`type-footnote flex-1 truncate ${
          selected ? "font-semibold text-[var(--label)]" : "text-[var(--label-2)]"
        }`}
      >
        {label}
      </span>
      <span className="type-caption tabular-nums text-[var(--label-4)]">{count}</span>
    </button>
  );
}
