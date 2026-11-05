import { Link } from 'react-router';
import { ARTIST_PROFILES, PROFILES_UPDATED } from '../../data/artists/profiles.mjs';
import { inlineSegments } from '../../data/news/newsUtils.mjs';

export type ArtistProfileData = {
  slug: string; intro: string; facts: string[][];
  sections: { h2: string; body: string[] }[];
  signatureTracks: { title: string; year?: string; note?: string }[];
  sources: { name: string; url: string }[];
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

function Rich({ text }: { text: string }) {
  return <>{inlineSegments(text).map((s: { text: string; href?: string }, i: number) => s.href
    ? (s.href.startsWith('/') ? <Link key={i} to={s.href} className="text-[#C77DFF] underline underline-offset-2 hover:text-white">{s.text}</Link>
      : <a key={i} href={s.href} target="_blank" rel="noopener" className="text-[#C77DFF] underline underline-offset-2 hover:text-white">{s.text}</a>)
    : <span key={i}>{s.text}</span>)}</>;
}

const CARD = { background: '#0A0716', border: '1px solid rgba(110,50,190,0.15)', borderRadius: 16 } as const;

export const hasArtistProfile = (slug?: string) => !!slug && slug in ARTIST_PROFILES;

/** Researched long-form profile under an artist's bio (nothing renders if there isn't one) */
export function ArtistProfile({ slug, name }: { slug: string; name: string }) {
  const p = (ARTIST_PROFILES as Record<string, ArtistProfileData>)[slug];
  if (!p) return null;
  return (
    <section aria-label={`About ${name}`} className="flex flex-col gap-4">
      <div className="p-5 md:p-6" style={CARD}>
        <h2 className="text-lg md:text-xl font-black text-white">Who is {name}?</h2>
        <p className="text-sm md:text-[15px] text-[#D9D0E8] leading-relaxed mt-2"><Rich text={p.intro} /></p>
        {p.facts.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm mt-4">
            {p.facts.map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-[#7B6F90] font-semibold">{k}</dt><dd className="text-white">{v}</dd></div>
            ))}
          </dl>
        )}
      </div>

      <div className="p-5 md:p-6 flex flex-col gap-6" style={CARD}>
        {p.sections.map(s => (
          <div key={s.h2}>
            <h2 className="text-base md:text-lg font-black text-white">{s.h2}</h2>
            {s.body.map((para, i) => <p key={i} className="text-sm md:text-[15px] text-[#C9BFDB] leading-relaxed mt-2"><Rich text={para} /></p>)}
          </div>
        ))}
        {p.signatureTracks.length > 0 && (
          <div>
            <h2 className="text-base md:text-lg font-black text-white">Signature tracks</h2>
            <ul className="mt-2 flex flex-col gap-1.5">
              {p.signatureTracks.map(t => (
                <li key={t.title} className="text-sm text-[#C9BFDB]">
                  <span className="text-white font-semibold">{t.title}</span>{t.year ? ` (${t.year})` : ''}{t.note ? `: ${t.note}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="p-5 md:p-6 text-sm" style={CARD}>
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#7B6F90] mb-2">Sources</h2>
        <ul className="flex flex-col gap-1">
          {p.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener" className="text-[#C77DFF] hover:text-white">{s.name}</a></li>)}
        </ul>
        <p className="text-xs text-[#7B6F90] mt-4">
          Profile by <a href="https://robertvanliew.com" target="_blank" rel="author noopener" className="text-[#C080FF] hover:text-white">Robert Van Liew</a> · Last updated {fmtDate(PROFILES_UPDATED)}
        </p>
      </div>
    </section>
  );
}
