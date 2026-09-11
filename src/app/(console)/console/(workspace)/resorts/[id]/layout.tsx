import Link from "next/link";
import { notFound } from "next/navigation";
import { ResortTabs, type ResortTab } from "@/components/console/ResortTabs";
import { StageBadge } from "@/components/console/ui/primitives";
import { getIngestionApi } from "@/lib/ingestion/client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const entry = await getIngestionApi().getRegistryEntry(params.id);
  return { title: entry?.name ?? "Registry entry" };
}

/**
 * The per-entry shell. Its job is to keep identity visible while the analyst
 * works: which entry this is, what it is anchored to, and which stage they are
 * standing in. External refs sit in the header rather than a detail panel
 * because "which OSM polygons is this?" is the question behind half the
 * decisions on the screens below.
 */
export default async function ResortLayout({
  params,
  children,
}: {
  params: { id: string };
  children: React.ReactNode;
}) {
  const api = getIngestionApi();
  const entry = await api.getRegistryEntry(params.id);
  if (!entry) notFound();

  const { rows } = await api.getWorklist({ limit: 500 });
  const row = rows.find((r) => r.registryId === params.id);
  const base = `/console/resorts/${params.id}`;

  // Coverage counts do not ride on the worklist row: `WorklistRow` is frozen
  // and coverage is computed live, so the tab badge costs one extra bounded
  // read. It must never take the page down with it — an entry with no graph is
  // the normal case, and a coverage endpoint that is not deployed yet should
  // cost a badge, not the screen.
  const coverage = await api.getCoverage(params.id).catch(() => null);
  const coverageOpen = coverage
    ? coverage.findings.filter((f) => !f.verdict).length +
      coverage.gates.filter((g) => g.status === "fail" && g.blocking).length
    : 0;

  const tabs: ResortTab[] = [
    { href: `${base}/harvest`, label: "Harvest", count: row?.openConflicts, tone: "ready" },
    {
      href: `${base}/membership`,
      label: "Membership & gates",
      count: (row?.gateFailures ?? 0) + (row?.orphanCount ?? 0),
      tone: (row?.gateFailures ?? 0) > 0 ? "blocked" : "warn",
    },
    {
      href: `${base}/coverage`,
      label: "Coverage",
      count: coverageOpen,
      tone:
        coverage && coverage.gates.some((g) => g.status === "fail" && g.blocking)
          ? "blocked"
          : "warn",
    },
    { href: `${base}/enrichment`, label: "Enrichment" },
    { href: `${base}/qa`, label: "QA", count: row?.qaFailures, tone: "warn" },
    { href: `${base}/history`, label: "History" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-[var(--separator)] bg-[var(--bg)] px-4 pt-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href="/console" className="text-[12px] text-[var(--label-3)] hover:underline">
            Worklist
          </Link>
          <span aria-hidden className="text-[var(--label-4)]">
            /
          </span>
          <h1 className="text-[15px] font-semibold">{entry.name}</h1>
          {row && <StageBadge stage={row.stage} />}
          {entry.kind === "group" && (
            <span className="rounded-sm bg-[var(--fill)] px-1.5 py-0.5 text-[11px] text-[var(--label-2)]">
              group of {entry.memberIds.length}
            </span>
          )}
          {entry.groupName && (
            <span className="text-[11px] text-[var(--label-3)]">Part of {entry.groupName}</span>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {entry.skimapId !== null && (
              <Ref label="Skimap" value={entry.skimapId} title="Skimap.org registry id — the editorial identity spine" />
            )}
            {entry.wikidataQid && <Ref label="Wikidata" value={entry.wikidataQid} title="Wikidata QID" />}
            {entry.osmIds.map((id) => (
              <Ref
                key={id}
                label="OSM"
                value={id}
                title={
                  entry.osmIds.length > 1
                    ? "One of several OSM polygons attached to this entry as evidence — polygons are evidence, not identity"
                    : "OSM element id"
                }
              />
            ))}
            {entry.osmIds.length === 0 && (
              <span
                className="rounded-sm bg-[var(--c-warn-bg)] px-1.5 py-0.5 text-[10px] text-[var(--c-warn)]"
                title="No ski-area polygon. Village commerce depends entirely on the settlement rule."
              >
                no OSM polygon
              </span>
            )}
          </div>
        </div>

        <p className="mt-0.5 text-[11px] text-[var(--label-3)]">
          {entry.region}, {entry.country} · {row?.trailCount ?? 0} trails · {row?.liftCount ?? 0}{" "}
          lifts · {row?.placeCount ?? 0} places
        </p>

        <div className="mt-2">
          <ResortTabs tabs={tabs} />
        </div>
      </header>

      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

function Ref({ label, value, title }: { label: string; value: string | number; title: string }) {
  return (
    <span
      title={title}
      className="tabular inline-flex h-[19px] items-center gap-1 rounded-sm bg-[var(--fill)] px-1.5 text-[10px] text-[var(--label-2)]"
    >
      <span className="text-[var(--label-4)]">{label}</span>
      {value}
    </span>
  );
}
