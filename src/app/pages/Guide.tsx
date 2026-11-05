import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { guideByPath } from '../../data/seo/guides.mjs';
import { inlineSegments } from '../../data/news/newsUtils.mjs';
import { setHead } from '../lib/head';
import { CARD_STYLE } from '../components/RisingNow';
import { NotFound } from './NotFound';

type Guide = {
  path: string; title: string; description: string; heading: string; updated: string; answer: string;
  facts?: string[][]; table?: { head: string[]; rows: string[][] };
  sections: { h2: string; body: string[] }[];
  faq: { q: string; a: string }[]; sources: { name: string; url: string }[]; related: string[][];
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** Text with [label](/path) links */
function Rich({ text }: { text: string }) {
  return <>{inlineSegments(text).map((s: { text: string; href?: string }, i: number) => s.href
    ? (s.href.startsWith('/') ? <Link key={i} to={s.href} className="text-[#C77DFF] underline underline-offset-2 hover:text-white">{s.text}</Link>
      : <a key={i} href={s.href} target="_blank" rel="noopener" className="text-[#C77DFF] underline underline-offset-2 hover:text-white">{s.text}</a>)
    : <span key={i}>{s.text}</span>)}</>;
}

/** Evergreen guides (/what-is-jersey-club, /jersey-club-vs-baltimore-club) */
export function GuidePage() {
  const { pathname } = useLocation();
  const g = guideByPath(pathname) as Guide | undefined;
  const { isPlaying, togglePlay, isRadioMode, backToLive, currentTrack } = usePlayer();
  useEffect(() => { if (g) setHead({ title: g.title, description: g.description, path: g.path }); }, [g]);
  if (!g) return <NotFound />;

  const play = () => (currentTrack && !isRadioMode ? backToLive() : togglePlay());

  return (
    <article className="max-w-3xl mx-auto w-full pb-10 flex flex-col gap-5">
      <header className="p-5 md:p-7" style={CARD_STYLE}>
        <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">{g.heading}</h1>
        <p className="text-xs text-[#7B6F90] mt-2">
          By <a href="https://robertvanliew.com" target="_blank" rel="author noopener" className="text-[#C080FF] hover:text-white">Robert Van Liew</a> · Last updated {fmtDate(g.updated)}
        </p>
        <p className="text-sm md:text-base text-[#D9D0E8] leading-relaxed mt-4">{g.answer}</p>
        {!(isPlaying && isRadioMode) && (
          <button onClick={play} className="mt-5 h-11 px-5 rounded-full font-bold text-white text-sm flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #9D00FF, #FF0080)' }}>
            <Play className="w-4 h-4" /> Hear it: play Jersey Club Radio
          </button>
        )}
      </header>

      {g.facts && (
        <section className="p-5 md:p-6" style={CARD_STYLE} aria-label="Quick facts">
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 text-sm">
            {g.facts.map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-[#7B6F90] font-semibold">{k}</dt><dd className="text-white">{v}</dd></div>
            ))}
          </dl>
        </section>
      )}

      {g.table && (
        <section className="p-3 md:p-5 overflow-x-auto" style={CARD_STYLE} aria-label="Comparison">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr>{g.table.head.map(h => <th key={h} className="text-left text-white font-bold p-2 border-b border-white/10">{h}</th>)}</tr>
            </thead>
            <tbody>
              {g.table.rows.map(r => (
                <tr key={r[0]} className="border-b border-white/5 last:border-0">
                  <th scope="row" className="text-left text-[#7B6F90] font-semibold p-2 align-top">{r[0]}</th>
                  {r.slice(1).map((c, i) => <td key={i} className="text-[#D9D0E8] p-2 align-top">{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="p-5 md:p-7 flex flex-col gap-7" style={CARD_STYLE}>
        {g.sections.map(s => (
          <div key={s.h2}>
            <h2 className="text-lg md:text-xl font-black text-white mb-2">{s.h2}</h2>
            {s.body.map((p, i) => <p key={i} className="text-sm md:text-[15px] text-[#C9BFDB] leading-relaxed mt-2"><Rich text={p} /></p>)}
          </div>
        ))}
      </section>

      <section className="p-5 md:p-7" style={CARD_STYLE}>
        <h2 className="text-lg md:text-xl font-black text-white mb-4">Common questions</h2>
        <div className="flex flex-col gap-5">
          {g.faq.map(f => (
            <div key={f.q}><h3 className="text-sm md:text-base font-bold text-white">{f.q}</h3><p className="text-sm text-[#A99DBF] leading-relaxed mt-1">{f.a}</p></div>
          ))}
        </div>
      </section>

      <footer className="p-5 md:p-6 text-sm" style={CARD_STYLE}>
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#7B6F90] mb-2">Sources</h2>
        <ul className="flex flex-col gap-1">
          {g.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener" className="text-[#C77DFF] hover:text-white">{s.name}</a></li>)}
        </ul>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 pt-4" style={{ borderTop: '1px solid rgba(157,0,255,0.15)' }}>
          {g.related.map(([to, label]) => <Link key={to} to={to} className="font-semibold text-[#C77DFF] hover:text-white">{label} →</Link>)}
        </div>
      </footer>
    </article>
  );
}
