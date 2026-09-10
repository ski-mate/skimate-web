import type { RichText } from "@/content/guide/types";
import { RichTextView } from "./RichTextView";

const LABEL = { note: "Note:", tip: "Tip:", warning: "Important:" } as const;

/**
 * Note, Tip and Important callouts. The warning variant is reserved for
 * genuine safety content, which on a ski app is not decorative.
 */
export function Callout({
  variant,
  text,
}: {
  variant: "note" | "tip" | "warning";
  text: RichText;
}) {
  const isWarning = variant === "warning";

  return (
    <div
      className={
        variant === "note"
          ? "my-5 border-l-2 border-[var(--separator)] pl-4"
          : isWarning
            ? "my-5 rounded-card border border-[var(--piste-red)]/30 bg-[var(--piste-red)]/[0.06] p-4"
            : "my-5 rounded-card border border-[var(--piste-orange)]/30 bg-[var(--piste-orange)]/[0.08] p-4"
      }
    >
      <p className="type-body text-[var(--label-2)]">
        <strong
          className={
            isWarning
              ? "font-semibold text-[var(--piste-red)]"
              : "font-semibold text-[var(--label)]"
          }
        >
          {LABEL[variant]}{" "}
        </strong>
        <RichTextView text={text} />
      </p>
    </div>
  );
}
