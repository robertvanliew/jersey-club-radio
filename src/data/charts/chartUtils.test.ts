import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { movement, producerSlug, formatWeek, publishedWeeks, neighbours, validateChart, chartJsonLd, topProducers } from './chartUtils.mjs';

describe('movement', () => {
  it.each([
    [{ rank: 3, lastWeekRank: null }, { kind: 'new' }],
    [{ rank: 1, lastWeekRank: 6 }, { kind: 'breakout', by: 5 }],
    [{ rank: 2, lastWeekRank: 6 }, { kind: 'up', by: 4 }],
    [{ rank: 9, lastWeekRank: 4 }, { kind: 'down', by: 5 }],
    [{ rank: 4, lastWeekRank: 4 }, { kind: 'same' }],
  ])('%j -> %j', (e, want) => expect(movement(e)).toEqual(want));
});

it('producerSlug', () => {
  expect(producerSlug('DJ Sliink')).toBe('dj-sliink');
  expect(producerSlug('  Uniiqu3 & Friends! ')).toBe('uniiqu3-and-friends');
  expect(producerSlug('Beyoncé')).toBe('beyonce');
});

it('formatWeek', () => expect(formatWeek('2026-09-28')).toBe('Sept 28, 2026'));

describe('publishedWeeks', () => {
  const charts = [{ week: '2026-09-14' }, { week: '2026-09-21', placeholder: true }, { week: '2026-10-05' }];
  const today = new Date('2026-09-30T12:00:00Z');
  it('drops placeholders and future weeks, newest first', () => {
    expect(publishedWeeks(charts, { today })).toEqual(['2026-09-14']);
    expect(publishedWeeks(charts, { today, includePlaceholders: true })).toEqual(['2026-09-21', '2026-09-14']);
  });
  it('a week committed early goes live on its date', () => {
    expect(publishedWeeks(charts, { today: new Date('2026-10-05T10:00:00Z') })).toEqual(['2026-10-05', '2026-09-14']);
  });
  it('neighbours', () => {
    expect(neighbours(['c', 'b', 'a'], 'b')).toEqual({ newer: 'c', older: 'a' });
    expect(neighbours(['c', 'b', 'a'], 'c')).toEqual({ newer: null, older: 'b' });
  });
});

describe('validateChart', () => {
  const entry = (rank: number) => ({ rank, title: 't', artist: 'a', producer: 'p', key: '8A', releaseDate: '2026-09-01', bpm: 140, lastWeekRank: null, weeksOnChart: 1, signal: { type: 'new', note: 'n' }, links: {} });
  it('accepts a good chart', () => expect(validateChart({ week: '2026-09-28', entries: [entry(1), entry(2)] })).toEqual([]));
  it('rejects rank gaps/duplicates, missing fields and bad values', () => {
    expect(validateChart({ week: '2026-09-28', entries: [entry(1), entry(3)] }).length).toBeGreaterThan(0);
    expect(validateChart({ week: '2026-09-28', entries: [{ ...entry(1), title: '' }] })).toContain('#1: missing title');
    expect(validateChart({ week: '2026-09-28', entries: [{ ...entry(1), signal: { type: 'radio', note: '' } }] }).length).toBe(1);
    expect(validateChart({ week: 'Sept 28', entries: [entry(1)] })).toContain('bad week "Sept 28"');
  });
  it('every committed chart file is valid', () => {
    const dir = 'src/data/charts';
    for (const f of readdirSync(dir).filter(n => n.endsWith('.json'))) {
      expect(validateChart(JSON.parse(readFileSync(join(dir, f), 'utf8'))), f).toEqual([]);
    }
  });
});

it('topProducers: points by rank, bonuses, multiple tracks add up', () => {
  const e = (rank: number, producer: string, lastWeekRank: number | null = rank) => ({ rank, producer, lastWeekRank });
  const chart = { week: '2026-09-28', entries: [e(1, 'Solo'), e(2, 'Duo'), e(3, 'Duo'), e(4, 'Riser', 12), e(5, 'Fresh', null)] };
  const top = topProducers(chart, 3);
  expect(top.map(p => p.name)).toEqual(['Duo', 'Riser', 'Solo']); // Duo: 4+3=7; Riser: 2+5=7 (worse best rank); Solo: 5
  expect(top[0]).toMatchObject({ slug: 'duo', tracks: 2, bestRank: 2 });
  expect(topProducers(chart, 10).find(p => p.name === 'Fresh')?.points).toBe(1 + 2);
});

it('chartJsonLd: MusicPlaylist of MusicRecordings with producer', () => {
  const ld = chartJsonLd({ week: '2026-09-28', entries: [{ rank: 1, title: 'T', artist: 'A', producer: 'P', releaseDate: '2026-09-20', links: { soundcloud: 'https://sc/x' } }] }, '/hot');
  expect(ld['@type']).toBe('MusicPlaylist');
  expect(ld.url).toBe('https://jerseyclubradio.com/hot');
  const item = ld.track.itemListElement[0];
  expect(item.position).toBe(1);
  expect(item.item).toMatchObject({ '@type': 'MusicRecording', name: 'T', byArtist: { name: 'A' }, producer: { name: 'P' }, datePublished: '2026-09-20', url: 'https://sc/x' });
});
