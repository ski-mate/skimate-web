import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Graph } from "schema-dts";
import { Breadcrumbs } from "@/components/guide/Breadcrumbs";
import { GuideBlocks } from "@/components/guide/GuideBlocks";
import { GuidePager } from "@/components/guide/GuidePager";
import { GuideShell } from "@/components/guide/GuideShell";
import { SeeAlso } from "@/components/guide/SeeAlso";
import { JsonLd } from "@/components/marketing/JsonLd";
import {
  getArticle,
  getBreadcrumbs,
  getNeighbours,
  publishedArticles,
} from "@/content/guide";
import type { GuideArticle } from "@/content/guide/types";
import { RichTextView } from "@/components/guide/RichTextView";
import { SITE_URL, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return publishedArticles.map((a) => ({
    section: a.section,
    article: a.slug,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { section: string; article: string };
}): Metadata {
  const article = getArticle(params.section, params.article);
  if (!article) return {};
  return pageMetadata({
    title: article.title,
    description: article.description,
    path: `/guide/${article.section}/${article.slug}`,
  });
}

/** Flattens RichText to plain text for structured data. */
function plain(text: GuideArticle["intro"]): string {
  return text.map((s) => (typeof s === "string" ? s : s.text)).join("");
}

/**
 * HowTo is emitted mechanically from the article's own step blocks, so it can
 * never drift from what the page actually says. Articles with no steps get
 * only breadcrumbs.
 */
function articleGraph(article: GuideArticle): Graph {
  const url = `${SITE_URL}/guide/${article.section}/${article.slug}`;
  const stepBlocks = article.blocks.filter(
    (b): b is Extract<typeof b, { kind: "steps" }> => b.kind === "steps"
  );
  const steps = stepBlocks.flatMap((b) => b.items.map(plain));

  const breadcrumbs = {
    "@type": "BreadcrumbList" as const,
    itemListElement: getBreadcrumbs(article).map((c, i) => ({
      "@type": "ListItem" as const,
      position: i + 1,
      name: c.label,
      item: `${SITE_URL}${c.href}`,
    })),
  };

  const howTo =
    steps.length > 0
      ? [
          {
            "@type": "HowTo" as const,
            name: article.title,
            description: article.description,
            url,
            step: steps.map((text, i) => ({
              "@type": "HowToStep" as const,
              position: i + 1,
              text,
            })),
          },
        ]
      : [];

  return {
    "@context": "https://schema.org",
    "@graph": [breadcrumbs, ...howTo],
  };
}

export default function ArticlePage({
  params,
}: {
  params: { section: string; article: string };
}) {
  const article = getArticle(params.section, params.article);
  if (!article) notFound();

  const { prev, next } = getNeighbours(article.slug);

  return (
    <GuideShell activeSlug={article.slug}>
      <JsonLd graph={articleGraph(article)} />

      <article>
        <Breadcrumbs trail={getBreadcrumbs(article)} />
        <h1 className="type-display-3 mb-4">{article.title}</h1>
        <p className="type-body mb-2 text-[var(--label-2)]">
          <RichTextView text={article.intro} />
        </p>

        <GuideBlocks blocks={article.blocks} figures={article.figures} />
        <SeeAlso slugs={article.seeAlso} />
      </article>

      <GuidePager prev={prev} next={next} />
    </GuideShell>
  );
}
