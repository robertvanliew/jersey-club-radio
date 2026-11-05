import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Download, Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { SQUEAK_PAGE } from '../../data/seo/bedSqueak.mjs';
import { inlineSegments } from '../../data/news/newsUtils.mjs';
import { SOUNDS, renderSound, type ClubSound } from '../lib/clubSounds';
import { wavBlob, saveFile } from '../lib/audioFile';
import { setHead } from '../lib/head';
import { CARD_STYLE } from '../components/RisingNow';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const GROUP_COLOR: Record<ClubSound['group'], string> = { Squeaks: '#FFB020', Kicks: '#FF0080', Claps: '#C77DFF', 'Hats & extras': '#7B6FFF' };

function Rich({ text }: { text: string }) {
  return <>{inlineSegments(text).map((s: { text: string; href?: string }, i: number) => s.href
    ? <Link key={i} to={s.href} className="text-[#C77DFF] underline underline-offset-2 hover:text-white">{s.text}</Link>
    : <span key={i}>{s.text}</span>)}</>;
}

/** /jersey-club-bed-squeak: the story of the squeak, plus a board of original sounds to play and download */
export function BedSqueak() {
  const p = SQUEAK_PAGE;
  const { isPlaying: stationPlaying, togglePlay } = usePlayer();
  useEffect(() => { setHead({ title: p.title, description: p.description, path: p.path }); }, []);
  const ctxRef = useRef<{ ctx: AudioContext; out: GainNode } | null>(null);
  const [lit, setLit] = useState<string | null>(null);

  const play = (s: ClubSound) => {
    if (!ctxRef.current) {
      const ctx = new AudioContext({ latencyHint: 'interactive' });
      const out = ctx.createGain(); out.gain.value = 0.9; out.connect(ctx.destination);
      ctxRef.current = { ctx, out };
    }
    const { ctx, out } = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    s.play(ctx, out, ctx.currentTime + 0.005);
    setLit(s.id); setTimeout(() => setLit(l => (l === s.id ? null : l)), 180);
  };
  useEffect(() => () => { ctxRef.current?.ctx.close().catch(() => { }); }, []);

  const download = async (s: ClubSound) => saveFile(wavBlob(await renderSound(s)), `jersey-club-radio-${s.id}.wav`);
  const groups = [...new Set(SOUNDS.map(s => s.group))];

  return (
    <article className="max-w-3xl mx-auto w-full pb-10 flex flex-col gap-5">
      <header className="p-5 md:p-7" style={CARD_STYLE}>
        <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">{p.heading}</h1>
        <p className="text-xs text-[#7B6F90] mt-2">By <a href="https://robertvanliew.com" target="_blank" rel="author noopener" className="text-[#C080FF] hover:text-white">Robert Van Liew</a> · Last updated {fmtDate(p.updated)}</p>
        <p className="text-sm md:text-base text-[#D9D0E8] leading-relaxed mt-4">{p.answer}</p>
      </header>

      <section className="p-5 md:p-7" style={CARD_STYLE} aria-labelledby="board">
        <h2 id="board" className="text-lg md:text-xl font-black text-white">Free Jersey club sound board</h2>
        <p className="text-sm text-[#A99DBF] mt-1">Tap a pad to hear it. Every sound is original, made from scratch, and free to use in anything (CC0, no credit needed).</p>
        {stationPlaying && (
          <button onClick={togglePlay} className="mt-3 text-xs font-semibold text-[#C77DFF] hover:text-white underline">Pause the station to hear the pads clearly</button>
        )}
        {groups.map(g => (
          <div key={g} className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: GROUP_COLOR[g] }}>{g}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2">
              {SOUNDS.filter(s => s.group === g).map(s => (
                <div key={s.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${GROUP_COLOR[g]}55` }}>
                  <button onClick={() => play(s)} className="w-full h-16 flex items-center justify-center gap-1.5 text-sm font-bold text-white transition-colors select-none"
                    style={{ background: lit === s.id ? GROUP_COLOR[g] : `${GROUP_COLOR[g]}22` }} aria-label={`Play ${s.name}`}>
                    <Play className="w-3.5 h-3.5" /> {s.name}
                  </button>
                  <button onClick={() => download(s)} className="w-full h-8 flex items-center justify-center gap-1 text-[11px] font-semibold text-[#A99DBF] hover:text-white" aria-label={`Download ${s.name} as WAV`}>
                    <Download className="w-3 h-3" /> WAV
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="p-5 md:p-7 flex flex-col gap-6" style={CARD_STYLE}>
        {p.sections.map(s => (
          <div key={s.h2}>
            <h2 className="text-lg md:text-xl font-black text-white">{s.h2}</h2>
            {s.body.map((para, i) => <p key={i} className="text-sm md:text-[15px] text-[#C9BFDB] leading-relaxed mt-2"><Rich text={para} /></p>)}
          </div>
        ))}
      </section>

      <section className="p-5 md:p-7" style={CARD_STYLE}>
        <h2 className="text-lg md:text-xl font-black text-white mb-4">Common questions</h2>
        <div className="flex flex-col gap-5">{p.faq.map(f => <div key={f.q}><h3 className="text-sm md:text-base font-bold text-white">{f.q}</h3><p className="text-sm text-[#A99DBF] leading-relaxed mt-1">{f.a}</p></div>)}</div>
      </section>

      <footer className="p-5 md:p-6 text-sm" style={CARD_STYLE}>
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#7B6F90] mb-2">Sources</h2>
        <ul className="flex flex-col gap-1">{p.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener" className="text-[#C77DFF] hover:text-white">{s.name}</a></li>)}</ul>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 pt-4" style={{ borderTop: '1px solid rgba(157,0,255,0.15)' }}>
          {p.related.map(([to, label]) => <Link key={to} to={to} className="font-semibold text-[#C77DFF] hover:text-white">{label} →</Link>)}
        </div>
      </footer>
    </article>
  );
}
