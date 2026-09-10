"use client";

import dynamic from "next/dynamic";
import type { ConsoleMapProps } from "./ConsoleMap";

/**
 * The MapTiler SDK is ~340 kB. Every console screen has work to do that does
 * not need it — queues, gates, cost tables — so it loads after paint and the
 * pane holds its space in the meantime.
 */
const Inner = dynamic(() => import("./ConsoleMap").then((m) => m.ConsoleMap), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[var(--bg-elevated)]" />,
});

export function ConsoleMapLazy(props: ConsoleMapProps) {
  return <Inner {...props} />;
}
