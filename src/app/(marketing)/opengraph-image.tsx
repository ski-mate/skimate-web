import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { marketing } from "@/lib/apple-tokens";

export const runtime = "edge";
export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default social card.
 *
 * Replaces the old /og route handler, which referenced an /iphone.png that was
 * never in public/. Deliberately typographic — device imagery renders badly at
 * the crops X and iMessage apply.
 */
export default async function Image() {
  const font = await fetch(
    new URL("../../assets/fonts/Inter-SemiBold.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          backgroundColor: marketing.dark.bg,
          color: marketing.dark.label,
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="44" height="44" viewBox="0 0 20 20" fill="none">
            <path d="M10 2.5L17.5 17.5H2.5L10 2.5z" fill={marketing.dark.label} fillOpacity="0.28" />
            <path d="M10 2.5l4.2 8.4-2.1-.7-2.1 2.1-2.1-3.1-1.9 1.3L10 2.5z" fill={marketing.dark.label} />
            <path d="M10 2.5L17.5 17.5H2.5L10 2.5z" stroke={marketing.dark.label} strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 34, letterSpacing: "-0.01em" }}>{site.name}</div>
        </div>

        <div
          style={{
            fontSize: 76,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            marginTop: 40,
            maxWidth: 900,
          }}
        >
          {site.tagline}
        </div>

        <div
          style={{
            fontSize: 30,
            marginTop: 28,
            color: marketing.dark.label2,
          }}
        >
          getalpline.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Inter", data: font, style: "normal", weight: 600 }],
    }
  );
}
