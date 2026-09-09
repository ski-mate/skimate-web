import Link from "next/link";
import { findPublished } from "@/content/guide";

export function SeeAlso({ slugs }: { slugs?: string[] }) {
  if (!slugs || slugs.length === 0) return null;

  // Refs are validated against the manifest at build time.
  const articles = slugs.map(findPublished).filter(Boolean);
  if (articles.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="type-callout font-semibold">See also</h2>
      <ul className="mt-2 space-y-1.5">
        {articles.map((a) => (
          <li key={a!.slug}>
            <Link
              href={`/guide/${a!.section}/${a!.slug}`}
              className="type-callout text-[var(--link)] hover:underline underline-offset-[3px]"
            >
              {a!.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
