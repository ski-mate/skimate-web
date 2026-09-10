"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  EnrichmentEstimate,
  EnrichmentReport,
  UnmatchedVerdictsRequest,
} from "@/lib/ingestion-api";
import {
  EmptyState,
  formatInstant,
  Metric,
  Panel,
  ProgressBar,
} from "@/components/console/ui/primitives";
import { VirtualList } from "@/components/console/ui/VirtualList";
import {
  ShortcutOverlay,
  ShortcutStrip,
  useHotkeys,
  useQueueCursor,
  type Binding,
} from "@/components/console/useKeyboard";
import {
  approveEnrichmentSpend,
  submitUnmatchedVerdicts,
} from "@/app/(console)/console/(workspace)/actions";

const ROW_H = 44;

export function EnrichmentGate({
  estimate,
  report,
  registryId,
}: {
  estimate: EnrichmentEstimate;
  report: EnrichmentReport;
  registryId: string;
}) {
  const approved = report.approval;

  return (
    <div className="scroll-y h-full">
      <div className="mx-auto max-w-[1120px] space-y-3 p-4">
        <EstimateCard estimate={estimate} approved={Boolean(approved)} />

        {approved ? (
          <ApprovedBanner
            approvedBy={approved.approvedBy}
            approvedAt={approved.approvedAt}
            approvedCostUsd={approved.approvedCostUsd}
            ceilingUsd={approved.ceilingUsd}
            note={approved.note}
          />
        ) : (
          <ApprovalForm estimate={estimate} registryId={registryId} />
        )}

        {report.completedAt && <ReportCard report={report} registryId={registryId} />}
      </div>
    </div>
  );
}

/**
 * The estimate, shown as a reduction from "every POI we hold" down to "calls we
 * will actually be billed for". Each step names what removed the rows, because
 * approving a number you cannot decompose is not approving anything.
 */
function EstimateCard({
  estimate: e,
  approved,
}: {
  estimate: EnrichmentEstimate;
  approved: boolean;
}) {
  const steps = [
    {
      label: "POIs in scope",
      value: e.poiTotal,
      detail: e.scope === "group" ? "Across every member of the group" : "In this resort",
      tone: "neutral" as const,
    },
    {
      label: "Already covered free",
      value: -e.alreadyCoveredFree,
      detail: "OSM, Overture or Wikidata already carry what enrichment would buy",
      tone: "good" as const,
    },
    {
      label: "Below confidence threshold",
      value: -e.filteredLowConfidence,
      detail: "Not worth paying to enrich a row we are not sure exists",
      tone: "good" as const,
    },
    {
      label: "Deduped across the group",
      value: -e.dedupedAcrossGroup,
      detail:
        e.dedupedAcrossGroup > 0
          ? "Shared between members — paid once because enrichment keys on the place entity, not the resort row"
          : "Single resort, nothing shared",
      tone: "good" as const,
    },
    {
      label: "Billable POIs",
      value: e.billablePois,
      detail: `× ${e.callsPerPoi} calls each`,
      tone: "total" as const,
    },
  ];

  const chargeableCalls = Math.max(0, e.billableCalls - e.freeCallsRemaining);

  return (
    <section className="rounded-card border border-[var(--separator)] bg-[var(--bg)]">
      <header className="flex items-center justify-between border-b border-[var(--separator)] px-3 py-2">
        <h2 className="text-[12px] font-semibold">
          Foursquare dry run — {e.registryName}
          <span className="ml-1.5 rounded-sm bg-[var(--fill)] px-1 text-[10px] font-medium text-[var(--label-2)]">
            {e.scope}
          </span>
        </h2>
        <span className="text-[11px] text-[var(--label-3)]">
          Estimated {formatInstant(e.estimatedAt)}
        </span>
      </header>

      <div className="grid gap-4 p-3 lg:grid-cols-[1fr_300px]">
        <div>
          <ol className="space-y-1">
            {steps.map((s) => (
              <li
                key={s.label}
                className={cn(
                  "flex items-baseline gap-3 rounded-sm px-2 py-1.5",
                  s.tone === "total" && "bg-[var(--fill)] font-medium"
                )}
              >
                <span
                  className={cn(
                    "tabular w-[72px] shrink-0 text-right text-[13px]",
                    s.tone === "good" && "text-[var(--c-pass)]"
                  )}
                >
                  {s.value > 0 && s.tone === "good" ? "+" : ""}
                  {s.value.toLocaleString()}
                </span>
                <span className="min-w-0">
                  <span className="text-[12px]">{s.label}</span>
                  <span className="block text-[11px] leading-snug text-[var(--label-3)]">
                    {s.detail}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-2 space-y-1 border-t border-[var(--separator)] pt-2 text-[12px]">
            <Line label="Billable calls" value={e.billableCalls.toLocaleString()} />
            <Line
              label="Free calls remaining this month"
              value={`− ${e.freeCallsRemaining.toLocaleString()}`}
              tone="good"
              detail="Free monthly credits expire at month end; paid credits roll over 12 months."
            />
            <Line label="Chargeable calls" value={chargeableCalls.toLocaleString()} strong />
            <Line
              label={`Rate — ${e.tier}`}
              value={`$${e.tierRateUsdPerThousand.toFixed(2)} / 1,000`}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-sm bg-[var(--bg-inset)] p-3">
          <Metric
            label="Projected cost"
            value={`$${e.projectedCostUsd.toFixed(2)}`}
            tone={approved ? "pass" : "warn"}
          />
          <div>
            <div className="mb-1 flex items-baseline justify-between text-[11px]">
              <span className="text-[var(--label-3)]">Sampled match rate</span>
              <span className="tabular font-medium">{(e.sampledMatchRate * 100).toFixed(0)}%</span>
            </div>
            <ProgressBar
              value={e.sampledMatchRate * 100}
              total={100}
              tone={e.sampledMatchRate > 0.7 ? "var(--c-pass)" : "var(--c-warn)"}
            />
            <p className="mt-1 text-[10px] leading-snug text-[var(--label-4)]">
              Measured on {e.sampleSize} free-tier calls before committing the batch. At this rate
              roughly {Math.round(e.billablePois * (1 - e.sampledMatchRate))} POIs will come back
              unmatched and need review.
            </p>
          </div>
        </div>
      </div>

      <ul className="space-y-1 border-t border-[var(--separator)] px-3 py-2">
        {e.notes.map((n, i) => (
          <li key={i} className="text-[11px] leading-snug text-[var(--label-3)]">
            — {n}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Line({
  label,
  value,
  tone,
  strong,
  detail,
}: {
  label: string;
  value: string;
  tone?: "good";
  strong?: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={cn("text-[var(--label-2)]", strong && "font-medium text-[var(--label)]")}>
        {label}
        {detail && <span className="block text-[10px] text-[var(--label-4)]">{detail}</span>}
      </span>
      <span
        className={cn(
          "tabular shrink-0",
          tone === "good" && "text-[var(--c-pass)]",
          strong && "font-semibold"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * The gate itself. One explicit button, a mandatory ceiling, and no way to reach
 * a paid call without passing through here — that is the whole requirement.
 */
function ApprovalForm({
  estimate,
  registryId,
}: {
  estimate: EnrichmentEstimate;
  registryId: string;
}) {
  const [ceilingText, setCeilingText] = useState(() =>
    Math.max(1, Math.ceil(estimate.projectedCostUsd * 1.2 * 100) / 100).toFixed(2)
  );
  // Accept either decimal separator: a number input under a comma-decimal
  // locale hands back "8,06", and Number("8,06") is NaN — which would silently
  // approve a spend with no ceiling.
  const ceiling = Number(ceilingText.replace(",", "."));
  const ceilingValid = Number.isFinite(ceiling) && ceiling > 0;
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const under = ceilingValid && ceiling < estimate.projectedCostUsd;

  return (
    <section className="rounded-card border border-[var(--c-warn)]/40 bg-[var(--c-warn-bg)] p-3">
      <h2 className="text-[12px] font-semibold">Approve spend</h2>
      <p className="mt-0.5 max-w-[70ch] text-[11px] leading-snug text-[var(--label-2)]">
        Nothing is charged until this is approved, and the batch aborts rather than exceed the
        ceiling. The approval is recorded against your name in the run record.
      </p>

      <form
        className="mt-2 flex flex-wrap items-end gap-3"
        onSubmit={async (ev) => {
          ev.preventDefault();
          if (!confirmed || under || !ceilingValid) return;
          setBusy(true);
          setError(null);
          try {
            await approveEnrichmentSpend(estimate.runId, registryId, {
              approvedCostUsd: estimate.projectedCostUsd,
              ceilingUsd: ceiling,
              note,
            });
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not record the approval.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-[var(--label-2)]">
            Approving
          </span>
          <span className="tabular flex h-8 items-center rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-2 text-[13px] font-semibold">
            ${estimate.projectedCostUsd.toFixed(2)}
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-[var(--label-2)]">
            Hard ceiling (USD)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={ceilingText}
            onChange={(e) => setCeilingText(e.target.value)}
            aria-invalid={!ceilingValid}
            className="tabular h-8 w-[120px] rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-2 text-[13px] outline-none focus:border-[var(--link)] aria-[invalid=true]:border-[var(--c-blocked)]"
          />
        </label>

        <label className="block min-w-[240px] flex-1">
          <span className="mb-1 block text-[11px] font-medium text-[var(--label-2)]">
            Note (optional)
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why now, and against which budget"
            className="h-8 w-full rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-2 text-[12px] outline-none focus:border-[var(--link)]"
          />
        </label>

        <div className="flex w-full flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-[var(--label-2)]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="size-3.5"
            />
            I have read the breakdown above and authorise this spend.
          </label>
          <button
            type="submit"
            disabled={busy || !confirmed || under || !ceilingValid}
            className="h-8 rounded-sm bg-[var(--c-warn)] px-3 text-[12px] font-semibold text-black disabled:opacity-40"
          >
            {busy ? "Recording…" : `Approve $${estimate.projectedCostUsd.toFixed(2)}`}
          </button>
          {!ceilingValid && (
            <span className="text-[11px] text-[var(--c-blocked)]">
              Enter a ceiling above zero.
            </span>
          )}
          {under && (
            <span className="text-[11px] text-[var(--c-blocked)]">
              The ceiling is below the projected cost — the batch would abort immediately.
            </span>
          )}
          {error && <span className="text-[11px] text-[var(--c-blocked)]">{error}</span>}
        </div>
      </form>
    </section>
  );
}

function ApprovedBanner({
  approvedBy,
  approvedAt,
  approvedCostUsd,
  ceilingUsd,
  note,
}: {
  approvedBy: string;
  approvedAt: string;
  approvedCostUsd: number;
  ceilingUsd: number;
  note: string;
}) {
  return (
    <section className="rounded-card border border-[var(--c-pass)]/40 bg-[var(--c-pass-bg)] px-3 py-2">
      <p className="text-[12px]">
        <strong className="font-semibold">Spend approved.</strong>{" "}
        <span className="tabular">${approvedCostUsd.toFixed(2)}</span> by {approvedBy} on{" "}
        {formatInstant(approvedAt)}, ceiling{" "}
        <span className="tabular">${ceilingUsd.toFixed(2)}</span>.
      </p>
      {note && <p className="mt-0.5 text-[11px] text-[var(--label-2)]">{note}</p>}
    </section>
  );
}

/** Post-batch: the match rate, what it cost, and the queue of what failed to match. */
function ReportCard({ report, registryId }: { report: EnrichmentReport; registryId: string }) {
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const queue = useMemo(
    () => report.unmatchedPlaces.filter((p) => !resolved.has(p.id)),
    [report.unmatchedPlaces, resolved]
  );
  const cursor = useQueueCursor(queue, (p) => p.id);
  const active = cursor.current;

  const resolve = useCallback(
    async (action: UnmatchedVerdictsRequest["verdicts"][number]["action"]) => {
      if (!active) return;
      const id = active.id;
      setResolved((s) => new Set(s).add(id));
      try {
        await submitUnmatchedVerdicts(report.runId, registryId, [{ placeId: id, action }]);
      } catch {
        setResolved((s) => {
          const next = new Set(s);
          next.delete(id);
          return next;
        });
      }
    },
    [active, registryId, report.runId]
  );

  const bindings: Binding[] = useMemo(
    () => [
      { keys: ["j", "ArrowDown"], label: "Next", group: "Navigate", run: () => cursor.move(1) },
      { keys: ["k", "ArrowUp"], label: "Previous", group: "Navigate", run: () => cursor.move(-1) },
      {
        keys: ["1", "a"],
        label: "Accept unmatched",
        group: "Unmatched",
        disabled: !active,
        run: () => void resolve("accept_unmatched"),
      },
      {
        keys: ["2", "r"],
        label: "Retry wider",
        group: "Unmatched",
        disabled: !active,
        run: () => void resolve("retry"),
      },
      {
        keys: ["3", "f"],
        label: "Flag",
        group: "Unmatched",
        disabled: !active,
        run: () => void resolve("flag"),
      },
    ],
    [active, cursor, resolve]
  );

  useHotkeys(bindings, queue.length > 0);

  return (
    <>
      <ShortcutOverlay bindings={bindings} />
      <section className="grid gap-3 lg:grid-cols-[300px_1fr]">
        <div className="space-y-3 rounded-card border border-[var(--separator)] bg-[var(--bg)] p-3">
          <h2 className="text-[12px] font-semibold">Batch result</h2>
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Match rate"
              value={`${(report.matchRate * 100).toFixed(0)}%`}
              tone={report.matchRate > 0.7 ? "pass" : "warn"}
            />
            <Metric label="Actual cost" value={`$${report.actualCostUsd.toFixed(2)}`} />
            <Metric label="Matched" value={report.matched.toLocaleString()} />
            <Metric
              label="Unmatched"
              value={report.unmatched.toLocaleString()}
              tone={report.unmatched > 0 ? "warn" : "pass"}
            />
          </div>
          <p className="text-[10px] leading-snug text-[var(--label-4)]">
            {report.creditsUsed.toLocaleString()} credits used
            {report.completedAt && ` · completed ${formatInstant(report.completedAt)}`}.
            Responses are cached in our database; only Tripadvisor location_ids are ever stored
            without their payload.
          </p>
        </div>

        <Panel
          title="Unmatched POIs"
          count={queue.length}
          className="min-h-[280px]"
          bodyClassName="flex flex-col"
        >
          {queue.length === 0 ? (
            <EmptyState
              title="Nothing unmatched"
              detail="Every billable POI came back with a Foursquare match."
            />
          ) : (
            <>
              {active && (
                <div className="shrink-0 border-b border-[var(--separator)] bg-[var(--bg-inset)] p-2.5">
                  <p className="text-[12px] font-medium">{active.name}</p>
                  <p className="text-[11px] text-[var(--label-3)]">
                    {active.category} · {active.point[1].toFixed(5)}, {active.point[0].toFixed(5)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Verdict k="1" label="Accept unmatched" onClick={() => void resolve("accept_unmatched")} />
                    <Verdict k="2" label="Retry wider radius" onClick={() => void resolve("retry")} />
                    <Verdict k="3" label="Flag for review" onClick={() => void resolve("flag")} />
                  </div>
                </div>
              )}
              <div className="min-h-0 flex-1">
                <VirtualList
                  items={queue}
                  rowHeight={ROW_H}
                  activeIndex={cursor.index}
                  ariaLabel="Unmatched POIs"
                  renderRow={(p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      data-queue-key={p.id}
                      data-active={i === cursor.index}
                      onMouseEnter={() => cursor.setIndex(i)}
                      onClick={() => cursor.setIndex(i)}
                      style={{ height: ROW_H }}
                      className="queue-row flex w-full flex-col justify-center border-b border-[var(--separator)] px-3 text-left hover:bg-[var(--fill)]"
                    >
                      <span className="truncate text-[12px]">{p.name}</span>
                      <span className="truncate text-[10px] text-[var(--label-3)]">{p.category}</span>
                    </button>
                  )}
                />
              </div>
              <ShortcutStrip bindings={bindings} />
            </>
          )}
        </Panel>
      </section>
    </>
  );
}

function Verdict({ k, label, onClick }: { k: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-[var(--separator)] px-2 text-[11px] hover:bg-[var(--fill)]"
    >
      <kbd className="inline-flex h-[15px] min-w-[15px] items-center justify-center rounded-[3px] border border-[var(--separator)] bg-[var(--bg)] px-0.5 font-sans text-[9px]">
        {k}
      </kbd>
      {label}
    </button>
  );
}
