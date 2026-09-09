import type { Map as MapTilerMap } from "@maptiler/sdk";

/**
 * Apple Maps cartography, applied over MapTiler's `winter` style.
 *
 * The stock winter style paints land, water, glacier, forest and buildings in
 * a narrow band of high-saturation cyan (hsl(180–195, 20–100%)). That is the
 * "oversaturated cyan" the workspace CLAUDE.md calls out as part of the failed
 * mobile restyle, and it is the single biggest reason a MapTiler map does not
 * read as an Apple map.
 *
 * Values transcribed from alpline-admin/apple-ui-brain/02-apps/maps-classic.md
 * ("Cartography" table + guidance §2 "Kill the cyan"). Apple's land is warm
 * paper, not cool white; its water is a light sky blue, not teal; its greens
 * are yellow-leaning. Dark mode is a desaturated blue-slate, deliberately not
 * a darkened version of the light palette.
 */
export const carto = {
  light: {
    land: "#fcfbf2",
    water: "#8edbfa",
    forest: "#c8f19f",
    glacier: "#f4f8fb",
    building: "#eae7d9",
    buildingLine: "#ddd9c8",
    road: "#cdcfd4",
    roadMajor: "#b3bac7",
    border: "#c3bfb2",
    labelPrimary: "#000000",
    labelSecondary: "#a4a4a4",
    labelNatural: "#4b4d4d",
    halo: "rgba(255,255,255,0.8)",
    hillshadeShadow: "#9c9683",
    hillshadeHighlight: "#fffdf4",
    hillshadeAccent: "#d9d4c2",
    forestOpacity: 0.55,
  },
  dark: {
    land: "#37495e",
    water: "#1d3a84",
    forest: "#0d5d5e",
    glacier: "#4a5f76",
    building: "#3f5268",
    buildingLine: "#4a5e76",
    road: "#5f6e83",
    roadMajor: "#7487a0",
    border: "#6b7d94",
    labelPrimary: "#ffffff",
    labelSecondary: "#bec1c4",
    labelNatural: "#c0cbd7",
    halo: "rgba(0,0,0,0.4)",
    hillshadeShadow: "#1e2c3d",
    hillshadeHighlight: "#5c718a",
    hillshadeAccent: "#2b3b4e",
    forestOpacity: 0.3,
  },
} as const;

export type CartoScheme = keyof typeof carto;

/**
 * Label and marker clutter that Apple Maps simply does not show at ski scale,
 * and that the failed mobile restyle showed at every zoom level. Alpline's
 * subject is the mountain, so shops, pharmacies, transit stops and airport
 * labels are removed outright rather than dimmed.
 */
const HIDDEN = [
  // Generic POI pins — shops, food, healthcare, culture, castles.
  "Outdoor shop",
  "Sport",
  "Pharmacy",
  "Food",
  "Healthcare",
  "Culture",
  "Tourism",
  "Castle",
  "Park labels",
  "Outdoor water",
  "Outdoor",
  "Winter sports",
  // Transit and air. "Station" is the layer responsible for the transit pins
  // that appear at every zoom level in the failed mobile restyle.
  "Transport",
  "Station",
  "Airport labels",
  "Aeroway",
  "Runway",
  "Taxiway",
  "Cable car labels",
  // Contours. Apple carries relief with shading alone; the stock contour set
  // is a dense cyan mesh that dominates the frame at resort zoom.
  "Contour",
  "Contour index",
  "Contour labels",
  "Glacier contour",
  "Glacier contour index",
  "Glacier contour labels",
  "Ski lift pylon labels",
  "Volcano labels",
  "Volcano labels (US)",
];

/** Every fill layer that should read as vegetation. */
const GREEN_FILLS = ["Forest", "Scrub", "Wood", "Grass"];

/** Slope colours follow the European piste convention, matching alpline-mobile. */
const PISTE = {
  "Novice slope": "#34c759",
  "Easy slope": "#007aff",
  "Intermediate slope": "#ff3b30",
  "Advanced slope": "#1d1d1f",
} as const;

/**
 * Safe paint setter — a style upgrade on MapTiler's side that renames or drops
 * a layer should degrade to "slightly wrong colours", never a thrown error
 * that blanks the whole map.
 */
function paint(map: MapTilerMap, layer: string, prop: string, value: unknown) {
  if (!map.getLayer(layer)) return;
  try {
    map.setPaintProperty(layer, prop, value as never);
  } catch {
    /* layer exists but does not carry this property — ignore */
  }
}

function hide(map: MapTilerMap, layer: string) {
  if (!map.getLayer(layer)) return;
  map.setLayoutProperty(layer, "visibility", "none");
}

export function applyAtlasCartography(map: MapTilerMap, scheme: CartoScheme) {
  const c = carto[scheme];

  paint(map, "Background", "background-color", c.land);
  paint(map, "Water", "fill-color", c.water);
  paint(map, "Residential", "fill-color", c.land);

  for (const layer of GREEN_FILLS) {
    paint(map, layer, "fill-color", c.forest);
  }
  // Stock opacity ramps these greens down to 0.1–0.3 over a cyan base. Against
  // warm paper they need to actually read, so opacity is flattened as well.
  paint(map, "Forest", "fill-opacity", c.forestOpacity);
  paint(map, "Wood", "fill-opacity", c.forestOpacity * 0.8);
  paint(map, "Grass", "fill-opacity", c.forestOpacity * 0.6);
  paint(map, "Scrub", "fill-opacity", c.forestOpacity * 0.55);

  paint(map, "Glacier", "fill-color", c.glacier);
  paint(map, "Sand", "fill-color", c.glacier);

  paint(map, "Hillshade", "hillshade-shadow-color", c.hillshadeShadow);
  paint(map, "Hillshade", "hillshade-highlight-color", c.hillshadeHighlight);
  paint(map, "Hillshade", "hillshade-accent-color", c.hillshadeAccent);

  paint(map, "Building", "fill-color", c.building);
  paint(map, "Building", "fill-outline-color", c.buildingLine);

  paint(map, "Country border", "line-color", c.border);
  paint(map, "Other border", "line-color", c.border);

  // Roads: two weights, both neutral grey. The stock style tints them cyan.
  for (const layer of ["Minor road", "Secondary", "Tertiary", "Street", "Path"]) {
    paint(map, layer, "line-color", c.road);
  }
  for (const layer of ["Highway", "Trunk", "Primary", "Motorway"]) {
    paint(map, layer, "line-color", c.roadMajor);
  }

  // Apple mutes every place that is not in focus to a flat grey, and relies on
  // the halo rather than weight for legibility.
  for (const layer of [
    "Place labels",
    "Village labels",
    "Town labels",
    "State labels",
    "Country labels",
    "City labels",
  ]) {
    paint(map, layer, "text-color", c.labelSecondary);
    paint(map, layer, "text-halo-color", c.halo);
    paint(map, layer, "text-halo-width", 1.5);
  }
  // The ski area's own name is the most important label on a ski map, so it
  // gets Apple's "primary place" treatment instead of the stock accent blue.
  paint(map, "Ski resort labels", "text-color", c.labelPrimary);
  paint(map, "Ski resort labels", "text-halo-color", c.halo);
  paint(map, "Ski resort labels", "icon-color", c.labelPrimary);

  for (const layer of ["Peak labels", "Peak labels (US)"]) {
    paint(map, layer, "text-color", c.labelNatural);
    paint(map, layer, "text-halo-color", c.halo);
    paint(map, layer, "icon-color", c.labelNatural);
  }

  // The one place the map is allowed to be colourful: the ski network. Keeping
  // pistes vivid against a desaturated basemap is the whole point.
  for (const [layer, color] of Object.entries(PISTE)) {
    paint(map, layer, "line-color", color);
    paint(map, `${layer} labels`, "text-color", color);
    paint(map, `${layer} area`, "fill-color", `${color}40`);
  }

  for (const layer of HIDDEN) hide(map, layer);
}
