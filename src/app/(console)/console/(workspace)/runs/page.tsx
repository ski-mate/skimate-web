import type { Metadata } from "next";
import { RunsAudit } from "@/components/console/runs/RunsAudit";
import { getIngestionApi } from "@/lib/ingestion/client";

export const metadata: Metadata = { title: "Runs & audit" };
export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const api = getIngestionApi();
  const [runs, audit] = await Promise.all([
    api.listRuns({ limit: 200 }),
    api.listAudit({ limit: 200 }),
  ]);
  return <RunsAudit runs={runs.items} audit={audit.items} />;
}
