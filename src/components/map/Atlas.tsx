"use client";

import { useCallback, useMemo, useState } from "react";
import { AtlasFilters } from "./AtlasFilters";
import { AtlasGlobe } from "./AtlasGlobe";
import { AtlasPanel } from "./AtlasPanel";
import { AtlasRankings } from "./AtlasRankings";
import { AtlasResortCard } from "./AtlasResortCard";
import { AtlasStrip } from "./AtlasStrip";
import {
  EMPTY_FILTERS,
  applyFilters,
  buildFacets,
  buildNations,
  buildRankings,
  toggle,
  totals as computeTotals,
  type AtlasFilters as Filters,
} from "./atlas-data";
import type { Resort } from "@/content/resorts/types";

/**
 * The Atlas: one globe, with everything that describes it arranged around the
 * edge. Filters on the left drive the globe, the ranked lists and the strip at
 * once, so the three panels are always describing the same set of resorts.
 */
export function Atlas({ resorts }: { resorts: Resort[] }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const filtered = useMemo(() => applyFilters(resorts, filters), [resorts, filters]);
  const visible = useMemo(() => new Set(filtered.map((r) => r.slug)), [filtered]);
  const facets = useMemo(() => buildFacets(resorts, filters), [resorts, filters]);
  const rankings = useMemo(() => buildRankings(filtered), [filtered]);
  const nations = useMemo(() => buildNations(filtered), [filtered]);
  const totals = useMemo(() => computeTotals(resorts), [resorts]);

  const selected = useMemo(
    () => resorts.find((r) => r.slug === selectedSlug) ?? null,
    [resorts, selectedSlug]
  );

  const reset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setSelectedSlug(null);
  }, []);

  return (
    <div className="relative flex flex-col lg:block lg:h-[calc(100svh-var(--nav-h))] lg:min-h-[660px]">
      <div className="relative h-[46svh] min-h-[280px] lg:absolute lg:inset-0 lg:h-auto lg:min-h-0">
        <AtlasGlobe
          resorts={resorts}
          visible={visible}
          selected={selected}
          onSelect={setSelectedSlug}
        />
      </div>

      {/* `lg:contents` dissolves this wrapper on wide screens so each panel can
          float over the globe; below 1069px the panels are ordinary blocks
          stacked under it, which is far more usable than sheets on a phone. */}
      <div className="flex flex-col gap-3 p-gutter lg:contents">
        <AtlasPanel className="overflow-hidden lg:absolute lg:bottom-4 lg:left-4 lg:top-4 lg:z-10 lg:w-[272px]">
          <AtlasFilters
            filters={filters}
            facets={facets}
            totals={totals}
            filtered={filtered.length}
            onChange={setFilters}
            onReset={reset}
          />
        </AtlasPanel>

        {selected ? (
          <div className="lg:absolute lg:left-1/2 lg:top-4 lg:z-20 lg:-translate-x-1/2">
            <AtlasResortCard resort={selected} onClose={() => setSelectedSlug(null)} />
          </div>
        ) : null}

        <div className="lg:absolute lg:right-4 lg:top-4 lg:z-10 lg:max-h-[calc(100%-15rem)] lg:w-[272px] lg:overflow-y-auto">
          <AtlasRankings
            lists={rankings}
            nations={nations}
            selectedSlug={selectedSlug}
            selectedCountries={filters.countries}
            onSelect={setSelectedSlug}
            onSelectCountry={(country) =>
              setFilters((f) => ({ ...f, countries: toggle(f.countries, country) }))
            }
          />
        </div>

        <AtlasPanel className="max-h-[19rem] overflow-hidden lg:absolute lg:bottom-9 lg:left-[304px] lg:right-[304px] lg:z-10 lg:max-h-[168px]">
          <AtlasStrip
            resorts={filtered}
            selectedSlug={selectedSlug}
            onSelect={setSelectedSlug}
          />
        </AtlasPanel>
      </div>
    </div>
  );
}
