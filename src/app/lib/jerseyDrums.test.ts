import { describe, it, expect } from 'vitest';
import { PRESETS, events, toMidi, MIDI_NOTES } from './jerseyDrums';

const classic = PRESETS.find(p => p.id === 'classic')!;

describe('Jersey club patterns', () => {
  it('the classic kick lands on 16th steps 1, 5, 9, 12 and 15 of each bar', () => {
    const kicks = classic.grid.kick.map((v, i) => (v ? i : -1)).filter(i => i >= 0);
    expect(kicks).toEqual([0, 4, 8, 11, 14, 16, 20, 24, 27, 30]);
  });
  it('the roll replaces the last beat with six triplet kicks', () => {
    const ev = events(classic.grid, true).filter(e => e.lane === 'kick' && e.at >= 28);
    expect(ev).toHaveLength(6);
    expect(ev[1].at - ev[0].at).toBeCloseTo(4 / 6, 6);
  });
});

describe('toMidi', () => {
  const bytes = toMidi(classic.grid, true, 140, 1);
  const text = (i: number, n: number) => String.fromCharCode(...bytes.slice(i, i + n));
  it('writes a valid format-0 header and one track', () => {
    expect(text(0, 4)).toBe('MThd');
    expect(bytes[9]).toBe(0);  // format 0
    expect(bytes[11]).toBe(1); // one track
    expect(text(14, 4)).toBe('MTrk');
    const len = (bytes[18] << 24) | (bytes[19] << 16) | (bytes[20] << 8) | bytes[21];
    expect(len).toBe(bytes.length - 22);
  });
  it('sets the tempo and ends with end-of-track', () => {
    const us = Math.round(60_000_000 / 140);
    expect([...bytes.slice(26, 29)]).toEqual([(us >> 16) & 0xff, (us >> 8) & 0xff, us & 0xff]);
    expect([...bytes.slice(-3)]).toEqual([0xff, 0x2f, 0x00]);
  });
  it('has one note-on per hit on the drum channel', () => {
    const hits = events(classic.grid, true).length;
    let ons = 0;
    for (let i = 0; i < bytes.length - 2; i++) if (bytes[i] === 0x99 && Object.values(MIDI_NOTES).includes(bytes[i + 1])) ons++;
    expect(ons).toBe(hits);
  });
});
