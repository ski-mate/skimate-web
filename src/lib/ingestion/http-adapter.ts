/**
 * The real adapter: alpline-backend's `/ingestion/*` namespace.
 *
 * Every response is parsed through the zod schema from the contract before it
 * reaches a screen. That is deliberate and slightly unusual — normally you would
 * trust your own backend — but this API does not exist yet, so the console is
 * the first consumer and the strictest possible reading of the contract is the
 * most useful feedback the backend team can get. A shape mismatch fails here,
 * loudly, naming the path, instead of rendering a half-empty queue.
 *
 * Nothing in this file runs in the browser: the base URL and bearer token are
 * server-only, and every call site is a server component or a server action.
 */

import { z } from "zod";
import {
  AuditListResponse,
  CandidateSearchResponse,
  EnrichmentEstimate,
  EnrichmentReport,
  HarvestResponse,
  IngestionRun,
  ManifestValidation,
  MembershipResponse,
  OnboardingManifest,
  PublishResponse,
  QaWorkspaceResponse,
  RegistryEntry,
  ROUTES,
  RunListResponse,
  SpendApproval,
  SubmitManifestResponse,
  TriggerRunResponse,
  ValidationGate,
  VerdictsResponse,
  WorklistResponse,
  type Actor,
  type IngestionApi,
  type RouteName,
} from "@/lib/ingestion-api";

class IngestionApiError extends Error {
  constructor(
    message: string,
    readonly route: RouteName,
    readonly status?: number,
    readonly issues?: unknown
  ) {
    super(message);
    this.name = "IngestionApiError";
  }
}

function baseUrl(): string {
  const url = process.env.INGESTION_API_URL;
  if (!url) {
    throw new Error(
      "INGESTION_API_URL is not set. Either set it, or leave INGESTION_API_MODE unset to run against the mock adapter."
    );
  }
  return url.replace(/\/$/, "");
}

/** Substitutes `:param` segments positionally, in declaration order. */
function buildPath(route: RouteName, params: string[]): string {
  let i = 0;
  return ROUTES[route].path.replace(/:[A-Za-z]+/g, () => encodeURIComponent(params[i++] ?? ""));
}

async function call<S extends z.ZodTypeAny>(
  route: RouteName,
  schema: S,
  opts: { params?: string[]; query?: Record<string, unknown>; body?: unknown; actor?: Actor }
): Promise<z.infer<S>> {
  const spec = ROUTES[route];
  const url = new URL(baseUrl() + buildPath(route, opts.params ?? []));

  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }

  const headers: Record<string, string> = { accept: "application/json" };
  if (process.env.INGESTION_API_TOKEN) {
    headers.authorization = `Bearer ${process.env.INGESTION_API_TOKEN}`;
  }
  // The backend records this as the actor on every audit row. It is taken from
  // the console session server-side; the browser never supplies it.
  if (opts.actor) headers["x-alpline-actor"] = opts.actor.email;
  if (opts.body !== undefined) headers["content-type"] = "application/json";

  const res = await fetch(url, {
    method: spec.method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new IngestionApiError(
      `${spec.method} ${url.pathname} failed with ${res.status}. ${text.slice(0, 400)}`,
      route,
      res.status
    );
  }

  const json = await res.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new IngestionApiError(
      `${spec.method} ${url.pathname} returned a payload that does not match the contract.`,
      route,
      res.status,
      parsed.error.issues
    );
  }
  return parsed.data;
}

export const httpIngestionApi: IngestionApi = {
  getWorklist: (query) => call("getWorklist", WorklistResponse, { query }),

  getRegistryEntry: (registryId) =>
    call("getRegistryEntry", RegistryEntry.nullable(), { params: [registryId] }),

  searchCandidates: (query) =>
    call("searchCandidates", CandidateSearchResponse, {
      query: { ...query, bbox: query.bbox?.join(","), sources: query.sources },
    }),

  getManifest: (manifestId) =>
    call("getManifest", OnboardingManifest.nullable(), { params: [manifestId] }),

  saveManifest: (manifest, actor) =>
    call("saveManifest", OnboardingManifest, { body: manifest, actor }),

  validateManifest: (manifest) =>
    call("validateManifest", ManifestValidation, { body: manifest }),

  submitManifest: (manifest, actor) =>
    call("submitManifest", SubmitManifestResponse, {
      params: [manifest.manifestId],
      body: manifest,
      actor,
    }),

  getHarvest: (runId) => call("getHarvest", HarvestResponse, { params: [runId] }),

  submitHarvestVerdicts: (runId, req, actor) =>
    call("submitHarvestVerdicts", VerdictsResponse, { params: [runId], body: req, actor }),

  bulkAcceptHarvest: (runId, req, actor) =>
    call("bulkAcceptHarvest", VerdictsResponse, { params: [runId], body: req, actor }),

  getMembership: (runId) => call("getMembership", MembershipResponse, { params: [runId] }),

  submitMembershipActions: (runId, req, actor) =>
    call("submitMembershipActions", VerdictsResponse, { params: [runId], body: req, actor }),

  waiveGate: (runId, key, req, actor) =>
    call("waiveGate", ValidationGate, { params: [runId, key], body: req, actor }),

  getEnrichmentEstimate: (runId) =>
    call("getEnrichmentEstimate", EnrichmentEstimate, { params: [runId] }),

  approveEnrichmentSpend: (runId, req, actor) =>
    call("approveEnrichmentSpend", SpendApproval, { params: [runId], body: req, actor }),

  getEnrichmentReport: (runId) =>
    call("getEnrichmentReport", EnrichmentReport, { params: [runId] }),

  submitUnmatchedVerdicts: (runId, req, actor) =>
    call("submitUnmatchedVerdicts", VerdictsResponse, { params: [runId], body: req, actor }),

  getQaWorkspace: (registryId) =>
    call("getQaWorkspace", QaWorkspaceResponse, { params: [registryId] }),

  publish: (registryId, req, actor) =>
    call("publish", PublishResponse, { params: [registryId], body: req, actor }),

  listRuns: (query) => call("listRuns", RunListResponse, { query }),

  getRun: (runId) => call("getRun", IngestionRun.nullable(), { params: [runId] }),

  triggerRun: (registryId, req, actor) =>
    call("triggerRun", TriggerRunResponse, { params: [registryId], body: req, actor }),

  listAudit: (query) => call("listAudit", AuditListResponse, { query }),
};
