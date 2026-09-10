import type { FeatureStatus } from "./site";
import type { Media } from "./media";
import type { SectionId } from "./guide/types";

export interface Capability {
  title: string;
  body: string;
  status: FeatureStatus;
  /** True when Alpline Pro is required. See FEATURES doc section 6. */
  pro?: boolean;
}

export interface FeatureArea {
  slug: SectionId;
  /** Nav label. */
  name: string;
  eyebrow: string;
  headline: string;
  tagline: string;
  intro: string;
  srs: string;
  capabilities: Capability[];
  /**
   * The hero photograph. Atmospheric only — a feature page never illustrates a
   * capability with a generated image, because an invented screenshot would be
   * a claim about behaviour that does not exist.
   */
  photo: Media;
  /** Guide section to link into, when it has published articles. */
  guideSection?: SectionId;
}

/**
 * The eight areas mirror SRS section 4.
 *
 * Every `shipping` claim traces to a checked row in
 * alpline-admin/FEATURES-ACCESS-AND-MONETIZATION.md section 5. Everything else
 * is marked `soon` and rendered with a visible label — the site must never
 * describe an unbuilt capability in the present tense.
 */
export const featureAreas: FeatureArea[] = [
  {
    slug: "navigation",
    name: "Navigation",
    eyebrow: "Navigation",
    headline: "Turn-by-turn, on snow.",
    tagline:
      "Routing that follows pistes and lifts, and knows what you can ski.",
    intro:
      "Road maps are the wrong shape for a mountain. Alpline routes along the piste and lift network, so a route is a sequence of runs and rides rather than a line drawn over terrain you cannot use.",
    srs: "4.1",
    photo: {
      src: "/media/features/navigation.webp",
      alt: "A groomed piste curving away down a mountain flank between orange marker poles, with peaks beyond.",
      width: 2000,
      height: 837,
      blurDataURL:
        "data:image/webp;base64,UklGRk4AAABXRUJQVlA4IEIAAADQAQCdASoQAAYAA4BaJZACdAC53DbLAAD8tLbE4irceSWhBPG4XRCa+Ykoa7ZEewyCtPMhbpK70EKUI1CZvlgAAAA=",
    },
    guideSection: "navigation",
    capabilities: [
      {
        title: "Skill-aware routing",
        body: "Set the level you ski and Alpline plans around anything above it. A beginner never gets routed onto a black run to save four minutes.",
        status: "shipping",
      },
      {
        title: "Turn-by-turn guidance",
        body: "The next manoeuvre and the distance to it, with off-route recovery that recalculates from where you actually are.",
        status: "shipping",
      },
      {
        title: "The whole mountain, drawn",
        body: "Every run coloured by difficulty and every lift mapped, in winter, satellite or shaded terrain, in 2D or 3D.",
        status: "shipping",
      },
      {
        title: "Saved places",
        body: "Drop a pin on your lodge, your car or a meeting point, and route back to it from anywhere on the mountain.",
        status: "shipping",
      },
      {
        title: "Audio guidance",
        body: "Directions in your ear so you can keep your eyes on the slope, without interrupting your music.",
        status: "soon",
      },
      {
        title: "Offline map packs",
        body: "Download a whole resort before you go, for full navigation with no signal at all.",
        status: "soon",
        pro: true,
      },
    ],
  },
  {
    slug: "tracking",
    name: "Tracking",
    eyebrow: "Tracking",
    headline: "Every run, counted.",
    tagline: "A record of what you actually skied, kept on your phone.",
    intro:
      "Alpline records your day on the device rather than in the cloud, so your logbook is yours whether or not you ever make an account. An account adds backup, not permission.",
    srs: "4.2",
    photo: {
      src: "/media/features/tracking.webp",
      alt: "A long groomed run in low winter sun with a single set of ski tracks running its length.",
      width: 2000,
      height: 837,
      blurDataURL:
        "data:image/webp;base64,UklGRj4AAABXRUJQVlA4IDIAAACQAQCdASoQAAYAA4BaJQBOgCGIX4AA/ie1aGpJXRHAbue4MwlzN0gtknDVBqW7l23AAA==",
    },
    capabilities: [
      {
        title: "Recording",
        body: "Vertical, distance, speed and time on piste, captured as you ski, with lifts and runs told apart automatically.",
        status: "soon",
      },
      {
        title: "Your logbook",
        body: "Every day you have skied, with the runs you took and how they compare across a season.",
        status: "soon",
      },
      {
        title: "Season recap",
        body: "What your winter added up to, in a form worth sharing.",
        status: "soon",
      },
      {
        title: "Import and export",
        body: "Bring your history in from another app, and take your data out again in a standard format whenever you like.",
        status: "soon",
      },
      {
        title: "Technique analysis",
        body: "Insight into how you ski, from the sensors already in your phone.",
        status: "soon",
        pro: true,
      },
    ],
  },
  {
    slug: "safety",
    name: "Safety",
    eyebrow: "Safety",
    headline: "Help, without hunting for it.",
    tagline: "Emergency features that are free, and never behind a login.",
    intro:
      "Safety features are the one part of Alpline with no conditions attached. They are free forever, they work without an account, and they are never part of a paid tier.",
    srs: "4.3",
    photo: {
      src: "/media/features/safety.webp",
      alt: "A line of piste marker poles disappearing into a whiteout on an exposed alpine ridge.",
      width: 2000,
      height: 837,
      blurDataURL:
        "data:image/webp;base64,UklGRjQAAABXRUJQVlA4ICgAAABwAQCdASoQAAYAA4BaJZwCdAFAAAD+7/llLEcNGfPuo76ylJMirsAA",
    },
    capabilities: [
      {
        title: "Emergency SOS",
        body: "Reach help and send your exact position, without digging through menus first.",
        status: "soon",
      },
      {
        title: "Call ski patrol",
        body: "The right number for the resort you are actually standing in, one tap away.",
        status: "soon",
      },
      {
        title: "Share a live link",
        body: "Send someone a link that shows where you are while you ski. They do not need the app, or an account.",
        status: "soon",
      },
      {
        title: "Avalanche information",
        body: "Current danger ratings for the area you are skiing, free of charge, always.",
        status: "soon",
      },
      {
        title: "Report a hazard",
        body: "Flag ice, an obstacle or a closure so the people behind you know about it.",
        status: "soon",
      },
    ],
  },
  {
    slug: "social",
    name: "Social",
    eyebrow: "Social",
    headline: "Find your crew.",
    tagline: "See where everyone is, and stop coordinating over text.",
    intro:
      "Groups split up. Someone stops for coffee, someone takes one more run, and the rest of the day turns into a thread of messages about where everybody is. Alpline puts your group on the map instead.",
    srs: "4.4",
    photo: {
      src: "/media/features/social.webp",
      alt: "A small group of skiers gathered on a snowy col, tiny against the surrounding mountains.",
      width: 2000,
      height: 837,
      blurDataURL:
        "data:image/webp;base64,UklGRkIAAABXRUJQVlA4IDYAAAAQAgCdASoQAAYAA4BaJYwCdAECpmRxVx0AAP4FzdAsiQY6gx9vJVvRHEd9R0CY5OD5aILoAAA=",
    },
    capabilities: [
      {
        title: "Live friend locations",
        body: "Everyone who has shared their location, on the resort map, updating as they move.",
        status: "shipping",
      },
      {
        title: "Friends",
        body: "Add people by invite or QR code. Sharing is opt-in on both sides and can be turned off at any time.",
        status: "shipping",
      },
      {
        title: "Group chat",
        body: "Messages and group threads, in the same app as the map you are both looking at.",
        status: "shipping",
      },
      {
        title: "Meeting points",
        body: "Agree a spot, and everyone gets a route to it from wherever they are.",
        status: "soon",
      },
      {
        title: "Leaderboards",
        body: "Private standings among friends. No public feed, no strangers.",
        status: "soon",
      },
    ],
  },
  {
    slug: "resorts",
    name: "Resorts",
    eyebrow: "Resorts",
    headline: "Know the mountain before you go.",
    tagline: "Runs, lifts, restaurants and lodges, searchable on the map.",
    intro:
      "A resort is more than its pistes. Alpline maps the places on the mountain too, so finding lunch is the same gesture as finding a run.",
    srs: "4.5",
    photo: {
      src: "/media/features/resorts.webp",
      alt: "A large alpine ski basin from above, pistes threading between rocky ridges and pine forest.",
      width: 2000,
      height: 837,
      blurDataURL:
        "data:image/webp;base64,UklGRkoAAABXRUJQVlA4ID4AAAAQAgCdASoQAAYAA4BaJYwCdAEU3OH8xwMwAP14/D8cB2QIsV0NQ8fe1nSXYI5ukYbNicK5wy2tTDX4hycAAA==",
    },
    guideSection: "navigation",
    capabilities: [
      {
        title: "Search the resort",
        body: "Any run, lift, restaurant, lodge or facility by name, from one search field.",
        status: "shipping",
      },
      {
        title: "Find nearby",
        body: "Browse the slopes, restaurants, lifts and lodging around you without knowing what they are called.",
        status: "shipping",
      },
      {
        title: "Resort details",
        body: "Base and summit altitude, vertical drop, and the shape of the lift network.",
        status: "shipping",
      },
      {
        title: "Live trail status",
        body: "Which runs and lifts are open right now, so a route never sends you to a closed chair.",
        status: "soon",
        pro: true,
      },
    ],
  },
  {
    slug: "conditions",
    name: "Conditions",
    eyebrow: "Conditions",
    headline: "Read the weather.",
    tagline: "What the mountain is doing today, before you commit to it.",
    intro:
      "Conditions decide the day more than anything else. Alpline surfaces what matters on the mountain itself, rather than the forecast for the town in the valley.",
    srs: "4.6",
    photo: {
      src: "/media/features/conditions.webp",
      alt: "Fresh snowfall loading the branches of a dense alpine pine forest in flat overcast light.",
      width: 2000,
      height: 837,
      blurDataURL:
        "data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAACwAQCdASoQAAYAA4BaJaQAAodlK7Z0APa0G0sE8lrFQ/2yO4KCjWybjOKfPhFHb7UkAAAA",
    },
    capabilities: [
      {
        title: "Mountain weather",
        body: "Temperature, wind and visibility for the resort, at altitude rather than in the valley.",
        status: "soon",
      },
      {
        title: "Snow depth",
        body: "Base depth and recent snowfall, on the map next to where you are skiing.",
        status: "soon",
      },
      {
        title: "Where to ski today",
        body: "A score for each resort within reach, weighing snow, weather and how busy it is likely to be.",
        status: "soon",
        pro: true,
      },
    ],
  },
  {
    slug: "integrations",
    name: "Integrations",
    eyebrow: "Integrations",
    headline: "Your data, your devices.",
    tagline: "Alpline should fit around what you already use.",
    intro:
      "Your skiing does not only live in one app, and it should not be trapped in one either. Everything Alpline records is exportable, in formats other tools already understand.",
    srs: "4.7",
    photo: {
      src: "/media/features/integrations.webp",
      alt: "A snowy mountain shoulder at dusk, with the lights of a valley village far below.",
      width: 2000,
      height: 837,
      blurDataURL:
        "data:image/webp;base64,UklGRjgAAABXRUJQVlA4ICwAAADwAQCdASoQAAYAA4BaJYwCdAEQ/bH3pAAA/vQqeeqcvCe1379rj2OYjwAAAA==",
    },
    capabilities: [
      {
        title: "Health platforms",
        body: "Send your days to Apple Health so your skiing counts alongside everything else you do.",
        status: "soon",
      },
      {
        title: "Other services",
        body: "Connect the training and tracking services you already keep your history in.",
        status: "soon",
      },
      {
        title: "Apple Watch",
        body: "Start and stop a recording, and glance at your day, from your wrist.",
        status: "soon",
      },
      {
        title: "Export",
        body: "Take everything with you in a standard format, at any time, without asking.",
        status: "soon",
      },
    ],
  },
  {
    slug: "advanced",
    name: "Advanced",
    eyebrow: "Advanced",
    headline: "See the day again.",
    tagline: "Replay where you went and how you skied it.",
    intro:
      "Once a day is recorded there is more to do with it than count the vertical. These are the parts of Alpline that turn a track into something you can look at.",
    srs: "4.8",
    photo: {
      src: "/media/features/advanced.webp",
      alt: "A steep untracked powder couloir between dark rock walls high in the mountains.",
      width: 2000,
      height: 837,
      blurDataURL:
        "data:image/webp;base64,UklGRjwAAABXRUJQVlA4IDAAAADwAQCdASoQAAYAA4BaJQBOgCPQf1xIIAAA/vXc5M06pz3zik4S5Cym500BkWQAAAA=",
    },
    capabilities: [
      {
        title: "3D replay",
        body: "Fly the runs you skied, with speed and altitude along the way.",
        status: "soon",
      },
      {
        title: "Timeline editing",
        body: "Trim, split or fix a recording when the mountain confused it.",
        status: "soon",
      },
      {
        title: "Technique insight",
        body: "What your turns actually looked like, and what to work on next.",
        status: "soon",
        pro: true,
      },
    ],
  },
];

export function getFeatureArea(slug: string): FeatureArea | undefined {
  return featureAreas.find((a) => a.slug === slug);
}

/** Fails the build rather than shipping an inconsistent feature list. */
export function assertFeaturesIntegrity(): void {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const area of featureAreas) {
    if (seen.has(area.slug)) problems.push(`duplicate area: ${area.slug}`);
    seen.add(area.slug);
    if (area.capabilities.length === 0) {
      problems.push(`${area.slug}: no capabilities`);
    }
    for (const c of area.capabilities) {
      // A Pro feature that already ships would need a real entitlement story.
      if (c.pro && c.status === "shipping") {
        problems.push(`${area.slug}/${c.title}: marked pro and shipping`);
      }
    }
  }
  if (problems.length > 0) {
    throw new Error(`Feature content is invalid:\n  - ${problems.join("\n  - ")}`);
  }
}

assertFeaturesIntegrity();
