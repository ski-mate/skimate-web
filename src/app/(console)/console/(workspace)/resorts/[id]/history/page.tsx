import { notFound } from "next/navigation";
import { RunsAudit } from "@/components/console/runs/RunsAudit";
import { getIngestionApi } from "@/lib/ingestion/client";

export const dynamic = "force-dynamic";

export default async function EntryHistoryPage({ params }: { params: { id: string } }) {
  const api = getIngestionApi();
  const entry = await api.getRegistryEntry(params.id);
  if (!entry) notFound();

  const [runs, audit] = await Promise.all([
    api.listRuns({ registryId: params.id, limit: 100 }),
    api.listAudit({ registryId: params.id, limit: 100 }),
  ]);

  return <RunsAudit runs={runs.items} audit={audit.items} scopeName={entry.name} />;
}
