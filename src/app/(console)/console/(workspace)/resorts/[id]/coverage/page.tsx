import { notFound } from "next/navigation";
import { RoutingCoverage } from "@/components/console/coverage/RoutingCoverage";
import { getIngestionApi } from "@/lib/ingestion/client";
import type { BBox } from "@/lib/ingestion-api";

export const dynamic = "force-dynamic";

/**
 * Screen 8 — routing coverage.
 *
 * Registry-scoped, unlike the other stage screens: the report is computed live
 * from the current graph rather than from a run artefact, and routing-stage
 * runs do not exist until the pipeline grows the stage. So there is no
 * `latestRunIdForStage` call here and no "has not been computed" branch — a
 * database with no graph returns `graphAvailable: false`, which is a state the
 * screen renders rather than an absence the page has to guess at.
 */
export default async function CoveragePage({ params }: { params: { id: string } }) {
  const api = getIngestionApi();
  const entry = await api.getRegistryEntry(params.id);
  if (!entry) notFound();

  const data = await api.getCoverage(params.id);

  // Frame on the findings when there are any — they are what the analyst came
  // to look at — and on the entry's own extent otherwise.
  const points = data.findings.map((f) => f.point).filter((p): p is [number, number] => p !== null);
  const bbox: BBox =
    points.length > 0
      ? [
          Math.min(...points.map((p) => p[0])),
          Math.min(...points.map((p) => p[1])),
          Math.max(...points.map((p) => p[0])),
          Math.max(...points.map((p) => p[1])),
        ]
      : entry.bbox;

  return <RoutingCoverage data={data} registryId={params.id} bbox={bbox} />;
}
