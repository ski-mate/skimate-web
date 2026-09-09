import type { GuideArticle, GuideSection } from "./types";
import { findYourWay } from "./articles/find-your-way";
import { getDirections } from "./articles/get-directions";
import { saveAPlace } from "./articles/save-a-place";

/**
 * A placeholder for a capability that is not built yet. It gets no route and no
 * sitemap entry, and is skipped by the pager — it appears only as a muted row
 * in its section index so the shape of the guide is honest about what is
 * coming without pretending it exists.
 */
function planned(
  section: GuideArticle["section"],
  slug: string,
  title: string,
  description: string
): GuideArticle {
  return {
    slug,
    section,
    title,
    description,
    intro: [],
    blocks: [],
    status: "planned",
    updated: "2026-09-09",
  };
}

/**
 * The eight sections mirror SRS section 4 one-for-one. Order here is the order
 * everywhere: sidebar, section index, prev/next pager and sitemap.
 */
export const guideSections: GuideSection[] = [
  {
    id: "navigation",
    title: "Navigate the mountain",
    description:
      "Read the map, route along pistes and lifts, and keep your bearings on unfamiliar terrain.",
    srs: "4.1",
    articles: [findYourWay, getDirections, saveAPlace],
  },
  {
    id: "tracking",
    title: "Track your skiing",
    description: "Record your day and see what you actually skied.",
    srs: "4.2",
    articles: [
      planned("tracking", "record-a-day", "Record a day", "Start, pause and finish a recording, and see your runs, vertical and distance as you ski."),
      planned("tracking", "your-logbook", "Read your logbook", "Review past days, compare runs and follow your progress across a season."),
    ],
  },
  {
    id: "safety",
    title: "Stay safe",
    description: "Emergency help, hazard reporting and avalanche information.",
    srs: "4.3",
    articles: [
      planned("safety", "get-help", "Get help in an emergency", "Contact ski patrol and share your exact location when something goes wrong."),
    ],
  },
  {
    id: "social",
    title: "Ski with other people",
    description: "Friends, live locations and keeping a group together.",
    srs: "4.4",
    articles: [
      planned("social", "share-your-location", "Share your location with friends", "Let the people you are skiing with see where you are, and find them again when you split up."),
    ],
  },
  {
    id: "resorts",
    title: "Resorts and facilities",
    description: "Find restaurants, lodges and services, and see what is open.",
    srs: "4.5",
    articles: [
      planned("resorts", "find-nearby", "Find somewhere to eat or stay", "Search the restaurants, lodges and amenities on the mountain around you."),
    ],
  },
  {
    id: "conditions",
    title: "Weather and conditions",
    description: "Temperature, snow depth and what the mountain is doing today.",
    srs: "4.6",
    articles: [
      planned("conditions", "check-conditions", "Check the conditions", "See temperature, wind and snow depth for the resort before you head up."),
    ],
  },
  {
    id: "integrations",
    title: "Your other apps and devices",
    description: "Health platforms, watches and getting your data out.",
    srs: "4.7",
    articles: [
      planned("integrations", "export-your-data", "Export your data", "Take your recorded days out of Alpline in a standard format."),
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "Technique analysis and replaying your day in three dimensions.",
    srs: "4.8",
    articles: [
      planned("advanced", "replay-your-day", "Replay your day", "Fly through the runs you skied and see speed and altitude along the way."),
    ],
  },
];
