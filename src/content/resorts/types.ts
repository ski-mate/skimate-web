export type Continent =
  | "Europe"
  | "North America"
  | "Asia"
  | "Oceania"
  | "South America";

/**
 * `live` means Alpline has ingested the resort's piste and lift network and
 * routing works there. `catalogued` means it is on the roadmap but not yet
 * mapped — the site must never imply otherwise.
 */
export type Coverage = "live" | "catalogued";

export interface Resort {
  slug: string;
  name: string;
  country: string;
  region: string;
  continent: Continent;
  lat: number;
  lng: number;
  altitudeMin: number;
  altitudeMax: number;
  coverage: Coverage;
}
