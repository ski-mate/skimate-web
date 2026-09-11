import Link from "next/link";
import type { Metadata } from "next";
import { GuideShell } from "@/components/guide/GuideShell";
import { ManualToc } from "@/components/guide/ManualToc";
import {
  MANUAL_BASE,
  chapterSummary,
  manualChapters,
} from "@/content/console-manual";

export const metadata: Metadata = {
  title: "Analyst Manual",
  description: "Onboarding manual and day-to-day runbook for the GIS analyst role.",
};

/** The chapter list is the section index, per the manual's own instructions. */
export default function ManualIndexPage() {
  return (
    <GuideShell
      toc={<ManualToc />}
      home={{ href: MANUAL_BASE, label: "Alpline Analyst Manual" }}
    >
      <h1 className="type-display-3 mb-4">The Alpline Ingestion Console</h1>
      <p className="type-body mb-2 text-[var(--label-2)]">
        The onboarding manual and day-to-day runbook for the GIS analyst role. Written by the team
        that built the console API.
      </p>
      <p className="type-callout mb-10 text-[var(--label-3)]">
        {manualChapters.length} chapters. Read chapters 0 to 2 before touching anything; the rest
        are runbooks you can return to per screen.
      </p>

      <ol className="space-y-1">
        {manualChapters.map((c) => (
          <li key={c.slug}>
            <Link
              href={`${MANUAL_BASE}/${c.slug}`}
              className="group -mx-3 flex gap-4 rounded-card px-3 py-3 hover:bg-[var(--fill)]"
            >
              <span
                aria-hidden="true"
                className="type-callout mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-[var(--fill)] font-medium tabular-nums group-hover:bg-[var(--bg)]"
              >
                {c.number}
              </span>
              <span className="min-w-0">
                <span className="type-callout block font-semibold text-[var(--label)]">
                  {c.title}
                </span>
                <span className="type-caption mt-0.5 block text-[var(--label-3)]">
                  {chapterSummary(c)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </GuideShell>
  );
}
