"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  ConflictType,
  ConflictVerdictValue,
  HarvestConflict,
  HarvestResponse,
  PlaceCandidate,
} from "@/lib/ingestion-api";
import { EmptyState, SourceChip } from "@/components/console/ui/primitives";
import { VirtualList } from "@/components/console/ui/VirtualList";
import {
  ShortcutOverlay,
  ShortcutStrip,
  useHotkeys,
  useQueueCursor,
  type Binding,
} from "@/components/console/useKeyboard";
import { bulkAcceptHarvest, submitHarvestVerdicts } from "@/app/(console)/console/(workspace)/actions";
import { HarvestMap, type LayerVisibility } from "./HarvestMap";

const TYPE_LABEL: Record<ConflictType, string> = {
  same_name_different_location: "Same name, different place",
  same_location_different_category: "Same place, different category",
  low_confidence: "Low confidence",
  permanently_closed: "Permanently closed",
};

const VERDICT_LABEL: Record<ConflictVerdictValue, string> = {
  keep_left: "Keep left",
  keep_right: "Keep right",
  merge: "Merge",
  skip: "Skip",
};

const ROW_H = 46;

export function HarvestReview({
  data,
  registryId,
}: {
  data: HarvestResponse;
  registryId: string;
}) {
  const { summary } = data;

  /**
   * Verdicts are applied locally first and flushed in batches. At one keystroke
   * per decision a round trip per verdict would make the queue feel like it was
   * running through mud, and the analyst would stop trusting that their input
   * landed.
   */
  const [local, setLocal] = useState<Map<string, ConflictVerdictValue>>(new Map());
  const pending = useRef<{ conflictId: string; verdict: ConflictVerdictValue }[]>([]);
  const [unsaved, setUnsaved] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flush = useCallback(async () => {
    if (pending.current.length === 0) return;
    const batch = pending.current;
    pending.current = [];
    setSaving(true);
    setError(null);
    try {
      await submitHarvestVerdicts(data.summary.runId, registryId, batch);
      setUnsaved((n) => Math.max(0, n - batch.length));
    } catch (e) {
      // Put them back: an unsaved verdict the analyst thinks was recorded is
      // the single worst failure mode this screen has.
      pending.current = [...batch, ...pending.current];
      setError(e instanceof Error ? e.message : "Could not save verdicts.");
    } finally {
      setSaving(false);
    }
  }, [data.summary.runId, registryId]);

  useEffect(() => {
    if (unsaved === 0) return;
    const t = setTimeout(flush, 1200);
    return () => clearTimeout(t);
  }, [unsaved, flush]);

  // Never lose a decision to a closed tab.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current.length > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const conflicts = useMemo(
    () =>
      data.conflicts.map((c) => {
        const v = local.get(c.id);
        return v ? { ...c, resolved: true, resolvedVerdict: v } : c;
      }),
    [data.conflicts, local]
  );

  const [types, setTypes] = useState<Set<ConflictType>>(
    () => new Set(Object.keys(TYPE_LABEL) as ConflictType[])
  );
  const [showResolved, setShowResolved] = useState(false);

  const queue = useMemo(
    () => conflicts.filter((c) => types.has(c.type) && (showResolved || !c.resolved)),
    [conflicts, types, showResolved]
  );

  const cursor = useQueueCursor(queue, (c) => c.id);
  const active = cursor.current;

  const [visibility, setVisibility] = useState<LayerVisibility>({
    osm: true,
    overture: true,
    conflated: true,
  });

  const decide = useCallback(
    (verdict: ConflictVerdictValue) => {
      if (!active) return;
      const id = active.id;
      setLocal((m) => new Map(m).set(id, verdict));
      pending.current.push({ conflictId: id, verdict });
      setUnsaved((n) => n + 1);
      // Do not advance the index: the resolved item leaves the queue, so the
      // same index is already the next decision.
      if (showResolved) cursor.move(1);
    },
    [active, cursor, showResolved]
  );

  const undo = useCallback(() => {
    const last = pending.current.pop();
    if (!last) return;
    setLocal((m) => {
      const next = new Map(m);
      next.delete(last.conflictId);
      return next;
    });
    setUnsaved((n) => Math.max(0, n - 1));
    cursor.jumpTo(last.conflictId);
  }, [cursor]);

  const bindings: Binding[] = useMemo(
    () => [
      { keys: ["j", "ArrowDown"], label: "Next", group: "Navigate", run: () => cursor.move(1) },
      { keys: ["k", "ArrowUp"], label: "Previous", group: "Navigate", run: () => cursor.move(-1) },
      { keys: ["1", "l"], label: "Keep left", group: "Verdict", run: () => decide("keep_left"), disabled: !active },
      {
        keys: ["2", "r"],
        label: "Keep right",
        group: "Verdict",
        run: () => decide("keep_right"),
        disabled: !active || !active.right,
      },
      {
        keys: ["3", "m"],
        label: "Merge",
        group: "Verdict",
        run: () => decide("merge"),
        disabled: !active || !active.right,
      },
      { keys: ["4", "s"], label: "Skip", group: "Verdict", run: () => decide("skip"), disabled: !active },
      {
        keys: ["Enter"],
        label: "Accept suggestion",
        group: "Verdict",
        run: () => active && decide(active.suggestion),
        disabled: !active,
      },
      { keys: ["u"], label: "Undo", group: "Verdict", run: undo, secondary: true },
      {
        keys: ["v"],
        label: "Show resolved",
        group: "View",
        secondary: true,
        run: () => setShowResolved((v) => !v),
      },
      { keys: ["w"], label: "Save now", group: "View", secondary: true, run: () => void flush() },
    ],
    [active, cursor, decide, flush, undo]
  );

  useHotkeys(bindings);

  const remaining = conflicts.filter((c) => !c.resolved).length;

  return (
    <div className="flex h-full min-h-0">
      <ShortcutOverlay bindings={bindings} />

      {/* Map side */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--separator)] bg-[var(--bg)] px-3 py-2 text-[11px]">
          <LayerToggle
            label="OSM"
            color="#7cb342"
            count={summary.osmCount}
            on={visibility.osm}
            onToggle={() => setVisibility((v) => ({ ...v, osm: !v.osm }))}
          />
          <LayerToggle
            label="Overture"
            color="#5e5ce6"
            count={summary.overtureCount}
            on={visibility.overture}
            onToggle={() => setVisibility((v) => ({ ...v, overture: !v.overture }))}
          />
          <LayerToggle
            label="Conflated"
            color="#007aff"
            count={summary.conflatedCount}
            on={visibility.conflated}
            onToggle={() => setVisibility((v) => ({ ...v, conflated: !v.conflated }))}
          />

          <span className="ml-2 text-[var(--label-3)]">
            <strong className="tabular font-semibold text-[var(--label)]">
              {summary.newFromOverture}
            </strong>{" "}
            new from Overture
          </span>
          <span className="text-[var(--label-3)]">
            <strong className="tabular font-semibold text-[var(--label)]">
              {summary.belowConfidence}
            </strong>{" "}
            below {summary.confidenceThreshold}
          </span>
          <span className="text-[var(--label-3)]">
            <strong className="tabular font-semibold text-[var(--label)]">
              {summary.excludedClosed}
            </strong>{" "}
            closed
          </span>
          <span
            className="ml-auto rounded-sm bg-[var(--fill)] px-1.5 py-0.5 text-[10px] text-[var(--label-2)]"
            title="Overture hosts only the last two monthly releases, so the release this run read is recorded with it."
          >
            Overture {summary.overtureRelease}
          </span>
        </div>

        <div className="min-h-0 flex-1">
          <HarvestMap
            places={data.places}
            conflict={active}
            visibility={visibility}
            bbox={boundsOf(data.places)}
          />
        </div>

        {/* Overture's confidence ramp, spelled out — the colours on the map are
            only useful if the scale is visible. */}
        <div className="flex shrink-0 items-center gap-2 border-t border-[var(--separator)] bg-[var(--bg)] px-3 py-1.5 text-[10px] text-[var(--label-3)]">
          <span>Overture confidence</span>
          <span
            aria-hidden
            className="h-[6px] w-[140px] rounded-pill"
            style={{
              background: "linear-gradient(90deg,#ff3b30 0%,#ff9500 30%,#5e5ce6 62%,#30d158 100%)",
            }}
          />
          <span className="tabular">0.30</span>
          <span>→</span>
          <span className="tabular">1.00</span>
          <span className="ml-3">
            Existence-likelihood, not open/closed. Closed places are ringed in red.
          </span>
        </div>
      </div>

      {/* Queue side */}
      <div className="flex w-[460px] min-w-0 shrink-0 flex-col border-l border-[var(--separator)] bg-[var(--bg)]">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--separator)] px-3 py-2">
          <h2 className="text-[12px] font-semibold">
            Conflicts{" "}
            <span className="tabular ml-1 rounded-sm bg-[var(--fill)] px-1 text-[11px] font-medium text-[var(--label-2)]">
              {remaining} open
            </span>
          </h2>
          <span className="text-[11px] text-[var(--label-3)]">
            {saving ? "Saving…" : unsaved > 0 ? `${unsaved} unsaved` : "All saved"}
          </span>
        </div>

        {error && (
          <p role="alert" className="bg-[var(--c-blocked-bg)] px-3 py-1.5 text-[11px] text-[var(--c-blocked)]">
            {error}{" "}
            <button type="button" onClick={() => void flush()} className="underline">
              Retry
            </button>
          </p>
        )}

        <div className="flex shrink-0 flex-wrap gap-1 border-b border-[var(--separator)] px-3 py-2">
          {(Object.keys(TYPE_LABEL) as ConflictType[]).map((t) => {
            const n = conflicts.filter((c) => c.type === t && !c.resolved).length;
            const on = types.has(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setTypes((s) => {
                    const next = new Set(s);
                    if (next.has(t)) next.delete(t);
                    else next.add(t);
                    return next;
                  })
                }
                className={cn(
                  "rounded-sm border px-1.5 py-0.5 text-[10px]",
                  on
                    ? "border-[var(--link)] bg-[var(--c-ready-bg)] text-[var(--c-ready)]"
                    : "border-[var(--separator)] text-[var(--label-3)]"
                )}
              >
                {TYPE_LABEL[t]} <span className="tabular opacity-70">{n}</span>
              </button>
            );
          })}
          <label className="ml-auto flex cursor-pointer items-center gap-1 text-[10px] text-[var(--label-3)]">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="size-3"
            />
            resolved
          </label>
        </div>

        {active ? (
          <ConflictDetail conflict={active} onDecide={decide} />
        ) : (
          <div className="border-b border-[var(--separator)]">
            <EmptyState
              title="Conflict queue is clear"
              detail="Every conflict in the selected types has a verdict. Membership is the next stage."
            />
          </div>
        )}

        <div className="min-h-0 flex-1">
          {queue.length === 0 ? (
            <EmptyState title="Nothing queued" detail="Widen the type filter, or show resolved conflicts." />
          ) : (
            <VirtualList
              items={queue}
              rowHeight={ROW_H}
              activeIndex={cursor.index}
              ariaLabel="Harvest conflicts"
              renderRow={(c, i) => (
                <ConflictRow
                  key={c.id}
                  conflict={c}
                  active={i === cursor.index}
                  onFocus={() => cursor.setIndex(i)}
                />
              )}
            />
          )}
        </div>

        <BulkAccept
          runId={summary.runId}
          registryId={registryId}
          types={[...types]}
          defaultConfidence={summary.confidenceThreshold}
        />
        <ShortcutStrip bindings={bindings} />
      </div>
    </div>
  );
}

function boundsOf(places: PlaceCandidate[]) {
  if (places.length === 0) return [6.4, 45.2, 6.8, 45.5] as [number, number, number, number];
  const lngs = places.map((p) => p.point[0]);
  const lats = places.map((p) => p.point[1]);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)] as [
    number,
    number,
    number,
    number,
  ];
}

function LayerToggle({
  label,
  color,
  count,
  on,
  onToggle,
}: {
  label: string;
  color: string;
  count: number;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-sm border px-1.5",
        on ? "border-[var(--separator-strong)]" : "border-[var(--separator)] opacity-45"
      )}
    >
      <span aria-hidden className="size-[7px] rounded-full" style={{ background: color }} />
      {label}
      <span className="tabular text-[var(--label-3)]">{count.toLocaleString()}</span>
    </button>
  );
}

function ConflictRow({
  conflict,
  active,
  onFocus,
}: {
  conflict: HarvestConflict;
  active: boolean;
  onFocus: () => void;
}) {
  return (
    <button
      type="button"
      data-queue-key={conflict.id}
      data-active={active}
      onMouseEnter={onFocus}
      onFocus={onFocus}
      onClick={onFocus}
      style={{ height: ROW_H }}
      className="queue-row flex w-full flex-col justify-center gap-0.5 border-b border-[var(--separator)] px-3 text-left hover:bg-[var(--fill)]"
    >
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="size-[6px] shrink-0 rounded-full"
          style={{
            background:
              conflict.severity === "high"
                ? "var(--c-blocked)"
                : conflict.severity === "medium"
                  ? "var(--c-warn)"
                  : "var(--c-waiting)",
          }}
        />
        <span className="truncate text-[12px] font-medium">{conflict.left.name}</span>
        {conflict.right && conflict.right.name !== conflict.left.name && (
          <span className="truncate text-[11px] text-[var(--label-3)]">↔ {conflict.right.name}</span>
        )}
        {conflict.resolved && conflict.resolvedVerdict && (
          <span className="ml-auto shrink-0 rounded-sm bg-[var(--c-pass-bg)] px-1 text-[10px] text-[var(--c-pass)]">
            {VERDICT_LABEL[conflict.resolvedVerdict]}
          </span>
        )}
      </span>
      <span className="truncate text-[10px] text-[var(--label-3)]">
        {TYPE_LABEL[conflict.type]}
        {conflict.distanceM !== null && ` · ${conflict.distanceM} m apart`}
        {conflict.left.confidence !== null && ` · conf ${conflict.left.confidence.toFixed(2)}`}
      </span>
    </button>
  );
}

function ConflictDetail({
  conflict,
  onDecide,
}: {
  conflict: HarvestConflict;
  onDecide: (v: ConflictVerdictValue) => void;
}) {
  return (
    <div className="shrink-0 border-b border-[var(--separator)] bg-[var(--bg-inset)] p-3">
      <p className="mb-2 text-[11px] leading-snug text-[var(--label-2)]">{conflict.note}</p>

      <div className="grid grid-cols-2 gap-2">
        <PlaceSide place={conflict.left} side="Left" />
        {conflict.right ? (
          <PlaceSide place={conflict.right} side="Right" />
        ) : (
          <div className="rounded-sm border border-dashed border-[var(--separator)] p-2 text-[11px] text-[var(--label-4)]">
            Single-sided conflict — the decision is keep or skip.
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {(["keep_left", "keep_right", "merge", "skip"] as ConflictVerdictValue[]).map((v, i) => {
          const disabled = (v === "keep_right" || v === "merge") && !conflict.right;
          const suggested = conflict.suggestion === v;
          return (
            <button
              key={v}
              type="button"
              disabled={disabled}
              onClick={() => onDecide(v)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-sm border px-2 text-[11px] disabled:opacity-35",
                suggested
                  ? "border-[var(--link)] bg-[var(--c-ready-bg)] font-medium text-[var(--c-ready)]"
                  : "border-[var(--separator)] hover:bg-[var(--fill)]"
              )}
            >
              <kbd className="inline-flex h-[15px] min-w-[15px] items-center justify-center rounded-[3px] border border-[var(--separator)] bg-[var(--bg)] px-0.5 font-sans text-[9px]">
                {i + 1}
              </kbd>
              {VERDICT_LABEL[v]}
              {suggested && <span className="text-[9px] opacity-70">suggested</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlaceSide({ place, side }: { place: PlaceCandidate; side: string }) {
  return (
    <div className="min-w-0 rounded-sm border border-[var(--separator)] bg-[var(--bg)] p-2">
      <div className="flex items-baseline justify-between gap-1">
        <span className="truncate text-[12px] font-medium">{place.name}</span>
        <span className="shrink-0 text-[10px] text-[var(--label-4)]">{side}</span>
      </div>
      <p className="truncate text-[11px] text-[var(--label-3)]">{place.category}</p>
      <p className="tabular mt-0.5 text-[10px] text-[var(--label-4)]">
        {place.point[1].toFixed(5)}, {place.point[0].toFixed(5)}
      </p>

      {/* Per-field provenance. Which source said what is the actual evidence
          behind a merge, so it is shown rather than hidden behind a hover. */}
      <div className="mt-1.5 flex flex-wrap gap-1">
        {Object.entries(place.fieldProvenance).map(([field, source]) => (
          <SourceChip key={field} source={source} field={field} />
        ))}
      </div>

      <div className="mt-1.5 space-y-0.5 text-[10px] text-[var(--label-3)]">
        {place.refs.map((r) => (
          <p key={`${r.source}:${r.externalId}`} className="truncate">
            <span className="text-[var(--label-4)]">{r.source}</span> {r.externalId}
            {r.release && <span className="text-[var(--label-4)]"> · {r.release}</span>}
          </p>
        ))}
        {place.confidence !== null && (
          <p className="tabular">confidence {place.confidence.toFixed(2)}</p>
        )}
        {place.operatingStatus === "permanently_closed" && (
          <p className="text-[var(--c-blocked)]">permanently_closed</p>
        )}
      </div>
    </div>
  );
}

/** Bulk accept above a confidence threshold — the escape from a 180-item queue. */
function BulkAccept({
  runId,
  registryId,
  types,
  defaultConfidence,
}: {
  runId: string;
  registryId: string;
  types: ConflictType[];
  defaultConfidence: number;
}) {
  const [min, setMin] = useState(Math.max(defaultConfidence, 0.8));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="shrink-0 space-y-1.5 border-t border-[var(--separator)] px-3 py-2">
      <div className="flex items-center gap-2">
        <label className="flex flex-1 items-center gap-2 text-[11px] text-[var(--label-2)]">
          Bulk accept ≥
          <span className="tabular w-[30px] font-medium">{min.toFixed(2)}</span>
          <input
            type="range"
            min={0.3}
            max={1}
            step={0.05}
            value={min}
            onChange={(e) => setMin(Number(e.target.value))}
            className="flex-1 accent-[var(--link)]"
            aria-label="Minimum confidence for bulk accept"
          />
        </label>
        <button
          type="button"
          disabled={busy || types.length === 0}
          onClick={async () => {
            setBusy(true);
            setResult(null);
            try {
              const res = await bulkAcceptHarvest(runId, registryId, { minConfidence: min, types });
              setResult(`Accepted ${res.applied}, ${res.remaining} still open.`);
            } catch (e) {
              setResult(e instanceof Error ? e.message : "Bulk accept failed.");
            } finally {
              setBusy(false);
            }
          }}
          className="h-7 shrink-0 rounded-sm border border-[var(--separator)] px-2 text-[11px] hover:bg-[var(--fill)] disabled:opacity-40"
        >
          {busy ? "Applying…" : "Apply"}
        </button>
      </div>
      <p className="text-[10px] text-[var(--label-4)]">
        Applies each conflict&rsquo;s suggested verdict across the {types.length} selected type
        {types.length === 1 ? "" : "s"}. Rows with no confidence signal are treated as 1.00.
        {result && <span className="ml-1 text-[var(--label-2)]">{result}</span>}
      </p>
    </div>
  );
}
