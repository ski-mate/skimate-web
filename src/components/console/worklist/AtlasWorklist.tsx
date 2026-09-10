"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Stage, WorklistResponse, WorklistRow } from "@/lib/ingestion-api";
import {
  Metric,
  PriorityDot,
  ProgressBar,
  StageBadge,
  relativeTime,
  stageLabel,
} from "@/components/console/ui/primitives";
import { VirtualList } from "@/components/console/ui/VirtualList";
import {
  ShortcutOverlay,
  ShortcutStrip,
  useHotkeys,
  useQueueCursor,
  type Binding,
} from "@/components/console/useKeyboard";
import { WorklistMap } from "./WorklistMap";

const ROW_H = 34;

/** Column widths shared by the header and every row, so they cannot drift. */
const GRID =
  "grid grid-cols-[14px_minmax(150px,1.5fr)_100px_minmax(160px,1.3fr)_158px_66px_62px_58px] items-center gap-2 px-3";

const STAGE_ORDER: Stage[] = [
  "not_started",
  "identity",
  "harvested",
  "membership",
  "enriched",
  "qa",
  "published",
  "needs_rerun",
];

type Sort = "next_action" | "name" | "last_run" | "cost";

export function AtlasWorklist({ data }: { data: WorklistResponse }) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<Stage | "all">("all");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("next_action");
  const [showMap, setShowMap] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = data.rows.filter((r) => {
      if (stage !== "all" && r.stage !== stage) return false;
      if (blockedOnly && r.nextAction.priority !== "blocked") return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        (r.groupName ?? "").toLowerCase().includes(q)
      );
    });

    out = [...out].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "cost":
          return b.costIncurredUsd - a.costIncurredUsd || a.name.localeCompare(b.name);
        case "last_run":
          return (b.lastRunAt ?? "").localeCompare(a.lastRunAt ?? "") || a.name.localeCompare(b.name);
        default:
          return a.nextAction.rank - b.nextAction.rank || a.name.localeCompare(b.name);
      }
    });
    return out;
  }, [data.rows, query, stage, blockedOnly, sort]);

  const cursor = useQueueCursor(rows, (r) => r.registryId);
  const active = cursor.current;

  const bindings: Binding[] = useMemo(
    () => [
      { keys: ["j", "ArrowDown"], label: "Next", group: "Navigate", run: () => cursor.move(1) },
      { keys: ["k", "ArrowUp"], label: "Previous", group: "Navigate", run: () => cursor.move(-1) },
      {
        keys: ["Enter", "o"],
        label: "Open next action",
        group: "Navigate",
        run: () => active && router.push(active.nextAction.href),
        disabled: !active,
      },
      {
        keys: ["/"],
        label: "Search",
        group: "Filter",
        run: () => searchRef.current?.focus(),
      },
      {
        keys: ["b"],
        label: "Blocked only",
        group: "Filter",
        run: () => setBlockedOnly((v) => !v),
      },
      { keys: ["m"], label: "Map", group: "View", run: () => setShowMap((v) => !v) },
      {
        keys: ["g"],
        label: "Clear filters",
        group: "Filter",
        secondary: true,
        run: () => {
          setQuery("");
          setStage("all");
          setBlockedOnly(false);
        },
      },
    ],
    [active, cursor, router]
  );

  useHotkeys(bindings);

  const blocked = data.rows.filter((r) => r.nextAction.priority === "blocked").length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ShortcutOverlay bindings={bindings} />

      {/* Global progress — the one-glance answer to "how far through are we". */}
      <header className="shrink-0 border-b border-[var(--separator)] bg-[var(--bg)] px-4 py-3">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[15px] font-semibold">Atlas worklist</h1>
            <p className="mt-0.5 text-[12px] text-[var(--label-3)]">
              {data.summary.total} registry entries · {rows.length} shown
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-7">
            <Metric
              label="Blocked"
              value={blocked}
              tone={blocked > 0 ? "blocked" : "neutral"}
              hint="Entries that cannot advance until you clear a gate or approve a spend"
            />
            <Metric
              label="Gates failing"
              value={data.summary.gatesFailing}
              tone={data.summary.gatesFailing > 0 ? "blocked" : "pass"}
            />
            <Metric
              label="Awaiting spend"
              value={data.summary.awaitingSpendApproval}
              tone={data.summary.awaitingSpendApproval > 0 ? "warn" : "neutral"}
            />
            <Metric label="Spend to date" value={`$${data.summary.costToDateUsd.toFixed(0)}`} />
            <div className="min-w-[168px]">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[11px] text-[var(--label-3)]">Published</span>
                <span className="tabular text-[13px] font-semibold">
                  {data.summary.published}/{data.summary.total}
                </span>
              </div>
              <ProgressBar value={data.summary.published} total={data.summary.total} />
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--separator)] bg-[var(--bg)] px-3 py-2">
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") e.currentTarget.blur();
          }}
          placeholder="Search name, region, country…"
          aria-label="Search the worklist"
          className="h-7 w-[240px] rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-2 text-[12px] outline-none focus:border-[var(--link)]"
        />

        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as Stage | "all")}
          aria-label="Filter by stage"
          className="h-7 rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-1.5 text-[12px]"
        >
          <option value="all">All stages</option>
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>
              {stageLabel(s)} ({data.summary.byStage[s] ?? 0})
            </option>
          ))}
        </select>

        <label className="flex h-7 cursor-pointer items-center gap-1.5 rounded-sm border border-[var(--separator)] px-2 text-[12px]">
          <input
            type="checkbox"
            checked={blockedOnly}
            onChange={(e) => setBlockedOnly(e.target.checked)}
            className="size-3"
          />
          Blocked only
        </label>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Sort"
          className="h-7 rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-1.5 text-[12px]"
        >
          <option value="next_action">Sort: next action needed</option>
          <option value="name">Sort: name</option>
          <option value="last_run">Sort: last run</option>
          <option value="cost">Sort: cost</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/console/onboarding"
            className="flex h-7 items-center rounded-sm bg-[var(--link-fill)] px-2.5 text-[12px] font-medium text-white hover:bg-[var(--link-fill-hover)]"
          >
            Onboard a resort
          </Link>
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            aria-pressed={showMap}
            className={cn(
              "h-7 rounded-sm border px-2.5 text-[12px]",
              showMap
                ? "border-[var(--link)] bg-[var(--c-ready-bg)] text-[var(--c-ready)]"
                : "border-[var(--separator)] hover:bg-[var(--fill)]"
            )}
          >
            Map
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            className={cn(
              GRID,
              "h-7 shrink-0 border-b border-[var(--separator)] bg-[var(--bg-inset)] text-[11px] font-medium text-[var(--label-3)]"
            )}
          >
            <span />
            <span>Entry</span>
            <span>Stage</span>
            <span>Next action</span>
            <span>Signals</span>
            <span className="text-right">Last run</span>
            <span className="text-right">Cost</span>
            <span className="text-right">Places</span>
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-8 text-[12px] text-[var(--label-3)]">
              Nothing matches those filters.
            </div>
          ) : (
            <VirtualList
              items={rows}
              rowHeight={ROW_H}
              activeIndex={cursor.index}
              ariaLabel="Registry entries"
              className="bg-[var(--bg)]"
              renderRow={(r, i) => (
                <WorklistRowView
                  key={r.registryId}
                  row={r}
                  active={i === cursor.index}
                  onFocus={() => cursor.setIndex(i)}
                />
              )}
            />
          )}

          <ShortcutStrip bindings={bindings} />
        </div>

        {showMap && (
          <div className="min-h-0 w-[46%] shrink-0 border-l border-[var(--separator)]">
            <WorklistMap
              rows={rows}
              selectedId={active?.registryId ?? null}
              onSelect={(id) => cursor.jumpTo(id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Signal({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "blocked" | "warn" | "ready";
}) {
  if (value === 0) return null;
  return (
    <span
      title={`${value} ${label}`}
      className={cn(
        "tabular inline-flex h-[17px] items-center gap-0.5 rounded-sm px-1 text-[10px] font-medium",
        tone === "blocked" && "bg-[var(--c-blocked-bg)] text-[var(--c-blocked)]",
        tone === "warn" && "bg-[var(--c-warn-bg)] text-[var(--c-warn)]",
        tone === "ready" && "bg-[var(--c-ready-bg)] text-[var(--c-ready)]"
      )}
    >
      {value}
      <span className="opacity-70">{label}</span>
    </span>
  );
}

function WorklistRowView({
  row,
  active,
  onFocus,
}: {
  row: WorklistRow;
  active: boolean;
  onFocus: () => void;
}) {
  return (
    <Link
      href={row.nextAction.href}
      data-queue-key={row.registryId}
      data-active={active}
      onMouseEnter={onFocus}
      onFocus={onFocus}
      style={{ height: ROW_H }}
      className={cn(
        GRID,
        "queue-row border-b border-[var(--separator)] text-[12px] hover:bg-[var(--fill)]"
      )}
    >
      <PriorityDot priority={row.nextAction.priority} />

      <span className="flex min-w-0 items-baseline gap-1.5">
        <span className="truncate font-medium">{row.name}</span>
        {row.kind === "group" && (
          <span
            className="shrink-0 rounded-sm bg-[var(--fill)] px-1 text-[10px] text-[var(--label-3)]"
            title={`Group of ${row.memberCount} member resorts`}
          >
            group {row.memberCount}
          </span>
        )}
        {row.groupName && (
          <span className="truncate text-[11px] text-[var(--label-4)]" title={`Part of ${row.groupName}`}>
            {row.groupName}
          </span>
        )}
      </span>

      <StageBadge stage={row.stage} />

      <span
        className={cn(
          "truncate",
          row.nextAction.priority === "blocked"
            ? "font-medium text-[var(--c-blocked)]"
            : "text-[var(--label-2)]"
        )}
      >
        {row.nextAction.label}
      </span>

      <span className="flex items-center gap-1 overflow-hidden">
        <Signal value={row.gateFailures} label="gate" tone="blocked" />
        <Signal value={row.openConflicts} label="conf" tone="ready" />
        <Signal value={row.orphanCount} label="orph" tone="warn" />
        <Signal value={row.qaFailures} label="qa" tone="warn" />
      </span>

      <span className="tabular truncate text-right text-[11px] text-[var(--label-3)]">
        {relativeTime(row.lastRunAt)}
      </span>
      <span className="tabular text-right text-[11px] text-[var(--label-3)]">
        {row.costIncurredUsd > 0 ? `$${row.costIncurredUsd.toFixed(0)}` : "—"}
      </span>
      <span className="tabular text-right text-[11px] text-[var(--label-3)]">
        {row.placeCount.toLocaleString()}
      </span>
    </Link>
  );
}
