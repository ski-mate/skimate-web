import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/guide/Breadcrumbs";
import { GuideShell } from "@/components/guide/GuideShell";
import { guideSections, getSection } from "@/content/guide";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return guideSections.map((s) => ({ section: s.id }));
}

export function generateMetadata({
  params,
}: {
  params: { section: string };
}): Metadata {
  const section = getSection(params.section);
  if (!section) return {};
  return pageMetadata({
    title: section.title,
    description: section.description,
    path: `/guide/${section.id}`,
  });
}

export default function SectionPage({
  params,
}: {
  params: { section: string };
}) {
  const section = getSection(params.section);
  if (!section) notFound();

  const published = section.articles.filter((a) => a.status === "published");
  const planned = section.articles.filter((a) => a.status === "planned");

  return (
    <GuideShell>
      <Breadcrumbs
        trail={[
          { href: "/guide", label: "Guide" },
          { href: `/guide/${section.id}`, label: section.title },
        ]}
      />
      <h1 className="type-display-3 mb-3">{section.title}</h1>
      <p className="type-body mb-8 text-[var(--label-2)]">{section.description}</p>

      {published.length > 0 ? (
        <ul className="space-y-4">
          {published.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/guide/${section.id}/${a.slug}`}
                className="type-title text-[var(--link)] hover:underline underline-offset-[3px]"
              >
                {a.title}
              </Link>
              <p className="type-callout mt-1 text-[var(--label-2)]">
                {a.description}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="type-body text-[var(--label-2)]">
          Nothing in this section is ready yet. The articles below are on the way.
        </p>
      )}

      {planned.length > 0 ? (
        <section className="mt-10 border-t border-[var(--separator)] pt-6">
          <h2 className="type-callout mb-3 font-semibold text-[var(--label-3)]">
            Coming soon
          </h2>
          <ul className="space-y-3">
            {planned.map((a) => (
              <li key={a.slug}>
                <p className="type-callout text-[var(--label-3)]">{a.title}</p>
                <p className="type-caption text-[var(--label-4)]">{a.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </GuideShell>
  );
}
