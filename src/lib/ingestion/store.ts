/**
 * In-memory overlay for the mock adapter.
 *
 * The fixtures are pure functions of a seed; this holds everything the analyst
 * has *done* on top of them — verdicts, orphan resolutions, waivers, spend
 * approvals, publishes, drafts — plus the audit trail those actions write.
 *
 * It is a module singleton, so it survives navigation within one server process
 * and resets when that process restarts. That is the right trade for a mock: no
 * migrations to run before the console is usable, and no illusion that it is a
 * database. The HTTP adapter has no equivalent because the backend owns this
 * state for real.
 */

import type {
  AuditEntry,
  ConflictVerdictValue,
  OnboardingManifest,
  RegistryEntry,
  SpendApproval,
  Waiver,
} from "@/lib/ingestion-api";
import { uuidFrom } from "./fixtures/build";

export interface OrphanResolution {
  action: "assign" | "create_member" | "flag_boundary" | "skip";
  resortId?: string | null;
  newMemberName?: string | null;
  note?: string | null;
}

export interface ChecklistState {
  checked: boolean;
  checkedBy: string | null;
  checkedAt: string | null;
}

export interface PublishState {
  publishedAt: string;
  version: number;
}

interface Overlay {
  conflictVerdicts: Map<string, ConflictVerdictValue>;
  orphanResolutions: Map<string, OrphanResolution>;
  gateWaivers: Map<string, Waiver>;
  qaWaivers: Map<string, Waiver>;
  checklist: Map<string, ChecklistState>;
  approvals: Map<string, SpendApproval>;
  publishes: Map<string, PublishState>;
  manifests: Map<string, OnboardingManifest>;
  /** Member resorts the analyst minted while resolving orphans. */
  mintedMembers: Map<string, RegistryEntry[]>;
  audit: AuditEntry[];
  unmatchedVerdicts: Map<string, string>;
}

const g = globalThis as unknown as { __alplineIngestionOverlay?: Overlay };

export const overlay: Overlay =
  g.__alplineIngestionOverlay ??
  (g.__alplineIngestionOverlay = {
    conflictVerdicts: new Map(),
    orphanResolutions: new Map(),
    gateWaivers: new Map(),
    qaWaivers: new Map(),
    checklist: new Map(),
    approvals: new Map(),
    publishes: new Map(),
    manifests: new Map(),
    mintedMembers: new Map(),
    audit: [],
    unmatchedVerdicts: new Map(),
  });

let auditSeq = 0;

/**
 * Every mutation goes through here. Nothing in the adapter writes overlay state
 * without also writing one of these — that invariant is what makes the audit
 * log in screen 7 trustworthy rather than decorative.
 */
export function recordAudit(entry: {
  actor: string;
  action: string;
  target: string;
  detail: string;
  reason?: string | null;
  registryId?: string | null;
  runId?: string | null;
}): AuditEntry {
  const row: AuditEntry = {
    id: `audit:${++auditSeq}:${uuidFrom(`audit:${auditSeq}`).slice(0, 8)}`,
    at: new Date().toISOString(),
    actor: entry.actor,
    action: entry.action,
    registryId: entry.registryId ?? null,
    runId: entry.runId ?? null,
    target: entry.target,
    detail: entry.detail,
    reason: entry.reason ?? null,
  };
  overlay.audit.unshift(row);
  return row;
}
