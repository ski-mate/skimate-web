import type { Graph } from "schema-dts";

/**
 * Structured data. Rendered as a script tag rather than via next/script so it
 * is present in the server-rendered HTML for crawlers.
 */
export function JsonLd({ graph }: { graph: Graph }) {
  return (
    <script
      type="application/ld+json"
      // Content is authored by us, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
