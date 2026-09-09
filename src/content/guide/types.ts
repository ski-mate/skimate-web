import type { ReactNode } from "react";

/** Inline text with optional links and emphasis. */
export type RichSpan =
  | string
  | { text: string; href?: string; em?: true; strong?: true; code?: true };
export type RichText = RichSpan[];

export interface FigureCallout {
  n: number;
  label: string;
  /** Percent of the figure's width/height, so callouts survive scaling. */
  x: number;
  y: number;
}

export interface Figure {
  src: string;
  /** Required and non-empty — enforced by assertManifestIntegrity. */
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
  device?: "iphone";
  callouts?: FigureCallout[];
  caption?: string;
}

/** A reference into the article's own `figures` map. */
export type FigureRef = string;

export type GuideBlock =
  | { kind: "p"; text: RichText }
  | { kind: "note"; text: RichText }
  | { kind: "tip"; text: RichText }
  | { kind: "warning"; text: RichText }
  | { kind: "steps"; items: RichText[] }
  | { kind: "bullets"; items: RichText[] }
  | { kind: "heading"; text: string; id: string }
  | { kind: "figure"; figure: FigureRef }
  | { kind: "table"; head: string[]; rows: string[][] };

export type SectionId =
  | "navigation"
  | "tracking"
  | "safety"
  | "social"
  | "resorts"
  | "conditions"
  | "integrations"
  | "advanced";

/**
 * `published` articles get a route, a sitemap entry and a place in the pager.
 * `planned` ones do not — they appear only as a muted row in the section index.
 *
 * Nothing may be published unless it is backed by shipping code. See
 * alpline-admin/FEATURES-ACCESS-AND-MONETIZATION.md section 5.
 */
export type ArticleStatus = "published" | "planned";

export interface GuideArticle {
  slug: string;
  section: SectionId;
  /** 60 chars or fewer, verb-first: "Plan a route in Alpline". */
  title: string;
  /** Short form for the sidebar and pager, when the title is long. */
  navTitle?: string;
  /** 150-160 chars. Becomes the meta description. */
  description: string;
  intro: RichText;
  blocks: GuideBlock[];
  figures?: Record<string, Figure>;
  seeAlso?: string[];
  /** SRS traceability, e.g. ["REQ-4.1.3.1"]. */
  srsRefs?: string[];
  status: ArticleStatus;
  /** ISO date; drives sitemap lastModified. */
  updated: string;
}

export interface GuideSection {
  id: SectionId;
  title: string;
  description: string;
  /** SRS section number this mirrors, e.g. "4.1". */
  srs: string;
  articles: GuideArticle[];
}

export type { ReactNode };
