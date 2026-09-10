"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Keyboard-first plumbing.
 *
 * One analyst against 200 resorts means throughput is the feature, so every
 * queue in the console is driven from the home row: j/k to move, a single key
 * per verdict, `?` for the map of what is bound right now.
 *
 * Two rules make this safe to use everywhere:
 *   1. Bindings never fire while focus is in a text field, a select, or
 *      anything contenteditable — otherwise typing a note would file verdicts.
 *   2. A screen declares its bindings once and passes the same array to
 *      `useHotkeys` and `<ShortcutOverlay>`, so the help overlay cannot drift
 *      out of sync with what actually happens.
 */

export interface Binding {
  /** Lowercase single characters, or names like "ArrowDown" / "Enter". */
  keys: string[];
  label: string;
  group: string;
  run: () => void;
  disabled?: boolean;
  /** Show in the overlay but not in the inline hint strip. */
  secondary?: boolean;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable ||
    el.getAttribute("role") === "textbox"
  );
}

export function useHotkeys(bindings: Binding[], enabled = true) {
  const ref = useRef(bindings);
  ref.current = bindings;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      for (const b of ref.current) {
        if (b.disabled) continue;
        if (!b.keys.includes(key)) continue;
        e.preventDefault();
        b.run();
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

/**
 * Cursor over a queue. Holds an index rather than an id so that resolving the
 * item under the cursor advances to the next one instead of jumping to the top,
 * which is what makes a long queue feel like a single stream of decisions.
 */
export function useQueueCursor<T>(items: T[], keyOf: (item: T) => string) {
  const [index, setIndex] = useState(0);
  const clamped = items.length === 0 ? 0 : Math.min(index, items.length - 1);
  const current = items[clamped] ?? null;

  const move = useCallback(
    (delta: number) => {
      setIndex((i) => {
        if (items.length === 0) return 0;
        const next = Math.min(items.length - 1, Math.max(0, Math.min(i, items.length - 1) + delta));
        return next;
      });
    },
    [items.length]
  );

  const jumpTo = useCallback(
    (key: string) => {
      const i = items.findIndex((item) => keyOf(item) === key);
      if (i >= 0) setIndex(i);
    },
    [items, keyOf]
  );

  // Keep the cursor visible without hijacking the whole page's scroll.
  const currentKey = current ? keyOf(current) : null;
  useEffect(() => {
    if (!currentKey) return;
    const el = document.querySelector<HTMLElement>(`[data-queue-key="${CSS.escape(currentKey)}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [currentKey]);

  return { index: clamped, current, move, setIndex, jumpTo };
}

/** `?` opens a grouped map of every binding the current screen has declared. */
export function ShortcutOverlay({ bindings }: { bindings: Binding[] }) {
  const [open, setOpen] = useState(false);

  useHotkeys(
    useMemo(
      () => [
        { keys: ["?"], label: "Keyboard shortcuts", group: "General", run: () => setOpen((v) => !v) },
        { keys: ["Escape"], label: "Close", group: "General", run: () => setOpen(false) },
      ],
      []
    )
  );

  if (!open) return null;

  const groups = new Map<string, Binding[]>();
  for (const b of [...bindings, { keys: ["?"], label: "This overlay", group: "General", run: () => {} }]) {
    const list = groups.get(b.group) ?? [];
    list.push(b);
    groups.set(b.group, list);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={() => setOpen(false)}
    >
      <div
        className="max-h-full w-full max-w-[640px] overflow-y-auto rounded-large border border-[var(--separator)] bg-[var(--bg)] p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Keyboard shortcuts</h2>
          <button
            type="button"
            className="rounded-sm px-2 py-1 text-[12px] text-[var(--label-2)] hover:bg-[var(--fill)]"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {[...groups.entries()].map(([group, list]) => (
            <div key={group}>
              <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--label-3)]">
                {group}
              </h3>
              <ul className="space-y-1">
                {list.map((b, i) => (
                  <li key={`${group}:${i}`} className="flex items-baseline justify-between gap-3">
                    <span className="text-[12px] text-[var(--label-2)]">{b.label}</span>
                    <span className="flex shrink-0 gap-1">
                      {b.keys.map((k) => (
                        <kbd
                          key={k}
                          className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-[var(--separator)] bg-[var(--bg-elevated)] px-1 font-sans text-[10px] font-medium"
                        >
                          {k === " " ? "Space" : k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The inline strip under a queue, so the bindings are discoverable without `?`. */
export function ShortcutStrip({ bindings }: { bindings: Binding[] }) {
  const shown = bindings.filter((b) => !b.secondary && !b.disabled);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--separator)] px-3 py-1.5">
      {shown.map((b, i) => (
        <span key={i} className="inline-flex items-center gap-1 text-[11px] text-[var(--label-3)]">
          <kbd className="inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-[4px] border border-[var(--separator)] bg-[var(--bg-elevated)] px-1 font-sans text-[10px] font-medium text-[var(--label-2)]">
            {b.keys[0] === " " ? "Space" : b.keys[0]}
          </kbd>
          {b.label}
        </span>
      ))}
      <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--label-4)]">
        <kbd className="inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-[4px] border border-[var(--separator)] bg-[var(--bg-elevated)] px-1 font-sans text-[10px] font-medium">
          ?
        </kbd>
        all shortcuts
      </span>
    </div>
  );
}
