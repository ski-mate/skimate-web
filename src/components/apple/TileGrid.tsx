import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * The 2-up grid of half-width tiles. Tiles butt together with a hairline gap
 * and no outer container padding — the grid itself is full-bleed.
 */
export function TileGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 md:grid-cols-2", className)}>
      {children}
    </div>
  );
}
