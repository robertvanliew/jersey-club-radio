#!/usr/bin/env node
// Drafts this week's Rising Now chart from SoundCloud growth.
// Run weekly by .github/workflows/draft-chart.yml, which opens the result as a pull
// request for review (add TikTok notes, remove non-Jersey-club picks, then merge).
//
//   node scripts/draft-chart.mjs [--week YYYY-MM-DD] [--dry-run] [--force]
//
// How tracks are ranked:
//   - candidates: SoundCloud search for Jersey club uploads from the last month
//   - every candidate's play count is saved to data/chart-snapshots/<week>.json
//   - score = plays gained since last week's snapshot; for tracks without one, plays
//     per week since release (first week of this job, or brand-new uploads)
// Plain Node (no npm packages) so the workflow needs no install step.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { validateChart } from '../src/data/charts/chartUtils.mjs';
import { plain, cleanTitle } from './chartClean.mjs';

const { values: args } = parseArgs({
  options: { week: { type: 'string' }, 'dry-run': { type: 'boolean', default: false }, force: { type: 'boolean', default: false } },
});

const CHART_DIR = 'src/data/charts';
const SNAP_DIR = 'data/chart-snapshots';
const SIZE = 20;
const MAX_PER_ARTIST = 2;
// Core Jersey club scene (artists, producers, crews). Their uploads rank ×SCENE_BOOST.
const SCENE_BOOST = 3;
const SCENE = [
  'dj ?sliink', 'uniiqu3', 'dj ?jayhood', 'dj ?tameil', 'dj ?lil ?man', 'dj ?taj', 'bandmanrill', 'dj ?smallz', 'mike ?gip',
  'sjayy', 'kayy ?drizz', 'cookiee ?kawaii', 'mcvertt', 'brick ?bandits', 'jersey ?club ?kings', 'dj ?fade', 'dj ?frosty',
  'dj ?problem', 'tim ?dolla', 'dj ?jubilee', 'nadus', 'r3ll', 'dj ?k-?shine', 'dj ?blizz', 'unicorn151', 'acemula', 'dj ?loki',
  'ms\\.? ?porsh', 'wiztv', 'tricks', 'dj ?irresistible', 'jnice', 'dj ?big ?o', 'kiaBHN', 'mvntana', 'dj ?salute', 'jiddy',
].map(s => new RegExp(`(^|[^a-z])${s}([^a-z]|$)`, 'i'));
const QUERIES = ['jersey club', 'jerseyclub', 'jersey club remix'];
const PAGES_PER_QUERY = 3;
const DAY = 864e5;
const UA = { 'User-Agent': 'Mozilla/5.0 (JerseyClubRadio chart bot)' };

/** Monday (UTC) of the week containing `d`, as YYYY-MM-DD */
const mondayOf = d => { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
const week = args.week ?? mondayOf(new Date());
const now = Date.now();
const k = n => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n));
const fmtDate = s => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const outFile = `${CHART_DIR}/${week}.json`;
if (existsSync(outFile) && !args.force && !JSON.parse(readFileSync(outFile, 'utf8')).placeholder) {
  console.error(`[draft] ${outFile} already exists (not a placeholder); use --force to overwrite`);
  process.exit(1);
}

// ── SoundCloud ────────────────────────────────────────────────────────────────
async function clientId() {
  const home = await (await fetch('https://soundcloud.com', { headers: UA })).text();
  const scripts = [...home.matchAll(/https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js/g)].map(m => m[0]).reverse();
  for (const s of scripts.slice(0, 10)) {
    const m = (await (await fetch(s, { headers: UA })).text()).match(/client_id\s*[:=]\s*"([a-zA-Z0-9]{32})"/);
    if (m) return m[1];
  }
  throw new Error('could not find a SoundCloud client_id');
}

async function searchRecent(cid) {
  const found = new Map();
  for (const q of QUERIES) {
    let url = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(q)}&filter.created_at=last_month&limit=200&client_id=${cid}`;
    for (let page = 0; page < PAGES_PER_QUERY && url; page++) {
      const r = await fetch(url, { headers: UA });
      if (!r.ok) { console.warn(`[draft] search "${q}" page ${page + 1}: HTTP ${r.status}`); break; }
      const d = await r.json();
      for (const t of d.collection ?? []) found.set(t.id, t);
      url = d.next_href ? `${d.next_href}&client_id=${cid}` : null;
    }
  }
  return [...found.values()];
}



const isCandidate = t => {
  const text = plain(`${t.title} ${t.genre ?? ''} ${t.tag_list ?? ''}`);
  return /jersey/i.test(text)
    && !/slowed|reverb|sped[\s-]?up|nightcore/i.test(plain(t.title))   // edits, not club-tempo tracks
    && t.duration > 60_000
    && t.playback_count > 0
    && now - Date.parse(t.created_at) < 35 * DAY;
};

// Who made this version: "(X Jersey Club Remix/Edit/Flip)" in the title, then "prod. X",
// then the uploader. Never the label metadata artist: on a remix that is the ORIGINAL
// artist (it credited "IS THERE SOMEONE ELSE (… JERSEY CLUB EDIT)" to The Weeknd).
const producerOf = t => {
  const title = plain(t.title);
  const remix = title.match(/[(\[]\s*([^()[\]]{2,40}?)\s+(?:jersey\s*club\s+)?(?:remix|rmx|edit|flip|bootleg|blend|mix)\s*[)\]]/i);
  const remixer = remix?.[1]?.replace(/\b(?:jersey\s*club|the|official)\b/gi, '').trim();
  // ...unless the "remixer" is just a genre or version word: "(Jersey Remix)", "(Extended Mix)"
  if (remixer && remixer.length >= 2 && !/^\d+$/.test(remixer) && !/^(jersey|club|jersey ?club|official|extended|radio|original|vip)$/i.test(remixer)) return firstName(remixer);
  // "prod" must start a word (not "theproducer1.bandcamp.com") and not be the word "producer"
  const m = `${title}\n${plain(t.description)}`.match(/(?:^|[\s([@])prod(?!ucer|uction)(?:uced)?\.?\s*(?:by)?\s*[:\-]?\s*([A-Za-z0-9_$][^()[\]|,\n@#\-–—/]{0,30})/i);
  const name = m?.[1]?.trim().replace(/\s+/g, ' ').replace(/[.\s]+$/, '');
  return name && name.length >= 2 && !/\.(com|net|org)/i.test(name) ? name : firstName(plain(t.user?.username || artistOf(t)));
};
// On remixes/edits the label metadata artist is the original artist: show the uploader instead
const artistOf = t => plain((/remix|rmx|edit|flip|bootleg/i.test(plain(t.title)) ? null : t.publisher_metadata?.artist) || t.user?.username || 'Unknown').trim();
const firstName = s => s.split(/,| x | & /i)[0].trim().replace(/^@/, '').replace(/^prod\.?\s*(by\s*)?/i, '');
const artworkOf = t => (t.artwork_url || t.user?.avatar_url || '').replace('-large.', '-t500x500.') || undefined;

// ── Previous week (snapshot + published chart) ────────────────────────────────
const latestBefore = (dir, pred = () => true) => (existsSync(dir) ? readdirSync(dir) : [])
  .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f.slice(0, 10) < week)
  .sort().reverse()
  .map(f => ({ file: `${dir}/${f}`, data: JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')) }))
  .find(x => pred(x.data));
const prevSnap = latestBefore(SNAP_DIR);
const prevChart = latestBefore(CHART_DIR, c => !c.placeholder)?.data;
const prevBySc = new Map((prevChart?.entries ?? []).map(e => [e.links?.soundcloud, e]));

// ── Build ─────────────────────────────────────────────────────────────────────
const cid = await clientId();
const all = await searchRecent(cid);
const candidates = all.filter(isCandidate);
console.log(`[draft] week ${week}: ${all.length} recent search results, ${candidates.length} Jersey club candidates; previous snapshot: ${prevSnap?.file ?? 'none'}`);

// Days since the previous snapshot (more than 7 when a week was missed): gains are scaled to
// a per-week rate so they rank fairly against new uploads, and labelled with the real span
const prevWeek = prevSnap?.file.match(/(\d{4}-\d{2}-\d{2})\.json$/)?.[1];
const gapDays = prevWeek ? Math.max(1, (Date.parse(week) - Date.parse(prevWeek)) / DAY) : 7;

const scored = candidates.map(t => {
  const ageDays = Math.max(1, (now - Date.parse(t.created_at)) / DAY);
  const before = prevSnap?.data[t.id]?.plays;
  const gained = before != null ? Math.max(0, t.playback_count - before) : 0;
  const weekly = before != null ? Math.round(gained * 7 / gapDays) : Math.round(t.playback_count * 7 / Math.max(ageDays, 7));
  // Rank: plays growth, with a boost for the core Jersey club scene so the chart reflects the
  // genre's own artists and not only global meme edits that happen to be tagged #jerseyclub
  const scene = SCENE.some(re => re.test(plain(`${t.user?.username ?? ''} ${t.title} ${t.publisher_metadata?.artist ?? ''}`)));
  return { t, ageDays, before, gained, weekly, scene, score: weekly * (scene ? SCENE_BOOST : 1) };
}).sort((a, b) => b.score - a.score);

// One entry per song: viral sounds get re-edited many times ("wyw my sweetie" ×3)
const songKey = t => cleanTitle(t.title).toLowerCase()
  .replace(/^[^-–—]{1,40}\s[-–—]\s/, '')                    // "Artist - Song" → "Song"
  .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
  .replace(/jersey\s*club|remix|rmx|edit|flip|bootleg|mix|version|x\s/g, ' ')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .split(/\s+/).filter(Boolean).slice(0, 3).join(' ');

const perArtist = new Map();
const songs = new Set();
const picked = [];
for (const s of scored) {
  const a = artistOf(s.t).toLowerCase();
  const key = songKey(s.t);
  if ((perArtist.get(a) ?? 0) >= MAX_PER_ARTIST || (key && songs.has(key))) continue;
  perArtist.set(a, (perArtist.get(a) ?? 0) + 1);
  if (key) songs.add(key);
  picked.push(s);
  if (picked.length === SIZE) break;
}
console.log(`[draft] ${picked.filter(s => s.scene).length} of ${picked.length} picks are core-scene artists`);

const span = gapDays === 7 ? 'this week' : `since ${fmtDate(prevWeek)}`;
const entries = picked.map(({ t, ageDays, before, gained, weekly }, i) => {
  const url = t.permalink_url;
  const prev = prevBySc.get(url);
  const signal = ageDays <= 7
    ? { type: 'new', note: `Released ${fmtDate(t.created_at)}: ${k(t.playback_count)} plays in ${Math.ceil(ageDays)} day${ageDays > 1 ? 's' : ''}`, url }
    : before != null
      ? { type: 'listeners', note: `${k(gained)} plays ${span} (${k(before)} → ${k(t.playback_count)}${before > 0 ? `, +${Math.round((gained / before) * 100)}%` : ''})`, url }
      : { type: 'listeners', note: `~${k(weekly)} plays a week since release · ${k(t.likes_count ?? 0)} likes · ${k(t.reposts_count ?? 0)} reposts`, url };
  return {
    rank: i + 1,
    title: cleanTitle(t.title),
    artist: artistOf(t),
    producer: producerOf(t),
    releaseDate: (t.release_date || t.created_at).slice(0, 10),
    lastWeekRank: prev?.rank ?? null,
    weeksOnChart: (prev?.weeksOnChart ?? 0) + 1,
    signal,
    links: { soundcloud: url },
    ...(artworkOf(t) ? { artwork: artworkOf(t) } : {}),
  };
});

const chart = { week, source: 'soundcloud-auto-draft', entries };
const problems = validateChart(chart);
if (problems.length) { console.error('[draft] generated chart is invalid:\n  - ' + problems.join('\n  - ')); process.exit(1); }

const snapshot = Object.fromEntries(candidates.map(t => [t.id, { plays: t.playback_count, likes: t.likes_count ?? 0, reposts: t.reposts_count ?? 0, url: t.permalink_url }]));

for (const e of entries) console.log(`  #${String(e.rank).padStart(2)} ${e.lastWeekRank == null ? 'NEW' : `(was ${e.lastWeekRank})`}  ${e.title.slice(0, 55)} — ${e.artist}  | ${e.signal.note}`);
if (args['dry-run']) { console.log('[draft] dry run: nothing written'); process.exit(0); }

mkdirSync(SNAP_DIR, { recursive: true });
writeFileSync(`${SNAP_DIR}/${week}.json`, JSON.stringify(snapshot) + '\n');
writeFileSync(outFile, JSON.stringify(chart, null, 2) + '\n');
console.log(`[draft] wrote ${outFile} (${entries.length} tracks) and ${SNAP_DIR}/${week}.json (${candidates.length} tracks)`);
