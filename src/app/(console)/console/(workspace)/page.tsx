import type { Metadata } from "next";
import { AtlasWorklist } from "@/components/console/worklist/AtlasWorklist";
import { getIngestionApi } from "@/lib/ingestion/client";

export const metadata: Metadata = { title: "Atlas worklist" };
export const dynamic = "force-dynamic";

export default async function WorklistPage() {
  const data = await getIngestionApi().getWorklist({ limit: 500 });
  return <AtlasWorklist data={data} />;
}
