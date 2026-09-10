import type { FeatureStatus } from "./site";

export interface PricingRow {
  feature: string;
  free: boolean;
  pro: boolean;
  status: FeatureStatus;
  note?: string;
}

/**
 * Source of truth: alpline-admin/FEATURES-ACCESS-AND-MONETIZATION.md section 6.
 *
 * Only four capabilities are paid at launch, and they are the ones with a real
 * marginal cost to serve. Everything listed there as "explicitly never
 * paywalled" is free in both columns here, permanently.
 */
export const pricing = {
  free: {
    name: "Alpline",
    price: "Free",
    summary:
      "The map, routing, navigation, saved places and your friends. No ads, and no account required to start.",
  },
  pro: {
    name: "Alpline Pro",
    price: "Free trial, then paid",
    summary:
      "Adds the four things that cost us real money to serve. Everything else stays free.",
  },
  /** The promise that constrains the whole tier design. */
  guarantee:
    "Safety features are never behind the paywall and never behind a login. SOS, contacting ski patrol, live location links and avalanche information are free, forever, with or without an account.",
} as const;

export const pricingRows: PricingRow[] = [
  { feature: "Resort map, in winter, satellite and 3D", free: true, pro: true, status: "shipping" },
  { feature: "Search runs, lifts, restaurants and lodges", free: true, pro: true, status: "shipping" },
  { feature: "Skill-aware routing", free: true, pro: true, status: "shipping" },
  { feature: "Turn-by-turn navigation", free: true, pro: true, status: "shipping" },
  { feature: "Saved places and pins", free: true, pro: true, status: "shipping" },
  { feature: "Live friend locations", free: true, pro: true, status: "shipping" },
  { feature: "Group chat", free: true, pro: true, status: "shipping" },
  { feature: "Recording and your logbook", free: true, pro: true, status: "soon" },
  { feature: "Season recap and share cards", free: true, pro: true, status: "soon" },
  { feature: "Import and export your data", free: true, pro: true, status: "soon" },
  { feature: "Leaderboards among friends", free: true, pro: true, status: "soon" },
  {
    feature: "Emergency SOS, ski patrol and avalanche information",
    free: true,
    pro: true,
    status: "soon",
    note: "Never paywalled",
  },
  {
    feature: "Offline map packs",
    free: false,
    pro: true,
    status: "soon",
    note: "Annual plan only",
  },
  { feature: "Live trail and lift status", free: false, pro: true, status: "soon" },
  { feature: "AI technique analysis", free: false, pro: true, status: "soon" },
  {
    feature: "Full Perfect Day Score",
    free: false,
    pro: true,
    status: "soon",
    note: "Basic score is free",
  },
];

export const pricingFootnotes = [
  "Alpline Pro is a subscription. A free trial is available, and pricing is confirmed at purchase in the App Store.",
  "Offline map packs are included with the annual plan only.",
  "Features marked “Coming soon” are in development and are not available today. They are listed so the tiers are clear in advance, not to imply they ship now.",
];
