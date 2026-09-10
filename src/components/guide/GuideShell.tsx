import Link from "next/link";
import type { ReactNode } from "react";
import { GuideToc } from "./GuideToc";

/**
 * Guide chrome: a title bar, a contents sidebar and a narrow reading column.
 * The column is deliberately left-aligned rather than centred — documentation
 * reads better against a consistent left edge.
 */
export function GuideShell({
  activeSlug,
  children,
}: {
  activeSlug?: string;
  children: ReactNode;
}) {
  return (
    <div data-scheme="auto">
      <div className="border-b border-[var(--separator)]">
        <div className="container-wide py-3">
          <Link href="/guide" className="type-callout font-semibold">
            Alpline Guide
          </Link>
        </div>
      </div>

      <div className="container-wide flex gap-12 py-10">
        <aside className="hidden w-[240px] shrink-0 lg:block">
          <div className="sticky top-[calc(var(--nav-h)+2rem)] max-h-[calc(100vh-var(--nav-h)-4rem)] overflow-y-auto pb-8">
            <GuideToc activeSlug={activeSlug} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <details className="mb-8 lg:hidden">
            <summary className="type-callout cursor-pointer font-semibold text-[var(--link)]">
              Table of Contents
            </summary>
            <div className="mt-4">
              <GuideToc activeSlug={activeSlug} />
            </div>
          </details>

          <div className="max-w-guide">{children}</div>
        </div>
      </div>
    </div>
  );
}
