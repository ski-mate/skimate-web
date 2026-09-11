# Alpline Ingestion Console

Internal tooling for onboarding, QA'ing and publishing the ~200 resorts in the
Alpline atlas. One GIS analyst drives the whole atlas through it.

It lives inside `alpline-web` as the `/console` route group. It shares the
site's design tokens and its MapTiler setup, and nothing else: no marketing nav,
no footer, no indexing, and its own denser type and row metrics. It is a
workstation, not a page.

Maps go through `src/lib/map/cartography.ts`, which fetches MapTiler's
**winter-v4** style — the same one alpline-mobile uses — restyles the JSON to
the Apple palette, and hands the finished style to the map. There is no style
enum to resolve and therefore no default style to fall back to, and the module
warns in development if a layer id it targets has disappeared from the style.

---

## What it is for

The pipeline (`alpline-admin/RESORT-INGESTION-PIPELINE-V2.md`) auto-generates
everything from OSM, Overture and the routing graph. The analyst never traces
geometry. They review queues of exceptions, resolve conflicts, and approve
gates.

That inversion is the whole design. Slopes hand-traces ~650 resorts in ArcGIS
with a team of GIS analysts; we have one analyst and 200 resorts, so every
screen is a prioritised review queue with keyboard-first bulk actions. The only
drawing tool in the entire console is the manifest bbox and village seeds in the
onboarding wizard, and that exists solely because the manifest cannot be derived
from data that does not exist yet.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000/console
```

It works with no backend and no credentials. Out of the box:

- **Data** comes from the bundled fixtures (`src/lib/ingestion/fixtures/`), which
  are a real snapshot of production `public.resorts` plus a roadmap list.
- **Auth** is off, because Supabase is not configured. A red banner says so on
  every screen. In production the same missing configuration makes the console
  refuse to render rather than fall back to open access.

Optional: `NEXT_PUBLIC_MAPTILER_API_KEY` in `.env.local` enables the maps. Every
other part of every screen works without it, and each map pane says why it is
empty.

### Turning on authentication

```bash
SUPABASE_URL=https://kjnuzuagvjkwbsyxmqep.supabase.co
SUPABASE_PUBLISHABLE_KEY=<Project Settings → API keys → publishable key>
CONSOLE_ALLOWED_EMAILS=analyst@example.com,second@example.com
```

Sign-in is email + password against Supabase. Create the user in the Supabase
dashboard first — the console has no sign-up, deliberately.

The allow-list is checked in three places: before the password is sent, in
middleware on every request, and in the workspace layout. An empty
`CONSOLE_ALLOWED_EMAILS` means nobody, never everybody.

### Flipping mock → real

```bash
INGESTION_API_MODE=real
INGESTION_API_URL=https://alpline-api-prod-xxxx.run.app
INGESTION_API_TOKEN=<service token>
```

Both adapters implement the same `IngestionApi` interface, so no call site
changes. The HTTP adapter parses every response through the zod schema from the
contract before it reaches a screen — a shape mismatch fails loudly, naming the
route, instead of rendering a half-empty queue.

`GAPS.md` lists exactly which endpoints the backend still owes, ordered by which
screen each one unblocks.

---

## The screens

Everything answers "what needs me next?" before it shows you everything, and
every nav item carries a count.

### 1. Atlas worklist — `/console`

The morning screen. All ~200 registry entries as a work dashboard: stage badge,
a precomputed next action, and signal counts for failing gates, open conflicts,
orphans and QA failures. Sorted by *next action needed* — a blocking gate
outranks an unapproved spend, which outranks anything merely available.

Toggle the map (`m`) to see the same rows geographically, coloured by priority
rather than stage: the map answers the same question the table does.

`j`/`k` move · `Enter` opens the next action · `/` search · `b` blocked only

### 2. Onboarding wizard — `/console/onboarding`

Stage 0, identity. Skimap.org, Wikidata and OSM candidates side by side, because
none of them alone is sufficient:

- **Skimap** gives the editorial domain grouping. Selecting Les 3 Vallées
  (id 1079) pre-fills all eight members for free.
- **Wikidata** anchors the leaves that have no ski-area polygon at all —
  Courchevel, Méribel, Les Menuires. Geometry cannot discover these.
- **OSM** supplies the polygon evidence.

Overlapping polygons (≥85% mutual) surface as a **"same resort?"** prompt.
Merging attaches both OSM ids to one registry entry — that is how the duplicate
"Les 3 Vallées" / "Les Trois Vallées" bug dies structurally rather than by
tiebreaker.

Draw the extent (two clicks), drop village seeds, and the **manifest JSON**
renders live beside the form. The JSON is the artefact; the form is only a way
to type it. Validation runs against the same server-side rules the pipeline
applies.

### 3. Harvest review — `/console/resorts/{id}/harvest`

Stage 1. Layered map — OSM, Overture (coloured by confidence), conflated — with
a conflict queue on the right. Four conflict types: same name different
location, same place different category, low confidence, permanently closed.

Every field carries a source chip. Provenance is first-class in the schema, so
it is on screen rather than behind a hover: which source said what *is* the
evidence behind a merge.

`1`/`l` keep left · `2`/`r` keep right · `3`/`m` merge · `4`/`s` skip ·
`Enter` accept the suggestion · `u` undo

Verdicts apply instantly and flush in batches; the header says whether anything
is unsaved, and closing the tab with unsaved work warns you. Bulk accept applies
the suggested verdict across selected types above a confidence threshold.

### 4. Membership & gates — `/console/resorts/{id}/membership`

Stage 2. Places coloured by assigned member, multi-membership ringed (a ridge
hut legitimately belongs to two resorts — the data says so instead of a
tiebreaker), and the **orphan belt** drawn loud in red.

An orphan belt almost always means a missing member boundary, so the actions are
assign / create member / flag boundary — never delete. Creating a member
pre-fills the village name from the orphan's own diagnosis.

The four validation gates render as blocking cards. A failing blocking gate
stops the entry advancing to Stage 3. This is the QA Slopes does by eye, made
structural. Waiving one requires a reason and writes an audit row.

`a` assign to nearest · `c` create member · `f` flag boundary · `s` skip

### 5. Enrichment cost gate — `/console/resorts/{id}/enrichment`

Stage 3. The Foursquare dry run, shown as a reduction from every POI in scope
down to calls we will actually be billed for, each step naming what removed the
rows. Group dedupe is called out explicitly because it is the point of keying
enrichment on the place entity rather than the resort row: a POI in four members
is paid for once.

One explicit **Approve spend** button, a mandatory hard ceiling, and no path to
a paid call that does not pass through here. The approval records who and when.

After the batch: match rate, actual cost, and an unmatched-POI queue
(`1` accept · `2` retry wider · `3` flag).

### 6. QA workspace — `/console/resorts/{id}/qa`

Pre-publish. Automated checks run before you look — name collisions, unusual
attribute combinations, count deltas against the previous run, dangling refs,
missing geometry, and **routing coverage signed off** — so your attention goes
to what a machine cannot judge.

The coverage check is the routing half of "is this entry complete": `warn`
while the registry is unmeasured, `fail` while a blocking coverage gate fails
unwaived, `pass` otherwise. It is resolved on screen 8, not here, so the
worklist sends you straight there when it is the only thing left failing.

Then the comparison against the resort's own piste map, in two modes:
**side by side** for reading names and counting lifts, **overlay** with an
opacity slider for "is this roughly in the right place". The sheets are not
georeferenced, so the overlay offers nudge and scale rather than pretending to
register the raster.

Publish requires every check green or explicitly waived with a reason, and every
checklist item confirmed. Waivers are applied atomically with the publish, so
nothing can sit "waived but unpublished".

> In mock mode the piste map is a generated schematic, labelled as such. Real
> sheets come from `resort_piste_maps` once that endpoint exists.

### 8. Routing coverage — `/console/resorts/{id}/coverage`

Everything above this screen gets the **POI** layer to measured quality. The
routing graph — the runs, lifts and connector edges the app actually routes
over — only ever *asserted* coverage: the pipeline has been computing
`connectivity_report` and `unconnected_lift_terminals` all along and nobody
looked at them. This is the same review-queue-with-gates pattern applied to
those diagnostics, plus a comparison against sources that are not us.

The graph strip is the sanity check: routable km, edges, components, largest
component, connector edges, and what share of piste km sits in a component that
also contains a lift. Under it, the per-member census divides the graph between
members — and what it *cannot* divide is the point. Les 3 Vallées attributes
589 km of 770; the missing 180 km is extent no member polygon covers, which is
the missing-leaf diagnosis the orphan belt gives from the POI side.

Reference comparison runs in trust order. **liftie** is the star — it scrapes
the operator's own status page, so a lift it names with no extracted
counterpart is the strongest "we missed one" signal available, and each one is
also a row in the queue. The other two report honestly rather than blankly:
Skimap carries no countable lift or run totals, and where official declared
counts should live is still open. A source that could not be compared leaves
`reference_delta` **not run** rather than passing — a gate nothing checked has
not held.

Four gates, three blocking, one warn-only (`missing_difficulty`: routing
degrades to an unknown grade rather than breaking). Waiving takes a reason and
writes an audit row, same as the membership gates — it is literally the same
card component.

`f` fix upstream · `o` local override · `a` accept gap (reason required) ·
`r` retry

**No geometry editing here either.** `local_override` records a graph-repair
decision — a connector edge, a tag — as our own evidence over OSM. It draws
nothing. A genuinely missing run is `fix_upstream`, fixed in OSM where everyone
downstream benefits; the console never edits OSM.

The graph is rebuilt per database, so an entry the pipeline has not imported —
production today, every fresh e2e database — returns `graphAvailable: false`
and the screen says "no routing graph yet" rather than reporting zeros. That is
a designed state, not an error.

> Coverage does not appear on the worklist's stage ladder. It surfaces through
> the **Coverage** tab count and through `coverage_signed_off`, the sixth
> pre-publish check on screen 6.

### 7. Runs & audit — `/console/runs`

`ingestion_runs` rendered. Every run: stages executed, **dataset release
versions** (Overture hosts only the last two, so a run without one is
unreproducible), durations, costs, gate outcomes, approvals, waivers.

The audit tab is the same history by decision rather than by run, because "who
waived that gate and why" is a question you ask without knowing which run it
happened in. Per-entry history is the **History** tab on any resort.

### Guides

Stage 4 is out of scope for v1. The nav stub says what it will be.

---

## Conventions

**Keyboard first.** `?` on any screen lists every binding it has declared. A
screen declares its bindings once and passes the same array to the hotkey hook
and the help overlay, so the two cannot drift. Bindings never fire while focus
is in a text field.

**Nothing destructive without an audit row.** Merges, waivers, approvals and
publishes all record who, when and why. The actor is resolved server-side from
the session and is never accepted from the browser.

**Edit sparingly.** The analyst reassigns, merges, re-categorises and flags for
re-run. Geometry hand-editing is a non-goal.

**Bounded reads.** Lists are virtualised, map markers clustered, and every
contract endpoint is paginated or bbox-scoped. A group like Les 3 Vallées is
~600 places and the region is ~6k trails.

**Desktop-first.** Three-column screens want ≥1440px and degrade to two at
laptop widths. Colour scheme follows the OS.

---

## Layout

```
src/lib/ingestion-api.ts              the contract — zod schemas, types, route table
src/lib/ingestion/
  client.ts                           env-toggled adapter selection
  mock-adapter.ts                     full IngestionApi over fixtures + overlay
  http-adapter.ts                     full IngestionApi over alpline-backend
  store.ts                            in-memory overlay of analyst actions
  fixtures/registry-seed.ts           real production snapshot + roadmap
  fixtures/build.ts                   deterministic generation
src/lib/console/auth.ts               session, allow-list, auth mode
src/middleware.ts                     session refresh + the /console gate
src/app/(console)/                    routes
src/components/console/               screens and primitives
src/components/console/ui/GateCard.tsx  one gate card, shared by screens 4 and 8
src/styles/console.css                console density and status tokens
```

The fixtures are deterministic: the same registry id always produces the same
conflicts, orphans, costs and findings. An analyst who resolves conflict #7,
reloads, and finds a different conflict #7 cannot trust anything on the screen.

Mock-mode state (verdicts, waivers, approvals, publishes) lives in memory and
resets when the dev server restarts. That is the right trade for a mock — no
migrations before the console is usable, and no illusion that it is a database.
