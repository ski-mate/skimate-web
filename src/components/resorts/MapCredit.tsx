/**
 * Map attribution, as page content.
 *
 * The resort heroes sit a map behind a heavy dark scrim, which left MapLibre's
 * own attribution control unreadable and — because the wrapper is aria-hidden —
 * unreachable. MapTiler and OpenStreetMap both require the credit to be shown,
 * so it is rendered here above the scrim, where it can actually be read and
 * followed.
 */
export function MapCredit({ className = "" }: { className?: string }) {
  return (
    <p
      className={`type-caption text-[var(--label-3)] ${className}`}
    >
      Map data{" "}
      <a
        href="https://www.maptiler.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-[var(--label)]"
      >
        © MapTiler
      </a>{" "}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-[var(--label)]"
      >
        © OpenStreetMap contributors
      </a>
    </p>
  );
}
