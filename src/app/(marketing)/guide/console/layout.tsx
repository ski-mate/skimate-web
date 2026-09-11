import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getConsoleSession } from "@/lib/console/auth";

/**
 * The analyst manual sits behind the same allow-list as `/console` itself: it
 * names internal tooling, provider costs and data policy.
 *
 * Middleware is the outer gate — it also refreshes the Supabase session, which
 * only middleware can do — but the check is repeated here on purpose. A route
 * that dropped out of the middleware matcher would otherwise publish the
 * manual silently, and defence in depth is cheap when the alternative is
 * discovering it from a search result.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    template: "%s — Alpline Analyst Manual",
    default: "Alpline Analyst Manual",
  },
  robots: { index: false, follow: false, nocache: true },
};

export default async function ConsoleManualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getConsoleSession();
  if (!session) redirect("/console/login?next=/guide/console");

  return (
    <>
      <p className="border-b border-[var(--separator)] bg-[var(--fill)] py-2 text-center text-[13px] text-[var(--label-2)]">
        Internal documentation — visible only to allow-listed console accounts.{" "}
        <Link href="/console" className="text-[var(--link)] underline underline-offset-[3px]">
          Open the console
        </Link>
      </p>
      {children}
    </>
  );
}
