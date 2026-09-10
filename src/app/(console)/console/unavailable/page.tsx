/**
 * Rendered when the console is deployed to production without Supabase
 * credentials. Failing closed with an explanation beats either falling back to
 * open access or returning an opaque 500.
 */
export default function ConsoleUnavailablePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-[46ch] space-y-2">
        <h1 className="text-[17px] font-semibold">Console unavailable</h1>
        <p className="text-[13px] text-[var(--label-2)]">
          Authentication is not configured on this deployment, so the console has refused to
          start rather than run unauthenticated.
        </p>
        <p className="text-[12px] text-[var(--label-3)]">
          Set <code>SUPABASE_URL</code>, <code>SUPABASE_PUBLISHABLE_KEY</code> and{" "}
          <code>CONSOLE_ALLOWED_EMAILS</code>, then redeploy.
        </p>
      </div>
    </div>
  );
}
