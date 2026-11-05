// "Charted on Jersey Club Radio" badge for producers, as an SVG. Used by the producer
// page (preview + PNG download) and by the build, which writes /badges/<slug>.svg so
// producers can embed it on their own sites (each embed links back to their producer page).
import { SITE_URL, formatWeek } from './chartUtils.mjs';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Best (lowest) chart position across all of a producer's tracks, and the week it happened */
export function bestPeak(history) {
  let best = null;
  for (const t of history.tracks) for (const w of t.weeks) {
    if (!best || w.rank < best.rank || (w.rank === best.rank && w.week > best.week)) best = { rank: w.rank, week: w.week, title: t.title };
  }
  return best;
}

export const BADGE_W = 600;
export const BADGE_H = 200;

/** Badge SVG: producer name, peak position and week. Self-contained (no external fonts/images). */
export function badgeSvg({ name, rank, week }) {
  const n = String(name);
  const nameSize = n.length > 22 ? 26 : n.length > 16 ? 32 : 38;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BADGE_W}" height="${BADGE_H}" viewBox="0 0 ${BADGE_W} ${BADGE_H}" role="img" aria-label="${esc(`${n}: Rising Now #${rank} on Jersey Club Radio, week of ${formatWeek(week)}`)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9D00FF"/><stop offset="1" stop-color="#FF0080"/></linearGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140B28"/><stop offset="1" stop-color="#06000F"/></linearGradient>
  </defs>
  <rect x="1.5" y="1.5" width="${BADGE_W - 3}" height="${BADGE_H - 3}" rx="22" fill="url(#bg)" stroke="url(#g)" stroke-width="3"/>
  <rect x="24" y="24" width="152" height="152" rx="18" fill="url(#g)"/>
  <text x="100" y="78" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="#fff" letter-spacing="2">PEAK</text>
  <text x="100" y="146" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${rank >= 10 ? 64 : 76}" font-weight="900" fill="#fff">#${rank}</text>
  <text x="204" y="50" font-family="Inter, Arial, Helvetica, sans-serif" font-size="16" font-weight="800" fill="#FF3399" letter-spacing="3">RISING NOW CHART</text>
  <text x="204" y="${92 + (38 - nameSize) / 3}" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${nameSize}" font-weight="900" fill="#ffffff">${esc(n)}</text>
  <text x="204" y="128" font-family="Inter, Arial, Helvetica, sans-serif" font-size="18" fill="#C9BFDB">Week of ${esc(formatWeek(week))}</text>
  <text x="204" y="166" font-family="Inter, Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="#C77DFF">Charted on jerseyclubradio.com</text>
</svg>`;
}

/** HTML a producer can paste on their site; the badge links back to their producer page */
export function badgeEmbed(slug, name, rank) {
  return `<a href="${SITE_URL}/producers/${slug}"><img src="${SITE_URL}/badges/${slug}.svg" alt="${esc(name)}: Rising Now #${rank} on Jersey Club Radio" width="300" height="100"></a>`;
}
