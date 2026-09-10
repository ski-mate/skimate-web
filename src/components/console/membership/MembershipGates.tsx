"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  BBox,
  GateKey,
  MembershipActionsRequest,
  MembershipResponse,
  OrphanPlace,
  ValidationGate,
} from "@/lib/ingestion-api";
import { EmptyState, GateChip } from "@/components/console/ui/primitives";
import { VirtualList } from "@/components/console/ui/VirtualList";
import {
  ShortcutOverlay,
  ShortcutStrip,
  useHotkeys,
  useQueueCursor,
  type Binding,
} from "@/components/console/useKeyboard";
import { submitMembershipActions, waiveGate } from "@/app/(console)/console/(workspace)/actions";
import { MembershipMap, memberColor } from "./MembershipMap";

const ROW_H = 50;

type OrphanAction = MembershipActionsRequest["actions"][number];

export function MembershipGates({
  data,
  registryId,
}: {
  data: MembershipResponse;
  registryId: string;
}) {
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orphans = useMemo(
    () => data.orphans.map((o) => (resolved.has(o.id) ? { ...o, resolved: true } : o)),
    [data.orphans, resolved]
  );
  const queue = useMemo(() => orphans.filter((o) => !o.resolved), [orphans]);
  const cursor = useQueueCursor(queue, (o) => o.id);
  const active = cursor.current;

  const apply = useCallback(
    async (action: OrphanAction) => {
      setResolved((s) => new Set(s).add(action.orphanId));
      setError(null);
      try {
        await submitMembershipActions(data.runId, registryId, [action]);
      } catch (e) {
        setResolved((s) => {
          const next = new Set(s);
          next.delete(action.orphanId);
          return next;
        });
        setError(e instanceof Error ? e.message : "Could not save that resolution.");
      }
    },
    [data.runId, registryId]
  );

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const bindings: Binding[] = useMemo(
    () => [
      { keys: ["j", "ArrowDown"], label: "Next", group: "Navigate", run: () => cursor.move(1) },
      { keys: ["k", "ArrowUp"], label: "Previous", group: "Navigate", run: () => cursor.move(-1) },
      {
        keys: ["a"],
        label: "Assign to nearest",
        group: "Resolve",
        disabled: !active?.nearestMemberId,
        run: () =>
          active?.nearestMemberId &&
          void apply({ orphanId: active.id, action: "assign", resortId: active.nearestMemberId }),
      },
      {
        keys: ["c"],
        label: "Create member",
        group: "Resolve",
        disabled: !active,
        run: () => {
          setNewName(guessVillage(active));
          setCreating(true);
        },
      },
      {
        keys: ["f"],
        label: "Flag boundary",
        group: "Resolve",
        disabled: !active,
        run: () => active && void apply({ orphanId: active.id, action: "flag_boundary" }),
      },
      {
        keys: ["s"],
        label: "Skip",
        group: "Resolve",
        disabled: !active,
        run: () => active && void apply({ orphanId: active.id, action: "skip" }),
      },
    ],
    [active, apply, cursor]
  );

  useHotkeys(bindings, !creating);

  const blocking = data.gates.filter((g) => g.status === "fail" && g.blocking);

  return (
    <div className="flex h-full min-h-0">
      <ShortcutOverlay bindings={bindings} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Member legend — the map is only readable with it. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--separator)] bg-[var(--bg)] px-3 py-2 text-[11px]">
          {data.members.map((m) => (
            <span key={m.resortId} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-[8px] rounded-full"
                style={{ background: memberColor(m.colorIndex) }}
              />
              <span className="font-medium">{m.name}</span>
              <span className="tabular text-[var(--label-3)]">
                {m.placeCount} places · {m.liftCount} lifts
              </span>
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-3 text-[var(--label-3)]">
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-[9px] rounded-full border border-white/80"
                style={{ background: "transparent" }}
              />
              {data.multiMembershipCount} multi-member
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-[8px] rounded-full bg-[var(--c-blocked)]" />
              {queue.length} orphans
            </span>
          </span>
        </div>

        <div className="min-h-0 flex-1">
          <MembershipMap
            data={{ ...data, orphans }}
            activeOrphan={active}
            bbox={boundsOf(data)}
            onSelectOrphan={(id) => cursor.jumpTo(id)}
          />
        </div>
      </div>

      <div className="flex w-[452px] min-w-0 shrink-0 flex-col border-l border-[var(--separator)] bg-[var(--bg)]">
        {/* Gates first: they are what stops this entry advancing. */}
        <div className="shrink-0 border-b border-[var(--separator)]">
          <div className="flex items-center justify-between px-3 py-2">
            <h2 className="text-[12px] font-semibold">Validation gates</h2>
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
                blocking.length > 0
                  ? "bg-[var(--c-blocked-bg)] text-[var(--c-blocked)]"
                  : "bg-[var(--c-pass-bg)] text-[var(--c-pass)]"
              )}
            >
              {blocking.length > 0
                ? `${blocking.length} blocking Stage 3`
                : "Clear to advance to Stage 3"}
            </span>
          </div>
          <div className="scroll-y max-h-[46vh] space-y-1.5 px-3 pb-3">
            {data.gates.map((g) => (
              <GateCard key={g.key} gate={g} runId={data.runId} registryId={registryId} />
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-[var(--separator)] px-3 py-2">
          <h2 className="text-[12px] font-semibold">
            Orphan belt{" "}
            <span className="tabular ml-1 rounded-sm bg-[var(--fill)] px-1 text-[11px] font-medium text-[var(--label-2)]">
              {queue.length}
            </span>
          </h2>
          <span className="text-[11px] text-[var(--label-3)]">{busy ? "Saving…" : ""}</span>
        </div>

        {error && (
          <p role="alert" className="bg-[var(--c-blocked-bg)] px-3 py-1.5 text-[11px] text-[var(--c-blocked)]">
            {error}
          </p>
        )}

        {active && (
          <div className="shrink-0 space-y-2 border-b border-[var(--separator)] bg-[var(--bg-inset)] p-3">
            <div>
              <p className="text-[12px] font-medium">{active.place.name}</p>
              <p className="text-[11px] text-[var(--label-3)]">
                {active.place.category}
                {active.distanceM !== null && active.nearestMemberName && (
                  <> · {active.distanceM} m from {active.nearestMemberName}</>
                )}
              </p>
            </div>
            <p className="text-[11px] leading-snug text-[var(--label-2)]">{active.reason}</p>

            <div className="flex flex-wrap gap-1">
              <ActionButton
                k="a"
                label={
                  active.nearestMemberName ? `Assign to ${active.nearestMemberName}` : "Assign"
                }
                disabled={!active.nearestMemberId}
                onClick={() =>
                  active.nearestMemberId &&
                  void apply({
                    orphanId: active.id,
                    action: "assign",
                    resortId: active.nearestMemberId,
                  })
                }
              />
              <ActionButton
                k="c"
                label="Create member"
                onClick={() => {
                  setNewName(guessVillage(active));
                  setCreating(true);
                }}
              />
              <ActionButton
                k="f"
                label="Flag boundary"
                onClick={() => void apply({ orphanId: active.id, action: "flag_boundary" })}
              />
              <ActionButton
                k="s"
                label="Skip"
                onClick={() => void apply({ orphanId: active.id, action: "skip" })}
              />
            </div>

            {/* Assigning to a member other than the nearest is a normal move —
                the nearest boundary is not always the right one. */}
            <details className="text-[11px]">
              <summary className="cursor-pointer text-[var(--label-3)]">
                Assign to a different member
              </summary>
              <div className="mt-1 flex flex-wrap gap-1">
                {data.members.map((m) => (
                  <button
                    key={m.resortId}
                    type="button"
                    onClick={() =>
                      void apply({ orphanId: active.id, action: "assign", resortId: m.resortId })
                    }
                    className="inline-flex items-center gap-1 rounded-sm border border-[var(--separator)] px-1.5 py-0.5 hover:bg-[var(--fill)]"
                  >
                    <span
                      aria-hidden
                      className="size-[6px] rounded-full"
                      style={{ background: memberColor(m.colorIndex) }}
                    />
                    {m.name}
                  </button>
                ))}
              </div>
            </details>

            {creating && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newName.trim()) return;
                  setBusy(true);
                  setCreating(false);
                  await apply({
                    orphanId: active.id,
                    action: "create_member",
                    newMemberName: newName.trim(),
                    note: "Minted while resolving the orphan belt.",
                  });
                  setBusy(false);
                  setNewName("");
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setCreating(false)}
                  placeholder="New member resort name"
                  className="h-7 flex-1 rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-2 text-[12px] outline-none focus:border-[var(--link)]"
                />
                <button
                  type="submit"
                  className="h-7 rounded-sm bg-[var(--link-fill)] px-2 text-[11px] font-medium text-white"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="h-7 rounded-sm border border-[var(--separator)] px-2 text-[11px]"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1">
          {queue.length === 0 ? (
            <EmptyState
              title="Orphan belt is clear"
              detail="Every place inside the group extent is claimed by a member."
            />
          ) : (
            <VirtualList
              items={queue}
              rowHeight={ROW_H}
              activeIndex={cursor.index}
              ariaLabel="Unclaimed places"
              renderRow={(o, i) => (
                <button
                  key={o.id}
                  type="button"
                  data-queue-key={o.id}
                  data-active={i === cursor.index}
                  onMouseEnter={() => cursor.setIndex(i)}
                  onFocus={() => cursor.setIndex(i)}
                  onClick={() => cursor.setIndex(i)}
                  style={{ height: ROW_H }}
                  className="queue-row flex w-full flex-col justify-center gap-0.5 border-b border-[var(--separator)] px-3 text-left hover:bg-[var(--fill)]"
                >
                  <span className="truncate text-[12px] font-medium">{o.place.name}</span>
                  <span className="truncate text-[10px] text-[var(--label-3)]">
                    {o.place.category}
                    {o.distanceM !== null && ` · ${o.distanceM} m from ${o.nearestMemberName}`}
                  </span>
                </button>
              )}
            />
          )}
        </div>

        <ShortcutStrip bindings={bindings} />
      </div>
    </div>
  );
}

/**
 * Pre-fills the "create member" field from the orphan's own diagnosis. When the
 * pipeline already knows the place sits in an unmapped village, making the
 * analyst retype the name is pure friction.
 */
function guessVillage(orphan: OrphanPlace | null): string {
  if (!orphan) return "";
  const m = orphan.reason.match(/Sits in ([^,]+), which has no member boundary/);
  return m ? m[1].trim() : "";
}

function ActionButton({
  k,
  label,
  onClick,
  disabled,
}: {
  k: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-[var(--separator)] px-2 text-[11px] hover:bg-[var(--fill)] disabled:opacity-35"
    >
      <kbd className="inline-flex h-[15px] min-w-[15px] items-center justify-center rounded-[3px] border border-[var(--separator)] bg-[var(--bg)] px-0.5 font-sans text-[9px]">
        {k}
      </kbd>
      {label}
    </button>
  );
}

function GateCard({
  gate,
  runId,
  registryId,
}: {
  gate: ValidationGate;
  runId: string;
  registryId: string;
}) {
  const [waiving, setWaiving] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const failing = gate.status === "fail";

  // A gate that passes is not work. It collapses to one line so the gates that
  // are actually blocking get the vertical space and are never scrolled out of
  // sight behind a wall of green.
  if (!failing) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-2 py-1.5">
        <span className="truncate text-[11px] text-[var(--label-2)]" title={gate.detail}>
          {gate.title}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {gate.waiver && (
            <span
              className="max-w-[150px] truncate text-[10px] text-[var(--c-waived)]"
              title={`Waived by ${gate.waiver.actor}: ${gate.waiver.reason}`}
            >
              {gate.waiver.reason}
            </span>
          )}
          <GateChip status={gate.status} />
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-sm border p-2",
        failing
          ? "border-[var(--c-blocked)]/40 bg-[var(--c-blocked-bg)]"
          : "border-[var(--separator)] bg-[var(--bg)]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[12px] font-medium">{gate.title}</h3>
        <div className="flex items-center gap-1.5">
          {gate.count > 0 && <span className="tabular text-[11px] text-[var(--label-3)]">{gate.count}</span>}
          <GateChip status={gate.status} />
        </div>
      </div>

      <p className="mt-1 text-[11px] leading-snug text-[var(--label-2)]">{gate.detail}</p>

      {gate.evidence.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {gate.evidence.map((e) => (
            <li key={e.id} className="truncate text-[10px] text-[var(--label-3)]">
              <span className="font-medium text-[var(--label-2)]">{e.label}</span> — {e.detail}
            </li>
          ))}
        </ul>
      )}

      {gate.waiver && (
        <p className="mt-1.5 rounded-sm bg-[var(--c-waived-bg)] px-1.5 py-1 text-[10px] text-[var(--c-waived)]">
          Waived by {gate.waiver.actor}: {gate.waiver.reason}
        </p>
      )}

      {failing && !waiving && (
        <button
          type="button"
          onClick={() => setWaiving(true)}
          className="mt-1.5 text-[11px] text-[var(--label-3)] underline hover:text-[var(--label-2)]"
        >
          Waive this gate
        </button>
      )}

      {waiving && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!reason.trim()) return;
            setBusy(true);
            setErr(null);
            try {
              await waiveGate(runId, registryId, gate.key as GateKey, reason);
              setWaiving(false);
            } catch (error) {
              setErr(error instanceof Error ? error.message : "Could not waive.");
            } finally {
              setBusy(false);
            }
          }}
          className="mt-1.5 space-y-1"
        >
          <textarea
            autoFocus
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Why is it correct to advance despite this gate? Recorded against your name."
            className="w-full rounded-sm border border-[var(--separator)] bg-[var(--bg)] p-1.5 text-[11px] outline-none focus:border-[var(--link)]"
          />
          <div className="flex items-center gap-1.5">
            <button
              type="submit"
              disabled={busy || !reason.trim()}
              className="h-6 rounded-sm bg-[var(--c-waived)] px-2 text-[11px] font-medium text-white disabled:opacity-40"
            >
              {busy ? "Waiving…" : "Waive with reason"}
            </button>
            <button
              type="button"
              onClick={() => setWaiving(false)}
              className="h-6 rounded-sm border border-[var(--separator)] px-2 text-[11px]"
            >
              Cancel
            </button>
            {err && <span className="text-[10px] text-[var(--c-blocked)]">{err}</span>}
          </div>
        </form>
      )}
    </div>
  );
}

function boundsOf(data: MembershipResponse): BBox {
  const pts = [...data.places.map((p) => p.point), ...data.orphans.map((o) => o.place.point)];
  if (pts.length === 0) return [6.4, 45.2, 6.8, 45.5];
  const lngs = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}
