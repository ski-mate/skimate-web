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
  /** Overrides the contents sidebar. The console manual supplies its own. */
  toc,
  home = { href: "/guide", label: "Alpline Guide" },
  banner,
}: {
  activeSlug?: string;
  children: ReactNode;
  toc?: ReactNode;
  home?: { href: string; label: string };
  banner?: ReactNode;
}) {
  const contents = toc ?? <GuideToc activeSlug={activeSlug} />;
  return (
    <div data-scheme="auto">
      {banner}
      <div className="border-b border-[var(--separator)]">
        <div className="container-wide py-3">
          <Link href={home.href} className="type-callout font-semibold">
            {home.label}
          </Link>
        </div>
      </div>

      <div className="container-wide flex gap-12 py-10">
        <aside className="hidden w-[240px] shrink-0 lg:block">
          <div className="sticky top-[calc(var(--nav-h)+2rem)] max-h-[calc(100vh-var(--nav-h)-4rem)] overflow-y-auto pb-8">
            {contents}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <details className="mb-8 lg:hidden">
            <summary className="type-callout cursor-pointer font-semibold text-[var(--link)]">
              Table of Contents
            </summary>
            <div className="mt-4">{contents}</div>
          </details>

          <div className="max-w-guide">{children}</div>
        </div>
      </div>
    </div>
  );
}
