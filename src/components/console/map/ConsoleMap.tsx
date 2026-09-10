"use client";

import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import {
  loadAtlasStyle,
  repaintAtlasCartography,
  type CartoScheme,
} from "@/lib/map/cartography";
import type { BBox, LngLat } from "@/lib/ingestion-api";

const KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "";

function readScheme(): CartoScheme {
  if (typeof window === "undefined") return "light";
  const attr = document.documentElement.dataset.scheme;
  if (attr === "dark") return "dark";
  if (attr === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export interface ConsoleMapProps {
  /** Frames the map on first load. */
  bbox?: BBox | null;
  center?: LngLat;
  zoom?: number;
  /**
   * Called once the style has loaded and Apple cartography has been applied.
   * Screens add their own sources and layers here; the base map owns nothing
   * but the basemap, so no two screens can fight over the same layer ids.
   */
  onReady?: (map: maptilersdk.Map, scheme: CartoScheme) => void;
  /** Called when the scheme flips, so layers can repaint their own colours. */
  onSchemeChange?: (map: maptilersdk.Map, scheme: CartoScheme) => void;
  className?: string;
  ariaLabel: string;
}

/**
 * The base map every console screen builds on.
 *
 * Same MapTiler SDK and the same Apple-derived cartography as `/map`, but in a
 * working posture rather than a presentational one: gestures are direct (this
 * pane is the thing you are scrolling), and there is no click-to-load gate
 * because the analyst came here specifically to look at a map.
 */
export function ConsoleMap({
  bbox,
  center,
  zoom = 11,
  onReady,
  onSchemeChange,
  className,
  ariaLabel,
}: ConsoleMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const [scheme, setScheme] = useState<CartoScheme>("light");
  const [styleError, setStyleError] = useState<string | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onSchemeRef = useRef(onSchemeChange);
  onSchemeRef.current = onSchemeChange;

  useEffect(() => {
    setScheme(readScheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setScheme(readScheme());
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!container.current || map.current || !KEY) return;
    let cancelled = false;

    // The style is fetched and restyled before the map exists, so there is no
    // enum for the SDK to resolve and therefore no default style to flash
    // through first. See src/lib/map/cartography.ts for why that matters.
    void (async () => {
      const s = readScheme();
      let style;
      try {
        style = await loadAtlasStyle(KEY, s);
      } catch (err) {
        if (!cancelled)
          setStyleError(
            err instanceof Error ? err.message : "Map style failed to load.",
          );
        return;
      }
      if (cancelled || !container.current || map.current) return;

      maptilersdk.config.apiKey = KEY;
      const m = new maptilersdk.Map({
        container: container.current,
        style,
        center: center ?? [6.58, 45.34],
        zoom,
        navigationControl: false,
        geolocateControl: false,
        scaleControl: false,
        fullscreenControl: false,
        terrainControl: false,
        attributionControl: { compact: true },
      });
      map.current = m;

      m.on("load", () => {
        m.getCanvas().setAttribute("aria-label", ariaLabel);
        if (bbox) {
          m.fitBounds(
            [
              [bbox[0], bbox[1]],
              [bbox[2], bbox[3]],
            ],
            { padding: 48, duration: 0 },
          );
        }
        onReadyRef.current?.(m, s);
      });
    })();

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // Built once. Framing and layers are pushed in by effects rather than
    // rebuilding, which would restart every tile request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A scheme flip repaints the live map from the same override table the style
  // transform uses, rather than swapping the style — which would drop every
  // source and layer the screens add on top.
  useEffect(() => {
    const m = map.current;
    if (!m || !m.isStyleLoaded()) return;
    repaintAtlasCartography(m, scheme);
    onSchemeRef.current?.(m, scheme);
  }, [scheme]);

  // Re-frame when the caller changes what it is looking at.
  useEffect(() => {
    const m = map.current;
    if (!m || !bbox) return;
    m.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: 48, duration: 400 },
    );
  }, [bbox]);

  if (!KEY || styleError) {
    return (
      <div
        className={className}
        role="img"
        aria-label={`${ariaLabel} — unavailable`}
      >
        <div className="flex h-full items-center justify-center bg-[var(--bg-elevated)] p-6 text-center">
          <p className="max-w-[36ch] text-[12px] text-[var(--label-3)]">
            {styleError ??
              "Map unavailable — NEXT_PUBLIC_MAPTILER_API_KEY is not set."}{" "}
            Every other part of this screen works without it.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={container} className={`console-map ${className ?? ""}`} />;
}
