import Link from "next/link";
import { footerColumns } from "@/content/nav";

/**
 * Multi-column link footer in tiny type, sitting in a narrower container than
 * the page content — 1024px inside the 1440px viewport.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      data-scheme="auto"
      className="!bg-[var(--bg-elevated)] text-[var(--label-2)]"
    >
      <div className="mx-auto w-full max-w-[1024px] px-gutter py-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {footerColumns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="type-footnote font-semibold text-[var(--label)]">
                {col.heading}
              </h2>
              <ul className="mt-2.5 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="type-footnote hover:underline underline-offset-[3px]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-9 border-t border-[var(--separator)] pt-4">
          <p className="type-footnote">
            &copy; {year} Alpline. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
