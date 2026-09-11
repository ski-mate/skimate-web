import type { Figure, GuideBlock } from "@/content/guide/types";
import { manualChapters } from "./chapters";
import { chapterFigures } from "./figures";
import type { ManualChapter } from "./types";

export { manualChapters };
export type { ManualChapter };

export const MANUAL_BASE = "/guide/console";

export function getChapter(slug: string): ManualChapter | undefined {
  return manualChapters.find((c) => c.slug === slug);
}

/**
 * Previous/next across the whole manual. Chapters are read in order — it is a
 * runbook, not a reference — so the pager never skips.
 */
export function getChapterNeighbours(slug: string): {
  prev: ManualChapter | null;
  next: ManualChapter | null;
} {
  const i = manualChapters.findIndex((c) => c.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: manualChapters[i - 1] ?? null,
    next: manualChapters[i + 1] ?? null,
  };
}

/**
 * One line for the index. The first paragraph, or the first bullet when a
 * chapter has no prose at all — chapter 12 is nothing but its creed, and an
 * index row with a blank subtitle reads as a missing chapter.
 */
export function chapterSummary(chapter: ManualChapter): string {
  const first = chapter.blocks.find((b) => b.kind === "p" || b.kind === "bullets");
  if (!first) return "";
  const spans =
    first.kind === "p" ? first.text : first.kind === "bullets" ? first.items[0] : null;
  if (!spans) return "";
  const text = spans
    .map((s) => (typeof s === "string" ? s : s.text))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  const cut = text.slice(0, 165);
  return text.length > 165 ? `${cut.slice(0, cut.lastIndexOf(" "))}…` : text;
}

/**
 * Splices the chapter's screenshot into its blocks.
 *
 * It goes immediately above the first runbook, which is where it does the most
 * work: you see the screen, then the numbered steps that drive it. A chapter
 * with no runbook gets the figure after its opening prose instead, and one
 * with no screenshot is returned untouched.
 */
export function withFigure(chapter: ManualChapter): {
  blocks: GuideBlock[];
  figures: Record<string, Figure>;
} {
  const figure = chapterFigures[chapter.slug];
  if (!figure) return { blocks: chapter.blocks, figures: {} };

  const firstSteps = chapter.blocks.findIndex((b) => b.kind === "steps");
  const at =
    firstSteps >= 0
      ? firstSteps
      : Math.min(chapter.blocks.filter((b) => b.kind === "p").length, chapter.blocks.length);

  const blocks = [...chapter.blocks];
  blocks.splice(at, 0, { kind: "figure", figure: "screen" });
  return { blocks, figures: { screen: figure } };
}

/** Chapters with a screenshot, for the index to mark. */
export function hasFigure(slug: string): boolean {
  return slug in chapterFigures;
}
