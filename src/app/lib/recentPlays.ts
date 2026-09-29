// "No repeats": remember the songs a listener recently heard, and pick the next track so a
// song that just played never comes straight back. Pure functions; PlayerContext persists
// the list in localStorage so it also holds across a page refresh.

export type RecentPlays = { id: string; at: number }[];

/** How long a finished song stays off the next-up list */
export const RECENT_WINDOW_MS = 3 * 60 * 60 * 1000;
export const RECENT_MAX = 20;

/** Record that `id` just finished playing (most recent last) */
export function addRecent(list: RecentPlays, id: string, now = Date.now()): RecentPlays {
  return [...list.filter(p => p.id !== id && now - p.at < RECENT_WINDOW_MS), { id, at: now }].slice(-RECENT_MAX);
}

/** Songs to avoid picking next: the recent ones, capped at `limit` so a short playlist never runs dry */
export function recentIds(list: RecentPlays, limit = RECENT_MAX, now = Date.now()): Set<string> {
  const live = list.filter(p => now - p.at < RECENT_WINDOW_MS);
  return new Set(live.slice(-Math.max(0, limit)).map(p => p.id));
}

/** Parse a stored list, dropping anything malformed */
export function parseRecent(raw: string | null): RecentPlays {
  try {
    const v = JSON.parse(raw || '[]');
    return Array.isArray(v) ? v.filter(p => p && typeof p.id === 'string' && typeof p.at === 'number').slice(-RECENT_MAX) : [];
  } catch {
    return [];
  }
}

/**
 * Index of the track to play after `from`. Never returns `from` itself or a recently played
 * song while any other playable track exists. Sequential order by default; random with `shuffle`.
 */
export function pickNextIndex(
  ids: string[],
  from: number,
  { playable = () => true, avoid = new Set<string>(), shuffle = false, random = Math.random }:
    { playable?: (i: number) => boolean; avoid?: Set<string>; shuffle?: boolean; random?: () => number } = {},
): number {
  const n = ids.length;
  if (!n) return 0;
  const order = Array.from({ length: n - 1 }, (_, k) => (from + 1 + k + n) % n);
  const fresh = order.filter(i => playable(i) && !avoid.has(ids[i]));
  const okay = order.filter(i => playable(i));
  const pool = fresh.length ? fresh : okay;
  if (!pool.length) return n === 1 ? 0 : (from + 1) % n;
  return shuffle ? pool[Math.floor(random() * pool.length)] : pool[0];
}
