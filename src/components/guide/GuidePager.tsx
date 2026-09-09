import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import type { GuideArticle } from "@/content/guide/types";

/** Previous | Next, crossing section boundaries so the guide reads as one document. */
export function GuidePager({
  prev,
  next,
}: {
  prev?: GuideArticle;
  next?: GuideArticle;
}) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Guide pagination"
      className="mt-14 flex justify-between gap-6 border-t border-[var(--separator)] pt-6"
    >
      <div className="flex-1">
        {prev ? (
          <Link
            href={`/guide/${prev.section}/${prev.slug}`}
            className="group inline-flex items-start gap-2 text-[var(--link)]"
          >
            <ChevronRight className="mt-1 h-3 w-3 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            <span>
              <span className="type-caption block text-[var(--label-3)]">Previous</span>
              <span className="type-callout">{prev.navTitle ?? prev.title}</span>
            </span>
          </Link>
        ) : null}
      </div>

      <div className="flex-1 text-right">
        {next ? (
          <Link
            href={`/guide/${next.section}/${next.slug}`}
            className="group inline-flex items-start gap-2 text-[var(--link)]"
          >
            <span>
              <span className="type-caption block text-[var(--label-3)]">Next</span>
              <span className="type-callout">{next.navTitle ?? next.title}</span>
            </span>
            <ChevronRight className="mt-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
