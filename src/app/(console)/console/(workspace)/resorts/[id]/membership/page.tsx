import { notFound } from "next/navigation";
import { MembershipGates } from "@/components/console/membership/MembershipGates";
import { getIngestionApi } from "@/lib/ingestion/client";

export const dynamic = "force-dynamic";

export default async function MembershipPage({ params }: { params: { id: string } }) {
  const api = getIngestionApi();
  const { rows } = await api.getWorklist({ limit: 500 });
  const row = rows.find((r) => r.registryId === params.id);
  if (!row) notFound();

  if (!row.lastRunId) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="max-w-[46ch] text-[12px] text-[var(--label-3)]">
          Membership has not been computed for this entry. It runs after the free harvest, over the
          routing graph and the commune boundaries.
        </p>
      </div>
    );
  }

  const data = await api.getMembership(row.lastRunId);
  return <MembershipGates data={data} registryId={params.id} />;
}
