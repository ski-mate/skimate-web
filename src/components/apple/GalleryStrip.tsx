import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Horizontal thumbnail strip. CSS scroll-snap rather than a JS carousel —
 * it keeps the keyboard and trackpad behaviour native and ships no JS.
 */
export function GalleryStrip({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "flex snap-x snap-mandatory gap-4 overflow-x-auto px-gutter pb-4",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
