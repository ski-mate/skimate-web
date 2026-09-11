import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Console gate and session refresh.
 *
 * Supabase access tokens rotate, and only middleware can write the refreshed
 * cookies back — a Server Component cannot. So this runs on every /console
 * request: refresh first, then decide.
 *
 * The allow-list is re-read here rather than imported from lib/console/auth so
 * that this file stays free of `server-only` and Node-only imports; middleware
 * runs on the edge runtime.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const path = request.nextUrl.pathname;

  // No credentials configured. In development the console runs open against
  // the mock adapter; in production it must fail closed.
  if (!url || !key) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.rewrite(new URL("/console/unavailable", request.url));
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser() revalidates against the auth server; getSession() would trust a
  // cookie the browser could have forged.
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase() ?? null;

  const allowed = (process.env.CONSOLE_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const signedIn = Boolean(email) && allowed.includes(email!);
  const isLogin = path === "/console/login" || path.startsWith("/console/auth");
  const isManual = path.startsWith("/guide/console");

  if (!signedIn && !isLogin) {
    const to = new URL("/console/login", request.url);
    if (path !== "/console") to.searchParams.set("next", path);
    // A session that exists but is not allow-listed is a different failure from
    // no session at all, and the login screen says so.
    if (email) to.searchParams.set("denied", "1");
    return NextResponse.redirect(to);
  }

  if (signedIn && isLogin) {
    return NextResponse.redirect(new URL("/console", request.url));
  }

  // Nothing under the manual should ever be cached by a shared cache: the
  // whole point is that it is not public.
  if (isManual) {
    response.headers.set("cache-control", "private, no-store");
    response.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  }

  return response;
}

export const config = {
  // The analyst manual lives under /guide/console because it documents the
  // console, but it is gated exactly like the console: it names internal
  // tooling, provider costs and data policy. The page also checks the session
  // itself, so dropping out of this matcher cannot silently publish it.
  matcher: ["/console/:path*", "/guide/console/:path*"],
};
