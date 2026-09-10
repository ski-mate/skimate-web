"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface ResortTab {
  href: string;
  label: string;
  /** Rendered as a coloured count; blocking work is red. */
  count?: number;
  tone?: "blocked" | "warn" | "ready";
}

export function ResortTabs({ tabs }: { tabs: ResortTab[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Pipeline stage" className="flex items-center gap-0.5">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-sm px-2.5 text-[12px] transition-colors",
              active
                ? "bg-[var(--fill-strong)] font-medium text-[var(--label)]"
                : "text-[var(--label-2)] hover:bg-[var(--fill)]"
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span
                className={cn(
                  "tabular inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-sm px-0.5 text-[10px] font-semibold",
                  t.tone === "blocked" && "bg-[var(--c-blocked-bg)] text-[var(--c-blocked)]",
                  t.tone === "warn" && "bg-[var(--c-warn-bg)] text-[var(--c-warn)]",
                  (t.tone === "ready" || !t.tone) && "bg-[var(--c-ready-bg)] text-[var(--c-ready)]"
                )}
              >
                {t.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
