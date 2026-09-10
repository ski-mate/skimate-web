# GAPS — what alpline-backend still owes the Ingestion Console

The console is built entirely against `src/lib/ingestion-api.ts` and ships
running on a mock adapter. **None of the 23 endpoints below exist yet.** This
file lists them in the order they unblock work, so the backend can be built
incrementally and the console flipped to `INGESTION_API_MODE=real` one screen at
a time rather than all at once.

The contract file is normative: the zod schemas are the payload definition, and
the console's HTTP adapter validates every response against them, so a shape
mismatch fails loudly and names the route. Read it before implementing —
especially the five design rules in its header, which several of the endpoints
below exist specifically to enforce.

Everything is namespaced under `/ingestion`. The actor arrives as an
`x-alpline-actor` header, resolved from the console session server-side; it is
never accepted from the browser and must not be trusted from anywhere else.

---

## Prerequisite — schema

Every endpoint here assumes the target schema from
`alpline-admin/DB-SCHEMA-AUDIT-AND-FLATTENING.md` §4:

| Table | Why the console needs it |
|---|---|
| `resorts` as a curated registry (`skimap_id`, `wikidata_qid`, `osm_ids[]`, `aliases[]`, `kind`, `status`) | `osm_ids` **plural** is load-bearing. The whole duplicate-domain fix is "two polygons become two evidence refs on one entry", and the current `osm_id UNIQUE` column makes that impossible to express. |
| `resort_groups` + `resort_group_members` (`exclude_from_group_naming`) | The Slopes model. Screens 1, 2 and 4 all render group-vs-leaf. |
| `places`, `place_refs`, `place_memberships` (`basis`, `confidence`, `source`) | Many-to-many membership with provenance is what screen 4 draws and what makes screen 5's group dedupe possible. |
| Per-field enrichment provenance | Screen 3 renders a source chip per field. Without it the harvest review has no evidence to show. |
| `ingestion_runs` | Screen 7 *is* this table. Dataset release version is mandatory, not optional — Overture hosts only the last two monthly releases, so a run that did not record one is unreproducible. |

If the flatten lands before this work starts, bake these in. Migrating onto the
flattened baseline weeks later costs more than including them once.

---

## Order of implementation

### Phase 1 — unblocks screen 1 (Atlas worklist) and the shell

Without these nothing renders at all: the workspace layout calls `getWorklist`
and `listRuns` for its nav counts.

| # | Route | Notes |
|---|---|---|
| 1 | `GET /ingestion/worklist` | The big one. Per-entry stage, gate-failure / conflict / orphan / QA counts, cost to date, and a **precomputed `nextAction`** with a `rank`. The ranking is server-side on purpose so "sort by next action needed" is one definition rather than a heuristic each client reinvents. Blocking work must outrank available work, and a failing gate must outrank an unapproved spend. |
| 2 | `GET /ingestion/registry/:registryId` | One entry with refs, group and members. Used by every per-entry screen. |
| 3 | `GET /ingestion/runs` | Filterable by `registryId`, `status`, `stage`. Also drives the sidebar count. |
| 4 | `GET /ingestion/audit` | Filterable by `registryId`, `runId`, `actor`. |

### Phase 2 — unblocks screen 3 (Harvest review)

The first screen where the analyst does real volume, so worth landing early.

| # | Route | Notes |
|---|---|---|
| 5 | `GET /ingestion/runs/:runId/harvest` | Layers, conflict queue, and per-field provenance. `places` must be bbox-scoped and capped — a group is ~600 places and an unbounded response defeats the point. `summary.overtureRelease` is mandatory. |
| 6 | `POST /ingestion/runs/:runId/harvest/verdicts` | Batched: the console sends several at a time because it applies verdicts optimistically at one keystroke each. Must be idempotent per `conflictId` — the console retries a failed batch. A `merge` verdict writes an audit row of its own. |
| 7 | `POST /ingestion/runs/:runId/harvest/bulk-accept` | Applies each conflict's suggested verdict above a confidence threshold across selected types. Rows with no confidence signal count as 1.0. |

### Phase 3 — unblocks screen 4 (Membership & gates)

| # | Route | Notes |
|---|---|---|
| 8 | `GET /ingestion/runs/:runId/membership` | Per-member assignment counts split by `basis`, multi-membership count, the orphan belt, and the four gates. Orphan `reason` should name the settlement the place sits in when known — the console reads it to pre-fill "create member", and it is the actual diagnosis. |
| 9 | `POST /ingestion/runs/:runId/membership/actions` | assign / create_member / flag_boundary / skip. `create_member` mints a registry entry and writes an audit row. |
| 10 | `POST /ingestion/runs/:runId/gates/:gateKey/waive` | Reason mandatory, rejected if empty. Writes an audit row and returns the updated gate. |

The four gates (`orphan_belt`, `empty_member`, `duplicate_claim`,
`downhill_without_lift`) must be **enforced server-side**, not merely reported.
The console refuses to advance a blocked entry, but that is a courtesy; the API
must refuse too.

### Phase 4 — unblocks screen 5 (Enrichment cost gate)

Nothing here can ship half-done: the approval endpoint is the only thing
standing between the pipeline and a Foursquare bill.

| # | Route | Notes |
|---|---|---|
| 11 | `GET /ingestion/runs/:runId/enrichment/estimate` | The dry run. Must genuinely compute each reduction — free coverage, confidence filter, **group dedupe** — not estimate them. The estimator formula is still `⟦TO FILL⟧` in the pipeline spec; the schema is the shape it has to produce. |
| 12 | `POST /ingestion/runs/:runId/enrichment/approve` | Records approver, cost, and a hard ceiling. **The batch must abort rather than exceed the ceiling**, and must refuse to run at all without an approval row. |
| 13 | `GET /ingestion/runs/:runId/enrichment/report` | Match rate, credits used, actual cost, unmatched queue. |
| 14 | `POST /ingestion/runs/:runId/enrichment/unmatched/verdicts` | accept / retry / manual_ref / flag. |

### Phase 5 — unblocks screen 6 (QA workspace) and publishing

| # | Route | Notes |
|---|---|---|
| 15 | `GET /ingestion/registry/:registryId/qa` | The five automated checks, the human checklist with its last-confirmed state, count deltas against the previous run, and piste-map assets. |
| 16 | `POST /ingestion/registry/:registryId/publish` | Applies check waivers **atomically with the publish** so nothing sits waived-but-unpublished. Returns `blockedBy` and does not publish when a check still fails unwaived. Must enforce this server-side. |

`pisteMaps` needs a real source. `resort_piste_maps` holds PDFs and JPEGs;
the console needs a URL it can render and, where anyone has georeferenced a
sheet, `bounds`. In mock mode it draws a labelled synthetic schematic instead.

### Phase 6 — unblocks screen 2 (Onboarding wizard)

Last, because onboarding a *new* resort matters less than getting the 149
already-imported ones through the pipeline. It is also the phase with the most
open questions.

| # | Route | Notes |
|---|---|---|
| 17 | `GET /ingestion/candidates` | Skimap, Wikidata and OSM candidates for a query, plus ≥85%-overlap duplicate pairs. Overlap is **asymmetric** — return both directions, never a single number. Skimap candidates must carry `memberNames`; that editorial list is the single highest-value thing this endpoint provides. |
| 18 | `POST /ingestion/manifests/validate` | Dry-run validation without persisting. The console calls it on every edit, so it must be cheap. |
| 19 | `POST /ingestion/manifests` | Create or update a draft. |
| 20 | `GET /ingestion/manifests/:manifestId` | Load a draft. |
| 21 | `POST /ingestion/manifests/:manifestId/submit` | Mint registry entries and the group, start a Stage 0→1 run. |
| 22 | `POST /ingestion/registry/:registryId/runs` | Queue a run over named stages. Also used from the worklist. |
| 23 | `GET /ingestion/runs/:runId` | One run in full. |

---

## Open questions the contract could not settle

These are decisions the backend has to make; the console will follow whatever it
returns, but the shape assumes an answer exists.

1. **Skimap.org licensing.** `searchCandidates` seeds identity from Skimap, and
   the pipeline spec still lists their terms for commercial seeding as
   `⟦TO FILL⟧`. If seeding turns out not to be permitted, the wizard loses its
   best source and the `memberNames` shortcut with it — worth resolving before
   phase 6 rather than during it.
2. **Graph-reachability snap distance.** `membership.basis = "network"` assumes a
   rule for POIs near but not on the network (a hut 100 m off a piste). Snap
   distance, isochrone, or something else is still open. The console displays
   whatever basis comes back and does not assume the rule.
3. **Group extent when a commune spans two groups.** Affects both the orphan
   belt and the settlement rule, and therefore the `orphan_belt` gate.
4. **Overture confidence threshold.** The contract carries it per-run
   (`summary.confidenceThreshold`) rather than hardcoding it, because the spec's
   own advice is to start near 0.5 and tune empirically. Keep it configurable.
5. **Foursquare estimator formula and field mapping**, including the ski-lift
   category id. Still `⟦TO FILL⟧`. Phase 4 cannot be finished without it.
6. **Tripadvisor.** Only `location_id` may ever be stored. If any endpoint here
   starts returning Tripadvisor payloads, that is a licensing bug, not a feature.

## Notes on things that are deliberately *not* in the contract

- **No geometry editing endpoints.** The analyst reassigns, merges,
  re-categorises and flags for re-run. Hand-tracing is the thing Slopes does
  that we specifically do not.
- **No unbounded list endpoints.** Every list is paginated or bbox-scoped,
  mirroring the backend's own geospatial rules.
- **No Stage 4.** Guides authoring is out of scope for v1; the console has a nav
  stub and nothing more.
