"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ValidationGate } from "@/lib/ingestion-api";
import { GateChip } from "./primitives";

const EVIDENCE_SHOWN = 6;

/**
 * One validation gate, with waive-with-reason.
 *
 * Shared between the membership gates (screen 4, run-scoped) and the routing
 * coverage gates (screen 8, registry-scoped). The two differ only in which
 * endpoint the waiver goes to, so the card takes an `onWaive` callback and
 * knows nothing about either — the alternative was two cards that would drift
 * apart the first time one of them grew a field.
 */
export function GateCard({
  gate,
  onWaive,
  waiveHint = "Why is it correct to advance despite this gate? Recorded against your name.",
}: {
  gate: ValidationGate;
  onWaive: (reason: string) => Promise<unknown>;
  waiveHint?: string;
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
          <GateChip status={gate.status} blocking={gate.blocking} />
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-sm border p-2",
        gate.blocking
          ? "border-[var(--c-blocked)]/40 bg-[var(--c-blocked-bg)]"
          : "border-[var(--c-warn)]/40 bg-[var(--c-warn-bg)]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[12px] font-medium">{gate.title}</h3>
        <div className="flex items-center gap-1.5">
          {gate.count > 0 && (
            <span className="tabular text-[11px] text-[var(--label-3)]">{gate.count}</span>
          )}
          <GateChip status={gate.status} blocking={gate.blocking} />
        </div>
      </div>

      <p className="mt-1 text-[11px] leading-snug text-[var(--label-2)]">{gate.detail}</p>

      {/* Evidence is capped server-side but not tightly — the real backend
          returns a dozen named offenders for a badly connected domain, which
          pushes the waive control off the card. Six is enough to recognise the
          pattern; the queue beside it is where you work through the rest. */}
      {gate.evidence.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {gate.evidence.slice(0, EVIDENCE_SHOWN).map((e) => (
            <li key={e.id} className="truncate text-[10px] text-[var(--label-3)]">
              <span className="font-medium text-[var(--label-2)]">{e.label}</span> — {e.detail}
            </li>
          ))}
          {gate.evidence.length > EVIDENCE_SHOWN && (
            <li className="text-[10px] text-[var(--label-4)]">
              and {gate.evidence.length - EVIDENCE_SHOWN} more — the findings queue has all of them
            </li>
          )}
        </ul>
      )}

      {gate.waiver && (
        <p className="mt-1.5 rounded-sm bg-[var(--c-waived-bg)] px-1.5 py-1 text-[10px] text-[var(--c-waived)]">
          Waived by {gate.waiver.actor}: {gate.waiver.reason}
        </p>
      )}

      {!waiving && (
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
              await onWaive(reason.trim());
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
            placeholder={waiveHint}
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
