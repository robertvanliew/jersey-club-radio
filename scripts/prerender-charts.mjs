#!/usr/bin/env node
// Runs after `vite build`. Writes real HTML for the Rising Now chart pages so Google and
// AI crawlers can read them without JavaScript:
//   dist/hot/index.html, dist/hot/<week>/index.html, dist/hot/archive/index.html,
//   dist/producers/<slug>/index.html, and dist/sitemap.xml (static pages + chart pages).
// Each page gets its own <title>, description, canonical, Open Graph tags and JSON-LD, and
// the chart as plain HTML inside #root. In the browser the React app then takes over
// (createRoot replaces #root), so visitors get the normal interactive page.
// Vercel serves these files before the SPA rewrite in vercel.json.
//
// PRERENDER_PLACEHOLDERS=1 includes placeholder weeks (for testing only).
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  SITE_URL, movement, producerSlug, formatWeek, publishedWeeks, neighbours, producerHistory,
  validateChart, chartJsonLd, producerJsonLd,
} from '../src/data/charts/chartUtils.mjs';
import { publishedArticles, inlineSegments, articleJsonLd, shareLinks } from '../src/data/news/newsUtils.mjs';

const DIST = 'dist';
const CHART_DIR = 'src/data/charts';

// ── Load + validate chart data ────────────────────────────────────────────────
const charts = readdirSync(CHART_DIR).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .map(f => JSON.parse(readFileSync(join(CHART_DIR, f), 'utf8')));
let bad = false;
for (const c of charts) {
  const errs = validateChart(c);
  if (errs.length) { bad = true; console.error(`[prerender] ${c.week}.json:\n  - ${errs.join('\n  - ')}`); }
}
if (bad) process.exit(1);

const byWeek = new Map(charts.map(c => [c.week, c]));
const weeks = publishedWeeks(charts, { includePlaceholders: process.env.PRERENDER_PLACEHOLDERS === '1' });
const latest = weeks[0];
const published = weeks.map(w => byWeek.get(w));

// ── HTML helpers ──────────────────────────────────────────────────────────────
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const weekPath = w => (w === latest ? '/hot' : `/hot/${w}`);
const MOVE = e => {
  const m = movement(e);
  return m.kind === 'new' ? 'NEW' : m.kind === 'breakout' ? `🔥 BREAKOUT +${m.by}` : m.kind === 'up' ? `▲${m.by}` : m.kind === 'down' ? `▼${m.by}` : '–';
};
const LINKS = [['soundcloud', 'SoundCloud'], ['bandcamp', 'Bandcamp'], ['spotify', 'Spotify'], ['youtube', 'YouTube']];

const rowHtml = e => `
<li class="jc-row">
  <span class="jc-rank">${e.rank}</span><span class="jc-move">${esc(MOVE(e))}</span>
  <div class="jc-main">
    <strong>${esc(e.title)}</strong> — ${esc(e.artist)}<br>
    <small>prod. <a href="/producers/${producerSlug(e.producer)}">${esc(e.producer)}</a>${e.originalSample ? ` · ${esc(e.originalSample)}` : ''}
    ${e.bpm ? `· ${esc(e.bpm)} BPM ` : ''}${e.key ? `· ${esc(e.key)} ` : ''}· released ${esc(e.releaseDate)} · ${esc(e.weeksOnChart)} week${e.weeksOnChart === 1 ? '' : 's'} on chart${e.lastWeekRank ? ` · last week #${e.lastWeekRank}` : ''}</small><br>
    <small>Why it's rising: ${e.signal.url ? `<a href="${esc(e.signal.url)}" rel="nofollow noopener">${esc(e.signal.note)}</a>` : esc(e.signal.note)}</small>
    ${LINKS.filter(([k]) => e.links?.[k]).map(([k, n]) => `<a href="${esc(e.links[k])}" rel="noopener">${n}</a>`).join(' ')}
  </div>
</li>`;

const STYLE = `<style>.jc-static{max-width:760px;margin:0 auto;padding:24px 16px;color:#E8E0F5;font-family:system-ui,sans-serif;background:#06000F}
.jc-static a{color:#C080FF}.jc-static h1{color:#fff;font-size:1.6rem;margin:0 0 4px}.jc-static ol{list-style:none;padding:0}
.jc-row{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid rgba(157,0,255,.15)}.jc-rank{font-weight:900;font-size:1.2rem;color:#fff;width:28px}
.jc-move{font-size:.7rem;width:70px;color:#00FF88}.jc-main{flex:1;min-width:0;overflow-wrap:anywhere}.jc-main small{color:#9B8FB0}
.jc-nav{display:flex;justify-content:space-between;gap:8px;margin:12px 0;font-size:.85rem}</style>`;

const template = readFileSync(join(DIST, 'index.html'), 'utf8');

/** Fill the SPA shell with a page's head tags and static body */
function page({ path, title, description, jsonLd, body }) {
  const url = SITE_URL + path;
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    // Homepage-only content: the FAQ structured data and the "enable JavaScript" fallback
    .replace(/<script type="application\/ld\+json">(?:(?!<\/script>)[\s\S])*"FAQPage"[\s\S]*?<\/script>\s*/, '')
    .replace(/<!--[^>]*FAQPage[^>]*-->\s*/, '')
    .replace(/<noscript>[\s\S]*?<\/noscript>\s*/, '')
    .replace('</head>', `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>\n${STYLE}\n</head>`)
    .replace('<div id="root"></div>', `<div id="root"><main class="jc-static">${body}</main></div>`);
  const out = join(DIST, path, 'index.html');
  mkdirSync(join(DIST, path), { recursive: true });
  writeFileSync(out, html);
  return path;
}

// ── Pages ─────────────────────────────────────────────────────────────────────
const urls = [];
for (const chart of published) {
  const path = weekPath(chart.week);
  const { newer, older } = neighbours(weeks, chart.week);
  const top3 = chart.entries.slice(0, 3).map(e => `${e.title} by ${e.artist}`).join(', ');
  const nav = `<nav class="jc-nav">${older ? `<a href="${weekPath(older)}">← Week of ${formatWeek(older)}</a>` : '<span></span>'}<a href="/hot/archive">All weeks</a>${newer ? `<a href="${weekPath(newer)}">Week of ${formatWeek(newer)} →</a>` : '<span></span>'}</nav>`;
  urls.push({ path: page({
    path,
    title: `Rising Now: Jersey Club Chart, Week of ${formatWeek(chart.week)} | Jersey Club Radio`,
    description: `The ${chart.entries.length} hottest new Jersey club tracks for the week of ${formatWeek(chart.week)}, hand-picked by Jersey Club Radio. Top 3: ${top3}.`,
    jsonLd: chartJsonLd(chart, path),
    body: `<h1>Rising Now: Jersey Club Chart</h1><p>Week of ${formatWeek(chart.week)}. This week's hottest new Jersey club tracks, hand-picked by Jersey Club Radio, with the evidence for why each one is rising.</p>${nav}<ol>${chart.entries.map(rowHtml).join('')}</ol>${nav}<p><a href="/">Listen to Jersey Club Radio live</a></p>`,
  }), lastmod: chart.week });
  // Keep a dated URL for the latest week too, so links to it stay valid after next week
  if (path === '/hot') urls.push({ path: page({
    path: `/hot/${chart.week}`,
    title: `Rising Now: Jersey Club Chart, Week of ${formatWeek(chart.week)} | Jersey Club Radio`,
    description: `The hottest new Jersey club tracks for the week of ${formatWeek(chart.week)}. Top 3: ${top3}.`,
    jsonLd: chartJsonLd(chart, `/hot/${chart.week}`),
    body: `<h1>Rising Now: Jersey Club Chart</h1><p>Week of ${formatWeek(chart.week)}.</p>${nav}<ol>${chart.entries.map(rowHtml).join('')}</ol>`,
  }), lastmod: chart.week });
}

if (published.length) {
  urls.push({ path: page({
    path: '/hot/archive',
    title: 'Rising Now Chart Archive | Jersey Club Radio',
    description: `Every weekly Rising Now Jersey club chart from Jersey Club Radio, ${published.length} week${published.length === 1 ? '' : 's'} and counting.`,
    jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Rising Now Chart Archive', url: `${SITE_URL}/hot/archive` },
    body: `<h1>Rising Now Archive</h1><ol>${published.map(c => `<li class="jc-row"><div class="jc-main"><a href="${weekPath(c.week)}">Week of ${formatWeek(c.week)}</a><br><small>#1: ${esc(c.entries[0].title)} by ${esc(c.entries[0].artist)}</small></div></li>`).join('')}</ol>`,
  }), lastmod: latest });

  const slugs = [...new Set(published.flatMap(c => c.entries.map(e => producerSlug(e.producer))))];
  for (const slug of slugs) {
    const h = producerHistory(published, slug);
    const path = `/producers/${slug}`;
    urls.push({ path: page({
      path,
      title: `${h.name}: Jersey Club Producer Chart History | Jersey Club Radio`,
      description: `${h.name} has ${h.tracks.length} track${h.tracks.length === 1 ? '' : 's'} on Jersey Club Radio's Rising Now chart, including ${h.tracks[0].title} (peak #${h.tracks[0].bestRank}).`,
      jsonLd: producerJsonLd(h, path),
      body: `<h1>${esc(h.name)}</h1><p>Jersey club producer · ${h.tracks.length} charted track${h.tracks.length === 1 ? '' : 's'}</p><ol>${h.tracks.map(t => `<li class="jc-row"><div class="jc-main"><strong>${esc(t.title)}</strong> — ${esc(t.artist)}<br><small>Peak #${t.bestRank} · ${t.weeks.map(w => `<a href="${weekPath(w.week)}">#${w.rank} week of ${formatWeek(w.week)}</a>`).join(' · ')}</small></div></li>`).join('')}</ol><p><a href="/hot">This week's chart</a></p>`,
    }), lastmod: h.tracks.flatMap(t => t.weeks.map(w => w.week)).sort().at(-1) });
  }
}

// ── News: /news and /news/<slug> (drafts only with PRERENDER_PLACEHOLDERS=1) ──
const allNews = JSON.parse(readFileSync('src/data/news/articles.json', 'utf8'));
const news = publishedArticles(allNews, { includeDrafts: process.env.PRERENDER_PLACEHOLDERS === '1' });
const inline = t => inlineSegments(t).map(s => (s.href ? `<a href="${esc(s.href)}">${esc(s.text)}</a>` : esc(s.text))).join('');
const blockHtml = b => ('h2' in b ? `<h2>${esc(b.h2)}</h2>`
  : 'quote' in b ? `<blockquote><p>“${esc(b.quote)}”</p><footer>${esc(b.by)}</footer></blockquote>`
    : `<p>${inline(b.p)}</p>`);
for (const a of news) {
  const path = `/news/${a.slug}`;
  const share = shareLinks(SITE_URL + path, a.title);
  urls.push({ path: page({
    path,
    title: `${a.title} | Jersey Club Radio`,
    description: a.description ?? a.dek,
    jsonLd: articleJsonLd(a),
    body: `<article><p><small>${esc(a.tag)}</small></p><h1>${esc(a.title)}</h1><p><em>${esc(a.dek)}</em></p><p><small>By ${esc(a.author)} · ${esc(a.date)}</small></p>${a.body.map(blockHtml).join('')}<h2>Sources</h2><ul>${a.sources.map(s => `<li>${esc(s.publication)}: <a href="${esc(s.url)}" rel="noopener">${esc(s.title)}</a></li>`).join('')}</ul><p>Share: <a href="${esc(share.x)}">X</a> · <a href="${esc(share.facebook)}">Facebook</a> · <a href="${esc(share.whatsapp)}">WhatsApp</a></p><p><a href="/news">More stories</a> · <a href="/hot">This week's Rising Now chart</a></p></article>`,
  }), lastmod: a.date });
}
if (news.length) {
  urls.push({ path: page({
    path: '/news',
    title: 'Jersey Club News & Stories | Jersey Club Radio',
    description: `The history, the artists and the moments that built Jersey club: ${news.length} stories from Jersey Club Radio.`,
    jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Jersey Club Stories', url: `${SITE_URL}/news` },
    body: `<h1>Jersey Club Stories</h1><ul>${news.map(a => `<li class="jc-row"><div class="jc-main"><a href="/news/${a.slug}"><strong>${esc(a.title)}</strong></a><br><small>${esc(a.dek)}</small></div></li>`).join('')}</ul>`,
  }), lastmod: news[0].date });
}

// ── Sitemap: static pages from public/sitemap.xml + chart pages ──────────────
const staticSitemap = readFileSync('public/sitemap.xml', 'utf8');
const extra = urls.map(u => `  <url>\n    <loc>${SITE_URL}${u.path}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.path.startsWith('/hot') && !/\d/.test(u.path) ? 'weekly' : 'monthly'}</changefreq>\n  </url>`).join('\n');
writeFileSync(join(DIST, 'sitemap.xml'), staticSitemap.replace('</urlset>', `${extra ? extra + '\n' : ''}</urlset>`));

console.log(`[prerender] ${weeks.length} published week(s); wrote ${urls.length} page(s): ${urls.map(u => u.path).join(', ') || '(none)'}`);
