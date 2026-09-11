/**
 * ============================================================================
 *  Alpline ingestion API — the complete contract between the Ingestion Console
 *  and alpline-backend.
 * ============================================================================
 *
 * This file is a **specification first and a runtime second**. The console is
 * built entirely against it, and the backend team implements against it. The
 * zod schemas are the normative description of every payload; the TypeScript
 * types are inferred from them so the two can never drift.
 *
 * Provenance — every concept here traces to one of:
 *   - alpline-admin/RESORT-INGESTION-PIPELINE-V2.md  (the stage model, §3.4)
 *   - alpline-admin/DB-SCHEMA-AUDIT-AND-FLATTENING.md §4 (the target schema)
 *
 * Design rules this contract holds itself to:
 *
 *  1. **Polygons are evidence, not identity.** A registry entry carries
 *     `osmIds: number[]`, never a single `osm_id`. Two overlapping polygons
 *     become two refs on one entry — that is how the duplicate "Les 3 Vallées"
 *     bug dies structurally rather than by tiebreaker.
 *  2. **Membership is many-to-many with provenance.** A place belongs to N
 *     resorts, each with a `basis` and a `confidence`. Nothing is ever assigned
 *     by smallest-wins.
 *  3. **Provenance is first-class.** Every enriched field records which source
 *     produced it, because the Tripadvisor terms (store only `location_id`) and
 *     the Foursquare §14 destroy-on-termination clause both require knowing
 *     exactly which rows came from which provider.
 *  4. **Nothing paid runs without an explicit approval row**, and nothing
 *     destructive happens without an audit row naming who, when, and why.
 *  5. **Bounded reads only.** Every list endpoint is paginated or bbox-scoped.
 *     A group like Les 3 Vallées is ~600 places and the region is ~6k trails;
 *     no endpoint here may return an unbounded geospatial result.
 *
 * Routes are declared alongside their schemas and collected in `ROUTES` at the
 * bottom, which the HTTP adapter and GAPS.md both read from.
 */

import { z } from "zod";

/* ========================================================================== *
 *  1. Primitives
 * ========================================================================== */

/** ISO-8601 instant. The flattened schema is `timestamptz` everywhere. */
export const Instant = z.iso.datetime({ offset: true });

/** [longitude, latitude] — GeoJSON axis order, SRID 4326, as everywhere else. */
export const LngLat = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
export type LngLat = z.infer<typeof LngLat>;

/** [west, south, east, north]. */
export const BBox = z.tuple([z.number(), z.number(), z.number(), z.number()]);
export type BBox = z.infer<typeof BBox>;

/**
 * Where a fact came from. `skimap` and `wikidata` seed identity; `osm` and
 * `overture` harvest for free; `fsq` and `tripadvisor` are paid/licensed;
 * `manual` is the analyst.
 */
export const RefSource = z.enum([
  "osm",
  "overture",
  "wikidata",
  "skimap",
  "fsq",
  "tripadvisor",
  "manual",
]);
export type RefSource = z.infer<typeof RefSource>;

export const ExternalRef = z.object({
  source: RefSource,
  /** Opaque to us: an OSM element id, a GERS id, an fsq_id, a QID, an integer. */
  externalId: z.string(),
  url: z.string().url().nullish(),
  fetchedAt: Instant.nullish(),
  /**
   * Dataset release the ref was observed in. Mandatory for Overture: only the
   * last two monthly releases stay hosted, so a ref without a release version
   * is unreproducible.
   */
  release: z.string().nullish(),
});
export type ExternalRef = z.infer<typeof ExternalRef>;

/** Who did a thing. Resolved server-side from the console session, never trusted from the client. */
export const Actor = z.object({
  email: z.string().email(),
  displayName: z.string().nullish(),
});
export type Actor = z.infer<typeof Actor>;

export const Paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
    total: z.number().int().nonnegative(),
  });

/* ========================================================================== *
 *  2. Registry — identity (pipeline Stage 0)
 * ========================================================================== */

/** A registry entry is either a leaf resort or a curated group over leaves. */
export const RegistryKind = z.enum(["resort", "group"]);
export type RegistryKind = z.infer<typeof RegistryKind>;

export const RegistryStatus = z.enum(["draft", "active", "retired"]);
export type RegistryStatus = z.infer<typeof RegistryStatus>;

/**
 * Where a registry entry sits in the pipeline. This is the console's primary
 * organising axis — every screen is "the queue for one of these stages".
 *
 *   not_started → identity → harvested → membership → enriched → qa → published
 *
 * `needs_rerun` is orthogonal to progress: it means upstream data moved (a new
 * Overture release, an OSM re-extract) and the entry's results are stale.
 */
export const Stage = z.enum([
  "not_started",
  "identity",
  "harvested",
  "membership",
  "enriched",
  "qa",
  "published",
  "needs_rerun",
]);
export type Stage = z.infer<typeof Stage>;

export const RegistryEntry = z.object({
  id: z.string().uuid(),
  kind: RegistryKind,
  name: z.string().min(1),
  aliases: z.array(z.string()),
  status: RegistryStatus,

  // External refs — the identity spine. See §3.1 of the pipeline spec.
  skimapId: z.number().int().nullable(),
  wikidataQid: z.string().regex(/^Q\d+$/).nullable(),
  /** Plural by design: overlapping polygons are evidence refs on one entry. */
  osmIds: z.array(z.number().int()),

  country: z.string(),
  region: z.string(),
  centroid: LngLat,
  bbox: BBox,

  /** Set on a leaf that belongs to a group. */
  groupId: z.string().uuid().nullable(),
  groupName: z.string().nullable(),
  /** Set on a group: its curated member leaves. */
  memberIds: z.array(z.string().uuid()),
  /** Slopes v2024.5 behaviour: a member may opt out of domain renaming. */
  excludeFromGroupNaming: z.boolean(),

  createdAt: Instant,
  updatedAt: Instant,
});
export type RegistryEntry = z.infer<typeof RegistryEntry>;

/* ========================================================================== *
 *  3. Places — the harvested and conflated entity
 * ========================================================================== */

/**
 * Overture's `operating_status` default changed from `open` to `null` in the
 * May 2026 release: `null` means "no signal", not "open". The filtering policy
 * is therefore **exclude only `permanently_closed`** — treating `null` as
 * closed silently drops most of the dataset.
 */
export const OperatingStatus = z.enum(["open", "permanently_closed"]).nullable();

export const PlaceCandidate = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  point: LngLat,
  /** Which layer of the harvest this row belongs to, for the map toggle. */
  layer: z.enum(["osm", "overture", "conflated"]),
  refs: z.array(ExternalRef),
  /**
   * Overture existence-likelihood, 0–1. It is a *relative filtering knob*, not
   * a calibrated probability, and is independent of open/closed. Null for rows
   * that did not come from Overture.
   */
  confidence: z.number().min(0).max(1).nullable(),
  operatingStatus: OperatingStatus,
  /** Per-field provenance, surfaced as source chips in the harvest review. */
  fieldProvenance: z.record(z.string(), RefSource),
  addressLine: z.string().nullish(),
});
export type PlaceCandidate = z.infer<typeof PlaceCandidate>;

/* ========================================================================== *
 *  4. Screen 1 — Atlas worklist
 *  GET /ingestion/worklist
 * ========================================================================== */

/**
 * What the analyst should do next for this entry, precomputed by the backend so
 * that "sort by next action needed" is a server-side ordering rather than a
 * heuristic the console has to reinvent.
 */
export const NextAction = z.object({
  label: z.string(),
  /** Console-relative path, e.g. `/console/resorts/{id}/harvest`. */
  href: z.string(),
  /**
   * `blocked` outranks everything: a failed gate or an unapproved spend stops
   * the entry advancing. `ready` is work the analyst can do now. `waiting` is
   * a pipeline run in flight. `done` is published and current.
   */
  priority: z.enum(["blocked", "ready", "waiting", "done"]),
  /** Server-assigned sort key, ascending. Lower means "do this first". */
  rank: z.number().int(),
});
export type NextAction = z.infer<typeof NextAction>;

export const WorklistRow = z.object({
  registryId: z.string().uuid(),
  kind: RegistryKind,
  name: z.string(),
  groupName: z.string().nullable(),
  country: z.string(),
  region: z.string(),
  centroid: LngLat,
  bbox: BBox,

  stage: Stage,
  nextAction: NextAction,

  /** Counts that drive the badges. Zero-cost for the analyst to scan. */
  gateFailures: z.number().int().nonnegative(),
  openConflicts: z.number().int().nonnegative(),
  orphanCount: z.number().int().nonnegative(),
  qaFailures: z.number().int().nonnegative(),

  lastRunId: z.string().uuid().nullable(),
  lastRunAt: Instant.nullable(),
  lastRunStatus: z.enum(["queued", "running", "succeeded", "failed", "cancelled"]).nullable(),

  costIncurredUsd: z.number().nonnegative(),
  /** Approved but not yet spent, so the analyst can see committed budget. */
  costApprovedUsd: z.number().nonnegative(),

  placeCount: z.number().int().nonnegative(),
  liftCount: z.number().int().nonnegative(),
  trailCount: z.number().int().nonnegative(),
  memberCount: z.number().int().nonnegative(),
});
export type WorklistRow = z.infer<typeof WorklistRow>;

export const WorklistSummary = z.object({
  total: z.number().int().nonnegative(),
  published: z.number().int().nonnegative(),
  byStage: z.record(Stage, z.number().int().nonnegative()),
  gatesFailing: z.number().int().nonnegative(),
  awaitingSpendApproval: z.number().int().nonnegative(),
  costToDateUsd: z.number().nonnegative(),
  generatedAt: Instant,
});
export type WorklistSummary = z.infer<typeof WorklistSummary>;

export const WorklistQuery = z.object({
  stage: Stage.optional(),
  q: z.string().optional(),
  /** Only rows whose next action is blocked — the "what needs me now" filter. */
  blockedOnly: z.boolean().optional(),
  sort: z.enum(["next_action", "name", "last_run", "cost"]).default("next_action"),
  limit: z.number().int().min(1).max(500).default(200),
  cursor: z.string().optional(),
});
export type WorklistQuery = z.infer<typeof WorklistQuery>;

export const WorklistResponse = z.object({
  summary: WorklistSummary,
  rows: z.array(WorklistRow),
  nextCursor: z.string().nullable(),
});
export type WorklistResponse = z.infer<typeof WorklistResponse>;

/* ========================================================================== *
 *  5. Screen 2 — Onboarding wizard (Stage 0, identity)
 * ========================================================================== */

/**
 * A candidate identity from one of the three seeding sources. Skimap gives us
 * the editorial domain grouping for free (id 1079 = Les 3 Vallées and its
 * member list); Wikidata anchors leaves that have no ski-area polygon at all
 * (Courchevel, Méribel, Les Menuires); OSM supplies the geometry evidence.
 */
export const IdentityCandidate = z.object({
  id: z.string(),
  source: z.enum(["skimap", "wikidata", "osm"]),
  externalId: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  centroid: LngLat,
  bbox: BBox.nullable(),
  areaKm2: z.number().nonnegative().nullable(),
  country: z.string().nullable(),
  adminArea: z.string().nullable(),
  /** Skimap's editorial member list, where it has one. */
  memberNames: z.array(z.string()),
  /** 0–1 relevance against the query. Ordering only, not a probability. */
  matchScore: z.number().min(0).max(1),
  url: z.string().url().nullable(),
  /** True when this candidate already resolves to an existing registry entry. */
  existingRegistryId: z.string().uuid().nullable(),
});
export type IdentityCandidate = z.infer<typeof IdentityCandidate>;

/**
 * Two OSM polygons with ≥85% mutual overlap. Surfaced at onboarding so the
 * analyst merges them into one registry entry with two evidence refs, rather
 * than letting the pipeline mint two resorts.
 */
export const DuplicatePair = z.object({
  id: z.string(),
  left: IdentityCandidate,
  right: IdentityCandidate,
  /** Overlap is asymmetric — report both directions, never a single number. */
  overlapOfLeftPct: z.number().min(0).max(100),
  overlapOfRightPct: z.number().min(0).max(100),
  recommendation: z.enum(["merge", "keep_both"]),
  rationale: z.string(),
});
export type DuplicatePair = z.infer<typeof DuplicatePair>;

export const CandidateSearchQuery = z.object({
  q: z.string().min(1),
  sources: z.array(z.enum(["skimap", "wikidata", "osm"])).optional(),
  bbox: BBox.optional(),
  limit: z.number().int().min(1).max(50).default(20),
});
export type CandidateSearchQuery = z.infer<typeof CandidateSearchQuery>;

export const CandidateSearchResponse = z.object({
  candidates: z.array(IdentityCandidate),
  duplicates: z.array(DuplicatePair),
});
export type CandidateSearchResponse = z.infer<typeof CandidateSearchResponse>;

export const ManifestMember = z.object({
  /** Stable within the manifest; the backend mints the registry UUID. */
  key: z.string(),
  name: z.string().min(1),
  aliases: z.array(z.string()),
  skimapId: z.number().int().nullable(),
  wikidataQid: z.string().nullable(),
  osmIds: z.array(z.number().int()),
  excludeFromGroupNaming: z.boolean(),
  source: z.enum(["skimap", "wikidata", "osm", "manual"]),
  existingRegistryId: z.string().uuid().nullable(),
});
export type ManifestMember = z.infer<typeof ManifestMember>;

export const VillageSeed = z.object({
  name: z.string().min(1),
  point: LngLat,
});
export type VillageSeed = z.infer<typeof VillageSeed>;

/**
 * The onboarding manifest is the pipeline's input contract — "the constructor",
 * in the words of the spec. The wizard renders it as reviewable JSON alongside
 * the form precisely because it is the artefact, not the form state.
 */
export const OnboardingManifest = z.object({
  manifestId: z.string(),
  status: z.enum(["draft", "submitted"]),
  /** Null for a standalone resort with no domain above it. */
  group: z
    .object({
      name: z.string().min(1),
      aliases: z.array(z.string()),
      skimapId: z.number().int().nullable(),
      wikidataQid: z.string().nullable(),
      osmIds: z.array(z.number().int()),
      existingRegistryId: z.string().uuid().nullable(),
    })
    .nullable(),
  members: z.array(ManifestMember),
  bbox: BBox,
  villageSeeds: z.array(VillageSeed),
  providers: z.object({
    osm: z.boolean(),
    overture: z.boolean(),
    wikidata: z.boolean(),
  }),
  notes: z.string(),
  createdBy: z.string().email(),
  createdAt: Instant,
  updatedAt: Instant,
});
export type OnboardingManifest = z.infer<typeof OnboardingManifest>;

export const ManifestIssue = z.object({
  severity: z.enum(["error", "warning"]),
  code: z.string(),
  message: z.string(),
  /** Dotted path into the manifest, e.g. `members[2].osmIds`. */
  path: z.string().nullable(),
});
export type ManifestIssue = z.infer<typeof ManifestIssue>;

export const ManifestValidation = z.object({
  issues: z.array(ManifestIssue),
  /** False when any issue is an error; the submit control keys off this. */
  submittable: z.boolean(),
});
export type ManifestValidation = z.infer<typeof ManifestValidation>;

export const SubmitManifestResponse = z.object({
  runId: z.string().uuid(),
  registryId: z.string().uuid(),
  createdMemberIds: z.array(z.string().uuid()),
});
export type SubmitManifestResponse = z.infer<typeof SubmitManifestResponse>;

/* ========================================================================== *
 *  6. Screen 3 — Harvest review (Stage 1)
 * ========================================================================== */

export const ConflictType = z.enum([
  "same_name_different_location",
  "same_location_different_category",
  "low_confidence",
  "permanently_closed",
]);
export type ConflictType = z.infer<typeof ConflictType>;

/** Single-keystroke verdicts. The key bindings live in the console, not here. */
export const ConflictVerdictValue = z.enum(["keep_left", "keep_right", "merge", "skip"]);
export type ConflictVerdictValue = z.infer<typeof ConflictVerdictValue>;

export const HarvestConflict = z.object({
  id: z.string(),
  type: ConflictType,
  /** Ordering hint: higher means resolve sooner. */
  severity: z.enum(["high", "medium", "low"]),
  left: PlaceCandidate,
  /** Null for single-sided conflicts (low confidence, closed). */
  right: PlaceCandidate.nullable(),
  distanceM: z.number().nonnegative().nullable(),
  suggestion: ConflictVerdictValue,
  note: z.string(),
  resolved: z.boolean(),
  resolvedVerdict: ConflictVerdictValue.nullable(),
});
export type HarvestConflict = z.infer<typeof HarvestConflict>;

export const HarvestSummary = z.object({
  runId: z.string().uuid(),
  registryId: z.string().uuid(),
  registryName: z.string(),
  osmCount: z.number().int().nonnegative(),
  overtureCount: z.number().int().nonnegative(),
  conflatedCount: z.number().int().nonnegative(),
  /**
   * Overture rows with no OSM counterpart. The rhône-alpes probe found ~26% of
   * the near-resort Overture pool is wholly new coverage OSM cannot produce —
   * this number is the running check on that claim.
   */
  newFromOverture: z.number().int().nonnegative(),
  excludedClosed: z.number().int().nonnegative(),
  belowConfidence: z.number().int().nonnegative(),
  confidenceThreshold: z.number().min(0).max(1),
  /** Mandatory: Overture hosts only the last two monthly releases. */
  overtureRelease: z.string(),
  osmExtractedAt: Instant,
});
export type HarvestSummary = z.infer<typeof HarvestSummary>;

export const HarvestResponse = z.object({
  summary: HarvestSummary,
  conflicts: z.array(HarvestConflict),
  /** bbox-scoped and capped; the map draws these, the queue drives them. */
  places: z.array(PlaceCandidate),
  nextCursor: z.string().nullable(),
});
export type HarvestResponse = z.infer<typeof HarvestResponse>;

export const HarvestVerdictsRequest = z.object({
  verdicts: z.array(
    z.object({
      conflictId: z.string(),
      verdict: ConflictVerdictValue,
      note: z.string().nullish(),
    })
  ),
});
export type HarvestVerdictsRequest = z.infer<typeof HarvestVerdictsRequest>;

export const BulkAcceptRequest = z.object({
  /** Accept the suggested verdict for every unresolved conflict at or above this. */
  minConfidence: z.number().min(0).max(1),
  types: z.array(ConflictType),
});
export type BulkAcceptRequest = z.infer<typeof BulkAcceptRequest>;

export const VerdictsResponse = z.object({
  applied: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  auditIds: z.array(z.string()),
});
export type VerdictsResponse = z.infer<typeof VerdictsResponse>;

/* ========================================================================== *
 *  7. Screen 4 — Membership and validation gates (Stage 2)
 * ========================================================================== */

/**
 * How a place came to belong to a resort. `network` is graph reachability over
 * the routing v2 component graph — the one pillar where we beat OpenSkiMap,
 * which uses a 0.5 km proximity buffer. `settlement` is commune/admin boundary
 * intersection, which is how Courchevel gets its village commerce despite
 * having no ski-area polygon. `manual` is the analyst.
 */
export const MembershipBasis = z.enum(["network", "settlement", "manual"]);
export type MembershipBasis = z.infer<typeof MembershipBasis>;

export const MemberAssignment = z.object({
  resortId: z.string().uuid(),
  name: z.string(),
  /** Stable per-member colour so the map and the legend agree. */
  colorIndex: z.number().int().nonnegative(),
  placeCount: z.number().int().nonnegative(),
  liftCount: z.number().int().nonnegative(),
  trailCount: z.number().int().nonnegative(),
  byBasis: z.record(MembershipBasis, z.number().int().nonnegative()),
});
export type MemberAssignment = z.infer<typeof MemberAssignment>;

/**
 * A place inside the group extent that no member claimed. Almost always means a
 * missing member boundary, which is why the queue action is "assign / create
 * member / flag boundary" rather than "delete".
 */
export const OrphanPlace = z.object({
  id: z.string(),
  place: PlaceCandidate,
  nearestMemberId: z.string().uuid().nullable(),
  nearestMemberName: z.string().nullable(),
  distanceM: z.number().nonnegative().nullable(),
  reason: z.string(),
  resolved: z.boolean(),
});
export type OrphanPlace = z.infer<typeof OrphanPlace>;

/**
 * Validation gates. The first four are the membership gates from §3.4 of the
 * pipeline spec; the last four are routing-coverage gates (screen 8) and are
 * registry-scoped rather than run-scoped, which is why they waive through their
 * own route. One enum rather than two because a gate is a gate: same status
 * model, same waiver record, same "blocking" semantics, same card.
 */
export const GateKey = z.enum([
  "orphan_belt",
  "empty_member",
  "duplicate_claim",
  "downhill_without_lift",
  "disconnected_terminal",
  "isolated_component",
  "reference_delta",
  "missing_difficulty",
]);
export type GateKey = z.infer<typeof GateKey>;

export const GateStatus = z.enum(["pass", "fail", "waived", "not_run"]);
export type GateStatus = z.infer<typeof GateStatus>;

export const Waiver = z.object({
  reason: z.string().min(1),
  actor: z.string().email(),
  at: Instant,
});
export type Waiver = z.infer<typeof Waiver>;

export const ValidationGate = z.object({
  key: GateKey,
  status: GateStatus,
  title: z.string(),
  detail: z.string(),
  count: z.number().int().nonnegative(),
  /** A failing blocking gate stops advancement to Stage 3. This is the QA that Slopes does by eye, made structural. */
  blocking: z.boolean(),
  waiver: Waiver.nullable(),
  /** Named offenders, capped server-side, so the card can show evidence. */
  evidence: z.array(z.object({ id: z.string(), label: z.string(), detail: z.string() })),
});
export type ValidationGate = z.infer<typeof ValidationGate>;

export const MembershipResponse = z.object({
  runId: z.string().uuid(),
  registryId: z.string().uuid(),
  registryName: z.string(),
  members: z.array(MemberAssignment),
  /** Places belonging to more than one member — legitimate, drawn hatched. */
  multiMembershipCount: z.number().int().nonnegative(),
  assignedCount: z.number().int().nonnegative(),
  orphans: z.array(OrphanPlace),
  gates: z.array(ValidationGate),
  /** Every assigned place, for the coloured map. bbox-scoped and capped. */
  places: z.array(
    PlaceCandidate.extend({
      memberIds: z.array(z.string().uuid()),
      bases: z.array(MembershipBasis),
    })
  ),
});
export type MembershipResponse = z.infer<typeof MembershipResponse>;

export const MembershipActionsRequest = z.object({
  actions: z.array(
    z.object({
      orphanId: z.string(),
      action: z.enum(["assign", "create_member", "flag_boundary", "skip"]),
      resortId: z.string().uuid().nullish(),
      newMemberName: z.string().nullish(),
      note: z.string().nullish(),
    })
  ),
});
export type MembershipActionsRequest = z.infer<typeof MembershipActionsRequest>;

export const WaiveGateRequest = z.object({
  reason: z.string().min(1),
});
export type WaiveGateRequest = z.infer<typeof WaiveGateRequest>;

/* ========================================================================== *
 *  8. Screen 5 — Enrichment cost gate (Stage 3)
 * ========================================================================== */

/**
 * The Foursquare dry-run estimator. Per §3.4 it must: skip POIs already covered
 * by free sources, filter low-confidence Overture rows, sample the match rate
 * on free-tier calls, and dedupe by place entity across the whole group — the
 * last one being what makes a domain cost once rather than 4×.
 */
export const EnrichmentEstimate = z.object({
  runId: z.string().uuid(),
  registryId: z.string().uuid(),
  registryName: z.string(),
  scope: z.enum(["resort", "group"]),
  provider: z.literal("foursquare"),

  poiTotal: z.number().int().nonnegative(),
  alreadyCoveredFree: z.number().int().nonnegative(),
  filteredLowConfidence: z.number().int().nonnegative(),
  /** Saved by keying on the place entity instead of the resort row. */
  dedupedAcrossGroup: z.number().int().nonnegative(),
  billablePois: z.number().int().nonnegative(),

  callsPerPoi: z.number().positive(),
  billableCalls: z.number().int().nonnegative(),

  /** Sampled on free-tier calls before committing to the batch. */
  sampledMatchRate: z.number().min(0).max(1),
  sampleSize: z.number().int().nonnegative(),

  tier: z.string(),
  tierRateUsdPerThousand: z.number().nonnegative(),
  freeCallsRemaining: z.number().int().nonnegative(),
  projectedCostUsd: z.number().nonnegative(),

  notes: z.array(z.string()),
  estimatedAt: Instant,
});
export type EnrichmentEstimate = z.infer<typeof EnrichmentEstimate>;

export const SpendApproval = z.object({
  approvedBy: z.string().email(),
  approvedAt: Instant,
  approvedCostUsd: z.number().nonnegative(),
  /** Hard stop. The batch aborts rather than exceed this. */
  ceilingUsd: z.number().nonnegative(),
  note: z.string(),
});
export type SpendApproval = z.infer<typeof SpendApproval>;

export const ApproveSpendRequest = z.object({
  approvedCostUsd: z.number().nonnegative(),
  ceilingUsd: z.number().nonnegative(),
  note: z.string(),
});
export type ApproveSpendRequest = z.infer<typeof ApproveSpendRequest>;

export const EnrichmentReport = z.object({
  runId: z.string().uuid(),
  matched: z.number().int().nonnegative(),
  unmatched: z.number().int().nonnegative(),
  matchRate: z.number().min(0).max(1),
  creditsUsed: z.number().int().nonnegative(),
  actualCostUsd: z.number().nonnegative(),
  completedAt: Instant.nullable(),
  approval: SpendApproval.nullable(),
  unmatchedPlaces: z.array(PlaceCandidate),
});
export type EnrichmentReport = z.infer<typeof EnrichmentReport>;

export const UnmatchedVerdictsRequest = z.object({
  verdicts: z.array(
    z.object({
      placeId: z.string(),
      /** `retry` re-queues with a widened radius; `manual_ref` pins an fsq_id by hand. */
      action: z.enum(["accept_unmatched", "retry", "manual_ref", "flag"]),
      externalId: z.string().nullish(),
      note: z.string().nullish(),
    })
  ),
});
export type UnmatchedVerdictsRequest = z.infer<typeof UnmatchedVerdictsRequest>;

/* ========================================================================== *
 *  9. Screen 6 — QA workspace (pre-publish)
 * ========================================================================== */

/**
 * The automated first pass. Slopes does this comparison by eyeball against
 * official trail maps; we run the mechanical checks before the human looks, so
 * their attention goes to the things a machine genuinely cannot judge.
 */
export const QaCheckKey = z.enum([
  "name_collision",
  "category_outlier",
  "count_delta",
  "dangling_ref",
  "missing_geometry",
  /**
   * The routing half of the same question. Blocking: `warn` while the registry
   * is unmeasured (no graph on this database), `fail` while a blocking coverage
   * gate fails unwaived, `pass` otherwise. `piste_map_compared` in the human
   * checklist remains the eyeball half.
   */
  "coverage_signed_off",
]);
export type QaCheckKey = z.infer<typeof QaCheckKey>;

export const QaItem = z.object({
  id: z.string(),
  label: z.string(),
  detail: z.string(),
  placeId: z.string().nullable(),
  point: LngLat.nullable(),
});
export type QaItem = z.infer<typeof QaItem>;

export const QaCheck = z.object({
  id: z.string(),
  key: QaCheckKey,
  title: z.string(),
  status: z.enum(["pass", "warn", "fail", "waived"]),
  count: z.number().int().nonnegative(),
  detail: z.string(),
  items: z.array(QaItem),
  waiver: Waiver.nullable(),
});
export type QaCheck = z.infer<typeof QaCheck>;

/** The human judgements a check cannot make. Recorded, not just ticked. */
export const ChecklistItem = z.object({
  key: z.string(),
  label: z.string(),
  hint: z.string(),
  checked: z.boolean(),
  checkedBy: z.string().email().nullable(),
  checkedAt: Instant.nullable(),
});
export type ChecklistItem = z.infer<typeof ChecklistItem>;

/**
 * An official piste map for side-by-side comparison. `bounds` is present only
 * where someone has georeferenced the sheet; where it is null the console
 * offers a manual opacity overlay, which is a rough visual check, not georef.
 */
export const PisteMapAsset = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  kind: z.enum(["image", "pdf"]),
  bounds: BBox.nullable(),
  source: z.string(),
  attribution: z.string(),
});
export type PisteMapAsset = z.infer<typeof PisteMapAsset>;

export const QaWorkspaceResponse = z.object({
  registryId: z.string().uuid(),
  registryName: z.string(),
  runId: z.string().uuid(),
  checks: z.array(QaCheck),
  checklist: z.array(ChecklistItem),
  pisteMaps: z.array(PisteMapAsset),
  counts: z.object({
    current: z.record(z.string(), z.number().int()),
    previous: z.record(z.string(), z.number().int()).nullable(),
  }),
  /** False while any non-waived check fails. The publish control keys off this. */
  publishable: z.boolean(),
});
export type QaWorkspaceResponse = z.infer<typeof QaWorkspaceResponse>;

export const PublishRequest = z.object({
  /** Waivers recorded here are applied atomically with the publish. */
  waivers: z.array(z.object({ checkId: z.string(), reason: z.string().min(1) })),
  checklist: z.array(z.object({ key: z.string(), checked: z.boolean() })),
});
export type PublishRequest = z.infer<typeof PublishRequest>;

export const PublishResponse = z.object({
  published: z.boolean(),
  publishedAt: Instant.nullable(),
  version: z.number().int().nonnegative(),
  /** Populated instead of publishing when something still blocks. */
  blockedBy: z.array(z.string()),
});
export type PublishResponse = z.infer<typeof PublishResponse>;

/* ========================================================================== *
 *  10. Screen 8 — Routing coverage (Stage `routing`)
 * ========================================================================== *
 *
 * Every stage above this one gets the *POI* layer to measured quality. The
 * routing graph — the runs, lifts and connector edges the mobile app actually
 * routes over — only ever *asserted* coverage: the pipeline already computed
 * `ski_routing.connectivity_report` and `ski_routing.unconnected_lift_terminals`
 * and nobody ever looked at them.
 *
 * This section turns those diagnostics, plus a comparison against
 * operator-authoritative references, into the same reviewed / gated / audited
 * shape as every other stage.
 *
 * Two properties shape every schema here:
 *
 *  - **Computed live, never snapshotted.** The report is derived from the
 *    current graph on every read, so it cannot go stale behind a run artefact.
 *    That is also why these routes are registry-scoped like QA rather than
 *    run-scoped: routing-stage runs do not exist until the pipeline grows the
 *    stage, and the graph is regenerated per database.
 *  - **`graphAvailable: false` is a designed state, not an error.** On a
 *    database the routing pipeline has not populated — production today, every
 *    fresh e2e database — the report returns zeroed stats and `not_run` gates.
 *    The console renders that as "no routing graph yet", the same way the
 *    membership screen renders a missing run.
 */

/**
 * What the analyst can decide about a coverage finding.
 *
 * `local_override` is the one that needs guarding: it records a *graph repair*
 * decision — a connector edge, a tag override — as our own evidence over OSM.
 * It never draws geometry. A genuinely missing run is `fix_upstream`, fixed in
 * OSM where everyone downstream benefits. Hand-tracing is the thing Slopes does
 * that we specifically do not.
 */
export const CoverageVerdictValue = z.enum([
  "fix_upstream",     // real gap, belongs in OSM; recorded, re-checked after re-extract
  "local_override",   // graph repair (connector/tag) recorded as our evidence — never traced geometry
  "accept_gap",       // reason mandatory — e.g. a decommissioned lift the feed still lists
  "retry",            // re-check after an upstream fix landed
]);
export type CoverageVerdictValue = z.infer<typeof CoverageVerdictValue>;

export const CoverageFindingType = z.enum([
  "unconnected_terminal",   // a lift terminal not joined into the routable graph
  "isolated_component",     // a piste cluster ≥ the km floor with no lift edge
  "missing_difficulty",     // piste way with piste:type but no difficulty tag
  "missing_reference_lift", // liftie (operator feed) lists a lift OSM extraction lacks
]);
export type CoverageFindingType = z.infer<typeof CoverageFindingType>;

export const CoverageVerdictRecord = z.object({
  value: CoverageVerdictValue,
  reason: z.string().nullable(),
  actor: z.string().email(),
  at: Instant,
});
export type CoverageVerdictRecord = z.infer<typeof CoverageVerdictRecord>;

export const CoverageFinding = z.object({
  /** Stable across recomputation — verdicts key on it. e.g. "terminal:123:456". */
  id: z.string(),
  type: CoverageFindingType,
  label: z.string(),
  detail: z.string(),
  point: LngLat.nullable(),
  memberId: z.string().uuid().nullable(),
  memberName: z.string().nullable(),
  /** Piste km for isolated components; null elsewhere. */
  km: z.number().nonnegative().nullable(),
  verdict: CoverageVerdictRecord.nullable(),
});
export type CoverageFinding = z.infer<typeof CoverageFinding>;

export const CoverageMemberStats = z.object({
  resortId: z.string().uuid(),
  name: z.string(),
  colorIndex: z.number().int().nonnegative(),
  /** False when the member has no OSM polygon to scope edges by — stats then sit in the group-level row only. */
  attributed: z.boolean(),
  pisteKm: z.number().nonnegative(),
  liftCount: z.number().int().nonnegative(),
  namedRunCount: z.number().int().nonnegative(),
  runsByDifficulty: z.record(z.string(), z.number().int().nonnegative()),
  liftsByType: z.record(z.string(), z.number().int().nonnegative()),
});
export type CoverageMemberStats = z.infer<typeof CoverageMemberStats>;

/**
 * A comparison against a source that is not us. `liftie` is the strongest of
 * the three — it scrapes the operator's own status page, so a lift it lists
 * with no OSM counterpart is the single best "we missed one" signal we have.
 */
export const ReferenceComparison = z.object({
  source: z.enum(["liftie", "skimap", "declared"]),
  status: z.enum(["ok", "unavailable"]),
  /** Why unavailable, or what was compared. "Feed live but no lift list published (out of season)" is a real state — render it, don't hide it. */
  detail: z.string(),
  lifts: z
    .object({
      referenceCount: z.number().int().nonnegative(),
      extractedCount: z.number().int().nonnegative(),
      matchedCount: z.number().int().nonnegative(),
      missing: z.array(z.string()),
      extraCount: z.number().int().nonnegative(),
    })
    .nullable(),
  runs: z
    .object({
      referenceCount: z.number().int().nullable(),
      extractedCount: z.number().int().nonnegative(),
      deltaPct: z.number().nullable(),
    })
    .nullable(),
});
export type ReferenceComparison = z.infer<typeof ReferenceComparison>;

export const CoverageResponse = z.object({
  registryId: z.string().uuid(),
  registryName: z.string(),
  computedAt: Instant,
  /** False until the routing pipeline has populated ski_routing on this database. */
  graphAvailable: z.boolean(),
  graph: z.object({
    edges: z.number().int().nonnegative(),
    components: z.number().int().nonnegative(),
    largestComponentPct: z.number().nullable(),
    routableKm: z.number().nonnegative(),
    connectorEdges: z.number().int().nonnegative(),
    /** Piste-only km — the honest denominator for the census (was GAPS 12). */
    pisteKm: z.number().nonnegative(),
    /** % of piste km in a component that also contains a lift edge. */
    reachablePistePct: z.number().nullable(),
  }),
  members: z.array(CoverageMemberStats),
  reference: z.array(ReferenceComparison),
  /** Capped server-side; unresolved first. */
  findings: z.array(CoverageFinding),
  /** Reuses ValidationGate; keys are the four coverage GateKeys. */
  gates: z.array(ValidationGate),
});
export type CoverageResponse = z.infer<typeof CoverageResponse>;

export const CoverageVerdictsRequest = z.object({
  verdicts: z.array(
    z.object({
      findingId: z.string(),
      verdict: CoverageVerdictValue,
      /** Mandatory for accept_gap; the backend rejects it missing. */
      reason: z.string().nullish(),
    })
  ),
});
export type CoverageVerdictsRequest = z.infer<typeof CoverageVerdictsRequest>;

/* ========================================================================== *
 *  11. Screen 7 — Runs and audit (`ingestion_runs` rendered)
 * ========================================================================== */

export const RunStatus = z.enum(["queued", "running", "succeeded", "failed", "cancelled"]);
export type RunStatus = z.infer<typeof RunStatus>;

/**
 * A pipeline stage a run can execute. `routing` and `enrichment` are
 * order-independent — one builds the graph, the other fills the POI layer — but
 * both must be green before `publish`.
 *
 * Note this is not the worklist's `Stage`: that enum is the entry's *progress*
 * axis and is deliberately unchanged. Coverage surfaces through the QA check
 * and the coverage tab, not by growing the progress ladder.
 */
export const StageKey = z.enum([
  "identity",
  "harvest",
  "membership",
  "routing",
  "enrichment",
  "publish",
]);
export type StageKey = z.infer<typeof StageKey>;

export const RunStage = z.object({
  stage: StageKey,
  status: RunStatus.or(z.literal("skipped")),
  startedAt: Instant.nullable(),
  finishedAt: Instant.nullable(),
  durationMs: z.number().int().nonnegative().nullable(),
  summary: z.string(),
  error: z.string().nullable(),
});
export type RunStage = z.infer<typeof RunStage>;

export const ProviderRun = z.object({
  provider: RefSource,
  calls: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative(),
  /** Overture's rolling two-release hosting makes this mandatory to record. */
  release: z.string().nullable(),
  status: z.enum(["ok", "partial", "failed", "skipped"]),
});
export type ProviderRun = z.infer<typeof ProviderRun>;

export const WaiverRecord = z.object({
  scope: z.enum(["gate", "qa_check"]),
  key: z.string(),
  reason: z.string(),
  actor: z.string().email(),
  at: Instant,
});
export type WaiverRecord = z.infer<typeof WaiverRecord>;

export const IngestionRun = z.object({
  id: z.string().uuid(),
  registryId: z.string().uuid(),
  registryName: z.string(),
  kind: RegistryKind,
  status: RunStatus,
  trigger: z.enum(["manual", "scheduled", "rerun"]),
  triggeredBy: z.string(),
  startedAt: Instant,
  finishedAt: Instant.nullable(),
  durationMs: z.number().int().nonnegative().nullable(),
  stages: z.array(RunStage),
  providers: z.array(ProviderRun),
  costUsd: z.number().nonnegative(),
  gateOutcomes: z.array(z.object({ key: GateKey, status: GateStatus })),
  approvals: z.array(SpendApproval),
  waivers: z.array(WaiverRecord),
});
export type IngestionRun = z.infer<typeof IngestionRun>;

export const RunListQuery = z.object({
  registryId: z.string().uuid().optional(),
  status: RunStatus.optional(),
  stage: StageKey.optional(),
  q: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
});
export type RunListQuery = z.infer<typeof RunListQuery>;

export const RunListResponse = Paginated(IngestionRun);
export type RunListResponse = z.infer<typeof RunListResponse>;

/**
 * Every mutation in this contract writes one of these. Nothing destructive
 * happens without one, and merges, waivers and approvals all carry a reason.
 */
export const AuditEntry = z.object({
  id: z.string(),
  at: Instant,
  actor: z.string(),
  action: z.string(),
  registryId: z.string().uuid().nullable(),
  runId: z.string().uuid().nullable(),
  target: z.string(),
  detail: z.string(),
  reason: z.string().nullable(),
});
export type AuditEntry = z.infer<typeof AuditEntry>;

export const AuditQuery = z.object({
  registryId: z.string().uuid().optional(),
  runId: z.string().uuid().optional(),
  actor: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(100),
  cursor: z.string().optional(),
});
export type AuditQuery = z.infer<typeof AuditQuery>;

export const AuditListResponse = Paginated(AuditEntry);
export type AuditListResponse = z.infer<typeof AuditListResponse>;

export const TriggerRunRequest = z.object({
  stages: z.array(StageKey).min(1),
  reason: z.string(),
});
export type TriggerRunRequest = z.infer<typeof TriggerRunRequest>;

export const TriggerRunResponse = z.object({
  runId: z.string().uuid(),
  status: RunStatus,
});
export type TriggerRunResponse = z.infer<typeof TriggerRunResponse>;

/* ========================================================================== *
 *  12. The client interface
 * ========================================================================== */

/**
 * Everything the console can ask of the backend. Both the mock adapter and the
 * HTTP adapter implement this in full, so flipping between them is a one-line
 * environment change with no call-site differences.
 *
 * `actor` is threaded through every mutation and is resolved from the console
 * session on the server — it is never accepted from the browser.
 */
export interface IngestionApi {
  // Screen 1
  getWorklist(query: Partial<WorklistQuery>): Promise<WorklistResponse>;

  // Screen 2
  searchCandidates(query: CandidateSearchQuery): Promise<CandidateSearchResponse>;
  getManifest(manifestId: string): Promise<OnboardingManifest | null>;
  saveManifest(manifest: OnboardingManifest, actor: Actor): Promise<OnboardingManifest>;
  validateManifest(manifest: OnboardingManifest): Promise<ManifestValidation>;
  submitManifest(manifest: OnboardingManifest, actor: Actor): Promise<SubmitManifestResponse>;

  // Screen 3
  getHarvest(runId: string): Promise<HarvestResponse>;
  submitHarvestVerdicts(
    runId: string,
    req: HarvestVerdictsRequest,
    actor: Actor
  ): Promise<VerdictsResponse>;
  bulkAcceptHarvest(
    runId: string,
    req: BulkAcceptRequest,
    actor: Actor
  ): Promise<VerdictsResponse>;

  // Screen 4
  getMembership(runId: string): Promise<MembershipResponse>;
  submitMembershipActions(
    runId: string,
    req: MembershipActionsRequest,
    actor: Actor
  ): Promise<VerdictsResponse>;
  waiveGate(
    runId: string,
    key: GateKey,
    req: WaiveGateRequest,
    actor: Actor
  ): Promise<ValidationGate>;

  // Screen 5
  getEnrichmentEstimate(runId: string): Promise<EnrichmentEstimate>;
  approveEnrichmentSpend(
    runId: string,
    req: ApproveSpendRequest,
    actor: Actor
  ): Promise<SpendApproval>;
  getEnrichmentReport(runId: string): Promise<EnrichmentReport>;
  submitUnmatchedVerdicts(
    runId: string,
    req: UnmatchedVerdictsRequest,
    actor: Actor
  ): Promise<VerdictsResponse>;

  // Screen 6
  getQaWorkspace(registryId: string): Promise<QaWorkspaceResponse>;
  publish(registryId: string, req: PublishRequest, actor: Actor): Promise<PublishResponse>;

  // Screen 8 — registry-scoped like QA: coverage is computed live from the
  // current graph, and routing-stage runs do not exist until the pipeline
  // grows the stage.
  getCoverage(registryId: string): Promise<CoverageResponse>;
  submitCoverageVerdicts(
    registryId: string,
    req: CoverageVerdictsRequest,
    actor: Actor
  ): Promise<VerdictsResponse>;
  waiveCoverageGate(
    registryId: string,
    key: GateKey,
    req: WaiveGateRequest,
    actor: Actor
  ): Promise<ValidationGate>;

  // Screen 7
  listRuns(query: Partial<RunListQuery>): Promise<RunListResponse>;
  getRun(runId: string): Promise<IngestionRun | null>;
  triggerRun(
    registryId: string,
    req: TriggerRunRequest,
    actor: Actor
  ): Promise<TriggerRunResponse>;
  listAudit(query: Partial<AuditQuery>): Promise<AuditListResponse>;

  // Shared
  getRegistryEntry(registryId: string): Promise<RegistryEntry | null>;
}

/* ========================================================================== *
 *  13. Route table
 * ========================================================================== *
 *
 * The HTTP adapter builds its URLs from this, and GAPS.md is derived from it,
 * so a route can never be documented in one place and implemented in another.
 * `:param` segments are substituted positionally by the adapter.
 */

export interface RouteSpec {
  method: "GET" | "POST" | "PATCH";
  path: string;
  /** Which console screen stops working if this is missing. */
  screen: string;
  summary: string;
}

export const ROUTES = {
  getWorklist: {
    method: "GET",
    path: "/ingestion/worklist",
    screen: "1 — Atlas worklist",
    summary:
      "The 200-resort registry as a work dashboard, with per-entry stage, gate failures and a precomputed next action.",
  },
  getRegistryEntry: {
    method: "GET",
    path: "/ingestion/registry/:registryId",
    screen: "all",
    summary: "One registry entry with its external refs, group and members.",
  },
  searchCandidates: {
    method: "GET",
    path: "/ingestion/candidates",
    screen: "2 — Onboarding wizard",
    summary:
      "Skimap.org, Wikidata and OSM identity candidates for a query, plus ≥85%-overlap duplicate polygon pairs.",
  },
  getManifest: {
    method: "GET",
    path: "/ingestion/manifests/:manifestId",
    screen: "2 — Onboarding wizard",
    summary: "Load a draft onboarding manifest.",
  },
  saveManifest: {
    method: "POST",
    path: "/ingestion/manifests",
    screen: "2 — Onboarding wizard",
    summary: "Create or update a draft onboarding manifest.",
  },
  validateManifest: {
    method: "POST",
    path: "/ingestion/manifests/validate",
    screen: "2 — Onboarding wizard",
    summary: "Dry-run validation of a manifest without persisting it.",
  },
  submitManifest: {
    method: "POST",
    path: "/ingestion/manifests/:manifestId/submit",
    screen: "2 — Onboarding wizard",
    summary: "Mint registry entries and the group, then start a Stage 0→1 run.",
  },
  getHarvest: {
    method: "GET",
    path: "/ingestion/runs/:runId/harvest",
    screen: "3 — Harvest review",
    summary:
      "Harvest layers (OSM / Overture / conflated), the conflict queue and provenance per field.",
  },
  submitHarvestVerdicts: {
    method: "POST",
    path: "/ingestion/runs/:runId/harvest/verdicts",
    screen: "3 — Harvest review",
    summary: "Apply a batch of keep-left / keep-right / merge / skip verdicts.",
  },
  bulkAcceptHarvest: {
    method: "POST",
    path: "/ingestion/runs/:runId/harvest/bulk-accept",
    screen: "3 — Harvest review",
    summary: "Accept every suggested verdict at or above a confidence threshold.",
  },
  getMembership: {
    method: "GET",
    path: "/ingestion/runs/:runId/membership",
    screen: "4 — Membership and gates",
    summary:
      "Flood-fill assignments per member, multi-membership counts, the orphan belt and the four validation gates.",
  },
  submitMembershipActions: {
    method: "POST",
    path: "/ingestion/runs/:runId/membership/actions",
    screen: "4 — Membership and gates",
    summary: "Resolve orphans: assign to member, create member, flag boundary or skip.",
  },
  waiveGate: {
    method: "POST",
    path: "/ingestion/runs/:runId/gates/:gateKey/waive",
    screen: "4 — Membership and gates",
    summary: "Waive a blocking validation gate with a mandatory reason. Writes an audit row.",
  },
  getEnrichmentEstimate: {
    method: "GET",
    path: "/ingestion/runs/:runId/enrichment/estimate",
    screen: "5 — Enrichment cost gate",
    summary:
      "Foursquare dry-run: billable POIs after free-coverage, confidence and group-dedupe reductions, plus projected cost.",
  },
  approveEnrichmentSpend: {
    method: "POST",
    path: "/ingestion/runs/:runId/enrichment/approve",
    screen: "5 — Enrichment cost gate",
    summary:
      "Record who approved what spend, with a hard ceiling. No paid call runs without this row.",
  },
  getEnrichmentReport: {
    method: "GET",
    path: "/ingestion/runs/:runId/enrichment/report",
    screen: "5 — Enrichment cost gate",
    summary: "Post-batch match rate, actual cost and the unmatched-POI queue.",
  },
  submitUnmatchedVerdicts: {
    method: "POST",
    path: "/ingestion/runs/:runId/enrichment/unmatched/verdicts",
    screen: "5 — Enrichment cost gate",
    summary: "Resolve unmatched POIs: accept, retry, pin a manual ref, or flag.",
  },
  getQaWorkspace: {
    method: "GET",
    path: "/ingestion/registry/:registryId/qa",
    screen: "6 — QA workspace",
    summary:
      "Automated pre-publish checks, the human checklist, count deltas and the official piste-map assets.",
  },
  publish: {
    method: "POST",
    path: "/ingestion/registry/:registryId/publish",
    screen: "6 — QA workspace",
    summary:
      "Publish, applying any check waivers atomically. Refuses and returns blockedBy when a check still fails unwaived.",
  },
  getCoverage: {
    method: "GET",
    path: "/ingestion/registry/:registryId/coverage",
    screen: "8 — Routing coverage",
    summary:
      "The coverage report, computed live from the current graph: connectivity stats, per-member census, reference comparison and the findings queue. Never snapshotted.",
  },
  submitCoverageVerdicts: {
    method: "POST",
    path: "/ingestion/registry/:registryId/coverage/verdicts",
    screen: "8 — Routing coverage",
    summary:
      "Apply a batch of fix_upstream / local_override / accept_gap / retry verdicts. Idempotent per finding id, one audit row each.",
  },
  waiveCoverageGate: {
    method: "POST",
    path: "/ingestion/registry/:registryId/coverage/gates/:gateKey/waive",
    screen: "8 — Routing coverage",
    summary:
      "Waive a coverage gate with a mandatory reason. Registry-scoped, because coverage gates are registry-scoped state; the run-scoped waive stays membership-only.",
  },
  listRuns: {
    method: "GET",
    path: "/ingestion/runs",
    screen: "7 — Runs and audit",
    summary: "Filterable run log: stages, providers, dataset releases, costs, gates, approvals.",
  },
  getRun: {
    method: "GET",
    path: "/ingestion/runs/:runId",
    screen: "7 — Runs and audit",
    summary: "One run in full.",
  },
  triggerRun: {
    method: "POST",
    path: "/ingestion/registry/:registryId/runs",
    screen: "1, 7",
    summary: "Queue a pipeline run over the named stages.",
  },
  listAudit: {
    method: "GET",
    path: "/ingestion/audit",
    screen: "7 — Runs and audit",
    summary: "Every merge, waiver, approval and publish, with actor, timestamp and reason.",
  },
} as const satisfies Record<keyof IngestionApi, RouteSpec>;

export type RouteName = keyof typeof ROUTES;
