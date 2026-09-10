import type { FeatureStatus } from "./site";
import type { Media } from "./media";

export type { Media };


/**
 * A tile carries at most one of two kinds of image, and the distinction is
 * deliberate:
 *
 *   media  a real screenshot of the shipped app, shown inside a DeviceFrame
 *   photo  an atmospheric mountain photograph, generated, shown as a band
 *
 * Product claims are only ever illustrated with `media`. A generated image is
 * never allowed to stand in for an interface, because an invented screenshot
 * is a false claim about what the app does.
 */
export interface Tile {
  id: string;
  /** Device screenshot shown inside a DeviceFrame, when one exists. */
  media?: Media;
  /** Atmospheric photograph, shown full-bleed at the foot of the tile. */
  photo?: Media;
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
  src: "/media/home/hero-dawn.webp",
  alt: "Dawn over a deep-winter alpine range, with layered snow ridges above a valley filled with cloud.",
  width: 2000,
  height: 837,
  blurDataURL:
    "data:image/webp;base64,UklGRkQAAABXRUJQVlA4IDgAAADQAQCdASoQAAYAA4BaJbACdAEOeXlf0AD+J55jdX6ub6wbIMgGBh99utu5j8peud4kveK0fLeSAA==",
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
    photo: {
      src: "/media/home/routing.webp",
      alt: "A groomed piste seen from directly above, dividing into two separate runs around a stand of snow-covered pines.",
      width: 1800,
      height: 1012,
      blurDataURL:
        "data:image/webp;base64,UklGRlAAAABXRUJQVlA4IEQAAACQAQCdASoQAAkAA4BaJQBOgA/mSgAA/gsmJcOBm4/NRf7PgEtoDHZP8ej4IFUQ0yDyJVbtFnl9GwGgvkAE+K8kCtWAAA==",
    },
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
    photo: {
      src: "/media/home/social.webp",
      alt: "Four skiers, small in the frame, descending a wide open snowfield below a rock buttress.",
      width: 1600,
      height: 900,
      // The skiers sit low in the frame; a centred crop cuts them in half.
      position: "center 45%",
      blurDataURL:
        "data:image/webp;base64,UklGRi4AAABXRUJQVlA4ICIAAAAwAQCdASoQAAkAA4BaJaQAA3AA/u+OoSooZ/WFQvVbkUAA",
    },
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
    photo: {
      src: "/media/home/places.webp",
      alt: "A timber mountain restaurant banked in deep snow at dusk, its windows lit, with peaks behind.",
      width: 1600,
      height: 900,
      blurDataURL:
        "data:image/webp;base64,UklGRlAAAABXRUJQVlA4IEQAAAAwAgCdASoQAAkAA4BaJZgCdAEWzO7V5fJgAAD+gst7OFtmxp8dXNkEnfJIC6xFcfo74ieT5Xj4qbKlX109oqXxEYAAAA==",
    },
  },
  {
    id: "tracking",
    eyebrow: "Tracking",
    headline: "Every run, counted.",
    tagline: "Vertical, distance and speed, recorded as you ski.",
    href: "/features/tracking",
    status: "soon",
    photo: {
      src: "/media/home/tracking.webp",
      alt: "A single carved ski track arcing across a wide field of fresh corduroy grooming in low winter sun.",
      width: 1600,
      height: 900,
      blurDataURL:
        "data:image/webp;base64,UklGRlAAAABXRUJQVlA4IEQAAADwAQCdASoQAAkAA4BaJZgCdADcrWdiLoAA/pFrr4AJASLoIu0C3j/LJFCHSkVGsJ+Ad6GbsmUv8uWOmMkRtXov28PAAA==",
    },
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
