"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as maptilersdk from "@maptiler/sdk";
import { ConsoleMapLazy } from "../map/ConsoleMap.lazy";
import type { WorklistRow } from "@/lib/ingestion-api";

const SOURCE = "worklist";
const PRIORITY_COLOR: Record<string, string> = {
  blocked: "#ff3b30",
  ready: "#007aff",
  waiting: "#8e8e93",
  done: "#34c759",
};

function toGeoJson(rows: WorklistRow[]) {
  return {
    type: "FeatureCollection" as const,
    features: rows.map((r) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: r.centroid },
      properties: {
        id: r.registryId,
        name: r.name,
        color: PRIORITY_COLOR[r.nextAction.priority],
        // Group entries are the unit of work; leaves inside a group are smaller.
        radius: r.kind === "group" ? 7 : 4.5,
      },
    })),
  };
}

/**
 * The worklist as geography. Clustered, because 200 points over the Alps
 * overlap badly at continental zoom and an unreadable blob is worse than a
 * number. Colour is priority, not stage — the map answers the same question the
 * table does: what needs me next, and where.
 */
export function WorklistMap({
  rows,
  selectedId,
  onSelect,
}: {
  rows: WorklistRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [ready, setReady] = useState(false);

  const onReady = useCallback((m: maptilersdk.Map) => {
    mapRef.current = m;

    m.addSource(SOURCE, {
      type: "geojson",
      data: toGeoJson(rowsRef.current),
      cluster: true,
      clusterRadius: 44,
      clusterMaxZoom: 9,
    });

    m.addLayer({
      id: "worklist-clusters",
      type: "circle",
      source: SOURCE,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "rgba(0,122,255,0.85)",
        "circle-radius": ["step", ["get", "point_count"], 13, 10, 17, 40, 22],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "rgba(255,255,255,0.9)",
      },
    });

    m.addLayer({
      id: "worklist-cluster-count",
      type: "symbol",
      source: SOURCE,
      filter: ["has", "point_count"],
      layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 11 },
      paint: { "text-color": "#ffffff" },
    });

    m.addLayer({
      id: "worklist-points",
      type: "circle",
      source: SOURCE,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": ["get", "radius"],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "rgba(255,255,255,0.9)",
      },
    });

    m.addLayer({
      id: "worklist-selected",
      type: "circle",
      source: SOURCE,
      filter: ["==", ["get", "id"], ""],
      paint: {
        "circle-color": "rgba(0,0,0,0)",
        "circle-radius": 13,
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#007aff",
      },
    });

    m.on("click", "worklist-points", (e) => {
      const id = e.features?.[0]?.properties?.id;
      if (typeof id === "string") onSelectRef.current(id);
    });
    m.on("click", "worklist-clusters", (e) => {
      const f = e.features?.[0];
      if (!f) return;
      m.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: m.getZoom() + 2 });
    });
    for (const layer of ["worklist-points", "worklist-clusters"]) {
      m.on("mouseenter", layer, () => (m.getCanvas().style.cursor = "pointer"));
      m.on("mouseleave", layer, () => (m.getCanvas().style.cursor = ""));
    }
    // Lets the update effect below run now that the source exists.
    setReady(true);
  }, []);

  // Push filter results and selection without rebuilding the map.
  useEffect(() => {
    const m = mapRef.current;
    if (!m?.isStyleLoaded()) return;
    const src = m.getSource(SOURCE) as maptilersdk.GeoJSONSource | undefined;
    src?.setData(toGeoJson(rows) as GeoJSON.FeatureCollection);
    if (m.getLayer("worklist-selected")) {
      m.setFilter("worklist-selected", ["==", ["get", "id"], selectedId ?? ""]);
    }
  }, [rows, selectedId, ready]);

  return (
    <ConsoleMapLazy
      ariaLabel="Registry entries by location, coloured by what needs attention"
      center={[8, 46]}
      zoom={4.2}
      onReady={onReady}
      className="h-full w-full"
    />
  );
}
