import Link from "next/link";
import { redirect } from "next/navigation";
import { ConsoleNav, type NavItem } from "@/components/console/ConsoleNav";
import { getConsoleSession } from "@/lib/console/auth";
import { getIngestionApi, ingestionMode } from "@/lib/ingestion/client";
import { ProgressBar } from "@/components/console/ui/primitives";
import { signOut } from "../login/actions";

export const dynamic = "force-dynamic";

/**
 * The workstation shell.
 *
 * Counts are resolved here rather than inside each nav item so that the whole
 * sidebar reflects one consistent snapshot — a "3 blocked" badge that
 * disagrees with the worklist underneath it would be worse than no badge.
 */
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getConsoleSession();
  if (!session) redirect("/console/login");

  const api = getIngestionApi();
  const { summary, rows } = await api.getWorklist({ limit: 500 });
  const runs = await api.listRuns({ limit: 200 });

  const blocked = rows.filter((r) => r.nextAction.priority === "blocked").length;
  const ready = rows.filter((r) => r.nextAction.priority === "ready").length;

  const items: NavItem[] = [
    {
      href: "/console",
      label: "Atlas worklist",
      count: { value: blocked, tone: "blocked" },
      match: ["/console", "/console/resorts"],
      hint: `${blocked} entries blocked, ${ready} ready to work`,
    },
    {
      href: "/console/onboarding",
      label: "Onboarding",
      count: {
        value: rows.filter((r) => r.stage === "not_started").length,
        tone: "neutral",
      },
      hint: "Stage 0 — mint registry entries and declare a group",
    },
    {
      href: "/console/runs",
      label: "Runs & audit",
      count: { value: runs.total, tone: "neutral" },
      hint: "Every pipeline run, cost, gate outcome, approval and waiver",
    },
    {
      href: "/console/guides",
      label: "Guides",
      disabled: true,
      hint: "Stage 4 — editorial guides. Out of scope for v1.",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <a
        href="#console-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-[var(--bg)] focus:px-3 focus:py-1.5 focus:text-[12px]"
      >
        Skip to content
      </a>
      <aside className="sticky top-0 flex h-screen w-[var(--c-rail)] shrink-0 flex-col border-r border-[var(--separator)] bg-[var(--bg)]">
        <div className="flex h-[var(--c-header-h)] shrink-0 items-center gap-2 border-b border-[var(--separator)] px-3">
          <span className="text-[13px] font-semibold">Alpline</span>
          <span className="text-[13px] text-[var(--label-3)]">Ingestion</span>
        </div>

        <ConsoleNav items={items} />

        <div className="mt-auto space-y-3 border-t border-[var(--separator)] p-3">
          <div>
            <div className="mb-1 flex items-baseline justify-between text-[11px]">
              <span className="text-[var(--label-3)]">Published</span>
              <span className="tabular font-medium">
                {summary.published}/{summary.total}
              </span>
            </div>
            <ProgressBar value={summary.published} total={summary.total} />
          </div>

          <dl className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <dt className="text-[var(--label-3)]">Gates failing</dt>
              <dd className="tabular font-medium text-[var(--c-blocked)]">{summary.gatesFailing}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--label-3)]">Awaiting spend</dt>
              <dd className="tabular font-medium">{summary.awaitingSpendApproval}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--label-3)]">Spend to date</dt>
              <dd className="tabular font-medium">${summary.costToDateUsd.toFixed(2)}</dd>
            </div>
          </dl>

          <div className="space-y-1 border-t border-[var(--separator)] pt-2 text-[11px] text-[var(--label-3)]">
            <p className="truncate" title={session.actor.email}>
              {session.actor.email}
            </p>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-[17px] items-center rounded-sm px-1 text-[10px] font-medium"
                style={{
                  background: ingestionMode() === "mock" ? "var(--c-warn-bg)" : "var(--c-pass-bg)",
                  color: ingestionMode() === "mock" ? "var(--c-warn)" : "var(--c-pass)",
                }}
                title={
                  ingestionMode() === "mock"
                    ? "Reading fixtures. Nothing here reaches the backend."
                    : "Reading alpline-backend /ingestion/*"
                }
              >
                {ingestionMode() === "mock" ? "mock data" : "live backend"}
              </span>
              {session.mode === "supabase" ? (
                <form action={signOut}>
                  <button type="submit" className="text-[11px] underline hover:text-[var(--label-2)]">
                    Sign out
                  </button>
                </form>
              ) : (
                <span
                  className="inline-flex h-[17px] items-center rounded-sm bg-[var(--c-blocked-bg)] px-1 text-[10px] font-medium text-[var(--c-blocked)]"
                  title="Supabase is not configured, so this development session is unauthenticated."
                >
                  no auth
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {session.mode === "open-dev" && (
          <p className="shrink-0 bg-[var(--c-blocked-bg)] px-4 py-1.5 text-[11px] text-[var(--c-blocked)]">
            Unauthenticated development session — Supabase is not configured, so anyone who can
            reach this port has full console access. Set <code>SUPABASE_URL</code>,{" "}
            <code>SUPABASE_PUBLISHABLE_KEY</code> and <code>CONSOLE_ALLOWED_EMAILS</code> before
            exposing it.{" "}
            <Link href="/console/runs" className="underline">
              Audit log
            </Link>
          </p>
        )}
        <main id="console-main" className="min-h-0 min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
