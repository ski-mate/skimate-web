import Link from "next/link";
import { ChevronRight } from "@/components/icons";

export function Breadcrumbs({
  trail,
}: {
  trail: { href: string; label: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="type-caption flex flex-wrap items-center gap-1.5 text-[var(--label-3)]">
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 ? <ChevronRight className="h-2 w-2" /> : null}
              {last ? (
                <span aria-current="page">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-[var(--label)]">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
