import { useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { Play } from 'lucide-react';
import { usePlayer, type Track } from '../context/PlayerContext';
import { BEST_SONGS, songCount, sourceLabel } from '../../data/seo/bestSongs.mjs';
import { setHead } from '../lib/head';
import { CARD_STYLE } from '../components/RisingNow';

type Song = { title: string; artist: string; producer?: string; year?: string; why: string; sources: string[] };
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const norm = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

/** A station track for this song: its title and the first word of the artist must both match */
function findOnStation(song: Song, tracks: Track[]) {
  const title = norm(song.title);
  const artistWord = norm(song.artist).split(' ').find(w => w.length > 2 && !['and', 'the', 'featuring'].includes(w)) ?? '';
  if (title.length < 4 || !artistWord) return undefined;
  return tracks.find(t => {
    const hay = norm(`${t.snippet.title} ${t.snippet.channelTitle}`);
    return hay.includes(title) && hay.includes(artistWord);
  });
}

/** /best-jersey-club-songs: the canon by era, playable where the station has the track */
export function BestSongs() {
  const p = BEST_SONGS;
  const { tracks, playTrack } = usePlayer();
  useEffect(() => { setHead({ title: p.title, description: p.description, path: p.path }); }, []);
  const playable = useMemo(() => {
    const m = new Map<string, Track>();
    for (const e of p.eras) for (const s of e.songs as Song[]) { const t = findOnStation(s, tracks); if (t) m.set(`${s.title}|${s.artist}`, t); }
    return m;
  }, [tracks]);

  return (
    <article className="max-w-3xl mx-auto w-full pb-10 flex flex-col gap-5">
      <header className="p-5 md:p-7" style={CARD_STYLE}>
        <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">{p.heading}</h1>
        <p className="text-xs text-[#7B6F90] mt-2">By <a href="https://robertvanliew.com" target="_blank" rel="author noopener" className="text-[#C080FF] hover:text-white">Robert Van Liew</a> · Last updated {fmtDate(p.updated)} · {songCount()} songs</p>
        <p className="text-sm md:text-base text-[#D9D0E8] leading-relaxed mt-4">{p.answer}</p>
        <nav className="flex flex-wrap gap-2 mt-4" aria-label="Eras">
          {p.eras.map((e, i) => <a key={e.name} href={`#era-${i + 1}`} className="text-xs font-semibold px-3 py-1.5 rounded-full text-[#C77DFF] hover:text-white" style={{ border: '1px solid rgba(157,0,255,0.3)' }}>{e.name}</a>)}
        </nav>
      </header>

      {p.eras.map((e, i) => (
        <section key={e.name} id={`era-${i + 1}`} className="p-5 md:p-7 scroll-mt-4" style={CARD_STYLE}>
          <h2 className="text-lg md:text-xl font-black text-white">{e.name} <span className="text-sm font-semibold text-[#7B6F90]">({e.years})</span></h2>
          <p className="text-sm text-[#A99DBF] leading-relaxed mt-2">{e.intro}</p>
          <ol className="flex flex-col gap-4 mt-5">
            {(e.songs as Song[]).map(s => {
              const t = playable.get(`${s.title}|${s.artist}`);
              return (
                <li key={`${s.title}|${s.artist}`} className="flex gap-3">
                  {t ? (
                    <button onClick={() => playTrack(t)} aria-label={`Play ${s.title}`} className="mt-0.5 w-8 h-8 shrink-0 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9D00FF, #FF0080)' }}>
                      <Play className="w-3.5 h-3.5 text-white ml-0.5" />
                    </button>
                  ) : <span className="w-8 shrink-0" aria-hidden />}
                  <div className="min-w-0">
                    <p className="text-sm md:text-base text-white"><strong>{s.title}</strong> <span className="text-[#C9BFDB]">· {s.artist}</span>{s.year && <span className="text-[#7B6F90]"> · {s.year}</span>}</p>
                    {s.producer && <p className="text-xs text-[#7B6F90]">prod. {s.producer}</p>}
                    <p className="text-sm text-[#A99DBF] leading-relaxed mt-1">{s.why} <span className="text-xs">{s.sources.map((u, k) => <a key={u} href={u} target="_blank" rel="noopener" className="text-[#7B6F90] hover:text-white underline underline-offset-2">{k ? ', ' : '('}{sourceLabel(u)}</a>)})</span></p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <footer className="p-5 md:p-6 text-sm" style={CARD_STYLE}>
        <p className="text-[#A99DBF]">Songs with a play button are on the station. Think a classic is missing? <Link to="/contact" className="text-[#C77DFF] hover:text-white underline">Tell us</Link>.</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(157,0,255,0.15)' }}>
          {p.related.map(([to, label]) => <Link key={to} to={to} className="font-semibold text-[#C77DFF] hover:text-white">{label} →</Link>)}
        </div>
      </footer>
    </article>
  );
}
