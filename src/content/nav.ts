/** Site navigation. The single source for the global nav and the footer. */

export interface NavLink {
  href: string;
  label: string;
}

/**
 * Six items, matching apple.com's density without inheriting its breadth —
 * Alpline has no need for a store, an account, or a bag.
 */
export const primaryNav: NavLink[] = [
  { href: "/features/navigation", label: "Navigation" },
  { href: "/features/tracking", label: "Tracking" },
  { href: "/features/social", label: "Social" },
  { href: "/resorts", label: "Resorts" },
  { href: "/guide", label: "Guide" },
  { href: "/pricing", label: "Pricing" },
];

export const footerColumns: { heading: string; links: NavLink[] }[] = [
  {
    heading: "Features",
    links: [
      { href: "/features/navigation", label: "Navigation" },
      { href: "/features/tracking", label: "Tracking" },
      { href: "/features/safety", label: "Safety" },
      { href: "/features/social", label: "Social" },
    ],
  },
  {
    heading: "Mountain",
    links: [
      { href: "/resorts", label: "Resorts" },
      { href: "/features/conditions", label: "Conditions" },
      { href: "/map", label: "Explore the map" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/guide", label: "Alpline Guide" },
      { href: "/pricing", label: "Pricing" },
      { href: "mailto:support@getalpline.com", label: "Contact us" },
    ],
  },
  {
    heading: "About",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];
