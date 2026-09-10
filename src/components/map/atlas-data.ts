import { CONTINENT_ORDER, verticalDrop } from "@/content/resorts";
import type { Continent, Coverage, Resort } from "@/content/resorts/types";

/**
 * Every number on the Atlas is derived here, from the same generated resort
 * dataset the /resorts directory uses. Nothing on the page is illustrative:
 * if a count is shown, it was counted.
 */

export interface VerticalBand {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const VERTICAL_BANDS: VerticalBand[] = [
  { id: "u1000", label: "Under 1,000 m", min: 0, max: 1000 },
  { id: "1000", label: "1,000 – 1,500 m", min: 1000, max: 1500 },
  { id: "1500", label: "1,500 – 2,000 m", min: 1500, max: 2000 },
  { id: "2000", label: "Over 2,000 m", min: 2000, max: Infinity },
];

export interface AtlasFilters {
  query: string;
  coverage: Coverage[];
  continents: Continent[];
  countries: string[];
  bands: string[];
}

export const EMPTY_FILTERS: AtlasFilters = {
  query: "",
  coverage: [],
  continents: [],
  countries: [],
  bands: [],
};

export function isFiltered(f: AtlasFilters): boolean {
  return (
    f.query.trim() !== "" ||
    f.coverage.length > 0 ||
    f.continents.length > 0 ||
    f.countries.length > 0 ||
    f.bands.length > 0
  );
}

/** Immutable add/remove for the multi-select facets. */
export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

type Facet = keyof AtlasFilters;

function bandOf(resort: Resort): string | undefined {
  const drop = verticalDrop(resort);
  return VERTICAL_BANDS.find((b) => drop >= b.min && drop < b.max)?.id;
}

/**
 * `except` lets a facet count itself against everything *but* its own
 * selection, which is what makes the counts beside each checkbox useful —
 * selecting France must not collapse every other country to zero.
 */
function matches(resort: Resort, f: AtlasFilters, except?: Facet): boolean {
  if (except !== "query" && f.query.trim()) {
    const q = f.query.trim().toLowerCase();
    const haystack = `${resort.name} ${resort.country} ${resort.region}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (except !== "coverage" && f.coverage.length && !f.coverage.includes(resort.coverage)) {
    return false;
  }
  if (except !== "continents" && f.continents.length && !f.continents.includes(resort.continent)) {
    return false;
  }
  if (except !== "countries" && f.countries.length && !f.countries.includes(resort.country)) {
    return false;
  }
  if (except !== "bands" && f.bands.length) {
    const band = bandOf(resort);
    if (!band || !f.bands.includes(band)) return false;
  }
  return true;
}

export function applyFilters(all: Resort[], f: AtlasFilters): Resort[] {
  return all.filter((r) => matches(r, f));
}

export interface FacetCount<T> {
  value: T;
  label: string;
  count: number;
}

function countBy<T>(
  all: Resort[],
  f: AtlasFilters,
  facet: Facet,
  key: (r: Resort) => T | undefined
): Map<T, number> {
  const counts = new Map<T, number>();
  for (const resort of all) {
    if (!matches(resort, f, facet)) continue;
    const k = key(resort);
    if (k === undefined) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

export interface AtlasFacets {
  coverage: FacetCount<Coverage>[];
  continents: FacetCount<Continent>[];
  countries: FacetCount<string>[];
  bands: FacetCount<string>[];
}

export const COVERAGE_LABEL: Record<Coverage, string> = {
  live: "Available now",
  catalogued: "Coming next",
};

export function buildFacets(all: Resort[], f: AtlasFilters): AtlasFacets {
  const coverage = countBy(all, f, "coverage", (r) => r.coverage);
  const continents = countBy(all, f, "continents", (r) => r.continent);
  const countries = countBy(all, f, "countries", (r) => r.country);
  const bands = countBy(all, f, "bands", bandOf);

  return {
    coverage: (["live", "catalogued"] as Coverage[])
      .filter((c) => coverage.has(c))
      .map((c) => ({ value: c, label: COVERAGE_LABEL[c], count: coverage.get(c)! })),
    continents: CONTINENT_ORDER.filter((c) => continents.has(c)).map((c) => ({
      value: c,
      label: c,
      count: continents.get(c)!,
    })),
    countries: [...countries.entries()]
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "en")),
    bands: VERTICAL_BANDS.filter((b) => bands.has(b.id)).map((b) => ({
      value: b.id,
      label: b.label,
      count: bands.get(b.id)!,
    })),
  };
}

export interface RankRow {
  slug: string;
  label: string;
  sublabel: string;
  value: number;
  display: string;
  /** 0–1, for the bar width. */
  fraction: number;
}

export interface RankList {
  id: string;
  title: string;
  rows: RankRow[];
}

function rank(
  resorts: Resort[],
  id: string,
  title: string,
  value: (r: Resort) => number,
  display: (n: number) => string,
  limit = 3
): RankList {
  const rows = [...resorts]
    .sort((a, b) => value(b) - value(a))
    .slice(0, limit)
    .map((r) => ({ resort: r, v: value(r) }));
  const top = rows[0]?.v ?? 1;

  return {
    id,
    title,
    rows: rows.map(({ resort, v }) => ({
      slug: resort.slug,
      label: resort.name,
      sublabel: resort.country,
      value: v,
      display: display(v),
      fraction: top > 0 ? v / top : 0,
    })),
  };
}

const metres = (n: number) => `${n.toLocaleString("en-GB")} m`;

/**
 * The ranked panels read off the *filtered* set, so narrowing to Japan
 * answers "what are the highest resorts in Japan" without a second control.
 */
export function buildRankings(resorts: Resort[]): RankList[] {
  return [
    rank(resorts, "summit", "Highest summits", (r) => r.altitudeMax, metres),
    rank(resorts, "vertical", "Biggest vertical", verticalDrop, metres),
  ];
}

export interface NationRow {
  country: string;
  count: number;
  fraction: number;
}

/** Which countries the current view is actually made of. */
export function buildNations(resorts: Resort[], limit = 4): NationRow[] {
  const counts = new Map<string, number>();
  for (const r of resorts) counts.set(r.country, (counts.get(r.country) ?? 0) + 1);

  const rows = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en"))
    .slice(0, limit);
  const top = rows[0]?.[1] ?? 1;

  return rows.map(([country, count]) => ({ country, count, fraction: count / top }));
}

export interface AtlasTotals {
  resorts: number;
  countries: number;
  continents: number;
  live: number;
}

export function totals(resorts: Resort[]): AtlasTotals {
  return {
    resorts: resorts.length,
    countries: new Set(resorts.map((r) => r.country)).size,
    continents: new Set(resorts.map((r) => r.continent)).size,
    live: resorts.filter((r) => r.coverage === "live").length,
  };
}
