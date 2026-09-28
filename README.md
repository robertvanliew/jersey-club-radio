
  # Jersey Club Radio 24/7

  This is a code bundle for Jersey Club Radio 24/7. The original project is available at https://www.figma.com/design/o6nqVvef9rwzgAm4UOXHNr/Jersey-Club-Radio-24-7.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

## How to publish a new week (Rising Now chart)

1. Copy the latest file in `src/data/charts/` to a new file named after the week's **Monday**, e.g. `src/data/charts/2026-10-05.json`, and set `"week"` to that date.
2. Fill in the 20 entries. Per track:
   - `rank`, `title`, `artist`, `producer` (the producer page URL is made from this name, so spell it the same way every week)
   - `originalSample` (optional, e.g. `"flip of Becky G - Shower"`), `bpm`, `key` (e.g. `"8A"`), `releaseDate` (`YYYY-MM-DD`)
   - `lastWeekRank`: its rank last week, or `null` if it's new. Movement arrows, NEW and 🔥 BREAKOUT (up 5+ places) are worked out from this.
   - `weeksOnChart`
   - `signal`: `{ "type": "tiktok" | "listeners" | "new", "note": "one line of evidence", "url": "optional link" }`
   - `links`: any of `soundcloud`, `bandcamp`, `spotify`, `youtube`; `artwork` (optional image URL)
3. Remove `"placeholder": true` if it's there. Placeholder weeks show only in `npm run dev`, never on the live site.
4. Check it: `npm test` (validates every chart file) and `npm run dev`, then open http://localhost:5173/hot.
5. Commit and push. Vercel rebuilds; the build generates the crawler-readable pages (`/hot`, `/hot/<week>`, `/hot/archive`, `/producers/<name>`) and updates `sitemap.xml`.

A week dated in the future isn't published until its date **and** the next build. If you commit early, push again (or redeploy in Vercel) on Monday.

The seed files `2026-09-21.json` and `2026-09-28.json` are placeholders: replace or delete them when you add real weeks.
  