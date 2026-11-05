import { describe, it, expect } from 'vitest';
import { toJerseyTempo } from './bpm.mjs';

describe('toJerseyTempo', () => {
  it('speeds a 128 BPM song up to 140 straight', () => {
    const r = toJerseyTempo(128, 140)!;
    expect(r.relation).toBe('straight');
    expect(r.percent).toBeCloseTo(9.375, 3);
  });
  it('treats a 70 BPM ballad as half-time with no speed change', () => {
    const r = toJerseyTempo(70, 140)!;
    expect(r.relation).toBe('half-time');
    expect(r.effective).toBe(140);
    expect(r.percent).toBeCloseTo(0, 6);
  });
  it('treats a fast 280 BPM reading as double-time', () => {
    expect(toJerseyTempo(280, 140)!.relation).toBe('double-time');
  });
  it('rejects empty input', () => {
    expect(toJerseyTempo(0)).toBeNull();
    expect(toJerseyTempo(NaN)).toBeNull();
  });
});
