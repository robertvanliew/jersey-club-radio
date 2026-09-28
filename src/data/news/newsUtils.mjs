// News helpers shared by the app and the build-time page generator (plain JS).
import { SITE_URL } from '../charts/chartUtils.mjs';

/** Published articles, newest first (drafts only when includeDrafts) */
export function publishedArticles(all, { includeDrafts = false } = {}) {
  return all.filter(a => includeDrafts || !a.draft).sort((a, b) => b.date.localeCompare(a.date));
}

/** Split "text with [a link](/hot)" into [{ text }, { text, href }] segments */
export function inlineSegments(text) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[1], href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

/** Plain text (links reduced to their label), for descriptions */
export const plainText = text => inlineSegments(text).map(s => s.text).join('');

/** schema.org JSON-LD for an article page */
export function articleJsonLd(a) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.dek,
    datePublished: a.date,
    dateModified: a.date,
    author: { '@type': 'Organization', name: a.author, url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'Jersey Club Radio', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/news/${a.slug}`,
    articleSection: a.tag,
    citation: a.sources.map(s => ({ '@type': 'CreativeWork', name: s.title, url: s.url, publisher: { '@type': 'Organization', name: s.publication } })),
  };
}

/** Share URLs for an article (no tracking, no third-party scripts) */
export function shareLinks(url, title) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return {
    x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    whatsapp: `https://wa.me/?text=${t}%20${u}`,
    threads: `https://www.threads.net/intent/post?text=${t}%20${u}`,
  };
}
