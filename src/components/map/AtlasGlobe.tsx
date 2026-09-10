"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import {
  loadAtlasStyle,
  repaintAtlasCartography,
  type CartoScheme,
} from "@/lib/map/cartography";
import type { Resort } from "@/content/resorts/types";

const KEY =
  process.env.NEXT_PUBLIC_MAPTILER_API_KEY || process.env.MAPTILER_API_KEY || "";

const DOT_LAYER = "atlas-resorts";
const RING_LAYER = "atlas-resort-selected";
const SOURCE = "atlas-resorts";

/**
 * Dot colours per scheme. Apple's Maps accent is #007bfe in light and #0385ff
 * in dark; "catalogued" has to read as *less* than that in both, which means a
 * darker grey on a dark globe, not a brighter one.
 */
function dotColors(scheme: CartoScheme) {
  return scheme === "dark"
    ? { live: "#0385ff", muted: "rgba(138,145,158,0.75)", stroke: "rgba(0,0,0,0.5)" }
    : { live: "#007bfe", muted: "rgba(120,120,128,0.85)", stroke: "#ffffff" };
}

/** Frames the inhabited ski world — the Alps face the viewer, Japan and the Rockies stay on the limb. */
const HOME = { center: [8, 40] as [number, number], zoom: 1.6, pitch: 0, bearing: 0 };

/** Zoom at which the piste and lift network becomes the point of the map. */
const RESORT_ZOOM = 12;

/**
 * Where to point the globe for a given set of resorts.
 *
 * Averaging longitudes numerically breaks across the antimeridian (Japan and
 * California average to the middle of the Atlantic), so the centroid is the
 * normalised mean of the unit vectors instead — the standard fix, and the one
 * case where a globe genuinely needs different maths from a flat map.
 */
function frameFor(resorts: Resort[]): { center: [number, number]; zoom: number } | null {
  if (resorts.length === 0) return null;

  const rad = Math.PI / 180;
  let x = 0;
  let y = 0;
  let z = 0;
  for (const r of resorts) {
    const lat = r.lat * rad;
    const lng = r.lng * rad;
    x += Math.cos(lat) * Math.cos(lng);
    y += Math.cos(lat) * Math.sin(lng);
    z += Math.sin(lat);
  }
  x /= resorts.length;
  y /= resorts.length;
  z /= resorts.length;

  const hyp = Math.sqrt(x * x + y * y);
  const center: [number, number] = [
    Math.atan2(y, x) / rad,
    Math.atan2(z, hyp) / rad,
  ];

  // Angular spread from the centroid, turned into a zoom that keeps the whole
  // selection on the visible face of the globe.
  const clat = center[1] * rad;
  const clng = center[0] * rad;
  let spread = 0;
  for (const r of resorts) {
    const lat = r.lat * rad;
    const lng = r.lng * rad;
    const cos =
      Math.sin(clat) * Math.sin(lat) +
      Math.cos(clat) * Math.cos(lat) * Math.cos(lng - clng);
    spread = Math.max(spread, Math.acos(Math.min(1, Math.max(-1, cos))) / rad);
  }

  const zoom = Math.min(8, Math.max(1.2, Math.log2(360 / Math.max(spread * 3, 5))));
  return { center, zoom };
}

function toFeatureCollection(
  resorts: Resort[],
  visible: Set<string>
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: resorts.map((r) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [r.lng, r.lat] },
      properties: {
        slug: r.slug,
        name: r.name,
        live: r.coverage === "live" ? 1 : 0,
        dim: visible.has(r.slug) ? 0 : 1,
      },
    })),
  };
}

/**
 * Camera moves are animations. Someone who has asked the system to reduce
 * motion should be taken to the new view, not flown there.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Reads the scheme the page is actually rendering in, including `auto`. */
function readScheme(): CartoScheme {
  if (typeof window === "undefined") return "light";
  const attr = document.documentElement.dataset.scheme;
  if (attr === "dark") return "dark";
  if (attr === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export interface AtlasGlobeProps {
  /** Every resort in the catalogue — the source of truth for the dot layer. */
  resorts: Resort[];
  /** The currently filtered subset; everything else fades back. */
  visible: Set<string>;
  selected: Resort | null;
  onSelect: (slug: string | null) => void;
}

export function AtlasGlobe({ resorts, visible, selected, onSelect }: AtlasGlobeProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const ready = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  // Read once inside the build effect; the effect below owns updates.
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  /** Suppresses the "reset to HOME" ease on the very first render. */
  const firstFrame = useRef(false);

  const [scheme, setScheme] = useState<CartoScheme>("light");
  const [globe, setGlobe] = useState(true);

  useEffect(() => {
    setScheme(readScheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setScheme(readScheme());
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Build once. Resort data, selection and scheme are pushed in by the effects
  // below rather than rebuilding the map, which would restart every tile load.
  useEffect(() => {
    if (!container.current || map.current || !KEY) return;
    let cancelled = false;

    // The restyled style is fetched before the map is constructed, so the globe
    // never renders a frame of MapTiler's default style on the way to winter.
    void buildMap();

    async function buildMap() {
      const style = await loadAtlasStyle(KEY, readScheme()).catch(() => null);
      if (cancelled || !style || !container.current || map.current) return;

      maptilersdk.config.apiKey = KEY;
      const m = new maptilersdk.Map({
        container: container.current,
        style,
        projection: "globe",
        ...HOME,
        minZoom: 1,
        maxZoom: 16,
        navigationControl: false,
        geolocateControl: false,
        scaleControl: false,
        fullscreenControl: false,
        terrainControl: false,
        // Without this the map swallows page scroll and the footer becomes
        // unreachable. Cmd/Ctrl + scroll still zooms.
        cooperativeGestures: true,
        attributionControl: { compact: true },
      });
      map.current = m;

      m.on("load", () => {
        ready.current = true;

        m.addSource(SOURCE, {
          type: "geojson",
          data: toFeatureCollection(resorts, visibleRef.current),
        });

        m.addLayer({
          id: RING_LAYER,
          type: "circle",
          source: SOURCE,
          filter: ["==", ["get", "slug"], ""],
          paint: {
            "circle-radius": 13,
            "circle-color": "rgba(0,123,254,0.18)",
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#007bfe",
          },
        });

        m.addLayer({
          id: DOT_LAYER,
          type: "circle",
          source: SOURCE,
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 3, 5, 5.5, 10, 8],
            // Live coverage is the Maps accent; catalogued resorts are the muted
            // grey Apple gives every out-of-focus place. The map should never
            // imply more coverage than exists.
            "circle-color": [
              "case",
              ["==", ["get", "live"], 1],
              dotColors(readScheme()).live,
              dotColors(readScheme()).muted,
            ],
            "circle-stroke-width": 1.25,
            "circle-stroke-color": dotColors(readScheme()).stroke,
            "circle-opacity": ["case", ["==", ["get", "dim"], 1], 0.14, 1],
            "circle-stroke-opacity": ["case", ["==", ["get", "dim"], 1], 0.1, 1],
          },
        });

        m.on("click", DOT_LAYER, (e) => {
          const slug = e.features?.[0]?.properties?.slug;
          if (typeof slug === "string") onSelectRef.current(slug);
        });
        m.on("click", (e) => {
          const hits = m.queryRenderedFeatures(e.point, { layers: [DOT_LAYER] });
          if (hits.length === 0) onSelectRef.current(null);
        });
        m.on("mouseenter", DOT_LAYER, () => {
          m.getCanvas().style.cursor = "pointer";
        });
        m.on("mouseleave", DOT_LAYER, () => {
          m.getCanvas().style.cursor = "";
        });
      });
    }

    return () => {
      cancelled = true;
      ready.current = false;
      map.current?.remove();
      map.current = null;
    };
    // `resorts` is a build-time constant; re-running would tear down the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtering dims rather than removes, so narrowing the filters reads as the
  // rest of the world receding instead of resorts blinking out of existence.
  // The globe also turns to face the result — filtering to Japan is useless if
  // Japan is on the far side of the sphere.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready.current) return;

    const source = m.getSource(SOURCE) as maptilersdk.GeoJSONSource | undefined;
    source?.setData(toFeatureCollection(resorts, visible));

    if (selectedRef.current) return; // a selection owns the camera
    const narrowed = visible.size > 0 && visible.size < resorts.length;
    const frame = narrowed
      ? frameFor(resorts.filter((r) => visible.has(r.slug)))
      : firstFrame.current
        ? null
        : HOME;
    firstFrame.current = true;
    if (!frame) return;
    if (prefersReducedMotion()) m.jumpTo(frame);
    else m.easeTo({ ...frame, duration: 900 });
  }, [resorts, visible]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready.current) return;
    if (!m.getLayer(RING_LAYER)) return;
    m.setFilter(RING_LAYER, ["==", ["get", "slug"], selected?.slug ?? ""]);
    if (selected) {
      const target = {
        center: [selected.lng, selected.lat] as [number, number],
        zoom: Math.max(m.getZoom(), RESORT_ZOOM),
      };
      if (prefersReducedMotion()) m.jumpTo(target);
      else m.flyTo({ ...target, speed: 0.9, curve: 1.4 });
    }
  }, [selected]);

  // Terrain is only worth its tile cost once the mountain fills the screen.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const sync = () => {
      const close = m.getZoom() >= 9;
      try {
        if (close) m.enableTerrain(1.15);
        else m.disableTerrain();
      } catch {
        /* terrain unavailable on this plan or projection — the map still works */
      }
    };
    m.on("zoomend", sync);
    return () => {
      m.off("zoomend", sync);
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready.current) return;
    repaintAtlasCartography(m, scheme);

    if (!m.getLayer(DOT_LAYER)) return;
    const c = dotColors(scheme);
    m.setPaintProperty(DOT_LAYER, "circle-color", [
      "case",
      ["==", ["get", "live"], 1],
      c.live,
      c.muted,
    ]);
    m.setPaintProperty(DOT_LAYER, "circle-stroke-color", c.stroke);
    m.setPaintProperty(RING_LAYER, "circle-stroke-color", c.live);
    m.setPaintProperty(
      RING_LAYER,
      "circle-color",
      scheme === "dark" ? "rgba(3,133,255,0.22)" : "rgba(0,123,254,0.18)"
    );
  }, [scheme]);

  const home = useCallback(() => {
    onSelectRef.current(null);
    const m = map.current;
    if (!m) return;
    if (prefersReducedMotion()) m.jumpTo(HOME);
    else m.flyTo({ ...HOME, speed: 1.1 });
  }, []);

  const toggleProjection = useCallback(() => {
    const m = map.current;
    if (!m) return;
    setGlobe((wasGlobe) => {
      m.setProjection(wasGlobe ? "mercator" : "globe", { persist: true });
      return !wasGlobe;
    });
  }, []);

  if (!KEY) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg-elevated px-gutter text-center">
        <p className="type-callout text-label-3">
          The Atlas needs a MapTiler key. Set{" "}
          <code className="rounded-sm bg-fill px-1">NEXT_PUBLIC_MAPTILER_API_KEY</code> to
          load it.
        </p>
      </div>
    );
  }

  return (
    <>
      <div ref={container} className="atlas-map h-full w-full" />
      <AtlasControls
        globe={globe}
        onHome={home}
        onToggleProjection={toggleProjection}
        onZoom={(delta) =>
          map.current?.zoomTo((map.current?.getZoom() ?? 2) + delta, {
            duration: prefersReducedMotion() ? 0 : 300,
          })
        }
      />
    </>
  );
}

/**
 * MapTiler's stock controls are replaced wholesale: 44px circles at a 16px
 * margin with 12px gaps, the chrome material and the double shadow from
 * apple-ui-brain/00-foundations/materials.md.
 */
function AtlasControls({
  globe,
  onHome,
  onToggleProjection,
  onZoom,
}: {
  globe: boolean;
  onHome: () => void;
  onToggleProjection: () => void;
  onZoom: (delta: number) => void;
}) {
  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-20 flex flex-col gap-3">
      <div className="material-panel pointer-events-auto overflow-hidden rounded-tile border border-[var(--separator)] shadow-float">
        <ControlButton label="Zoom in" onClick={() => onZoom(1)}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </ControlButton>
        <div className="mx-2 h-px bg-[var(--separator)]" />
        <ControlButton label="Zoom out" onClick={() => onZoom(-1)}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <path d="M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </ControlButton>
      </div>

      <div className="material-panel pointer-events-auto overflow-hidden rounded-tile border border-[var(--separator)] shadow-float">
        <ControlButton
          label={globe ? "Switch to flat map" : "Switch to globe"}
          onClick={onToggleProjection}
        >
          {globe ? (
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
              <path d="M2.5 8.5h15M8 4.5v11" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.4" fill="none" />
              <ellipse cx="10" cy="10" rx="3.2" ry="7.2" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <path d="M3 10h14" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </ControlButton>
        <div className="mx-2 h-px bg-[var(--separator)]" />
        <ControlButton label="Reset the view" onClick={onHome}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <path
              d="M10 3.2 16.8 10 10 16.8 3.2 10Z"
              stroke="currentColor"
              strokeWidth="1.4"
              fill="none"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="10" r="1.6" fill="currentColor" />
          </svg>
        </ControlButton>
      </div>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center text-label-2 transition-colors hover:bg-[var(--fill)] hover:text-label"
    >
      {children}
    </button>
  );
}
