import { guideSections } from "./manifest";
import type { GuideArticle, GuideSection, SectionId } from "./types";

export { guideSections };
export type { GuideArticle, GuideSection, SectionId };

/** Every published article, in manifest order. This is the pager's spine. */
export const publishedArticles: GuideArticle[] = guideSections.flatMap((s) =>
  s.articles.filter((a) => a.status === "published")
);

export function getSection(id: string): GuideSection | undefined {
  return guideSections.find((s) => s.id === id);
}

export function getArticle(
  section: string,
  slug: string
): GuideArticle | undefined {
  return getSection(section)?.articles.find(
    (a) => a.slug === slug && a.status === "published"
  );
}

export function findPublished(slug: string): GuideArticle | undefined {
  return publishedArticles.find((a) => a.slug === slug);
}

/** Prev/next crosses section boundaries, so the guide reads as one document. */
export function getNeighbours(slug: string): {
  prev?: GuideArticle;
  next?: GuideArticle;
} {
  const i = publishedArticles.findIndex((a) => a.slug === slug);
  if (i === -1) return {};
  return {
    prev: i > 0 ? publishedArticles[i - 1] : undefined,
    next: i < publishedArticles.length - 1 ? publishedArticles[i + 1] : undefined,
  };
}

export function getBreadcrumbs(article: GuideArticle) {
  const section = getSection(article.section);
  return [
    { href: "/guide", label: "Guide" },
    { href: `/guide/${article.section}`, label: section?.title ?? article.section },
    { href: `/guide/${article.section}/${article.slug}`, label: article.title },
  ];
}

/** In-page contents, derived from the article's own heading blocks. */
export function getArticleToc(article: GuideArticle) {
  return article.blocks
    .filter((b): b is Extract<typeof b, { kind: "heading" }> => b.kind === "heading")
    .map((b) => ({ id: b.id, text: b.text }));
}

/**
 * Fails the build rather than shipping a broken page.
 *
 * This is the whole argument for typed content modules over MDX: malformed
 * content becomes a red build, not a page nobody notices is wrong.
 */
export function assertManifestIntegrity(): void {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const section of guideSections) {
    for (const article of section.articles) {
      const id = `${section.id}/${article.slug}`;

      if (seen.has(id)) problems.push(`duplicate article: ${id}`);
      seen.add(id);

      if (article.section !== section.id) {
        problems.push(`${id}: section field is "${article.section}"`);
      }
      if (article.title.length > 60) {
        problems.push(`${id}: title is ${article.title.length} chars (max 60)`);
      }

      if (article.status !== "published") continue;

      const d = article.description.length;
      if (d < 150 || d > 160) {
        problems.push(`${id}: description is ${d} chars (need 150-160)`);
      }
      if (article.blocks.length === 0) {
        problems.push(`${id}: published with no blocks`);
      }

      const figures = article.figures ?? {};
      for (const [key, fig] of Object.entries(figures)) {
        if (!fig.alt.trim()) problems.push(`${id}: figure "${key}" has empty alt`);
      }
      for (const block of article.blocks) {
        if (block.kind === "figure" && !figures[block.figure]) {
          problems.push(`${id}: figure ref "${block.figure}" has no entry`);
        }
      }

      const headings = new Set<string>();
      for (const block of article.blocks) {
        if (block.kind !== "heading") continue;
        if (headings.has(block.id)) {
          problems.push(`${id}: duplicate heading id "${block.id}"`);
        }
        headings.add(block.id);
      }
    }
  }

  // seeAlso may only point at articles that actually resolve to a page.
  const publishedSlugs = new Set(publishedArticles.map((a) => a.slug));
  for (const article of publishedArticles) {
    for (const ref of article.seeAlso ?? []) {
      if (!publishedSlugs.has(ref)) {
        problems.push(
          `${article.section}/${article.slug}: seeAlso "${ref}" is not a published article`
        );
      }
      if (ref === article.slug) {
        problems.push(`${article.section}/${article.slug}: seeAlso points at itself`);
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Guide manifest is invalid:\n  - ${problems.join("\n  - ")}`
    );
  }
}

// Runs at module scope, so `next build` fails on bad content.
assertManifestIntegrity();
