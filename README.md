# alpline-web

The marketing site for [Alpline](https://getalpline.com) — ski navigation,
tracking and group coordination. Next.js 14 App Router, deployed on Vercel.

## Running it

```bash
npm ci
npm run dev          # http://localhost:3000
```

CI runs exactly four commands, and so should you before pushing:

```bash
npm ci && npm run lint && npx tsc --noEmit && npm run build
```

There is no test script. The type checker is the test suite: content modules
assert their own integrity at module scope, so a broken guide article, a
missing resort field or a bad figure reference fails `next build` rather than
rendering a broken page.

### Environment

Copy `.env.example` to `.env.local`:

| Variable | Needed for |
|---|---|
| `NEXT_PUBLIC_MAPTILER_API_KEY` | `/map` and the maps on `/resorts`. Must be a **domain-restricted public key** — never the backend's server key, which is not safe to ship to a browser. |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | The email signup route only. Server-side: the secret key bypasses RLS, so it must never carry a `NEXT_PUBLIC_` prefix. See `EMAIL_SIGNUP_SETUP.md`. |

Without the MapTiler key the map surfaces render an explanatory placeholder
instead of failing.

## How the site is put together

### Design language

The site is deliberately modelled on apple.com's layout system — 44px
translucent nav, full-bleed alternating light/dark tiles, a 980px content
column inside a 1440px page, and Apple's real breakpoints (1440 / 1069 / 735 /
320). The copy, imagery and branding are Alpline's own.

```
src/styles/tokens.css   colour, radius, material, spacing tokens
src/styles/type.css     the web display ramp (plain CSS classes, not @layer)
src/lib/apple-tokens.ts TS mirror for framer springs and canvas rendering
tailwind.config.ts      maps Tailwind names onto the CSS custom properties
```

Two colour namespaces, deliberately separate: unprefixed tokens are the
**marketing** palette (apple.com's web chrome), and `--ios-*` is the **iOS
system** palette, used only inside device frames and the map. Mixing them is
the fastest way to make the site look wrong.

**Colour scheme is per-section, with no toggle and no `next-themes`.**
`<html data-scheme="auto">` follows the OS; a marketing tile pins its own
scheme with `<SectionScheme scheme="dark">`, which redefines the tokens on that
element. So a dark tile stays dark under a light OS, exactly as apple.com
behaves — with no theme flash and no hydration mismatch.

`/style` (noindex, excluded from the sitemap) renders every primitive in both
schemes. It is the visual QA surface; check changes there first.

### Content

All copy lives in typed modules under `src/content/`, never inline in
components:

```
site.ts  nav.ts  home.ts  faq.ts  pricing.ts  features.ts  media.ts
guide/   types.ts, manifest.ts, articles/*.ts
resorts/ types.ts, data.ts (GENERATED), index.ts
```

`guide/index.ts` and `resorts/index.ts` call an `assert*Integrity()` function at
module scope. Duplicate slugs, a `seeAlso` pointing at an unpublished article, a
figure reference with no figure, an empty `alt`, a title over 60 characters or a
description outside 150–160 all fail the build.

**Resort data is generated.** Do not edit `src/content/resorts/data.ts` by hand:

```bash
node scripts/build-resorts.mjs
```

### The honesty rule

Most of what Alpline will do is not built yet. Every capability carries a
`status: "shipping" | "soon"`, and anything not shipping renders a visible
"Coming soon" badge. A claim may only be `shipping` if it traces to a checked
row in `alpline-admin/FEATURES-ACCESS-AND-MONETIZATION.md` §5.

The same rule governs the resort directory: only the resorts whose piste and
lift networks have actually been ingested are marked available, and only those
get a page. The rest are listed as catalogued.

### Imagery

Two kinds, and they are not interchangeable:

- **`media`** — real screenshots of the shipped app, shown inside a
  `DeviceFrame`. The only thing allowed to illustrate a product claim.
- **`photo`** — generated alpine photography, used as atmosphere. Never
  permitted to stand in for an interface, because an invented screenshot is a
  false claim about what the app does.

To add an image, encode it and paste the printed literal into a content module:

```bash
node scripts/encode-media.mjs ~/shot.png media/home/thing.webp 2000
```

It writes the WebP into `public/` and prints a real 16px `blurDataURL`. This is
a one-shot CLI rather than a build step, because images are committed.

## Routes

```
/                     homepage
/features             index + 8 areas at /features/[slug]
/pricing              Free vs Alpline Pro
/resorts              world map + directory; /resorts/[slug] for mapped resorts
/guide                8 sections; /guide/[section]/[article] for published ones
/map                  the Atlas — an interactive globe of every catalogued resort
/privacy  /terms      legal
/style                internal, noindex
/api/email-signup     POST, writes to Supabase
```

Every dynamic route sets `dynamicParams = false`, so an unknown slug 404s at
build time instead of rendering an empty page.

### /map

The Atlas is a MapTiler globe with the resort catalogue plotted on it, and
filter, ranking and listing panels arranged around it. `src/lib/map/
cartography.ts` repaints MapTiler's `winter` style toward Apple Maps'
cartography — the stock style is a narrow band of high-saturation cyan — and
hides POI, transit and contour clutter. The ski network is the one thing left
vivid.

The SDK is ~600 kB, so it is dynamically imported with `ssr: false` and stays
out of every other route's bundle. `cooperativeGestures` is on: the map does
not swallow page scroll, and ⌘/Ctrl + scroll zooms.

MapTiler attribution is restyled, never removed. The licence requires it.

## Deployment

Vercel, region `iad1`. `main` is production.

`vercel.json` previously carried a catch-all rewrite (`/(.*) → /`) that
collapsed every route onto the landing page. It is gone; do not reintroduce it.
