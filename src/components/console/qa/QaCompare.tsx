"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as maptilersdk from "@maptiler/sdk";
import { cn } from "@/lib/utils";
import { ConsoleMapLazy } from "../map/ConsoleMap.lazy";
import type { BBox, PisteMapAsset, QaItem } from "@/lib/ingestion-api";

const PLACES = "qa-places";
const FLAGGED = "qa-flagged";
const OVERLAY = "qa-overlay";

export type CompareMode = "side_by_side" | "overlay";

/**
 * The comparison surface: our rendered data against the resort's own piste map.
 *
 * This is the manual step Slopes describes doing by eye, and it stays manual —
 * but only after the automated checks have run, so the analyst's attention goes
 * to the judgements a machine cannot make (do these run names match the
 * printed sheet?) rather than to counting rows.
 *
 * Two modes, because they answer different questions. Side by side is for
 * reading names and counting lifts. Overlay is for "is this in roughly the
 * right place" — and since the sheets are not georeferenced, it offers nudge
 * and scale rather than pretending to register the raster.
 */
export function QaCompare({
  bbox,
  points,
  flagged,
  pisteMap,
}: {
  bbox: BBox;
  points: { id: string; point: [number, number]; name: string }[];
  flagged: QaItem[];
  pisteMap: PisteMapAsset | null;
}) {
  const [mode, setMode] = useState<CompareMode>("side_by_side");
  const [opacity, setOpacity] = useState(0.55);
  const [nudge, setNudge] = useState({ x: 0, y: 0, scale: 1 });
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const [ready, setReady] = useState(false);

  const onReady = useCallback(
    (m: maptilersdk.Map) => {
      mapRef.current = m;

      m.addSource(PLACES, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: points.map((p) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: p.point },
            properties: { name: p.name },
          })),
        },
      });
      m.addLayer({
        id: "qa-places-layer",
        type: "circle",
        source: PLACES,
        paint: {
          "circle-color": "#007aff",
          "circle-radius": 4,
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(255,255,255,0.75)",
        },
      });

      m.addSource(FLAGGED, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "qa-flagged-layer",
        type: "circle",
        source: FLAGGED,
        paint: {
          "circle-color": "#ff9500",
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      setReady(true);
    },
    [points]
  );

  // Flagged QA items that carry a location get pinned onto the map, so "hotel
  // at 3,000 m" can be looked at rather than only read.
  useEffect(() => {
    const m = mapRef.current;
    if (!m?.isStyleLoaded()) return;
    (m.getSource(FLAGGED) as maptilersdk.GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: flagged
        .filter((f) => f.point)
        .map((f) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: f.point! },
          properties: { label: f.label },
        })),
    } as GeoJSON.FeatureCollection);
  }, [flagged, ready]);

  // The overlay is an image source pinned to the entry's bbox, nudged and
  // scaled by hand because the sheet has no georeference of its own.
  useEffect(() => {
    const m = mapRef.current;
    if (!m?.isStyleLoaded() || !pisteMap) return;

    const [w, s, e, n] = bbox;
    const cx = (w + e) / 2;
    const cy = (s + n) / 2;
    const halfW = ((e - w) / 2) * nudge.scale;
    const halfH = ((n - s) / 2) * nudge.scale;
    const dx = ((e - w) * nudge.x) / 100;
    const dy = ((n - s) * nudge.y) / 100;

    const coords: [[number, number], [number, number], [number, number], [number, number]] = [
      [cx - halfW + dx, cy + halfH + dy],
      [cx + halfW + dx, cy + halfH + dy],
      [cx + halfW + dx, cy - halfH + dy],
      [cx - halfW + dx, cy - halfH + dy],
    ];

    const existing = m.getSource(OVERLAY) as maptilersdk.ImageSource | undefined;
    if (mode !== "overlay") {
      if (m.getLayer("qa-overlay-layer")) m.setLayoutProperty("qa-overlay-layer", "visibility", "none");
      return;
    }

    if (!existing) {
      m.addSource(OVERLAY, { type: "image", url: pisteMap.url, coordinates: coords });
      m.addLayer(
        {
          id: "qa-overlay-layer",
          type: "raster",
          source: OVERLAY,
          paint: { "raster-opacity": opacity, "raster-fade-duration": 0 },
        },
        "qa-places-layer"
      );
    } else {
      existing.setCoordinates(coords);
      m.setLayoutProperty("qa-overlay-layer", "visibility", "visible");
      m.setPaintProperty("qa-overlay-layer", "raster-opacity", opacity);
    }
  }, [mode, opacity, nudge, bbox, pisteMap, ready]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--separator)] bg-[var(--bg)] px-3 py-2 text-[11px]">
        <div className="inline-flex rounded-sm border border-[var(--separator)] p-0.5">
          {(
            [
              ["side_by_side", "Side by side"],
              ["overlay", "Overlay"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-[4px] px-2 py-0.5",
                mode === m ? "bg-[var(--fill-strong)] font-medium" : "text-[var(--label-3)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "overlay" && (
          <>
            <label className="flex items-center gap-1.5">
              Opacity
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-[110px] accent-[var(--link)]"
                aria-label="Piste map overlay opacity"
              />
              <span className="tabular w-[28px]">{Math.round(opacity * 100)}%</span>
            </label>
            <label className="flex items-center gap-1.5">
              Scale
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={nudge.scale}
                onChange={(e) => setNudge((n) => ({ ...n, scale: Number(e.target.value) }))}
                className="w-[90px] accent-[var(--link)]"
                aria-label="Overlay scale"
              />
            </label>
            <span className="inline-flex items-center gap-1">
              Nudge
              {(
                [
                  ["←", { x: -2, y: 0 }],
                  ["→", { x: 2, y: 0 }],
                  ["↑", { x: 0, y: 2 }],
                  ["↓", { x: 0, y: -2 }],
                ] as const
              ).map(([label, d]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setNudge((n) => ({ ...n, x: n.x + d.x, y: n.y + d.y }))}
                  className="size-5 rounded-sm border border-[var(--separator)] hover:bg-[var(--fill)]"
                  aria-label={`Nudge overlay ${label}`}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setNudge({ x: 0, y: 0, scale: 1 })}
                className="rounded-sm border border-[var(--separator)] px-1.5 py-0.5 hover:bg-[var(--fill)]"
              >
                Reset
              </button>
            </span>
            <span className="text-[10px] text-[var(--label-4)]">
              The sheet is not georeferenced — this is a visual alignment aid, not registration.
            </span>
          </>
        )}

        {pisteMap && (
          <span className="ml-auto truncate text-[10px] text-[var(--label-4)]">
            {pisteMap.source} · {pisteMap.attribution}
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        <div className={cn("min-h-0", mode === "overlay" ? "w-full" : "w-1/2")}>
          <ConsoleMapLazy
            ariaLabel="Our rendered data for this entry"
            bbox={bbox}
            onReady={onReady}
            className="h-full w-full"
          />
        </div>

        {mode === "side_by_side" && (
          <div className="min-h-0 w-1/2 border-l border-[var(--separator)]">
            {pisteMap ? (
              <PannableImage src={pisteMap.url} alt={pisteMap.label} />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <p className="max-w-[32ch] text-[11px] text-[var(--label-3)]">
                  No piste map is attached to this entry. Publish is still possible, but the
                  name-and-count comparison cannot be done without one.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Wheel to zoom, drag to pan. Enough to read run names off a sheet. */
function PannableImage({ src, alt }: { src: string; alt: string }) {
  const [t, setT] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[var(--bg-elevated)]"
      onWheel={(e) => {
        setT((s) => ({ ...s, k: Math.min(6, Math.max(0.5, s.k * (e.deltaY < 0 ? 1.12 : 0.89))) }));
      }}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX - t.x, y: e.clientY - t.y };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        setT((s) => ({ ...s, x: e.clientX - drag.current!.x, y: e.clientY - drag.current!.y }));
      }}
      onPointerUp={() => (drag.current = null)}
      style={{ cursor: drag.current ? "grabbing" : "grab", touchAction: "none" }}
    >
      {/* Fits the pane at scale 1 so the sheet opens readable, then zooms up. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="absolute left-1/2 top-1/2 max-h-full max-w-full select-none object-contain"
        style={{
          transform: `translate(-50%,-50%) translate(${t.x}px, ${t.y}px) scale(${t.k})`,
          transformOrigin: "center",
        }}
      />
      <button
        type="button"
        onClick={() => setT({ x: 0, y: 0, k: 1 })}
        className="absolute right-2 top-2 rounded-sm border border-[var(--separator)] bg-[var(--bg)]/90 px-1.5 py-0.5 text-[10px]"
      >
        Reset view
      </button>
    </div>
  );
}
