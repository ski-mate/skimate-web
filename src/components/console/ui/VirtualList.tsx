"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fixed-height windowing.
 *
 * The console routinely shows lists that are long enough to matter: 200 registry
 * entries, ~180 harvest conflicts on a domain, 600 places in a group. Rendering
 * all of them costs a visible fraction of a second per keystroke, which is fatal
 * for a queue you drive with j/k.
 *
 * No dependency, because the requirement here is narrow — uniform row height,
 * vertical only, and the ability to keep a keyboard cursor on screen. A general
 * virtualiser would be more code and more behaviour than that.
 */
export function VirtualList<T>({
  items,
  rowHeight,
  renderRow,
  activeIndex,
  className,
  overscan = 8,
  ariaLabel,
}: {
  items: T[];
  rowHeight: number;
  renderRow: (item: T, index: number) => ReactNode;
  /** Kept scrolled into view whenever it changes. */
  activeIndex?: number;
  className?: string;
  overscan?: number;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(600);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setViewport(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scroll the cursor back into view, moving by the minimum distance so the
  // list does not jump when the cursor is already visible.
  useEffect(() => {
    const el = ref.current;
    if (!el || activeIndex === undefined || activeIndex < 0) return;
    const top = activeIndex * rowHeight;
    const bottom = top + rowHeight;
    if (top < el.scrollTop) el.scrollTop = top;
    else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight;
  }, [activeIndex, rowHeight]);

  const first = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visible = Math.ceil(viewport / rowHeight) + overscan * 2;
  const last = Math.min(items.length, first + visible);

  return (
    <div
      ref={ref}
      className={cn("scroll-y h-full", className)}
      aria-label={ariaLabel}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * rowHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${first * rowHeight}px)` }}>
          {items.slice(first, last).map((item, i) => renderRow(item, first + i))}
        </div>
      </div>
    </div>
  );
}
