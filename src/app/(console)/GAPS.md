# GAPS — what alpline-backend still owes the Ingestion Console

The console is built entirely against `src/lib/ingestion-api.ts` and ships
running on a mock adapter. This file lists endpoints in the order they unblock
work, so the backend can be built incrementally and the console flipped to
`INGESTION_API_MODE=real` one screen at a time rather than all at once.

> **Status 2026-09-11:** All 26 endpoints across phases 1–7 are **built** on
> alpline-backend and the console runs against them for real
> (`INGESTION_API_MODE=real`). Phase 7's screen 8 is built and verified against
> the live backend: the report renders, verdicts and gate waivers round-trip
> with audit rows, and `coverage_signed_off` comes back as the sixth QA check.
> Nothing in this file is outstanding except the open questions below.

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

### Phase 7 — Routing coverage (screen 8) — BUILT 2026-09-11 (backend PR #69; console screen verified against it the same day)

Everything before this phase gets the *POI* layer to measured quality; the
routing graph still only *asserts* coverage. The extraction is OSM-sourced —
which for the Alps is excellent, and is the same substrate Slopes/FATMAP/
OpenSkiMap render — but "excellent in general" is not a per-resort guarantee,
and the pipeline already computes the diagnostics that would prove it
(`ski_routing.connectivity_report`, `ski_routing.unconnected_lift_terminals`)
without anyone ever reviewing them. Phase 7 turns those invisible diagnostics
plus a reference-count comparison into a reviewed, gated, audited stage: the
same pattern as phases 2–5. **Not a separate console** — a stage screen in
this one.

Stage key: `routing`, added to `StageKey` between `membership` and
`enrichment`. Routing and enrichment are order-independent (graph vs POIs);
both must be green before `publish`. Contract-first like every other phase:
extend `ingestion-api.ts` (schemas + `StageKey` + new `GateKey` values), teach
the mock adapter fixtures, then build the backend against the frozen shape.

Endpoints are **registry-scoped like QA**, not run-scoped (refined 2026-09-11
when the backend was built): coverage is computed live from the current
`ski_routing` graph, never from run artifacts, and routing-stage runs do not
exist until the pipeline grows the stage. Full frozen shapes in
`alpline-admin/ROUTING-COVERAGE-CONSOLE-PROMPT.md`.

| # | Route | Notes |
|---|---|---|
| 24 | `GET /ingestion/registry/:registryId/coverage` | The coverage report, computed live (never snapshotted — same rule as every review queue). `graphAvailable: false` with zeroed stats and `not_run` gates on a database the pipeline has not populated — a designed state, not an error. Sections: **graph** (edges/components/connectors, routable km, % of piste km reachable from a lift); **per-member census** (piste km, lifts by type, named runs by difficulty — attributed via the member's OSM polygon); **reference comparison** (liftie lift names, skimap, declared counts); **findings** (unconnected terminals, isolated components, missing difficulty, liftie lifts with no OSM counterpart), capped, unresolved first. |
| 25 | `POST /ingestion/registry/:registryId/coverage/verdicts` | Batched, idempotent per finding id, one audit row each — the harvest-verdict pattern. Verdicts: `fix_upstream` (the gap is real and belongs in OSM; recorded and re-checked after re-extract — the console never edits OSM), `local_override` (record a graph-repair decision as our own evidence over OSM — never traced geometry), `accept_gap` (reason mandatory — e.g. a decommissioned lift the feed still lists), `retry`. Verdicts persist in registry metadata so they survive graph rebuilds. |
| 26 | `POST /ingestion/registry/:registryId/coverage/gates/:gateKey/waive` | Coverage gates are registry-scoped state, so their waive route is too — the run-scoped phase 3 waive stays membership-only. |

New gates, enforced server-side like the phase 3 four:

| Gate | Blocking when |
|---|---|
| `disconnected_terminal` | A lift terminal is not connected into the routable graph (the exact failure the v2 connector work exists to prevent — a regression detector). |
| `isolated_component` | A piste component above a size floor is unreachable from any lift. |
| `reference_delta` | Extracted run/lift counts differ from a reference source beyond tolerance (see open question 8). |
| `missing_difficulty` | Warn-only: ways with `piste:type` but no difficulty; routing degrades rather than breaks. |

Reference sources, in trust order:

| Source | What it checks | Already have it? |
|---|---|---|
| alpline-lifts / liftie feed | Lift *names* per resort, scraped from the operator's own status page — operator-authoritative. Diff against OSM lift names via `lift_name_aliases` + fuzzy match; a liftie lift with no OSM counterpart is the single strongest "we missed one" signal. | Yes — live in prod, 201 resorts. |
| Skimap entry | Declared run/lift totals and the piste-map sheet. | Yes — local index, 5,415 areas. |
| Official resort figures | "X km of pistes, Y lifts" as published by the resort. | No — manifest gains optional `declaredCounts`; entered once at onboarding (wizard step) or backfilled from the QA screen. |
| Piste-map asset | Human eyeball, side by side with the extracted map. | Yes — `resort_piste_maps` + the QA screen's viewer. |

QA tie-in: the phase 5 check list grows a sixth automated check,
`coverage_signed_off` (blocking) — true when the entry's latest routing-stage
run has all four gates pass/waived and an empty unresolved-diagnostics queue.
`piste_map_compared` stays as the human half of the same question.

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
7. **(Phase 7) Where do official counts live?** Proposed: optional
   `declaredCounts` on the onboarding manifest, backfillable later. But resorts
   publish marketing numbers ("600 km of pistes") that don't decompose into
   countable runs — the comparison may only be meaningful for lifts.
8. **(Phase 7) `reference_delta` tolerance.** Counting runs is genuinely fuzzy
   (one OSM way can be half a marketing "run", and vice versa), so an exact-match
   gate would false-positive everywhere. Lift-name diffs can be near-exact;
   run-count deltas probably need a percentage band. Start loose, tighten
   empirically — same philosophy as the Overture confidence threshold.
9. **(Phase 7) Isolated-component size floor.** A 200 m beginner rope-tow slope
   with no lift connection may be legitimately isolated; a 5 km sector is a
   pipeline bug. Where the floor sits (piste km? way count?) needs data.
10. **(Phase 7) Override storage.** `local_override` needs a home that survives
    re-harvest (the pipeline drops and rebuilds `ski_routing`). Proposed: an
    `routing_overrides` table in `public` (golden baseline), applied as a final
    pipeline step — mirrors how verdicts persist in `places.attrs` across runs.
11. **(Phase 7) Does every verdict settle its gate?** Observed behaviour, not a
    proposal: the shipped backend decrements a coverage gate on **any** verdict
    — a `fix_upstream` took `disconnected_terminal` from 11 to 10 against the
    local stack on 2026-09-11. Arguably it should not. `fix_upstream` and
    `retry` both mean "still broken, the fix is elsewhere", so a gate that goes
    green the moment someone files an OSM note is measuring intent rather than
    the graph; only `local_override` (we repaired it) and `accept_gap` (it is
    correct as-is) are claims about the graph itself. The console follows
    whatever the API returns and its mock adapter mirrors the current rule
    exactly, so this is a backend decision with no console work either way —
    but the mock carries a comment pointing here, and the screen deliberately
    says what each verdict *records* rather than what it does to the gate.

## Notes on things that are deliberately *not* in the contract

- **No geometry editing endpoints.** The analyst reassigns, merges,
  re-categorises and flags for re-run. Hand-tracing is the thing Slopes does
  that we specifically do not. (Phase 7's `local_override` does not change
  this: it stores connector edges and tag overrides — graph repairs — never
  hand-traced piste geometry. A genuinely missing run is a `fix_upstream`,
  fixed in OSM where everyone benefits.)
- **No unbounded list endpoints.** Every list is paginated or bbox-scoped,
  mirroring the backend's own geospatial rules.
- **No Stage 4.** Guides authoring is out of scope for v1; the console has a nav
  stub and nothing more.
