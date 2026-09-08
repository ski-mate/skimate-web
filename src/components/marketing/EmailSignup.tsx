"use client";

import { useState } from "react";
import { Container } from "@/components/apple/Container";
import { SectionScheme } from "@/components/apple/SectionScheme";

/**
 * Waitlist signup. This is the primary call to action across the site: there
 * are no App Store or Play URLs yet, and a dead store badge is worse than none.
 *
 * Posts to /api/email-signup, which is unchanged — it lower-cases the address
 * and treats a duplicate as success.
 */
export function EmailSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setError("Network error. Check your connection and try again.");
    }
  }

  return (
    <SectionScheme
      id="waitlist"
      scheme="auto"
      tone="elevated"
      className="scroll-mt-nav py-section"
    >
      <Container className="text-center">
        <h2 className="type-display-3 text-balance">Be there for first lifts.</h2>
        <p className="type-tagline mx-auto mt-3 max-w-[40ch] text-balance text-[var(--label-2)]">
          Alpline is rolling out resort by resort. Leave your email and we will
          tell you when it reaches yours.
        </p>

        {status === "success" ? (
          <p
            role="status"
            className="type-body mx-auto mt-7 max-w-[36ch] text-[var(--label)]"
          >
            You are on the list. We will be in touch before the season starts.
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mx-auto mt-7 flex w-full max-w-[420px] flex-col gap-2.5 sm:flex-row"
          >
            <label htmlFor="waitlist-email" className="sr-only">
              Email address
            </label>
            <input
              id="waitlist-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="type-body min-w-0 flex-1 rounded-pill border border-[var(--separator)] bg-[var(--bg)] px-5 py-3 text-[var(--label)] placeholder:text-[var(--label-4)]"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="type-body rounded-pill bg-[var(--link)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--link-hover)] disabled:opacity-60"
            >
              {status === "loading" ? "Joining…" : "Join the list"}
            </button>
          </form>
        )}

        {status === "error" ? (
          <p role="alert" className="type-callout mt-3 text-[var(--piste-red)]">
            {error}
          </p>
        ) : null}
      </Container>
    </SectionScheme>
  );
}
