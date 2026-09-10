"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as maptilersdk from "@maptiler/sdk";
import { ConsoleMapLazy } from "../map/ConsoleMap.lazy";
import type { BBox, IdentityCandidate, LngLat, VillageSeed } from "@/lib/ingestion-api";

const CANDIDATES = "onboard-candidates";
const EXTENT = "onboard-extent";
const SEEDS = "onboard-seeds";

export type MapTool = "none" | "bbox" | "seed";

const SOURCE_COLOR: Record<IdentityCandidate["source"], string> = {
  skimap: "#0f9d9d",
  wikidata: "#af52de",
  osm: "#7cb342",
};

function bboxPolygon(b: BBox) {
  const [w, s, e, n] = b;
  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
        },
        properties: {},
      },
    ],
  };
}

/**
 * The wizard's map: candidates from all three identity sources side by side,
 * the declared extent, and the village seeds.
 *
 * The only drawing tool in the console lives here — bbox corners and seed
 * points. Everything else the analyst does is a decision about data the
 * pipeline already produced; this is the one place where they supply geometry,
 * because the manifest cannot be derived from anything that exists yet.
 */
export function OnboardingMap({
  candidates,
  selectedIds,
  bbox,
  seeds,
  tool,
  onPickCandidate,
  onBboxDrawn,
  onSeedDropped,
}: {
  candidates: IdentityCandidate[];
  selectedIds: Set<string>;
  bbox: BBox;
  seeds: VillageSeed[];
  tool: MapTool;
  onPickCandidate: (id: string) => void;
  onBboxDrawn: (b: BBox) => void;
  onSeedDropped: (p: LngLat) => void;
}) {
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const [ready, setReady] = useState(false);
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const cornerRef = useRef<LngLat | null>(null);
  const cb = useRef({ onPickCandidate, onBboxDrawn, onSeedDropped });
  cb.current = { onPickCandidate, onBboxDrawn, onSeedDropped };

  const onReady = useCallback((m: maptilersdk.Map) => {
    mapRef.current = m;

    m.addSource(EXTENT, { type: "geojson", data: bboxPolygon([0, 0, 0, 0]) });
    m.addLayer({
      id: "onboard-extent-fill",
      type: "fill",
      source: EXTENT,
      paint: { "fill-color": "#007aff", "fill-opacity": 0.08 },
    });
    m.addLayer({
      id: "onboard-extent-line",
      type: "line",
      source: EXTENT,
      paint: { "line-color": "#007aff", "line-width": 1.5, "line-dasharray": [3, 2] },
    });

    m.addSource(CANDIDATES, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    m.addLayer({
      id: "onboard-candidates-layer",
      type: "circle",
      source: CANDIDATES,
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": ["case", ["==", ["get", "selected"], 1], 8, 5],
        "circle-stroke-width": ["case", ["==", ["get", "selected"], 1], 2.5, 1],
        "circle-stroke-color": "#ffffff",
      },
    });

    m.addSource(SEEDS, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    m.addLayer({
      id: "onboard-seeds-layer",
      type: "circle",
      source: SEEDS,
      paint: {
        "circle-color": "#ff9500",
        "circle-radius": 6,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
    m.addLayer({
      id: "onboard-seeds-label",
      type: "symbol",
      source: SEEDS,
      layout: {
        "text-field": ["get", "name"],
        "text-size": 11,
        "text-offset": [0, 1.1],
        "text-anchor": "top",
      },
      paint: { "text-color": "#ff9500", "text-halo-color": "#ffffff", "text-halo-width": 1.2 },
    });

    m.on("click", (e) => {
      const t = toolRef.current;
      if (t === "seed") {
        cb.current.onSeedDropped([e.lngLat.lng, e.lngLat.lat]);
        return;
      }
      if (t === "bbox") {
        const p: LngLat = [e.lngLat.lng, e.lngLat.lat];
        if (!cornerRef.current) {
          cornerRef.current = p;
        } else {
          const a = cornerRef.current;
          cornerRef.current = null;
          cb.current.onBboxDrawn([
            Math.min(a[0], p[0]),
            Math.min(a[1], p[1]),
            Math.max(a[0], p[0]),
            Math.max(a[1], p[1]),
          ]);
        }
        return;
      }
    });

    m.on("click", "onboard-candidates-layer", (e) => {
      if (toolRef.current !== "none") return;
      const id = e.features?.[0]?.properties?.id;
      if (typeof id === "string") cb.current.onPickCandidate(id);
    });
    m.on("mouseenter", "onboard-candidates-layer", () => (m.getCanvas().style.cursor = "pointer"));
    m.on("mouseleave", "onboard-candidates-layer", () => (m.getCanvas().style.cursor = ""));

    setReady(true);
  }, []);

  useEffect(() => {
    const m = mapRef.current;
    if (!m?.isStyleLoaded()) return;
    (m.getSource(CANDIDATES) as maptilersdk.GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: candidates.map((c) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: c.centroid },
        properties: {
          id: c.id,
          color: SOURCE_COLOR[c.source],
          selected: selectedIds.has(c.id) ? 1 : 0,
        },
      })),
    } as GeoJSON.FeatureCollection);
  }, [candidates, selectedIds, ready]);

  useEffect(() => {
    const m = mapRef.current;
    if (!m?.isStyleLoaded()) return;
    (m.getSource(EXTENT) as maptilersdk.GeoJSONSource | undefined)?.setData(
      bboxPolygon(bbox) as GeoJSON.FeatureCollection
    );
  }, [bbox, ready]);

  useEffect(() => {
    const m = mapRef.current;
    if (!m?.isStyleLoaded()) return;
    (m.getSource(SEEDS) as maptilersdk.GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: seeds.map((s) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: s.point },
        properties: { name: s.name },
      })),
    } as GeoJSON.FeatureCollection);
  }, [seeds, ready]);

  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    m.getCanvas().style.cursor = tool === "none" ? "" : "crosshair";
    if (tool !== "bbox") cornerRef.current = null;
  }, [tool]);

  return (
    <ConsoleMapLazy
      ariaLabel="Identity candidates, the declared extent and village seed points"
      bbox={bbox}
      onReady={onReady}
      className="h-full w-full"
    />
  );
}

export { SOURCE_COLOR as CANDIDATE_SOURCE_COLOR };
