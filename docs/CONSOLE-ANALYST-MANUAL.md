# The Alpline Ingestion Console — Analyst Manual

*Written 2026-09-11 by the team that built the console API. This is the
onboarding manual and day-to-day runbook for the GIS analyst role.*

*Note to the web agent rendering this: publish it under the auth-guarded guide
area (the `/guide/...` pattern, e.g. `getalpline.com/guide/console/...`),
one page per chapter, with the chapter list as the section index. It must sit
behind the same allow-list auth as `/console` itself — it names internal
tooling, costs, and data policy. Keep the runbook step numbering intact;
analysts follow it literally.*

---

## Chapter 0 — The job, in one page

Alpline's atlas is ~200 ski resorts. Your job is to take each one from "a name
in a registry" to "published, measured, trustworthy data" using the console at
**`getalpline.com/console`** (dev: `localhost:3001/console`).

The one idea that explains every screen: **the pipeline generates, you
review.** Slopes — the benchmark we measure against — employs GIS analysts who
hand-trace runs, lifts and buildings in ArcGIS over satellite imagery. We
inverted that: an automated pipeline extracts everything from OpenStreetMap,
Overture, and operator feeds, and your screen time goes to **queues of
exceptions** — conflicts, orphans, gate failures, gaps. You will never trace a
geometry. You resolve, merge, reassign, verdict, waive-with-reason, and
approve. One analyst with good queues covers what takes them a team.

Three rules carry across every screen:

1. **Nothing destructive happens without an audit row.** Every merge, verdict,
   waiver, approval and publish records who, when, and why. The audit trail is
   your professional record — write reasons you'd be happy to re-read in six
   months.
2. **A blocked stage is blocked for a reason.** Gates and checks are enforced
   server-side; the console refusing is a courtesy copy of the API refusing.
   Waiving is always available and always logged — waive when you have
   *judged* the failure, never to make a number go away.
3. **Money never moves without your explicit click.** The only paid provider
   is Foursquare, and it runs solely behind the approval screen (Chapter 6).

### The stage pipeline

Every resort walks the same line, and the console's screens are its stations:

```
identity → harvest → membership → enrichment → QA → publish
                          └── routing coverage (parallel with enrichment)
```

| Stage | Screen | You are judging |
|---|---|---|
| Identity | Onboarding wizard | "Which real-world resort is this, exactly?" |
| Harvest | Harvest review | "Which of these candidate places are duplicates or junk?" |
| Membership | Membership & gates | "Which member resort does each place belong to?" |
| Enrichment | Enrichment cost gate | "Is this Foursquare spend worth it, and did it work?" |
| Routing coverage | Coverage (screen 8) | "Did we really capture every run and lift?" |
| QA / publish | QA workspace | "Would I stake the app's reputation on this data?" |

---

## Chapter 1 — Vocabulary you must know

Learn these ten terms before touching anything; every screen assumes them.

- **Registry entry** — one row in the atlas: either a **group** (Les 3
  Vallées) or a **leaf resort** (Courchevel). Groups have **members**; a
  member can carry `excludeFromGroupNaming` when it keeps its own identity.
- **Evidence refs** — a registry entry's external anchors: Skimap id,
  Wikidata QID, and **OSM ids (plural!)**. Two overlapping OSM polygons are
  *two evidence refs on one entry*, never two entries. This single idea kills
  the duplicate-resort disease ("Les 3 Vallées" vs "Les Trois Vallées").
- **Place** — one harvested point of interest (restaurant, lift station,
  rental shop…). Group-wide entities: one place can belong to several members.
- **Provenance** — every place field remembers its source (`osm`, `overture`,
  `wikidata`, `fsq`, `override`). Rendered as chips. When two sources
  disagree, provenance is how you decide who to believe.
- **Membership basis** — *why* a place belongs to a member: `network` (graph
  reachability), `settlement` (it sits in the member's village), or `manual`
  (you said so).
- **Run** — one recorded pipeline execution, with stages, dataset release
  versions, costs, gate outcomes and approvals. Screen 7 is this table
  rendered. Dataset versions matter: Overture hosts only its last two monthly
  releases, so a run without a recorded release is unreproducible.
- **Gate** — a blocking validation with evidence attached. Gates *fail*, and
  a failing gate stops advancement until resolved or **waived with a reason**.
- **Verdict** — your recorded decision on one queue item. Verdicts are
  idempotent (re-sending the same one changes nothing) and each writes an
  audit row.
- **Waiver** — "I have seen this failure, judged it acceptable, and here is
  why." Mandatory reason, permanent record.
- **The graph** — the routable ski network (pistes, lifts, connector edges)
  extracted from OSM into the `ski_routing` schema. Coverage (Chapter 7)
  measures it; routing runs on it.

---

## Chapter 2 — Access and orientation

1. You need your email on the console allow-list (ops sets
   `CONSOLE_ALLOWED_EMAILS`). Sign in at `/console` with that account.
   No allow-list entry → no access; there is no self-signup.
2. Everything you do is attributed to that email in the audit trail. Never
   share a session.
3. **Learn the keyboard on day one.** Press **`?`** on any screen for the
   shortcut overlay — it is the authoritative reference and shows exactly
   what is available where you are. The invariants:
   - `j` / `k` (or arrow keys) — next / previous item in any queue
   - number keys or mnemonic letters — verdicts (e.g. harvest: `1`/`l` keep
     left, `2`/`r` keep right, `3`/`m` merge, `4`/`s` skip)
   - `u` — undo the last verdict (before it syncs)
   - `m` — toggle the map panel; `/` — search; `Esc` — close
4. Screens autosave verdicts in small batches. A pending-sync indicator means
   "keep going, it will land"; if it persists, see Troubleshooting.

### An honest note about empty screens

A stage screen that says "no run yet" is not broken: stage screens render the
output of pipeline runs, and until engineering has executed a run for that
entry there is nothing to review. Same for coverage's "no routing graph yet".
Queueing a run from the console (worklist → trigger) files a **work order**;
the pipeline itself is executed by engineering, not by the browser.

---

## Chapter 3 — The morning routine (Atlas worklist)

The worklist (`/console`) is your home screen: every registry entry as a work
row with its stage badge, blocking counts, cost to date, and a server-computed
**next action**. The header shows global progress (x/200 published).

**Runbook — start of every session:**

1. Open `/console`. Read the global header first: did anything regress
   overnight (a re-run flipping entries to `needs_rerun`)?
2. Sort by **next action** (the default). The ranking is deliberate: blocked
   work outranks available work, and a failing gate outranks an unapproved
   spend. Trust it — the top row is your morning.
3. Work top-down. Click a row → the entry workspace opens with tabs:
   **Harvest · Membership & gates · Coverage · Enrichment · QA · History**.
   The tab badges are your todo counts for that entry.
4. Before leaving an entry, glance at History (its runs + audit) — confirm
   your session's actions are all recorded and attributed to you.

`needs_rerun` is orthogonal to progress: it means upstream data moved (new
Overture release, OSM re-extract) and the entry's results are stale. Stale
work still shows; finish judgements only where they'll survive the re-run
(verdicts and waivers do — they're keyed to stable ids).

---

## Chapter 4 — Onboarding a new resort (the wizard)

Identity is the foundation everything else stands on. A wrong identity
decision here costs days downstream; take your time on this screen and speed
up everywhere else.

**Runbook — onboarding:**

1. Open **Onboarding** (or deep-link from a worklist row's "onboard" action —
   the wizard opens pre-seeded with that entry).
2. Search the resort name. You get side-by-side candidates:
   - **Skimap.org** — the editorial spine. A Skimap entry's parenthetical
     member list ("Les 3 Vallées (Val Thorens, Les Menuires, …)") pre-fills
     the group's members. This list is the single most valuable thing on the
     screen — verify it against the resort's own site, don't just accept it.
   - **OSM polygons** — our extracted candidates with overlap analysis.
   - Wikidata — currently serves no candidates (known gap; leave the QID
     blank rather than guessing).
3. **Duplicate prompts**: pairs of OSM polygons with high mutual overlap
   surface as "same resort?". Overlap is shown **both directions** (A covers
   98% of B; B covers 81% of A) because containment is asymmetric — a village
   polygon inside a domain polygon is *not* a duplicate. Same name or ≥85%
   both ways → merge: both OSM ids become evidence refs on one entry.
4. Declare the group and members. The **marketing name**, not the commune:
   "Courchevel", never "Saint-Bon-Tarentaise". Members keeping their own
   brand (an Orelle that markets separately) get `excludeFromGroupNaming`.
5. Adjust the **bbox** to the domain plus its access villages — too tight
   starves the harvest, absurdly large (>1.5°) trips validation. Drop
   **village seed points** on each member's village center; membership's
   settlement rule uses them.
6. Watch the manifest JSON panel — it *is* the pipeline's input contract, and
   validation runs on every edit. Fix errors (missing members, bad bbox,
   duplicate member, unknown Skimap id); read warnings (member without
   evidence, name mismatch vs Skimap) and decide consciously.
7. **Save draft** early and often. **Submit** only when done: submit mints
   the registry entries, records identity, and queues the harvest run as a
   work order. Submitted manifests are immutable — corrections happen through
   the registry afterwards, not by resubmitting.

---

## Chapter 5 — Harvest review

After a harvest run, the pipeline has conflated OSM and Overture into one
place set and queued everything it wasn't sure about. This is your
highest-volume screen; the keyboard exists for it.

**Reading the screen:** map on one side with switchable layers (OSM
extraction / Overture, shaded by confidence / conflated result), conflict
queue on the other. Each conflict shows both candidates with per-field
provenance chips and a suggested verdict where the pipeline has a lean. The
run summary pins the Overture release id — that's the reproducibility anchor.

**The four verdicts:**

| Verdict | Means | Reach for it when |
|---|---|---|
| Keep left / keep right | One candidate is right, the other is noise | Same venue, one source clearly better |
| **Merge** | Same real-world venue, keep both refs | Both sources describe one place — merged provenance keeps the best of each field. Writes its own audit row. |
| Skip | Both are real, distinct places | Two same-named mountain huts 400 m apart are *not* duplicates |

**Runbook — clearing a conflict queue:**

1. `j`/`k` through the queue; the map follows your cursor. Judge with the
   map, not the list — distance and terrain context decide most cases.
2. Verdict with single keys (`1`/`l`, `2`/`r`, `3`/`m`, `4`/`s`); `u` to
   undo a slip before it syncs.
3. Same name + same category + tens of meters apart → almost always
   **merge**. Same name + hundreds of meters + terrain between them → almost
   always **skip** (distinct). When in doubt, open the venue's website from
   the evidence panel.
4. After you've calibrated on a few dozen by hand, use **bulk accept** with
   the confidence slider for the long tail of high-confidence suggestions.
   Bulk accept applies each conflict's *suggested* verdict at or above your
   threshold — spot-check a sample afterwards. Never bulk-accept a queue you
   haven't first sampled manually.
5. `permanently_closed` exclusions and low-confidence Overture rows near the
   threshold sit in their own conflict types — they're asking "should this
   place exist at all?", not "which copy wins?".

**A cautionary example that actually happened:** "Prends ta Luge et tire toi"
— a sledge-rental at a Val Thorens restaurant — appeared as two places, an
OSM restaurant and an OSM rental, identical names, 14 m apart. The correct
verdict was **merge** (one venue, two functions, both refs kept). It sat
unresolved in the queue and slipped through to QA, where the name-collision
check caught it. The lesson: the queue's tail matters; the checks behind you
are a net, not an excuse.

---

## Chapter 6 — Membership & gates

Membership answers: which member does each place belong to? The pipeline
flood-fills assignments over the routing graph (basis `network`) and the
village seeds (basis `settlement`). Your queue is the **orphan belt** —
places inside the group extent that no member claimed.

**Reading the screen:** members render as colored territories; places carry
their member's color; multi-membership places draw hatched (legitimate — a
mid-station restaurant can belong to two members). Orphans render loud, with
the nearest member and distance. Gates panel on the side.

**Orphan actions** (single-key, like harvest):

| Action | Means | Reach for it when |
|---|---|---|
| Assign to nearest | Manual membership to the named member | The place obviously belongs; the graph just couldn't reach it (a hut 100 m off-piste) |
| **Create member** | A whole settlement is missing from the registry | Orphans *cluster*. Ten orphans around one village = the village is a missing member, not ten mistakes. The action mints the member and writes audit. |
| Flag boundary | The member exists but its extent is wrong | Orphans hug one member's edge |
| Skip | Genuinely outside our scope | A valley-floor supermarket 8 km from the lifts |

**The four gates:**

- **Orphan belt** (blocking) — unresolved orphan clusters. Resolve the queue;
  the gate clears itself.
- **Empty member** (blocking) — a declared member claimed nothing. Either its
  anchor/seed is wrong (fix via wizard/flag) or it shouldn't be a member.
- **Duplicate claim** (blocking) — two members claim near-identical place
  sets; usually the twin-polygon disease arriving late. Escalate — this is an
  identity problem, not a membership one.
- **Downhill without lift** — deferred to routing coverage (Chapter 7), shows
  not-run here.

**Waiving:** any failing gate can be waived with a mandatory reason. A good
waiver reads like a judgement: *"7 orphans are the valley campsite cluster —
outside ski scope, will not create a member."* A bad waiver reads like a
shrug. When the last blocking failure is waived, the run advances exactly as
if it had passed — members' status moves on and anchors persist.

---

## Chapter 7 — Routing coverage (screen 8)

Everything before this measures the *POI* layer. Coverage measures the thing
the app actually navigates: **did we capture every run, lift, and
connection?** The report is computed live from the routing graph, so it's
always current — and it re-checks itself after every re-extract.

**Reading the screen, top to bottom:**

1. **Graph header** — your sanity strip. For a major domain expect: hundreds
   of routable km, a largest-component share near 100%, reachable-piste %
   near 100%, and a healthy connector count. (Les 3 Vallées reads ~770 km,
   12 components, 98.7% largest, 98.5% reachable.) A largest-component share
   of 60% means the network is split — stop and escalate before judging
   findings one by one.
2. **Per-member census** — piste km, lifts by type, named runs by difficulty.
   Sanity-check against what you know: Courchevel at 115 km / 38 lifts is
   plausible; Courchevel at 4 lifts means attribution or extraction broke.
3. **Reference cards** — independent sources vs our extraction:
   - **liftie** (operator feeds) is the star: it scrapes each resort's own
     status page, so its lift list is *operator-authoritative*. A liftie lift
     with no OSM counterpart is the strongest "we missed one" signal that
     exists. **Seasonal caveat:** out of season, feeds are live but publish
     no lift list — the card says so and the comparison shows not-run. That
     is honest, not broken. Re-judge when the season starts.
   - Skimap / declared counts — currently unavailable (no counts in the
     index; no declared counts recorded yet). The cards say why.
4. **Gates** — disconnected terminals (blocking), isolated components
   (blocking), reference disagreement (blocking when a reference exists),
   missing difficulty (warn).
5. **Findings queue** — the review queue, unresolved first.

**The four verdicts, and how to choose:**

| Verdict | Means | Reach for it when |
|---|---|---|
| **fix_upstream** | The gap is real and belongs in OpenStreetMap | A genuinely missing run or lift. Fix it *in OSM* (see below) — everyone benefits — then the finding re-checks after the next re-extract. |
| **local_override** | Record a graph repair as our own evidence layer | A connectivity defect OSM models fine but our extraction misjoins — a connector that should exist, a tag override. Never traced geometry. |
| **accept_gap** (reason mandatory) | The finding is correct *and* acceptable | A decommissioned lift the feed still lists; a deliberately liftless ski-touring sector. Your reason is the permanent record of why. |
| retry | Re-check after an upstream fix landed | You (or someone) fixed OSM and the extract has re-run |

**Worked example:** L3V's coverage flags a 5 km piste cluster with no lift
around **Lac du Lou** (Val Thorens's ski-route sector). That is real terrain,
correctly extracted, deliberately liftless — the analyst verdict is
`accept_gap` with exactly that reason. The 11 disconnected lift terminals
next to it deserve individual eyes: each one is either a summer-only
installation (accept), an OSM tagging gap (fix upstream), or an extraction
misjoin (local_override + escalate).

**Fixing OSM upstream:** create an OSM account attributed to you (never a
shared account), make the edit with a clear changeset comment, and record the
changeset link in your verdict reason. Alpline never edits OSM
programmatically — upstream fixes are yours, made as a citizen mapper.

Coverage feeds QA: the **coverage signed-off** check (Chapter 8) warns while
a resort is unmeasured and *blocks publish* while a blocking coverage gate
fails unwaived. Publishing a resort now means having looked its graph in the
eye.

---

## Chapter 8 — QA and publish

The last screen before the data reaches users. Everything here exists to
answer one question: *would you stake the app's reputation on this resort?*

**The six automated checks** (computed fresh every visit):

| Check | Blocking | It caught / catches |
|---|---|---|
| Name collisions | yes | Identical names within 150 m — duplicates the harvest missed (this is what caught the sledge-rental) |
| Category outliers | warn | Places with no usable category — they'd render as generic pins |
| Count delta | warn | ±30% place-count swing vs the previous publish |
| Dangling refs | warn | Foursquare refs with no fetched payload |
| Missing geometry | yes | Members without a center point; lifts/trails without a path |
| Coverage signed off | yes | A failing blocking coverage gate (warns if the resort is simply unmeasured) |

**The human checklist** — the judgements no check can make. Each item records
who confirmed it and when:

1. *Compared against the official piste map* — open the piste-map asset
   side-by-side (or pin it as an opacity overlay), confirm sectors, lifts and
   villages line up.
2. *Member names match resort signage* — marketing names, not communes.
3. *Top POIs spot-checked* — pick ~20 famous places; confirm name, category,
   position.
4. *Live lift status mapped or confirmed N/A* — the lifts feed covers this
   resort, or you've recorded that no scraper exists.

**Runbook — publishing:**

1. Clear or consciously waive every failing check. Waivers entered at publish
   are applied **atomically with the publish** — if something still blocks,
   *nothing* persists and the response names the blockers. There is no
   waived-but-unpublished limbo.
2. Tick the checklist honestly — each tick is signed with your name.
3. Publish. The version increments, members flip to published, counts are
   snapshotted (they seed the next count-delta), and the audit row records
   the lot.
4. Re-publishing after changes is normal and cheap — the delta check exists
   precisely so iteration is safe.

---

## Chapter 9 — Enrichment (the money screen)

Foursquare enrichment adds commercial metadata (hours, ratings, photos) to
member places. It is the **only paid step in the entire pipeline**, and it
runs solely behind your approval.

**The economics you are guarding:** Pro calls cost $15 per 1,000 with the
first 500 per calendar month free **account-wide** (not per resort);
premium fields are $18.75 per 1,000. A full Les 3 Vallées batch projects
roughly $16. Small numbers — but only because this screen exists.

**Reading the estimate:** total POIs → minus already-covered-by-free-sources
→ minus low-confidence Overture rows → minus group-level dedupe → the
billable remainder, with a sampled match rate and the projected cost split by
free/pro/premium. The estimate *computes* these reductions from the data —
it is a dry run, not a guess.

**Runbook — approving a spend:**

1. Read the estimate's reductions. If "already covered free" looks too low,
   the harvest may be under-merged — go back before paying to enrich
   duplicates.
2. Check the remaining free-tier calls this month (shown on screen).
3. **Policy: approvals above the owner's standing limit need the owner's
   explicit go-ahead first.** (Current standing instruction: keep spend
   small; the full L3V batch is explicitly reserved for the owner to approve
   in this console personally.)
4. Approve with a **ceiling**. The batch aborts rather than exceeds it. Your
   name and ceiling go into the run record.
5. After the batch: read the report — match rate, credits, actual vs
   projected cost — then clear the **unmatched queue**: `accept` (fine
   unenriched), `retry` (name/position was the problem and you've fixed it),
   `manual_ref` (you found the venue's Foursquare id yourself — paste it),
   or `flag`.

**Licensing red line:** Tripadvisor data, if it ever appears anywhere, may
only ever be stored as a `location_id`. Payload beyond that is a licensing
bug — report it, don't work around it.

---

## Chapter 10 — Runs, audit, and your paper trail

The **History** tab (per entry) and **Runs** screen (global) render the run
ledger: stages, statuses, dataset releases, durations, costs, gate outcomes,
approvals, waivers. The **audit log** is the flat record of every human
action — filterable by entry, run, and actor.

Use them to:

- Reconstruct "why is this entry in this state?" — read its runs newest-first,
  then its audit rows.
- Verify your own session before signing off — every verdict you made should
  be attributed to your email.
- Answer provenance questions months later — "who merged these two
  restaurants, and why?" has an answer with a name and a reason on it.

Runs queued from the console sit as work orders until engineering executes
the pipeline. A run in `awaiting_approval` on the enrichment stage is waiting
on Chapter 9, not on engineering.

---

## Chapter 11 — Troubleshooting

| Symptom | Meaning | Do |
|---|---|---|
| Stage tab says "no run yet" | The pipeline hasn't executed this stage for this entry | Queue a run (worklist) or ask engineering; nothing is broken |
| Coverage says "no routing graph yet" | The routing pipeline hasn't imported this database/region | Expected on a fresh environment; ask engineering for the import |
| Liftie card "unavailable — out of season" | Operator feed is live but publishes no lift list | Normal in summer; re-judge coverage when lifts spin |
| Verdict didn't stick | You may have re-sent an identical verdict (idempotent no-op), or the finding id changed after a re-extract | Reload; if the finding is gone, the graph moved — good |
| "Only a failing gate can be waived" | The gate is passing or not-run | Nothing to waive; if you expected a failure, reload |
| Screen shows stale counts after your actions | The batch hasn't synced | Wait for the sync indicator; `w` forces a save on queue screens |
| 401 / bounced to login | Session expired or email not on the allow-list | Re-login; if persistent, ask ops to check the allow-list |
| A publish returns `blockedBy` | A check still fails unwaived | Read the named checks; resolve or waive consciously |

**Escalate to engineering** (don't grind): identity-level duplicates
surfacing after onboarding, duplicate-claim gate failures, a largest-component
share far below 100%, anything that looks like the pipeline mis-extracted
rather than the mountain being weird, and any licensing concern.

---

## Chapter 12 — The analyst's creed

- Judge with the map, not the list.
- Merge venues, skip neighbours, and when unsure — open their website.
- Orphans cluster; ten orphans are usually one missing village.
- A waiver is a judgement with your name on it, not an escape hatch.
- The operator's own lift list outranks everyone, including us.
- Fix the world in OSM; fix our reading of it with overrides; accept the
  mountain as it is with a reason.
- Nothing paid without your click; nothing destroyed without a record.
- Publish means you looked. All of it.
