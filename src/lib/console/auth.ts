import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { Actor } from "@/lib/ingestion-api";

/**
 * How `/console` is being protected right now.
 *
 *   supabase  — credentials are configured; a signed-in, allow-listed session
 *               is required for every route under /console.
 *   open-dev  — credentials are absent and we are NOT in production, so the
 *               console runs unauthenticated against the mock adapter. This is
 *               what makes `git clone && npm run dev` work with no setup. A
 *               banner says so on every screen; it is never silent.
 *   locked    — credentials are absent in production. The console refuses to
 *               render at all rather than fall back to open access. A
 *               misconfigured deploy must fail closed.
 */
export type ConsoleAuthMode = "supabase" | "open-dev" | "locked";

function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export function consoleAuthMode(): ConsoleAuthMode {
  if (supabaseConfig()) return "supabase";
  return process.env.NODE_ENV === "production" ? "locked" : "open-dev";
}

/**
 * The allow-list. Empty means nobody, deliberately: an unset
 * `CONSOLE_ALLOWED_EMAILS` in production must not mean "everyone with a
 * Supabase account in the project".
 */
export function allowedEmails(): string[] {
  return (process.env.CONSOLE_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowedEmails().includes(email.toLowerCase());
}

/** Server-side Supabase client bound to the request's cookie jar. */
export function consoleSupabase() {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase is not configured for the console.");
  const store = cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        // Server Components cannot set cookies; middleware refreshes the
        // session instead. Swallowing here is the documented pattern.
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          /* called from a Server Component — middleware handles refresh */
        }
      },
    },
  });
}

export interface ConsoleSession {
  actor: Actor;
  mode: ConsoleAuthMode;
}

/** The signed-in analyst, or null. Never throws for an anonymous visitor. */
export async function getConsoleSession(): Promise<ConsoleSession | null> {
  const mode = consoleAuthMode();
  if (mode === "locked") return null;
  if (mode === "open-dev") {
    return {
      mode,
      actor: { email: "local-dev@alpline.invalid", displayName: "Local development" },
    };
  }

  const { data } = await consoleSupabase().auth.getUser();
  const email = data.user?.email ?? null;
  if (!isAllowed(email)) return null;

  return {
    mode,
    actor: {
      email: email!,
      displayName: (data.user?.user_metadata?.full_name as string | undefined) ?? null,
    },
  };
}

/**
 * The actor for a mutation. Every server action calls this rather than
 * accepting an actor from the client — an audit row naming whoever the browser
 * claimed to be would be worse than no audit row.
 */
export async function requireConsoleActor(): Promise<Actor> {
  const session = await getConsoleSession();
  if (!session) redirect("/console/login");
  return session.actor;
}
