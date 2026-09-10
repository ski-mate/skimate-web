import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/console/onboarding/OnboardingWizard";
import { getConsoleSession } from "@/lib/console/auth";
import { getIngestionApi } from "@/lib/ingestion/client";
import type { BBox, OnboardingManifest } from "@/lib/ingestion-api";

export const metadata: Metadata = { title: "Onboarding" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { seed?: string };
}) {
  const api = getIngestionApi();
  const session = await getConsoleSession();

  // A worklist row can deep-link here with ?seed=<registryId>, so the wizard
  // opens already looking at the entry the analyst clicked.
  const seedEntry = searchParams.seed ? await api.getRegistryEntry(searchParams.seed) : null;
  // The contract requires a non-empty q; with no seed the wizard opens with an
  // empty result and the analyst's first search populates it.
  const initial = seedEntry?.name
    ? await api.searchCandidates({ q: seedEntry.name, limit: 20 })
    : { candidates: [], duplicates: [] };

  const now = new Date().toISOString();
  const draft: OnboardingManifest = {
    manifestId: `draft-${now.slice(0, 10)}-${now.slice(11, 19).replace(/:/g, "")}`,
    status: "draft",
    group: null,
    members: [],
    // Framed on the seed entry when one was passed, otherwise the Tarentaise —
    // which is where the analyst is most likely to start.
    bbox: (seedEntry?.bbox ?? [6.4, 45.2, 6.8, 45.5]) as BBox,
    villageSeeds: [],
    providers: { osm: true, overture: true, wikidata: true },
    notes: "",
    createdBy: session?.actor.email ?? "unknown@alpline.invalid",
    createdAt: now,
    updatedAt: now,
  };

  return <OnboardingWizard initialManifest={draft} initial={initial} />;
}
