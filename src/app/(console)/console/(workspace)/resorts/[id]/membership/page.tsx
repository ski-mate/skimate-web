import { notFound } from "next/navigation";
import { MembershipGates } from "@/components/console/membership/MembershipGates";
import { getIngestionApi } from "@/lib/ingestion/client";
import { latestRunIdForStage } from "@/lib/ingestion/runs";

export const dynamic = "force-dynamic";

export default async function MembershipPage({ params }: { params: { id: string } }) {
  const api = getIngestionApi();
  const entry = await api.getRegistryEntry(params.id);
  if (!entry) notFound();

  const runId = await latestRunIdForStage(api, params.id, "membership");
  if (!runId) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="max-w-[46ch] text-[12px] text-[var(--label-3)]">
          Membership has not been computed for this entry. It runs after the free harvest, over the
          routing graph and the commune boundaries.
        </p>
      </div>
    );
  }

  const data = await api.getMembership(runId);
  return <MembershipGates data={data} registryId={params.id} />;
}
