import type { StyleSpecification } from "maplibre-gl";
import type { Map as MapTilerMap } from "@maptiler/sdk";

/**
 * Apple Maps cartography over MapTiler's winter style.
 *
 * ── Why this transforms the style JSON rather than repainting a live map ──
 *
 * The previous version passed `maptilersdk.MapStyle.WINTER` to the Map
 * constructor and then poked paint properties after `load`. Three things were
 * wrong with that, and all three were invisible:
 *
 *  1. `MapStyle.WINTER` is a *reference* the SDK resolves asynchronously.
 *     MapLibre therefore constructed on its own default first — logging
 *     "Invalid style … Fallback to default MapTiler style" and downloading
 *     streets-v2's style.json *and* sprites — before the SDK swapped in winter.
 *     Every map in the app paid for two styles and two sprite sheets.
 *  2. Because the swap happened after `load`, overrides applied on that first
 *     `load` were discarded by the incoming style. The restyle was racing the
 *     thing it was restyling.
 *  3. `setPaintProperty` was guarded with `if (!map.getLayer(id)) return`, so
 *     every id that did not match was silently dropped. The overrides were
 *     keyed to winter-v2 while alpline-mobile had already moved to winter-v4 —
 *     57 of the ids matched v2, only 51 matched v4 — and nothing ever said so.
 *
 * Fetching the style, transforming the JSON, and handing the finished
 * `StyleSpecification` to the constructor removes all three at once: one
 * download, no fallback path to race, and a style object we can verify against
 * before the map exists. `assertKnownLayers` does exactly that in development,
 * so a MapTiler rename fails loudly instead of quietly reverting the map to
 * stock colours.
 *
 * ── Which style ──
 *
 * winter-v4, matching `alpline-mobile/src/features/map/components/SkierMap.tsx`.
 * One style across the product means one set of layer ids to keep correct, and
 * the mobile mapping in `styles/appleCartography.ts` is the maintained one —
 * 87 of its 88 targeted ids exist in v4. The palette below is that mapping,
 * parameterised so the web can also carry a dark scheme, which mobile does not
 * need.
 *
 * Values trace to alpline-admin/apple-ui-brain/02-apps/maps-classic.md §4:
 * Apple's land is warm paper, not cool white; water is sky blue, not teal;
 * greens lean yellow. Dark is a desaturated blue-slate, deliberately not the
 * light palette darkened.
 */

/** The MapTiler style both the app and the site build on. */
export const ATLAS_STYLE_ID = "winter-v4";

export function atlasStyleUrl(apiKey: string): string {
  return `https://api.maptiler.com/maps/${ATLAS_STYLE_ID}/style.json?key=${apiKey}`;
}

export type CartoScheme = "light" | "dark";

interface Palette {
  land: string;
  water: string;
  forest: string;
  forestLight: string;
  glacier: string;
  glacierContour: string;
  sand: string;
  building: string;
  buildingLine: string;
  industrial: string;
  parking: string;
  bridge: string;
  tunnel: string;
  roadMinor: string;
  roadMajor: string;
  roadHighway: string;
  path: string;
  rail: string;
  cliff: string;
  contour: string;
  lift: string;
  border: string;
  halo: string;
  /** Halo behind the in-focus place name. maps-classic.md §4 name-primary-border. */
  haloPrimary: string;
  labelMuted: string;
  labelTown: string;
  labelCity: string;
  labelWater: string;
  labelPark: string;
  labelPeak: string;
  labelRoad: string;
  labelPath: string;
  labelPrimary: string;
  hillshadeShadow: string;
  hillshadeHighlight: string;
  hillshadeAccent: string;
  residential: [string, string];
}

export const carto: Record<CartoScheme, Palette> = {
  light: {
    land: "#fcfbf2",
    water: "#8edbfa",
    forest: "#c8f19f",
    forestLight: "#d9f4b8",
    glacier: "#eef8fb",
    glacierContour: "#cfe4ec",
    sand: "#f7f0dd",
    building: "#e9e6da",
    buildingLine: "#dbd7c8",
    industrial: "#f5f2e6",
    parking: "#f1efe4",
    bridge: "#efede2",
    tunnel: "#e0e0dc",
    roadMinor: "#cdcfd4",
    roadMajor: "#ced1db",
    roadHighway: "#b3bac7",
    path: "#d8d5ca",
    rail: "#c0c3cc",
    cliff: "#b9b2a0",
    contour: "#d3c9b2",
    lift: "#8e939c",
    border: "#c3bfb2",
    halo: "rgba(255,255,255,0.8)",
    haloPrimary: "rgba(255,255,255,0.8)",
    labelMuted: "#a4a4a4",
    labelTown: "#808080",
    labelCity: "#3c3c3c",
    labelWater: "#4c94b5",
    labelPark: "#1ca00d",
    labelPeak: "#bc7c53",
    labelRoad: "#8b8b86",
    labelPath: "#9a9890",
    labelPrimary: "#000000",
    hillshadeShadow: "#9aa0ab",
    hillshadeHighlight: "#ffffff",
    hillshadeAccent: "#efece0",
    residential: ["rgba(252,251,242,0.75)", "rgba(252,251,242,0.2)"],
  },
  dark: {
    land: "#37495e",
    water: "#1d3a84",
    forest: "#0d5d5e",
    forestLight: "#12706f",
    glacier: "#4a5f76",
    glacierContour: "#43566d",
    sand: "#3f5268",
    building: "#3f5268",
    buildingLine: "#4a5e76",
    industrial: "#3b4d62",
    parking: "#3a4b60",
    bridge: "#46586d",
    tunnel: "#46586d",
    roadMinor: "#5f6e83",
    roadMajor: "#6b7d94",
    roadHighway: "#7487a0",
    path: "#55637a",
    rail: "#55637a",
    cliff: "#6b7d94",
    contour: "#43566d",
    lift: "#9aa4b3",
    border: "#6b7d94",
    halo: "rgba(0,0,0,0.4)",
    haloPrimary: "rgba(0,0,0,0.4)",
    labelMuted: "#bec1c4",
    labelTown: "#d4d8dd",
    labelCity: "#ffffff",
    labelWater: "#7fb4d6",
    labelPark: "#40b17f",
    labelPeak: "#d0a583",
    labelRoad: "#aab2bd",
    labelPath: "#98a2b0",
    labelPrimary: "#ffffff",
    hillshadeShadow: "#1e2c3d",
    hillshadeHighlight: "#5c718a",
    hillshadeAccent: "#2b3b4e",
    residential: ["rgba(55,73,94,0.75)", "rgba(55,73,94,0.2)"],
  },
};

/** iOS-system piste difficulty, identical in both schemes and to the app. */
const PISTE = {
  novice: "#34c759",
  easy: "#007aff",
  intermediate: "#ff3b30",
  advanced: "#1d1d1f",
} as const;

/** Pistes read like Apple's roads: soft opacity, thin ramp, calm terrain. */
const PISTE_LINE = {
  "line-opacity": 0.78,
  "line-width": [
    "interpolate",
    ["exponential", 1],
    ["zoom"],
    10,
    0.6,
    14,
    1.6,
    22,
    5,
  ],
} as const;

/** Lifts stay hairline — never the black spider-web of the failed restyle. */
const LIFT_LINE = {
  "line-opacity": 0.9,
  "line-width": [
    "interpolate",
    ["exponential", 1],
    ["zoom"],
    12,
    0.5,
    16,
    1.1,
    22,
    2.2,
  ],
} as const;

/**
 * Paint overrides keyed by winter-v4 layer id.
 *
 * Mirrors alpline-mobile/src/features/map/styles/appleCartography.ts. Keep the
 * two in step: they describe one product's cartography, and the ids are the
 * contract with MapTiler's style, not ours.
 */
function paintOverrides(c: Palette): Record<string, Record<string, unknown>> {
  return {
    Background: { "background-color": c.land },

    Water: { "fill-color": c.water },
    "Water intermittent": { "fill-color": c.water },
    Reef: { "fill-color": c.water },
    Waterway: { "line-color": c.water },
    "Waterway tunnel": { "line-color": c.water },
    "Waterway intermittent": { "line-color": c.water },

    Forest: { "fill-color": c.forest },
    Wood: { "fill-color": c.forest },
    Grass: { "fill-color": c.forestLight },
    Scrub: { "fill-color": c.forestLight },
    Sand: { "fill-color": c.sand },
    Glacier: { "fill-color": c.glacier },
    Cemetery: { "fill-color": c.forestLight },
    Hospital: { "fill-color": c.land },
    Commercial: { "fill-color": c.land },
    Industrial: { "fill-color": c.industrial },
    "Parking area": { "fill-color": c.parking },
    Stadium: { "fill-color": c.forestLight },
    Residential: {
      "fill-color": [
        "interpolate",
        ["exponential", 1],
        ["zoom"],
        4,
        c.residential[0],
        16,
        c.residential[1],
      ],
    },

    // Soft neutral relief — the stock winter hillshade carries a blue cast.
    Hillshade: {
      "hillshade-accent-color": c.hillshadeAccent,
      "hillshade-highlight-color": c.hillshadeHighlight,
      "hillshade-shadow-color": c.hillshadeShadow,
    },

    Building: {
      "fill-color": c.building,
      "fill-outline-color": c.buildingLine,
    },

    // Road ladder: low-contrast neutrals over the land tone, no loud casings.
    "Minor road": { "line-color": c.roadMinor },
    "Major road": { "line-color": c.roadMajor },
    Highway: { "line-color": c.roadHighway },
    "No access road": { "line-color": c.roadMinor },
    "Road bridge": { "line-color": c.roadMajor },
    "No access bridge": { "line-color": c.roadMinor },
    Tunnel: { "line-color": c.tunnel },
    Path: { "line-color": c.path },
    Track: { "line-color": c.path },
    Steps: { "line-color": c.path },
    "Tunnel path": { "line-color": c.path },
    Pedestrian: { "line-color": c.path },
    "Pedestrian outline": { "line-color": c.land },
    "Minor railway": { "line-color": c.rail },
    "Major railway": { "line-color": c.rail },
    "Railway tunnel": { "line-color": c.rail },
    "Minor railway bridge": { "line-color": c.rail },
    "Railway bridge": { "line-color": c.rail },
    Bridge: { "fill-color": c.bridge },
    Pier: { "fill-color": c.bridge },

    "Country border": { "line-color": c.border },
    "Other border z7": { "line-color": c.border },
    "Other border z2": { "line-color": c.border },
    "Disputed border": { "line-color": c.border },

    // The one place the map is allowed to be colourful: the ski network.
    "Novice slope": { "line-color": PISTE.novice, ...PISTE_LINE },
    "Easy slope": { "line-color": PISTE.easy, ...PISTE_LINE },
    "Intermediate slope": { "line-color": PISTE.intermediate, ...PISTE_LINE },
    "Advanced slope": {
      "line-color": PISTE.advanced,
      ...PISTE_LINE,
      "line-opacity": 0.62,
    },
    "Novice slope area": { "fill-color": PISTE.novice, "fill-opacity": 0.18 },
    "Easy slope area": { "fill-color": PISTE.easy, "fill-opacity": 0.18 },
    "Intermediate slope area": {
      "fill-color": PISTE.intermediate,
      "fill-opacity": 0.18,
    },
    "Advanced slope area": {
      "fill-color": PISTE.advanced,
      "fill-opacity": 0.18,
    },
    "Novice slope labels": {
      "text-color": PISTE.novice,
      "text-halo-color": c.halo,
    },
    "Easy slope labels": {
      "text-color": PISTE.easy,
      "text-halo-color": c.halo,
    },
    "Intermediate slope labels": {
      "text-color": PISTE.intermediate,
      "text-halo-color": c.halo,
    },
    "Advanced slope labels": {
      "text-color": PISTE.advanced,
      "text-halo-color": c.halo,
    },
    Freeride: { "line-color": "#ff9500", ...PISTE_LINE },

    // Secondary snow networks stay near-invisible at overview zoom.
    "Ski tour": { "line-color": "rgba(140,134,190,0.45)", ...LIFT_LINE },
    "Nordic trail": { "line-color": "rgba(96,178,188,0.5)", ...LIFT_LINE },
    Sled: { "line-color": "rgba(186,130,196,0.5)", ...LIFT_LINE },
    "Slope outline": {
      "line-opacity": 0.55,
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        10,
        1.2,
        14,
        2.6,
        22,
        6,
      ],
    },

    "Ski lift": { "line-color": c.lift, ...LIFT_LINE },
    "Chair lift": { "line-color": c.lift, ...LIFT_LINE },
    "Cable car": { "line-color": c.lift, ...LIFT_LINE },
    "Magic carpet": { "line-color": c.lift, ...LIFT_LINE },

    Contour: { "line-color": c.contour },
    "Contour index": { "line-color": c.contour },
    "Glacier contour": { "line-color": c.glacierContour },
    "Glacier contour index": { "line-color": c.glacierContour },
    Cliff: { "line-color": c.cliff },
    "Cliff line": { "line-color": c.cliff },

    // Settlement ladder: focus via colour, not size.
    "Village labels": { "text-color": c.labelMuted, "text-halo-color": c.halo },
    "Place labels": { "text-color": c.labelMuted, "text-halo-color": c.halo },
    "Town labels": { "text-color": c.labelTown, "text-halo-color": c.halo },
    "City labels": { "text-color": c.labelCity, "text-halo-color": c.halo },
    "Capital city labels": {
      "text-color": c.labelCity,
      "text-halo-color": c.halo,
    },
    "State labels z9": {
      "text-color": c.labelMuted,
      "text-halo-color": c.halo,
    },
    "State labels z7": {
      "text-color": c.labelMuted,
      "text-halo-color": c.halo,
    },
    "State labels z4": {
      "text-color": c.labelMuted,
      "text-halo-color": c.halo,
    },

    "Peak labels": {
      "text-color": c.labelPeak,
      "text-halo-color": c.halo,
      "icon-color": c.labelPeak,
    },
    "Peak labels (US)": {
      "text-color": c.labelPeak,
      "text-halo-color": c.halo,
      "icon-color": c.labelPeak,
    },
    "Park labels": { "text-color": c.labelPark, "text-halo-color": c.halo },
    "Protected area labels": {
      "text-color": c.labelPark,
      "text-halo-color": c.halo,
    },
    "Protected area major labels": {
      "text-color": c.labelPark,
      "text-halo-color": c.halo,
    },

    "River labels": { "text-color": c.labelWater, "text-halo-color": c.halo },
    "Lake labels (points)": {
      "text-color": c.labelWater,
      "text-halo-color": c.halo,
    },
    "Lake labels (lines)": {
      "text-color": c.labelWater,
      "text-halo-color": c.halo,
    },
    "Lake labels major": {
      "text-color": c.labelWater,
      "text-halo-color": c.halo,
    },
    "Pond labels (points)": {
      "text-color": c.labelWater,
      "text-halo-color": c.halo,
    },
    "Pond labels (lines)": {
      "text-color": c.labelWater,
      "text-halo-color": c.halo,
    },

    "Road labels": { "text-color": c.labelRoad, "text-halo-color": c.halo },
    "Pathway labels": { "text-color": c.labelPath, "text-halo-color": c.halo },

    // A ski area's own name is the most important label on a ski map, so it
    // gets Apple's "city in focus" treatment. The halo has to follow the
    // scheme: mobile hardcodes the light one because it renders no dark map,
    // and reusing that here put white text on a white halo.
    "Ski resort labels": {
      "text-color": c.labelPrimary,
      "text-halo-color": c.haloPrimary,
      "text-halo-width": 1.4,
    },
  };
}

/**
 * POI thinning, per maps-classic §4's density rules: commercial POIs appear
 * only at close zoom, utility clutter later still. These are minzoom floors,
 * not deletions — Apple thins by zoom rather than removing categories.
 *
 * `Station` is the layer that produced the transit-pin clutter at every zoom
 * in the failed restyle; a floor of 13 is what fixes it.
 */
const POI_MINZOOM: Record<string, number> = {
  "Ski tour": 13.5,
  "Ski tour labels": 14.5,
  "Ski tour symbol": 14.5,
  "Nordic trail": 13.5,
  "Nordic trail labels": 14.5,
  "Nordic trail symbol": 14.5,
  Sled: 14,
  "Sled symbol": 15,
  Food: 14.5,
  "Outdoor shop": 15,
  Accommodation: 14.5,
  Culture: 14.5,
  Tourism: 14,
  Sport: 14.5,
  Sauna: 15,
  Pharmacy: 15,
  Healthcare: 15,
  Toilets: 16,
  Information: 15,
  "Zebra crossing": 18,
  Parking: 15,
  Station: 13,
  Oneway: 16,
};

/**
 * Removed outright rather than thinned. Alpline's subject is the mountain, and
 * these are things Apple never shows at ski scale: air infrastructure, the
 * dense contour mesh (relief is carried by shading alone), and pylon labels.
 */
const HIDDEN = [
  "Airport area",
  "Airport labels",
  "Runway",
  "Taxiway",
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

interface StyleLayer {
  id: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  minzoom?: number;
}

/**
 * Development-only guard against silent rot.
 *
 * The old code could not tell the difference between "this layer is styled" and
 * "this id has not existed for two MapTiler releases". Now that the style
 * arrives as data before the map is built, the mismatch is checkable — so it is
 * checked, once per style load, and reported by name.
 */
function assertKnownLayers(
  style: StyleSpecification,
  overrides: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === "production") return;
  const present = new Set((style.layers as StyleLayer[]).map((l) => l.id));
  const unknown = [
    ...Object.keys(overrides).filter((id) => !present.has(id)),
    ...Object.keys(POI_MINZOOM).filter((id) => !present.has(id)),
    ...HIDDEN.filter((id) => !present.has(id)),
  ];
  if (unknown.length > 0) {
    console.warn(
      `[cartography] ${unknown.length} targeted layer id(s) are absent from ${ATLAS_STYLE_ID}. ` +
        `The restyle silently skips these — update src/lib/map/cartography.ts:\n  ${unknown.join("\n  ")}`,
    );
  }
}

/** Recolours a fetched winter-v4 style in place and returns the same object. */
export function applyAtlasCartography(
  style: StyleSpecification,
  scheme: CartoScheme,
): StyleSpecification {
  if (!Array.isArray(style.layers)) return style;

  const overrides = paintOverrides(carto[scheme]);
  assertKnownLayers(style, overrides);

  const hidden = new Set(HIDDEN);

  for (const layer of style.layers as StyleLayer[]) {
    const override = overrides[layer.id];
    if (override) layer.paint = { ...(layer.paint ?? {}), ...override };

    const floor = POI_MINZOOM[layer.id];
    if (floor !== undefined)
      layer.minzoom = Math.max(layer.minzoom ?? 0, floor);

    if (hidden.has(layer.id)) {
      layer.layout = { ...(layer.layout ?? {}), visibility: "none" };
    }
  }

  return style;
}

/** Processed styles, keyed by scheme. Toggling dark mode must not re-download. */
const styleCache = new Map<string, StyleSpecification>();

/**
 * Fetches the winter style and returns it restyled, ready to hand straight to
 * the Map constructor. This is the only way a map in this app should get a
 * style: there is no enum to resolve, so there is no fallback to race.
 */
export async function loadAtlasStyle(
  apiKey: string,
  scheme: CartoScheme,
): Promise<StyleSpecification> {
  const cacheKey = `${ATLAS_STYLE_ID}|${scheme}`;
  const cached = styleCache.get(cacheKey);
  if (cached) return cached;

  const response = await fetch(atlasStyleUrl(apiKey));
  if (!response.ok) {
    throw new Error(
      `MapTiler returned ${response.status} for ${ATLAS_STYLE_ID}. ` +
        (response.status === 403
          ? "The key is domain-restricted and this origin is not on its allowlist."
          : "Check NEXT_PUBLIC_MAPTILER_API_KEY."),
    );
  }

  const style = applyAtlasCartography(
    (await response.json()) as StyleSpecification,
    scheme,
  );
  styleCache.set(cacheKey, style);
  return style;
}

/**
 * Repaints a live map when the colour scheme flips.
 *
 * Driven by the same override table as the style transform, so the two cannot
 * disagree. This exists because `setStyle` would drop the sources and layers
 * each screen adds on top, and a scheme flip should not cost a re-download or a
 * rebuild of the app's own layers.
 */
export function repaintAtlasCartography(map: MapTilerMap, scheme: CartoScheme) {
  const overrides = paintOverrides(carto[scheme]);
  for (const [id, props] of Object.entries(overrides)) {
    if (!map.getLayer(id)) continue;
    for (const [prop, value] of Object.entries(props)) {
      try {
        map.setPaintProperty(id, prop, value as never);
      } catch {
        /* layer exists but does not carry this property */
      }
    }
  }
}
