import Link from "next/link";
import type { Metadata } from "next";
import { GuideShell } from "@/components/guide/GuideShell";
import { guideSections } from "@/content/guide";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Alpline Guide",
  description:
    "Step-by-step help for everything Alpline does, from reading the piste map and routing between lifts to saving places and skiing with friends.",
  path: "/guide",
});

export default function GuideHome() {
  return (
    <GuideShell>
      <h1 className="type-display-3 mb-3">Alpline Guide</h1>
      <p className="type-body mb-10 text-[var(--label-2)]">
        How to use every part of Alpline, one task at a time.
      </p>

      {guideSections.map((section) => {
        const published = section.articles.filter((a) => a.status === "published");
        const planned = section.articles.filter((a) => a.status === "planned");

        return (
          <section key={section.id} className="mb-10">
            <h2 className="type-title mb-1">
              <Link href={`/guide/${section.id}`} className="hover:underline underline-offset-[3px]">
                {section.title}
              </Link>
            </h2>
            <p className="type-callout mb-3 text-[var(--label-2)]">
              {section.description}
            </p>

            <ul className="space-y-1.5">
              {published.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/guide/${section.id}/${a.slug}`}
                    className="type-callout text-[var(--link)] hover:underline underline-offset-[3px]"
                  >
                    {a.title}
                  </Link>
                </li>
              ))}
              {planned.map((a) => (
                <li
                  key={a.slug}
                  className="type-callout flex items-center gap-2 text-[var(--label-4)]"
                >
                  {a.title}
                  <span className="type-caption rounded-pill border border-[var(--separator)] px-2 py-0.5">
                    Coming soon
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </GuideShell>
  );
}
