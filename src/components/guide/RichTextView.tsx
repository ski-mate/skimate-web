import Link from "next/link";
import type { RichText } from "@/content/guide/types";

/** Renders inline spans: plain text, links, emphasis and inline code. */
export function RichTextView({ text }: { text: RichText }) {
  return (
    <>
      {text.map((span, i) => {
        if (typeof span === "string") return <span key={i}>{span}</span>;

        let node: React.ReactNode = span.text;
        if (span.code) {
          node = (
            <code className="rounded-sm bg-[var(--fill)] px-1 py-0.5 text-[0.9em]">
              {node}
            </code>
          );
        }
        if (span.strong) node = <strong className="font-semibold text-[var(--label)]">{node}</strong>;
        if (span.em) node = <em>{node}</em>;

        if (span.href) {
          return (
            <Link
              key={i}
              href={span.href}
              className="text-[var(--link)] underline underline-offset-[3px]"
            >
              {node}
            </Link>
          );
        }
        return <span key={i}>{node}</span>;
      })}
    </>
  );
}
