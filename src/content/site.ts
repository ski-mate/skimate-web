/** Brand-level facts. The single source for metadata and the footer. */

export const site = {
  name: "Alpline",
  /** Kept from the original site — it is the established positioning line. */
  tagline: "Navigate smarter, ski better, find your crew.",
  description:
    "Alpline is a ski navigation app with turn-by-turn guidance, skill-aware routing and live friend locations. Free to use, on iPhone.",
  url: "https://getalpline.com",
  email: "support@getalpline.com",
  keywords: [
    "ski navigation",
    "ski app",
    "snowboard app",
    "piste map",
    "ski routing",
    "resort map",
    "turn-by-turn skiing",
    "ski tracking",
  ],
} as const;

/**
 * Whether a capability actually ships today.
 *
 * Source of truth: alpline-admin/FEATURES-ACCESS-AND-MONETIZATION.md section 5.
 * Anything marked "soon" there is not built, and must never be written as a
 * present-tense claim anywhere on this site.
 */
export type FeatureStatus = "shipping" | "soon";
