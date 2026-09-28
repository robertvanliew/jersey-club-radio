# Rising Now: weekly viral chart

**Date:** 2026-09-28
**Status:** Draft for review
**Source:** the owner's brief (pasted 2026-09-28), refined in design review.

## Goal

A weekly, owner-curated chart of the hottest new Jersey club tracks, with evidence for why each one is rising. It appears on the homepage under the Jersey Club Playlist and has its own pages, and it must be fully readable by Google and AI crawlers (real HTML, structured data, sitemap).

### Success criteria

- `curl https://jerseyclubradio.com/hot` (no JavaScript) returns HTML containing every rank, title, artist, producer and signal note of the current week, plus the page's own `<title>`, meta description, canonical URL and JSON-LD.
- The same holds for every `/hot/:date`, `/hot/archive` and `/producers/:slug`.
- JSON-LD passes validator.schema.org with no errors. (Google's Rich Results Test is not a pass/fail signal here: Google has no rich result type for music playlists, so it reports "no rich results" even for valid markup.)
- Every chart and producer URL is in `sitemap.xml`. `robots.txt` allows Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot and Google-Extended.
- The homepage section renders at 375 px wide with no horizontal scroll.
- Publishing a week = add one JSON file and push.
- The homepage reaches the browser `load` event and automation "idle" without waiting on audio, and no audio stream is requested before the visitor presses Tune In or Play.

### Out of scope

- Changing the Jersey Club Playlist, the TOP SONGS sidebar, or player behavior beyond sections 5 and 6.
- Any paid service. (Reactions use the existing Supabase backend.)
- Automatic chart generation; the chart is hand-curated. Reaction counts are only exposed as a signal.

## Context (current code)

- React 18 + Vite 6, React Router 7 in library mode (`createBrowserRouter` in `src/app/routes.ts`), mounted with `createRoot` in `src/main.tsx`. Pages are lazy-loaded.
- `index.html` hard-codes the homepage `<title>`, description, canonical (`https://jerseyclubradio.com/`), og tags and four JSON-LD blocks, and has an empty `<div id="root">` plus a `<noscript>` fallback.
- `public/robots.txt` already allows all crawlers (`User-agent: *` Allow), listing GPTBot, Claude-Web, Googlebot, Bingbot, PerplexityBot and Applebot, but not ClaudeBot or Google-Extended. `public/sitemap.xml` is hand-written.
- **jerseyclubradio.com currently fails the TLS handshake** (it still points at Figma hosting). Nothing on the domain is reachable by people or crawlers until DNS points at Vercel (A `@` → 76.76.21.21, CNAME `www` → cname.vercel-dns.com). This is a prerequisite for the SEO goals.
- Vercel serves files that exist in `dist/` before applying the SPA rewrite in `vercel.json`.

## Design

### 1. Data

- One file per week: `src/data/charts/YYYY-MM-DD.json` (the week's Monday).
- `src/data/charts/index.ts` loads them all with `import.meta.glob('./*.json', { eager: true })` and exports:
  - `allWeeks(): string[]`: dates, newest first
  - `latestWeek(today = new Date()): string`: newest date ≤ today
  - `getChart(date): Chart | undefined`, `prevWeek(date)`, `nextWeek(date)`
  - `producerSlug(name)`, `chartsByProducer(slug)`: every charted entry for a producer, across weeks
- Types (`src/data/charts/types.ts`):

```ts
interface ChartEntry {
  rank: number; title: string; artist: string; producer: string;
  originalSample?: string; bpm: number; key: string; releaseDate: string; // YYYY-MM-DD
  lastWeekRank: number | null; weeksOnChart: number;
  signal: { type: 'tiktok' | 'listeners' | 'new'; note: string; url?: string };
  links: { soundcloud?: string; bandcamp?: string; spotify?: string; youtube?: string };
  artwork?: string;
}
interface Chart { week: string; placeholder?: boolean; entries: ChartEntry[] } // entries sorted by rank, 20 per week
```

- Seed: one week (`2026-09-28.json`) with 20 clearly placeholder entries ("Placeholder Track 1" and so on). A second, earlier seed week is included so movement, archive and prev/next are exercised; the owner replaces both.
- A chart file may set `"placeholder": true` (both seed weeks do). **Placeholder weeks are excluded from production builds**: `import.meta.env.PROD` filters them out of `allWeeks()`, so with only seed data the homepage section is hidden, `/hot` shows "First chart coming soon", and nothing is prerendered or added to the sitemap. In dev (`npm run dev`) and in tests they are included. Removing the flag (or adding a real week) publishes.
- A unit-tested validator (`validateChart`) runs in the prerender step and fails the build on a bad file: duplicate or missing ranks, a missing required field, a bad date, a `lastWeekRank` outside 1–20, or `weeksOnChart < 1`.

### 2. Movement rules

`movement(entry)` → `{ kind: 'new' } | { kind: 'breakout', by } | { kind: 'up', by } | { kind: 'down', by } | { kind: 'same' }`:
- `lastWeekRank === null` → **NEW**
- climbed ≥ 5 places → **🔥 BREAKOUT** (+by)
- climbed 1–4 → ▲by; fell → ▼by; unchanged → –

### 3. UI

- `RisingNowRow`: rank · movement · artwork (fallback: site logo) · title / artist · "prod. {producer}" (links to `/producers/:slug`) · BPM chip · key chip · signal icon + one-line note (links to `signal.url` when present) · outbound link icons for present links only. At < 640 px the row wraps to two lines; nothing overflows at 375 px.
- `RisingNowSection` (homepage, directly under the Jersey Club Playlist in `src/app/pages/Home.tsx`): heading "Rising Now", subhead "Week of {Month D, YYYY}", top 10 rows, "Full chart →" link to `/hot`. Styling matches the playlist card (same card background, border, heading font and row spacing).
- `ChartPage` (`/hot`, `/hot/:date`): heading, week subhead, all 20 rows, prev/next week navigation, link to the archive. An unknown date shows a "no chart for that week" message with a link to `/hot`.
- `ChartArchivePage` (`/hot/archive`): every week, newest first, each showing its #1.
- `ProducerPage` (`/producers/:slug`): producer name and every charted track (title, artist, best rank, weeks charted, week links). An unknown slug shows a not-found message.
- These pages are routes inside the existing app layout (`Root`), so the player and nav stay.
- Client-side head management: a small `useHead({ title, description, canonical, jsonLd })` hook sets the tags when navigating within the app, and restores the homepage values on unmount.

### 4. Prerendering and SEO

- **Approach: custom post-build prerender** (chosen over vite-react-ssg and React Router framework mode, both of which would require server-rendering the whole app, including the browser-only audio player).
- `src/prerender/entry-server.tsx` exports `render(url): { html, head }` that renders **only** the chart/producer page components (not `Root`, the player or other pages) inside a `StaticRouter`, using the same components as the client.
- `scripts/prerender.mjs` runs after `vite build`:
  1. builds `entry-server.tsx` with Vite in SSR mode into a temp dir;
  2. for every URL (`/hot`, `/hot/archive`, `/hot/<each week>`, `/producers/<each slug>`), renders it and writes `dist/<url>/index.html` from `dist/index.html`, replacing `<title>`, meta description, canonical, `og:url`/`og:title`/`og:description`, adding the page's JSON-LD, and putting the rendered HTML inside `<div id="root">`;
  3. regenerates `dist/sitemap.xml` = the static entries from `public/sitemap.xml` + every chart and producer URL (`lastmod` = the week date).
- `package.json` `build` becomes `vite build && node scripts/prerender.mjs`.
- The client keeps using `createRoot`, so the app replaces the prerendered markup on load (no hydration mismatch risk; crawlers still get full HTML).
- **Titles:** "Rising Now: Jersey Club Chart, Week of Sept 28, 2026 | Jersey Club Radio"; archive: "Rising Now Chart Archive | Jersey Club Radio"; producer: "{Producer}: Jersey Club Producer Chart History | Jersey Club Radio". Descriptions summarize the top 3.
- **Canonical:** `https://jerseyclubradio.com{path}`. `/hot` is canonical to itself (the current week); each `/hot/:date` is canonical to itself.
- **JSON-LD:** chart pages get `MusicPlaylist` (name, url, numTracks, datePublished) whose `track` is an `ItemList` of `ListItem` (position) → `MusicRecording` (name, byArtist `MusicGroup`, producer `Person`, datePublished, url, sameAs = links). Producer pages get `Person` + `ItemList` of `MusicRecording`.
- `public/robots.txt`: keep all existing rules; add `ClaudeBot` and `Google-Extended` allow blocks.
- **Weekly publish:** `.github/workflows/weekly-rebuild.yml` (Mondays 10:00 UTC and manual) calls a Vercel Deploy Hook URL stored as the repo secret `VERCEL_DEPLOY_HOOK`, so a chart committed early goes live on its Monday. Free.

### 5. 🔥 Listener reactions (behind a flag, off)

- Flag: `FEATURES.reactions` in `src/app/config/features.ts`, set from `import.meta.env.VITE_FEATURE_REACTIONS === 'true'`. Off unless that env var is set in Vercel.
- UI: a 🔥 button next to the now-playing controls in `Player.tsx`, rendered only when the flag is on. It shows a burst animation and disables for that track after one tap (remembered per track per week in localStorage).
- Server (existing Supabase function):
  - `POST /reactions` body `{ videoId }` → increments the count for `(isoWeek, videoId)` in KV key `jc_reactions_<YYYY-Www>`; rate limit per IP: 1 per track per 6 h and 30 per hour overall (KV key `jc_react_rl_<hash(ip)>`, hashed and never stored raw). Returns `{ ok, count }` or 429.
  - `GET /reactions/week?week=YYYY-Www` → `{ week, counts: { videoId: n } }`, sorted descending, for the owner to use as a chart signal.
- Deployed with the Supabase CLI (already logged in on the dev machine).

### 6. Page-load fix

- Investigate first: measure `load` event time, first idle, and pending network requests at load on the live homepage (before), recording which requests keep the page from going idle.
- Expected changes (confirmed by the measurement):
  - The radio does not sync or request a stream on page load. The first Tune In / Play press syncs with the station clock and starts playback (a user gesture, so autoplay rules are satisfied).
  - The hidden SoundCloud widget and YouTube iframe players, and their API scripts, are created after the window `load` event, not during first render.
- Measure again (after) and report the before/after numbers. Nothing else about the player changes.

## Testing

- **Unit (Vitest):** `movement`, `latestWeek` / prev / next / `allWeeks`, `producerSlug`, `chartsByProducer`, `validateChart` (every rejection rule), JSON-LD builders (shape and required fields), sitemap URL list, reaction week key and rate-limit logic.
- **Prerender check:** after `npm run build`, a script asserts that `dist/hot/index.html` contains all 20 titles, the right `<title>`, canonical and JSON-LD, and the same for one archive week and one producer page, plus that `dist/sitemap.xml` lists them.
- **Browser (Playwright):**
  - homepage section at 375 px (no horizontal scroll, top 10, link to /hot);
  - `/hot` prev/next navigation;
  - `/producers/:slug`;
  - with the reactions flag on in dev: 🔥 tap → count increments, second tap is blocked;
  - page-load: no `sc-stream` request before Tune In; the `load` event fires and the page goes idle.
- **Schema:** paste one chart page's JSON-LD into validator.schema.org: 0 errors.

## Deliverables

Components, routes, data and seed, prerender script, JSON-LD, sitemap and robots updates, reactions (UI + endpoints, flag off), page-load fix, weekly rebuild workflow, and a README section "How to publish a new week".

## Risks

- **The domain is down** until DNS moves to Vercel; the SEO results depend on it.
- **Placeholder data:** handled by the `placeholder` flag (§1). Shipping with only seed data publishes nothing chart-related; the section appears when the first real week is pushed.
- Prerendered HTML is replaced, not hydrated, on load: a brief re-render flash on chart pages. Acceptable; it can be revisited if noticeable.
