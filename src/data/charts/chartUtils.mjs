// Rising Now chart helpers — plain JS so both the app (via Vite) and the build-time
// page generator (scripts/prerender-charts.mjs, plain Node) share one implementation.

export const SITE_URL = 'https://jerseyclubradio.com';

/**
 * Movement vs last week.
 * @param {{ rank: number, lastWeekRank: number | null }} e
 * @returns {{ kind: 'new' } | { kind: 'breakout' | 'up' | 'down', by: number } | { kind: 'same' }}
 */
export function movement(e) {
  if (e.lastWeekRank == null) return { kind: 'new' };
  const by = e.lastWeekRank - e.rank;
  if (by >= 5) return { kind: 'breakout', by };
  if (by > 0) return { kind: 'up', by };
  if (by < 0) return { kind: 'down', by: -by };
  return { kind: 'same' };
}

/** "DJ Sliink" -> "dj-sliink" */
export function producerSlug(name) {
  return String(name).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** "2026-09-28" -> "Sept 28, 2026" */
export function formatWeek(date) {
  const [y, m, d] = date.split('-').map(Number);
  const months = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

/**
 * Weeks to publish, newest first: drops placeholder weeks (unless includePlaceholders)
 * and weeks dated after `today` (so a chart committed early goes live on its Monday).
 * @param {{ week: string, placeholder?: boolean }[]} charts
 */
export function publishedWeeks(charts, { today = new Date(), includePlaceholders = false } = {}) {
  const todayStr = today.toISOString().slice(0, 10);
  return charts
    .filter(c => (includePlaceholders || !c.placeholder) && c.week <= todayStr)
    .map(c => c.week)
    .sort()
    .reverse();
}

/** Neighbouring weeks in a newest-first list */
export function neighbours(weeks, week) {
  const i = weeks.indexOf(week);
  return { newer: i > 0 ? weeks[i - 1] : null, older: i >= 0 && i < weeks.length - 1 ? weeks[i + 1] : null };
}

/** Every charted entry for a producer across the given charts, grouped by track */
export function producerHistory(charts, slug) {
  const tracks = new Map();
  let name = null;
  for (const c of [...charts].sort((a, b) => a.week.localeCompare(b.week))) {
    for (const e of c.entries) {
      if (producerSlug(e.producer) !== slug) continue;
      name = e.producer;
      const key = `${e.title}|${e.artist}`;
      const t = tracks.get(key) ?? { title: e.title, artist: e.artist, links: e.links, bestRank: e.rank, weeks: [] };
      t.bestRank = Math.min(t.bestRank, e.rank);
      t.weeks.push({ week: c.week, rank: e.rank });
      tracks.set(key, t);
    }
  }
  return name ? { name, tracks: [...tracks.values()].sort((a, b) => a.bestRank - b.bestRank) } : null;
}

/** Returns a list of problems with a chart file (empty = valid) */
export function validateChart(c) {
  const errs = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.week ?? '')) errs.push(`bad week "${c.week}"`);
  const ranks = (c.entries ?? []).map(e => e.rank).sort((a, b) => a - b);
  if (!ranks.length || ranks.some((r, i) => r !== i + 1)) errs.push('ranks must be 1..N with no gaps or duplicates');
  for (const e of c.entries ?? []) {
    for (const f of ['title', 'artist', 'producer', 'releaseDate']) if (!e[f]) errs.push(`#${e.rank}: missing ${f}`);
    // bpm and key are optional (SoundCloud doesn't provide them); validate when present
    if (e.bpm != null && !(e.bpm > 0)) errs.push(`#${e.rank}: bad bpm`);
    if (e.lastWeekRank != null && !(e.lastWeekRank >= 1)) errs.push(`#${e.rank}: bad lastWeekRank`);
    if (!(e.weeksOnChart >= 1)) errs.push(`#${e.rank}: weeksOnChart must be >= 1`);
    if (!['tiktok', 'listeners', 'new'].includes(e.signal?.type)) errs.push(`#${e.rank}: signal.type must be tiktok|listeners|new`);
  }
  return errs;
}

/** schema.org JSON-LD for a chart page */
export function chartJsonLd(chart, path) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: `Rising Now: Jersey Club Chart, Week of ${formatWeek(chart.week)}`,
    url: SITE_URL + path,
    datePublished: chart.week,
    numTracks: chart.entries.length,
    publisher: { '@type': 'Organization', name: 'Jersey Club Radio', url: SITE_URL },
    track: {
      '@type': 'ItemList',
      numberOfItems: chart.entries.length,
      itemListElement: chart.entries.map(e => ({
        '@type': 'ListItem',
        position: e.rank,
        item: recordingLd(e),
      })),
    },
  };
}

/** schema.org JSON-LD for a producer page */
export function producerJsonLd(history, path) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: history.name,
    url: SITE_URL + path,
    jobTitle: 'Music producer',
    subjectOf: {
      '@type': 'ItemList',
      itemListElement: history.tracks.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: recordingLd({ ...t, producer: history.name }),
      })),
    },
  };
}

function recordingLd(e) {
  const links = Object.values(e.links ?? {}).filter(Boolean);
  return {
    '@type': 'MusicRecording',
    name: e.title,
    byArtist: { '@type': 'MusicGroup', name: e.artist },
    producer: { '@type': 'Person', name: e.producer },
    ...(e.releaseDate ? { datePublished: e.releaseDate } : {}),
    ...(links.length ? { url: links[0], sameAs: links } : {}),
  };
}
