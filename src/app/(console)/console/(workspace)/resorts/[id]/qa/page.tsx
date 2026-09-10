import { notFound } from "next/navigation";
import { QaWorkspace } from "@/components/console/qa/QaWorkspace";
import { getIngestionApi } from "@/lib/ingestion/client";
import type { BBox } from "@/lib/ingestion-api";

export const dynamic = "force-dynamic";

export default async function QaPage({ params }: { params: { id: string } }) {
  const api = getIngestionApi();
  const entry = await api.getRegistryEntry(params.id);
  if (!entry) notFound();

  const data = await api.getQaWorkspace(params.id);

  // The comparison needs our rendered data, which is the harvest output. It is
  // fetched here rather than duplicated into the QA payload.
  const harvest = data.runId ? await api.getHarvest(data.runId).catch(() => null) : null;
  const places = harvest?.places ?? [];

  const bbox: BBox =
    places.length > 0
      ? [
          Math.min(...places.map((p) => p.point[0])),
          Math.min(...places.map((p) => p.point[1])),
          Math.max(...places.map((p) => p.point[0])),
          Math.max(...places.map((p) => p.point[1])),
        ]
      : entry.bbox;

  return <QaWorkspace data={data} places={places} bbox={bbox} />;
}
