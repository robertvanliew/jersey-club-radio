// EQ Mix — DJ-style transition curves (Spotify-style EQ fade + Rise, no song analysis).
// Pure functions of "seconds since the transition started" so the engine can sample
// them onto the Web Audio clock, and so every curve is unit-tested.
//
// Timeline (seconds):
//   0 ─── LEAD_IN ─────────── SWAP_AT ─────────── TOTAL
//   outgoing: 100% → 80%, highpass sweeps up (Rise) · then fades out; bass cut at SWAP_AT
//   incoming: silent            · fades in with bass cut · bass restored at SWAP_AT

export const LEAD_IN = 5;                          // solo fade-out before the incoming track starts
export const OVERLAP = 10;                         // both tracks audible
export const TOTAL = LEAD_IN + OVERLAP;
export const SWAP_AT = LEAD_IN + OVERLAP / 2;      // bass swap: mid-overlap
export const UI_SWITCH_AT = 10;                    // "now playing" flips to the incoming track
export const BASS_CUT_DB = -24;                    // lowshelf cut when a deck's bass is "out"
export const BASS_SHELF_HZ = 200;
export const NEUTRAL_HP_HZ = 20;                   // highpass at 20 Hz is effectively bypassed
export const RISE_HP_HZ = 150;                     // Rise thins the outgoing low end up to here
export const QUIET_WINDOW = 5;                     // readings (~2s at the 400ms player tick)
export const EARLY_START_WINDOW = 30;              // only look for a quiet ending in the last 30s
export const MIN_TRACK_FOR_XFADE = 30;             // don't crossfade tracks shorter than this

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function equalPowerOut(t: number): number { return Math.pow(Math.cos(t * Math.PI * 0.5), 1.5); }
export function equalPowerIn(t: number): number { return Math.pow(Math.sin(t * Math.PI * 0.5), 1.5); }

/** Outgoing volume (0..1 of master) at `t` seconds into the transition */
export function outGainAt(t: number): number {
  if (t < LEAD_IN) {
    const t1 = clamp01(t / LEAD_IN);
    return 0.8 + 0.2 * (1 - t1 * t1); // accelerating ease 100% -> 80%
  }
  return 0.8 * equalPowerOut(clamp01((t - LEAD_IN) / OVERLAP));
}

/** Incoming volume (0..1 of master) at `t` seconds into the transition */
export function inGainAt(t: number): number {
  if (t < LEAD_IN) return 0;
  return equalPowerIn(clamp01((t - LEAD_IN) / OVERLAP));
}

/** Rise: outgoing highpass cutoff (Hz), exponential sweep over the lead-in, then held */
export function outHighpassAt(t: number): number {
  const k = clamp01(t / LEAD_IN);
  return NEUTRAL_HP_HZ * Math.pow(RISE_HP_HZ / NEUTRAL_HP_HZ, k);
}

/** Bass swap: lowshelf gain (dB) for the outgoing or incoming deck */
export function lowshelfDbAt(role: 'out' | 'in', t: number): number {
  const swapped = t >= SWAP_AT;
  if (role === 'in') return swapped ? 0 : BASS_CUT_DB;
  return swapped ? BASS_CUT_DB : 0;
}

/** Sample `fn` from `from` to TOTAL into a curve for AudioParam.setValueCurveAtTime */
export function sampleCurve(fn: (t: number) => number, from: number, points: number, scale = 1): Float32Array {
  const n = Math.max(2, points);
  const out = new Float32Array(n);
  const span = Math.max(0, TOTAL - from);
  for (let i = 0; i < n; i++) out[i] = fn(from + (span * i) / (n - 1)) * scale;
  return out;
}

/** The song has gone quiet (fade-out or silent tail): every recent reading < 25% of typical */
export function isQuietTail(recent: number[], typical: number): boolean {
  if (typical <= 0.001 || recent.length < QUIET_WINDOW) return false;
  return recent.slice(-QUIET_WINDOW).every(r => r < typical * 0.25);
}

/** Start the transition before the normal 15s-before-the-end trigger? */
export function shouldStartEarly(pos: number, duration: number, quiet: boolean): boolean {
  if (!quiet || !(duration > MIN_TRACK_FOR_XFADE)) return false;
  const remaining = duration - pos;
  return remaining <= EARLY_START_WINDOW && remaining > TOTAL;
}
