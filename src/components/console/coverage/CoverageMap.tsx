"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as maptilersdk from "@maptiler/sdk";
import { ConsoleMapLazy } from "../map/ConsoleMap.lazy";
import type { BBox, CoverageFinding, CoverageFindingType } from "@/lib/ingestion-api";

const SRC = "coverage-findings";
const FOCUS = "coverage-focus";

/**
 * Findings are coloured by type, not by severity, because the analyst reads
 * this map by kind: a scatter of red terminals along one lift line is a
 * connector bug, a single orange blob is an isolated sector, and a wash of grey
 * is untagged difficulty. Severity is already in the gate panel.
 */
export const FINDING_COLOR: Record<CoverageFindingType, string> = {
  unconnected_terminal: "#ff3b30",
  isolated_component: "#ff9500",
  missing_reference_lift: "#af52de",
  missing_difficulty: "#8e8e93",
};

export const FINDING_LABEL: Record<CoverageFindingType, string> = {
  unconnected_terminal: "Unconnected terminal",
  isolated_component: "Isolated component",
  missing_reference_lift: "Missing reference lift",
  missing_difficulty: "Missing difficulty",
};

function findingsFc(findings: CoverageFinding[]) {
  return {
    type: "FeatureCollection" as const,
    features: findings
      .filter((f) => f.point !== null)
      .map((f) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: f.point as [number, number] },
        properties: {
          id: f.id,
          name: f.label,
          color: FINDING_COLOR[f.type],
          // A reviewed finding stays on the map but recedes: it is context for
          // the ones still open, not something to click again.
          resolved: f.verdict ? 1 : 0,
          // Isolated components are areas, so they get a larger dot than a
          // point defect does.
          radius: f.type === "isolated_component" ? 8 : 5.5,
        },
      })),
  };
}

/**
 * No graph-edge rendering here, deliberately. Les 3 Vallées is ~21k edges and
 * drawing them is a rendering project, not a review queue — the findings are
 * what needs looking at, and the map's job is to put each one in its terrain.
 */
export function CoverageMap({
  findings,
  active,
  bbox,
  onSelect,
}: {
  findings: CoverageFinding[];
  active: CoverageFinding | null;
  bbox: BBox;
  onSelect: (id: string) => void;
}) {
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const [ready, setReady] = useState(false);
  const findingsRef = useRef(findings);
  findingsRef.current = findings;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const onReady = useCallback((m: maptilersdk.Map) => {
    mapRef.current = m;

    m.addSource(SRC, { type: "geojson", data: findingsFc(findingsRef.current) });
    m.addSource(FOCUS, { type: "geojson", data: { type: "FeatureCollection", features: [] } });

    m.addLayer({
      id: "coverage-halo",
      type: "circle",
      source: SRC,
      filter: ["==", ["get", "resolved"], 0],
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": ["*", ["get", "radius"], 2.6],
        "circle-opacity": 0.16,
        "circle-blur": 0.4,
      },
    });

    m.addLayer({
      id: "coverage-finding",
      type: "circle",
      source: SRC,
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": ["get", "radius"],
        "circle-opacity": ["match", ["get", "resolved"], 1, 0.32, 0.95],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-opacity": ["match", ["get", "resolved"], 1, 0.35, 0.9],
      },
    });

    m.addLayer({
      id: "coverage-focus",
      type: "circle",
      source: FOCUS,
      paint: {
        "circle-color": "rgba(0,0,0,0)",
        "circle-radius": 14,
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#007aff",
      },
    });

    m.on("click", "coverage-finding", (e) => {
      const id = e.features?.[0]?.properties?.id;
      if (typeof id === "string") onSelectRef.current(id);
    });
    m.on("mouseenter", "coverage-finding", () => (m.getCanvas().style.cursor = "pointer"));
    m.on("mouseleave", "coverage-finding", () => (m.getCanvas().style.cursor = ""));

    setReady(true);
  }, []);

  useEffect(() => {
    const m = mapRef.current;
    if (!m?.isStyleLoaded()) return;
    (m.getSource(SRC) as maptilersdk.GeoJSONSource | undefined)?.setData(
      findingsFc(findings) as GeoJSON.FeatureCollection
    );
  }, [findings, ready]);

  useEffect(() => {
    const m = mapRef.current;
    if (!m?.isStyleLoaded()) return;
    const point = active?.point ?? null;
    (m.getSource(FOCUS) as maptilersdk.GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: point
        ? [{ type: "Feature", geometry: { type: "Point", coordinates: point }, properties: {} }]
        : [],
    } as GeoJSON.FeatureCollection);
    if (point) m.easeTo({ center: point, zoom: Math.max(m.getZoom(), 13), duration: 350 });
  }, [active, ready]);

  return (
    <ConsoleMapLazy
      ariaLabel="Routing coverage findings, coloured by type"
      bbox={bbox}
      onReady={onReady}
      className="h-full w-full"
    />
  );
}
