import type { Metadata } from "next";
import "@/styles/console.css";

export const metadata: Metadata = {
  title: { default: "Ingestion Console", template: "%s — Ingestion Console" },
  // Internal tooling. Never indexed, never previewed, never followed.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The console never renders the marketing nav or footer — it is a different
 * product for a different person. All it shares with the site is the token
 * layer, which is why it still looks like Alpline.
 */
export default function ConsoleRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="console-root min-h-screen">{children}</div>;
}
