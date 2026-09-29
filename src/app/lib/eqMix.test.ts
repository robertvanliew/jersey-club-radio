import { describe, it, expect } from 'vitest';
import {
  LEAD_IN, TOTAL, SWAP_AT, BASS_CUT_DB, RISE_HP_HZ, NEUTRAL_HP_HZ, MID_SCOOP_DB, OUT_FILTER_END_HZ, IN_HP_START_HZ, ECHO_SEND_MAX,
  IN_HP_SWAP_HZ, TEASE_GAIN, DROP_SECONDS, ECHO_SECONDS,
  outGainAt, inGainAt, outHighpassAt, inHighpassAt, lowshelfDbAt, outMidDbAt, outEchoSendAt, sampleCurve, isQuietTail, shouldStartEarly,
} from './eqMix';

describe('volume: echo out, drop in', () => {
  it('outgoing stays at full volume until the swap, then drops out quickly', () => {
    expect(outGainAt(0)).toBe(1);
    expect(outGainAt(SWAP_AT - 0.01)).toBe(1);
    expect(outGainAt(SWAP_AT + DROP_SECONDS)).toBeCloseTo(0, 5);
    expect(outGainAt(TOTAL)).toBeCloseTo(0, 5);
  });
  it('incoming is silent in the lead-in, only a quiet tease before the swap, full right after', () => {
    expect(inGainAt(LEAD_IN - 0.01)).toBe(0);
    expect(inGainAt(SWAP_AT - 0.5)).toBeGreaterThan(TEASE_GAIN * 0.8);
    expect(inGainAt(SWAP_AT - 0.5)).toBeLessThanOrEqual(TEASE_GAIN + 1e-9);
    expect(inGainAt(SWAP_AT + 1)).toBeCloseTo(1, 5);
    expect(inGainAt(TOTAL)).toBeCloseTo(1, 5);
  });
  it('the two songs are never loud together for more than a moment (unmatched beats would clash)', () => {
    let bothLoud = 0;
    for (let t = 0; t <= TOTAL; t += 0.05) if (outGainAt(t) > 0.5 && inGainAt(t) > 0.5) bothLoud += 0.05;
    expect(bothLoud).toBeLessThan(1.5);
  });
  it('curves are monotonic', () => {
    for (let t = 0; t < TOTAL; t += 0.25) {
      expect(outGainAt(t + 0.25)).toBeLessThanOrEqual(outGainAt(t) + 1e-9);
      expect(inGainAt(t + 0.25)).toBeGreaterThanOrEqual(inGainAt(t) - 1e-9);
    }
  });
});

describe('outgoing filter: Rise, hold, then filter out', () => {
  it('sweeps up over the lead-in and holds until the swap', () => {
    expect(outHighpassAt(0)).toBeCloseTo(NEUTRAL_HP_HZ, 5);
    expect(outHighpassAt(LEAD_IN / 2)).toBeCloseTo(Math.sqrt(NEUTRAL_HP_HZ * RISE_HP_HZ), 3);
    expect(outHighpassAt(LEAD_IN)).toBeCloseTo(RISE_HP_HZ, 5);
    expect(outHighpassAt(SWAP_AT - 0.01)).toBeCloseTo(RISE_HP_HZ, 5);
  });
  it('keeps climbing after the swap so the old track thins out', () => {
    expect(outHighpassAt(TOTAL)).toBeCloseTo(OUT_FILTER_END_HZ, 3);
    expect(outHighpassAt(SWAP_AT + 2)).toBeGreaterThan(RISE_HP_HZ);
  });
  it('mids dip to make room for the incoming track', () => {
    expect(outMidDbAt(0)).toBe(0);
    expect(outMidDbAt(LEAD_IN)).toBeCloseTo(MID_SCOOP_DB, 5);
    expect(outMidDbAt(SWAP_AT)).toBeCloseTo(MID_SCOOP_DB, 5);
  });
  it('echo builds into the swap so the drop-out leaves an echo tail', () => {
    expect(outEchoSendAt(SWAP_AT - ECHO_SECONDS)).toBe(0);
    expect(outEchoSendAt(SWAP_AT)).toBeCloseTo(ECHO_SEND_MAX, 5);
    expect(outEchoSendAt(TOTAL)).toBeCloseTo(ECHO_SEND_MAX, 5);
  });
});

describe('incoming filter: highs-only tease, then full range at the swap', () => {
  it('stays thin (no kick or bass) through the bring-in', () => {
    expect(inHighpassAt(LEAD_IN)).toBeCloseTo(IN_HP_START_HZ, 3);
    expect(inHighpassAt(LEAD_IN + 2)).toBeLessThan(IN_HP_START_HZ);
    expect(inHighpassAt(SWAP_AT - 0.01)).toBeGreaterThanOrEqual(IN_HP_SWAP_HZ - 1);
  });
  it('is fully open from the swap on', () => {
    expect(inHighpassAt(SWAP_AT)).toBe(NEUTRAL_HP_HZ);
    expect(inHighpassAt(TOTAL)).toBe(NEUTRAL_HP_HZ);
  });
});

describe('bass swap', () => {
  it('incoming bass cut until the swap, outgoing bass cut after', () => {
    expect(lowshelfDbAt('in', SWAP_AT - 0.01)).toBe(BASS_CUT_DB);
    expect(lowshelfDbAt('in', SWAP_AT)).toBe(0);
    expect(lowshelfDbAt('out', SWAP_AT - 0.01)).toBe(0);
    expect(lowshelfDbAt('out', SWAP_AT)).toBe(BASS_CUT_DB);
  });
  it('the swap happens midway through the overlap', () => {
    expect(SWAP_AT).toBeCloseTo(LEAD_IN + (TOTAL - LEAD_IN) / 2, 5);
  });
});

describe('sampleCurve', () => {
  it('samples from `from` to TOTAL, scaled', () => {
    const c = sampleCurve(t => t, 5, 11, 2);
    expect(c.length).toBe(11);
    expect(c[0]).toBeCloseTo(10, 5);
    expect(c[10]).toBeCloseTo(TOTAL * 2, 5);
  });
  it('never returns fewer than 2 points', () => expect(sampleCurve(() => 1, TOTAL, 1, 1).length).toBe(2));
});

describe('quiet ending detection', () => {
  it('quiet when recent readings are all under a quarter of typical', () => expect(isQuietTail([0.02, 0.02, 0.01, 0.02, 0.01], 0.2)).toBe(true));
  it('not quiet on a breakdown spike', () => expect(isQuietTail([0.02, 0.02, 0.15, 0.02, 0.01], 0.2)).toBe(false));
  it('needs a full window and a real level', () => {
    expect(isQuietTail([0.01, 0.01], 0.2)).toBe(false);
    expect(isQuietTail([0, 0, 0, 0, 0], 0)).toBe(false);
  });
  it('starts early only in the last 30s and before the normal trigger', () => {
    expect(shouldStartEarly(215, 240, true)).toBe(true);
    expect(shouldStartEarly(200, 240, true)).toBe(false);
    expect(shouldStartEarly(226, 240, true)).toBe(false);
    expect(shouldStartEarly(215, 240, false)).toBe(false);
  });
});
