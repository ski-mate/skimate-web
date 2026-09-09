import type { ReactNode } from "react";

/**
 * Reading wrapper for the legal pages.
 *
 * Styles descendants via CSS rather than converting the documents into content
 * modules: the wording is legally reviewed, so it stays exactly as authored and
 * only its presentation changes. This also removes the last dependency on
 * @tailwindcss/typography.
 */
export function LegalDoc({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="py-section">
      <article
        className="legal-doc container-guide"
      >
        <h1>{title}</h1>
        {children}
      </article>
    </div>
  );
}
