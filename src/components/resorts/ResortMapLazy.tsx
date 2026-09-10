"use client";

import dynamic from "next/dynamic";
import type { Resort } from "@/content/resorts/types";

/**
 * The MapTiler SDK is ~340 kB. Loading it eagerly put /resorts at 484 kB of
 * First Load JS for what is decorative background behind a headline, so it is
 * split into its own chunk and fetched after paint. The placeholder keeps the
 * hero from shifting while it arrives.
 */
const ResortMap = dynamic(
  () => import("./ResortMap").then((m) => m.ResortMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-[var(--bg-elevated)]" />,
  }
);

export function ResortMapLazy({ resorts }: { resorts: Resort[] }) {
  return <ResortMap resorts={resorts} />;
}
