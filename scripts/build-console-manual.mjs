/**
 * Turns docs/CONSOLE-ANALYST-MANUAL.md into typed guide blocks.
 *
 * The manual is written and maintained as Markdown in alpline-admin — it is a
 * living runbook, and analysts follow its step numbering literally. Hand-
 * converting it into content modules would guarantee drift the first time
 * someone edits a step. So the Markdown stays the source of truth and this
 * script compiles it, the same way the rest of the guide is compiled from
 * typed modules: the output is checked in, type-checked, and traced by the
 * bundler with no filesystem read at runtime.
 *
 * To re-sync after the manual changes:
 *   cp ../alpline-admin/CONSOLE-ANALYST-MANUAL.md docs/
 *   node scripts/build-console-manual.mjs
 *
 * Only the subset of Markdown the manual actually uses is supported, and
 * anything unrecognised throws rather than being dropped silently — a step
 * that vanished from a runbook is worse than a failed build.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "docs/CONSOLE-ANALYST-MANUAL.md");
const OUT = join(root, "src/content/console-manual/chapters.ts");

/* ── inline ──────────────────────────────────────────────────────────────── */

/**
 * `**bold**`, `*em*` and `` `code` `` into RichText spans. Markdown links are
 * supported even though the manual has none today, so adding one later does
 * not silently render as literal brackets.
 */
function rich(md) {
  const out = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|(?<!\*)\*([^*]+?)\*(?!\*)|`([^`]+?)`/gs;
  let last = 0;

  // Emphasis nests: the manual writes **`?`** — bold wrapping a code span —
  // and treating the inner text as literal printed the backticks. So bold and
  // italic recurse into their content and stamp their flag onto whatever comes
  // back, which also makes `**a `b` c**` work.
  const wrap = (inner, flag) =>
    rich(inner).map((span) =>
      typeof span === "string" ? { text: span, [flag]: true } : { ...span, [flag]: true }
    );

  for (const m of md.matchAll(re)) {
    if (m.index > last) out.push(md.slice(last, m.index));
    if (m[1] !== undefined) out.push({ text: m[1], href: m[2] });
    else if (m[3] !== undefined) out.push(...wrap(m[3], "strong"));
    else if (m[4] !== undefined) out.push(...wrap(m[4], "em"));
    else out.push({ text: m[5], code: true });
    last = m.index + m[0].length;
  }
  if (last < md.length) out.push(md.slice(last));
  // Collapse to a bare string when there is no markup at all; it keeps the
  // generated file readable and diffable.
  return out.length === 1 && typeof out[0] === "string" ? [out[0]] : out;
}

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* ── block parsing ───────────────────────────────────────────────────────── */

function parseBlocks(lines) {
  const blocks = [];
  let i = 0;

  const isBlank = (l) => l.trim() === "";

  while (i < lines.length) {
    const line = lines[i];

    if (isBlank(line) || line.trim() === "---") {
      i++;
      continue;
    }

    // ### subsection
    if (line.startsWith("### ")) {
      const text = line.slice(4).trim();
      blocks.push({ kind: "heading", text, id: slug(text) });
      i++;
      continue;
    }

    // fenced code — the manual uses one for the stage-pipeline diagram
    if (line.startsWith("```")) {
      const body = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) body.push(lines[i++]);
      i++; // closing fence
      blocks.push({ kind: "code", text: body.join("\n") });
      continue;
    }

    // GFM table
    if (line.startsWith("|")) {
      const cells = (l) =>
        l
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => c.trim());
      const head = cells(line).map(rich);
      i += 2; // header + separator
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) rows.push(cells(lines[i++]).map(rich));
      blocks.push({ kind: "table", head, rows });
      continue;
    }

    // ordered list — runbook steps, whose numbering is load-bearing
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        let text = lines[i].replace(/^\d+\.\s+/, "");
        const sub = [];
        i++;
        // Continuation lines are indented; a "- " among them is a sub-bullet.
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) {
          const cont = lines[i].trim();
          if (cont.startsWith("- ")) sub.push(cont.slice(2));
          else if (sub.length > 0) sub[sub.length - 1] += ` ${cont}`;
          else text += ` ${cont}`;
          i++;
        }
        items.push(sub.length ? { text: rich(text), sub: sub.map(rich) } : { text: rich(text) });
      }
      blocks.push({ kind: "steps", items });
      continue;
    }

    // unordered list
    if (/^-\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^-\s/.test(lines[i])) {
        let text = lines[i].replace(/^-\s+/, "");
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) text += ` ${lines[i++].trim()}`;
        items.push(rich(text));
      }
      blocks.push({ kind: "bullets", items });
      continue;
    }

    // paragraph — everything until a blank line or the start of another block
    const para = [];
    while (
      i < lines.length &&
      !isBlank(lines[i]) &&
      !lines[i].startsWith("|") &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("### ") &&
      lines[i].trim() !== "---" &&
      !/^(\d+\.|-)\s/.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i++;
    }
    if (para.length) blocks.push({ kind: "p", text: rich(para.join(" ")) });
  }

  return blocks;
}

/* ── chapters ────────────────────────────────────────────────────────────── */

const raw = readFileSync(SRC, "utf8");

// Drop the front matter above Chapter 0: the title, the byline, and the note
// addressed to whoever renders this. None of it belongs on the rendered page.
const firstChapter = raw.indexOf("\n## ");
if (firstChapter === -1) throw new Error("No '## ' chapter heading found in the manual.");

const chapters = raw
  .slice(firstChapter)
  .split(/\n## /)
  .map((s) => s.trim())
  .filter(Boolean)
  .map((chunk) => {
    const [headingLine, ...rest] = chunk.split("\n");
    const heading = headingLine.trim();
    // "Chapter 7 — Routing coverage (screen 8)" → number + title
    const m = /^Chapter\s+(\d+)\s*[—-]\s*(.+)$/.exec(heading);
    if (!m) throw new Error(`Unrecognised chapter heading: ${heading}`);
    const [, number, title] = m;
    return {
      number: Number(number),
      slug: `chapter-${number}-${slug(title)}`,
      title,
      heading,
      blocks: parseBlocks(rest),
    };
  });

if (chapters.length === 0) throw new Error("Parsed zero chapters.");

/* ── integrity, then emit ────────────────────────────────────────────────── */

const seen = new Set();
for (const c of chapters) {
  if (seen.has(c.slug)) throw new Error(`Duplicate chapter slug: ${c.slug}`);
  seen.add(c.slug);
  if (c.blocks.length === 0) throw new Error(`Chapter ${c.number} parsed to zero blocks.`);
}
chapters.forEach((c, n) => {
  if (c.number !== n) throw new Error(`Chapter numbering is not contiguous at ${c.number}.`);
});

// Step counts are asserted against the source so a parser change can never
// quietly renumber a runbook analysts follow literally.
const sourceSteps = (raw.match(/^\d+\.\s/gm) ?? []).length;
const parsedSteps = chapters.reduce(
  (n, c) => n + c.blocks.filter((b) => b.kind === "steps").reduce((m, b) => m + b.items.length, 0),
  0
);
if (sourceSteps !== parsedSteps) {
  throw new Error(`Step count drift: ${sourceSteps} in source, ${parsedSteps} parsed.`);
}

const header = `/**
 * GENERATED FILE — do not edit.
 *
 * Source: docs/CONSOLE-ANALYST-MANUAL.md (mirrored from alpline-admin).
 * Regenerate: node scripts/build-console-manual.mjs
 *
 * ${chapters.length} chapters, ${parsedSteps} runbook steps.
 */

import type { ManualChapter } from "./types";

export const manualChapters: ManualChapter[] = `;

writeFileSync(OUT, header + JSON.stringify(chapters, null, 2) + ";\n");
console.log(`${chapters.length} chapters, ${parsedSteps} steps → ${OUT.replace(root + "/", "")}`);
