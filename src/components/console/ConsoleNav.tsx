"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavCount {
  value: number;
  tone: "blocked" | "ready" | "neutral";
}

export interface NavItem {
  href: string;
  label: string;
  /** Matched as a prefix, so a resort sub-screen keeps Worklist highlighted. */
  match?: string[];
  count?: NavCount | null;
  hint?: string;
  disabled?: boolean;
}

/**
 * Every nav item carries a count, per the queue-first rule: the analyst should
 * be able to tell what needs them without opening anything.
 */
export function ConsoleNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Console" className="space-y-0.5 p-2">
      {items.map((item) => {
        const patterns = item.match ?? [item.href];
        const active = patterns.some((p) =>
          p === "/console" ? pathname === "/console" : pathname.startsWith(p)
        );

        const body = (
          <>
            <span className="truncate">{item.label}</span>
            {item.count && item.count.value > 0 && (
              <span
                className={cn(
                  "tabular ml-auto inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-sm px-1 text-[11px] font-semibold",
                  item.count.tone === "blocked" && "bg-[var(--c-blocked-bg)] text-[var(--c-blocked)]",
                  item.count.tone === "ready" && "bg-[var(--c-ready-bg)] text-[var(--c-ready)]",
                  item.count.tone === "neutral" && "bg-[var(--fill)] text-[var(--label-2)]"
                )}
              >
                {item.count.value}
              </span>
            )}
          </>
        );

        if (item.disabled) {
          return (
            <span
              key={item.href}
              title={item.hint}
              aria-disabled="true"
              className="flex h-8 cursor-default items-center gap-2 rounded-sm px-2 text-[13px] text-[var(--label-4)]"
            >
              {body}
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.hint}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-8 items-center gap-2 rounded-sm px-2 text-[13px] transition-colors",
              active
                ? "bg-[var(--fill-strong)] font-medium text-[var(--label)]"
                : "text-[var(--label-2)] hover:bg-[var(--fill)]"
            )}
          >
            {body}
          </Link>
        );
      })}
    </nav>
  );
}
