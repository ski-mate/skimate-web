import type { Metadata } from "next";

export const metadata: Metadata = { title: "Guides" };

/**
 * Stage 4 — editorial ski guides — is explicitly out of scope for v1. The nav
 * stub exists so the shape of the pipeline stays visible, and so this screen
 * says what it will be rather than 404ing.
 */
export default function GuidesStubPage() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-[52ch] space-y-2">
        <h1 className="text-[15px] font-semibold">Guides authoring</h1>
        <p className="text-[12px] leading-relaxed text-[var(--label-2)]">
          Stage 4 authors editorial ski guides against registry entities, so that a guide is
          <em> skiable</em>: every entry resolves to a real run, lift or place, and consecutive
          entries route. A guide linter will check both before a draft can be published.
        </p>
        <p className="text-[12px] leading-relaxed text-[var(--label-3)]">
          Out of scope for v1 of this console. It needs the guide schema, the MCP tool inventory
          and the editorial workflow settled first — all still marked to-fill in the pipeline
          spec.
        </p>
      </div>
    </div>
  );
}
