"use client";

import Link from "next/link";
import { AtlasPanel } from "./AtlasPanel";
import { verticalDrop } from "@/content/resorts";
import type { Resort } from "@/content/resorts/types";

const m = (n: number) => `${n.toLocaleString("en-GB")} m`;

/**
 * The selected resort, in the shape Apple Maps gives a place card: name, a
 * secondary line, a status row, then the numbers. Coverage is stated plainly —
 * a catalogued resort links nowhere, because there is nothing to link to yet.
 */
export function AtlasResortCard({
  resort,
  onClose,
}: {
  resort: Resort;
  onClose: () => void;
}) {
  const live = resort.coverage === "live";

  return (
    <AtlasPanel className="w-[19rem] max-w-full overflow-hidden">
      <div className="flex items-start gap-2 px-4 pt-3.5">
        <div className="min-w-0 flex-1">
          <h2 className="type-title truncate text-label">{resort.name}</h2>
          <p className="type-caption mt-0.5 truncate text-label-3">
            {resort.region}, {resort.country}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--fill)] text-label-3 transition-colors hover:bg-[var(--fill-strong)] hover:text-label"
        >
          <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
            <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <p className="mt-2.5 flex items-center gap-1.5 px-4">
        <span
          aria-hidden="true"
          className="h-[7px] w-[7px] rounded-full"
          style={{ background: live ? "#007bfe" : "rgba(120,120,128,0.85)" }}
        />
        <span className="type-caption text-label-2">
          {live ? "Mapped and navigable in Alpline" : "Catalogued — not yet mapped"}
        </span>
      </p>

      <dl className="mt-3 grid grid-cols-3 border-t border-[var(--separator)]">
        <Stat label="Base" value={m(resort.altitudeMin)} />
        <Stat label="Summit" value={m(resort.altitudeMax)} border />
        <Stat label="Vertical" value={m(verticalDrop(resort))} border />
      </dl>

      {live ? (
        <div className="border-t border-[var(--separator)] px-4 py-2.5">
          <Link
            href={`/resorts/${resort.slug}`}
            className="type-footnote text-link hover:underline"
          >
            View {resort.name} →
          </Link>
        </div>
      ) : (
        <p className="type-caption border-t border-[var(--separator)] px-4 py-2.5 text-label-4">
          Piste and lift data lands here as we ingest each resort.
        </p>
      )}
    </AtlasPanel>
  );
}

function Stat({
  label,
  value,
  border,
}: {
  label: string;
  value: string;
  border?: boolean;
}) {
  return (
    <div className={`px-3 py-2.5 ${border ? "border-l border-[var(--separator)]" : ""}`}>
      <dt className="type-caption text-label-4">{label}</dt>
      <dd className="type-footnote mt-0.5 tabular-nums text-label">{value}</dd>
    </div>
  );
}
