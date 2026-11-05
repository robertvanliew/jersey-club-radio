import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { RotateCcw } from 'lucide-react';
import { BPM_PAGE, toJerseyTempo } from '../../data/seo/bpm.mjs';
import { setHead } from '../lib/head';
import { CARD_STYLE } from '../components/RisingNow';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const TARGETS = [130, 135, 140, 150];

/** /jersey-club-bpm: the answer, a tap-tempo tool, and a converter to Jersey club tempo */
export function BpmTool() {
  const p = BPM_PAGE;
  useEffect(() => { setHead({ title: p.title, description: p.description, path: p.path }); }, []);

  const taps = useRef<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [manual, setManual] = useState('');
  const [target, setTarget] = useState(140);

  const tap = () => {
    const now = performance.now();
    const t = taps.current;
    if (t.length && now - t[t.length - 1] > 2500) t.length = 0; // a long pause starts a new count
    t.push(now);
    if (t.length > 16) t.shift();
    setCount(t.length);
    if (t.length >= 3) setBpm(60000 / ((t[t.length - 1] - t[0]) / (t.length - 1)));
  };
  const reset = () => { taps.current = []; setBpm(null); setCount(0); };

  // Space bar taps too (ignored while typing in the input)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      e.preventDefault(); tap();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const source = manual ? Number(manual) : bpm;
  const conv = source ? toJerseyTempo(source, target) as { relation: string; effective: number; percent: number; semitones: number } | null : null;

  return (
    <article className="max-w-3xl mx-auto w-full pb-10 flex flex-col gap-5">
      <header className="p-5 md:p-7" style={CARD_STYLE}>
        <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">{p.heading}</h1>
        <p className="text-xs text-[#7B6F90] mt-2">By <a href="https://robertvanliew.com" target="_blank" rel="author noopener" className="text-[#C080FF] hover:text-white">Robert Van Liew</a> · Last updated {fmtDate(p.updated)}</p>
        <p className="text-sm md:text-base text-[#D9D0E8] leading-relaxed mt-4">{p.answer}</p>
        <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-5 gap-y-2 text-sm mt-4">
          {p.ranges.map(([k, v]) => <div key={k} className="contents"><dt className="text-[#7B6F90] font-semibold">{k}</dt><dd className="text-white whitespace-nowrap text-right">{v}</dd></div>)}
        </dl>
      </header>

      <section className="p-5 md:p-7" style={CARD_STYLE} aria-labelledby="tap-tool">
        <h2 id="tap-tool" className="text-lg md:text-xl font-black text-white">Find any song's BPM</h2>
        <p className="text-sm text-[#A99DBF] mt-1">Play the song and tap along to the beat (or press the space bar). After a few taps the tempo appears.</p>
        <div className="flex flex-col sm:flex-row items-center gap-5 mt-5">
          <button onClick={tap} aria-label="Tap to the beat"
            className="w-40 h-40 rounded-full font-black text-white text-xl shrink-0 active:scale-95 transition-transform select-none"
            style={{ background: 'linear-gradient(135deg, #9D00FF, #FF0080)', boxShadow: '0 10px 40px rgba(157,0,255,0.35)' }}>
            TAP
          </button>
          <div className="text-center sm:text-left">
            <p className="text-5xl md:text-6xl font-black text-white tabular-nums" aria-live="polite">{bpm ? Math.round(bpm) : '--'}<span className="text-lg text-[#7B6F90] ml-2">BPM</span></p>
            <p className="text-xs text-[#7B6F90] mt-1">{count < 3 ? `Tap ${3 - count} more time${3 - count === 1 ? '' : 's'}` : `${count} taps`}</p>
            <button onClick={reset} className="mt-2 text-xs font-semibold text-[#C77DFF] hover:text-white inline-flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Reset</button>
          </div>
        </div>

        <div className="mt-7 pt-5" style={{ borderTop: '1px solid rgba(157,0,255,0.15)' }}>
          <h3 className="text-base font-bold text-white">Convert it to Jersey club tempo</h3>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
            <label className="text-[#A99DBF]">Song BPM
              <input type="number" min={40} max={250} inputMode="decimal" value={manual} placeholder={bpm ? String(Math.round(bpm)) : 'e.g. 100'}
                onChange={e => setManual(e.target.value)}
                className="ml-2 w-24 h-9 px-2 rounded-lg text-white bg-[#06000F] outline-none focus:ring-2 focus:ring-[#9D00FF]" style={{ border: '1px solid rgba(157,0,255,0.3)' }} />
            </label>
            <span className="text-[#A99DBF]">Target</span>
            {TARGETS.map(t => (
              <button key={t} onClick={() => setTarget(t)} aria-pressed={target === t}
                className="h-9 px-3 rounded-lg font-bold" style={{ background: target === t ? 'rgba(157,0,255,0.25)' : 'transparent', border: `1px solid ${target === t ? '#9D00FF' : 'rgba(157,0,255,0.25)'}`, color: target === t ? '#fff' : '#9B8FB0' }}>{t}</button>
            ))}
          </div>
          {conv && source && (
            <p className="text-sm text-[#D9D0E8] mt-4 leading-relaxed">
              {conv.relation === 'straight'
                ? <>At {Math.round(source)} BPM, speed it {conv.percent >= 0 ? 'up' : 'down'} by <strong className="text-white">{Math.abs(conv.percent).toFixed(1)}%</strong> to reach {target} BPM</>
                : <>Treat it as <strong className="text-white">{conv.relation}</strong> ({Math.round(conv.effective)} BPM), then speed it {conv.percent >= 0 ? 'up' : 'down'} by <strong className="text-white">{Math.abs(conv.percent).toFixed(1)}%</strong> to reach {target} BPM</>}
              {' '}(about {Math.abs(conv.semitones).toFixed(1)} semitones {conv.semitones >= 0 ? 'higher' : 'lower'} if you don't keep the pitch).
            </p>
          )}
        </div>
      </section>

      <section className="p-5 md:p-7" style={CARD_STYLE}>
        <h2 className="text-lg md:text-xl font-black text-white mb-4">Common questions</h2>
        <div className="flex flex-col gap-5">
          {p.faq.map(f => <div key={f.q}><h3 className="text-sm md:text-base font-bold text-white">{f.q}</h3><p className="text-sm text-[#A99DBF] leading-relaxed mt-1">{f.a}</p></div>)}
        </div>
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
