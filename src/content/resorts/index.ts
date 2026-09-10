import { resorts } from "./data";
import type { Continent, Resort } from "./types";

export { resorts };
export type { Continent, Resort };

export const CONTINENT_ORDER: Continent[] = [
  "Europe",
  "North America",
  "Asia",
  "Oceania",
  "South America",
];

/** Resorts whose piste and lift networks Alpline has actually mapped. */
export const liveResorts = resorts.filter((r) => r.coverage === "live");

export function getResort(slug: string): Resort | undefined {
  return resorts.find((r) => r.slug === slug);
}

export interface CountryGroup {
  country: string;
  resorts: Resort[];
}
export interface ContinentGroup {
  continent: Continent;
  count: number;
  countries: CountryGroup[];
}

/**
 * Continent, then country, then resort — all alphabetical within their level,
 * except continents which follow CONTINENT_ORDER so Europe leads.
 */
export function groupByContinent(list: Resort[] = resorts): ContinentGroup[] {
  const byContinent = new Map<Continent, Map<string, Resort[]>>();

  for (const resort of list) {
    if (!byContinent.has(resort.continent)) byContinent.set(resort.continent, new Map());
    const countries = byContinent.get(resort.continent)!;
    if (!countries.has(resort.country)) countries.set(resort.country, []);
    countries.get(resort.country)!.push(resort);
  }

  return CONTINENT_ORDER.filter((c) => byContinent.has(c)).map((continent) => {
    const countries = byContinent.get(continent)!;
    return {
      continent,
      count: [...countries.values()].reduce((n, r) => n + r.length, 0),
      countries: [...countries.entries()]
        .map(([country, rs]) => ({
          country,
          resorts: [...rs].sort((a, b) => a.name.localeCompare(b.name, "en")),
        }))
        .sort((a, b) => a.country.localeCompare(b.country, "en")),
    };
  });
}

/** Vertical drop in metres. */
export function verticalDrop(resort: Resort): number {
  return resort.altitudeMax - resort.altitudeMin;
}

/** Nearby resorts in the same country, for cross-linking detail pages. */
export function relatedResorts(resort: Resort, limit = 6): Resort[] {
  return resorts
    .filter((r) => r.country === resort.country && r.slug !== resort.slug)
    .sort((a, b) => {
      const da = (a.lat - resort.lat) ** 2 + (a.lng - resort.lng) ** 2;
      const db = (b.lat - resort.lat) ** 2 + (b.lng - resort.lng) ** 2;
      return da - db;
    })
    .slice(0, limit);
}

/** Fails the build rather than shipping a broken directory. */
export function assertResortsIntegrity(): void {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const r of resorts) {
    if (seen.has(r.slug)) problems.push(`duplicate slug: ${r.slug}`);
    seen.add(r.slug);

    if (!/^[a-z0-9-]+$/.test(r.slug)) problems.push(`${r.slug}: slug is not url-safe`);
    if (!r.name.trim()) problems.push(`${r.slug}: empty name`);
    if (!CONTINENT_ORDER.includes(r.continent)) {
      problems.push(`${r.slug}: unknown continent "${r.continent}"`);
    }
    if (Math.abs(r.lat) > 90) problems.push(`${r.slug}: latitude out of range`);
    if (Math.abs(r.lng) > 180) problems.push(`${r.slug}: longitude out of range`);
    if (r.altitudeMax <= r.altitudeMin) {
      problems.push(`${r.slug}: summit is not above base`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Resort data is invalid:\n  - ${problems.join("\n  - ")}`);
  }
}

assertResortsIntegrity();
