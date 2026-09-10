"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { signIn, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-9 w-full rounded-sm bg-[var(--link-fill)] text-[13px] font-medium text-white transition-colors hover:bg-[var(--link-fill-hover)] disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const [state, action] = useFormState<LoginState, FormData>(signIn, { error: null });
  const denied = params.get("denied") === "1";

  return (
    <form action={action} className="w-full max-w-[320px] space-y-3">
      <div>
        <h1 className="text-[17px] font-semibold">Ingestion Console</h1>
        <p className="mt-1 text-[12px] text-[var(--label-3)]">
          Internal tooling for resort onboarding. Access is limited to named accounts.
        </p>
      </div>

      <input type="hidden" name="next" value={params.get("next") ?? "/console"} />

      <label className="block">
        <span className="mb-1 block text-[11px] font-medium text-[var(--label-2)]">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="h-9 w-full rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-2.5 text-[13px] outline-none focus:border-[var(--link)]"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[11px] font-medium text-[var(--label-2)]">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-9 w-full rounded-sm border border-[var(--separator)] bg-[var(--bg)] px-2.5 text-[13px] outline-none focus:border-[var(--link)]"
        />
      </label>

      {(state.error || denied) && (
        <p
          role="alert"
          className="rounded-sm bg-[var(--c-blocked-bg)] px-2.5 py-2 text-[12px] text-[var(--c-blocked)]"
        >
          {state.error ??
            "You are signed in to Supabase, but that address is not on the console allow-list."}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

export default function ConsoleLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
