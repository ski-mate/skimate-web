import type { FeatureStatus } from "@/content/site";

/**
 * Marks a capability that is not built yet. Every unshipped claim on the site
 * carries one of these — it is the mechanism that keeps the marketing honest
 * as features land.
 */
export function StatusBadge({
  status,
  pro,
}: {
  status: FeatureStatus;
  pro?: boolean;
}) {
  if (status === "shipping" && !pro) return null;

  return (
    <span className="ml-2 inline-flex gap-1.5 align-middle">
      {pro ? (
        <span className="type-caption rounded-pill bg-[var(--link)] px-2 py-0.5 font-medium text-white">
          Pro
        </span>
      ) : null}
      {status === "soon" ? (
        <span className="type-caption rounded-pill border border-[var(--separator)] px-2 py-0.5 text-[var(--label-3)]">
          Coming soon
        </span>
      ) : null}
    </span>
  );
}
