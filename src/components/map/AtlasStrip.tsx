"use client";

import type { Resort } from "@/content/resorts/types";

const CHIP_LIMIT = 120;

/**
 * The current view, spelled out. A globe alone cannot tell you what is on the
 * far side of it, so every resort matching the filters is also listed here.
 */
export function AtlasStrip({
  resorts,
  selectedSlug,
  onSelect,
}: {
  resorts: Resort[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}) {
  const shown = resorts.slice(0, CHIP_LIMIT);
  const overflow = resorts.length - shown.length;

  return (
    <div className="flex max-h-full min-h-0 flex-col">
      <div className="flex items-baseline gap-2 px-4 pb-1.5 pt-3">
        <h2 className="type-caption font-semibold uppercase tracking-[0.06em] text-[var(--label-3)]">
          Current view
        </h2>
        <span className="type-caption tabular-nums text-label-4">
          {resorts.length} {resorts.length === 1 ? "resort" : "resorts"}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 [mask-image:linear-gradient(to_bottom,#000_calc(100%-24px),transparent)]">
        {resorts.length === 0 ? (
          <p className="type-footnote px-1 py-2 text-label-3">
            Nothing matches those filters.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {shown.map((r) => (
              <li key={r.slug}>
                <button
                  type="button"
                  onClick={() => onSelect(r.slug)}
                  aria-current={r.slug === selectedSlug ? "true" : undefined}
                  className={`flex items-center gap-1.5 rounded-pill border px-2.5 py-1 transition-colors ${
                    r.slug === selectedSlug
                      ? "border-transparent bg-[var(--ios-blue)] text-white"
                      : "border-[var(--separator)] bg-[var(--bg)] text-label-2 hover:bg-[var(--fill)]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="h-[6px] w-[6px] rounded-full"
                    style={{
                      background:
                        r.slug === selectedSlug
                          ? "#ffffff"
                          : r.coverage === "live"
                            ? "#007bfe"
                            : "rgba(120,120,128,0.85)",
                    }}
                  />
                  <span className="type-caption whitespace-nowrap">{r.name}</span>
                </button>
              </li>
            ))}
            {overflow > 0 ? (
              <li className="type-caption self-center px-1 text-label-4">
                + {overflow} more — narrow the filters to see them
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </div>
  );
}
