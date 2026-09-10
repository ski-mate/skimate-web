import { notFound } from "next/navigation";
import { HarvestReview } from "@/components/console/harvest/HarvestReview";
import { getIngestionApi } from "@/lib/ingestion/client";
import { latestRunIdForStage } from "@/lib/ingestion/runs";

export const dynamic = "force-dynamic";

export default async function HarvestPage({ params }: { params: { id: string } }) {
  const api = getIngestionApi();
  const entry = await api.getRegistryEntry(params.id);
  if (!entry) notFound();

  const runId = await latestRunIdForStage(api, params.id, "harvest");
  if (!runId) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="max-w-[46ch] text-[12px] text-[var(--label-3)]">
          No harvest has run for this entry yet. Onboard it first — Stage 0 mints the registry
          entry and declares the group, and Stage 1 is what produces the layers reviewed here.
        </p>
      </div>
    );
  }

  const data = await api.getHarvest(runId);
  return <HarvestReview data={data} registryId={params.id} />;
}
