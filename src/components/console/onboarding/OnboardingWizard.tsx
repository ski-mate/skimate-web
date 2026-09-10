"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type {
  CandidateSearchResponse,
  DuplicatePair,
  IdentityCandidate,
  LngLat,
  ManifestIssue,
  ManifestMember,
  OnboardingManifest,
  VillageSeed,
} from "@/lib/ingestion-api";
import {
  searchCandidates,
  submitManifest,
  validateManifest,
} from "@/app/(console)/console/(workspace)/actions";
import { CANDIDATE_SOURCE_COLOR, OnboardingMap, type MapTool } from "./OnboardingMap";

const SOURCE_LABEL: Record<IdentityCandidate["source"], string> = {
  skimap: "Skimap.org",
  wikidata: "Wikidata",
  osm: "OpenStreetMap",
};

export function OnboardingWizard({
  initialManifest,
  initial,
}: {
  /**
   * Minted on the server. Doing it here in a `useState` initialiser would run
   * on both the server and the client with different clocks, which produced a
   * hydration mismatch and a different manifest id on every render.
   */
  initialManifest: OnboardingManifest;
  initial: CandidateSearchResponse;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(initial);
  const [searching, startSearch] = useTransition();

  const [manifest, setManifest] = useState<OnboardingManifest>(initialManifest);
  const [issues, setIssues] = useState<ManifestIssue[]>([]);
  const [submittable, setSubmittable] = useState(false);
  const [tool, setTool] = useState<MapTool>("none");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(true);

  // Validation runs against the same server-side rules the pipeline will apply,
  // rather than a second copy of them in the browser that could disagree.
  useEffect(() => {
    const t = setTimeout(async () => {
      const v = await validateManifest(manifest);
      setIssues(v.issues);
      setSubmittable(v.submittable);
    }, 350);
    return () => clearTimeout(t);
  }, [manifest]);

  const runSearch = useCallback((q: string) => {
    startSearch(async () => {
      const res = await searchCandidates({ q, limit: 20 });
      setResults(res);
    });
  }, []);

  const selectedIds = useMemo(() => {
    const ids = new Set<string>();
    if (manifest.group) {
      if (manifest.group.skimapId !== null) ids.add(`skimap:${manifest.group.skimapId}`);
      for (const o of manifest.group.osmIds) ids.add(`osm:${o}`);
    }
    for (const m of manifest.members) {
      for (const o of m.osmIds) ids.add(`osm:${o}`);
      if (m.wikidataQid) ids.add(`wikidata:${m.wikidataQid}`);
    }
    return ids;
  }, [manifest]);

  const [resolving, setResolving] = useState(false);

  /**
   * Selecting a Skimap group hands over its editorial member list for free —
   * including the leaves that have no ski-area polygon and therefore cannot be
   * discovered from geometry at all.
   *
   * The member names arrive without refs, so each one is resolved against the
   * candidate sources afterwards. Reading them out of the current result page
   * would make the outcome depend on what the analyst last searched for, which
   * is how Val Thorens ended up declared with no OSM polygon it plainly has.
   */
  const adoptGroup = useCallback(
    (c: IdentityCandidate) => {
      const members: ManifestMember[] = c.memberNames.map((name) => ({
        key: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name,
        aliases: [],
        skimapId: null,
        wikidataQid: null,
        osmIds: [],
        excludeFromGroupNaming: false,
        source: "skimap",
        existingRegistryId: null,
      }));

      setManifest((m) => ({
        ...m,
        group: {
          name: c.name,
          aliases: c.aliases,
          skimapId: c.source === "skimap" ? Number(c.externalId) : null,
          wikidataQid: c.source === "wikidata" ? c.externalId : null,
          osmIds: c.source === "osm" ? [Number(c.externalId)] : [],
          existingRegistryId: c.existingRegistryId,
        },
        members: members.length ? members : m.members,
        bbox: c.bbox ?? m.bbox,
      }));

      if (members.length === 0) return;

      setResolving(true);
      void Promise.all(
        members.map(async (mem) => {
          const res = await searchCandidates({ q: mem.name, limit: 8 });
          const exact = res.candidates.filter(
            (x) => x.name.toLowerCase() === mem.name.toLowerCase()
          );
          const osm = exact.find((x) => x.source === "osm");
          const wiki = exact.find((x) => x.source === "wikidata");
          return {
            key: mem.key,
            osmIds: osm ? [Number(osm.externalId)] : [],
            wikidataQid: wiki?.externalId ?? null,
            existingRegistryId: osm?.existingRegistryId ?? wiki?.existingRegistryId ?? null,
            source: (osm ? "osm" : wiki ? "wikidata" : "skimap") as ManifestMember["source"],
          };
        })
      )
        .then((resolved) => {
          const by = new Map(resolved.map((r) => [r.key, r]));
          setManifest((m) => ({
            ...m,
            members: m.members.map((x) => {
              const r = by.get(x.key);
              if (!r) return x;
              return {
                ...x,
                osmIds: x.osmIds.length ? x.osmIds : r.osmIds,
                wikidataQid: x.wikidataQid ?? r.wikidataQid,
                existingRegistryId: x.existingRegistryId ?? r.existingRegistryId,
                source: r.source,
              };
            }),
          }));
        })
        .finally(() => setResolving(false));
    },
    []
  );

  const addMember = useCallback((c: IdentityCandidate) => {
    setManifest((m) => {
      const key = c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const existing = m.members.find((x) => x.key === key);
      if (existing) {
        // Second source for a member already declared: attach it as another ref
        // rather than creating a duplicate member.
        return {
          ...m,
          members: m.members.map((x) =>
            x.key !== key
              ? x
              : {
                  ...x,
                  osmIds:
                    c.source === "osm" && !x.osmIds.includes(Number(c.externalId))
                      ? [...x.osmIds, Number(c.externalId)]
                      : x.osmIds,
                  wikidataQid: c.source === "wikidata" ? c.externalId : x.wikidataQid,
                  skimapId: c.source === "skimap" ? Number(c.externalId) : x.skimapId,
                }
          ),
        };
      }
      return {
        ...m,
        members: [
          ...m.members,
          {
            key,
            name: c.name,
            aliases: c.aliases,
            skimapId: c.source === "skimap" ? Number(c.externalId) : null,
            wikidataQid: c.source === "wikidata" ? c.externalId : null,
            osmIds: c.source === "osm" ? [Number(c.externalId)] : [],
            excludeFromGroupNaming: false,
            source: c.source,
            existingRegistryId: c.existingRegistryId,
          },
        ],
      };
    });
  }, []);

  /** The duplicate-polygon resolution: one entry, two evidence refs. */
  const mergeDuplicate = useCallback((pair: DuplicatePair) => {
    setManifest((m) => {
      const osmIds = [Number(pair.left.externalId), Number(pair.right.externalId)];
      const group = m.group
        ? { ...m.group, osmIds: Array.from(new Set([...m.group.osmIds, ...osmIds])) }
        : {
            name: pair.left.name,
            aliases: [pair.right.name].filter((n) => n !== pair.left.name),
            skimapId: null,
            wikidataQid: null,
            osmIds,
            existingRegistryId: pair.left.existingRegistryId,
          };
      return { ...m, group };
    });
  }, []);

  const grouped = useMemo(() => {
    const by: Record<IdentityCandidate["source"], IdentityCandidate[]> = {
      skimap: [],
      wikidata: [],
      osm: [],
    };
    for (const c of results.candidates) by[c.source].push(c);
    return by;
  }, [results.candidates]);

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return (
    <div className="flex h-full min-h-0">
      {/* Candidates — three sources side by side, which is the whole point of
          Stage 0: none of them alone is sufficient. */}
      <div className="flex w-[318px] shrink-0 flex-col border-r border-[var(--separator)] bg-[var(--bg)]">
        <div className="shrink-0 border-b border-[var(--separator)] p-3">
          <h1 className="text-[13px] font-semibold">Onboard a resort</h1>
          <p className="mt-0.5 text-[11px] leading-snug text-[var(--label-3)]">
            Stage 0. Resolve identity from Skimap, Wikidata and OSM, declare the group and its
            members, then hand the pipeline a manifest.
          </p>
          <form
            className="mt-2 flex gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(query);
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a resort or domain…"
              aria-label="Search identity candidates"
              className="h-7 flex-1 rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-2 text-[12px] outline-none focus:border-[var(--link)]"
            />
            <button
              type="submit"
              className="h-7 rounded-sm border border-[var(--separator)] px-2 text-[11px] hover:bg-[var(--fill)]"
            >
              {searching ? "…" : "Search"}
            </button>
          </form>
        </div>

        <div className="scroll-y min-h-0 flex-1">
          {results.duplicates.length > 0 && (
            <div className="border-b border-[var(--separator)] bg-[var(--c-warn-bg)] p-3">
              <h2 className="text-[11px] font-semibold text-[var(--c-warn)]">
                Overlapping polygons — same resort?
              </h2>
              {results.duplicates.map((d) => (
                <div key={d.id} className="mt-1.5 text-[11px]">
                  <p className="leading-snug text-[var(--label-2)]">{d.rationale}</p>
                  <p className="tabular mt-1 text-[10px] text-[var(--label-3)]">
                    OSM {d.left.externalId} ({d.left.areaKm2} km²) · {d.overlapOfLeftPct}% covered
                    <br />
                    OSM {d.right.externalId} ({d.right.areaKm2} km²) · {d.overlapOfRightPct}% covered
                  </p>
                  <button
                    type="button"
                    onClick={() => mergeDuplicate(d)}
                    className="mt-1.5 h-6 rounded-sm bg-[var(--c-warn)] px-2 text-[11px] font-medium text-black"
                  >
                    Merge as evidence refs
                  </button>
                </div>
              ))}
            </div>
          )}

          {(["skimap", "wikidata", "osm"] as const).map((src) => (
            <div key={src} className="border-b border-[var(--separator)]">
              <h2 className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--label-3)]">
                <span
                  aria-hidden
                  className="size-[7px] rounded-full"
                  style={{ background: CANDIDATE_SOURCE_COLOR[src] }}
                />
                {SOURCE_LABEL[src]}
                <span className="tabular ml-auto font-normal">{grouped[src].length}</span>
              </h2>
              <ul>
                {grouped[src].map((c) => (
                  <li key={c.id} className="border-t border-[var(--separator)] px-3 py-1.5">
                    <div className="flex items-baseline justify-between gap-1.5">
                      <span className="truncate text-[12px] font-medium">{c.name}</span>
                      {c.existingRegistryId && (
                        <span
                          className="shrink-0 rounded-sm bg-[var(--fill)] px-1 text-[9px] text-[var(--label-3)]"
                          title="Already in the registry"
                        >
                          in registry
                        </span>
                      )}
                    </div>
                    <p className="tabular truncate text-[10px] text-[var(--label-3)]">
                      {c.externalId}
                      {c.areaKm2 !== null && ` · ${c.areaKm2} km²`}
                      {c.adminArea && ` · ${c.adminArea}`}
                    </p>
                    {c.memberNames.length > 0 && (
                      <p className="truncate text-[10px] text-[var(--label-4)]">
                        {c.memberNames.length} members: {c.memberNames.join(", ")}
                      </p>
                    )}
                    <div className="mt-1 flex gap-1">
                      {c.memberNames.length > 0 && (
                        <button
                          type="button"
                          onClick={() => adoptGroup(c)}
                          className="h-6 rounded-sm border border-[var(--link)] bg-[var(--c-ready-bg)] px-1.5 text-[10px] text-[var(--c-ready)]"
                        >
                          Use as group + {c.memberNames.length} members
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => addMember(c)}
                        className="h-6 rounded-sm border border-[var(--separator)] px-1.5 text-[10px] hover:bg-[var(--fill)]"
                      >
                        Add as member
                      </button>
                    </div>
                  </li>
                ))}
                {grouped[src].length === 0 && (
                  <li className="px-3 py-2 text-[11px] text-[var(--label-4)]">No candidates.</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Map with the one drawing tool in the console. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-[var(--separator)] bg-[var(--bg)] px-3 py-2 text-[11px]">
          {(
            [
              ["none", "Select"],
              ["bbox", "Draw extent"],
              ["seed", "Drop village seed"],
            ] as const
          ).map(([t, label]) => (
            <button
              key={t}
              type="button"
              aria-pressed={tool === t}
              onClick={() => setTool(t)}
              className={cn(
                "h-6 rounded-sm border px-2",
                tool === t
                  ? "border-[var(--link)] bg-[var(--c-ready-bg)] text-[var(--c-ready)]"
                  : "border-[var(--separator)] hover:bg-[var(--fill)]"
              )}
            >
              {label}
            </button>
          ))}
          <span className="text-[10px] text-[var(--label-4)]">
            {tool === "bbox"
              ? "Click two opposite corners."
              : tool === "seed"
                ? "Click to drop a seed; rename it on the right."
                : "Click a candidate to add it as a member."}
          </span>
          <span className="tabular ml-auto text-[10px] text-[var(--label-3)]">
            {manifest.bbox.map((n) => n.toFixed(3)).join(", ")}
          </span>
        </div>

        <div className="min-h-0 flex-1">
          <OnboardingMap
            candidates={results.candidates}
            selectedIds={selectedIds}
            bbox={manifest.bbox}
            seeds={manifest.villageSeeds}
            tool={tool}
            onPickCandidate={(id) => {
              const c = results.candidates.find((x) => x.id === id);
              if (c) addMember(c);
            }}
            onBboxDrawn={(b) => {
              setManifest((m) => ({ ...m, bbox: b }));
              setTool("none");
            }}
            onSeedDropped={(p: LngLat) =>
              setManifest((m) => ({
                ...m,
                villageSeeds: [
                  ...m.villageSeeds,
                  { name: `Village ${m.villageSeeds.length + 1}`, point: p },
                ],
              }))
            }
          />
        </div>
      </div>

      {/* The manifest itself — form and JSON side by side, because the JSON is
          the artefact the pipeline consumes and the form is only a way to type
          it. */}
      <div className="flex w-[430px] shrink-0 flex-col border-l border-[var(--separator)] bg-[var(--bg)]">
        <div className="scroll-y min-h-0 flex-1">
          <section className="border-b border-[var(--separator)] p-3">
            <h2 className="mb-1.5 text-[12px] font-semibold">Group</h2>
            {manifest.group ? (
              <div className="space-y-1.5">
                <input
                  value={manifest.group.name}
                  onChange={(e) =>
                    setManifest((m) => ({
                      ...m,
                      group: m.group ? { ...m.group, name: e.target.value } : null,
                    }))
                  }
                  aria-label="Group name"
                  className="h-7 w-full rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-2 text-[12px] outline-none focus:border-[var(--link)]"
                />
                <p className="tabular text-[10px] text-[var(--label-3)]">
                  {manifest.group.skimapId !== null && `skimap ${manifest.group.skimapId} · `}
                  {manifest.group.osmIds.length > 0 &&
                    `osm ${manifest.group.osmIds.join(", ")}`}
                  {manifest.group.osmIds.length > 1 && (
                    <span className="text-[var(--c-warn)]">
                      {" "}
                      — two polygons, one entity
                    </span>
                  )}
                </p>
                {manifest.group.aliases.length > 0 && (
                  <p className="text-[10px] text-[var(--label-4)]">
                    aliases: {manifest.group.aliases.join(", ")}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setManifest((m) => ({ ...m, group: null }))}
                  className="text-[10px] text-[var(--label-3)] underline"
                >
                  Remove group — onboard as a standalone resort
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-[var(--label-3)]">
                No group. Pick a Skimap domain on the left, or leave empty to onboard a standalone
                resort.
              </p>
            )}
          </section>

          <section className="border-b border-[var(--separator)] p-3">
            <h2 className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold">
              Members
              <span className="tabular rounded-sm bg-[var(--fill)] px-1 text-[11px] font-medium text-[var(--label-2)]">
                {manifest.members.length}
              </span>
              {resolving && (
                <span className="text-[10px] font-normal text-[var(--label-3)]">
                  resolving refs…
                </span>
              )}
            </h2>
            <ul className="space-y-1">
              {manifest.members.map((mem, i) => (
                <li key={mem.key} className="rounded-sm border border-[var(--separator)] p-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      value={mem.name}
                      onChange={(e) =>
                        setManifest((m) => ({
                          ...m,
                          members: m.members.map((x, j) =>
                            j === i ? { ...x, name: e.target.value } : x
                          ),
                        }))
                      }
                      aria-label={`Member ${i + 1} name`}
                      className="h-6 flex-1 rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-1.5 text-[11px] outline-none focus:border-[var(--link)]"
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${mem.name}`}
                      onClick={() =>
                        setManifest((m) => ({
                          ...m,
                          members: m.members.filter((_, j) => j !== i),
                        }))
                      }
                      className="size-6 shrink-0 rounded-sm border border-[var(--separator)] text-[11px] hover:bg-[var(--fill)]"
                    >
                      ×
                    </button>
                  </div>
                  <p className="tabular mt-0.5 text-[10px] text-[var(--label-3)]">
                    {mem.osmIds.length > 0 ? `osm ${mem.osmIds.join(", ")}` : "no OSM polygon"}
                    {mem.wikidataQid && ` · ${mem.wikidataQid}`}
                    {mem.existingRegistryId && " · in registry"}
                  </p>
                  <label className="mt-0.5 flex cursor-pointer items-center gap-1 text-[10px] text-[var(--label-3)]">
                    <input
                      type="checkbox"
                      checked={mem.excludeFromGroupNaming}
                      onChange={(e) =>
                        setManifest((m) => ({
                          ...m,
                          members: m.members.map((x, j) =>
                            j === i ? { ...x, excludeFromGroupNaming: e.target.checked } : x
                          ),
                        }))
                      }
                      className="size-3"
                    />
                    Opt out of group naming
                  </label>
                </li>
              ))}
              {manifest.members.length === 0 && (
                <li className="text-[11px] text-[var(--label-3)]">
                  No members yet. Add them from the candidate list.
                </li>
              )}
            </ul>
          </section>

          <section className="border-b border-[var(--separator)] p-3">
            <h2 className="mb-1.5 text-[12px] font-semibold">
              Village seeds{" "}
              <span className="tabular ml-1 rounded-sm bg-[var(--fill)] px-1 text-[11px] font-medium text-[var(--label-2)]">
                {manifest.villageSeeds.length}
              </span>
            </h2>
            <ul className="space-y-1">
              {manifest.villageSeeds.map((s: VillageSeed, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <input
                    value={s.name}
                    onChange={(e) =>
                      setManifest((m) => ({
                        ...m,
                        villageSeeds: m.villageSeeds.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x
                        ),
                      }))
                    }
                    aria-label={`Seed ${i + 1} name`}
                    className="h-6 flex-1 rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-1.5 text-[11px] outline-none focus:border-[var(--link)]"
                  />
                  <span className="tabular shrink-0 text-[10px] text-[var(--label-4)]">
                    {s.point[1].toFixed(3)}, {s.point[0].toFixed(3)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${s.name}`}
                    onClick={() =>
                      setManifest((m) => ({
                        ...m,
                        villageSeeds: m.villageSeeds.filter((_, j) => j !== i),
                      }))
                    }
                    className="size-6 shrink-0 rounded-sm border border-[var(--separator)] text-[11px] hover:bg-[var(--fill)]"
                  >
                    ×
                  </button>
                </li>
              ))}
              {manifest.villageSeeds.length === 0 && (
                <li className="text-[11px] text-[var(--label-3)]">
                  None. The settlement rule falls back to Voronoi around member centroids, which is
                  coarser.
                </li>
              )}
            </ul>
          </section>

          <section className="border-b border-[var(--separator)] p-3">
            <h2 className="mb-1.5 text-[12px] font-semibold">Providers</h2>
            <div className="flex gap-3">
              {(["osm", "overture", "wikidata"] as const).map((p) => (
                <label key={p} className="flex cursor-pointer items-center gap-1.5 text-[11px]">
                  <input
                    type="checkbox"
                    checked={manifest.providers[p]}
                    onChange={(e) =>
                      setManifest((m) => ({
                        ...m,
                        providers: { ...m.providers, [p]: e.target.checked },
                      }))
                    }
                    className="size-3.5"
                  />
                  {p}
                </label>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-[var(--label-4)]">
              Free sources only. Paid enrichment is a separate, explicitly approved stage.
            </p>
          </section>

          {issues.length > 0 && (
            <section className="border-b border-[var(--separator)] p-3">
              <h2 className="mb-1.5 text-[12px] font-semibold">
                Validation{" "}
                {errors.length > 0 && (
                  <span className="rounded-sm bg-[var(--c-blocked-bg)] px-1 text-[10px] text-[var(--c-blocked)]">
                    {errors.length} error{errors.length === 1 ? "" : "s"}
                  </span>
                )}
                {warnings.length > 0 && (
                  <span className="ml-1 rounded-sm bg-[var(--c-warn-bg)] px-1 text-[10px] text-[var(--c-warn)]">
                    {warnings.length} warning{warnings.length === 1 ? "" : "s"}
                  </span>
                )}
              </h2>
              <ul className="space-y-1">
                {issues.map((iss, i) => (
                  <li
                    key={i}
                    className={cn(
                      "rounded-sm px-1.5 py-1 text-[11px] leading-snug",
                      iss.severity === "error"
                        ? "bg-[var(--c-blocked-bg)] text-[var(--c-blocked)]"
                        : "bg-[var(--c-warn-bg)] text-[var(--c-warn)]"
                    )}
                  >
                    {iss.message}
                    {iss.path && (
                      <code className="ml-1 text-[10px] opacity-70">{iss.path}</code>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="p-3">
            <button
              type="button"
              onClick={() => setShowJson((v) => !v)}
              aria-expanded={showJson}
              className="mb-1.5 text-[12px] font-semibold"
            >
              Onboarding manifest {showJson ? "▾" : "▸"}
            </button>
            <p className="mb-1.5 text-[10px] leading-snug text-[var(--label-4)]">
              This is the pipeline&rsquo;s input contract, not a preview of the form. It is what
              gets submitted and what the run record will point back at.
            </p>
            {showJson && (
              <pre className="scroll-y max-h-[320px] whitespace-pre-wrap break-all rounded-sm bg-[var(--bg-inset)] p-2 font-mono text-[10px] leading-relaxed text-[var(--label-2)]">
                {JSON.stringify(manifest, null, 2)}
              </pre>
            )}
          </section>
        </div>

        <div className="shrink-0 space-y-2 border-t border-[var(--separator)] p-3">
          <button
            type="button"
            disabled={!submittable || submitting}
            onClick={async () => {
              setSubmitting(true);
              setSubmitResult(null);
              try {
                const res = await submitManifest(manifest);
                setSubmitResult(
                  `Submitted. Run ${res.runId.slice(0, 8)} queued, ${res.createdMemberIds.length} member entries minted.`
                );
                router.refresh();
              } catch (e) {
                setSubmitResult(e instanceof Error ? e.message : "Submit failed.");
              } finally {
                setSubmitting(false);
              }
            }}
            className="h-8 w-full rounded-sm bg-[var(--link-fill)] text-[12px] font-semibold text-white disabled:opacity-35"
          >
            {submitting ? "Submitting…" : "Submit manifest and start Stage 1"}
          </button>
          {submitResult && (
            <p role="status" className="text-[11px] text-[var(--label-2)]">
              {submitResult}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
