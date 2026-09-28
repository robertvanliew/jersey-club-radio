import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Share2, Link2, Check, ChevronRight, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { articles, getArticle, type NewsArticle, type Block } from '../../data/news';
import { inlineSegments, shareLinks } from '../../data/news/newsUtils.mjs';
import { SITE_URL, formatWeek } from '../../data/charts/chartUtils.mjs';
import { latestWeek, getChart } from '../../data/charts';
import { CARD_STYLE } from '../components/RisingNow';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

function useTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => { document.title = prev; };
  }, [title]);
}

/** Text with inline [label](/path) links; internal paths use the router, external open a new tab */
function Inline({ text }: { text: string }) {
  return (
    <>
      {inlineSegments(text).map((s, i) =>
        !s.href ? <React.Fragment key={i}>{s.text}</React.Fragment>
          : s.href.startsWith('/') ? <Link key={i} to={s.href} className="text-[#C080FF] underline underline-offset-2 hover:text-white">{s.text}</Link>
            : <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="text-[#C080FF] underline underline-offset-2 hover:text-white">{s.text}</a>,
      )}
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  if ('h2' in block) return <h2 className="text-lg md:text-xl font-black text-white mt-6 mb-2">{block.h2}</h2>;
  if ('quote' in block) {
    return (
      <blockquote className="my-5 pl-4 py-1" style={{ borderLeft: '3px solid #FF0080' }}>
        <p className="text-lg md:text-xl font-bold text-white leading-snug">“{block.quote}”</p>
        <footer className="text-xs text-[#9B8FB0] mt-1.5">{block.by}</footer>
      </blockquote>
    );
  }
  return <p className="text-[15px] leading-7 text-[#D8CCEA] mb-4"><Inline text={block.p} /></p>;
}

const SHARE_BTN = 'flex items-center justify-center gap-1.5 h-9 px-3 rounded-full text-xs font-bold text-white transition-opacity hover:opacity-80';

export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const links = shareLinks(url, title);
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); toast.success('Link copied'); setTimeout(() => setCopied(false), 2000); }
    catch { toast.error('Could not copy the link'); }
  };
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Share this article">
      {canNativeShare && (
        <button onClick={() => navigator.share({ title, url }).catch(() => { })} className={SHARE_BTN} style={{ background: 'linear-gradient(135deg, #9D00FF, #FF0080)' }}>
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
      )}
      <a href={links.x} target="_blank" rel="noopener noreferrer" className={SHARE_BTN} style={{ background: '#000', border: '1px solid #333' }}>X</a>
      <a href={links.facebook} target="_blank" rel="noopener noreferrer" className={SHARE_BTN} style={{ background: '#1877F2' }}>Facebook</a>
      <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className={SHARE_BTN} style={{ background: '#25D366' }}>WhatsApp</a>
      <a href={links.threads} target="_blank" rel="noopener noreferrer" className={SHARE_BTN} style={{ background: '#101010', border: '1px solid #333' }}>Threads</a>
      <button onClick={copy} className={SHARE_BTN} style={{ background: 'rgba(157,0,255,0.15)', border: '1px solid rgba(157,0,255,0.35)' }}>
        {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}

/** Live module: this week's top 3, so every article leads back into the station */
function OnTheChart() {
  const chart = latestWeek ? getChart(latestWeek) : undefined;
  if (!chart) return null;
  return (
    <aside className="p-4 mt-6" style={CARD_STYLE}>
      <p className="text-sm font-black text-white flex items-center gap-2"><Flame className="w-4 h-4 text-[#FF0080]" /> Rising Now · Week of {formatWeek(chart.week)}</p>
      <ol className="list-none p-0 m-0 mt-2 flex flex-col gap-1">
        {chart.entries.slice(0, 3).map(e => (
          <li key={e.rank} className="text-sm text-[#D8CCEA]"><span className="font-black text-white mr-2">{e.rank}</span>{e.title} <span className="text-[#9B8FB0]">· {e.artist}</span></li>
        ))}
      </ol>
      <Link to="/hot" className="inline-flex items-center gap-0.5 text-xs font-bold text-[#C080FF] hover:text-white mt-2">See the full chart <ChevronRight className="w-3.5 h-3.5" /></Link>
    </aside>
  );
}

/** /news/:slug */
export function ArticlePage() {
  const { slug = '' } = useParams();
  const a = getArticle(slug);
  useTitle(a ? `${a.title} | Jersey Club Radio` : 'Article | Jersey Club Radio');
  if (!a) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center" style={CARD_STYLE}>
        <p className="text-sm text-[#9B8FB0]">That article isn't available.</p>
        <Link to="/news" className="text-xs font-bold text-[#C080FF]">All articles</Link>
      </div>
    );
  }
  const url = `${SITE_URL}/news/${a.slug}`;
  return (
    <article className="max-w-2xl mx-auto w-full pb-10 px-1">
      <p className="text-[11px] font-black tracking-widest uppercase text-[#FF4DA6]">{a.tag}</p>
      <h1 className="text-2xl md:text-4xl font-black text-white leading-tight mt-1">{a.title}</h1>
      <p className="text-base md:text-lg text-[#B9A6D6] mt-3 leading-snug">{a.dek}</p>
      <p className="text-xs text-[#7B6F90] mt-3">By {a.author} · {fmtDate(a.date)}</p>
      <div className="my-5"><ShareBar url={url} title={a.title} /></div>
      <div>{a.body.map((b, i) => <BlockView key={i} block={b} />)}</div>
      <section className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(157,0,255,0.2)' }}>
        <h2 className="text-xs font-black tracking-widest uppercase text-[#7B6F90] mb-2">Sources</h2>
        <ul className="list-none p-0 m-0 flex flex-col gap-1">
          {a.sources.map(s => (
            <li key={s.url} className="text-xs text-[#9B8FB0]">
              {s.publication}: <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[#C080FF] hover:text-white">{s.title}</a>
            </li>
          ))}
        </ul>
      </section>
      <div className="mt-6"><ShareBar url={url} title={a.title} /></div>
      <OnTheChart />
      <MoreArticles current={a.slug} />
    </article>
  );
}

function ArticleCard({ a }: { a: NewsArticle }) {
  return (
    <Link to={`/news/${a.slug}`} className="block p-4 hover:opacity-90 transition-opacity" style={CARD_STYLE}>
      <p className="text-[10px] font-black tracking-widest uppercase text-[#FF4DA6]">{a.tag}</p>
      <p className="text-base font-black text-white leading-snug mt-1">{a.title}</p>
      <p className="text-xs text-[#9B8FB0] mt-1 line-clamp-2">{a.dek}</p>
    </Link>
  );
}

function MoreArticles({ current }: { current: string }) {
  const more = articles.filter(a => a.slug !== current).slice(0, 3);
  if (!more.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-sm font-black text-white mb-3">More from Jersey Club Radio</h2>
      <div className="grid gap-3 sm:grid-cols-3">{more.map(a => <ArticleCard key={a.slug} a={a} />)}</div>
    </section>
  );
}

/** /news */
export function NewsIndexPage() {
  useTitle('Jersey Club News & Stories | Jersey Club Radio');
  return (
    <div className="max-w-3xl mx-auto w-full pb-10 flex flex-col gap-4">
      <header className="p-4" style={CARD_STYLE}>
        <h1 className="text-xl md:text-2xl font-black text-white">Jersey Club Stories</h1>
        <p className="text-xs text-[#9B8FB0]">The history, the artists and the moments that built the sound, from Jersey Club Radio.</p>
      </header>
      {articles.length ? (
        <div className="grid gap-3 sm:grid-cols-2">{articles.map(a => <ArticleCard key={a.slug} a={a} />)}</div>
      ) : (
        <p className="text-sm text-[#9B8FB0] text-center p-6" style={CARD_STYLE}>Stories are coming soon.</p>
      )}
    </div>
  );
}
