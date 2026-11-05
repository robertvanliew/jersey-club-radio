// Original Jersey club one-shots for the sound board (/jersey-club-bed-squeak). Every sound
// is synthesized here (no samples from records), so all of them are free to use (CC0).
import { VOICES } from './jerseyDrums';

type Voice = (ctx: BaseAudioContext, out: AudioNode, t: number) => void;
export type ClubSound = { id: string; name: string; group: 'Squeaks' | 'Kicks' | 'Claps' | 'Hats & extras'; length: number; play: Voice };

let noiseBuf: AudioBuffer | null = null;
const noise = (ctx: BaseAudioContext) => {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
};

/** A creak: a buzzy tone whose pitch bends and wobbles through a resonant filter, like old springs */
function creak(ctx: BaseAudioContext, out: AudioNode, t: number, o: { f0: number; f1: number; f2: number; dur: number; wobble: number; q: number; gain: number }) {
  const osc = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(o.f0, t);
  osc.frequency.linearRampToValueAtTime(o.f1, t + o.dur * 0.4);
  osc.frequency.linearRampToValueAtTime(o.f2, t + o.dur);
  lfo.frequency.value = o.wobble; lg.gain.value = o.f0 * 0.12; lfo.connect(lg).connect(osc.frequency);
  bp.type = 'bandpass'; bp.frequency.value = (o.f0 + o.f1) * 0.8; bp.Q.value = o.q;
  const lvl = o.gain * 3; // the narrow band-pass removes most of the level; make it back up
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl, t + 0.015); g.gain.setValueAtTime(lvl, t + o.dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(bp).connect(g).connect(out);
  osc.start(t); lfo.start(t); osc.stop(t + o.dur + 0.02); lfo.stop(t + o.dur + 0.02);
}

function boomKick(ctx: BaseAudioContext, out: AudioNode, t: number) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  o.connect(g).connect(out); o.start(t); o.stop(t + 0.72);
}

function rim(ctx: BaseAudioContext, out: AudioNode, t: number) {
  const o = ctx.createOscillator(), g = ctx.createGain(), bp = ctx.createBiquadFilter();
  o.type = 'square'; o.frequency.value = 1700; bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 4;
  g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(bp).connect(g).connect(out); o.start(t); o.stop(t + 0.06);
}

function openHat(ctx: BaseAudioContext, out: AudioNode, t: number) {
  const hp = ctx.createBiquadFilter(), g = ctx.createGain(), s = ctx.createBufferSource();
  hp.type = 'highpass'; hp.frequency.value = 7000; s.buffer = noise(ctx);
  g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  s.connect(hp).connect(g).connect(out); s.start(t, 0, 0.4);
}

function gunHit(ctx: BaseAudioContext, out: AudioNode, t: number) {
  // A sharp burst with a falling body: an original take on the "shot" hits used in club tracks
  const s = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise(ctx); lp.type = 'lowpass'; lp.frequency.setValueAtTime(6000, t); lp.frequency.exponentialRampToValueAtTime(300, t + 0.4);
  g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  s.connect(lp).connect(g).connect(out); s.start(t, 0, 0.5);
  const k = ctx.createGain(); k.gain.value = 0.6; k.connect(out); boomKick(ctx, k, t);
}

export const SOUNDS: ClubSound[] = [
  { id: 'squeak-classic', name: 'Creak (classic)', group: 'Squeaks', length: 0.25, play: (c, o, t) => creak(c, o, t, { f0: 900, f1: 1400, f2: 1100, dur: 0.2, wobble: 38, q: 6, gain: 0.45 }) },
  { id: 'squeak-long', name: 'Long creak', group: 'Squeaks', length: 0.5, play: (c, o, t) => creak(c, o, t, { f0: 700, f1: 1200, f2: 800, dur: 0.45, wobble: 24, q: 7, gain: 0.4 }) },
  { id: 'squeak-high', name: 'High squeak', group: 'Squeaks', length: 0.2, play: (c, o, t) => creak(c, o, t, { f0: 1600, f1: 2300, f2: 1900, dur: 0.15, wobble: 45, q: 8, gain: 0.35 }) },
  { id: 'squeak-double', name: 'Double creak', group: 'Squeaks', length: 0.45, play: (c, o, t) => { creak(c, o, t, { f0: 900, f1: 1400, f2: 1100, dur: 0.17, wobble: 38, q: 6, gain: 0.42 }); creak(c, o, t + 0.2, { f0: 1000, f1: 1500, f2: 1150, dur: 0.17, wobble: 40, q: 6, gain: 0.45 }); } },
  { id: 'kick-punch', name: 'Punch kick', group: 'Kicks', length: 0.4, play: (c, o, t) => VOICES.kick(c, o, t, 1) },
  { id: 'kick-boom', name: 'Boom kick', group: 'Kicks', length: 0.75, play: boomKick },
  { id: 'kick-roll', name: 'Kick roll', group: 'Kicks', length: 0.9, play: (c, o, t) => { for (let k = 0; k < 6; k++) VOICES.kick(c, o, t + k * (60 / 140 / 6), 0.6 + k * 0.08); } },
  { id: 'clap', name: 'Clap', group: 'Claps', length: 0.3, play: (c, o, t) => VOICES.clap(c, o, t, 1) },
  { id: 'clap-stack', name: 'Clap stack', group: 'Claps', length: 0.35, play: (c, o, t) => { VOICES.clap(c, o, t, 1); rim(c, o, t + 0.004); } },
  { id: 'hat', name: 'Closed hat', group: 'Hats & extras', length: 0.1, play: (c, o, t) => VOICES.hat(c, o, t, 1) },
  { id: 'hat-open', name: 'Open hat', group: 'Hats & extras', length: 0.4, play: openHat },
  { id: 'shot', name: 'Shot hit', group: 'Hats & extras', length: 0.75, play: gunHit },
];

/** Render one sound to an AudioBuffer (for WAV download) */
export async function renderSound(s: ClubSound): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(1, Math.ceil((s.length + 0.05) * 44100), 44100);
  const out = ctx.createGain(); out.gain.value = 0.9; out.connect(ctx.destination);
  s.play(ctx, out, 0.005);
  const buf = await ctx.startRendering();
  // Normalize downloads to the same peak so every sound arrives at a usable level
  const d = buf.getChannelData(0); let peak = 0;
  for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  if (peak > 0) { const k = 0.89 / peak; for (let i = 0; i < d.length; i++) d[i] *= k; }
  return buf;
}
