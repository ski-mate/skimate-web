import type { SVGProps } from "react";

/**
 * Hand-rolled icon set. Deliberately not lucide: generic 2px-stroke icon sets
 * are a large part of what made the previous design read as a template.
 * Geometry follows SF Symbols proportions — see
 * alpline-admin/apple-ui-brain/00-foundations/iconography.md
 */

type IconProps = SVGProps<SVGSVGElement>;

export function ChevronRight(props: IconProps) {
  return (
    <svg viewBox="0 0 8 14" fill="none" aria-hidden="true" {...props}>
      <path
        d="M1 1l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <svg viewBox="0 0 14 8" fill="none" aria-hidden="true" {...props}>
      <path
        d="M1 1l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Close(props: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" {...props}>
      <path
        d="M1 1l12 12M13 1L1 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Menu(props: IconProps) {
  return (
    <svg viewBox="0 0 18 12" fill="none" aria-hidden="true" {...props}>
      <path
        d="M0 1h18M0 11h18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Search(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M11 11l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The Alpline mark: a stylised peak, matching the app icon silhouette. */
export function AlplineMark(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 2.5L17.5 17.5H2.5L10 2.5z"
        fill="currentColor"
        fillOpacity="0.28"
      />
      <path
        d="M10 2.5l4.2 8.4-2.1-.7-2.1 2.1-2.1-3.1-1.9 1.3L10 2.5z"
        fill="currentColor"
      />
      <path
        d="M10 2.5L17.5 17.5H2.5L10 2.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
