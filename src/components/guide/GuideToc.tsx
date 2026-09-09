import Link from "next/link";
import { guideSections } from "@/content/guide";
import { cn } from "@/lib/utils";

/**
 * Sidebar contents. Sticky from 1069px up; below that it collapses into a
 * disclosure above the article, matching where the reference guide moves it.
 */
export function GuideToc({ activeSlug }: { activeSlug?: string }) {
  return (
    <nav aria-label="Guide contents" className="type-callout">
      {guideSections.map((section) => {
        const published = section.articles.filter((a) => a.status === "published");
        if (published.length === 0) return null;

        return (
          <div key={section.id} className="mb-6">
            <Link
              href={`/guide/${section.id}`}
              className="font-semibold text-[var(--label)] hover:underline underline-offset-[3px]"
            >
              {section.title}
            </Link>
            <ul className="mt-2 space-y-1.5 border-l border-[var(--separator)] pl-3">
              {published.map((article) => {
                const active = article.slug === activeSlug;
                return (
                  <li key={article.slug}>
                    <Link
                      href={`/guide/${section.id}/${article.slug}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block hover:text-[var(--label)]",
                        active
                          ? "font-medium text-[var(--link)]"
                          : "text-[var(--label-2)]"
                      )}
                    >
                      {article.navTitle ?? article.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
