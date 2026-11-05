// Jersey club drum patterns, a small Web Audio drum synth to preview them, and a
// standard MIDI file writer to export them. Used by /jersey-club-kick-pattern.
//
// The classic Jersey club kick: in one bar of 16th notes, kicks on steps 1, 5, 9, 12 and 15
// (counting from 1). Native Instruments describes the same rhythm as "two quarter-note
// kicks, two dotted eighths and an eighth". Phrases often end with a fast kick roll in
// 16th-note triplets, which is the "bounce" people recognize.

export const LANES = ['kick', 'clap', 'hat', 'squeak'] as const;
export type Lane = typeof LANES[number];
export const STEPS = 32; // 2 bars of 16th notes
export type Grid = Record<Lane, boolean[]>;

const on = (steps: number[]) => Array.from({ length: STEPS }, (_, i) => steps.includes(i));
const twice = (bar: number[]) => [...bar, ...bar.map(s => s + 16)];
const CLASSIC_KICK = [0, 4, 8, 11, 14];

export type Preset = { id: string; name: string; note: string; grid: Grid; roll: boolean };

export const PRESETS: Preset[] = [
  {
    id: 'classic', name: 'Classic Jersey kick', roll: true,
    note: 'The five-kick pattern on steps 1, 5, 9, 12 and 15, claps on 2 and 4, and a kick roll to end the phrase.',
    grid: { kick: on(twice(CLASSIC_KICK)), clap: on(twice([4, 12])), hat: on(twice([2, 6, 10, 14])), squeak: on([22, 30]) },
  },
  {
    id: 'bounce', name: 'Bounce', roll: true,
    note: 'Bar one plays the classic pattern; bar two answers with kicks every dotted eighth for a rolling, bouncing feel.',
    grid: { kick: on([...CLASSIC_KICK, 16, 19, 22, 24, 27, 30]), clap: on(twice([4, 12])), hat: on(twice([2, 6, 10, 14])), squeak: on([6, 22]) },
  },
  {
    id: 'party', name: 'Party (call-out)', roll: true,
    note: 'Classic kicks with extra claps and squeaks on the offbeats, the busy style made for dance call-outs.',
    grid: { kick: on(twice(CLASSIC_KICK)), clap: on([4, 12, 20, 26, 28]), hat: on(twice([0, 2, 4, 6, 8, 10, 12, 14])), squeak: on([7, 15, 23, 31]) },
  },
  {
    id: 'stripped', name: 'Kick only', roll: false,
    note: 'Just the five-kick skeleton, to hear the rhythm on its own.',
    grid: { kick: on(twice(CLASSIC_KICK)), clap: on([]), hat: on([]), squeak: on([]) },
  },
];

export const cloneGrid = (g: Grid): Grid => ({ kick: [...g.kick], clap: [...g.clap], hat: [...g.hat], squeak: [...g.squeak] });

/** Every hit in the 2-bar loop, in 16th-note units from the start (rolls land between steps) */
export function events(grid: Grid, roll: boolean): { lane: Lane; at: number; vel: number }[] {
  const out: { lane: Lane; at: number; vel: number }[] = [];
  for (const lane of LANES) grid[lane].forEach((v, i) => { if (v) out.push({ lane, at: i, vel: lane === 'kick' && i % 16 === 0 ? 1 : 0.85 }); });
  if (roll) {
    // Six 16th-note-triplet kicks over the last beat (steps 28 to 32), getting louder
    const kept = out.filter(e => !(e.lane === 'kick' && e.at >= 28));
    for (let k = 0; k < 6; k++) kept.push({ lane: 'kick', at: 28 + k * (4 / 6), vel: 0.6 + k * 0.08 });
    return kept.sort((a, b) => a.at - b.at);
  }
  return out.sort((a, b) => a.at - b.at);
}

// ── Synth ────────────────────────────────────────────────────────────────────

let noiseBuf: AudioBuffer | null = null;
function noise(ctx: BaseAudioContext) {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}
function drive(ctx: BaseAudioContext, amount: number) {
  const ws = ctx.createWaveShaper();
  const n = 1024, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * amount) / Math.tanh(amount); }
  ws.curve = c;
  return ws;
}

/** Punchy, slightly driven club kick: fast pitch drop + click */
function kick(ctx: BaseAudioContext, out: AudioNode, t: number, vel: number) {
  const o = ctx.createOscillator(), g = ctx.createGain(), ws = drive(ctx, 2.2);
  o.type = 'sine';
  o.frequency.setValueAtTime(170, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.09);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vel, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  o.connect(ws).connect(g).connect(out);
  o.start(t); o.stop(t + 0.34);
  // Click transient so it cuts through on small speakers
  const c = ctx.createBufferSource(), cg = ctx.createGain(), hp = ctx.createBiquadFilter();
  c.buffer = noise(ctx); hp.type = 'highpass'; hp.frequency.value = 2500;
  cg.gain.setValueAtTime(0.25 * vel, t); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
  c.connect(hp).connect(cg).connect(out); c.start(t, Math.random() * 0.5, 0.02);
}

/** Layered hand clap: three quick noise bursts then a short tail */
function clap(ctx: BaseAudioContext, out: AudioNode, t: number, vel: number) {
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 0.9;
  const g = ctx.createGain(); bp.connect(g).connect(out);
  g.gain.setValueAtTime(0.0001, t);
  [0, 0.011, 0.022].forEach(dt => { g.gain.setValueAtTime(0.9 * vel, t + dt); g.gain.exponentialRampToValueAtTime(0.15 * vel, t + dt + 0.009); });
  g.gain.setValueAtTime(0.7 * vel, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  const s = ctx.createBufferSource(); s.buffer = noise(ctx); s.connect(bp); s.start(t, Math.random() * 0.5, 0.25);
}

function hat(ctx: BaseAudioContext, out: AudioNode, t: number, vel: number) {
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 8000;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.3 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  const s = ctx.createBufferSource(); s.buffer = noise(ctx); s.connect(hp).connect(g).connect(out); s.start(t, Math.random() * 0.5, 0.05);
}

/** An original squeak-style creak (not the "Some Cut" sample): a wobbling, resonant chirp */
function squeak(ctx: BaseAudioContext, out: AudioNode, t: number, vel: number) {
  const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(900, t); o.frequency.linearRampToValueAtTime(1400, t + 0.07); o.frequency.linearRampToValueAtTime(1100, t + 0.16);
  lfo.frequency.value = 38; lg.gain.value = 120; lfo.connect(lg).connect(o.frequency);
  bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 6;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35 * vel, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(bp).connect(g).connect(out);
  o.start(t); lfo.start(t); o.stop(t + 0.2); lfo.stop(t + 0.2);
}

export const VOICES: Record<Lane, (ctx: BaseAudioContext, out: AudioNode, t: number, vel: number) => void> = { kick, clap, hat, squeak };

// ── MIDI ─────────────────────────────────────────────────────────────────────

/** General MIDI drum notes (channel 10). Squeak uses C4 so you can map any sound to it. */
export const MIDI_NOTES: Record<Lane, number> = { kick: 36, clap: 39, hat: 42, squeak: 60 };
const PPQ = 96;

const vlq = (n: number) => {
  const bytes = [n & 0x7f];
  while ((n >>= 7)) bytes.unshift((n & 0x7f) | 0x80);
  return bytes;
};

/** Standard MIDI file (format 0) of the loop, repeated `loops` times */
export function toMidi(grid: Grid, roll: boolean, bpm: number, loops = 4): Uint8Array {
  const ev = events(grid, roll);
  const tick16 = PPQ / 4;
  const msgs: { t: number; d: number[] }[] = [];
  for (let l = 0; l < loops; l++) for (const e of ev) {
    const t = Math.round((l * STEPS + e.at) * tick16);
    const note = MIDI_NOTES[e.lane], vel = Math.max(1, Math.min(127, Math.round(e.vel * 110)));
    msgs.push({ t, d: [0x99, note, vel] }, { t: t + tick16 / 2, d: [0x89, note, 0] });
  }
  msgs.sort((a, b) => a.t - b.t || (a.d[0] === 0x89 ? -1 : 1));
  const usPerQ = Math.round(60_000_000 / bpm);
  const body: number[] = [0x00, 0xff, 0x51, 0x03, (usPerQ >> 16) & 0xff, (usPerQ >> 8) & 0xff, usPerQ & 0xff, 0x00, 0xff, 0x58, 0x04, 4, 2, 24, 8];
  let last = 0;
  for (const m of msgs) { body.push(...vlq(m.t - last), ...m.d); last = m.t; }
  body.push(0x00, 0xff, 0x2f, 0x00);
  const len = body.length;
  return new Uint8Array([
    0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (PPQ >> 8) & 0xff, PPQ & 0xff,
    0x4d, 0x54, 0x72, 0x6b, (len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff,
    ...body,
  ]);
}
