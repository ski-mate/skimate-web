"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as maptilersdk from "@maptiler/sdk";
import { ConsoleMapLazy } from "../map/ConsoleMap.lazy";
import type { BBox, HarvestConflict, PlaceCandidate } from "@/lib/ingestion-api";

const SRC = "harvest";
const FOCUS = "harvest-focus";

export interface LayerVisibility {
  osm: boolean;
  overture: boolean;
  conflated: boolean;
}

function fc(places: PlaceCandidate[]) {
  return {
    type: "FeatureCollection" as const,
    features: places.map((p) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: p.point },
      properties: {
        id: p.id,
        name: p.name,
        layer: p.layer,
        category: p.category,
        // -1 stands for "no confidence signal", which is not the same as low
        // confidence: OSM rows simply do not carry the field.
        confidence: p.confidence ?? -1,
        closed: p.operatingStatus === "permanently_closed" ? 1 : 0,
      },
    })),
  };
}

/** The current conflict, drawn as its two sides plus the line between them. */
function focusFc(conflict: HarvestConflict | null) {
  if (!conflict) return { type: "FeatureCollection" as const, features: [] };
  const features: GeoJSON.Feature[] = [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: conflict.left.point },
      properties: { side: "left" },
    },
  ];
  if (conflict.right) {
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: conflict.right.point },
      properties: { side: "right" },
    });
    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: [conflict.left.point, conflict.right.point] },
      properties: { side: "link" },
    });
  }
  return { type: "FeatureCollection" as const, features };
}

export function HarvestMap({
  places,
  conflict,
  visibility,
  bbox,
  onSelectPlace,
}: {
  places: PlaceCandidate[];
  conflict: HarvestConflict | null;
  visibility: LayerVisibility;
  bbox: BBox;
  onSelectPlace?: (id: string) => void;
}) {
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const [ready, setReady] = useState(false);
  const placesRef = useRef(places);
  placesRef.current = places;
  const onSelectRef = useRef(onSelectPlace);
  onSelectRef.current = onSelectPlace;

  const onReady = useCallback((m: maptilersdk.Map) => {
    mapRef.current = m;

    m.addSource(SRC, { type: "geojson", data: fc(placesRef.current) });
    m.addSource(FOCUS, { type: "geojson", data: focusFc(null) });

    // OSM: the free structural layer. Neutral green, no confidence to show.
    m.addLayer({
      id: "harvest-osm",
      type: "circle",
      source: SRC,
      filter: ["==", ["get", "layer"], "osm"],
      paint: {
        "circle-color": "#7cb342",
        "circle-radius": 4,
        "circle-opacity": 0.85,
        "circle-stroke-width": 1,
        "circle-stroke-color": "rgba(255,255,255,0.7)",
      },
    });

    // Overture: coloured by confidence, because that is the number the analyst
    // is deciding against. Red below the threshold, violet well above it.
    m.addLayer({
      id: "harvest-overture",
      type: "circle",
      source: SRC,
      filter: ["==", ["get", "layer"], "overture"],
      paint: {
        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "confidence"],
          0.3,
          "#ff3b30",
          0.5,
          "#ff9500",
          0.7,
          "#5e5ce6",
          0.95,
          "#30d158",
        ],
        "circle-radius": 4.5,
        "circle-opacity": 0.9,
        "circle-stroke-width": 1,
        "circle-stroke-color": "rgba(255,255,255,0.7)",
      },
    });

    m.addLayer({
      id: "harvest-conflated",
      type: "circle",
      source: SRC,
      filter: ["==", ["get", "layer"], "conflated"],
      paint: {
        "circle-color": "#007aff",
        "circle-radius": 4,
        "circle-opacity": 0.8,
        "circle-stroke-width": 1,
        "circle-stroke-color": "rgba(255,255,255,0.7)",
      },
    });

    // Closed places get a ring rather than a colour, so the confidence ramp
    // above stays readable.
    m.addLayer({
      id: "harvest-closed",
      type: "circle",
      source: SRC,
      filter: ["==", ["get", "closed"], 1],
      paint: {
        "circle-color": "rgba(0,0,0,0)",
        "circle-radius": 8,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#ff3b30",
        "circle-stroke-opacity": 0.8,
      },
    });

    m.addLayer({
      id: "harvest-focus-line",
      type: "line",
      source: FOCUS,
      filter: ["==", ["geometry-type"], "LineString"],
      paint: { "line-color": "#ff9500", "line-width": 2, "line-dasharray": [2, 1.5] },
    });

    m.addLayer({
      id: "harvest-focus-point",
      type: "circle",
      source: FOCUS,
      filter: ["==", ["geometry-type"], "Point"],
      paint: {
        "circle-color": ["match", ["get", "side"], "left", "#ff9500", "#af52de"],
        "circle-radius": 8,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    for (const id of ["harvest-osm", "harvest-overture", "harvest-conflated"]) {
      m.on("click", id, (e) => {
        const pid = e.features?.[0]?.properties?.id;
        if (typeof pid === "string") onSelectRef.current?.(pid);
      });
      m.on("mouseenter", id, () => (m.getCanvas().style.cursor = "pointer"));
      m.on("mouseleave", id, () => (m.getCanvas().style.cursor = ""));
    }

    setReady(true);
  }, []);

  useEffect(() => {
    const m = mapRef.current;
    if (!m?.isStyleLoaded()) return;
    (m.getSource(SRC) as maptilersdk.GeoJSONSource | undefined)?.setData(
      fc(places) as GeoJSON.FeatureCollection
    );
  }, [places, ready]);

  useEffect(() => {
    const m = mapRef.current;
    if (!m?.isStyleLoaded()) return;
    for (const [key, layer] of [
      ["osm", "harvest-osm"],
      ["overture", "harvest-overture"],
      ["conflated", "harvest-conflated"],
    ] as const) {
      if (m.getLayer(layer)) {
        m.setLayoutProperty(layer, "visibility", visibility[key] ? "visible" : "none");
      }
    }
  }, [visibility, ready]);

  // Follow the queue cursor: framing the pair is the whole point of the map on
  // this screen, so it moves with j/k rather than waiting to be clicked.
  useEffect(() => {
    const m = mapRef.current;
    if (!m?.isStyleLoaded()) return;
    (m.getSource(FOCUS) as maptilersdk.GeoJSONSource | undefined)?.setData(
      focusFc(conflict) as GeoJSON.FeatureCollection
    );
    if (!conflict) return;
    const pts = conflict.right ? [conflict.left.point, conflict.right.point] : [conflict.left.point];
    const lngs = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    const pad = 0.004;
    m.fitBounds(
      [
        [Math.min(...lngs) - pad, Math.min(...lats) - pad],
        [Math.max(...lngs) + pad, Math.max(...lats) + pad],
      ],
      { padding: 90, maxZoom: 16.5, duration: 350 }
    );
  }, [conflict, ready]);

  return (
    <ConsoleMapLazy
      ariaLabel="Harvested places by source, with the selected conflict highlighted"
      bbox={bbox}
      onReady={onReady}
      className="h-full w-full"
    />
  );
}
