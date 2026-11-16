// Update the document head for in-app navigation (crawlers get the same tags from the
// prerendered HTML written by scripts/prerender-charts.mjs).
const SITE_URL = 'https://jerseyclubradio.com';
const DEFAULT_ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.content = content;
}

// Same rule as the prerender: titles over ~60 characters drop the brand suffix
const SUFFIX = ' | Jersey Club Radio';
const fitTitle = (t: string) => (t.length > 60 && t.endsWith(SUFFIX) ? t.slice(0, -SUFFIX.length) : t);

export function setHead({ title: rawTitle, description, path, noindex = false }: { title: string; description: string; path: string; noindex?: boolean }) {
  const title = fitTitle(rawTitle);
  document.title = title;
  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', SITE_URL + path);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
  canonical.href = SITE_URL + path;
  setMeta('name', 'robots', noindex ? 'noindex, follow' : DEFAULT_ROBOTS);
}
