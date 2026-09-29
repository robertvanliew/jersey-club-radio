// EQ Mix — DJ-style transition curves (blend with EQ, not the fader; no song analysis).
// Pure functions of "seconds since the transition started" so the engine can sample
// them onto the Web Audio clock, and so every curve is unit-tested.
//
// Timeline (seconds):
//   0 ─── LEAD_IN ─────────── SWAP_AT ─────────── TOTAL
//   outgoing: full volume, Rise sweep + mid dip · full volume · bass out, filters up, fades, echo tail
//   incoming: silent · highs first (highpass opens down), bass cut, volume up fast · full range at the swap

export const LEAD_IN = 5;                          // solo fade-out before the incoming track starts
export const OVERLAP = 10;                         // both tracks audible
export const TOTAL = LEAD_IN + OVERLAP;
export const SWAP_AT = LEAD_IN + OVERLAP / 2;      // bass swap: mid-overlap
export const UI_SWITCH_AT = 10;                    // "now playing" flips to the incoming track
export const BASS_CUT_DB = -24;                    // lowshelf cut when a deck's bass is "out"
export const BASS_SHELF_HZ = 200;
export const NEUTRAL_HP_HZ = 20;                   // highpass at 20 Hz is effectively bypassed
export const RISE_HP_HZ = 150;                     // Rise thins the outgoing low end up to here
export const OUT_FILTER_END_HZ = 800;              // after the swap the outgoing filters out up to here
export const IN_HP_START_HZ = 350;                 // incoming enters highs-only, opening down from here
export const IN_HP_SWAP_HZ = 60;                   // ...to here by the swap (bass then drops in fully)
export const MID_SCOOP_DB = -5;                    // outgoing mid dip that makes room for the incoming
export const MID_FREQ_HZ = 1200;
export const ECHO_SEND_MAX = 0.6;                  // outgoing echo-out level at the very end
export const ECHO_SECONDS = 2.5;                   // echo builds over the last seconds
export const ECHO_DELAY_S = 0.32;
export const ECHO_FEEDBACK = 0.45;
export const QUIET_WINDOW = 5;                     // readings (~2s at the 400ms player tick)
export const EARLY_START_WINDOW = 30;              // only look for a quiet ending in the last 30s
export const MIN_TRACK_FOR_XFADE = 30;             // don't crossfade tracks shorter than this

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function equalPowerOut(t: number): number { return Math.pow(Math.cos(t * Math.PI * 0.5), 1.5); }
export function equalPowerIn(t: number): number { return Math.pow(Math.sin(t * Math.PI * 0.5), 1.5); }

const expSweep = (from: number, to: number, k: number) => from * Math.pow(to / from, clamp01(k));

/** Outgoing volume (0..1 of master): full until the swap, then an equal-power fade out */
export function outGainAt(t: number): number {
  if (t < SWAP_AT) return 1;
  return equalPowerOut(clamp01((t - SWAP_AT) / (TOTAL - SWAP_AT)));
}

/** Incoming volume (0..1 of master): up fast during the bring-in (EQ does the blending) */
export function inGainAt(t: number): number {
  if (t < LEAD_IN) return 0;
  if (t < SWAP_AT) return 0.95 * equalPowerIn(clamp01((t - LEAD_IN) / ((SWAP_AT - LEAD_IN) * 0.6)));
  return 0.95 + 0.05 * clamp01(t - SWAP_AT);
}

/** Outgoing highpass (Hz): Rise over the lead-in, hold, then filter out after the swap */
export function outHighpassAt(t: number): number {
  if (t < LEAD_IN) return expSweep(NEUTRAL_HP_HZ, RISE_HP_HZ, t / LEAD_IN);
  if (t < SWAP_AT) return RISE_HP_HZ;
  return expSweep(RISE_HP_HZ, OUT_FILTER_END_HZ, (t - SWAP_AT) / (TOTAL - SWAP_AT));
}

/** Incoming highpass (Hz): enters highs-only and opens downward; fully open from the swap */
export function inHighpassAt(t: number): number {
  if (t >= SWAP_AT) return NEUTRAL_HP_HZ;
  if (t < LEAD_IN) return IN_HP_START_HZ;
  return expSweep(IN_HP_START_HZ, IN_HP_SWAP_HZ, (t - LEAD_IN) / (SWAP_AT - LEAD_IN));
}

/** Outgoing mid dip (dB) that makes room for the incoming track */
export function outMidDbAt(t: number): number {
  return MID_SCOOP_DB * clamp01(t / LEAD_IN) + 0; // "+ 0" turns -0 into 0
}

/** Outgoing echo send (0..1): builds over the last few seconds for an echo-out ending */
export function outEchoSendAt(t: number): number {
  return ECHO_SEND_MAX * clamp01((t - (TOTAL - ECHO_SECONDS)) / ECHO_SECONDS);
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
