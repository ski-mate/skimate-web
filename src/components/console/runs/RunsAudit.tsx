"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  AuditEntry,
  IngestionRun,
  RunStatus,
  StageKey,
} from "@/lib/ingestion-api";
import {
  EmptyState,
  formatInstant,
  GateChip,
  relativeTime,
  SourceChip,
} from "@/components/console/ui/primitives";

const STATUS_TONE: Record<RunStatus, string> = {
  succeeded: "bg-[var(--c-pass-bg)] text-[var(--c-pass)]",
  failed: "bg-[var(--c-blocked-bg)] text-[var(--c-blocked)]",
  running: "bg-[var(--c-ready-bg)] text-[var(--c-ready)]",
  queued: "bg-[var(--fill)] text-[var(--label-2)]",
  cancelled: "bg-[var(--fill)] text-[var(--label-3)]",
};

const STAGES: StageKey[] = ["identity", "harvest", "membership", "enrichment", "publish"];

function duration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

/**
 * `ingestion_runs`, rendered.
 *
 * Everything the spec calls for a run to record is on screen: the stages that
 * executed, the dataset release each provider read, durations, cost, gate
 * outcomes, approvals and waivers. The audit tab is the same history from the
 * other direction — by decision rather than by run — because "who waived that
 * gate and why" is a question you ask without knowing which run it happened in.
 */
export function RunsAudit({
  runs,
  audit,
  scopeName,
}: {
  runs: IngestionRun[];
  audit: AuditEntry[];
  /** Set when scoped to one registry entry, which hides the entry column. */
  scopeName?: string;
}) {
  const [tab, setTab] = useState<"runs" | "audit">("runs");
  const [status, setStatus] = useState<RunStatus | "all">("all");
  const [stage, setStage] = useState<StageKey | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return runs.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (stage !== "all" && !r.stages.some((s) => s.stage === stage && s.status !== "skipped"))
        return false;
      if (q && !r.registryName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [runs, status, stage, query]);

  const filteredAudit = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return audit;
    return audit.filter(
      (a) =>
        a.target.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        a.actor.toLowerCase().includes(q)
    );
  }, [audit, query]);

  const totalCost = filtered.reduce((n, r) => n + r.costUsd, 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-[var(--separator)] bg-[var(--bg)] px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="text-[15px] font-semibold">
              {scopeName ? `${scopeName} — history` : "Runs & audit"}
            </h1>
            <p className="mt-0.5 text-[12px] text-[var(--label-3)]">
              {filtered.length} run{filtered.length === 1 ? "" : "s"} · $
              {totalCost.toFixed(2)} spent · {filteredAudit.length} audit entries
            </p>
          </div>
          <div className="inline-flex rounded-sm border border-[var(--separator)] p-0.5 text-[12px]">
            {(
              [
                ["runs", `Runs (${filtered.length})`],
                ["audit", `Audit (${filteredAudit.length})`],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={tab === k}
                onClick={() => setTab(k)}
                className={cn(
                  "rounded-[4px] px-2.5 py-1",
                  tab === k ? "bg-[var(--fill-strong)] font-medium" : "text-[var(--label-3)]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--separator)] bg-[var(--bg)] px-3 py-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === "runs" ? "Search by entry…" : "Search actor, action, target…"}
          aria-label="Search"
          className="h-7 w-[240px] rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-2 text-[12px] outline-none focus:border-[var(--link)]"
        />
        {tab === "runs" && (
          <>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RunStatus | "all")}
              aria-label="Filter by status"
              className="h-7 rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-1.5 text-[12px]"
            >
              <option value="all">All statuses</option>
              {(["succeeded", "failed", "running", "queued", "cancelled"] as RunStatus[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as StageKey | "all")}
              aria-label="Filter by stage"
              className="h-7 rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-1.5 text-[12px]"
            >
              <option value="all">Any stage</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  ran {s}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="scroll-y min-h-0 flex-1">
        {tab === "runs" ? (
          filtered.length === 0 ? (
            <EmptyState title="No runs match" detail="Widen the filters." />
          ) : (
            <ul>
              {filtered.map((r) => (
                <RunRow key={r.id} run={r} showEntry={!scopeName} />
              ))}
            </ul>
          )
        ) : filteredAudit.length === 0 ? (
          <EmptyState
            title="No audit entries yet"
            detail="Merges, waivers, spend approvals and publishes are recorded here as you make them."
          />
        ) : (
          <AuditTable rows={filteredAudit} showEntry={!scopeName} />
        )}
      </div>
    </div>
  );
}

function RunRow({ run, showEntry }: { run: IngestionRun; showEntry: boolean }) {
  const [open, setOpen] = useState(false);
  const ran = run.stages.filter((s) => s.status !== "skipped");

  return (
    <li className="border-b border-[var(--separator)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--fill)]"
      >
        <span
          className={cn(
            "inline-flex h-[19px] w-[74px] shrink-0 items-center justify-center rounded-sm text-[10px] font-medium",
            STATUS_TONE[run.status]
          )}
        >
          {run.status}
        </span>

        {showEntry && (
          <span className="w-[190px] shrink-0 truncate text-[12px] font-medium">
            {run.registryName}
          </span>
        )}

        {/* Stage strip: which of the five stages this run actually executed. */}
        <span className="flex shrink-0 items-center gap-0.5">
          {STAGES.map((s) => {
            const st = run.stages.find((x) => x.stage === s);
            const done = st && st.status !== "skipped";
            return (
              <span
                key={s}
                title={`${s}: ${st?.status ?? "skipped"}`}
                className={cn(
                  "h-[6px] w-[22px] rounded-pill",
                  done
                    ? st?.status === "failed"
                      ? "bg-[var(--c-blocked)]"
                      : "bg-[var(--c-pass)]"
                    : "bg-[var(--fill-strong)]"
                )}
              />
            );
          })}
        </span>

        <span className="truncate text-[11px] text-[var(--label-3)]">
          {ran.length} stage{ran.length === 1 ? "" : "s"} · {run.trigger} by {run.triggeredBy}
        </span>

        <span className="tabular ml-auto shrink-0 text-[11px] text-[var(--label-3)]">
          {duration(run.durationMs)}
        </span>
        <span className="tabular w-[54px] shrink-0 text-right text-[11px]">
          {run.costUsd > 0 ? `$${run.costUsd.toFixed(2)}` : "—"}
        </span>
        <span
          className="tabular w-[80px] shrink-0 text-right text-[11px] text-[var(--label-3)]"
          title={formatInstant(run.startedAt)}
        >
          {relativeTime(run.startedAt)}
        </span>
      </button>

      {open && (
        <div className="grid gap-4 border-t border-[var(--separator)] bg-[var(--bg-inset)] px-3 py-2.5 lg:grid-cols-3">
          <div>
            <h3 className="mb-1 text-[11px] font-semibold text-[var(--label-2)]">Stages</h3>
            <ul className="space-y-1">
              {run.stages.map((s) => (
                <li key={s.stage} className="text-[11px]">
                  <span className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "capitalize",
                        s.status === "skipped" ? "text-[var(--label-4)]" : "text-[var(--label)]"
                      )}
                    >
                      {s.stage}
                    </span>
                    <span className="tabular shrink-0 text-[var(--label-3)]">
                      {duration(s.durationMs)}
                    </span>
                  </span>
                  <span className="block leading-snug text-[var(--label-3)]">{s.summary}</span>
                  {s.error && <span className="block text-[var(--c-blocked)]">{s.error}</span>}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-1 text-[11px] font-semibold text-[var(--label-2)]">
              Providers & dataset releases
            </h3>
            <ul className="space-y-1">
              {run.providers.map((p) => (
                <li key={p.provider} className="flex items-baseline gap-1.5 text-[11px]">
                  <SourceChip source={p.provider} />
                  <span className="tabular text-[var(--label-3)]">
                    {p.calls.toLocaleString()} call{p.calls === 1 ? "" : "s"}
                  </span>
                  {p.costUsd > 0 && (
                    <span className="tabular font-medium">${p.costUsd.toFixed(2)}</span>
                  )}
                  {p.release && (
                    <span
                      className="truncate text-[10px] text-[var(--label-4)]"
                      title="The dataset release this run read. Overture hosts only the last two, so a run without one is unreproducible."
                    >
                      {p.release}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-1 text-[11px] font-semibold text-[var(--label-2)]">
              Gates, approvals & waivers
            </h3>
            <ul className="space-y-1">
              {run.gateOutcomes.map((g) => (
                <li key={g.key} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="capitalize text-[var(--label-3)]">
                    {g.key.replace(/_/g, " ")}
                  </span>
                  <GateChip status={g.status} />
                </li>
              ))}
            </ul>
            {run.approvals.map((a) => (
              <p key={a.approvedAt} className="mt-1.5 text-[10px] text-[var(--c-warn)]">
                ${a.approvedCostUsd.toFixed(2)} approved by {a.approvedBy}, ceiling $
                {a.ceilingUsd.toFixed(2)} — {formatInstant(a.approvedAt)}
              </p>
            ))}
            {run.waivers.map((w, i) => (
              <p key={i} className="mt-1 text-[10px] text-[var(--c-waived)]">
                {w.scope} {w.key} waived by {w.actor}: {w.reason}
              </p>
            ))}
            {run.approvals.length === 0 && run.waivers.length === 0 && (
              <p className="mt-1.5 text-[10px] text-[var(--label-4)]">
                No approvals or waivers on this run.
              </p>
            )}
          </div>

          <p className="tabular text-[10px] text-[var(--label-4)] lg:col-span-3">
            run {run.id} · started {formatInstant(run.startedAt)}
            {run.finishedAt && ` · finished ${formatInstant(run.finishedAt)}`}
          </p>
        </div>
      )}
    </li>
  );
}

function AuditTable({ rows, showEntry }: { rows: AuditEntry[]; showEntry: boolean }) {
  return (
    <table className="w-full text-[11px]">
      <thead className="sticky top-0 bg-[var(--bg-inset)] text-[10px] text-[var(--label-3)]">
        <tr>
          <th className="w-[128px] px-3 py-1.5 text-left font-medium">When</th>
          <th className="w-[150px] px-2 py-1.5 text-left font-medium">Actor</th>
          <th className="w-[150px] px-2 py-1.5 text-left font-medium">Action</th>
          {showEntry && <th className="w-[150px] px-2 py-1.5 text-left font-medium">Target</th>}
          <th className="px-2 py-1.5 text-left font-medium">Detail</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((a) => (
          <tr key={a.id} className="border-b border-[var(--separator)] align-top">
            <td className="tabular px-3 py-1.5 text-[var(--label-3)]" title={formatInstant(a.at)}>
              {relativeTime(a.at)}
            </td>
            <td className="truncate px-2 py-1.5">{a.actor}</td>
            <td className="px-2 py-1.5">
              <code className="rounded-sm bg-[var(--fill)] px-1 text-[10px]">{a.action}</code>
            </td>
            {showEntry && <td className="truncate px-2 py-1.5">{a.target}</td>}
            <td className="px-2 py-1.5 text-[var(--label-2)]">
              {a.detail}
              {a.reason && (
                <span className="block text-[10px] text-[var(--label-3)]">Reason: {a.reason}</span>
              )}
              {a.registryId && (
                <Link
                  href={`/console/resorts/${a.registryId}/history`}
                  className="mt-0.5 block text-[10px] text-[var(--link)] hover:underline"
                >
                  Open entry history
                </Link>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
