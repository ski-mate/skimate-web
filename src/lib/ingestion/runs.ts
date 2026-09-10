import "server-only";

import type { IngestionApi, StageKey } from "@/lib/ingestion-api";

/**
 * The stage screens each review the output of one pipeline stage, so they
 * need the latest run OF THAT STAGE — the worklist's `lastRunId` is the
 * latest run of any stage, and the backend's stage endpoints 404 on a run
 * of the wrong stage (deliberately: a membership payload for a harvest run
 * id would be a lie, not a fallback).
 */
export async function latestRunIdForStage(
  api: IngestionApi,
  registryId: string,
  stage: StageKey
): Promise<string | null> {
  const { items } = await api.listRuns({ registryId, stage, limit: 1 });
  return items[0]?.id ?? null;
}
