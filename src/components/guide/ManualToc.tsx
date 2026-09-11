import Link from "next/link";
import { MANUAL_BASE, manualChapters } from "@/content/console-manual";
import { cn } from "@/lib/utils";

/**
 * Contents for the analyst manual. Flat and numbered rather than grouped by
 * section: the manual is a runbook read front to back, and its chapter numbers
 * are how analysts refer to it to each other.
 */
export function ManualToc({ activeSlug }: { activeSlug?: string }) {
  return (
    <nav aria-label="Manual contents" className="type-callout">
      <Link
        href={MANUAL_BASE}
        className="font-semibold text-[var(--label)] underline-offset-[3px] hover:underline"
      >
        Analyst Manual
      </Link>
      <ul className="mt-2 space-y-1.5 border-l border-[var(--separator)] pl-3">
        {manualChapters.map((c) => {
          const active = c.slug === activeSlug;
          return (
            <li key={c.slug}>
              <Link
                href={`${MANUAL_BASE}/${c.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex gap-2 hover:text-[var(--label)]",
                  active ? "font-medium text-[var(--link)]" : "text-[var(--label-2)]"
                )}
              >
                <span className="tabular-nums text-[var(--label-4)]">{c.number}</span>
                <span className="min-w-0">{c.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
