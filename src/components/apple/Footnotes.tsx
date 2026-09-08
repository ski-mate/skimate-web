import { Container } from "./Container";
import type { ReactNode } from "react";

/**
 * The dense small-print block that sits above the footer — where availability
 * caveats and "Alpline Pro required" qualifiers live.
 */
export function Footnotes({ items }: { items: ReactNode[] }) {
  if (items.length === 0) return null;

  return (
    <Container as="section" className="py-8 text-[var(--label-3)]">
      <ol className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="type-caption flex gap-1.5">
            <span aria-hidden="true">{i + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </Container>
  );
}
