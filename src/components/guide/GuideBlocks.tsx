import { DeviceFrame } from "@/components/apple/DeviceFrame";
import { stepSub, stepText, type Figure, type GuideBlock } from "@/content/guide/types";
import { Callout } from "./Callout";
import { RichTextView } from "./RichTextView";

function FigureView({ figure }: { figure: Figure }) {
  return (
    <figure className="my-8">
      {figure.device === "iphone" ? (
        <DeviceFrame
          src={figure.src}
          alt={figure.alt}
          blurDataURL={figure.blurDataURL}
          width={260}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={figure.src}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
          loading="lazy"
          decoding="async"
          className="w-full rounded-card border border-[var(--separator)]"
        />
      )}
      {figure.caption ? (
        <figcaption className="type-caption mt-3 text-center text-[var(--label-3)]">
          {figure.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function GuideBlocks({
  blocks,
  figures = {},
}: {
  blocks: GuideBlock[];
  figures?: Record<string, Figure>;
}) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "heading":
            return (
              <h2
                key={i}
                id={block.id}
                className="type-title mt-10 mb-3 scroll-mt-[calc(var(--nav-h)+1rem)]"
              >
                {block.text}
              </h2>
            );

          case "p":
            return (
              <p key={i} className="type-body mb-4 text-[var(--label-2)]">
                <RichTextView text={block.text} />
              </p>
            );

          case "note":
          case "tip":
          case "warning":
            return <Callout key={i} variant={block.kind} text={block.text} />;

          case "steps":
            return (
              <ol key={i} className="my-5 space-y-3">
                {block.items.map((item, n) => (
                  <li key={n} className="flex gap-3">
                    {/* Hanging numeral, so wrapped lines align under the text. */}
                    <span
                      aria-hidden="true"
                      className="type-callout mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-[var(--fill)] font-medium text-[var(--label)]"
                    >
                      {n + 1}
                    </span>
                    <span className="type-body text-[var(--label-2)]">
                      <RichTextView text={stepText(item)} />
                      {stepSub(item).length > 0 && (
                        <ul className="mt-2 space-y-1.5 pl-5">
                          {stepSub(item).map((sub, k) => (
                            <li
                              key={k}
                              className="list-disc text-[var(--label-2)] marker:text-[var(--label-4)]"
                            >
                              <RichTextView text={sub} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            );

          case "bullets":
            return (
              <ul key={i} className="my-5 space-y-2 pl-5">
                {block.items.map((item, n) => (
                  <li
                    key={n}
                    className="type-body list-disc text-[var(--label-2)] marker:text-[var(--label-4)]"
                  >
                    <RichTextView text={item} />
                  </li>
                ))}
              </ul>
            );

          case "figure": {
            const figure = figures[block.figure];
            // Unresolvable refs are caught by assertManifestIntegrity at build.
            return figure ? <FigureView key={i} figure={figure} /> : null;
          }

          case "code":
            return (
              <pre
                key={i}
                className="my-6 overflow-x-auto rounded-card bg-[var(--fill)] p-4 text-[13px] leading-relaxed"
              >
                <code>{block.text}</code>
              </pre>
            );

          case "table":
            return (
              <div key={i} className="my-6 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      {block.head.map((h, c) => (
                        <th
                          key={c}
                          className="type-callout border-b border-[var(--separator)] py-2 pr-4 font-semibold"
                        >
                          <RichTextView text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, n) => (
                      <tr key={n}>
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className="type-callout border-b border-[var(--separator)] py-2 pr-4 align-top text-[var(--label-2)]"
                          >
                            <RichTextView text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </>
  );
}
