"use client";

import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { loadAtlasStyle } from "@/lib/map/cartography";
import type { Resort } from "@/content/resorts/types";

const KEY =
  process.env.NEXT_PUBLIC_MAPTILER_API_KEY || process.env.MAPTILER_API_KEY || "";

/**
 * World map of every catalogued resort. Live resorts are drawn in the system
 * blue; catalogued ones are muted, so the map tells the truth about coverage
 * at a glance rather than implying everything is mapped.
 */
export function ResortMap({ resorts }: { resorts: Resort[] }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);


  useEffect(() => {
    if (!container.current || map.current || !KEY) return;

    // A single resort frames itself; the full catalogue spans five continents,
    // so it needs a world view rather than a European one.
    const single = resorts.length === 1;
    const center: [number, number] = single
      ? [resorts[0].lng, resorts[0].lat]
      : [-10, 34];
    const zoom = single ? 11 : 1.15;

    let cancelled = false;

    // Always the light palette: the hero's own scrim supplies the darkness, and
    // the dark cartography under it comes out nearly black. Fetching the
    // restyled style before construction also means these heroes never render a
    // frame of MapTiler's stock winter palette.
    void buildMap();

    async function buildMap() {
      const style = await loadAtlasStyle(KEY, "light").catch(() => null);
      if (cancelled || !style || !container.current || map.current) return;

      maptilersdk.config.apiKey = KEY;
      const m = new maptilersdk.Map({
        container: container.current,
        style,
        center,
        zoom,
        navigationControl: false,
        geolocateControl: false,
        // This map is a backdrop, not a tool — /map is where you explore. Making
        // it non-interactive also takes the canvas out of the tab order, so the
        // decorative wrapper can carry aria-hidden without hiding anything
        // focusable.
        interactive: false,
        // The MapTiler SDK renders its attribution control regardless of this
        // flag, and on these heroes it lands under a dark scrim inside an
        // aria-hidden wrapper: unreadable, and a focusable link where none
        // should be. It is hidden in CSS and re-rendered by <MapCredit>, which
        // shows the same credit as real page content.
        attributionControl: false,
      });
      map.current = m;

      m.on("load", () => {
        m.getCanvas().setAttribute(
          "aria-label",
          single
            ? `Map showing the location of ${resorts[0].name}`
            : "World map showing every ski resort in Alpline's catalogue"
        );

        m.addSource("resorts", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: resorts.map((r) => ({
              type: "Feature" as const,
              geometry: { type: "Point" as const, coordinates: [r.lng, r.lat] },
              properties: { name: r.name, live: r.coverage === "live" ? 1 : 0 },
            })),
          },
        });

        m.addLayer({
          id: "resort-dots",
          type: "circle",
          source: "resorts",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 3.5, 6, 7, 11, 10],
            "circle-color": [
              "case",
              ["==", ["get", "live"], 1],
              "#007AFF",
              "rgba(120,120,128,0.55)",
            ],
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
          },
        });
      });
    }

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, [resorts]);

  if (!KEY) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--bg-elevated)]">
        <p className="type-caption text-[var(--label-3)]">
          Map unavailable — NEXT_PUBLIC_MAPTILER_API_KEY is not set.
        </p>
      </div>
    );
  }

  return <div ref={container} className="resort-map h-full w-full" />;
}
