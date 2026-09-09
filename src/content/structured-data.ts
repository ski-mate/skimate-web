import type { Graph } from "schema-dts";
import { faqs } from "./faq";
import { site } from "./site";
import { SITE_URL } from "@/lib/seo";

/**
 * Deliberately no aggregateRating: Alpline has no ratings yet, and inventing
 * them would repeat the fabricated-testimonial mistake this rebuild removed.
 */
export function homeGraph(): Graph {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: site.name,
        url: SITE_URL,
        logo: `${SITE_URL}/appicon.png`,
        email: site.email,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: site.name,
        description: site.description,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        name: site.name,
        applicationCategory: "TravelApplication",
        operatingSystem: "iOS",
        description: site.description,
        url: SITE_URL,
        offers: [
          {
            "@type": "Offer",
            name: "Alpline",
            price: "0",
            priceCurrency: "GBP",
            description:
              "Resort map, search, skill-aware routing, turn-by-turn navigation, saved places and friend locations.",
          },
          {
            "@type": "Offer",
            name: "Alpline Pro",
            category: "subscription",
            description:
              "Adds offline map packs, live trail status, AI technique analysis and the full Perfect Day Score.",
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question" as const,
          name: f.question,
          acceptedAnswer: { "@type": "Answer" as const, text: f.answer },
        })),
      },
    ],
  };
}
