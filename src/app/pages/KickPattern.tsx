import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Play, Square, Download, FileAudio } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { KICK_PAGE } from '../../data/seo/kickPattern.mjs';
import { PRESETS, LANES, STEPS, VOICES, cloneGrid, events, toMidi, type Grid, type Lane } from '../lib/jerseyDrums';
import { setHead } from '../lib/head';
import { wavBlob as wav, saveFile as save } from '../lib/audioFile';
import { CARD_STYLE } from '../components/RisingNow';

const LANE_LABEL: Record<Lane, string> = { kick: 'Kick', clap: 'Clap', hat: 'Hat', squeak: 'Squeak' };
const LANE_COLOR: Record<Lane, string> = { kick: '#FF0080', clap: '#C77DFF', hat: '#7B6FFF', squeak: '#FFB020' };
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** Schedule one 2-bar loop starting at `start` on any (Offline)AudioContext */
function scheduleLoop(ctx: BaseAudioContext, out: AudioNode, grid: Grid, roll: boolean, bpm: number, start: number) {
  const step = 60 / bpm / 4;
  for (const e of events(grid, roll)) VOICES[e.lane](ctx, out, start + e.at * step, e.vel);
}

/** /jersey-club-kick-pattern: hear the classic Jersey club kick, edit it, download MIDI or WAV */
export function KickPattern() {
  const p = KICK_PAGE;
  const { isPlaying: stationPlaying, togglePlay } = usePlayer();
  useEffect(() => { setHead({ title: p.title, description: p.description, path: p.path }); }, []);

  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [grid, setGrid] = useState<Grid>(() => cloneGrid(PRESETS[0].grid));
  const [roll, setRoll] = useState(PRESETS[0].roll);
  const [bpm, setBpm] = useState(140);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(-1);

  // Live values for the scheduler (edits apply on the next loop without restarting)
  const live = useRef({ grid, roll, bpm });
  live.current = { grid, roll, bpm };
  const engine = useRef<{ ctx: AudioContext; out: GainNode; next: number; timer: number; raf: number; loopStart: number } | null>(null);

  const stop = () => {
    const e = engine.current; if (!e) return;
    clearInterval(e.timer); cancelAnimationFrame(e.raf); e.ctx.close().catch(() => { });
    engine.current = null; setPlaying(false); setCursor(-1);
  };
  useEffect(() => stop, []);

  const start = () => {
    if (stationPlaying) togglePlay(); // two beats at once would clash
    const ctx = new AudioContext({ latencyHint: 'interactive' });
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 3;
    const out = ctx.createGain(); out.gain.value = 0.9; out.connect(comp).connect(ctx.destination);
    const e = { ctx, out, next: ctx.currentTime + 0.08, timer: 0, raf: 0, loopStart: ctx.currentTime + 0.08 };
    // Lookahead scheduler: queue each loop on the audio clock a little before it starts
    const tick = () => {
      while (e.next < ctx.currentTime + 0.25) {
        const { grid: g, roll: r, bpm: b } = live.current;
        scheduleLoop(ctx, out, g, r, b, e.next);
        e.loopStart = e.next;
        e.next += (60 / b / 4) * STEPS;
      }
    };
    tick(); e.timer = window.setInterval(tick, 50);
    const draw = () => {
      const step = 60 / live.current.bpm / 4;
      const t = ctx.currentTime - (e.next - step * STEPS);
      setCursor(t >= 0 ? Math.floor(t / step) % STEPS : -1);
      e.raf = requestAnimationFrame(draw);
    };
    draw();
    engine.current = e; setPlaying(true);
  };

  const pick = (id: string) => {
    const pr = PRESETS.find(x => x.id === id)!;
    setPresetId(id); setGrid(cloneGrid(pr.grid)); setRoll(pr.roll);
  };
  const toggle = (lane: Lane, i: number) => setGrid(g => { const n = cloneGrid(g); n[lane][i] = !n[lane][i]; return n; });

  const downloadMidi = () => save(new Blob([toMidi(grid, roll, bpm)], { type: 'audio/midi' }), `jersey-club-kick-pattern-${bpm}bpm.mid`);
  const downloadWav = async () => {
    const loops = 4, secs = (60 / bpm / 4) * STEPS * loops + 0.5;
    const ctx = new OfflineAudioContext(2, Math.ceil(secs * 44100), 44100);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 3;
    const out = ctx.createGain(); out.gain.value = 0.9; out.connect(comp).connect(ctx.destination);
    for (let l = 0; l < loops; l++) scheduleLoop(ctx, out, grid, roll, bpm, l * (60 / bpm / 4) * STEPS);
    save(wav(await ctx.startRendering()), `jersey-club-beat-${bpm}bpm.wav`);
  };

  const preset = PRESETS.find(x => x.id === presetId)!;

  return (
    <article className="max-w-4xl mx-auto w-full pb-10 flex flex-col gap-5">
      <header className="p-5 md:p-7" style={CARD_STYLE}>
        <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">{p.heading}</h1>
        <p className="text-xs text-[#7B6F90] mt-2">By <a href="https://robertvanliew.com" target="_blank" rel="author noopener" className="text-[#C080FF] hover:text-white">Robert Van Liew</a> · Last updated {fmtDate(p.updated)}</p>
        <p className="text-sm md:text-base text-[#D9D0E8] leading-relaxed mt-4">{p.answer}</p>
      </header>

      <section className="p-4 md:p-6" style={CARD_STYLE} aria-labelledby="tool">
        <h2 id="tool" className="sr-only">Kick pattern generator</h2>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map(pr => (
            <button key={pr.id} onClick={() => pick(pr.id)} aria-pressed={presetId === pr.id}
              className="h-9 px-3 rounded-lg text-xs font-bold" style={{ background: presetId === pr.id ? 'rgba(157,0,255,0.25)' : 'transparent', border: `1px solid ${presetId === pr.id ? '#9D00FF' : 'rgba(157,0,255,0.25)'}`, color: presetId === pr.id ? '#fff' : '#9B8FB0' }}>
              {pr.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#A99DBF] mt-2">{preset.note}</p>

        <div className="flex flex-wrap items-center gap-4 mt-4">
          <button onClick={playing ? stop : start} className="h-12 px-6 rounded-full font-bold text-white flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #9D00FF, #FF0080)', boxShadow: '0 8px 30px rgba(157,0,255,0.3)' }}>
            {playing ? <><Square className="w-4 h-4" /> Stop</> : <><Play className="w-4 h-4" /> Play the pattern</>}
          </button>
          <label className="flex items-center gap-2 text-sm text-[#A99DBF]">
            BPM <input type="range" min={125} max={160} value={bpm} onChange={e => setBpm(Number(e.target.value))} className="w-32 accent-[#9D00FF]" />
            <span className="text-white font-bold tabular-nums w-8">{bpm}</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-[#A99DBF] cursor-pointer">
            <input type="checkbox" checked={roll} onChange={e => setRoll(e.target.checked)} className="accent-[#FF0080]" /> Kick roll at the end
          </label>
        </div>

        {/* 2 bars × 16 steps; scrolls sideways on small screens */}
        <div className="mt-5 overflow-x-auto pb-2">
          <div className="min-w-[640px]">
            {LANES.map(lane => (
              <div key={lane} className="flex items-center gap-2 mb-1.5">
                <span className="w-14 shrink-0 text-xs font-bold" style={{ color: LANE_COLOR[lane] }}>{LANE_LABEL[lane]}</span>
                <div className="grid grid-cols-32 gap-[3px] flex-1" style={{ gridTemplateColumns: 'repeat(32, minmax(0, 1fr))' }}>
                  {grid[lane].map((v, i) => (
                    <button key={i} onClick={() => toggle(lane, i)} aria-label={`${LANE_LABEL[lane]} step ${i + 1}${v ? ' on' : ''}`} aria-pressed={v}
                      className="h-7 rounded-[4px] transition-colors"
                      style={{
                        background: v ? LANE_COLOR[lane] : (Math.floor(i / 4) % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.09)'),
                        outline: cursor === i ? '2px solid #fff' : 'none',
                        marginLeft: i === 16 ? 6 : 0,
                      }} />
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-2 text-[10px] text-[#7B6F90]"><span className="w-14 shrink-0" /><span className="flex-1">Bar 1</span><span className="flex-1 pl-2">Bar 2</span></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={downloadMidi} className="h-10 px-4 rounded-lg text-sm font-bold text-white flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #9D00FF, #FF0080)' }}>
            <Download className="w-4 h-4" /> Download MIDI
          </button>
          <button onClick={downloadWav} className="h-10 px-4 rounded-lg text-sm font-bold text-[#C77DFF] flex items-center gap-2" style={{ border: '1px solid rgba(157,0,255,0.35)' }}>
            <FileAudio className="w-4 h-4" /> Download WAV loop
          </button>
        </div>
        <p className="text-xs text-[#7B6F90] mt-2">MIDI uses General MIDI drum notes: kick C1 (36), clap D#1 (39), hat F#1 (42), squeak C4 (60). The sounds are synthesized here and free to use.</p>
      </section>

      <section className="p-5 md:p-7 flex flex-col gap-6" style={CARD_STYLE}>
        {p.sections.map(s => (
          <div key={s.h2}>
            <h2 className="text-lg md:text-xl font-black text-white">{s.h2}</h2>
            {s.body.map((para, i) => <p key={i} className="text-sm md:text-[15px] text-[#C9BFDB] leading-relaxed mt-2">{para}</p>)}
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
