// EQ Mix — DJ-style transition curves (blend with EQ, not the fader; no song analysis).
// Pure functions of "seconds since the transition started" so the engine can sample
// them onto the Web Audio clock, and so every curve is unit-tested.
//
// The two songs are never beat-matched (no tempo analysis), so their drums must not play
// loudly together: two grooves at different tempos clash and sound like the music is
// speeding up and slowing down. So this is an "echo out, drop in" swap, the standard DJ move
// for songs that aren't beat-matched: the incoming song is only a quiet, highs-only tease
// until the swap; then the outgoing song echoes out in about a second and a half while the
// incoming comes up to full. Both are loud together for only about a second.
//
// Timeline (seconds):
//   0 ─── LEAD_IN ─────────── SWAP_AT ─── +DROP ─────── TOTAL
//   outgoing: full, Rise sweep + mid dip · full, echo builds · drops out on the echo · (silent)
//   incoming: silent · quiet tease, highs only, bass cut · up to full, full range · full

export const LEAD_IN = 5;                          // solo fade-out before the incoming track starts
export const OVERLAP = 10;                         // incoming playing while the outgoing still runs
export const TOTAL = LEAD_IN + OVERLAP;
export const SWAP_AT = LEAD_IN + OVERLAP / 2;      // bass swap + drop: mid-overlap
export const UI_SWITCH_AT = 10;                    // "now playing" flips to the incoming track
export const BASS_CUT_DB = -24;                    // lowshelf cut when a deck's bass is "out"
export const BASS_SHELF_HZ = 200;
export const NEUTRAL_HP_HZ = 20;                   // highpass at 20 Hz is effectively bypassed
export const RISE_HP_HZ = 150;                     // Rise thins the outgoing low end up to here
export const OUT_FILTER_END_HZ = 800;              // after the swap the outgoing (echo) filters out up to here
export const IN_HP_START_HZ = 350;                 // the tease enters highs-only from here
export const IN_HP_SWAP_HZ = 200;                  // ...and stays thin (no kick or bass) until the swap
export const TEASE_GAIN = 0.25;                    // incoming level before the swap: a hint, not a second groove
export const DROP_SECONDS = 1.5;                   // outgoing gone this long after the swap
export const RISE_IN_SECONDS = 1;                  // incoming reaches full this long after it starts rising
export const MID_SCOOP_DB = -5;                    // outgoing mid dip that makes room for the incoming
export const MID_FREQ_HZ = 1200;
export const ECHO_SEND_MAX = 0.6;                  // outgoing echo-out level from the swap on
export const ECHO_SECONDS = 1.5;                   // echo builds over the seconds before the swap
export const ECHO_DELAY_S = 0.32;
export const ECHO_FEEDBACK = 0.45;
export const QUIET_WINDOW = 5;                     // readings (~2s at the 400ms player tick)
export const EARLY_START_WINDOW = 30;              // only look for a quiet ending in the last 30s
export const MIN_TRACK_FOR_XFADE = 30;             // don't crossfade tracks shorter than this

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function equalPowerOut(t: number): number { return Math.pow(Math.cos(t * Math.PI * 0.5), 1.5); }
export function equalPowerIn(t: number): number { return Math.pow(Math.sin(t * Math.PI * 0.5), 1.5); }

const expSweep = (from: number, to: number, k: number) => from * Math.pow(to / from, clamp01(k));

/** Outgoing volume (0..1 of master): full until the swap, then drops out fast (the echo carries it) */
export function outGainAt(t: number): number {
  if (t < SWAP_AT) return 1;
  return equalPowerOut(clamp01((t - SWAP_AT) / DROP_SECONDS));
}

/** When the incoming starts rising from the tease to full (just before the swap) */
const IN_RISE_AT = SWAP_AT - 0.25;

/** Incoming volume (0..1 of master): a quiet tease during the bring-in, full right after the swap */
export function inGainAt(t: number): number {
  if (t < LEAD_IN) return 0;
  if (t < IN_RISE_AT) return TEASE_GAIN * equalPowerIn(clamp01((t - LEAD_IN) / (SWAP_AT - 1 - LEAD_IN)));
  return TEASE_GAIN + (1 - TEASE_GAIN) * equalPowerIn(clamp01((t - IN_RISE_AT) / RISE_IN_SECONDS));
}

/** Outgoing highpass (Hz): Rise over the lead-in, hold, then filter out after the swap */
export function outHighpassAt(t: number): number {
  if (t < LEAD_IN) return expSweep(NEUTRAL_HP_HZ, RISE_HP_HZ, t / LEAD_IN);
  if (t < SWAP_AT) return RISE_HP_HZ;
  return expSweep(RISE_HP_HZ, OUT_FILTER_END_HZ, (t - SWAP_AT) / (TOTAL - SWAP_AT));
}

/** Incoming highpass (Hz): the tease stays highs-only (no kick); fully open from the swap */
export function inHighpassAt(t: number): number {
  if (t >= SWAP_AT) return NEUTRAL_HP_HZ;
  if (t < LEAD_IN) return IN_HP_START_HZ;
  return expSweep(IN_HP_START_HZ, IN_HP_SWAP_HZ, (t - LEAD_IN) / (SWAP_AT - LEAD_IN));
}

/** Outgoing mid dip (dB) that makes room for the incoming track */
export function outMidDbAt(t: number): number {
  return MID_SCOOP_DB * clamp01(t / LEAD_IN) + 0; // "+ 0" turns -0 into 0
}

/** Outgoing echo send (0..1): builds into the swap, so the drop-out leaves an echo tail */
export function outEchoSendAt(t: number): number {
  return ECHO_SEND_MAX * clamp01((t - (SWAP_AT - ECHO_SECONDS)) / ECHO_SECONDS);
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
