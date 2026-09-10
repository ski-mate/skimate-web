export interface Faq {
  question: string;
  answer: string;
}

/**
 * Answers are checked against FEATURES-ACCESS-AND-MONETIZATION.md.
 * The original "Alpline is completely free" answer contradicted the Terms and
 * the product plan; it is replaced with the real free-vs-Pro split.
 */
export const faqs: Faq[] = [
  {
    question: "What does Alpline cost?",
    answer:
      "Alpline is free. The resort map, search, skill-aware routing, turn-by-turn navigation, saved places and friend locations are all free, with no ads. Alpline Pro adds the things that cost us real money to serve: offline map packs, live trail status, AI technique analysis and the full Perfect Day Score. Safety features are never behind the paywall.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No. Alpline opens straight onto the map and works without signing in. An account is only needed for the things that are inherently about other people or other devices — friends, group chat and syncing your data across phones.",
  },
  {
    question: "Does Alpline work without signal?",
    answer:
      "The map, your saved places and your position work offline once a resort is loaded. Downloadable offline map packs, which cover a whole resort in advance, are part of Alpline Pro.",
  },
  {
    question: "How is routing different from a normal map app?",
    answer:
      "Alpline routes along pistes and lifts rather than roads, and it accounts for what you can actually ski. Set your level and it will not send you down a run above it. Take a wrong turn and it recalculates from where you are.",
  },
  {
    question: "Can I see where my friends are?",
    answer:
      "Yes. Friends who have shared their location appear on the resort map in real time, so you can split up and regroup without a stream of messages. Sharing is opt-in and you can turn it off at any time.",
  },
  {
    question: "Which resorts does Alpline cover?",
    answer:
      "Alpline is rolling out resort by resort, starting in the French Alps. The resorts page lists everywhere it works today, and the list grows as each resort's piste and lift network is mapped.",
  },
];
