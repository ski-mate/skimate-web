import type { GuideBlock } from "@/content/guide/types";

/**
 * One chapter of the analyst manual.
 *
 * Chapters are not the marketing guide's `GuideArticle`: they carry no SEO
 * description, no figures, no seeAlso and no published/planned state, because
 * none of that applies to an internal runbook that ships whole or not at all.
 * They share the block vocabulary so both render through `GuideBlocks` and
 * cannot drift apart visually.
 */
export interface ManualChapter {
  /** Chapter number as printed. Contiguous from 0; asserted by the generator. */
  number: number;
  /** `chapter-7-routing-coverage-screen-8` — number first so the URL sorts. */
  slug: string;
  title: string;
  /** The full heading as written, e.g. "Chapter 7 — Routing coverage (screen 8)". */
  heading: string;
  blocks: GuideBlock[];
}
