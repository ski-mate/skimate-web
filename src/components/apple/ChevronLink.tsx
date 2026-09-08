import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight } from "@/components/icons";

/**
 * The blue text CTA with a trailing chevron — the workhorse call to action in
 * this layout language. `pill` is the filled variant used for primary actions.
 */
export function ChevronLink({
  href,
  children,
  variant = "default",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "default" | "pill";
  className?: string;
}) {
  const isPill = variant === "pill";

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1.5 type-tagline",
        isPill
          ? "rounded-pill bg-[var(--link)] px-[21px] py-[11px] text-white transition-colors hover:bg-[var(--link-hover)]"
          : "text-[var(--link)] hover:underline underline-offset-[3px]",
        className
      )}
    >
      {children}
      <ChevronRight
        className={cn(
          "h-[0.7em] w-auto transition-transform duration-200 group-hover:translate-x-0.5",
          isPill ? "opacity-90" : ""
        )}
      />
    </Link>
  );
}
