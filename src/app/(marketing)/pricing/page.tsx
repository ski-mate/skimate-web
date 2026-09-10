import type { Metadata } from "next";
import {
  ChevronLink,
  Container,
  Footnotes,
  SectionScheme,
} from "@/components/apple";
import { StatusBadge } from "@/components/marketing/StatusBadge";
import { pricing, pricingFootnotes, pricingRows } from "@/content/pricing";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Pricing",
  description:
    "Alpline is free: the map, routing, navigation and friends, with no ads. Alpline Pro adds offline maps, live trail status and technique analysis.",
  path: "/pricing",
});

function Tick({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex items-center text-[var(--piste-green)]">
      <span className="sr-only">Included</span>
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <path
          d="M2 7.5l3.5 3.5L12 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  ) : (
    <span className="inline-flex items-center text-[var(--label-3)]">
      <span className="sr-only">Not included</span>
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <path d="M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function PricingPage() {
  return (
    <>
      <SectionScheme scheme="dark" className="py-section text-center">
        <Container>
          <p className="type-eyebrow mb-1">Pricing</p>
          <h1 className="type-display-2 text-balance">
            Free to use. Pro when you need it.
          </h1>
          <p className="type-tagline mx-auto mt-3 max-w-[46ch] text-balance text-[var(--label-2)]">
            We charge for the handful of things that cost us real money to run.
            Everything else is free, with no ads.
          </p>
        </Container>
      </SectionScheme>

      <SectionScheme scheme="auto" className="py-section">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2">
            {[pricing.free, pricing.pro].map((tier) => (
              <div
                key={tier.name}
                className="rounded-large border border-[var(--separator)] p-7"
              >
                <h2 className="type-title">{tier.name}</h2>
                <p className="type-display-3 mt-2">{tier.price}</p>
                <p className="type-callout mt-3 text-[var(--label-2)]">
                  {tier.summary}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-large border border-[var(--piste-green)]/30 bg-[var(--piste-green)]/[0.07] p-6">
            <p className="type-callout text-[var(--label-2)]">
              <strong className="font-semibold text-[var(--label)]">
                Safety is never paid.{" "}
              </strong>
              {pricing.guarantee}
            </p>
          </div>

          <h2 className="type-title mt-14 mb-4">What is in each</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <caption className="sr-only">
                Comparison of Alpline and Alpline Pro
              </caption>
              <thead>
                <tr className="border-b border-[var(--separator)]">
                  <th scope="col" className="type-callout py-3 pr-4 font-semibold">
                    Feature
                  </th>
                  <th scope="col" className="type-callout w-24 py-3 font-semibold">
                    Alpline
                  </th>
                  <th scope="col" className="type-callout w-24 py-3 font-semibold">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricingRows.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-[var(--separator)]"
                  >
                    <th
                      scope="row"
                      className="type-callout py-3 pr-4 font-normal text-[var(--label-2)]"
                    >
                      {row.feature}
                      <StatusBadge status={row.status} />
                      {row.note ? (
                        <span className="type-caption ml-2 text-[var(--label-3)]">
                          {row.note}
                        </span>
                      ) : null}
                    </th>
                    <td className="py-3">
                      <Tick on={row.free} />
                    </td>
                    <td className="py-3">
                      <Tick on={row.pro} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
            <ChevronLink href="/#waitlist" variant="pill">
              Get early access
            </ChevronLink>
            <ChevronLink href="/features">See everything Alpline does</ChevronLink>
          </div>
        </Container>
      </SectionScheme>

      <Footnotes items={pricingFootnotes} />
    </>
  );
}
