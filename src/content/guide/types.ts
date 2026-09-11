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

/**
 * One numbered step. Plain `RichText` is the common case; the object form
 * carries sub-bullets, which the console analyst manual's runbooks use to hang
 * a list of invariants off a single numbered instruction. Keeping them inside
 * the step matters — the manual's numbering is followed literally, so a
 * sub-bullet promoted to its own block would renumber the runbook.
 */
export type StepItem = RichText | { text: RichText; sub?: RichText[] };

export function stepText(item: StepItem): RichText {
  return Array.isArray(item) ? item : item.text;
}

export function stepSub(item: StepItem): RichText[] {
  return Array.isArray(item) ? [] : (item.sub ?? []);
}

export type GuideBlock =
  | { kind: "p"; text: RichText }
  | { kind: "note"; text: RichText }
  | { kind: "tip"; text: RichText }
  | { kind: "warning"; text: RichText }
  | { kind: "steps"; items: StepItem[] }
  | { kind: "bullets"; items: RichText[] }
  | { kind: "heading"; text: string; id: string }
  | { kind: "figure"; figure: FigureRef }
  /** Preformatted. The manual uses one for its stage-pipeline diagram. */
  | { kind: "code"; text: string }
  /**
   * Cells are RichText, not strings: the analyst manual's verdict and gate
   * tables lean on bold and inline code to name the values being described,
   * and rendering a cell as a plain string printed the asterisks.
   */
  | { kind: "table"; head: RichText[]; rows: RichText[][] };

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
