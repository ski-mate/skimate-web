"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as maptilersdk from "@maptiler/sdk";
import { ConsoleMapLazy } from "../map/ConsoleMap.lazy";
import type { BBox, MembershipResponse, OrphanPlace } from "@/lib/ingestion-api";

const SRC = "membership";
const ORPHANS = "membership-orphans";
const FOCUS = "membership-focus";

/** Stable member palette. Index is assigned server-side so legend and map agree. */
export const MEMBER_COLORS = [
  "#007aff",
  "#34c759",
  "#ff9500",
  "#af52de",
  "#5ac8fa",
  "#ffcc00",
  "#ff6482",
  "#30b0c7",
] as const;

export function memberColor(i: number): string {
  return MEMBER_COLORS[i % MEMBER_COLORS.length];
}

function placesFc(data: MembershipResponse) {
  const colorOf = new Map(data.members.map((m) => [m.resortId, memberColor(m.colorIndex)]));
  return {
    type: "FeatureCollection" as const,
    features: data.places.map((p) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: p.point },
      properties: {
        id: p.id,
        name: p.name,
        color: colorOf.get(p.memberIds[0] ?? "") ?? "#8e8e93",
        // A place can legitimately belong to two resorts — a ridge hut, a lift
        // station. It is drawn with a second ring rather than reassigned.
        multi: p.memberIds.length > 1 ? 1 : 0,
        basis: p.bases[0] ?? "network",
      },
    })),
  };
}

function orphansFc(orphans: OrphanPlace[]) {
  return {
    type: "FeatureCollection" as const,
    features: orphans
      .filter((o) => !o.resolved)
      .map((o) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: o.place.point },
        properties: { id: o.id, name: o.place.name },
      })),
  };
}

export function MembershipMap({
  data,
  activeOrphan,
  bbox,
  onSelectOrphan,
}: {
  data: MembershipResponse;
  activeOrphan: OrphanPlace | null;
  bbox: BBox;
  onSelectOrphan: (id: string) => void;
}) {
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const [ready, setReady] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const onSelectRef = useRef(onSelectOrphan);
  onSelectRef.current = onSelectOrphan;

  const onReady = useCallback((m: maptilersdk.Map) => {
    mapRef.current = m;

    m.addSource(SRC, { type: "geojson", data: placesFc(dataRef.current) });
    m.addSource(ORPHANS, { type: "geojson", data: orphansFc(dataRef.current.orphans) });
    m.addSource(FOCUS, { type: "geojson", data: { type: "FeatureCollection", features: [] } });

    m.addLayer({
      id: "membership-places",
      type: "circle",
      source: SRC,
      paint: {
        "circle-color": ["get", "color"],
        // Settlement-assigned places are drawn slightly smaller than
        // network-assigned ones: the network rule is the stronger claim.
        "circle-radius": ["match", ["get", "basis"], "settlement", 3.5, 4.5],
        "circle-opacity": 0.9,
        "circle-stroke-width": 1,
        "circle-stroke-color": "rgba(255,255,255,0.65)",
      },
    });

    m.addLayer({
      id: "membership-multi",
      type: "circle",
      source: SRC,
      filter: ["==", ["get", "multi"], 1],
      paint: {
        "circle-color": "rgba(0,0,0,0)",
        "circle-radius": 8,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-opacity": 0.9,
      },
    });

    // The orphan belt, deliberately loud. It is the single most diagnostic
    // thing on this screen: a belt means a missing member boundary.
    m.addLayer({
      id: "membership-orphan-halo",
      type: "circle",
      source: ORPHANS,
      paint: {
        "circle-color": "#ff3b30",
        "circle-radius": 15,
        "circle-opacity": 0.18,
        "circle-blur": 0.4,
      },
    });

    m.addLayer({
      id: "membership-orphan",
      type: "circle",
      source: ORPHANS,
      paint: {
        "circle-color": "#ff3b30",
        "circle-radius": 5.5,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#ffffff",
      },
    });

    m.addLayer({
      id: "membership-focus",
      type: "circle",
      source: FOCUS,
      paint: {
        "circle-color": "rgba(0,0,0,0)",
        "circle-radius": 13,
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#ff9500",
      },
    });

    m.on("click", "membership-orphan", (e) => {
      const id = e.features?.[0]?.properties?.id;
      if (typeof id === "string") onSelectRef.current(id);
    });
    m.on("mouseenter", "membership-orphan", () => (m.getCanvas().style.cursor = "pointer"));
    m.on("mouseleave", "membership-orphan", () => (m.getCanvas().style.cursor = ""));

    setReady(true);
  }, []);

  useEffect(() => {
    const m = mapRef.current;
    if (!m?.isStyleLoaded()) return;
    (m.getSource(SRC) as maptilersdk.GeoJSONSource | undefined)?.setData(
      placesFc(data) as GeoJSON.FeatureCollection
    );
    (m.getSource(ORPHANS) as maptilersdk.GeoJSONSource | undefined)?.setData(
      orphansFc(data.orphans) as GeoJSON.FeatureCollection
    );
  }, [data, ready]);

  useEffect(() => {
    const m = mapRef.current;
    if (!m?.isStyleLoaded()) return;
    const fc = {
      type: "FeatureCollection" as const,
      features: activeOrphan
        ? [
            {
              type: "Feature" as const,
              geometry: { type: "Point" as const, coordinates: activeOrphan.place.point },
              properties: {},
            },
          ]
        : [],
    };
    (m.getSource(FOCUS) as maptilersdk.GeoJSONSource | undefined)?.setData(
      fc as GeoJSON.FeatureCollection
    );
    if (activeOrphan) {
      m.easeTo({ center: activeOrphan.place.point, zoom: Math.max(m.getZoom(), 13), duration: 350 });
    }
  }, [activeOrphan, ready]);

  return (
    <ConsoleMapLazy
      ariaLabel="Places coloured by assigned member resort, with the unclaimed orphan belt highlighted"
      bbox={bbox}
      onReady={onReady}
      className="h-full w-full"
    />
  );
}
