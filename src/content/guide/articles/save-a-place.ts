import type { GuideArticle } from "../types";

export const saveAPlace: GuideArticle = {
  slug: "save-a-place",
  section: "navigation",
  title: "Save a place on the mountain",
  description:
    "Drop a pin on your lodge, your car or a meeting point so that you can find it again later, and route straight back to it from anywhere on the mountain.",
  intro: [
    "Some places are worth keeping: where you parked, the lodge you are staying in, the spot where the group agreed to meet at one o'clock. Alpline keeps them on your phone.",
  ],
  status: "published",
  updated: "2026-09-09",
  srsRefs: ["REQ-4.1.1.3"],
  figures: {
    search: {
      src: "/media/app/search-half.webp",
      alt: "The Alpline search sheet showing saved places for My Lodge, My Car and Lifts, with Find Nearby categories beneath.",
      width: 804,
      height: 1748,
      device: "iphone",
      caption: "Saved places sit at the top of the search sheet.",
    },
  },
  blocks: [
    {
      kind: "heading",
      text: "Drop a pin",
      id: "drop-a-pin",
    },
    {
      kind: "steps",
      items: [
        ["Touch and hold anywhere on the map."],
        ["A pin drops and its card opens."],
        ["Tap the ", { text: "+", strong: true }, " button to save it."],
        ["Give it a name you will recognise, such as “My Car” or “Meet here”."],
      ],
    },
    { kind: "figure", figure: "search" },
    {
      kind: "heading",
      text: "Find a saved place again",
      id: "find-a-saved-place",
    },
    {
      kind: "steps",
      items: [
        ["Tap ", { text: "Search Alpline", strong: true }, " at the bottom of the screen."],
        [
          "Your saved places appear at the top of the sheet under ",
          { text: "Places", strong: true },
          ".",
        ],
        ["Tap one to see it on the map, or tap Directions to route back to it."],
      ],
    },
    {
      kind: "note",
      text: [
        "Saved places live on your iPhone and work without a signal. Create a free account and they are backed up and available on your other devices.",
      ],
    },
  ],
  seeAlso: ["find-your-way", "get-directions"],
};
