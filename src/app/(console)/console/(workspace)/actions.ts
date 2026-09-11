"use server";

import { revalidatePath } from "next/cache";
import { requireConsoleActor } from "@/lib/console/auth";
import { getIngestionApi } from "@/lib/ingestion/client";
import type {
  ApproveSpendRequest,
  BulkAcceptRequest,
  CandidateSearchQuery,
  CandidateSearchResponse,
  ConflictVerdictValue,
  CoverageVerdictsRequest,
  GateKey,
  ManifestValidation,
  MembershipActionsRequest,
  OnboardingManifest,
  PublishRequest,
  PublishResponse,
  SpendApproval,
  SubmitManifestResponse,
  TriggerRunRequest,
  UnmatchedVerdictsRequest,
  ValidationGate,
  VerdictsResponse,
} from "@/lib/ingestion-api";

/**
 * Every console mutation goes through this file.
 *
 * Two invariants hold across all of them:
 *
 *  1. The actor is resolved server-side from the session. It is never a
 *     parameter, because an audit row naming whoever the browser claimed to be
 *     would be worse than no audit row at all.
 *  2. Anything that changes what the worklist should say revalidates it, so the
 *     sidebar counts and the queue can never disagree with each other after an
 *     action.
 */

function revalidateEntry(registryId?: string) {
  revalidatePath("/console");
  revalidatePath("/console/runs");
  if (registryId) revalidatePath(`/console/resorts/${registryId}`, "layout");
}

/* ── Screen 3 — harvest ───────────────────────────────────────────────────── */

export async function submitHarvestVerdicts(
  runId: string,
  registryId: string,
  verdicts: { conflictId: string; verdict: ConflictVerdictValue; note?: string }[]
): Promise<VerdictsResponse> {
  const actor = await requireConsoleActor();
  const res = await getIngestionApi().submitHarvestVerdicts(runId, { verdicts }, actor);
  revalidateEntry(registryId);
  return res;
}

export async function bulkAcceptHarvest(
  runId: string,
  registryId: string,
  req: BulkAcceptRequest
): Promise<VerdictsResponse> {
  const actor = await requireConsoleActor();
  const res = await getIngestionApi().bulkAcceptHarvest(runId, req, actor);
  revalidateEntry(registryId);
  return res;
}

/* ── Screen 4 — membership and gates ──────────────────────────────────────── */

export async function submitMembershipActions(
  runId: string,
  registryId: string,
  actions: MembershipActionsRequest["actions"]
): Promise<VerdictsResponse> {
  const actor = await requireConsoleActor();
  const res = await getIngestionApi().submitMembershipActions(runId, { actions }, actor);
  revalidateEntry(registryId);
  return res;
}

export async function waiveGate(
  runId: string,
  registryId: string,
  key: GateKey,
  reason: string
): Promise<ValidationGate> {
  const actor = await requireConsoleActor();
  // The contract requires a reason and so does the UI, but a waiver written
  // with an empty reason would be the one audit row that says nothing.
  if (!reason.trim()) throw new Error("A waiver needs a reason.");
  const res = await getIngestionApi().waiveGate(runId, key, { reason: reason.trim() }, actor);
  revalidateEntry(registryId);
  return res;
}

/* ── Screen 5 — enrichment cost gate ──────────────────────────────────────── */

export async function approveEnrichmentSpend(
  runId: string,
  registryId: string,
  req: ApproveSpendRequest
): Promise<SpendApproval> {
  const actor = await requireConsoleActor();
  const res = await getIngestionApi().approveEnrichmentSpend(runId, req, actor);
  revalidateEntry(registryId);
  return res;
}

export async function submitUnmatchedVerdicts(
  runId: string,
  registryId: string,
  verdicts: UnmatchedVerdictsRequest["verdicts"]
): Promise<VerdictsResponse> {
  const actor = await requireConsoleActor();
  const res = await getIngestionApi().submitUnmatchedVerdicts(runId, { verdicts }, actor);
  revalidateEntry(registryId);
  return res;
}

/* ── Screen 6 — QA and publish ────────────────────────────────────────────── */

export async function publishRegistryEntry(
  registryId: string,
  req: PublishRequest
): Promise<PublishResponse> {
  const actor = await requireConsoleActor();
  const res = await getIngestionApi().publish(registryId, req, actor);
  revalidateEntry(registryId);
  return res;
}

/* ── Screen 8 — routing coverage ──────────────────────────────────────────── */

export async function submitCoverageVerdicts(
  registryId: string,
  verdicts: CoverageVerdictsRequest["verdicts"]
): Promise<VerdictsResponse> {
  const actor = await requireConsoleActor();
  // The contract makes a reason mandatory for accept_gap and the backend
  // rejects it missing. Catching it here means the analyst sees "needs a
  // reason" rather than a 400 from a route they never asked about.
  for (const v of verdicts) {
    if (v.verdict === "accept_gap" && !v.reason?.trim()) {
      throw new Error("Accepting a coverage gap needs a reason.");
    }
  }
  const res = await getIngestionApi().submitCoverageVerdicts(registryId, { verdicts }, actor);
  revalidateEntry(registryId);
  return res;
}

export async function waiveCoverageGate(
  registryId: string,
  key: GateKey,
  reason: string
): Promise<ValidationGate> {
  const actor = await requireConsoleActor();
  if (!reason.trim()) throw new Error("A waiver needs a reason.");
  const res = await getIngestionApi().waiveCoverageGate(
    registryId,
    key,
    { reason: reason.trim() },
    actor
  );
  revalidateEntry(registryId);
  return res;
}

/* ── Screens 1 and 7 — runs ───────────────────────────────────────────────── */

export async function triggerRun(registryId: string, req: TriggerRunRequest) {
  const actor = await requireConsoleActor();
  const res = await getIngestionApi().triggerRun(registryId, req, actor);
  revalidateEntry(registryId);
  return res;
}

/* ── Screen 2 — onboarding ────────────────────────────────────────────────── */

export async function searchCandidates(
  query: CandidateSearchQuery
): Promise<CandidateSearchResponse> {
  await requireConsoleActor();
  return getIngestionApi().searchCandidates(query);
}

export async function validateManifest(
  manifest: OnboardingManifest
): Promise<ManifestValidation> {
  await requireConsoleActor();
  return getIngestionApi().validateManifest(manifest);
}

export async function saveManifest(manifest: OnboardingManifest): Promise<OnboardingManifest> {
  const actor = await requireConsoleActor();
  return getIngestionApi().saveManifest(manifest, actor);
}

export async function submitManifest(
  manifest: OnboardingManifest
): Promise<SubmitManifestResponse> {
  const actor = await requireConsoleActor();
  const res = await getIngestionApi().submitManifest(manifest, actor);
  revalidateEntry(res.registryId);
  return res;
}
