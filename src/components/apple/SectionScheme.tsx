import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type Scheme = "light" | "dark" | "auto";

/**
 * Wraps a marketing section and pins its colour scheme.
 *
 * This is the mechanism that makes the site behave like apple.com: a section
 * declared `dark` stays dark even when the visitor's OS is in light mode,
 * because the tokens are redefined on this element rather than on <html>.
 * Sections left as "auto" inherit the OS preference.
 */
export function SectionScheme({
  scheme = "auto",
  tone = "base",
  className,
  children,
  ...rest
}: {
  scheme?: Scheme;
  /** `base` paints --bg, `elevated` paints --bg-elevated. */
  tone?: "base" | "elevated" | "none";
  className?: string;
  children: ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "color">) {
  return (
    <section
      data-scheme={scheme}
      className={cn(
        tone === "elevated" && "!bg-[var(--bg-elevated)]",
        tone === "none" && "!bg-transparent",
        className
      )}
      {...rest}
    >
      {children}
    </section>
  );
}
