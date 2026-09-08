import type { FeatureStatus } from "./site";

export interface Tile {
  id: string;
  eyebrow: string;
  headline: string;
  tagline: string;
  href: string;
  ctaLabel?: string;
  status: FeatureStatus;
}

/**
 * Homepage tiles. Every claim here traces to a shipped (checked) row in
 * FEATURES-ACCESS-AND-MONETIZATION.md section 5. Anything not yet built either
 * does not appear or carries status: "soon" and is labelled in the UI.
 *
 * Voice: headline six words or fewer, sentence case, declarative. Tagline is
 * one sentence. No exclamation marks, no superlatives.
 */

export const hero = {
  eyebrow: "Alpline",
  headline: "Know the mountain.",
  tagline:
    "Piste-aware navigation, skill-matched routing and your friends on one map.",
  primary: { href: "#waitlist", label: "Get early access" },
  secondary: { href: "/guide", label: "See how it works" },
};

/** Full-bleed tiles, in order down the page. */
export const featureTiles: Tile[] = [
  {
    id: "navigation",
    eyebrow: "Navigation",
    headline: "Turn-by-turn, on snow.",
    tagline:
      "Alpline routes you along pistes and lifts, and recalculates when you drift.",
    href: "/features/navigation",
    status: "shipping",
  },
  {
    id: "routing",
    eyebrow: "Routing",
    headline: "Routes that match your level.",
    tagline:
      "Set your ability once and Alpline will never route you onto a run above it.",
    href: "/features/navigation",
    status: "shipping",
  },
];

/** Half-width tiles, arranged in 2-up rows. */
export const halfTiles: Tile[] = [
  {
    id: "social",
    eyebrow: "Social",
    headline: "Find your crew.",
    tagline: "See where everyone is, and regroup without the group chat.",
    href: "/features/social",
    status: "shipping",
  },
  {
    id: "resorts",
    eyebrow: "Resorts",
    headline: "Every piste, mapped.",
    tagline: "Runs, lifts and mountain restaurants, in winter, satellite or 3D.",
    href: "/resorts",
    status: "shipping",
  },
  {
    id: "places",
    eyebrow: "Places",
    headline: "Save the spots that matter.",
    tagline: "Drop a pin on the good coffee, the quiet lift, the meeting point.",
    href: "/features/navigation",
    status: "shipping",
  },
  {
    id: "tracking",
    eyebrow: "Tracking",
    headline: "Every run, counted.",
    tagline: "Vertical, distance and speed, recorded as you ski.",
    href: "/features/tracking",
    status: "soon",
  },
];

export const promos = [
  {
    id: "pro",
    eyebrow: "Alpline Pro",
    headline: "Take the mountain offline.",
    body: "Download a whole resort before you lose signal, and see which runs are open right now.",
    href: "/pricing",
    ctaLabel: "What Pro adds",
  },
  {
    id: "guide",
    eyebrow: "Guide",
    headline: "Learn every feature.",
    body: "Step-by-step help for everything Alpline does, written the way a manual should be.",
    href: "/guide",
    ctaLabel: "Open the guide",
  },
];

export const footnotes = [
  "Alpline Pro is required for offline map packs, live trail status, AI technique analysis and the full Perfect Day Score.",
  "Features marked “Coming soon” are in development and are not available today.",
  "Resort coverage is expanding. See the resorts page for everywhere Alpline works right now.",
];
