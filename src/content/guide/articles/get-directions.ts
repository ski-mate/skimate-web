import type { GuideArticle } from "../types";

export const getDirections: GuideArticle = {
  slug: "get-directions",
  section: "navigation",
  title: "Get directions to a run or lift",
  description:
    "Route to anywhere on the mountain along pistes and lifts, matched to the level that you ski, with turn-by-turn guidance that recalculates when you drift.",
  intro: [
    "Alpline routes along pistes and lifts rather than roads, and it accounts for what you can actually ski. Set your level once and it will not send you down a run above it.",
  ],
  status: "published",
  updated: "2026-09-09",
  srsRefs: ["REQ-4.1.2.1", "REQ-4.1.3.1", "REQ-4.1.3.2", "REQ-4.1.4.1"],
  figures: {
    placeCard: {
      src: "/media/app/place-card.webp",
      alt: "The place card for Col de la Chambre, a blue trail, showing a Directions button alongside its status, difficulty, length and vertical drop.",
      width: 804,
      height: 1748,
      device: "iphone",
      caption: "Every run and lift has a card with a Directions button.",
    },
  },
  blocks: [
    {
      kind: "heading",
      text: "Route to a place",
      id: "route-to-a-place",
    },
    {
      kind: "steps",
      items: [
        ["Tap a run, lift or place on the map, or find it with search."],
        [
          "On the card that appears, tap ",
          { text: "Directions", strong: true },
          ".",
        ],
        [
          "Alpline plans a route from where you are, using the lifts and pistes that connect the two points.",
        ],
        ["Tap ", { text: "Go", strong: true }, " to start guidance."],
      ],
    },
    { kind: "figure", figure: "placeCard" },
    {
      kind: "p",
      text: [
        "The card also shows what you need to know before committing: whether the run is open, its difficulty, its length and its vertical drop.",
      ],
    },
    {
      kind: "heading",
      text: "Follow the route",
      id: "follow-the-route",
    },
    {
      kind: "bullets",
      items: [
        ["The next manoeuvre is shown at the top of the screen, with the distance to it."],
        [
          "Take a wrong turn and Alpline recalculates from where you actually are, rather than trying to send you back.",
        ],
        ["Swipe up on the trip sheet to see the full list of turns."],
      ],
    },
    {
      kind: "warning",
      text: [
        "Alpline is a navigation tool, not a safety device. Always follow resort signage and closures, and use your own judgement about conditions and your own ability.",
      ],
    },
    {
      kind: "heading",
      text: "Set the level you ski",
      id: "set-your-level",
    },
    {
      kind: "p",
      text: [
        "Routing is matched to your ability, so it is worth setting this correctly before your first run. Alpline will then plan around anything above the level you choose.",
      ],
    },
    {
      kind: "tip",
      text: [
        "If a route looks longer than you expected, it is usually avoiding a run above your level. Raise your level to see the more direct option.",
      ],
    },
  ],
  seeAlso: ["find-your-way", "save-a-place"],
};
