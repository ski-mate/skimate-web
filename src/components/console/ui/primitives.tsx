import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { GateStatus, NextAction, RefSource, Stage } from "@/lib/ingestion-api";

/* ── stage and priority ───────────────────────────────────────────────────── */

const STAGE_LABEL: Record<Stage, string> = {
  not_started: "Not started",
  identity: "Identity",
  harvested: "Harvested",
  membership: "Membership",
  enriched: "Enriched",
  qa: "QA",
  published: "Published",
  needs_rerun: "Needs re-run",
};

const STAGE_TONE: Record<Stage, string> = {
  not_started: "bg-[var(--fill)] text-[var(--label-3)]",
  identity: "bg-[var(--c-waiting-bg)] text-[var(--label-2)]",
  harvested: "bg-[var(--c-ready-bg)] text-[var(--c-ready)]",
  membership: "bg-[var(--c-ready-bg)] text-[var(--c-ready)]",
  enriched: "bg-[var(--c-waived-bg)] text-[var(--c-waived)]",
  qa: "bg-[var(--c-warn-bg)] text-[var(--c-warn)]",
  published: "bg-[var(--c-pass-bg)] text-[var(--c-pass)]",
  needs_rerun: "bg-[var(--c-blocked-bg)] text-[var(--c-blocked)]",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span
      className={cn(
        "inline-flex h-[19px] shrink-0 items-center rounded-sm px-1.5 text-[11px] font-medium",
        STAGE_TONE[stage]
      )}
    >
      {STAGE_LABEL[stage]}
    </span>
  );
}

export function stageLabel(stage: Stage) {
  return STAGE_LABEL[stage];
}

const PRIORITY_COLOR: Record<NextAction["priority"], string> = {
  blocked: "var(--c-blocked)",
  ready: "var(--c-ready)",
  waiting: "var(--c-waiting)",
  done: "var(--c-pass)",
};

export function PriorityDot({
  priority,
  className,
}: {
  priority: NextAction["priority"];
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-[7px] shrink-0 rounded-full", className)}
      style={{ background: PRIORITY_COLOR[priority] }}
    />
  );
}

/* ── gates ────────────────────────────────────────────────────────────────── */

const GATE_TONE: Record<GateStatus, { chip: string; label: string }> = {
  pass: { chip: "bg-[var(--c-pass-bg)] text-[var(--c-pass)]", label: "Pass" },
  fail: { chip: "bg-[var(--c-blocked-bg)] text-[var(--c-blocked)]", label: "Blocking" },
  waived: { chip: "bg-[var(--c-waived-bg)] text-[var(--c-waived)]", label: "Waived" },
  not_run: { chip: "bg-[var(--fill)] text-[var(--label-3)]", label: "Not run" },
};

export function GateChip({ status }: { status: GateStatus }) {
  const t = GATE_TONE[status];
  return (
    <span className={cn("inline-flex h-[19px] items-center rounded-sm px-1.5 text-[11px] font-medium", t.chip)}>
      {t.label}
    </span>
  );
}

/* ── provenance ───────────────────────────────────────────────────────────── */

const SOURCE_COLOR: Record<RefSource, string> = {
  osm: "var(--c-osm)",
  overture: "var(--c-overture)",
  fsq: "var(--c-fsq)",
  wikidata: "var(--c-wikidata)",
  skimap: "var(--c-wikidata)",
  tripadvisor: "var(--c-fsq)",
  manual: "var(--c-manual)",
};

const SOURCE_LABEL: Record<RefSource, string> = {
  osm: "OSM",
  overture: "Overture",
  fsq: "Foursquare",
  wikidata: "Wikidata",
  skimap: "Skimap",
  tripadvisor: "Tripadvisor",
  manual: "Manual",
};

/** Per-field provenance, rendered small enough to sit inline beside a value. */
export function SourceChip({ source, field }: { source: RefSource; field?: string }) {
  return (
    <span
      className="inline-flex h-[17px] items-center gap-1 rounded-sm px-1 text-[10px] font-medium"
      style={{ background: `color-mix(in srgb, ${SOURCE_COLOR[source]} 14%, transparent)` }}
      title={field ? `${field} came from ${SOURCE_LABEL[source]}` : SOURCE_LABEL[source]}
    >
      <span aria-hidden className="size-[5px] rounded-full" style={{ background: SOURCE_COLOR[source] }} />
      <span style={{ color: SOURCE_COLOR[source] }}>{field ?? SOURCE_LABEL[source]}</span>
    </span>
  );
}

export { SOURCE_COLOR, SOURCE_LABEL };

/* ── layout ───────────────────────────────────────────────────────────────── */

export function Panel({
  title,
  count,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  count?: number;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-card border border-[var(--separator)] bg-[var(--bg)]",
        className
      )}
    >
      {title !== undefined && (
        <header className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-[var(--separator)] px-3">
          <h2 className="flex items-center gap-1.5 text-[12px] font-semibold">
            {title}
            {count !== undefined && (
              <span className="tabular rounded-sm bg-[var(--fill)] px-1 text-[11px] font-medium text-[var(--label-2)]">
                {count}
              </span>
            )}
          </h2>
          {actions}
        </header>
      )}
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Metric({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: ReactNode;
  tone?: "blocked" | "warn" | "pass" | "neutral";
  hint?: string;
}) {
  const color =
    tone === "blocked"
      ? "var(--c-blocked)"
      : tone === "warn"
        ? "var(--c-warn)"
        : tone === "pass"
          ? "var(--c-pass)"
          : "var(--label)";
  return (
    <div title={hint}>
      <div className="tabular text-[20px] font-semibold leading-tight" style={{ color }}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-[var(--label-3)]">{label}</div>
    </div>
  );
}

/** A keyboard hint. The console is keyboard-first, so these are load-bearing. */
export function KeyHint({ k, label }: { k: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--label-3)]">
      <kbd className="inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-[4px] border border-[var(--separator)] bg-[var(--bg-elevated)] px-1 font-sans text-[10px] font-medium text-[var(--label-2)]">
        {k}
      </kbd>
      {label}
    </span>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 p-8 text-center">
      <p className="text-[13px] font-medium text-[var(--label-2)]">{title}</p>
      {detail && <p className="max-w-[42ch] text-[12px] text-[var(--label-3)]">{detail}</p>}
    </div>
  );
}

export function ProgressBar({
  value,
  total,
  tone = "var(--c-pass)",
  className,
}: {
  value: number;
  total: number;
  tone?: string;
  className?: string;
}) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div
      className={cn("h-[4px] w-full overflow-hidden rounded-pill bg-[var(--fill-strong)]", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <div className="h-full rounded-pill transition-[width]" style={{ width: `${pct}%`, background: tone }} />
    </div>
  );
}

/**
 * Timestamps are rendered in UTC with a fixed locale.
 *
 * `toLocaleString()` resolves against the runtime's locale and timezone, which
 * are Node's on the server and the browser's on the client — so it produced a
 * hydration mismatch on every screen that showed one. Pinning both also means
 * two analysts in different timezones quote the same string to each other,
 * which matters for an audit trail.
 */
export function formatInstant(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(
    d.getUTCHours()
  )}:${p(d.getUTCMinutes())} UTC`;
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : `${Math.round(d / 30)}mo ago`;
}
