import type { GuideArticle } from "../types";

export const findYourWay: GuideArticle = {
  slug: "find-your-way",
  section: "navigation",
  title: "Find your way around a resort",
  description:
    "Open Alpline on the mountain, read the piste map, switch between the winter, satellite and 3D views, and search for the run, lift or place that you need.",
  intro: [
    "Alpline opens straight onto the map. There is no account step and no setup — the resort around you is already drawn, with every piste coloured by difficulty and every lift marked.",
  ],
  status: "published",
  updated: "2026-09-09",
  srsRefs: ["REQ-4.1.1.1", "REQ-4.1.1.2", "REQ-4.1.1.5"],
  figures: {
    map: {
      src: "/media/app/map-idle.webp",
      alt: "The Alpline map of Val Thorens, with pistes coloured green, blue, red and black, lifts marked, and a weather chip showing temperature and snow depth.",
      width: 804,
      height: 1748,
      device: "iphone",
      caption: "The map opens on the resort around you.",
    },
  },
  blocks: [
    { kind: "figure", figure: "map" },
    {
      kind: "heading",
      text: "Read the map",
      id: "read-the-map",
    },
    {
      kind: "p",
      text: [
        "Pistes are coloured by difficulty using the same scheme as the resort's own piste map: green for beginner, blue for intermediate, red for advanced and black for expert. Lifts are drawn as darker lines with a station marker at each end.",
      ],
    },
    {
      kind: "bullets",
      items: [
        ["Pinch to zoom, and drag with two fingers to tilt into a 3D view of the terrain."],
        ["Tap any run, lift or place to open its card."],
        [
          "The chip in the top corner shows the current temperature and snow depth for the resort.",
        ],
      ],
    },
    {
      kind: "heading",
      text: "Switch the map view",
      id: "switch-the-map-view",
    },
    {
      kind: "steps",
      items: [
        ["Tap the layers button on the right of the map."],
        [
          "Choose ",
          { text: "Winter", strong: true },
          " for the piste map, ",
          { text: "Satellite", strong: true },
          " for aerial imagery, or ",
          { text: "Terrain", strong: true },
          " for shaded relief.",
        ],
        ["Tap the 3D button to tilt the map and see the shape of the mountain."],
      ],
    },
    {
      kind: "tip",
      text: [
        "Satellite is the quickest way to judge how open or how treed a section of the mountain is before you drop in.",
      ],
    },
    {
      kind: "heading",
      text: "Search for a run, lift or place",
      id: "search",
    },
    {
      kind: "steps",
      items: [
        ["Tap ", { text: "Search Alpline", strong: true }, " at the bottom of the screen."],
        ["Type the name of a run, lift, restaurant or lodge."],
        ["Tap a result to see it on the map and open its card."],
      ],
    },
    {
      kind: "p",
      text: [
        "If you are not sure what you are looking for, use ",
        { text: "Find Nearby", strong: true },
        " in the search sheet to browse slopes, restaurants, lifts and lodging around you.",
      ],
    },
    {
      kind: "note",
      text: [
        "Alpline works without a signal once a resort has loaded. Downloading a whole resort in advance is part of Alpline Pro.",
      ],
    },
  ],
  seeAlso: ["get-directions", "save-a-place"],
};
