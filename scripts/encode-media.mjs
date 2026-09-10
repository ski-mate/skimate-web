#!/usr/bin/env node
/**
 * Encodes a source image into the WebP the site ships, and prints the Media
 * literal (including a real blurDataURL) to paste into a content module.
 *
 * Usage: node scripts/encode-media.mjs <source> <public-relative-path> <width>
 *   node scripts/encode-media.mjs ~/shot.png media/home/hero.webp 2000
 *
 * Requires cwebp and sips, both present on macOS with libwebp installed.
 * Deliberately a one-shot CLI rather than a build step: images are committed,
 * so re-encoding on every build would be pure waste.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const [source, target, widthArg] = process.argv.slice(2);
if (!source || !target) {
  console.error("usage: encode-media.mjs <source> <public-relative-path> [width]");
  process.exit(1);
}

const width = Number(widthArg || 2000);
const root = resolve(import.meta.dirname, "..");
const out = join(root, "public", target);
const tmp = join(root, ".media-tmp");

mkdirSync(dirname(out), { recursive: true });
mkdirSync(tmp, { recursive: true });

const scaled = join(tmp, "scaled.png");
const tiny = join(tmp, "tiny.png");
const tinyWebp = join(tmp, "tiny.webp");

const sips = (...args) => execFileSync("/usr/bin/sips", args, { stdio: "pipe" });
const cwebp = (...args) => execFileSync("cwebp", args, { stdio: "pipe" });

sips("-Z", String(width), source, "--out", scaled);
cwebp("-q", process.env.WEBP_Q || "78", "-m", "6", "-af", scaled, "-o", out);

// A 16px-wide placeholder is enough to carry the image's colour and rough
// shape; anything larger inflates the HTML for no perceptible gain.
sips("-Z", "16", source, "--out", tiny);
cwebp("-q", "40", tiny, "-o", tinyWebp);
const blur = `data:image/webp;base64,${readFileSync(tinyWebp).toString("base64")}`;

const dims = sips("-g", "pixelWidth", "-g", "pixelHeight", out).toString();
const w = Number(dims.match(/pixelWidth:\s*(\d+)/)[1]);
const h = Number(dims.match(/pixelHeight:\s*(\d+)/)[1]);
const bytes = readFileSync(out).length;

rmSync(tmp, { recursive: true, force: true });

console.log(`${target}  ${w}x${h}  ${(bytes / 1024).toFixed(0)} kB`);
console.log(
  JSON.stringify({ src: `/${target}`, width: w, height: h, blurDataURL: blur }, null, 2)
);
