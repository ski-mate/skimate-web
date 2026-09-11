import type { Figure } from "@/content/guide/types";

/**
 * Screenshots for the manual, keyed by chapter slug.
 *
 * They live here rather than in the Markdown because `chapters.ts` is
 * generated — regenerating it would wipe anything hand-added. Keeping figures
 * in a separate map means the manual can be re-synced from alpline-admin at
 * any time without losing them, and a chapter that gains a screenshot needs no
 * change to the source document.
 *
 * They are served from `public/guide/console/`, which is deliberate: the
 * middleware matcher is `/guide/console/:path*`, so the images sit behind the
 * same allow-list as the pages that embed them. Screenshots of internal
 * tooling are exactly as sensitive as the prose describing it, and moving them
 * anywhere else under `public/` would publish them.
 *
 * Captured from the running console against real Les 3 Vallées data, at
 * 1560×843 (the width the guide column renders at 2×). They are real screens,
 * not mock-ups: a manual whose screenshots do not match the product is worse
 * than one with none.
 */
export const chapterFigures: Record<string, Figure> = {
  "chapter-2-access-and-orientation": {
    src: "/guide/console/shortcuts.jpg",
    alt: "The keyboard shortcut overlay open over the coverage screen, listing bindings grouped by Navigate, Verdict and General.",
    width: 1560,
    height: 843,
    caption: "Press ? on any screen. This overlay is the authoritative reference for where you are.",
  },
  "chapter-3-the-morning-routine-atlas-worklist": {
    src: "/guide/console/worklist.jpg",
    alt: "The Atlas worklist: every registry entry as a row with a stage badge, next action, signal counts and cost to date.",
    width: 1560,
    height: 843,
    caption: "The worklist, sorted by next action. The top row is your morning.",
  },
  "chapter-4-onboarding-a-new-resort-the-wizard": {
    src: "/guide/console/onboarding.jpg",
    alt: "The onboarding wizard: identity candidates from Skimap and OSM on the left, the extent map centre, and the live manifest JSON on the right.",
    width: 1560,
    height: 843,
    caption: "The manifest JSON on the right is the pipeline's input contract — the form is only a way to type it.",
  },
  "chapter-5-harvest-review": {
    src: "/guide/console/harvest.jpg",
    alt: "The harvest review screen: a layered map of candidate places beside the conflict queue, with source chips on every field.",
    width: 1560,
    height: 843,
    caption: "Highest-volume screen in the console. Drive it from the home row.",
  },
  "chapter-6-membership-gates": {
    src: "/guide/console/membership.jpg",
    alt: "The membership screen: places coloured by assigned member with the unclaimed orphan belt drawn in red, the four validation gates and the orphan queue on the right.",
    width: 1560,
    height: 843,
    caption: "Orphans cluster. A belt in one place is usually one missing village, not stray data.",
  },
  "chapter-7-routing-coverage-screen-8": {
    src: "/guide/console/coverage.jpg",
    alt: "The routing coverage screen: graph statistics across the top, per-member census and reference comparison cards, the coverage gates panel and the findings queue.",
    width: 1560,
    height: 843,
    caption: "Graph stats first, then the census, then what the operator's own feed says we are missing.",
  },
  "chapter-8-qa-and-publish": {
    src: "/guide/console/qa.jpg",
    alt: "The QA workspace: the rendered data beside the official piste map, with the six pre-publish checks, count deltas and the human checklist.",
    width: 1560,
    height: 843,
    caption: "Six automated checks run before you look, so your attention goes to what a machine cannot judge.",
  },
  "chapter-9-enrichment-the-money-screen": {
    src: "/guide/console/enrichment.jpg",
    alt: "The enrichment cost gate: the Foursquare dry run shown as a reduction from every POI in scope down to billable calls, with the approval control and its hard ceiling.",
    width: 1560,
    height: 843,
    caption: "The only paid step in the pipeline. Nothing runs without the approval row this screen writes.",
  },
  "chapter-10-runs-audit-and-your-paper-trail": {
    src: "/guide/console/runs.jpg",
    alt: "The runs and audit screen: the run ledger with stages, dataset release versions, durations, costs, gate outcomes and waivers.",
    width: 1560,
    height: 843,
    caption: "Your paper trail. Every merge, waiver, approval and publish, with who and why.",
  },
};
