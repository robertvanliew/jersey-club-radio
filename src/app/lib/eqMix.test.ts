import { describe, it, expect } from 'vitest';
import {
  LEAD_IN, TOTAL, SWAP_AT, BASS_CUT_DB, RISE_HP_HZ, NEUTRAL_HP_HZ,
  outGainAt, inGainAt, outHighpassAt, lowshelfDbAt, sampleCurve, isQuietTail, shouldStartEarly,
} from './eqMix';

describe('gain curves (unchanged from the original crossfade)', () => {
  it('outgoing eases 100% -> 80% over the lead-in, then fades to 0', () => {
    expect(outGainAt(0)).toBeCloseTo(1, 5);
    expect(outGainAt(LEAD_IN)).toBeCloseTo(0.8, 5);
    expect(outGainAt(TOTAL)).toBeCloseTo(0, 5);
  });
  it('incoming is silent during the lead-in, then rises to 100%', () => {
    expect(inGainAt(0)).toBe(0);
    expect(inGainAt(LEAD_IN - 0.01)).toBe(0);
    expect(inGainAt(TOTAL)).toBeCloseTo(1, 5);
  });
  it('curves are monotonic', () => {
    for (let t = 0; t < TOTAL; t += 0.25) {
      expect(outGainAt(t + 0.25)).toBeLessThanOrEqual(outGainAt(t) + 1e-9);
      expect(inGainAt(t + 0.25)).toBeGreaterThanOrEqual(inGainAt(t) - 1e-9);
    }
  });
  it('clamps outside the transition', () => {
    expect(outGainAt(-1)).toBeCloseTo(1, 5);
    expect(inGainAt(99)).toBeCloseTo(1, 5);
  });
});

describe('Rise: outgoing highpass sweep', () => {
  it('sweeps from neutral to the rise frequency over the lead-in, then holds', () => {
    expect(outHighpassAt(0)).toBeCloseTo(NEUTRAL_HP_HZ, 5);
    expect(outHighpassAt(LEAD_IN)).toBeCloseTo(RISE_HP_HZ, 5);
    expect(outHighpassAt(TOTAL)).toBeCloseTo(RISE_HP_HZ, 5);
  });
  it('is exponential (musically even), so the midpoint is the geometric mean', () => {
    expect(outHighpassAt(LEAD_IN / 2)).toBeCloseTo(Math.sqrt(NEUTRAL_HP_HZ * RISE_HP_HZ), 3);
  });
});

describe('bass swap', () => {
  it('incoming bass is cut until the swap point, then restored', () => {
    expect(lowshelfDbAt('in', 0)).toBe(BASS_CUT_DB);
    expect(lowshelfDbAt('in', SWAP_AT - 0.01)).toBe(BASS_CUT_DB);
    expect(lowshelfDbAt('in', SWAP_AT + 0.5)).toBe(0);
  });
  it('outgoing bass is full until the swap point, then cut', () => {
    expect(lowshelfDbAt('out', 0)).toBe(0);
    expect(lowshelfDbAt('out', SWAP_AT - 0.01)).toBe(0);
    expect(lowshelfDbAt('out', SWAP_AT + 0.5)).toBe(BASS_CUT_DB);
  });
  it('the swap happens midway through the overlap', () => {
    expect(SWAP_AT).toBeCloseTo(LEAD_IN + (TOTAL - LEAD_IN) / 2, 5);
  });
});

describe('sampleCurve', () => {
  it('samples a function from `from` to TOTAL, scaled', () => {
    const c = sampleCurve(t => t, 5, 11, 2);
    expect(c).toBeInstanceOf(Float32Array);
    expect(c.length).toBe(11);
    expect(c[0]).toBeCloseTo(10, 5);
    expect(c[10]).toBeCloseTo(TOTAL * 2, 5);
  });
  it('never returns fewer than 2 points (Web Audio requirement)', () => {
    expect(sampleCurve(() => 1, TOTAL, 1, 1).length).toBe(2);
  });
});

describe('quiet ending detection', () => {
  it('quiet when the last readings are all under a quarter of the typical level', () => {
    expect(isQuietTail([0.02, 0.02, 0.01, 0.02, 0.01], 0.2)).toBe(true);
  });
  it('not quiet if any recent reading is loud (a breakdown, not an ending)', () => {
    expect(isQuietTail([0.02, 0.02, 0.15, 0.02, 0.01], 0.2)).toBe(false);
  });
  it('needs a full window of readings', () => {
    expect(isQuietTail([0.01, 0.01], 0.2)).toBe(false);
  });
  it('ignores tracks with no measurable level (e.g. not loaded yet)', () => {
    expect(isQuietTail([0, 0, 0, 0, 0], 0)).toBe(false);
  });
});

describe('shouldStartEarly', () => {
  it('starts early only in the last 30s and before the normal 15s trigger', () => {
    expect(shouldStartEarly(200, 240, true)).toBe(false);   // 40s left
    expect(shouldStartEarly(215, 240, true)).toBe(true);    // 25s left
    expect(shouldStartEarly(226, 240, true)).toBe(false);   // 14s left: normal trigger handles it
  });
  it('never without a quiet tail', () => {
    expect(shouldStartEarly(215, 240, false)).toBe(false);
  });
  it('never on short tracks', () => {
    expect(shouldStartEarly(10, 30, true)).toBe(false);
  });
});
