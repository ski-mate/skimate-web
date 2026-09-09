"use client";

import { useState } from "react";
import Link from "next/link";
import { AtlasFacetRow, AtlasPanelTitle } from "./AtlasPanel";
import {
  COVERAGE_LABEL,
  toggle,
  type AtlasFacets,
  type AtlasFilters as Filters,
  type AtlasTotals,
} from "./atlas-data";
import type { Continent, Coverage } from "@/content/resorts/types";

const COVERAGE_DOT: Record<Coverage, string> = {
  live: "#007bfe",
  catalogued: "rgba(120,120,128,0.85)",
};

const COUNTRIES_SHOWN = 8;

export function AtlasFilters({
  filters,
  facets,
  totals,
  filtered,
  onChange,
  onReset,
}: {
  filters: Filters;
  facets: AtlasFacets;
  totals: AtlasTotals;
  filtered: number;
  onChange: (next: Filters) => void;
  onReset: () => void;
}) {
  const [allCountries, setAllCountries] = useState(false);
  const countries = allCountries
    ? facets.countries
    : facets.countries.slice(0, COUNTRIES_SHOWN);
  const hiddenCountries = facets.countries.length - countries.length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[var(--separator)] px-4 pb-3 pt-4">
        <p className="type-caption font-semibold uppercase tracking-[0.06em] text-[var(--label-3)]">
          Alpline Atlas
        </p>
        <h1 className="type-title mt-1 text-label">Every resort we know</h1>
        <p className="type-caption mt-1.5 text-label-3">
          {totals.resorts} resorts across {totals.countries} countries.{" "}
          <Link href="/resorts" className="text-link hover:underline">
            Browse the directory
          </Link>
          .
        </p>
      </div>

      <div className="px-4 py-3">
        <label className="sr-only" htmlFor="atlas-search">
          Search resorts
        </label>
        <div className="flex items-center gap-2 rounded-sm bg-[var(--fill)] px-2.5 py-1.5">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-label-4" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
            <path d="m10.6 10.6 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            id="atlas-search"
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Resort, region or country"
            className="type-footnote w-full bg-transparent text-label outline-none placeholder:text-label-4"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <AtlasPanelTitle>Coverage</AtlasPanelTitle>
        {facets.coverage.map((f) => (
          <AtlasFacetRow
            key={f.value}
            label={COVERAGE_LABEL[f.value]}
            count={f.count}
            dot={COVERAGE_DOT[f.value]}
            selected={filters.coverage.includes(f.value)}
            onClick={() =>
              onChange({ ...filters, coverage: toggle(filters.coverage, f.value) })
            }
          />
        ))}
        <p className="type-caption px-2 pt-1.5 text-label-4">
          Only resorts we have mapped are marked available. The rest are catalogued and
          not yet navigable.
        </p>

        <AtlasPanelTitle>Continent</AtlasPanelTitle>
        {facets.continents.map((f) => (
          <AtlasFacetRow
            key={f.value}
            label={f.label}
            count={f.count}
            selected={filters.continents.includes(f.value)}
            onClick={() =>
              onChange({
                ...filters,
                continents: toggle<Continent>(filters.continents, f.value),
              })
            }
          />
        ))}

        <AtlasPanelTitle count={`${facets.countries.length}`}>Country</AtlasPanelTitle>
        {countries.map((f) => (
          <AtlasFacetRow
            key={f.value}
            label={f.label}
            count={f.count}
            selected={filters.countries.includes(f.value)}
            onClick={() =>
              onChange({ ...filters, countries: toggle(filters.countries, f.value) })
            }
          />
        ))}
        {hiddenCountries > 0 || allCountries ? (
          <button
            type="button"
            onClick={() => setAllCountries((v) => !v)}
            className="type-caption px-2 py-1 text-link hover:underline"
          >
            {allCountries ? "Show fewer" : `+ ${hiddenCountries} more`}
          </button>
        ) : null}

        <AtlasPanelTitle>Vertical drop</AtlasPanelTitle>
        {facets.bands.map((f) => (
          <AtlasFacetRow
            key={f.value}
            label={f.label}
            count={f.count}
            selected={filters.bands.includes(f.value)}
            onClick={() => onChange({ ...filters, bands: toggle(filters.bands, f.value) })}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[var(--separator)] px-4 py-2.5">
        <span className="type-caption tabular-nums text-label-3">
          {filtered === totals.resorts
            ? `${totals.resorts} resorts`
            : `${filtered} of ${totals.resorts}`}
        </span>
        <button
          type="button"
          onClick={onReset}
          className="type-caption text-link hover:underline"
        >
          Reset filters
        </button>
      </div>
    </div>
  );
}
