import { describe, it, expect } from 'vitest';
import { addRecent, recentIds, parseRecent, pickNextIndex, RECENT_MAX, RECENT_WINDOW_MS } from './recentPlays';

const ids = ['a', 'b', 'c', 'd', 'e'];

describe('pickNextIndex', () => {
  it('goes to the next track in order', () => {
    expect(pickNextIndex(ids, 1)).toBe(2);
    expect(pickNextIndex(ids, 4)).toBe(0);
  });

  it('never picks the song that is playing, even on shuffle', () => {
    for (let r = 0; r < 1; r += 0.05) expect(pickNextIndex(ids, 2, { shuffle: true, random: () => r })).not.toBe(2);
  });

  it('skips songs that just played', () => {
    expect(pickNextIndex(ids, 0, { avoid: new Set(['b', 'c']) })).toBe(3);
  });

  it('shuffle only picks from songs that have not just played', () => {
    const avoid = new Set(['a', 'b', 'c']);
    for (let r = 0; r < 1; r += 0.05) expect(['d', 'e']).toContain(ids[pickNextIndex(ids, 0, { avoid, shuffle: true, random: () => r })]);
  });

  it('skips unplayable tracks', () => {
    expect(pickNextIndex(ids, 0, { playable: i => i !== 1 })).toBe(2);
  });

  it('falls back to a playable repeat rather than stalling when everything is recent', () => {
    expect(pickNextIndex(ids, 0, { avoid: new Set(ids) })).toBe(1);
  });

  it('handles a one-track playlist', () => {
    expect(pickNextIndex(['a'], 0)).toBe(0);
  });
});

describe('recent plays list', () => {
  it('keeps the newest entry last and de-duplicates', () => {
    let l = addRecent([], 'a', 1000);
    l = addRecent(l, 'b', 2000);
    l = addRecent(l, 'a', 3000);
    expect(l.map(p => p.id)).toEqual(['b', 'a']);
  });

  it('caps its length', () => {
    let l: ReturnType<typeof addRecent> = [];
    for (let i = 0; i < RECENT_MAX + 5; i++) l = addRecent(l, `t${i}`, i);
    expect(l).toHaveLength(RECENT_MAX);
    expect(l[l.length - 1].id).toBe(`t${RECENT_MAX + 4}`);
  });

  it('forgets songs after the window', () => {
    const l = [{ id: 'old', at: 0 }, { id: 'new', at: RECENT_WINDOW_MS }];
    expect([...recentIds(l, RECENT_MAX, RECENT_WINDOW_MS + 1)]).toEqual(['new']);
  });

  it('limits how many songs are avoided', () => {
    const l = ['a', 'b', 'c'].map((id, at) => ({ id, at }));
    expect([...recentIds(l, 2, 10)]).toEqual(['b', 'c']);
  });

  it('parses stored data defensively', () => {
    expect(parseRecent(null)).toEqual([]);
    expect(parseRecent('not json')).toEqual([]);
    expect(parseRecent('[{"id":"a","at":1},{"id":2},null]')).toEqual([{ id: 'a', at: 1 }]);
  });
});
