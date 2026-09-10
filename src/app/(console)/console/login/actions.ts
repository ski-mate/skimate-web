"use server";

import { redirect } from "next/navigation";
import { consoleAuthMode, consoleSupabase, isAllowed } from "@/lib/console/auth";

export interface LoginState {
  error: string | null;
}

/**
 * Password sign-in against Supabase.
 *
 * The allow-list is checked *after* authentication and then the session is torn
 * down again, so a valid Supabase user who is not on the list gets no console
 * session at all rather than a session the middleware happens to reject.
 */
export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (consoleAuthMode() !== "supabase") {
    return { error: "Supabase is not configured for the console." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/console");

  if (!email || !password) return { error: "Enter an email address and password." };

  // Refuse before contacting Supabase: no reason to let a non-allow-listed
  // address probe which passwords are valid.
  if (!isAllowed(email)) {
    return { error: "That address is not on the console allow-list." };
  }

  const supabase = consoleSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect(next.startsWith("/console") ? next : "/console");
}

export async function signOut() {
  if (consoleAuthMode() === "supabase") {
    await consoleSupabase().auth.signOut();
  }
  redirect("/console/login");
}
