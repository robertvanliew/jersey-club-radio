// Rising Now chart data. Each week is src/data/charts/YYYY-MM-DD.json (the week's Monday).
// To publish a week: add the file and push (see README → "How to publish a new week").
import { publishedWeeks, neighbours, producerHistory } from './chartUtils.mjs';

export interface ChartEntry {
  rank: number;
  title: string;
  artist: string;
  producer: string;
  originalSample?: string;
  bpm?: number;
  key?: string;
  releaseDate: string;
  lastWeekRank: number | null;
  weeksOnChart: number;
  signal: { type: 'tiktok' | 'listeners' | 'new'; note: string; url?: string };
  links: { soundcloud?: string; bandcamp?: string; spotify?: string; youtube?: string };
  artwork?: string;
}

export interface Chart {
  week: string;
  /** Seed/sample weeks: shown in dev only, never published */
  placeholder?: boolean;
  entries: ChartEntry[];
}

const modules = import.meta.glob<Chart>('./*.json', { eager: true, import: 'default' });
const byWeek = new Map(Object.values(modules).map(c => [c.week, c]));

/** Published weeks, newest first (placeholder weeks only in dev) */
export const weeks: string[] = publishedWeeks([...byWeek.values()], { includePlaceholders: import.meta.env.DEV });
export const latestWeek: string | null = weeks[0] ?? null;

export const getChart = (week: string): Chart | undefined => (weeks.includes(week) ? byWeek.get(week) : undefined);
export const weekNeighbours = (week: string): { newer: string | null; older: string | null } => neighbours(weeks, week);
export const getProducer = (slug: string) => producerHistory(weeks.map(w => byWeek.get(w)!), slug);
