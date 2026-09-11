"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  BBox,
  CoverageFinding,
  CoverageFindingType,
  CoverageMemberStats,
  CoverageResponse,
  CoverageVerdictValue,
  ReferenceComparison,
} from "@/lib/ingestion-api";
import { EmptyState, GateChip, formatInstant } from "@/components/console/ui/primitives";
import { GateCard } from "@/components/console/ui/GateCard";
import { VirtualList } from "@/components/console/ui/VirtualList";
import {
  ShortcutOverlay,
  ShortcutStrip,
  useHotkeys,
  useQueueCursor,
  type Binding,
} from "@/components/console/useKeyboard";
import {
  submitCoverageVerdicts,
  waiveCoverageGate,
} from "@/app/(console)/console/(workspace)/actions";
import { CoverageMap, FINDING_COLOR, FINDING_LABEL } from "./CoverageMap";

const ROW_H = 56;

/** Queue order: the graph defects first, the tagging chore last. */
const TYPE_ORDER: CoverageFindingType[] = [
  "unconnected_terminal",
  "isolated_component",
  "missing_reference_lift",
  "missing_difficulty",
];

const VERDICT_LABEL: Record<CoverageVerdictValue, string> = {
  fix_upstream: "Fix upstream",
  local_override: "Local override",
  accept_gap: "Accept gap",
  retry: "Retry",
};

/**
 * European piste grading, in the order a trail map prints it.
 *
 * The order is fixed here rather than taken from the payload. The backend
 * builds `runsByDifficulty` by first-seen order in its SQL result, so key order
 * differs per member — Courchevel arrives novice/easy/advanced/intermediate,
 * Les Menuires easy/intermediate/advanced/novice. Rendering in payload order
 * made the bars mutually incomparable, which is the only thing a stacked bar is
 * for. Anything the backend sends that is not in this list is appended after
 * it, so a new OSM grade shows up rather than vanishing.
 */
const DIFFICULTY_ORDER = [
  "novice",
  "easy",
  "intermediate",
  "advanced",
  "expert",
  "freeride",
  "unknown",
] as const;

const DIFFICULTY_COLOR: Record<string, string> = {
  novice: "var(--grade-novice)",
  easy: "var(--grade-easy)",
  intermediate: "var(--grade-intermediate)",
  advanced: "var(--grade-advanced)",
  expert: "var(--grade-expert)",
  freeride: "var(--grade-freeride)",
  unknown: "var(--grade-unknown)",
};

export function RoutingCoverage({
  data,
  registryId,
  bbox,
}: {
  data: CoverageResponse;
  registryId: string;
  bbox: BBox;
}) {
  // The graph is regenerated per database, so "not measured yet" is the normal
  // state of a region the pipeline has not imported — production today, and
  // every fresh e2e database. It is not an error and is not styled like one.
  if (!data.graphAvailable) return <Unmeasured data={data} />;
  return <CoverageWorkspace data={data} registryId={registryId} bbox={bbox} />;
}

function Unmeasured({ data }: { data: CoverageResponse }) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 p-8">
      <div className="max-w-[54ch] text-center">
        <h2 className="text-[15px] font-semibold">No routing graph yet</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--label-2)]">
          Coverage is measured from <code className="text-[11px]">ski_routing</code>, which the
          pipeline builds per database. Nothing has imported this region here yet, so there is
          nothing to measure — this screen fills in once the routing pipeline runs over{" "}
          {data.registryName}.
        </p>
        <p className="mt-1.5 text-[11px] text-[var(--label-3)]">
          Checked {formatInstant(data.computedAt)}.
        </p>
      </div>

      <div className="w-full max-w-[520px] space-y-1">
        <p className="text-[11px] font-medium text-[var(--label-3)]">
          What it will measure, once there is a graph
        </p>
        {data.gates.map((g) => (
          <div
            key={g.key}
            className="flex items-center justify-between gap-3 rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-2 py-1.5"
          >
            <span className="truncate text-[11px] text-[var(--label-2)]">{g.title}</span>
            <GateChip status={g.status} blocking={g.blocking} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CoverageWorkspace({
  data,
  registryId,
  bbox,
}: {
  data: CoverageResponse;
  registryId: string;
  bbox: BBox;
}) {
  /**
   * Verdicts apply optimistically — one keystroke each is the whole point of a
   * queue — and roll back if the server refuses. The server-rendered payload
   * stays the source of truth for everything the analyst has not just touched.
   */
  const [local, setLocal] = useState<Map<string, CoverageFinding["verdict"]>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [types, setTypes] = useState<Set<CoverageFindingType>>(new Set());
  const [accepting, setAccepting] = useState(false);
  const [reason, setReason] = useState("");

  const findings = useMemo(
    () =>
      [...data.findings]
        .map((f) => (local.has(f.id) ? { ...f, verdict: local.get(f.id)! } : f))
        .sort(
          (a, b) =>
            Number(Boolean(a.verdict)) - Number(Boolean(b.verdict)) ||
            TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) ||
            a.label.localeCompare(b.label)
        ),
    [data.findings, local]
  );

  const open = useMemo(() => findings.filter((f) => !f.verdict), [findings]);
  const reviewed = useMemo(() => findings.filter((f) => f.verdict), [findings]);

  const byType = useMemo(() => {
    const m = new Map<CoverageFindingType, number>();
    for (const f of open) m.set(f.type, (m.get(f.type) ?? 0) + 1);
    return m;
  }, [open]);

  const queue = useMemo(
    () => (types.size === 0 ? open : open.filter((f) => types.has(f.type))),
    [open, types]
  );

  const cursor = useQueueCursor(queue, (f) => f.id);
  const active = cursor.current;

  const apply = useCallback(
    async (finding: CoverageFinding, verdict: CoverageVerdictValue, why?: string) => {
      setError(null);
      setLocal((m) =>
        new Map(m).set(finding.id, {
          value: verdict,
          reason: why?.trim() || null,
          // Optimistic only: the server resolves the real actor from the
          // session and returns it on the next render. Nothing here is ever
          // sent as an actor claim.
          actor: "you@pending",
          at: new Date().toISOString(),
        })
      );
      try {
        await submitCoverageVerdicts(registryId, [
          { findingId: finding.id, verdict, reason: why?.trim() || null },
        ]);
      } catch (e) {
        setLocal((m) => {
          const next = new Map(m);
          next.delete(finding.id);
          return next;
        });
        setError(e instanceof Error ? e.message : "Could not record that verdict.");
      }
    },
    [registryId]
  );

  const bindings: Binding[] = useMemo(
    () => [
      { keys: ["j", "ArrowDown"], label: "Next", group: "Navigate", run: () => cursor.move(1) },
      { keys: ["k", "ArrowUp"], label: "Previous", group: "Navigate", run: () => cursor.move(-1) },
      {
        keys: ["f"],
        label: "Fix upstream",
        group: "Verdict",
        disabled: !active,
        run: () => active && void apply(active, "fix_upstream"),
      },
      {
        keys: ["o"],
        label: "Local override",
        group: "Verdict",
        disabled: !active,
        run: () => active && void apply(active, "local_override"),
      },
      {
        keys: ["a"],
        label: "Accept gap",
        group: "Verdict",
        disabled: !active,
        run: () => {
          setReason("");
          setAccepting(true);
        },
      },
      {
        keys: ["r"],
        label: "Retry",
        group: "Verdict",
        disabled: !active,
        run: () => active && void apply(active, "retry"),
      },
    ],
    [active, apply, cursor]
  );

  useHotkeys(bindings, !accepting);

  const blocking = data.gates.filter((g) => g.status === "fail" && g.blocking);
  const attributedKm = data.members.reduce((n, m) => n + m.pisteKm, 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ShortcutOverlay bindings={bindings} />

      <GraphStrip data={data} />

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Census and reference sit side by side rather than stacked: stacked,
              a group with eight members pushed the reference cards into a
              scroll region and cut them off mid-sentence, and the liftie card
              is the loudest thing on this screen. */}
          {/* Each column scrolls in its own right. Sharing one scroller meant a
              group with eight members pushed the reference cards out of view,
              and a liftie card with a long missing-lift list did the same to
              the census — the two are read together or not at all. */}
          <div className="grid max-h-[42vh] shrink-0 border-b border-[var(--separator)] xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Census members={data.members} attributedKm={attributedKm} data={data} />
            <ReferencePanel reference={data.reference} />
          </div>

          <div className="min-h-0 flex-1">
            <CoverageMap
              findings={findings}
              active={active}
              bbox={bbox}
              onSelect={(id) => cursor.jumpTo(id)}
            />
          </div>
        </div>

        <div className="flex w-[452px] min-w-0 shrink-0 flex-col border-l border-[var(--separator)] bg-[var(--bg)]">
          <div className="flex min-h-0 flex-col overflow-hidden border-b border-[var(--separator)]">
            <div className="flex shrink-0 items-center justify-between px-3 py-2">
              <h2 className="text-[12px] font-semibold">Coverage gates</h2>
              <span
                className={cn(
                  "rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
                  blocking.length > 0
                    ? "bg-[var(--c-blocked-bg)] text-[var(--c-blocked)]"
                    : "bg-[var(--c-pass-bg)] text-[var(--c-pass)]"
                )}
              >
                {blocking.length > 0
                  ? `${blocking.length} blocking publish`
                  : "Coverage clear to publish"}
              </span>
            </div>
            <div className="scroll-y min-h-[64px] max-h-[26vh] flex-1 space-y-1.5 px-3 pb-3">
              {data.gates.map((g) => (
                <GateCard
                  key={g.key}
                  gate={g}
                  waiveHint="Why is it correct to publish despite this gate? Recorded against your name."
                  onWaive={(why) => waiveCoverageGate(registryId, g.key, why)}
                />
              ))}
            </div>
          </div>

          <div className="shrink-0 border-b border-[var(--separator)] px-3 py-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[12px] font-semibold">
                Findings{" "}
                <span className="tabular ml-1 rounded-sm bg-[var(--fill)] px-1 text-[11px] font-medium text-[var(--label-2)]">
                  {queue.length}
                </span>
              </h2>
              {types.size > 0 && (
                <button
                  type="button"
                  onClick={() => setTypes(new Set())}
                  className="text-[11px] text-[var(--label-3)] underline hover:text-[var(--label-2)]"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Grouping the analyst drives: each type, its open count, and a
                click to work that group alone. */}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {TYPE_ORDER.filter((t) => (byType.get(t) ?? 0) > 0).map((t) => {
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
                      "inline-flex h-[21px] items-center gap-1.5 rounded-sm border px-1.5 text-[10px]",
                      on
                        ? "border-[var(--label-3)] bg-[var(--fill-strong)] font-medium"
                        : "border-[var(--separator)] hover:bg-[var(--fill)]"
                    )}
                  >
                    <span
                      aria-hidden
                      className="size-[7px] rounded-full"
                      style={{ background: FINDING_COLOR[t] }}
                    />
                    {FINDING_LABEL[t]}
                    <span className="tabular text-[var(--label-3)]">{byType.get(t)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="shrink-0 bg-[var(--c-blocked-bg)] px-3 py-1.5 text-[11px] text-[var(--c-blocked)]"
            >
              {error}
            </p>
          )}

          {active && (
            <div className="shrink-0 space-y-2 border-b border-[var(--separator)] bg-[var(--bg-inset)] p-3">
              <div>
                <p className="flex items-center gap-1.5 text-[12px] font-medium">
                  <span
                    aria-hidden
                    className="size-[8px] shrink-0 rounded-full"
                    style={{ background: FINDING_COLOR[active.type] }}
                  />
                  <span className="truncate">{active.label}</span>
                </p>
                <p className="text-[11px] text-[var(--label-3)]">
                  {FINDING_LABEL[active.type]}
                  {active.memberName && <> · {active.memberName}</>}
                  {active.km !== null && <> · {active.km} km</>}
                </p>
              </div>
              <p
                className="line-clamp-3 text-[11px] leading-snug text-[var(--label-2)]"
                title={active.detail}
              >
                {active.detail}
              </p>

              <div className="flex flex-wrap gap-1">
                <VerdictButton k="f" label="Fix upstream" onClick={() => void apply(active, "fix_upstream")} />
                <VerdictButton k="o" label="Local override" onClick={() => void apply(active, "local_override")} />
                <VerdictButton
                  k="a"
                  label="Accept gap"
                  onClick={() => {
                    setReason("");
                    setAccepting(true);
                  }}
                />
                <VerdictButton k="r" label="Retry" onClick={() => void apply(active, "retry")} />
              </div>

              {/* The rule the analyst needs at the keystroke is the one line;
                  the rest is reference, and the queue needs the room more. */}
              {/* What each verdict means, not what it does to the gate: a
                  reviewed finding stops counting against its gate whatever the
                  verdict, so asserting a rule here would be describing the
                  console's opinion rather than the backend's behaviour. */}
              <details className="text-[10px] text-[var(--label-4)]">
                <summary className="cursor-pointer leading-snug">
                  What each verdict records
                </summary>
                <p className="mt-1 leading-snug">
                  <b className="font-medium text-[var(--label-3)]">Fix upstream</b> — the gap is
                  real and belongs in OSM, where everyone downstream benefits. Recorded here and
                  re-checked after the next extract; the console never edits OSM.{" "}
                  <b className="font-medium text-[var(--label-3)]">Local override</b> — a graph
                  repair (a connector edge, a tag) recorded as our own evidence over OSM. It draws
                  no geometry; hand-tracing is the thing we specifically do not do.{" "}
                  <b className="font-medium text-[var(--label-3)]">Accept gap</b> — the gap is
                  correct, reason mandatory. <b className="font-medium text-[var(--label-3)]">Retry</b>{" "}
                  — re-check once an upstream fix has landed.
                </p>
              </details>

              {accepting && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!reason.trim()) return;
                    setAccepting(false);
                    void apply(active, "accept_gap", reason);
                    setReason("");
                  }}
                  className="space-y-1"
                >
                  <textarea
                    autoFocus
                    required
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setAccepting(false)}
                    placeholder="Why is this gap correct? e.g. lift decommissioned in 2024, feed still lists it."
                    className="w-full rounded-sm border border-[var(--separator)] bg-[var(--bg)] p-1.5 text-[11px] outline-none focus:border-[var(--link)]"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      disabled={!reason.trim()}
                      className="h-6 rounded-sm bg-[var(--c-waived)] px-2 text-[11px] font-medium text-white disabled:opacity-40"
                    >
                      Accept with reason
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccepting(false)}
                      className="h-6 rounded-sm border border-[var(--separator)] px-2 text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="min-h-[140px] flex-1">
            {queue.length === 0 ? (
              <EmptyState
                title={
                  types.size > 0 ? "Nothing open of that type" : "Every finding has been reviewed"
                }
                detail={
                  types.size > 0
                    ? "Clear the filter to see the rest of the queue."
                    : "Anything filed upstream is re-checked the next time the pipeline extracts this region."
                }
              />
            ) : (
              <VirtualList
                items={queue}
                rowHeight={ROW_H}
                activeIndex={cursor.index}
                ariaLabel="Open coverage findings"
                renderRow={(f, i) => (
                  <button
                    key={f.id}
                    type="button"
                    data-queue-key={f.id}
                    data-active={i === cursor.index}
                    onMouseEnter={() => cursor.setIndex(i)}
                    onFocus={() => cursor.setIndex(i)}
                    onClick={() => cursor.setIndex(i)}
                    style={{ height: ROW_H }}
                    className="queue-row flex w-full flex-col justify-center gap-0.5 border-b border-[var(--separator)] px-3 text-left hover:bg-[var(--fill)]"
                  >
                    {/* The first row of each type carries the group caption, so
                        the queue reads as grouped without a second scroll box. */}
                    {(i === 0 || queue[i - 1].type !== f.type) && (
                      <span
                        className="text-[9px] font-semibold uppercase tracking-wide"
                        style={{ color: FINDING_COLOR[f.type] }}
                      >
                        {FINDING_LABEL[f.type]}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="size-[6px] shrink-0 rounded-full"
                        style={{ background: FINDING_COLOR[f.type] }}
                      />
                      <span className="truncate text-[12px] font-medium">{f.label}</span>
                    </span>
                    <span className="truncate text-[10px] text-[var(--label-3)]">
                      {f.memberName ?? "Unattributed"}
                      {f.km !== null && ` · ${f.km} km`}
                    </span>
                  </button>
                )}
              />
            )}
          </div>

          {reviewed.length > 0 && (
            <details className="shrink-0 border-t border-[var(--separator)]">
              <summary className="cursor-pointer px-3 py-1.5 text-[11px] text-[var(--label-3)]">
                Reviewed ({reviewed.length})
              </summary>
              <ul className="scroll-y max-h-[26vh] border-t border-[var(--separator)]">
                {reviewed.map((f) => (
                  <li
                    key={f.id}
                    className="border-b border-[var(--separator)] px-3 py-1.5 last:border-b-0"
                  >
                    <p className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px]">{f.label}</span>
                      <span className="shrink-0 rounded-sm bg-[var(--fill)] px-1 text-[10px] font-medium text-[var(--label-2)]">
                        {VERDICT_LABEL[f.verdict!.value]}
                      </span>
                    </p>
                    <p className="text-[10px] text-[var(--label-4)]">
                      {f.verdict!.actor}, {formatInstant(f.verdict!.at)}
                      {f.verdict!.reason && ` — ${f.verdict!.reason}`}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <ShortcutStrip bindings={bindings} />
        </div>
      </div>
    </div>
  );
}

/** The six numbers the analyst sanity-checks before reading anything else. */
function GraphStrip({ data }: { data: CoverageResponse }) {
  const items: { label: string; value: string; tone?: "warn" | "blocked"; hint: string }[] = [
    {
      label: "Routable km",
      value: data.graph.routableKm.toFixed(1),
      hint: "Total length of piste and lift edges in the routable graph.",
    },
    {
      label: "Edges",
      value: data.graph.edges.toLocaleString("en-GB"),
      hint: "Graph edges. Not drawn on the map — this many lines is a rendering project, not a review queue.",
    },
    {
      label: "Components",
      value: String(data.graph.components),
      hint: "Connected components. More than a handful usually means connectors are missing.",
    },
    {
      label: "Largest component",
      value: data.graph.largestComponentPct === null ? "—" : `${data.graph.largestComponentPct}%`,
      tone:
        data.graph.largestComponentPct !== null && data.graph.largestComponentPct < 90
          ? "warn"
          : undefined,
      hint: "Share of the graph in one component. A healthy domain is nearly all one piece.",
    },
    {
      label: "Connector edges",
      value: data.graph.connectorEdges.toLocaleString("en-GB"),
      hint: "Lift-to-piste station connectors, the v2 routing work that makes lifts routable at all.",
    },
    {
      label: "Piste reachable from a lift",
      value: data.graph.reachablePistePct === null ? "—" : `${data.graph.reachablePistePct}%`,
      tone:
        data.graph.reachablePistePct !== null && data.graph.reachablePistePct < 95
          ? "warn"
          : undefined,
      hint: "Share of piste km in a component that also contains a lift edge.",
    },
  ];

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-1 border-b border-[var(--separator)] bg-[var(--bg)] px-4 py-2">
      {items.map((i) => (
        <div key={i.label} title={i.hint} className="flex items-baseline gap-1.5">
          <span
            className="tabular text-[15px] font-semibold leading-none"
            style={{ color: i.tone === "warn" ? "var(--c-warn)" : "var(--label)" }}
          >
            {i.value}
          </span>
          <span className="text-[11px] text-[var(--label-3)]">{i.label}</span>
        </div>
      ))}
      <span className="ml-auto text-[11px] text-[var(--label-4)]">
        Computed live · {formatInstant(data.computedAt)}
      </span>
    </div>
  );
}

function Census({
  members,
  attributedKm,
  data,
}: {
  members: CoverageMemberStats[];
  attributedKm: number;
  data: CoverageResponse;
}) {
  return (
    <section className="scroll-y min-h-0 p-3">
      <h2 className="mb-1.5 text-[12px] font-semibold">
        Per-member census{" "}
        <span className="tabular ml-1 rounded-sm bg-[var(--fill)] px-1 text-[11px] font-medium text-[var(--label-2)]">
          {members.length}
        </span>
      </h2>

      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-[10px] text-[var(--label-3)]">
            <th className="w-[34%] pb-1 text-left font-medium">Member</th>
            <th className="pb-1 text-right font-medium">Piste km</th>
            <th
              className="pb-1 text-right font-medium"
              title="Distinct lift names, not lift count — two lifts sharing a name count once, and a lift with no name in OSM is not counted at all."
            >
              Lifts
            </th>
            <th
              className="pb-1 text-right font-medium"
              title="Distinct run names. An unnamed piste contributes its km but no run."
            >
              Named runs
            </th>
            <th className="w-[24%] pb-1 pl-3 text-left font-medium">Grades</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.resortId} className="border-t border-[var(--separator)] align-middle">
              <td className="py-1 pr-2">
                <span className="block truncate font-medium">{m.name}</span>
                {!m.attributed && (
                  <span
                    className="block text-[10px] text-[var(--label-4)]"
                    title="This member has no anchor point, so no graph edge can be attributed to it. The domain's km are still measured — they are shared out among the members that do have one."
                  >
                    no anchor — not attributable
                  </span>
                )}
              </td>
              <td className="tabular py-1 text-right">{m.attributed ? m.pisteKm.toFixed(1) : "—"}</td>
              <td className="tabular py-1 text-right">
                {m.attributed ? (
                  <span title={typeBreakdown(m.liftsByType)}>{m.liftCount}</span>
                ) : (
                  "—"
                )}
              </td>
              <td className="tabular py-1 text-right">{m.attributed ? m.namedRunCount : "—"}</td>
              <td className="py-1 pl-3">
                {m.attributed ? <GradeBar runs={m.runsByDifficulty} /> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-1.5 space-y-1">
        <GradeLegend members={members} />
        {/* Deliberately not a shortfall.
            An earlier version subtracted this total from graph.routableKm and
            called the remainder "extent no member polygon covers". It is not:
            routableKm sums every edge class, piste and lift and connector
            alike, while this column counts piste edges only — and the backend
            attributes every edge to its nearest member anchor with no distance
            limit, so no piste km can go unclaimed by construction. On Les 3
            Vallées that invented "180.5 km orphaned" out of what is simply the
            length of 150 lift lines. The contract exposes no piste-only total
            to compare against, so the honest statement is the total itself.
            See GAPS.md open question 12. */}
        <p className="text-[10px] leading-snug text-[var(--label-3)]">
          {attributedKm.toFixed(1)} km of piste across {members.length} member
          {members.length === 1 ? "" : "s"}. The graph&rsquo;s{" "}
          {data.graph.routableKm.toFixed(1)} km routable is not comparable — it counts lift and
          connector edges too.
        </p>
      </div>
    </section>
  );
}

function typeBreakdown(byType: Record<string, number>): string {
  return (
    Object.entries(byType)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${n} ${k.replace(/_/g, " ")}`)
      .join(" · ") || "no lifts"
  );
}

function orderedGrades(runs: Record<string, number>): [string, number][] {
  const known = DIFFICULTY_ORDER.filter((k) => (runs[k] ?? 0) > 0).map(
    (k) => [k, runs[k]] as [string, number]
  );
  const extra = Object.entries(runs).filter(
    ([k, n]) => n > 0 && !DIFFICULTY_ORDER.includes(k as (typeof DIFFICULTY_ORDER)[number])
  );
  return [...known, ...extra];
}

function GradeBar({ runs }: { runs: Record<string, number> }) {
  const entries = orderedGrades(runs);
  const total = entries.reduce((n, [, v]) => n + v, 0);
  if (total === 0) return <span className="text-[10px] text-[var(--label-4)]">—</span>;
  return (
    <span
      className="flex h-[7px] w-full overflow-hidden rounded-pill"
      title={entries.map(([k, n]) => `${n} ${k}`).join(" · ")}
    >
      {entries.map(([k, n]) => (
        <span
          key={k}
          style={{
            width: `${(n / total) * 100}%`,
            background: DIFFICULTY_COLOR[k] ?? "var(--grade-unknown)",
          }}
        />
      ))}
    </span>
  );
}

/** Without this the bar is a row of unlabelled colours. */
function GradeLegend({ members }: { members: CoverageMemberStats[] }) {
  const present = DIFFICULTY_ORDER.filter((k) =>
    members.some((m) => (m.runsByDifficulty[k] ?? 0) > 0)
  );
  if (present.length === 0) return null;
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      {present.map((k) => (
        <span key={k} className="inline-flex items-center gap-1 text-[10px] text-[var(--label-3)]">
          <span
            aria-hidden
            className="size-[7px] rounded-[2px]"
            style={{ background: DIFFICULTY_COLOR[k] }}
          />
          {k}
        </span>
      ))}
    </span>
  );
}

const SOURCE_TITLE: Record<ReferenceComparison["source"], string> = {
  liftie: "Operator feed (liftie)",
  skimap: "Skimap entry",
  declared: "Official figures",
};

/**
 * Reference comparison, in trust order. The liftie card is the star: it is the
 * only source here scraped from the operator's own page, so a lift it names
 * with no extracted counterpart is the strongest "we missed one" signal we get.
 */
function ReferencePanel({ reference }: { reference: ReferenceComparison[] }) {
  return (
    <section className="scroll-y min-h-0 border-t border-[var(--separator)] p-3 xl:border-l xl:border-t-0">
      <h2 className="mb-1.5 text-[12px] font-semibold">Reference comparison</h2>
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-1">
        {reference.map((r) => (
          <div
            key={r.source}
            className={cn(
              "rounded-sm border p-2",
              r.status === "ok" && (r.lifts?.missing.length ?? 0) > 0
                ? "border-[var(--c-blocked)]/40 bg-[var(--c-blocked-bg)]"
                : "border-[var(--separator)] bg-[var(--bg)]"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-[11px] font-semibold">{SOURCE_TITLE[r.source]}</h3>
              <span
                className={cn(
                  "shrink-0 rounded-sm px-1 text-[10px] font-medium",
                  r.status === "ok"
                    ? "bg-[var(--c-pass-bg)] text-[var(--c-pass)]"
                    : "bg-[var(--fill)] text-[var(--label-3)]"
                )}
              >
                {r.status === "ok" ? "Compared" : "Unavailable"}
              </span>
            </div>

            {/* An unavailable source still says something. "Out of season" and
                "carries no counts" are answers, not blanks. */}
            <p className="mt-1 text-[10px] leading-snug text-[var(--label-3)]">{r.detail}</p>

            {r.lifts && (
              <>
                <dl className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                  <Stat label="published" value={r.lifts.referenceCount} />
                  <Stat label="extracted" value={r.lifts.extractedCount} />
                  <Stat label="matched" value={r.lifts.matchedCount} />
                  {r.lifts.extraCount > 0 && (
                    <Stat
                      label="ours only"
                      value={r.lifts.extraCount}
                      hint="Extracted lifts the operator's page does not name — often a drag lift the status feed ignores."
                    />
                  )}
                </dl>

                {r.lifts.missing.length > 0 && (
                  <div className="mt-1.5">
                    <p className="text-[10px] font-semibold text-[var(--c-blocked)]">
                      {r.lifts.missing.length} published lift
                      {r.lifts.missing.length === 1 ? "" : "s"} with no extracted counterpart
                    </p>
                    <ul className="mt-0.5 space-y-0.5">
                      {r.lifts.missing.map((name) => (
                        <li key={name} className="truncate text-[11px] font-medium">
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {r.runs && (
              <dl className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                <Stat label="runs published" value={r.runs.referenceCount ?? "—"} />
                <Stat label="runs extracted" value={r.runs.extractedCount} />
                {r.runs.deltaPct !== null && (
                  <Stat label="delta" value={`${r.runs.deltaPct > 0 ? "+" : ""}${r.runs.deltaPct}%`} />
                )}
              </dl>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1" title={hint}>
      <dt className="sr-only">{label}</dt>
      <dd className="tabular text-[11px] font-semibold">{value}</dd>
      <span className="text-[var(--label-3)]">{label}</span>
    </span>
  );
}

function VerdictButton({
  k,
  label,
  onClick,
}: {
  k: string;
  label: string;
  onClick: () => void;
}) {
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
