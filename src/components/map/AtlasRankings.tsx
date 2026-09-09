"use client";

import { AtlasPanel, AtlasPanelTitle } from "./AtlasPanel";
import type { NationRow, RankList } from "./atlas-data";

/**
 * The ranked lists read off the filtered set, so narrowing to Japan turns
 * "Highest summits" into "highest summits in Japan" with no extra control.
 * Bars are proportional to the leader, which is why the top row is always full.
 */
export function AtlasRankings({
  lists,
  nations,
  selectedSlug,
  selectedCountries,
  onSelect,
  onSelectCountry,
}: {
  lists: RankList[];
  nations: NationRow[];
  selectedSlug: string | null;
  selectedCountries: string[];
  onSelect: (slug: string) => void;
  onSelectCountry: (country: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {lists.map((list) => (
        <AtlasPanel key={list.id}>
          <AtlasPanelTitle>{list.title}</AtlasPanelTitle>
          <ul className="px-2 pb-2">
            {list.rows.length === 0 ? (
              <li className="type-caption px-2 py-1.5 text-label-4">
                No resorts match the filters.
              </li>
            ) : (
              list.rows.map((row) => (
                <li key={row.slug}>
                  <button
                    type="button"
                    onClick={() => onSelect(row.slug)}
                    aria-current={row.slug === selectedSlug ? "true" : undefined}
                    className={`w-full rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-[var(--fill)] ${
                      row.slug === selectedSlug ? "bg-[var(--fill-strong)]" : ""
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="type-footnote truncate text-label">{row.label}</span>
                      <span className="type-caption shrink-0 tabular-nums text-label-3">
                        {row.display}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-[3px] min-w-0 flex-1 overflow-hidden rounded-pill bg-[var(--fill-strong)]"
                      >
                        <span
                          className="block h-full rounded-pill bg-[var(--ios-blue)]"
                          style={{ width: `${Math.max(6, row.fraction * 100)}%` }}
                        />
                      </span>
                      <span className="type-caption max-w-[45%] shrink-0 truncate text-label-4">
                        {row.sublabel}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </AtlasPanel>
      ))}

      <AtlasPanel>
        <AtlasPanelTitle>Ski nations</AtlasPanelTitle>
        <ul className="px-2 pb-2">
          {nations.map((n) => (
            <li key={n.country}>
              <button
                type="button"
                onClick={() => onSelectCountry(n.country)}
                aria-pressed={selectedCountries.includes(n.country)}
                className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-[var(--fill)] ${
                  selectedCountries.includes(n.country) ? "bg-[var(--fill-strong)]" : ""
                }`}
              >
                <span className="type-footnote w-[7.5rem] shrink-0 truncate text-label">
                  {n.country}
                </span>
                <span
                  aria-hidden="true"
                  className="h-[3px] min-w-0 flex-1 overflow-hidden rounded-pill bg-[var(--fill-strong)]"
                >
                  <span
                    className="block h-full rounded-pill bg-[var(--ios-blue)]"
                    style={{ width: `${Math.max(6, n.fraction * 100)}%` }}
                  />
                </span>
                <span className="type-caption w-6 shrink-0 text-right tabular-nums text-label-3">
                  {n.count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </AtlasPanel>
    </div>
  );
}
