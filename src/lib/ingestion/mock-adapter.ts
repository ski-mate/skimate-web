/**
 * The mock adapter: a complete `IngestionApi` over generated fixtures plus the
 * overlay of analyst actions. It is what the console runs against out of the
 * box, and it is deliberately faithful rather than convenient — gates block,
 * publishes refuse, spend cannot happen without an approval row.
 */

import type {
  Actor,
  ApproveSpendRequest,
  AuditListResponse,
  AuditQuery,
  BulkAcceptRequest,
  CandidateSearchQuery,
  CandidateSearchResponse,
  EnrichmentEstimate,
  EnrichmentReport,
  GateKey,
  HarvestResponse,
  HarvestVerdictsRequest,
  IdentityCandidate,
  IngestionApi,
  IngestionRun,
  ManifestValidation,
  MembershipActionsRequest,
  MembershipResponse,
  NextAction,
  OnboardingManifest,
  PublishRequest,
  PublishResponse,
  QaWorkspaceResponse,
  RegistryEntry,
  RunListQuery,
  RunListResponse,
  SpendApproval,
  Stage,
  SubmitManifestResponse,
  TriggerRunRequest,
  TriggerRunResponse,
  UnmatchedVerdictsRequest,
  ValidationGate,
  VerdictsResponse,
  WaiveGateRequest,
  WorklistQuery,
  WorklistResponse,
  WorklistRow,
} from "@/lib/ingestion-api";
import {
  buildChecklist,
  buildEnrichmentEstimate,
  buildEnrichmentReport,
  buildHarvest,
  buildMembership,
  buildPisteMapSvg,
  buildQaChecks,
  buildRegistry,
  buildRunsFor,
  GROUPS,
  MISSING_LEAVES,
  OVERTURE_RELEASE,
  iso,
  stageIndex,
  uuidFrom,
  type BuiltEntry,
} from "./fixtures/build";
import { overlay, recordAudit } from "./store";

/* ── lookups ──────────────────────────────────────────────────────────────── */

function registry(): BuiltEntry[] {
  return buildRegistry();
}

function byId(id: string): BuiltEntry | null {
  return registry().find((b) => b.entry.id === id) ?? null;
}

/** Runs are generated per entry; a run id resolves back to its entry. */
function entryForRun(runId: string): BuiltEntry | null {
  for (const b of registry()) {
    if (buildRunsFor(b).some((r) => r.id === runId)) return b;
  }
  return null;
}

/** The current (possibly analyst-extended) member list of a group. */
function membersOf(b: BuiltEntry): RegistryEntry[] {
  const declared = b.entry.memberIds
    .map((id) => byId(id)?.entry)
    .filter((e): e is RegistryEntry => Boolean(e));
  return [...declared, ...(overlay.mintedMembers.get(b.entry.id) ?? [])];
}

function latestRunId(b: BuiltEntry): string {
  const runs = buildRunsFor(b);
  return runs[0]?.id ?? uuidFrom(`run:${b.entry.id}:pending`);
}

/* ── derived state ────────────────────────────────────────────────────────── */

function harvestFor(b: BuiltEntry, runId: string): HarvestResponse {
  const h = buildHarvest(runId, b);
  // An entry that reached membership or beyond had its harvest reviewed at the
  // time, so its conflicts carry the verdict that was taken then. Leaving them
  // open would put a stale "78 conflicts" badge on every advanced entry and
  // drown the queue the analyst actually has to work.
  const preReviewed = stageIndex(b.stage) >= 3;
  return {
    ...h,
    conflicts: h.conflicts.map((c) => {
      const v = overlay.conflictVerdicts.get(c.id);
      if (v) return { ...c, resolved: true, resolvedVerdict: v };
      if (preReviewed) return { ...c, resolved: true, resolvedVerdict: c.suggestion };
      return c;
    }),
  };
}

function membershipFor(b: BuiltEntry, runId: string): MembershipResponse {
  const m = buildMembership(runId, b, membersOf(b));
  const orphans = m.orphans.map((o) =>
    overlay.orphanResolutions.has(o.id) ? { ...o, resolved: true } : o
  );
  const unresolved = orphans.filter((o) => !o.resolved).length;

  const gates: ValidationGate[] = m.gates.map((gate) => {
    const waiver = overlay.gateWaivers.get(`${runId}:${gate.key}`) ?? null;
    if (gate.key === "orphan_belt") {
      const status: ValidationGate["status"] =
        unresolved === 0 ? "pass" : waiver ? "waived" : "fail";
      return {
        ...gate,
        count: unresolved,
        status,
        waiver,
        detail:
          unresolved === 0
            ? "Every place inside the group extent is claimed by at least one member."
            : gate.detail,
      };
    }
    if (waiver) return { ...gate, status: "waived", waiver };
    return gate;
  });

  return { ...m, orphans, gates };
}

function gateFailures(b: BuiltEntry): number {
  if (stageIndex(b.stage) < 3) return 0;
  return membershipFor(b, latestRunId(b)).gates.filter((g) => g.status === "fail" && g.blocking)
    .length;
}

function qaChecksFor(b: BuiltEntry) {
  return buildQaChecks(b).map((c) => {
    const w = overlay.qaWaivers.get(c.id);
    return w ? { ...c, status: "waived" as const, waiver: w } : c;
  });
}

function effectiveStage(b: BuiltEntry): Stage {
  if (overlay.publishes.has(b.entry.id)) return "published";
  return b.stage;
}

/**
 * The precomputed "what needs me next". Ordering is by priority band first, so
 * blocked work always sorts above available work, and by magnitude within a
 * band — a resort with 34 orphans outranks one with 3.
 */
function nextActionFor(b: BuiltEntry): NextAction {
  const id = b.entry.id;
  const stage = effectiveStage(b);
  const runId = latestRunId(b);

  const mk = (
    label: string,
    href: string,
    priority: NextAction["priority"],
    magnitude = 0
  ): NextAction => ({
    label,
    href,
    priority,
    rank:
      ({ blocked: 0, ready: 1_000_000, waiting: 2_000_000, done: 3_000_000 }[priority] ?? 0) -
      Math.min(magnitude, 999_999),
  });

  switch (stage) {
    case "not_started":
      return mk("Start onboarding", `/console/onboarding?seed=${id}`, "ready");
    case "identity":
      return mk("Run free harvest", `/console/resorts/${id}/harvest`, "ready");
    case "harvested": {
      const open = harvestFor(b, runId).conflicts.filter((c) => !c.resolved).length;
      return open > 0
        ? mk(`Review ${open} harvest conflicts`, `/console/resorts/${id}/harvest`, "ready", open)
        : mk("Run membership", `/console/resorts/${id}/membership`, "ready");
    }
    case "membership": {
      const m = membershipFor(b, runId);
      const failing = m.gates.filter((g) => g.status === "fail" && g.blocking);
      if (failing.length) {
        // Gates outrank everything else in the blocked band: they stop the
        // pipeline, and clearing one is free. An unapproved spend also blocks,
        // but resolving it costs money, so it should never jump the queue.
        return mk(
          `Clear ${failing.length} blocking gate${failing.length === 1 ? "" : "s"}`,
          `/console/resorts/${id}/membership`,
          "blocked",
          900 + failing.length * 10
        );
      }
      const orphans = m.orphans.filter((o) => !o.resolved).length;
      if (orphans) {
        return mk(`Resolve ${orphans} orphans`, `/console/resorts/${id}/membership`, "ready", orphans);
      }
      return overlay.approvals.has(runId)
        ? mk("Review enrichment results", `/console/resorts/${id}/enrichment`, "ready")
        : mk("Approve enrichment spend", `/console/resorts/${id}/enrichment`, "blocked", 400);
    }
    case "enriched": {
      const report = enrichmentReportFor(b, runId);
      return report.unmatched > 0
        ? mk(`Review ${report.unmatched} unmatched POIs`, `/console/resorts/${id}/enrichment`, "ready", report.unmatched)
        : mk("Open QA workspace", `/console/resorts/${id}/qa`, "ready");
    }
    case "qa": {
      const failing = qaChecksFor(b).filter((c) => c.status === "fail").length;
      return failing > 0
        ? mk(`Resolve ${failing} QA checks`, `/console/resorts/${id}/qa`, "blocked", 600 + failing * 10)
        : mk("Publish", `/console/resorts/${id}/qa`, "ready");
    }
    case "needs_rerun":
      return mk("Re-run — upstream data moved", `/console/resorts/${id}/harvest`, "blocked", 700);
    case "published":
      return mk("Published", `/console/resorts/${id}/qa`, "done");
  }
}

function enrichmentReportFor(b: BuiltEntry, runId: string): EnrichmentReport {
  const estimate = buildEnrichmentEstimate(runId, b);
  const approval = overlay.approvals.get(runId) ?? null;
  const approved = Boolean(approval) || stageIndex(b.stage) >= 4;
  const report = buildEnrichmentReport(runId, b, estimate, approved);
  const unmatchedPlaces = report.unmatchedPlaces.filter(
    (p) => !overlay.unmatchedVerdicts.has(p.id)
  );
  return {
    ...report,
    approval,
    unmatchedPlaces,
    unmatched: unmatchedPlaces.length,
  };
}

function worklistRow(b: BuiltEntry): WorklistRow {
  const stage = effectiveStage(b);
  const runId = latestRunId(b);
  const runs = buildRunsFor(b);
  const idx = stageIndex(stage);

  const openConflicts =
    idx >= 2 ? harvestFor(b, runId).conflicts.filter((c) => !c.resolved).length : 0;
  const orphanCount =
    idx >= 3 ? membershipFor(b, runId).orphans.filter((o) => !o.resolved).length : 0;
  const qaFailures = idx >= 5 ? qaChecksFor(b).filter((c) => c.status === "fail").length : 0;
  const approval = overlay.approvals.get(runId);

  return {
    registryId: b.entry.id,
    kind: b.entry.kind,
    name: b.entry.name,
    groupName: b.entry.groupName,
    country: b.entry.country,
    region: b.entry.region,
    centroid: b.entry.centroid,
    bbox: b.entry.bbox,
    stage,
    nextAction: nextActionFor(b),
    gateFailures: gateFailures(b),
    openConflicts,
    orphanCount,
    qaFailures,
    lastRunId: runs[0]?.id ?? null,
    lastRunAt: runs[0]?.startedAt ?? null,
    lastRunStatus: runs[0]?.status ?? null,
    costIncurredUsd: runs.reduce((n, r) => n + r.costUsd, 0),
    costApprovedUsd: approval?.approvedCostUsd ?? 0,
    placeCount: b.places,
    liftCount: b.lifts,
    trailCount: b.trails,
    memberCount: membersOf(b).length,
  };
}

/* ── identity candidates ──────────────────────────────────────────────────── */

/**
 * Skimap and Wikidata candidates for the wizard. The Les 3 Vallées case is
 * hand-authored because it is the one that matters: Skimap id 1079 hands over
 * the whole editorial member list, including the three leaves that have no OSM
 * polygon and therefore cannot be discovered from geometry at all.
 */
function candidatePool(): IdentityCandidate[] {
  const out: IdentityCandidate[] = [];

  for (const g of GROUPS) {
    const b = registry().find((x) => x.entry.name === g.name);
    if (!b) continue;
    out.push({
      id: `skimap:${g.skimapId}`,
      source: "skimap",
      externalId: String(g.skimapId),
      name: g.name,
      aliases: b.entry.aliases,
      centroid: b.entry.centroid,
      bbox: b.entry.bbox,
      areaKm2: null,
      country: b.entry.country,
      adminArea: b.entry.region,
      memberNames:
        g.name === "Les 3 Vallées"
          ? [
              "Val Thorens",
              "Les Menuires",
              "Saint-Martin-de-Belleville",
              "Méribel",
              "Brides-les-Bains",
              "La Tania",
              "Courchevel",
              "Orelle",
            ]
          : g.members,
      matchScore: 0.98,
      url: `https://skimap.org/SkiAreas/view/${g.skimapId}`,
      existingRegistryId: b.entry.id,
    });
  }

  // The missing leaves: real places, mapped communes, no ski-area polygon.
  const leafSeeds: Record<string, { qid: string; centroid: [number, number] }> = {
    Courchevel: { qid: "Q1136162", centroid: [6.6347, 45.4154] },
    Méribel: { qid: "Q1935459", centroid: [6.5658, 45.3961] },
    "Les Menuires": { qid: "Q1814937", centroid: [6.5397, 45.3247] },
    "Saint-Martin-de-Belleville": { qid: "Q846412", centroid: [6.5058, 45.3789] },
  };
  for (const [name, s] of Object.entries(leafSeeds)) {
    out.push({
      id: `wikidata:${s.qid}`,
      source: "wikidata",
      externalId: s.qid,
      name,
      aliases: [],
      centroid: s.centroid,
      bbox: null,
      areaKm2: null,
      country: "France",
      adminArea: "Tarentaise",
      memberNames: [],
      matchScore: 0.93,
      url: `https://www.wikidata.org/wiki/${s.qid}`,
      existingRegistryId: null,
    });
  }

  // OSM polygon evidence, including the two that are the same domain.
  for (const b of registry()) {
    for (const osmId of b.entry.osmIds) {
      out.push({
        id: `osm:${osmId}`,
        source: "osm",
        externalId: String(osmId),
        name: b.entry.name,
        aliases: [],
        centroid: b.entry.centroid,
        bbox: b.entry.bbox,
        areaKm2:
          osmId === 45117869 ? 249.2 : osmId === 3545276 ? 218.3 : Math.round(b.trails * 1.4 * 10) / 10,
        country: b.entry.country,
        adminArea: b.entry.region,
        memberNames: [],
        matchScore: 0.85,
        url: `https://www.openstreetmap.org/relation/${osmId}`,
        existingRegistryId: b.entry.id,
      });
    }
  }

  return out;
}

/* ── the adapter ──────────────────────────────────────────────────────────── */

export const mockIngestionApi: IngestionApi = {
  async getWorklist(query: Partial<WorklistQuery>): Promise<WorklistResponse> {
    const all = registry().map(worklistRow);

    let rows = all;
    if (query.stage) rows = rows.filter((r) => r.stage === query.stage);
    if (query.blockedOnly) rows = rows.filter((r) => r.nextAction.priority === "blocked");
    if (query.q) {
      const q = query.q.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.region.toLowerCase().includes(q) ||
          r.country.toLowerCase().includes(q) ||
          (r.groupName ?? "").toLowerCase().includes(q)
      );
    }

    const sort = query.sort ?? "next_action";
    rows = [...rows].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "cost":
          return b.costIncurredUsd - a.costIncurredUsd || a.name.localeCompare(b.name);
        case "last_run":
          return (b.lastRunAt ?? "").localeCompare(a.lastRunAt ?? "") || a.name.localeCompare(b.name);
        default:
          return a.nextAction.rank - b.nextAction.rank || a.name.localeCompare(b.name);
      }
    });

    const byStage = all.reduce<Record<string, number>>((acc, r) => {
      acc[r.stage] = (acc[r.stage] ?? 0) + 1;
      return acc;
    }, {});

    return {
      summary: {
        total: all.length,
        published: all.filter((r) => r.stage === "published").length,
        byStage: byStage as WorklistResponse["summary"]["byStage"],
        gatesFailing: all.reduce((n, r) => n + r.gateFailures, 0),
        awaitingSpendApproval: all.filter((r) =>
          r.nextAction.label.startsWith("Approve enrichment")
        ).length,
        costToDateUsd: Math.round(all.reduce((n, r) => n + r.costIncurredUsd, 0) * 100) / 100,
        generatedAt: new Date().toISOString(),
      },
      rows: rows.slice(0, query.limit ?? 400),
      nextCursor: null,
    };
  },

  async getRegistryEntry(registryId: string): Promise<RegistryEntry | null> {
    return byId(registryId)?.entry ?? null;
  },

  async searchCandidates(query: CandidateSearchQuery): Promise<CandidateSearchResponse> {
    const q = query.q.toLowerCase().trim();
    const pool = candidatePool().filter(
      (c) =>
        (!query.sources || query.sources.includes(c.source)) &&
        (q === "" ||
          c.name.toLowerCase().includes(q) ||
          c.memberNames.some((m) => m.toLowerCase().includes(q)))
    );

    const candidates = pool
      .sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name))
      .slice(0, query.limit ?? 20);

    // The one real duplicate pair, surfaced whenever either side is in scope.
    const left = pool.find((c) => c.externalId === "45117869");
    const right = pool.find((c) => c.externalId === "3545276");
    const duplicates =
      left && right
        ? [
            {
              id: "dup:3v",
              left,
              right,
              overlapOfLeftPct: 87.2,
              overlapOfRightPct: 99.6,
              recommendation: "merge" as const,
              rationale:
                "One polygon is almost entirely contained in the other (99.6%), and both carry the same 368 trails and 145 lifts. This is one domain mapped twice, not two resorts.",
            },
          ]
        : [];

    return { candidates, duplicates };
  },

  async getManifest(manifestId: string): Promise<OnboardingManifest | null> {
    return overlay.manifests.get(manifestId) ?? null;
  },

  async saveManifest(manifest: OnboardingManifest, actor: Actor): Promise<OnboardingManifest> {
    const saved: OnboardingManifest = {
      ...manifest,
      updatedAt: new Date().toISOString(),
      createdBy: manifest.createdBy || actor.email,
    };
    overlay.manifests.set(saved.manifestId, saved);
    recordAudit({
      actor: actor.email,
      action: "manifest.save",
      target: saved.group?.name ?? saved.members[0]?.name ?? saved.manifestId,
      detail: `Saved draft manifest with ${saved.members.length} member(s).`,
    });
    return saved;
  },

  async validateManifest(manifest: OnboardingManifest): Promise<ManifestValidation> {
    const issues: ManifestValidation["issues"] = [];

    if (manifest.members.length === 0) {
      issues.push({
        severity: "error",
        code: "no_members",
        message: "A manifest must declare at least one member resort.",
        path: "members",
      });
    }
    manifest.members.forEach((m, i) => {
      if (!m.name.trim()) {
        issues.push({
          severity: "error",
          code: "member_unnamed",
          message: "Member has no name.",
          path: `members[${i}].name`,
        });
      }
      if (m.osmIds.length === 0 && !m.wikidataQid) {
        issues.push({
          severity: "warning",
          code: "member_unanchored",
          message: `“${m.name}” has neither an OSM polygon nor a Wikidata anchor. Village commerce will fall back to the settlement rule alone.`,
          path: `members[${i}]`,
        });
      }
    });

    const names = manifest.members.map((m) => m.name.trim().toLowerCase());
    names.forEach((n, i) => {
      if (n && names.indexOf(n) !== i) {
        issues.push({
          severity: "error",
          code: "member_duplicate",
          message: `“${manifest.members[i].name}” is declared twice.`,
          path: `members[${i}].name`,
        });
      }
    });

    const [w, s, e, n] = manifest.bbox;
    if (!(w < e && s < n)) {
      issues.push({
        severity: "error",
        code: "bbox_degenerate",
        message: "The bounding box is empty or inverted.",
        path: "bbox",
      });
    }
    if (manifest.villageSeeds.length === 0 && manifest.members.length > 1) {
      issues.push({
        severity: "warning",
        code: "no_village_seeds",
        message:
          "No village seed points. The settlement rule falls back to Voronoi around member centroids, which is coarser.",
        path: "villageSeeds",
      });
    }
    if (manifest.group && manifest.group.osmIds.length > 1) {
      issues.push({
        severity: "warning",
        code: "group_multi_polygon",
        message: `${manifest.group.osmIds.length} OSM polygons attached to one group. That is correct when they are duplicate mappings of one domain — confirm they are.`,
        path: "group.osmIds",
      });
    }

    return { issues, submittable: !issues.some((i) => i.severity === "error") };
  },

  async submitManifest(manifest: OnboardingManifest, actor: Actor): Promise<SubmitManifestResponse> {
    const registryId = manifest.group?.existingRegistryId ?? uuidFrom(`manifest:${manifest.manifestId}`);
    const createdMemberIds = manifest.members.map((m) =>
      m.existingRegistryId ?? uuidFrom(`manifest:${manifest.manifestId}:${m.key}`)
    );
    overlay.manifests.set(manifest.manifestId, { ...manifest, status: "submitted" });
    recordAudit({
      actor: actor.email,
      action: "manifest.submit",
      registryId,
      target: manifest.group?.name ?? manifest.members[0]?.name ?? manifest.manifestId,
      detail: `Submitted manifest: ${manifest.members.length} member(s), ${manifest.villageSeeds.length} village seed(s), providers ${Object.entries(
        manifest.providers
      )
        .filter(([, on]) => on)
        .map(([k]) => k)
        .join(", ")}.`,
    });
    return { runId: uuidFrom(`run:${manifest.manifestId}`), registryId, createdMemberIds };
  },

  async getHarvest(runId: string): Promise<HarvestResponse> {
    const b = entryForRun(runId);
    if (!b) throw new Error(`Unknown run ${runId}`);
    return harvestFor(b, runId);
  },

  async submitHarvestVerdicts(
    runId: string,
    req: HarvestVerdictsRequest,
    actor: Actor
  ): Promise<VerdictsResponse> {
    const b = entryForRun(runId);
    const auditIds: string[] = [];
    for (const v of req.verdicts) {
      overlay.conflictVerdicts.set(v.conflictId, v.verdict);
      // A merge fuses two entities: never silent.
      if (v.verdict === "merge") {
        auditIds.push(
          recordAudit({
            actor: actor.email,
            action: "harvest.merge",
            runId,
            registryId: b?.entry.id ?? null,
            target: v.conflictId,
            detail: "Merged two candidate places into one entity, keeping both external refs as evidence.",
            reason: v.note ?? null,
          }).id
        );
      }
    }
    if (req.verdicts.length && b) {
      auditIds.push(
        recordAudit({
          actor: actor.email,
          action: "harvest.verdicts",
          runId,
          registryId: b.entry.id,
          target: b.entry.name,
          detail: `Applied ${req.verdicts.length} conflict verdict(s).`,
        }).id
      );
    }
    const remaining = b ? harvestFor(b, runId).conflicts.filter((c) => !c.resolved).length : 0;
    return { applied: req.verdicts.length, remaining, auditIds };
  },

  async bulkAcceptHarvest(
    runId: string,
    req: BulkAcceptRequest,
    actor: Actor
  ): Promise<VerdictsResponse> {
    const b = entryForRun(runId);
    if (!b) throw new Error(`Unknown run ${runId}`);
    const conflicts = harvestFor(b, runId).conflicts;
    let applied = 0;
    for (const c of conflicts) {
      if (c.resolved) continue;
      if (!req.types.includes(c.type)) continue;
      const conf = c.left.confidence ?? 1;
      if (conf < req.minConfidence) continue;
      overlay.conflictVerdicts.set(c.id, c.suggestion);
      applied++;
    }
    recordAudit({
      actor: actor.email,
      action: "harvest.bulk_accept",
      runId,
      registryId: b.entry.id,
      target: b.entry.name,
      detail: `Bulk-accepted ${applied} suggested verdict(s) at or above confidence ${req.minConfidence.toFixed(
        2
      )} across ${req.types.length} conflict type(s).`,
    });
    return {
      applied,
      remaining: harvestFor(b, runId).conflicts.filter((c) => !c.resolved).length,
      auditIds: [],
    };
  },

  async getMembership(runId: string): Promise<MembershipResponse> {
    const b = entryForRun(runId);
    if (!b) throw new Error(`Unknown run ${runId}`);
    return membershipFor(b, runId);
  },

  async submitMembershipActions(
    runId: string,
    req: MembershipActionsRequest,
    actor: Actor
  ): Promise<VerdictsResponse> {
    const b = entryForRun(runId);
    if (!b) throw new Error(`Unknown run ${runId}`);
    const auditIds: string[] = [];

    for (const a of req.actions) {
      overlay.orphanResolutions.set(a.orphanId, {
        action: a.action,
        resortId: a.resortId ?? null,
        newMemberName: a.newMemberName ?? null,
        note: a.note ?? null,
      });

      if (a.action === "create_member" && a.newMemberName) {
        const list = overlay.mintedMembers.get(b.entry.id) ?? [];
        if (!list.some((m) => m.name === a.newMemberName)) {
          list.push({
            id: uuidFrom(`minted:${b.entry.id}:${a.newMemberName}`),
            kind: "resort",
            name: a.newMemberName,
            aliases: [],
            status: "draft",
            skimapId: null,
            wikidataQid: null,
            osmIds: [],
            country: b.entry.country,
            region: b.entry.region,
            centroid: b.entry.centroid,
            bbox: b.entry.bbox,
            groupId: b.entry.id,
            groupName: b.entry.name,
            memberIds: [],
            excludeFromGroupNaming: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          overlay.mintedMembers.set(b.entry.id, list);
          auditIds.push(
            recordAudit({
              actor: actor.email,
              action: "membership.create_member",
              runId,
              registryId: b.entry.id,
              target: a.newMemberName,
              detail: `Minted “${a.newMemberName}” as a member of ${b.entry.name} while resolving the orphan belt.`,
              reason: a.note ?? null,
            }).id
          );
        }
      }

      if (a.action === "flag_boundary") {
        auditIds.push(
          recordAudit({
            actor: actor.email,
            action: "membership.flag_boundary",
            runId,
            registryId: b.entry.id,
            target: a.orphanId,
            detail: "Flagged a suspected missing or wrong member boundary for pipeline re-run.",
            reason: a.note ?? null,
          }).id
        );
      }
    }

    if (req.actions.length) {
      auditIds.push(
        recordAudit({
          actor: actor.email,
          action: "membership.actions",
          runId,
          registryId: b.entry.id,
          target: b.entry.name,
          detail: `Resolved ${req.actions.length} orphan(s).`,
        }).id
      );
    }

    return {
      applied: req.actions.length,
      remaining: membershipFor(b, runId).orphans.filter((o) => !o.resolved).length,
      auditIds,
    };
  },

  async waiveGate(
    runId: string,
    key: GateKey,
    req: WaiveGateRequest,
    actor: Actor
  ): Promise<ValidationGate> {
    const b = entryForRun(runId);
    if (!b) throw new Error(`Unknown run ${runId}`);
    const waiver = { reason: req.reason, actor: actor.email, at: new Date().toISOString() };
    overlay.gateWaivers.set(`${runId}:${key}`, waiver);
    recordAudit({
      actor: actor.email,
      action: "gate.waive",
      runId,
      registryId: b.entry.id,
      target: key,
      detail: `Waived the ${key.replace(/_/g, " ")} gate so the entry can advance to Stage 3.`,
      reason: req.reason,
    });
    const gate = membershipFor(b, runId).gates.find((g) => g.key === key);
    if (!gate) throw new Error(`Unknown gate ${key}`);
    return gate;
  },

  async getEnrichmentEstimate(runId: string): Promise<EnrichmentEstimate> {
    const b = entryForRun(runId);
    if (!b) throw new Error(`Unknown run ${runId}`);
    return buildEnrichmentEstimate(runId, b);
  },

  async approveEnrichmentSpend(
    runId: string,
    req: ApproveSpendRequest,
    actor: Actor
  ): Promise<SpendApproval> {
    const b = entryForRun(runId);
    if (!b) throw new Error(`Unknown run ${runId}`);
    const approval: SpendApproval = {
      approvedBy: actor.email,
      approvedAt: new Date().toISOString(),
      approvedCostUsd: req.approvedCostUsd,
      ceilingUsd: req.ceilingUsd,
      note: req.note,
    };
    overlay.approvals.set(runId, approval);
    recordAudit({
      actor: actor.email,
      action: "enrichment.approve_spend",
      runId,
      registryId: b.entry.id,
      target: b.entry.name,
      detail: `Approved $${req.approvedCostUsd.toFixed(2)} of Foursquare enrichment with a $${req.ceilingUsd.toFixed(
        2
      )} hard ceiling.`,
      reason: req.note || null,
    });
    return approval;
  },

  async getEnrichmentReport(runId: string): Promise<EnrichmentReport> {
    const b = entryForRun(runId);
    if (!b) throw new Error(`Unknown run ${runId}`);
    return enrichmentReportFor(b, runId);
  },

  async submitUnmatchedVerdicts(
    runId: string,
    req: UnmatchedVerdictsRequest,
    actor: Actor
  ): Promise<VerdictsResponse> {
    const b = entryForRun(runId);
    for (const v of req.verdicts) overlay.unmatchedVerdicts.set(v.placeId, v.action);
    if (req.verdicts.length && b) {
      recordAudit({
        actor: actor.email,
        action: "enrichment.unmatched",
        runId,
        registryId: b.entry.id,
        target: b.entry.name,
        detail: `Resolved ${req.verdicts.length} unmatched POI(s).`,
      });
    }
    return {
      applied: req.verdicts.length,
      remaining: b ? enrichmentReportFor(b, runId).unmatched : 0,
      auditIds: [],
    };
  },

  async getQaWorkspace(registryId: string): Promise<QaWorkspaceResponse> {
    const b = byId(registryId);
    if (!b) throw new Error(`Unknown registry entry ${registryId}`);
    const checks = qaChecksFor(b);
    const checklist = buildChecklist().map((c) => {
      const s = overlay.checklist.get(`${registryId}:${c.key}`);
      return s ? { ...c, ...s } : c;
    });

    return {
      registryId,
      registryName: b.entry.name,
      runId: latestRunId(b),
      checks,
      checklist,
      pisteMaps: [
        {
          id: `${registryId}:official`,
          label: `${b.entry.name} — winter piste map`,
          url: buildPisteMapSvg(b.entry.name, b.entry.id),
          kind: "image",
          // Null bounds: nobody has georeferenced this sheet, so the overlay is
          // a visual alignment aid rather than a registered raster.
          bounds: null,
          source: "Synthetic stand-in (mock mode)",
          attribution: "Generated fixture — not an operator sheet",
        },
      ],
      counts: {
        current: {
          places: b.places,
          lifts: b.lifts,
          trails: b.trails,
          members: membersOf(b).length,
        },
        previous: {
          places: Math.max(0, b.places - 12),
          lifts: b.lifts,
          trails: Math.max(0, b.trails - 3),
          members: Math.max(0, membersOf(b).length - 1),
        },
      },
      publishable: checks.every((c) => c.status !== "fail"),
    };
  },

  async publish(registryId: string, req: PublishRequest, actor: Actor): Promise<PublishResponse> {
    const b = byId(registryId);
    if (!b) throw new Error(`Unknown registry entry ${registryId}`);

    for (const w of req.waivers) {
      overlay.qaWaivers.set(w.checkId, {
        reason: w.reason,
        actor: actor.email,
        at: new Date().toISOString(),
      });
      recordAudit({
        actor: actor.email,
        action: "qa.waive",
        registryId,
        target: w.checkId,
        detail: "Waived a failing pre-publish check.",
        reason: w.reason,
      });
    }

    const now = new Date().toISOString();
    for (const c of req.checklist) {
      overlay.checklist.set(`${registryId}:${c.key}`, {
        checked: c.checked,
        checkedBy: c.checked ? actor.email : null,
        checkedAt: c.checked ? now : null,
      });
    }

    const checks = qaChecksFor(b);
    const blockedBy = checks.filter((c) => c.status === "fail").map((c) => c.title);
    const unchecked = req.checklist.filter((c) => !c.checked);
    if (unchecked.length) blockedBy.push(`${unchecked.length} unchecked checklist item(s)`);

    if (blockedBy.length) {
      return { published: false, publishedAt: null, version: 0, blockedBy };
    }

    const prev = overlay.publishes.get(registryId);
    const state = { publishedAt: now, version: (prev?.version ?? 0) + 1 };
    overlay.publishes.set(registryId, state);
    recordAudit({
      actor: actor.email,
      action: "registry.publish",
      registryId,
      target: b.entry.name,
      detail: `Published version ${state.version} with ${req.waivers.length} waiver(s).`,
    });

    return { published: true, publishedAt: state.publishedAt, version: state.version, blockedBy: [] };
  },

  async listRuns(query: Partial<RunListQuery>): Promise<RunListResponse> {
    let runs: IngestionRun[] = [];
    for (const b of registry()) {
      if (query.registryId && b.entry.id !== query.registryId) continue;
      runs.push(
        ...buildRunsFor(b).map((r) => ({
          ...r,
          approvals: overlay.approvals.has(r.id) ? [overlay.approvals.get(r.id)!] : [],
          waivers: [
            ...[...overlay.gateWaivers.entries()]
              .filter(([k]) => k.startsWith(`${r.id}:`))
              .map(([k, w]) => ({
                scope: "gate" as const,
                key: k.split(":").slice(1).join(":"),
                reason: w.reason,
                actor: w.actor,
                at: w.at,
              })),
          ],
        }))
      );
    }
    if (query.status) runs = runs.filter((r) => r.status === query.status);
    if (query.stage) {
      runs = runs.filter((r) =>
        r.stages.some((s) => s.stage === query.stage && s.status !== "skipped")
      );
    }
    if (query.q) {
      const q = query.q.toLowerCase();
      runs = runs.filter((r) => r.registryName.toLowerCase().includes(q));
    }
    runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    const limit = query.limit ?? 50;
    return { items: runs.slice(0, limit), nextCursor: null, total: runs.length };
  },

  async getRun(runId: string): Promise<IngestionRun | null> {
    const b = entryForRun(runId);
    if (!b) return null;
    return buildRunsFor(b).find((r) => r.id === runId) ?? null;
  },

  async triggerRun(
    registryId: string,
    req: TriggerRunRequest,
    actor: Actor
  ): Promise<TriggerRunResponse> {
    const b = byId(registryId);
    if (!b) throw new Error(`Unknown registry entry ${registryId}`);
    const runId = uuidFrom(`run:${registryId}:triggered:${Date.now()}`);
    recordAudit({
      actor: actor.email,
      action: "run.trigger",
      registryId,
      runId,
      target: b.entry.name,
      detail: `Queued a run over stage(s): ${req.stages.join(", ")}.`,
      reason: req.reason || null,
    });
    return { runId, status: "queued" };
  },

  async listAudit(query: Partial<AuditQuery>): Promise<AuditListResponse> {
    let rows = overlay.audit;
    if (query.registryId) rows = rows.filter((r) => r.registryId === query.registryId);
    if (query.runId) rows = rows.filter((r) => r.runId === query.runId);
    if (query.actor) rows = rows.filter((r) => r.actor === query.actor);
    const limit = query.limit ?? 100;
    return { items: rows.slice(0, limit), nextCursor: null, total: rows.length };
  },
};

/** Re-exported so screens can label the dataset they are looking at. */
export { OVERTURE_RELEASE, MISSING_LEAVES, iso };
