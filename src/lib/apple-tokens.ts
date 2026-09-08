/**
 * TypeScript mirror of the CSS token layer, for JS consumers that cannot read
 * CSS custom properties: framer-motion springs, satori/ImageResponse OG cards,
 * and MapTiler style overrides.
 *
 * Provenance: iOS values transcribed from
 *   alpline-admin/apple-ui-brain/00-foundations/{colors,layout,materials}.md
 * and kept in sync with
 *   alpline-mobile/src/shared/utils/design/colors.ts
 * Deliberately a copy, not a cross-repo import — alpline-admin is not a package
 * and a relative import would break the Vercel build.
 *
 * Keep in sync with src/styles/tokens.css.
 */

export const marketing = {
  light: {
    bg: "#FFFFFF",
    bgElevated: "#F5F5F7",
    label: "#1D1D1F",
    label2: "rgba(29,29,31,0.72)",
    label3: "rgba(29,29,31,0.56)",
    link: "#0066CC",
    separator: "rgba(0,0,0,0.12)",
  },
  dark: {
    bg: "#000000",
    bgElevated: "#161617",
    label: "#F5F5F7",
    label2: "rgba(245,245,247,0.72)",
    label3: "rgba(245,245,247,0.56)",
    link: "#2997FF",
    separator: "rgba(255,255,255,0.16)",
  },
} as const;

/** iOS system palette — device frames and the /map demo only. */
export const ios = {
  blue: "#007AFF",
  green: "#34C759",
  red: "#FF3B30",
  orange: "#FF9500",
  label: "#000000",
  label2: "rgba(60,60,67,0.60)",
  label3: "rgba(60,60,67,0.30)",
  background: "#FFFFFF",
  groupedBackground: "#F2F2F7",
  fill: "rgba(120,120,128,0.20)",
  fillTertiary: "rgba(118,118,128,0.12)",
  separator: "rgba(60,60,67,0.29)",
  materialChrome: "rgba(255,255,255,0.72)",
} as const;

/** Piste difficulty colours, shared with the mobile app. */
export const piste = {
  green: "#34C759",
  blue: "#007AFF",
  red: "#FF3B30",
  black: "#1D1D1F",
  orange: "#FF9500",
} as const;

export const layout = {
  containerWide: 1440,
  containerContent: 980,
  containerGuide: 692,
  gutter: 22,
  navHeight: 44,
  sectionY: 108,
  /** apple.com's real breakpoints. */
  breakpoints: { sm: 320, md: 735, lg: 1069, xl: 1441 },
} as const;

export const radius = {
  sm: 8,
  card: 12,
  tile: 18,
  large: 28,
  pill: 980,
} as const;

/**
 * Floating-chrome shadow, measured from the Maps classic UI Kit "Medium Shadow".
 * Two stacked shadows, never a single hard elevation.
 */
export const floatShadow =
  "0 2px 4px rgba(0,0,0,0.10), 0 6px 12px rgba(0,0,0,0.10)";
