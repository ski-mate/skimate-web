"use client";

import dynamic from "next/dynamic";
import type { Resort } from "@/content/resorts/types";

/**
 * The MapTiler SDK and its MapLibre core are ~600 kB. /map is the one route
 * that genuinely needs them, so they load as a route-level chunk after paint
 * rather than entering the shared bundle every other page pays for.
 */
const Atlas = dynamic(() => import("@/components/map/Atlas").then((m) => m.Atlas), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100svh-var(--nav-h))] min-h-[660px] items-center justify-center bg-bg-elevated">
      <p className="type-callout text-label-3">Loading the Atlas…</p>
    </div>
  ),
});

export function MapClient({ resorts }: { resorts: Resort[] }) {
  return <Atlas resorts={resorts} />;
}
