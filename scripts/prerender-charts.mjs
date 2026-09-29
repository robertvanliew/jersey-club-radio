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
import { ROUTE_SEO, artistSeo } from '../src/data/seo/routes.mjs';
import { HOME_EXPLAINER } from '../src/data/seo/home.mjs';

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
function page({ path, title, description, jsonLd, body, noindex = false }) {
  const url = SITE_URL + path;
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta name="robots" content=")[^"]*(")/, noindex ? '$1noindex, follow$2' : '$&')
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    // Homepage-only content: the FAQ structured data and the "enable JavaScript" fallback
    .replace(/<script type="application\/ld\+json">(?:(?!<\/script>)[\s\S])*"FAQPage"[\s\S]*?<\/script>\s*/, '')
    .replace(/<!--[^>]*FAQPage[^>]*-->\s*/, '')
    .replace(/<noscript>[\s\S]*?<\/noscript>\s*/, '')
    .replace('</head>', `${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>\n` : ''}${STYLE}\n</head>`)
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

// ── Static app routes: each gets its own title, description, canonical and intro ──
const today = new Date().toISOString().slice(0, 10);
const SECTION_LINKS = `<nav class="jc-nav" style="flex-wrap:wrap"><a href="/">Listen live</a><a href="/hot">Rising Now chart</a><a href="/news">Stories</a><a href="/artists">Artists</a><a href="/new-releases">New releases</a><a href="/dance-videos">Dance videos</a><a href="/games">Games</a><a href="/about">About</a><a href="/contact">Contact</a></nav>`;
for (const [path, seo] of Object.entries(ROUTE_SEO)) {
  if (path === '/') continue; // the root index.html keeps its own tags, FAQ and fallback
  page({
    path, title: seo.title, description: seo.description, noindex: !!seo.noindex,
    jsonLd: seo.noindex ? null : { '@context': 'https://schema.org', '@type': 'WebPage', name: seo.title, description: seo.description, url: SITE_URL + path, isPartOf: { '@type': 'WebSite', name: 'Jersey Club Radio', url: SITE_URL } },
    body: `<h1>${esc(seo.title.split(' | ')[0])}</h1><p>${esc(seo.intro || seo.description)}</p>${SECTION_LINKS}`,
  });
  if (!seo.noindex) urls.push({ path, lastmod: today, changefreq: path === '/new-releases' || path === '/dance-videos' ? 'daily' : 'monthly' });
}

// ── Artist profiles (fetched from the live API at build time; skipped if unreachable) ──
let artistsBuilt = 0;
const artistList = [];
try {
  const info = readFileSync('utils/supabase/info.tsx', 'utf8');
  const projectId = info.match(/projectId\s*=\s*"([^"]+)"/)[1];
  const anon = info.match(/publicAnonKey\s*=\s*"([^"]+)"/)[1];
  const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-715f71b9/artists`, { headers: { Authorization: `Bearer ${anon}` }, signal: AbortSignal.timeout(15000) });
  const artists = res.ok ? await res.json() : [];
  for (const a of (Array.isArray(artists) ? artists : []).filter(x => x.slug && x.name && x.visible !== false)) {
    const seo = artistSeo(a);
    const socials = Object.values(a.socials || {}).filter(v => typeof v === 'string' && /^https?:\/\//.test(v));
    const path = `/artists/${a.slug}`;
    page({
      path, title: seo.title, description: seo.description,
      jsonLd: { '@context': 'https://schema.org', '@type': 'Person', name: a.name, jobTitle: a.role, description: String(a.bio || '').slice(0, 500), url: SITE_URL + path, ...(a.photoUrl ? { image: a.photoUrl } : {}), ...(socials.length ? { sameAs: socials } : {}), genre: 'Jersey club' },
      body: `<h1>${esc(a.name)}</h1><p><strong>${esc(a.role || 'Jersey club artist')}</strong></p>${a.photoUrl ? `<img src="${esc(a.photoUrl)}" alt="${esc(a.name)}" width="240" style="border-radius:12px">` : ''}${String(a.bio || '').split(/\n+/).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('')}${socials.length ? `<p>${socials.map(s => `<a href="${esc(s)}" rel="noopener">${esc(new URL(s).hostname.replace('www.', ''))}</a>`).join(' · ')}</p>` : ''}<p><a href="/artists">All Jersey club artists</a> · <a href="/">Listen to Jersey Club Radio</a></p>`,
    });
    urls.push({ path, lastmod: (a.updatedAt || today).slice(0, 10), changefreq: 'monthly' });
    artistsBuilt++;
    artistList.push({ path, name: a.name, role: a.role });
  }
} catch (e) {
  console.warn(`[prerender] artist pages skipped: ${e.message}`);
}

// ── Homepage: crawler-readable body (genre explainer, this week's chart, stories, artists) ──
// AI crawlers don't run JavaScript, so without this the homepage is an empty #root to them.
const latestChart = latest ? byWeek.get(latest) : null;
const e = HOME_EXPLAINER;
const homeBody = `<h1>Jersey Club Radio: 24/7 Jersey Club Music</h1>
<p>${esc(ROUTE_SEO['/'].intro)}</p>${SECTION_LINKS}
<h2>${esc(e.heading)}</h2><p>${esc(e.definition)}</p>
<ul>${e.facts.map(([k, v]) => `<li><strong>${esc(k)}:</strong> ${esc(v)}</li>`).join('')}</ul>
${latestChart ? `<h2>This week's Rising Now chart</h2><p>Week of ${formatWeek(latestChart.week)}.</p><ol>${latestChart.entries.slice(0, 10).map(x => `<li>${esc(x.title)} by ${esc(x.artist)} (prod. <a href="/producers/${producerSlug(x.producer)}">${esc(x.producer)}</a>)</li>`).join('')}</ol><p><a href="/hot">See the full chart</a></p>` : ''}
${news.length ? `<h2>Jersey club stories</h2><ul>${news.map(a => `<li><a href="/news/${esc(a.slug)}">${esc(a.title)}</a></li>`).join('')}</ul>` : ''}
${artistList.length ? `<h2>Jersey club artists</h2><ul>${artistList.map(a => `<li><a href="${a.path}">${esc(a.name)}</a>${a.role ? `, ${esc(a.role)}` : ''}</li>`).join('')}</ul>` : ''}
<h2>Jersey club questions</h2>${e.faq.map(f => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}
<p><a href="https://www.instagram.com/jerseyclubradio/">Instagram</a> · <a href="https://x.com/jerseyclubradio">X</a> · <a href="https://www.youtube.com/@Jerseyclubradio">YouTube</a> · <a href="https://www.tiktok.com/@jerseyclubradio">TikTok</a></p>`;
writeFileSync(join(DIST, 'index.html'), template
  .replace(/<noscript>[\s\S]*?<\/noscript>\s*/, '')
  .replace('</head>', `${STYLE}\n</head>`)
  .replace('<div id="root"></div>', `<div id="root"><main class="jc-static">${homeBody}</main></div>`));

// ── llms.txt: a plain map of the site for AI assistants ──
const md = s => String(s).replace(/\s+/g, ' ').trim();
writeFileSync(join(DIST, 'llms.txt'), `# Jersey Club Radio

> ${md(ROUTE_SEO['/'].description)} Free, no account needed, at ${SITE_URL}.

${md(e.definition)}

## Key pages
- [Listen live](${SITE_URL}/): The 24/7 Jersey club radio stream
- [Rising Now chart](${SITE_URL}/hot): The fastest-rising new Jersey club tracks, updated every Monday
- [Chart archive](${SITE_URL}/hot/archive): Every past week of the Rising Now chart
- [Stories](${SITE_URL}/news): Features on Jersey club history, artists and dance culture
- [Artists](${SITE_URL}/artists): Profiles of Jersey club DJs and producers
- [New releases](${SITE_URL}/new-releases): The latest Jersey club songs and remixes
- [Dance videos](${SITE_URL}/dance-videos): The newest Jersey club dance shorts
- [About](${SITE_URL}/about): Who runs Jersey Club Radio
- [Contact](${SITE_URL}/contact): Advertising, bookings and press

## Stories
${news.map(a => `- [${md(a.title)}](${SITE_URL}/news/${a.slug})${a.description ? `: ${md(a.description)}` : ''}`).join('\n')}
${artistList.length ? `\n## Artists\n${artistList.map(a => `- [${md(a.name)}](${SITE_URL}${a.path})${a.role ? `: ${md(a.role)}` : ''}`).join('\n')}\n` : ''}${latestChart ? `\n## This week's chart (week of ${formatWeek(latestChart.week)})\n${latestChart.entries.slice(0, 10).map(x => `${x.rank}. ${md(x.title)} by ${md(x.artist)}, prod. ${md(x.producer)}`).join('\n')}\n` : ''}
## Jersey club FAQ
${e.faq.map(f => `### ${f.q}\n${f.a}`).join('\n\n')}

## Contact
info@jerseyclubradio.com
`);

// ── Sitemap: every indexable page (home + routes + chart + news + producers + artists) ──
const entry = u => `  <url>\n    <loc>${SITE_URL}${u.path}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq || (u.path.startsWith('/hot') && !/\d/.test(u.path) ? 'weekly' : 'monthly')}</changefreq>\n  </url>`;
const all = [{ path: '/', lastmod: today, changefreq: 'daily' }, ...urls.filter((u, i, arr) => arr.findIndex(x => x.path === u.path) === i)];
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${all.map(entry).join('\n')}\n</urlset>\n`);
console.log(`[prerender] ${artistsBuilt} artist page(s); sitemap has ${all.length} URLs`);

console.log(`[prerender] ${weeks.length} published week(s); wrote ${urls.length} page(s): ${urls.map(u => u.path).join(', ') || '(none)'}`);
