import "server-only";

import type { IngestionApi } from "@/lib/ingestion-api";
import { mockIngestionApi } from "./mock-adapter";
import { httpIngestionApi } from "./http-adapter";

/**
 * Which data plane the console is talking to.
 *
 * Default is `mock`, so a fresh clone runs with no backend and no credentials.
 * Set `INGESTION_API_MODE=real` plus `INGESTION_API_URL` to point at
 * alpline-backend once `/ingestion/*` exists. Both adapters implement the same
 * interface, so nothing above this line changes.
 */
export type IngestionMode = "mock" | "real";

export function ingestionMode(): IngestionMode {
  return process.env.INGESTION_API_MODE === "real" ? "real" : "mock";
}

export function getIngestionApi(): IngestionApi {
  return ingestionMode() === "real" ? httpIngestionApi : mockIngestionApi;
}
