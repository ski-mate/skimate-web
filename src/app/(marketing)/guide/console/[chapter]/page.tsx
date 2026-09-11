import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GuideBlocks } from "@/components/guide/GuideBlocks";
import { GuideShell } from "@/components/guide/GuideShell";
import { ManualToc } from "@/components/guide/ManualToc";
import {
  MANUAL_BASE,
  chapterSummary,
  getChapter,
  getChapterNeighbours,
  withFigure,
} from "@/content/console-manual";

export function generateMetadata({
  params,
}: {
  params: { chapter: string };
}): Metadata {
  const chapter = getChapter(params.chapter);
  if (!chapter) return {};
  return { title: `${chapter.number}. ${chapter.title}`, description: chapterSummary(chapter) };
}

export default function ManualChapterPage({ params }: { params: { chapter: string } }) {
  const chapter = getChapter(params.chapter);
  if (!chapter) notFound();

  const { prev, next } = getChapterNeighbours(chapter.slug);
  const { blocks, figures } = withFigure(chapter);

  return (
    <GuideShell
      activeSlug={chapter.slug}
      toc={<ManualToc activeSlug={chapter.slug} />}
      home={{ href: MANUAL_BASE, label: "Alpline Analyst Manual" }}
    >
      <article>
        <nav aria-label="Breadcrumb" className="type-caption mb-3 text-[var(--label-3)]">
          <Link href={MANUAL_BASE} className="hover:underline underline-offset-[3px]">
            Analyst Manual
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Chapter {chapter.number}</span>
        </nav>

        <p className="type-caption mb-1 font-semibold text-[var(--label-3)]">
          Chapter {chapter.number}
        </p>
        <h1 className="type-display-3 mb-6">{chapter.title}</h1>

        <GuideBlocks blocks={blocks} figures={figures} />
      </article>

      {/* Same prev/next affordance as the public guide; the manual is read in
          order, so the pager never skips a chapter. */}
      <nav
        aria-label="Chapter navigation"
        className="mt-12 flex gap-4 border-t border-[var(--separator)] pt-6"
      >
        {prev ? (
          <Link href={`${MANUAL_BASE}/${prev.slug}`} className="type-callout flex-1">
            <span className="block text-[var(--label-3)]">Previous</span>
            <span className="text-[var(--link)]">
              {prev.number}. {prev.title}
            </span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next && (
          <Link href={`${MANUAL_BASE}/${next.slug}`} className="type-callout flex-1 text-right">
            <span className="block text-[var(--label-3)]">Next</span>
            <span className="text-[var(--link)]">
              {next.number}. {next.title}
            </span>
          </Link>
        )}
      </nav>
    </GuideShell>
  );
}
