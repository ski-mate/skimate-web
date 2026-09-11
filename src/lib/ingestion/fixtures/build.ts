/**
 * Deterministic fixture generation for the mock adapter.
 *
 * Everything here is a pure function of a seed string, so the same registry id
 * always produces the same conflicts, orphans, costs and QA findings. That
 * matters for a review console: an analyst who resolves conflict #7, reloads,
 * and finds a different conflict #7 cannot trust anything they are looking at.
 *
 * Timestamps are offsets from `EPOCH`, captured once when the module loads on
 * the server. Relative times ("ran 2 hours ago") therefore stay sensible
 * without any value differing between two renders in the same process.
 */

import type {
  ChecklistItem,
  CoverageFinding,
  CoverageMemberStats,
  CoverageResponse,
  EnrichmentEstimate,
  EnrichmentReport,
  GateKey,
  HarvestConflict,
  HarvestResponse,
  IngestionRun,
  LngLat,
  MembershipResponse,
  PlaceCandidate,
  QaCheck,
  ReferenceComparison,
  RegistryEntry,
  RunStage,
  Stage,
  ValidationGate,
} from "@/lib/ingestion-api";
import { SEED_RESORTS, classify, type SeedResort } from "./registry-seed";

export const EPOCH = Date.now();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const OVERTURE_RELEASE = "2026-08-19.0";

export function iso(offsetMs: number): string {
  return new Date(EPOCH + offsetMs).toISOString();
}

/* ── deterministic randomness ─────────────────────────────────────────────── */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, and stable across platforms. */
export function rng(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(r: () => number, xs: readonly T[]): T {
  return xs[Math.floor(r() * xs.length) % xs.length];
}

function int(r: () => number, min: number, max: number): number {
  return min + Math.floor(r() * (max - min + 1));
}

/** A v4-shaped uuid derived from a seed, so ids are stable across restarts. */
export function uuidFrom(seed: string): string {
  const r = rng(seed);
  const hex = (n: number) =>
    Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(r() * 16)]).join("");
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${"89ab"[Math.floor(r() * 4)]}${hex(3)}-${hex(12)}`;
}

/* ── the curated groups ───────────────────────────────────────────────────── */

/**
 * Curated resort groups, in the Slopes model: a flat group over member leaves,
 * never a parent pointer. Membership here mirrors Skimap.org's editorial line
 * (lift-linked = one entry), which is where the Les 3 Vallées member list comes
 * from for free.
 *
 * Note what is *not* here: Courchevel, Méribel and Les Menuires. They have no
 * ski-area polygon, so they are not in the snapshot and cannot be members yet.
 * Minting them is the onboarding wizard's job, and their unclaimed village
 * commerce is the orphan belt on screen 4.
 */
export const GROUPS: { name: string; skimapId: number; members: string[]; osmIds: number[] }[] = [
  {
    name: "Les 3 Vallées",
    skimapId: 1079,
    // Two overlapping polygons for one domain — evidence refs, not identities.
    osmIds: [45117869, 3545276],
    members: ["Val Thorens", "Val Thorens - Orelle", "Orelle"],
  },
  {
    name: "Paradiski",
    skimapId: 1080,
    osmIds: [1227560922],
    members: ["La Plagne", "Les Arcs", "Les Arcs / Peisey-Vallandry", "Domaine Nordique Peisey-Vallandry"],
  },
  {
    name: "Les Portes du Soleil",
    skimapId: 1104,
    osmIds: [19457834],
    members: [
      "Avoriaz",
      "Les Gets-Morzine",
      "Champéry – Les Crosets – Champoussin – Morgins",
      "Espace Liberté",
      "Torgon",
      "Snowpark de Chatel Secteur SUPER CHATEL",
    ],
  },
  {
    name: "Le Grand Massif",
    skimapId: 1121,
    osmIds: [5994258],
    members: ["Flaine", "Villages"],
  },
  {
    name: "Evasion Mont Blanc",
    skimapId: 1140,
    osmIds: [17261841],
    members: [
      "Megève",
      "Megève/Saint-Gervais",
      "Les Contamines",
      "Les Portes du Mont-Blanc",
      "Cordon",
      "Les Houches - Saint-Gervais",
    ],
  },
  {
    name: "Espace Diamant",
    skimapId: 1163,
    osmIds: [5993384, 599426852],
    members: ["Espace Diamant", "Espace Diamant (Les Saisies)", "Arêches Beaufort"],
  },
  {
    name: "Espace Haute Maurienne Vanoise",
    skimapId: 1188,
    osmIds: [17261990],
    members: ["Val Cenis", "Bonneval-sur-Arc", "Bessans", "Aussois"],
  },
];

/* ── registry ─────────────────────────────────────────────────────────────── */

function bboxAround(centroid: LngLat, km: number): [number, number, number, number] {
  const dLat = km / 111;
  const dLng = km / (111 * Math.cos((centroid[1] * Math.PI) / 180));
  return [centroid[0] - dLng, centroid[1] - dLat, centroid[0] + dLng, centroid[1] + dLat];
}

export interface BuiltEntry {
  entry: RegistryEntry;
  seed: SeedResort | null;
  stage: Stage;
  trails: number;
  lifts: number;
  places: number;
}

/**
 * Stage assignment. Deliberately hand-pinned for the domains an analyst would
 * work on first, and hash-distributed for the long tail — so the worklist shows
 * a plausible morning rather than 200 rows in the same state.
 */
const PINNED_STAGES: Record<string, Stage> = {
  "Les 3 Vallées": "membership",
  Paradiski: "membership",
  "Les Portes du Soleil": "harvested",
  "Le Grand Massif": "enriched",
  "Evasion Mont Blanc": "qa",
  "Espace Diamant": "harvested",
  "Espace Haute Maurienne Vanoise": "identity",
  "Alpe d'Huez Grand Domaine": "published",
  "Tignes - Val d'Isère": "published",
  "La Clusaz": "published",
  "Les Deux Alpes": "qa",
  "Les Sybelles": "needs_rerun",
  "Le Grand Domaine": "needs_rerun",
  Chamrousse: "enriched",
  "Val Cenis": "harvested",
  Flaine: "membership",
};

const TAIL_STAGES: Stage[] = [
  "not_started",
  "not_started",
  "not_started",
  "identity",
  "identity",
  "harvested",
  "membership",
  "published",
];

function stageFor(name: string, seed: SeedResort | null): Stage {
  if (PINNED_STAGES[name]) return PINNED_STAGES[name];
  if (seed && !seed.imported) return "not_started";
  return pick(rng(`stage:${name}`), TAIL_STAGES);
}

let cachedRegistry: BuiltEntry[] | null = null;

export function buildRegistry(): BuiltEntry[] {
  if (cachedRegistry) return cachedRegistry;

  const bySeedName = new Map(SEED_RESORTS.map((s) => [s.name, s]));
  const memberToGroup = new Map<string, string>();
  for (const g of GROUPS) for (const m of g.members) memberToGroup.set(m, g.name);

  const out: BuiltEntry[] = [];

  // Groups first, so leaves can point at a group id that already exists.
  const groupIds = new Map<string, string>();
  for (const g of GROUPS) groupIds.set(g.name, uuidFrom(`registry:${g.name}`));

  for (const g of GROUPS) {
    const seed = bySeedName.get(g.name) ?? null;
    const centroid: LngLat = seed ? [seed.lng, seed.lat] : [6.5, 45.4];
    const memberIds = g.members.map((m) => uuidFrom(`registry:${m}`));
    const trails = g.members.reduce((n, m) => n + (bySeedName.get(m)?.trails ?? 0), 0);
    const lifts = g.members.reduce((n, m) => n + (bySeedName.get(m)?.lifts ?? 0), 0);
    const places = seed?.places ?? g.members.reduce((n, m) => n + (bySeedName.get(m)?.places ?? 0), 0);
    const { country, region } = seed ? classify(seed) : { country: "France", region: "Tarentaise" };

    out.push({
      seed,
      stage: stageFor(g.name, seed),
      trails,
      lifts,
      places,
      entry: {
        id: groupIds.get(g.name)!,
        kind: "group",
        name: g.name,
        aliases: g.name === "Les 3 Vallées" ? ["Les Trois Vallées", "3 Vallees"] : [],
        status: "active",
        skimapId: g.skimapId,
        wikidataQid: null,
        osmIds: g.osmIds,
        country,
        region,
        centroid,
        bbox: bboxAround(centroid, 18),
        groupId: null,
        groupName: null,
        memberIds,
        excludeFromGroupNaming: false,
        createdAt: iso(-90 * DAY),
        updatedAt: iso(-2 * DAY),
      },
    });
  }

  const groupNames = new Set(GROUPS.map((g) => g.name));

  for (const s of SEED_RESORTS) {
    // A snapshot row that is itself a curated group is already emitted above.
    if (groupNames.has(s.name)) continue;
    // "Les Trois Vallées" is the duplicate polygon of the group, not an entity.
    if (s.name === "Les Trois Vallées") continue;

    const centroid: LngLat = [s.lng, s.lat];
    const { country, region } = classify(s);
    const groupName = memberToGroup.get(s.name) ?? null;

    out.push({
      seed: s,
      stage: stageFor(s.name, s),
      trails: s.trails,
      lifts: s.lifts,
      places: s.places,
      entry: {
        id: uuidFrom(`registry:${s.name}`),
        kind: "resort",
        name: s.name,
        aliases: [],
        status: s.imported ? "active" : "draft",
        skimapId: null,
        wikidataQid: null,
        osmIds: s.osmId ? [s.osmId] : [],
        country,
        region,
        centroid,
        bbox: bboxAround(centroid, s.trails > 80 ? 12 : 5),
        groupId: groupName ? groupIds.get(groupName)! : null,
        groupName,
        memberIds: [],
        excludeFromGroupNaming: false,
        createdAt: iso(-90 * DAY),
        updatedAt: iso(-int(rng(`upd:${s.name}`), 1, 40) * DAY),
      },
    });
  }

  cachedRegistry = out.sort((a, b) => a.entry.name.localeCompare(b.entry.name));
  return cachedRegistry;
}

/* ── places ───────────────────────────────────────────────────────────────── */

const FOOD = [
  "La Cave", "Le Chalet", "La Bergerie", "Le Hors Piste", "La Folie Douce",
  "Le Refuge", "L'Alpage", "Chez Pépé Nicolas", "Le Bouchon", "La Grange",
  "Le Panoramic", "La Marmotte", "Le Sherpa", "La Ferme",
] as const;
const LODGING = [
  "Hôtel Le Fitz Roy", "Chalet Kaya", "Résidence Les Balcons", "Hôtel Mercure",
  "Chalet Blanchot", "Le Portetta", "Les Suites du Montana",
] as const;
const SHOPS = [
  "Skiset", "Intersport", "Sport 2000", "Précision Ski", "Twinner",
  "Skimium", "Ski Fun",
] as const;
const CIVIC = [
  "Office de Tourisme", "ESF", "Pharmacie des Neiges", "Boulangerie du Val",
  "La Poste", "Cabinet Médical",
] as const;

/**
 * Plausible category disagreements between OSM and Overture for the same
 * building. A chalet that Overture calls a hotel is the everyday case; a
 * restaurant it calls a bar is the other one.
 */
const ALT_CATEGORY: Record<string, readonly string[]> = {
  chalet: ["hotel", "holiday_rental_home"],
  hotel: ["chalet", "holiday_rental_home"],
  holiday_rental_home: ["chalet", "hotel"],
  restaurant: ["french_restaurant", "bar", "cafe"],
  french_restaurant: ["restaurant", "bar"],
  pizza_restaurant: ["restaurant", "cafe"],
  bar: ["cafe", "restaurant"],
  cafe: ["bar", "restaurant"],
  ski_and_snowboard_shop: ["sporting_goods_store"],
  sporting_goods_store: ["ski_and_snowboard_shop"],
  ski_and_snowboard_school: ["tourist_information_center"],
  bakery: ["cafe"],
};

const CATEGORIES: Record<string, readonly string[]> = {
  food: ["restaurant", "french_restaurant", "pizza_restaurant", "bar", "cafe"],
  lodging: ["hotel", "holiday_rental_home", "chalet"],
  shop: ["ski_and_snowboard_shop", "sporting_goods_store"],
  civic: ["tourist_information_center", "ski_and_snowboard_school", "pharmacy", "bakery", "post_office"],
};

function makePlace(
  seedKey: string,
  name: string,
  kind: keyof typeof CATEGORIES,
  centroid: LngLat,
  spreadKm: number,
  layer: PlaceCandidate["layer"]
): PlaceCandidate {
  const r = rng(seedKey);
  const dLat = ((r() - 0.5) * 2 * spreadKm) / 111;
  const dLng = ((r() - 0.5) * 2 * spreadKm) / (111 * Math.cos((centroid[1] * Math.PI) / 180));
  const category = pick(r, CATEGORIES[kind]);

  // Overture rows carry a confidence and a GERS id; OSM rows carry neither.
  const fromOverture = layer !== "osm" && r() > 0.45;
  const confidence = fromOverture ? Math.round((0.35 + r() * 0.62) * 100) / 100 : null;

  const refs: PlaceCandidate["refs"] = [];
  if (layer !== "overture") {
    refs.push({
      source: "osm",
      externalId: `node/${int(r, 100000000, 999999999)}`,
      url: null,
      fetchedAt: iso(-3 * DAY),
      release: null,
    });
  }
  if (fromOverture) {
    refs.push({
      source: "overture",
      externalId: `08f1${uuidFrom(seedKey).replace(/-/g, "").slice(0, 12)}`,
      url: null,
      fetchedAt: iso(-3 * DAY),
      release: OVERTURE_RELEASE,
    });
  }

  const provenance: Record<string, "osm" | "overture" | "wikidata"> = {
    name: layer === "overture" ? "overture" : "osm",
    category: fromOverture ? "overture" : "osm",
    geometry: "osm",
  };
  if (r() > 0.7) provenance.website = "overture";
  if (r() > 0.85) provenance.description = "wikidata";

  return {
    id: `place:${seedKey}`,
    name,
    category,
    point: [
      Math.round((centroid[0] + dLng) * 1e5) / 1e5,
      Math.round((centroid[1] + dLat) * 1e5) / 1e5,
    ],
    layer,
    refs,
    confidence,
    operatingStatus: r() > 0.94 ? "permanently_closed" : r() > 0.5 ? "open" : null,
    fieldProvenance: provenance,
    addressLine: null,
  };
}

export function buildPlaces(entry: RegistryEntry, count: number): PlaceCandidate[] {
  const r = rng(`places:${entry.id}`);
  const spread = entry.kind === "group" ? 9 : 3.5;
  const out: PlaceCandidate[] = [];

  for (let i = 0; i < count; i++) {
    const bucket = pick(r, ["food", "food", "lodging", "shop", "civic"] as const);
    const pool = bucket === "food" ? FOOD : bucket === "lodging" ? LODGING : bucket === "shop" ? SHOPS : CIVIC;
    const name = pool[i % pool.length];
    const layer: PlaceCandidate["layer"] = i % 5 === 0 ? "overture" : i % 7 === 0 ? "osm" : "conflated";
    out.push(makePlace(`${entry.id}:${i}`, name, bucket, entry.centroid, spread, layer));
  }
  return out;
}

/* ── harvest ──────────────────────────────────────────────────────────────── */

/**
 * The duplicate-restaurant pathology, reproduced from the real finding: "La
 * Cave" appears **eight times** inside the Val Thorens / Les 3 Vallées entities
 * because one village restaurant was multiplied across both duplicate domain
 * polygons and both Val Thorens rows.
 */
function laCaveCluster(entry: RegistryEntry): PlaceCandidate[] {
  return Array.from({ length: 8 }, (_, i) =>
    makePlace(`${entry.id}:lacave:${i}`, "La Cave", "food", entry.centroid, 1.2, i % 3 === 0 ? "overture" : "conflated")
  );
}

export function buildHarvest(runId: string, built: BuiltEntry): HarvestResponse {
  const { entry } = built;
  const r = rng(`harvest:${entry.id}`);
  const total = Math.max(24, built.places || int(r, 30, 120));
  const places = buildPlaces(entry, Math.min(total, 220));

  const isThreeValleys = entry.name === "Les 3 Vallées";
  if (isThreeValleys) places.push(...laCaveCluster(entry));

  const conflicts: HarvestConflict[] = [];
  const push = (c: Omit<HarvestConflict, "resolved" | "resolvedVerdict">) =>
    conflicts.push({ ...c, resolved: false, resolvedVerdict: null });

  // Same name, different location — the 8× "La Cave" case, and general dupes.
  const byName = new Map<string, PlaceCandidate[]>();
  for (const p of places) {
    const list = byName.get(p.name) ?? [];
    list.push(p);
    byName.set(p.name, list);
  }
  for (const [name, list] of byName) {
    for (let i = 1; i < Math.min(list.length, 9); i++) {
      const a = list[0];
      const b = list[i];
      const d = Math.round(
        Math.hypot((a.point[0] - b.point[0]) * 78000, (a.point[1] - b.point[1]) * 111000)
      );
      if (d > 4000) continue;
      push({
        id: `${runId}:name:${name}:${i}`,
        type: "same_name_different_location",
        severity: d < 150 ? "high" : "medium",
        left: a,
        right: b,
        distanceM: d,
        suggestion: d < 150 ? "merge" : "keep_left",
        note:
          d < 150
            ? `Two rows ${d} m apart with an identical name — almost certainly one place counted twice.`
            : `Same name ${d} m apart. Could be a genuine second branch; check before merging.`,
      });
    }
  }

  // Same location, different category. The two sides are one place seen twice
  // — same name, metres apart, disagreeing on what it is — which is what the
  // OSM/Overture category mismatch actually looks like. Pairing two unrelated
  // neighbours would be a different problem wearing this label.
  for (let i = 0; i < places.length; i += 17) {
    const a = places[i];
    const cr = rng(`cat:${runId}:${i}`);
    const alt = pick(cr, ALT_CATEGORY[a.category] ?? []);
    if (!alt) continue;
    const offsetM = int(cr, 3, 40);
    const b: PlaceCandidate = {
      ...a,
      id: `${a.id}:overture`,
      category: alt,
      layer: "overture",
      confidence: Math.round((0.55 + cr() * 0.4) * 100) / 100,
      point: [
        Math.round((a.point[0] + offsetM / 78000) * 1e5) / 1e5,
        Math.round((a.point[1] + offsetM / 111000) * 1e5) / 1e5,
      ],
      refs: [
        {
          source: "overture",
          externalId: `08f1${uuidFrom(`${a.id}:alt`).replace(/-/g, "").slice(0, 12)}`,
          url: null,
          fetchedAt: iso(-3 * DAY),
          release: OVERTURE_RELEASE,
        },
      ],
      fieldProvenance: { name: "overture", category: "overture", geometry: "overture" },
    };
    push({
      id: `${runId}:cat:${i}`,
      type: "same_location_different_category",
      severity: "medium",
      left: a,
      right: b,
      distanceM: offsetM,
      suggestion: "merge",
      note: `Same name ${offsetM} m apart: OSM says ${a.category}, Overture says ${alt}. One place, two categories — merging keeps both refs and one geometry.`,
    });
  }

  // Low confidence, near the threshold.
  const threshold = 0.5;
  for (const p of places) {
    if (p.confidence !== null && p.confidence >= 0.35 && p.confidence < threshold) {
      push({
        id: `${runId}:conf:${p.id}`,
        type: "low_confidence",
        severity: "low",
        left: p,
        right: null,
        distanceM: null,
        suggestion: p.confidence >= 0.45 ? "keep_left" : "skip",
        note: `Overture confidence ${p.confidence.toFixed(2)}, below the ${threshold} threshold. Confidence is existence-likelihood, not open/closed.`,
      });
    }
  }

  // permanently_closed exclusions.
  for (const p of places) {
    if (p.operatingStatus === "permanently_closed") {
      push({
        id: `${runId}:closed:${p.id}`,
        type: "permanently_closed",
        severity: "low",
        left: p,
        right: null,
        distanceM: null,
        suggestion: "skip",
        note: "Overture reports permanently_closed. Excluded unless local knowledge says otherwise.",
      });
    }
  }

  const overtureCount = places.filter((p) => p.refs.some((x) => x.source === "overture")).length;
  const osmCount = places.filter((p) => p.refs.some((x) => x.source === "osm")).length;
  const newFromOverture = places.filter(
    (p) => p.refs.some((x) => x.source === "overture") && !p.refs.some((x) => x.source === "osm")
  ).length;

  return {
    summary: {
      runId,
      registryId: entry.id,
      registryName: entry.name,
      osmCount,
      overtureCount,
      conflatedCount: places.length,
      newFromOverture,
      excludedClosed: places.filter((p) => p.operatingStatus === "permanently_closed").length,
      belowConfidence: places.filter((p) => p.confidence !== null && p.confidence < threshold).length,
      confidenceThreshold: threshold,
      overtureRelease: OVERTURE_RELEASE,
      osmExtractedAt: iso(-3 * DAY),
    },
    conflicts: conflicts
      .sort((a, b) => {
        const w = { high: 0, medium: 1, low: 2 };
        return w[a.severity] - w[b.severity] || a.id.localeCompare(b.id);
      })
      .slice(0, 180),
    places,
    nextCursor: null,
  };
}

/* ── membership ───────────────────────────────────────────────────────────── */

/** The leaves that have no ski-area polygon, and therefore no registry entry. */
export const MISSING_LEAVES = ["Courchevel", "Méribel", "Les Menuires", "Saint-Martin-de-Belleville"];

export function buildMembership(runId: string, built: BuiltEntry, memberEntries: RegistryEntry[]): MembershipResponse {
  const { entry } = built;
  const r = rng(`membership:${entry.id}`);
  const harvest = buildHarvest(runId, built);

  const members = (memberEntries.length ? memberEntries : [entry]).map((m, i) => {
    const mr = rng(`member:${m.id}`);
    const placeCount = int(mr, 8, Math.max(12, Math.floor((built.places || 60) / Math.max(1, memberEntries.length || 1))));
    return {
      resortId: m.id,
      name: m.name,
      colorIndex: i,
      placeCount,
      liftCount: int(mr, 2, 40),
      trailCount: int(mr, 4, 90),
      byBasis: {
        network: Math.floor(placeCount * 0.55),
        settlement: Math.floor(placeCount * 0.4),
        manual: placeCount - Math.floor(placeCount * 0.55) - Math.floor(placeCount * 0.4),
      },
    };
  });

  // The orphan belt. For Les 3 Vallées these are concentrated in the villages
  // that have no member boundary at all — which is the whole diagnosis.
  const isThreeValleys = entry.name === "Les 3 Vallées";
  const orphanCount = isThreeValleys ? 34 : entry.kind === "group" ? int(r, 4, 18) : int(r, 0, 7);
  const orphans = Array.from({ length: orphanCount }, (_, i) => {
    const village = isThreeValleys ? MISSING_LEAVES[i % MISSING_LEAVES.length] : null;
    const place = harvest.places[(i * 5) % harvest.places.length];
    const nearest = members[i % members.length];
    return {
      id: `${runId}:orphan:${i}`,
      place: { ...place, id: `${place.id}:orphan:${i}` },
      nearestMemberId: nearest?.resortId ?? null,
      nearestMemberName: nearest?.name ?? null,
      distanceM: int(rng(`od:${runId}:${i}`), 400, 6200),
      reason: village
        ? `Inside the group extent but claimed by no member. Sits in ${village}, which has no member boundary — the leaf does not exist in the registry.`
        : "Inside the group extent, not reachable from any member network and not inside any member commune.",
      resolved: false,
    };
  });

  const emptyMembers = members.filter((m) => m.placeCount === 0 || m.liftCount === 0);
  const gates: ValidationGate[] = [
    {
      key: "orphan_belt",
      status: orphans.length > 0 ? "fail" : "pass",
      title: "Orphan belt",
      detail:
        orphans.length > 0
          ? `${orphans.length} places inside the group extent are claimed by no member. An orphan belt almost always means a missing member boundary, not stray data.`
          : "Every place inside the group extent is claimed by at least one member.",
      count: orphans.length,
      blocking: true,
      waiver: null,
      evidence: orphans.slice(0, 6).map((o) => ({
        id: o.id,
        label: o.place.name,
        detail: `${o.distanceM} m from ${o.nearestMemberName ?? "any member"}`,
      })),
    },
    {
      key: "empty_member",
      status: emptyMembers.length > 0 ? "fail" : "pass",
      title: "Empty member resort",
      detail:
        emptyMembers.length > 0
          ? `${emptyMembers.length} declared member(s) received no features. Either the boundary is wrong or the member should not have been declared.`
          : "Every declared member received features.",
      count: emptyMembers.length,
      blocking: true,
      waiver: null,
      evidence: emptyMembers.map((m) => ({
        id: m.resortId,
        label: m.name,
        detail: `${m.placeCount} places, ${m.liftCount} lifts`,
      })),
    },
    {
      key: "duplicate_claim",
      status: isThreeValleys ? "fail" : r() > 0.8 ? "fail" : "pass",
      title: "Duplicate area claim",
      detail: isThreeValleys
        ? "OSM 45117869 (249.2 km²) and OSM 3545276 (218.3 km²) claim the same domain: 87.2% of the larger is covered by the smaller, 99.6% the other way. They are one entity with two evidence refs."
        : "No two entities claim ≥85% of the same area.",
      count: isThreeValleys ? 1 : 0,
      blocking: true,
      waiver: null,
      evidence: isThreeValleys
        ? [
            { id: "45117869", label: "OSM 45117869", detail: "249.2 km² — “Les 3 Vallées”" },
            { id: "3545276", label: "OSM 3545276", detail: "218.3 km² — “Les Trois Vallées”" },
          ]
        : [],
    },
    {
      key: "downhill_without_lift",
      status: r() > 0.75 ? "fail" : "pass",
      title: "Downhill cluster with no lift",
      detail:
        "A run field with no lift serving it is not a ski area. Clusters that fail this lose their downhill activity rather than becoming a resort.",
      count: r() > 0.75 ? int(r, 1, 3) : 0,
      blocking: true,
      waiver: null,
      evidence: [],
    },
  ];

  return {
    runId,
    registryId: entry.id,
    registryName: entry.name,
    members,
    multiMembershipCount: entry.kind === "group" ? int(r, 6, 40) : int(r, 0, 4),
    assignedCount: members.reduce((n, m) => n + m.placeCount, 0),
    orphans,
    gates,
    places: harvest.places.slice(0, 200).map((p, i) => ({
      ...p,
      memberIds: members.length
        ? i % 11 === 0 && members.length > 1
          ? [members[i % members.length].resortId, members[(i + 1) % members.length].resortId]
          : [members[i % members.length].resortId]
        : [],
      bases: (i % 3 === 0 ? ["settlement"] : i % 7 === 0 ? ["manual"] : ["network"]) as (
        | "network"
        | "settlement"
        | "manual"
      )[],
    })),
  };
}

/* ── enrichment ───────────────────────────────────────────────────────────── */

/**
 * Foursquare pricing, from the verified evidence base: Pro is $15/1k up to 100k
 * calls, $12/1k for 100k–500k, $9/1k for 500k–1M, with 500 free calls a month.
 */
const FSQ_TIERS = [
  { max: 100_000, rate: 15, label: "Pro, 0–100k calls" },
  { max: 500_000, rate: 12, label: "Pro, 100k–500k calls" },
  { max: 1_000_000, rate: 9, label: "Pro, 500k–1M calls" },
];

export function buildEnrichmentEstimate(runId: string, built: BuiltEntry): EnrichmentEstimate {
  const { entry } = built;
  const r = rng(`enrich:${entry.id}`);
  const poiTotal = Math.max(20, built.places || int(r, 40, 160));
  const alreadyCoveredFree = Math.floor(poiTotal * (0.18 + r() * 0.12));
  const filteredLowConfidence = Math.floor(poiTotal * (0.05 + r() * 0.08));
  // Only a group can save anything here — that is the point of keying on the
  // place entity rather than the resort row.
  const dedupedAcrossGroup =
    entry.kind === "group" ? Math.floor(poiTotal * (0.12 + r() * 0.15)) : 0;
  const billablePois = Math.max(
    0,
    poiTotal - alreadyCoveredFree - filteredLowConfidence - dedupedAcrossGroup
  );
  const callsPerPoi = 2.4;
  const billableCalls = Math.round(billablePois * callsPerPoi);
  const tier = FSQ_TIERS[0];
  const freeCallsRemaining = int(r, 0, 500);
  const chargeable = Math.max(0, billableCalls - freeCallsRemaining);

  return {
    runId,
    registryId: entry.id,
    registryName: entry.name,
    scope: entry.kind === "group" ? "group" : "resort",
    provider: "foursquare",
    poiTotal,
    alreadyCoveredFree,
    filteredLowConfidence,
    dedupedAcrossGroup,
    billablePois,
    callsPerPoi,
    billableCalls,
    sampledMatchRate: Math.round((0.62 + r() * 0.28) * 100) / 100,
    sampleSize: 50,
    tier: tier.label,
    tierRateUsdPerThousand: tier.rate,
    freeCallsRemaining,
    projectedCostUsd: Math.round((chargeable / 1000) * tier.rate * 100) / 100,
    notes: [
      `Match rate sampled on ${50} free-tier calls before committing to the batch.`,
      dedupedAcrossGroup > 0
        ? `${dedupedAcrossGroup} POIs are shared between members and are paid for once, because enrichment keys on the place entity rather than the resort row.`
        : "Single resort — no cross-member dedupe applies.",
      "Responses are cached into our database; paid credits roll over for 12 months, free monthly credits expire at month end.",
      "Tripadvisor stores location_id only; everything else is fetched live under their display rules.",
    ],
    estimatedAt: iso(-int(r, 1, 20) * HOUR),
  };
}

export function buildEnrichmentReport(
  runId: string,
  built: BuiltEntry,
  estimate: EnrichmentEstimate,
  approved: boolean
): EnrichmentReport {
  const r = rng(`report:${built.entry.id}`);
  if (!approved) {
    return {
      runId,
      matched: 0,
      unmatched: 0,
      matchRate: 0,
      creditsUsed: 0,
      actualCostUsd: 0,
      completedAt: null,
      approval: null,
      unmatchedPlaces: [],
    };
  }
  const matched = Math.round(estimate.billablePois * estimate.sampledMatchRate);
  const unmatched = estimate.billablePois - matched;
  return {
    runId,
    matched,
    unmatched,
    matchRate: estimate.billablePois ? matched / estimate.billablePois : 0,
    creditsUsed: estimate.billableCalls,
    actualCostUsd: Math.round(estimate.projectedCostUsd * (0.9 + r() * 0.15) * 100) / 100,
    completedAt: iso(-int(r, 1, 10) * HOUR),
    approval: null,
    unmatchedPlaces: buildPlaces(built.entry, Math.min(unmatched, 40)),
  };
}

/* ── QA ───────────────────────────────────────────────────────────────────── */

export function buildQaChecks(built: BuiltEntry): QaCheck[] {
  const { entry } = built;
  const r = rng(`qa:${entry.id}`);
  const places = buildPlaces(entry, Math.min(built.places || 40, 80));

  const collisions = places.filter((p, i) => places.findIndex((q) => q.name === p.name) !== i);
  const highAltitudeHotels = places
    .filter((p) => p.category === "hotel")
    .slice(0, int(r, 0, 3))
    .map((p, i) => ({
      id: `outlier:hotel:${i}`,
      label: p.name,
      detail: `Category hotel at ${int(rng(`alt:${p.id}`), 2600, 3200)} m. Verify it is not a mountain refuge mis-categorised.`,
      placeId: p.id,
      point: p.point,
    }));

  // The -32768 sentinel that reaches the app as a real altitude.
  const sentinel =
    built.seed && built.seed.baseAltitude === -32768
      ? [
          {
            id: "outlier:sentinel",
            label: `${entry.name} base altitude`,
            detail:
              "base_altitude is -32768, an unguarded no-data sentinel. It reaches the app as a real elevation and must be nulled before publish.",
            placeId: null,
            point: null,
          },
        ]
      : [];

  const noGeometry = places
    .filter((p) => p.category === "ski_and_snowboard_school")
    .slice(0, int(r, 0, 2))
    .map((p, i) => ({
      id: `nogeom:${i}`,
      label: p.name,
      detail: "Ski school with a name and no geometry. Either geocode it or drop it.",
      placeId: p.id,
      point: null,
    }));

  const danglingCount = int(r, 0, 4);
  const currentPlaces = built.places || places.length;
  const previousPlaces = Math.max(0, currentPlaces - int(r, -30, 60));
  const delta = currentPlaces - previousPlaces;

  const check = (
    key: QaCheck["key"],
    title: string,
    items: QaCheck["items"],
    failAt: number,
    detail: string
  ): QaCheck => ({
    id: `${entry.id}:${key}`,
    key,
    title,
    status: items.length === 0 ? "pass" : items.length >= failAt ? "fail" : "warn",
    count: items.length,
    detail,
    items,
    waiver: null,
  });

  return [
    check(
      "name_collision",
      "Name collisions",
      collisions.slice(0, 12).map((p, i) => ({
        id: `coll:${i}`,
        label: p.name,
        detail: `${collisions.filter((q) => q.name === p.name).length + 1} places share this name inside the entity.`,
        placeId: p.id,
        point: p.point,
      })),
      3,
      "Two places with the same name inside one resort are usually one place counted twice."
    ),
    check(
      "category_outlier",
      "Unusual attribute combinations",
      [...highAltitudeHotels, ...sentinel],
      2,
      "Combinations that are individually valid but implausible together — the check Slopes runs by eye, run mechanically first."
    ),
    check(
      "count_delta",
      "Count delta vs previous run",
      Math.abs(delta) > 25
        ? [
            {
              id: "delta:places",
              label: "Places",
              detail: `${previousPlaces} → ${currentPlaces} (${delta >= 0 ? "+" : ""}${delta}). A swing this size usually means a boundary or provider change, not new commerce.`,
              placeId: null,
              point: null,
            },
          ]
        : [],
      1,
      "Large movements between runs need an explanation before publish."
    ),
    check(
      "dangling_ref",
      "Dangling references",
      Array.from({ length: danglingCount }, (_, i) => ({
        id: `dangle:${i}`,
        label: `place_refs → osm node/${int(rng(`dang:${entry.id}:${i}`), 100000000, 999999999)}`,
        detail: "Ref points at an OSM element that is absent from the current extract.",
        placeId: null,
        point: null,
      })),
      2,
      "Refs that no longer resolve break provenance and refresh."
    ),
    check(
      "missing_geometry",
      "Missing geometry",
      noGeometry,
      2,
      "Entities with a name and no location cannot be shown, routed to, or grouped."
    ),
  ];
}

export function buildChecklist(): ChecklistItem[] {
  return [
    {
      key: "piste_names",
      label: "Piste names match the official trail map",
      hint: "Compare the rendered run labels against the resort's own map, sheet by sheet.",
      checked: false,
      checkedBy: null,
      checkedAt: null,
    },
    {
      key: "lift_count",
      label: "Lift count is plausible for the domain",
      hint: "A domain claiming 30 lifts when the operator advertises 60 usually means a missing member.",
      checked: false,
      checkedBy: null,
      checkedAt: null,
    },
    {
      key: "village_commerce",
      label: "Village commerce looks sane",
      hint: "Every village in the extent should have food and lodging. An empty village means a settlement rule missed it.",
      checked: false,
      checkedBy: null,
      checkedAt: null,
    },
    {
      key: "group_naming",
      label: "Group and member names read correctly in the app",
      hint: "Check the leaf name, the “part of” chip, and any member that opted out of group naming.",
      checked: false,
      checkedBy: null,
      checkedAt: null,
    },
  ];
}

/* ── runs ─────────────────────────────────────────────────────────────────── */

const STAGE_ORDER: Stage[] = [
  "not_started",
  "identity",
  "harvested",
  "membership",
  "enriched",
  "qa",
  "published",
];

export function stageIndex(s: Stage): number {
  return s === "needs_rerun" ? 3 : STAGE_ORDER.indexOf(s);
}

export function buildRunsFor(built: BuiltEntry): IngestionRun[] {
  const { entry, stage } = built;
  if (stage === "not_started") return [];
  const r = rng(`runs:${entry.id}`);
  const idx = stageIndex(stage);
  const count = Math.min(3, Math.max(1, Math.ceil(idx / 2)));

  return Array.from({ length: count }, (_, k): IngestionRun => {
    const age = (count - k) * int(r, 1, 9) * DAY;
    const reached = k === count - 1 ? idx : Math.max(1, idx - (count - 1 - k));
    const stages: RunStage[] = (
      ["identity", "harvest", "membership", "enrichment", "publish"] as const
    ).map((sk, i) => {
      const ran = i < reached;
      const dur = ran ? int(rng(`d:${entry.id}:${k}:${i}`), 20_000, 900_000) : null;
      return {
        stage: sk,
        status: ran ? ("succeeded" as const) : ("skipped" as const),
        startedAt: ran ? iso(-age + i * 60_000) : null,
        finishedAt: ran ? iso(-age + i * 60_000 + (dur ?? 0)) : null,
        durationMs: dur,
        summary: ran ? STAGE_SUMMARY[sk] : "Not run",
        error: null,
      };
    });

    const enrichmentRan = reached >= 4;
    const cost = enrichmentRan ? Math.round(int(r, 600, 3800) / 100) : 0;

    return {
      id: uuidFrom(`run:${entry.id}:${k}`),
      registryId: entry.id,
      registryName: entry.name,
      kind: entry.kind,
      status:
        stage === "needs_rerun" && k === count - 1 ? ("failed" as const) : ("succeeded" as const),
      trigger: k === 0 ? ("manual" as const) : ("rerun" as const),
      triggeredBy: "analyst@alpline.com",
      startedAt: iso(-age),
      finishedAt: iso(-age + 900_000),
      durationMs: 900_000,
      stages,
      providers: [
        { provider: "osm", calls: 1, costUsd: 0, release: `rhone-alpes ${iso(-age).slice(0, 10)}`, status: "ok" },
        {
          provider: "overture",
          calls: 1,
          costUsd: 0,
          release: OVERTURE_RELEASE,
          status: "ok",
        },
        { provider: "wikidata", calls: int(r, 4, 40), costUsd: 0, release: null, status: "ok" },
        ...(enrichmentRan
          ? ([
              {
                provider: "fsq" as const,
                calls: int(r, 200, 2400),
                costUsd: cost,
                release: null,
                status: "ok" as const,
              },
            ])
          : []),
      ],
      costUsd: cost,
      gateOutcomes: (["orphan_belt", "empty_member", "duplicate_claim", "downhill_without_lift"] as GateKey[]).map(
        (key) => ({ key, status: reached >= 3 ? ("pass" as const) : ("not_run" as const) })
      ),
      approvals: [],
      waivers: [],
    };
  }).reverse();
}

const STAGE_SUMMARY: Record<string, string> = {
  identity: "Registry entries resolved and group membership curated.",
  harvest: "OSM extraction, Overture place download and conflation into places.",
  membership: "Network flood-fill over the routing graph plus settlement assignment.",
  enrichment: "Foursquare batch against the approved ceiling.",
  publish: "Snapshot promoted to the app-facing tables.",
};


/* ── official piste map stand-in ──────────────────────────────────────────── */

/**
 * A schematic "official" piste map, generated as an SVG data URI.
 *
 * The QA workspace compares our rendered data against the resort's own printed
 * map, and there is no real sheet to serve in mock mode. Rather than showing an
 * empty pane — which would make the most important screen in the console look
 * broken — this draws a plausible operator-style schematic: graded run lines in
 * the piste palette, dashed lifts, and named points. It is deterministic per
 * resort, and the console labels it as synthetic so nobody mistakes it for a
 * real sheet.
 */
export function buildPisteMapSvg(name: string, seed: string): string {
  const r = rng(`pistemap:${seed}`);
  const W = 1000;
  const H = 700;
  const GRADES = ["#34c759", "#007aff", "#ff3b30", "#1d1d1f"];

  const parts: string[] = [];
  parts.push(
    `<rect width="${W}" height="${H}" fill="#f4f6f8"/>`,
    // Ridge line, so the sheet reads as terrain rather than a chart.
    `<path d="M0 ${170 + Math.round(r() * 40)} ${Array.from({ length: 10 }, (_, i) =>
      `L${(i + 1) * (W / 10)} ${120 + Math.round(r() * 120)}`
    ).join(" ")} L${W} ${H} L0 ${H} Z" fill="#e6ebf0"/>`
  );

  for (let i = 0; i < 22; i++) {
    const grade = GRADES[Math.floor(r() * GRADES.length)];
    const x0 = 60 + Math.round(r() * (W - 160));
    const y0 = 150 + Math.round(r() * 160);
    const x1 = x0 + Math.round((r() - 0.5) * 260);
    const y1 = y0 + 190 + Math.round(r() * 240);
    const cx = (x0 + x1) / 2 + Math.round((r() - 0.5) * 140);
    parts.push(
      `<path d="M${x0} ${y0} Q${cx} ${(y0 + y1) / 2} ${x1} ${y1}" fill="none" stroke="${grade}" stroke-width="3.5" stroke-linecap="round" opacity="0.9"/>`
    );
  }

  for (let i = 0; i < 9; i++) {
    const x0 = 80 + Math.round(r() * (W - 200));
    const y0 = 520 + Math.round(r() * 120);
    const x1 = x0 + Math.round((r() - 0.5) * 200);
    const y1 = 150 + Math.round(r() * 120);
    parts.push(
      `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#4a4a4f" stroke-width="2" stroke-dasharray="9 6"/>`,
      `<circle cx="${x1}" cy="${y1}" r="4" fill="#4a4a4f"/>`
    );
  }

  const villages = ["Village", "Le Praz", "Les Chalets", "La Gare", "Plan des Mains"];
  for (let i = 0; i < 4; i++) {
    const x = 90 + Math.round(r() * (W - 240));
    const y = 560 + Math.round(r() * 110);
    parts.push(
      `<circle cx="${x}" cy="${y}" r="6" fill="#1d1d1f"/>`,
      `<text x="${x + 11}" y="${y + 4}" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1d1d1f">${
        villages[i % villages.length]
      }</text>`
    );
  }

  const escaped = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  parts.push(
    `<text x="34" y="58" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="700" fill="#1d1d1f">${escaped}</text>`,
    `<text x="34" y="84" font-family="Helvetica,Arial,sans-serif" font-size="15" fill="#6b6b70">Plan des pistes — schematic stand-in, not an operator sheet</text>`
  );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${parts.join(
    ""
  )}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ── routing coverage (screen 8) ──────────────────────────────────────────── */

/**
 * Coverage fixtures.
 *
 * Modelled on Les 3 Vallées as the pipeline actually reports it: ~770 routable
 * km over 18 components with one dominant component, ~1.1k connector edges, a
 * handful of lift terminals that never joined the graph, and one small piste
 * cluster with no lift serving it.
 *
 * The number that tells the real story is the gap between the graph's routable
 * km and the km the census can attribute to a member: the three biggest leaves
 * (Courchevel, Méribel, Les Menuires) have no polygon and therefore no registry
 * entry, so most of the domain's piste km belongs to no member row. That is the
 * same missing-leaf diagnosis the orphan belt gives on screen 4, seen from the
 * graph instead of from the POIs.
 */

/** OSM `piste:difficulty` values, in the order a trail map prints them. */
const DIFFICULTY_ORDER = ["novice", "easy", "intermediate", "advanced", "expert"] as const;

/** OSM `aerialway` / `railway=funicular` values, commonest first. */
const LIFT_TYPE_ORDER = ["chair_lift", "gondola", "drag_lift", "t-bar", "cable_car", "magic_carpet"] as const;

/**
 * Operator lift names as a liftie-style feed publishes them. Real Trois Vallées
 * names, because the whole point of the liftie comparison is matching against
 * what the operator calls its own lifts.
 */
const LIFT_NAMES = [
  "Cime Caron", "Funitel Grand Fond", "Plein Sud", "Moutière", "Péclet",
  "Cascades", "Bouquetin", "Pionniers", "Rosaël", "Trois Vallées",
  "Bouchet", "Portette", "Boismint", "Plan de l'Eau", "Cairn",
  "Deux Lacs", "Gentianes", "Col", "Thorens", "Grand Fond",
  "Saulire Express", "Roc Merlet", "Ariondaz", "Aiguille du Fruit",
] as const;

/** Pinned so the flagship domain reads like the pipeline's own report. */
const PINNED_GRAPH: Record<
  string,
  { edges: number; components: number; largestComponentPct: number; routableKm: number; connectorEdges: number; pisteKm: number; reachablePistePct: number }
> = {
  "Les 3 Vallées": {
    edges: 21_438,
    components: 18,
    largestComponentPct: 98.3,
    routableKm: 770.4,
    connectorEdges: 1_104,
    // The piste-only share of routableKm — the census sums to exactly this.
    pisteKm: 592.7,
    reachablePistePct: 97.1,
  },
};

/** Liftie lifts with no OSM counterpart — the strongest "we missed one" signal. */
const PINNED_MISSING_LIFTS: Record<string, string[]> = {
  "Les 3 Vallées": ["Roc Merlet", "Ariondaz", "Aiguille du Fruit"],
};

/** The findings cap the backend applies. Rendered as "showing N of M". */
export const COVERAGE_FINDING_CAP = 60;

/**
 * Which verdicts settle a gate.
 *
 * GAPS 11, decided and implemented backend-side on 2026-09-11: only verdicts
 * that are claims about the graph itself settle a gate — `local_override`
 * (we repaired it) and `accept_gap` (it is correct as-is). `fix_upstream`
 * and `retry` mean "still broken, the fix is elsewhere", so the gate stays
 * failing until a re-extract clears the finding or the analyst waives the
 * gate. The mock mirrors the shipped rule, as always.
 */
export const SETTLING_VERDICTS: ReadonlySet<string> = new Set([
  "local_override",
  "accept_gap",
]);

function distribute(total: number, keys: readonly string[], r: () => number): Record<string, number> {
  const out: Record<string, number> = {};
  let left = total;
  keys.forEach((k, i) => {
    const share = i === keys.length - 1 ? left : Math.round(left * (0.2 + r() * 0.45));
    out[k] = Math.max(0, Math.min(left, share));
    left -= out[k];
  });
  return out;
}

/**
 * Per-member census.
 *
 * Member km are a *division of the graph's piste km*, never independent
 * numbers: the backend attributes every scoped piste edge to a member
 * (polygon containment first, nearest anchor as fallback — GAPS 13), so the
 * census sums to graph.pisteKm exactly. A member is unattributed only when
 * it has neither polygon nor anchor.
 */
function buildCoverageMembers(
  built: BuiltEntry,
  memberEntries: RegistryEntry[],
  pisteKmTotal: number
): CoverageMemberStats[] {
  const roster = memberEntries.length ? memberEntries : [built.entry];

  // Every fixture entry has a centroid, so the anchor fallback attributes
  // them all — matching the shipped backend, where attributed:false needs a
  // member with neither polygon nor anchor.
  const weights = roster.map((m) => 0.4 + rng(`coverage:weight:${m.id}`)());
  const totalWeight = weights.reduce((n, w) => n + w, 0) || 1;

  return roster.map((m, i) => {
    const mr = rng(`coverage:member:${m.id}`);
    const attributed = weights[i] > 0;
    const pisteKm = attributed
      ? Math.round(pisteKmTotal * (weights[i] / totalWeight) * 10) / 10
      : 0;
    // Roughly one lift per 9 km of piste, which is the density a real domain
    // runs at; a census that puts 3 lifts against 100 km reads as broken data.
    const liftCount = attributed ? Math.max(1, Math.round(pisteKm / 9) + int(mr, -1, 2)) : 0;
    const namedRunCount = attributed ? Math.max(1, Math.round(pisteKm / 1.7) + int(mr, -4, 4)) : 0;
    return {
      resortId: m.id,
      name: m.name,
      colorIndex: i,
      attributed,
      pisteKm,
      liftCount,
      namedRunCount,
      runsByDifficulty: attributed ? distribute(namedRunCount, DIFFICULTY_ORDER, mr) : {},
      liftsByType: attributed ? distribute(liftCount, LIFT_TYPE_ORDER, mr) : {},
    };
  });
}

export function buildCoverage(
  built: BuiltEntry,
  memberEntries: RegistryEntry[]
): Omit<CoverageResponse, "gates"> {
  const { entry } = built;
  const r = rng(`coverage:${entry.id}`);

  // The graph exists only once the pipeline has extracted the region. Before
  // that — production today, every fresh e2e database — there is nothing to
  // measure, and saying so is more useful than reporting zeros as findings.
  const graphAvailable = stageIndex(built.stage) >= 2;

  if (!graphAvailable) {
    return {
      registryId: entry.id,
      registryName: entry.name,
      computedAt: iso(0),
      graphAvailable: false,
      graph: {
        edges: 0,
        components: 0,
        largestComponentPct: null,
        routableKm: 0,
        connectorEdges: 0,
        pisteKm: 0,
        reachablePistePct: null,
      },
      members: [],
      reference: [],
      findings: [],
    };
  }

  const pinned = PINNED_GRAPH[entry.name];
  const graph = pinned ?? {
    edges: built.trails * 26 + built.lifts * 9 + int(r, 40, 600),
    components: Math.max(1, Math.round(built.trails / 42) + int(r, 0, 3)),
    largestComponentPct: Math.round((100 - r() * 7) * 10) / 10,
    routableKm: Math.round(Math.max(4, built.trails * 1.9) * 10) / 10,
    connectorEdges: built.lifts * 7 + int(r, 0, 40),
    // Piste is roughly three quarters of routable on a real domain; the rest
    // is lift lines and connectors.
    pisteKm: Math.round(Math.max(3, built.trails * 1.9) * 0.76 * 10) / 10,
    reachablePistePct: Math.round((100 - r() * 9) * 10) / 10,
  };

  const members = buildCoverageMembers(built, memberEntries, graph.pisteKm);
  const attributedMembers = members.filter((m) => m.attributed);
  // Domain-wide, not the member sum: the reference feed lists the operator's
  // whole lift estate, and attribution is a separate question. Comparing a
  // domain count against a member-attributed subtotal would manufacture a
  // delta out of the missing leaves.
  const extractedLifts = Math.max(
    built.lifts,
    members.reduce((n, m) => n + m.liftCount, 0)
  );

  /* ── reference comparison ───────────────────────────────────────────────── */

  // Rotated from a per-entry offset rather than sliced from the top, so the
  // flagship domain's lift names do not turn up at every other resort.
  const nameOffset = int(rng(`liftnames:${entry.id}`), 0, LIFT_NAMES.length - 1);
  const missingLifts =
    PINNED_MISSING_LIFTS[entry.name] ??
    (r() > 0.55
      ? Array.from(
          { length: int(r, 1, 2) },
          (_, i) => LIFT_NAMES[(nameOffset + i) % LIFT_NAMES.length]
        )
      : []);

  // liftie covers 201 resorts in production, so plenty of entries have no
  // mapping at all — and a mapped resort out of season publishes a live feed
  // with no lift list. Both are real states the analyst should see.
  const liftieMapped = Boolean(PINNED_MISSING_LIFTS[entry.name]) || r() > 0.28;
  const liftieInSeason = r() > 0.2;
  // A feed we could not read produces no findings. Generating "missing lift"
  // rows from a comparison that never ran would invent the one signal on this
  // screen that is supposed to be operator-authoritative.
  const liftieComparable = liftieMapped && liftieInSeason;
  // Derived so the card is internally consistent: whatever the operator lists
  // is what we matched, plus what we missed. `extra` are extracted lifts the
  // feed does not name — usually a drag lift the status page ignores.
  const extraLifts = Math.min(extractedLifts, int(r, 0, 2));
  const matchedLifts = extractedLifts - extraLifts;
  const referenceLiftCount = matchedLifts + missingLifts.length;

  const reference: ReferenceComparison[] = [
    liftieComparable
      ? {
          source: "liftie",
          status: "ok",
          detail: `Operator status page scraped via alpline-lifts. ${referenceLiftCount} lifts published, matched against extracted lift names through lift_name_aliases plus fuzzy match.`,
          lifts: {
            referenceCount: referenceLiftCount,
            extractedCount: extractedLifts,
            matchedCount: matchedLifts,
            missing: missingLifts,
            extraCount: extraLifts,
          },
          runs: null,
        }
      : {
          source: "liftie",
          status: "unavailable",
          detail: liftieMapped
            ? "Feed live but no lift list published (out of season). The comparison runs again once the operator publishes lift status."
            : "No liftie mapping for this entry. The feed covers 201 resorts and this one is not among them.",
          lifts: null,
          runs: null,
        },
    {
      source: "skimap",
      status: "unavailable",
      detail:
        "Skimap index carries no lift or run counts — the entry is the editorial member list and the piste-map sheet, neither of which is countable. The sheet itself is compared by eye on the QA screen.",
      lifts: null,
      runs: null,
    },
    {
      source: "declared",
      status: "unavailable",
      detail:
        "No official figures recorded for this entry. Where declared counts should live is still open: a declaredCounts field on the onboarding manifest is proposed, not decided.",
      lifts: null,
      runs: null,
    },
  ];

  /* ── findings ───────────────────────────────────────────────────────────── */

  const attributedOf = (i: number) =>
    attributedMembers.length ? attributedMembers[i % attributedMembers.length] : null;

  const near = (i: number): LngLat => [
    Math.round((entry.centroid[0] + (rng(`covpt:${entry.id}:${i}:x`)() - 0.5) * 0.16) * 1e6) / 1e6,
    Math.round((entry.centroid[1] + (rng(`covpt:${entry.id}:${i}:y`)() - 0.5) * 0.1) * 1e6) / 1e6,
  ];

  const terminalCount = pinned ? 5 : int(r, 0, 4);
  const terminals: CoverageFinding[] = Array.from({ length: terminalCount }, (_, i) => {
    const tr = rng(`terminal:${entry.id}:${i}`);
    const nodeId = int(tr, 1_000_000_00, 9_999_999_99);
    const wayId = int(tr, 1_000_000_0, 9_999_999_9);
    const gapM = int(tr, 22, 96);
    const owner = attributedOf(i);
    const lift = LIFT_NAMES[Math.floor(tr() * LIFT_NAMES.length)];
    return {
      id: `terminal:${nodeId}:${wayId}`,
      type: "unconnected_terminal" as const,
      label: `${lift} — ${i % 2 === 0 ? "top" : "bottom"} station`,
      detail: `Terminal node ${nodeId} is ${gapM} m from the nearest piste node on way ${wayId} and no connector edge was generated. Every route that would use this lift is invisible to the router.`,
      point: near(i),
      memberId: owner?.resortId ?? null,
      memberName: owner?.name ?? null,
      km: null,
      verdict: null,
    };
  });

  const isolatedCount = pinned ? 1 : r() > 0.72 ? 1 : 0;
  const isolated: CoverageFinding[] = Array.from({ length: isolatedCount }, (_, i) => {
    const ir = rng(`isolated:${entry.id}:${i}`);
    const km = pinned ? 3.1 : Math.round((0.6 + ir() * 5) * 10) / 10;
    const ways = int(ir, 3, 11);
    const owner = attributedOf(i + 1);
    return {
      id: `component:${entry.id.slice(0, 8)}:${i}`,
      type: "isolated_component" as const,
      label: `Isolated piste component — ${ways} ways, ${km} km`,
      detail: `${km} km of piste sits in a graph component containing no lift edge, so nothing can be routed to it. The size floor that separates a pipeline gap from a legitimately unserved slope is still being calibrated, so read the geometry before deciding.`,
      point: near(100 + i),
      memberId: owner?.resortId ?? null,
      memberName: owner?.name ?? null,
      km,
      verdict: null,
    };
  });

  const referenceFindings: CoverageFinding[] = (liftieComparable ? missingLifts : []).map((name, i) => {
    const owner = attributedOf(i + 2);
    return {
      id: `refLift:${entry.id.slice(0, 8)}:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      type: "missing_reference_lift" as const,
      label: name,
      detail: `The operator's own status page lists “${name}”, and no extracted lift matches it by name or alias. Either the lift is absent from OSM, or it is mapped under a different name and needs an alias.`,
      point: near(200 + i),
      memberId: owner?.resortId ?? null,
      memberName: owner?.name ?? null,
      km: null,
      verdict: null,
    };
  });

  const difficultyCount = int(r, 3, 12);
  const difficulty: CoverageFinding[] = Array.from({ length: difficultyCount }, (_, i) => {
    const dr = rng(`difficulty:${entry.id}:${i}`);
    const wayId = int(dr, 1_000_000_0, 9_999_999_9);
    const owner = attributedOf(i + 3);
    return {
      id: `difficulty:${wayId}`,
      type: "missing_difficulty" as const,
      label: `Piste way ${wayId}`,
      detail:
        "Tagged piste:type=downhill with no piste:difficulty. Routing still works but grades the run as unknown, so skill-aware routing cannot honour a skier's limit on it.",
      point: near(300 + i),
      memberId: owner?.resortId ?? null,
      memberName: owner?.name ?? null,
      km: null,
      verdict: null,
    };
  });

  return {
    registryId: entry.id,
    registryName: entry.name,
    computedAt: iso(0),
    graphAvailable: true,
    graph,
    members,
    reference,
    findings: [...terminals, ...isolated, ...referenceFindings, ...difficulty].slice(
      0,
      COVERAGE_FINDING_CAP
    ),
  };
}

/**
 * The four coverage gates, derived from the current findings rather than stored
 * — same rule as the report itself. Called with findings that already carry
 * their verdicts, so the counts are live.
 */
export function buildCoverageGates(
  findings: CoverageFinding[],
  graphAvailable: boolean,
  /**
   * False when no reference source could be compared — no liftie mapping, or a
   * feed that is live but out of season. `reference_delta` is then `not_run`
   * rather than `pass`: a gate that could not run has not held, and reporting
   * it green would be the most misleading thing on the screen.
   */
  referenceComparable = true
): ValidationGate[] {
  const open = (type: CoverageFinding["type"]) =>
    findings.filter((f) => f.type === type && !SETTLING_VERDICTS.has(f.verdict?.value ?? ""));

  const gate = (
    key: GateKey,
    title: string,
    blocking: boolean,
    open: CoverageFinding[],
    failing: string,
    passing: string,
    ran = true
  ): ValidationGate => ({
    key,
    status: !graphAvailable || !ran ? "not_run" : open.length === 0 ? "pass" : "fail",
    title,
    detail: !graphAvailable
      ? "No routing graph on this database, so this gate has not run."
      : !ran
        ? "No reference source could be compared, so this gate has not run. It is not passing — nothing checked it."
        : open.length === 0
          ? passing
          : failing,
    count: graphAvailable && ran ? open.length : 0,
    blocking,
    waiver: null,
    evidence: open.slice(0, 6).map((f) => ({
      id: f.id,
      label: f.label,
      detail: f.detail.slice(0, 130),
    })),
  });

  const terminals = open("unconnected_terminal");
  const isolated = open("isolated_component");
  const refLifts = open("missing_reference_lift");
  const difficulty = open("missing_difficulty");

  return [
    gate(
      "disconnected_terminal",
      "Disconnected lift terminal",
      true,
      terminals,
      `${terminals.length} lift terminal(s) never joined the routable graph. This is exactly the failure the v2 connector work exists to prevent, so a non-zero count here is a regression, not a data quirk.`,
      "Every lift terminal is joined into the routable graph by a connector edge."
    ),
    gate(
      "isolated_component",
      "Isolated piste component",
      true,
      isolated,
      `${isolated.length} piste component(s) above the size floor contain no lift edge, so nothing in them can be routed to.`,
      "Every piste component above the size floor is reachable from a lift."
    ),
    gate(
      "reference_delta",
      "Reference delta",
      true,
      refLifts,
      `${refLifts.length} lift(s) on the operator's own status page have no extracted counterpart. Lift names diff near-exactly; the run-count half of this comparison has no agreed tolerance yet and is not gated.`,
      "Every lift the operator publishes has an extracted counterpart.",
      referenceComparable
    ),
    gate(
      "missing_difficulty",
      "Missing piste difficulty",
      false,
      difficulty,
      `${difficulty.length} way(s) carry piste:type with no difficulty. Routing degrades to an unknown grade rather than breaking, so this warns rather than blocks.`,
      "Every piste way carries a difficulty grade."
    ),
  ];
}

/**
 * The sixth QA check. Coverage is the routing half of "is this entry actually
 * complete", and publishing without it would mean publishing a resort whose map
 * is measured and whose router is not.
 */
export function buildCoverageQaCheck(
  registryId: string,
  graphAvailable: boolean,
  gates: ValidationGate[],
  unresolvedFindings: number
): QaCheck {
  const blockingFail = gates.filter((g) => g.blocking && g.status === "fail");

  if (!graphAvailable) {
    return {
      id: `${registryId}:coverage_signed_off`,
      key: "coverage_signed_off",
      title: "Routing coverage signed off",
      status: "warn",
      count: 0,
      detail:
        "No routing graph on this database yet, so coverage is unmeasured. It runs after the pipeline imports this region; until then nothing here has been verified against the graph.",
      items: [],
      waiver: null,
    };
  }

  if (blockingFail.length > 0) {
    return {
      id: `${registryId}:coverage_signed_off`,
      key: "coverage_signed_off",
      title: "Routing coverage signed off",
      status: "fail",
      count: blockingFail.length,
      detail:
        "Blocking coverage gates are still failing. Clear or waive them on the Coverage tab — publishing now would ship a resort whose POIs are measured and whose routing graph is not.",
      items: blockingFail.map((g) => ({
        id: `${registryId}:coverage:${g.key}`,
        label: g.title,
        detail: `${g.count} open — ${g.detail}`,
        placeId: null,
        point: null,
      })),
      waiver: null,
    };
  }

  return {
    id: `${registryId}:coverage_signed_off`,
    key: "coverage_signed_off",
    title: "Routing coverage signed off",
    status: "pass",
    count: 0,
    detail:
      unresolvedFindings > 0
        ? `Every blocking coverage gate passes or is waived. ${unresolvedFindings} warn-level finding(s) remain in the queue.`
        : "Every coverage gate passes or is waived and the findings queue is empty.",
    items: [],
    waiver: null,
  };
}
