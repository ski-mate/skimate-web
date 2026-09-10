import { notFound } from "next/navigation";
import { EnrichmentGate } from "@/components/console/enrichment/EnrichmentGate";
import { getIngestionApi } from "@/lib/ingestion/client";
import { latestRunIdForStage } from "@/lib/ingestion/runs";

export const dynamic = "force-dynamic";

export default async function EnrichmentPage({ params }: { params: { id: string } }) {
  const api = getIngestionApi();
  const entry = await api.getRegistryEntry(params.id);
  if (!entry) notFound();

  const runId = await latestRunIdForStage(api, params.id, "enrichment");
  if (!runId) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="max-w-[46ch] text-[12px] text-[var(--label-3)]">
          Nothing to estimate yet. The cost gate needs a completed membership stage so it knows
          which places are in scope and which are shared across the group.
        </p>
      </div>
    );
  }

  const [estimate, report] = await Promise.all([
    api.getEnrichmentEstimate(runId),
    api.getEnrichmentReport(runId),
  ]);

  return <EnrichmentGate estimate={estimate} report={report} registryId={params.id} />;
}
