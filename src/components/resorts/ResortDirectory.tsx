import Link from "next/link";
import { groupByContinent } from "@/content/resorts";
import type { Resort } from "@/content/resorts/types";

/**
 * Continent, country, then resorts in multi-column lists. Live resorts are
 * links; catalogued ones are plain text with a marker, because there is
 * nothing useful to show on a page for a resort we have not mapped.
 */
export function ResortDirectory({ resorts }: { resorts: Resort[] }) {
  const groups = groupByContinent(resorts);

  return (
    <div>
      <nav aria-label="Jump to continent" className="mb-10 flex flex-wrap gap-2">
        {groups.map((g) => (
          <a
            key={g.continent}
            href={`#${g.continent.toLowerCase().replace(/\s+/g, "-")}`}
            className="type-caption rounded-pill border border-[var(--separator)] px-3 py-1.5 text-[var(--label-2)] hover:border-[var(--label-3)] hover:text-[var(--label)]"
          >
            {g.continent} <span className="text-[var(--label-3)]">{g.count}</span>
          </a>
        ))}
      </nav>

      {groups.map((group) => (
        <section
          key={group.continent}
          id={group.continent.toLowerCase().replace(/\s+/g, "-")}
          className="mb-14 scroll-mt-[calc(var(--nav-h)+2rem)]"
        >
          <h2 className="type-title mb-6 border-b border-[var(--separator)] pb-2">
            {group.continent}
            <span className="type-callout ml-2 font-normal text-[var(--label-3)]">
              {group.count} resorts
            </span>
          </h2>

          <div className="columns-1 gap-x-8 sm:columns-2 lg:columns-3 xl:columns-4">
            {group.countries.map((country) => (
              <div
                key={country.country}
                className="mb-7 break-inside-avoid-column"
              >
                <h3 className="type-callout mb-2 font-semibold">
                  {country.country}
                </h3>
                <ul className="space-y-1">
                  {country.resorts.map((resort) => (
                    <li key={resort.slug}>
                      {resort.coverage === "live" ? (
                        <Link
                          href={`/resorts/${resort.slug}`}
                          className="type-callout text-[var(--link)] hover:underline underline-offset-[3px]"
                        >
                          {resort.name}
                        </Link>
                      ) : (
                        <span className="type-callout text-[var(--label-3)]">
                          {resort.name}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
