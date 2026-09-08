import type { FeatureStatus } from "./site";

export interface Media {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL: string;
}

/**
 * Val Thorens and the Trois Vallees, rendered from MapTiler winter tiles with
 * 3D terrain. Real terrain Alpline actually covers, not stock photography.
 *
 * Captured in a headless browser rather than via MapTiler's Static Maps API,
 * which returns 403 on this account's free tier.
 */
export interface Tile {
  id: string;
  /** Device screenshot shown inside a DeviceFrame, when one exists. */
  media?: Media;
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

export const heroMedia: Media = {
  src: "/media/home/hero-winter.webp",
  alt: "Three-dimensional winter map of Val Thorens, showing the piste network coloured by difficulty across the Trois Vallees.",
  width: 1960,
  height: 1440,
  blurDataURL: "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACQAQCdASoQAAwAAwBSJZV/2RgAiwAA/vD3nlfBthpe6CKYT+TXK0ZAHyXpngAA",
};

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
    media: {
    src: "/media/app/place-card.webp",
    alt: "Alpline showing a trail place card for Col de la Chambre, with a Directions button and the run's difficulty, length and vertical drop.",
    width: 804,
    height: 1748,
    blurDataURL: "data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoGAAwAAwBSJZQC7AD0Rv/2FAAA/vPQlhlTRP7cEw3K1Kf0cmOqYRQ7ZdrMPYAA",
  },
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
    media: {
    src: "/media/app/map-idle.webp",
    alt: "Alpline's winter map of Val Thorens, with pistes coloured by difficulty and mountain restaurants and lifts marked.",
    width: 804,
    height: 1748,
    blurDataURL: "data:image/webp;base64,UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoGAAwAAwBSJYwCsADz22GIAAD+8I1p9KOHK0IKNtfsTQNQEinv4ecAAAA=",
  },
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
