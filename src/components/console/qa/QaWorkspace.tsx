"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type {
  BBox,
  PlaceCandidate,
  QaCheck,
  QaWorkspaceResponse,
} from "@/lib/ingestion-api";
import { formatInstant } from "@/components/console/ui/primitives";
import { publishRegistryEntry } from "@/app/(console)/console/(workspace)/actions";
import { QaCompare } from "./QaCompare";

export function QaWorkspace({
  data,
  places,
  bbox,
}: {
  data: QaWorkspaceResponse;
  places: PlaceCandidate[];
  bbox: BBox;
}) {
  const router = useRouter();

  /**
   * Waivers are held locally and sent with the publish, so a failing check and
   * the decision to overrule it land in the same transaction. Waiving as a
   * separate step would let an entry sit "waived but unpublished", which is a
   * state nobody can interpret later.
   */
  const [waivers, setWaivers] = useState<Map<string, string>>(new Map());
  const [checklist, setChecklist] = useState(() =>
    Object.fromEntries(data.checklist.map((c) => [c.key, c.checked]))
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const failing = data.checks.filter((c) => c.status === "fail");
  const unwaived = failing.filter((c) => !waivers.has(c.id));
  const uncheckedCount = data.checklist.filter((c) => !checklist[c.key]).length;
  const canPublish = unwaived.length === 0 && uncheckedCount === 0;

  const flaggedItems = useMemo(
    () => data.checks.flatMap((c) => (c.status === "pass" ? [] : c.items)),
    [data.checks]
  );

  const points = useMemo(
    () => places.map((p) => ({ id: p.id, point: p.point, name: p.name })),
    [places]
  );

  return (
    <div className="flex h-full min-h-0">
      <div className="min-h-0 min-w-0 flex-1">
        <QaCompare
          bbox={bbox}
          points={points}
          flagged={flaggedItems}
          pisteMap={data.pisteMaps[0] ?? null}
        />
      </div>

      <div className="scroll-y flex w-[452px] shrink-0 flex-col border-l border-[var(--separator)] bg-[var(--bg)]">
        <div className="border-b border-[var(--separator)] px-3 py-2">
          <h2 className="text-[12px] font-semibold">Pre-publish checks</h2>
          <p className="mt-0.5 text-[11px] leading-snug text-[var(--label-3)]">
            These run before you look. Anything still failing must be waived with a reason, and the
            waiver is recorded against your name.
          </p>
        </div>

        <div className="space-y-1.5 border-b border-[var(--separator)] p-3">
          {data.checks.map((check) => (
            <CheckCard
              key={check.id}
              check={check}
              waiverReason={waivers.get(check.id) ?? null}
              onWaive={(reason) =>
                setWaivers((m) => {
                  const next = new Map(m);
                  if (reason === null) next.delete(check.id);
                  else next.set(check.id, reason);
                  return next;
                })
              }
            />
          ))}
        </div>

        <CountDeltas counts={data.counts} />

        <div className="border-b border-[var(--separator)] p-3">
          <h2 className="mb-1.5 text-[12px] font-semibold">
            Human checklist{" "}
            <span className="tabular ml-1 rounded-sm bg-[var(--fill)] px-1 text-[11px] font-medium text-[var(--label-2)]">
              {data.checklist.length - uncheckedCount}/{data.checklist.length}
            </span>
          </h2>
          <ul className="space-y-1.5">
            {data.checklist.map((c) => (
              <li key={c.key}>
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={checklist[c.key] ?? false}
                    onChange={(e) =>
                      setChecklist((s) => ({ ...s, [c.key]: e.target.checked }))
                    }
                    className="mt-0.5 size-3.5 shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block text-[12px]">{c.label}</span>
                    <span className="block text-[10px] leading-snug text-[var(--label-3)]">
                      {c.hint}
                    </span>
                    {c.checkedBy && c.checkedAt && (
                      <span className="block text-[10px] text-[var(--label-4)]">
                        Last confirmed by {c.checkedBy}, {formatInstant(c.checkedAt)}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto space-y-2 border-t border-[var(--separator)] p-3">
          {!canPublish && (
            <p className="text-[11px] text-[var(--label-3)]">
              {unwaived.length > 0 && (
                <>
                  {unwaived.length} failing check{unwaived.length === 1 ? "" : "s"} still unwaived
                  {uncheckedCount > 0 && ", "}
                </>
              )}
              {uncheckedCount > 0 && (
                <>
                  {uncheckedCount} checklist item{uncheckedCount === 1 ? "" : "s"} unconfirmed
                </>
              )}
              .
            </p>
          )}

          {waivers.size > 0 && (
            <p className="rounded-sm bg-[var(--c-waived-bg)] px-2 py-1.5 text-[11px] text-[var(--c-waived)]">
              Publishing will record {waivers.size} waiver{waivers.size === 1 ? "" : "s"} against
              your name.
            </p>
          )}

          <button
            type="button"
            disabled={busy || !canPublish}
            onClick={async () => {
              setBusy(true);
              setResult(null);
              try {
                const res = await publishRegistryEntry(data.registryId, {
                  waivers: [...waivers.entries()].map(([checkId, reason]) => ({ checkId, reason })),
                  checklist: data.checklist.map((c) => ({
                    key: c.key,
                    checked: checklist[c.key] ?? false,
                  })),
                });
                setResult(
                  res.published
                    ? { ok: true, message: `Published version ${res.version}.` }
                    : { ok: false, message: `Refused: ${res.blockedBy.join("; ")}` }
                );
                if (res.published) router.refresh();
              } catch (e) {
                setResult({
                  ok: false,
                  message: e instanceof Error ? e.message : "Publish failed.",
                });
              } finally {
                setBusy(false);
              }
            }}
            className="h-8 w-full rounded-sm bg-[var(--c-pass)] text-[12px] font-semibold text-black disabled:opacity-35"
          >
            {busy ? "Publishing…" : "Publish"}
          </button>

          {result && (
            <p
              role="status"
              className={cn(
                "rounded-sm px-2 py-1.5 text-[11px]",
                result.ok
                  ? "bg-[var(--c-pass-bg)] text-[var(--c-pass)]"
                  : "bg-[var(--c-blocked-bg)] text-[var(--c-blocked)]"
              )}
            >
              {result.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckCard({
  check,
  waiverReason,
  onWaive,
}: {
  check: QaCheck;
  waiverReason: string | null;
  onWaive: (reason: string | null) => void;
}) {
  const [open, setOpen] = useState(check.status === "fail");
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState("");

  const tone =
    check.status === "fail"
      ? "border-[var(--c-blocked)]/40 bg-[var(--c-blocked-bg)]"
      : check.status === "warn"
        ? "border-[var(--c-warn)]/40 bg-[var(--c-warn-bg)]"
        : check.status === "waived"
          ? "border-[var(--c-waived)]/40 bg-[var(--c-waived-bg)]"
          : "border-[var(--separator)] bg-[var(--bg)]";

  const label =
    waiverReason !== null
      ? "Waived"
      : check.status === "pass"
        ? "Pass"
        : check.status === "warn"
          ? "Warn"
          : check.status === "waived"
            ? "Waived"
            : "Fail";

  return (
    <div className={cn("rounded-sm border p-2", waiverReason !== null ? "border-[var(--c-waived)]/40 bg-[var(--c-waived-bg)]" : tone)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span className="truncate text-[12px] font-medium">{check.title}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          {check.count > 0 && (
            <span className="tabular text-[11px] text-[var(--label-3)]">{check.count}</span>
          )}
          <span className="rounded-sm bg-[var(--bg)]/60 px-1 text-[10px] font-medium">{label}</span>
        </span>
      </button>

      {open && (
        <>
          <p className="mt-1 text-[11px] leading-snug text-[var(--label-2)]">{check.detail}</p>
          {check.items.length > 0 && (
            <ul className="mt-1.5 max-h-[132px] space-y-0.5 overflow-y-auto">
              {check.items.map((i) => (
                <li key={i.id} className="text-[10px] leading-snug text-[var(--label-3)]">
                  <span className="font-medium text-[var(--label-2)]">{i.label}</span> — {i.detail}
                </li>
              ))}
            </ul>
          )}

          {waiverReason !== null ? (
            <p className="mt-1.5 flex items-start justify-between gap-2 text-[10px] text-[var(--c-waived)]">
              <span>Waiver: {waiverReason}</span>
              <button type="button" onClick={() => onWaive(null)} className="shrink-0 underline">
                Undo
              </button>
            </p>
          ) : check.status === "fail" && !writing ? (
            <button
              type="button"
              onClick={() => setWriting(true)}
              className="mt-1.5 text-[11px] text-[var(--label-3)] underline hover:text-[var(--label-2)]"
            >
              Waive with reason
            </button>
          ) : null}

          {writing && waiverReason === null && (
            <div className="mt-1.5 space-y-1">
              <textarea
                autoFocus
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Why is publishing correct despite this? Recorded with the publish."
                className="w-full rounded-sm border border-[var(--separator)] bg-[var(--bg)] p-1.5 text-[11px] outline-none focus:border-[var(--link)]"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={!draft.trim()}
                  onClick={() => {
                    onWaive(draft.trim());
                    setWriting(false);
                  }}
                  className="h-6 rounded-sm bg-[var(--c-waived)] px-2 text-[11px] font-medium text-white disabled:opacity-40"
                >
                  Waive
                </button>
                <button
                  type="button"
                  onClick={() => setWriting(false)}
                  className="h-6 rounded-sm border border-[var(--separator)] px-2 text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CountDeltas({ counts }: { counts: QaWorkspaceResponse["counts"] }) {
  const keys = Object.keys(counts.current);
  return (
    <div className="border-b border-[var(--separator)] p-3">
      <h2 className="mb-1.5 text-[12px] font-semibold">Counts vs previous run</h2>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-[10px] text-[var(--label-3)]">
            <th className="text-left font-medium">Entity</th>
            <th className="text-right font-medium">Previous</th>
            <th className="text-right font-medium">Current</th>
            <th className="text-right font-medium">Δ</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => {
            const cur = counts.current[k] ?? 0;
            const prev = counts.previous?.[k] ?? null;
            const delta = prev === null ? null : cur - prev;
            return (
              <tr key={k} className="border-t border-[var(--separator)]">
                <td className="py-1 capitalize">{k}</td>
                <td className="tabular py-1 text-right text-[var(--label-3)]">{prev ?? "—"}</td>
                <td className="tabular py-1 text-right">{cur}</td>
                <td
                  className={cn(
                    "tabular py-1 text-right",
                    delta === null
                      ? "text-[var(--label-4)]"
                      : Math.abs(delta) > 25
                        ? "text-[var(--c-warn)]"
                        : "text-[var(--label-3)]"
                  )}
                >
                  {delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
