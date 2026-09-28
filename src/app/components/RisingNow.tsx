import React from 'react';
import { Link } from 'react-router';
import { ArrowUp, ArrowDown, Minus, Flame, Music2, Headphones, Sparkles, ChevronRight } from 'lucide-react';
import { latestWeek, getChart, type ChartEntry } from '../../data/charts';
import { movement, producerSlug, formatWeek } from '../../data/charts/chartUtils.mjs';

export const CARD_STYLE: React.CSSProperties = {
  background: '#0A0716',
  border: '1px solid rgba(110,50,190,0.14)',
  borderRadius: '12px',
  fontFamily: "'General Sans', sans-serif",
};

function Movement({ entry }: { entry: ChartEntry }) {
  const m = movement(entry);
  if (m.kind === 'new') {
    return <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,255,136,0.12)', color: '#00FF88' }}>NEW</span>;
  }
  if (m.kind === 'breakout') {
    return (
      <span className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background: 'rgba(255,0,128,0.15)', color: '#FF4DA6' }} title={`Breakout: up ${m.by}`}>
        <Flame className="w-2.5 h-2.5" />+{m.by}
      </span>
    );
  }
  if (m.kind === 'up') return <span className="flex items-center text-[10px] font-bold text-[#00FF88]" title={`Up ${m.by}`}><ArrowUp className="w-3 h-3" />{m.by}</span>;
  if (m.kind === 'down') return <span className="flex items-center text-[10px] font-bold text-[#FF4D6D]" title={`Down ${m.by}`}><ArrowDown className="w-3 h-3" />{m.by}</span>;
  return <Minus className="w-3 h-3 text-[#5B4F70]" aria-label="No change" />;
}

const SIGNAL_ICON = { tiktok: Music2, listeners: Headphones, new: Sparkles } as const;
const LINK_LABELS: [keyof ChartEntry['links'], string, string][] = [
  ['soundcloud', 'SC', 'SoundCloud'],
  ['bandcamp', 'BC', 'Bandcamp'],
  ['spotify', 'SP', 'Spotify'],
  ['youtube', 'YT', 'YouTube'],
];

export function RisingNowRow({ entry }: { entry: ChartEntry }) {
  const SignalIcon = SIGNAL_ICON[entry.signal.type] ?? Sparkles;
  const note = <span className="break-words">{entry.signal.note}</span>;
  return (
    <li className="flex items-start gap-2.5 md:gap-3 p-2 md:p-2.5 rounded-lg" style={{ background: 'rgba(157,0,255,0.04)' }}>
      <div className="w-8 shrink-0 flex flex-col items-center gap-1 pt-0.5">
        <span className="text-lg font-black text-white leading-none">{entry.rank}</span>
        <Movement entry={entry} />
      </div>
      {entry.artwork ? (
        <img src={entry.artwork} alt="" loading="lazy" className="w-11 h-11 md:w-12 md:h-12 rounded-md object-cover shrink-0" />
      ) : (
        <div className="w-11 h-11 md:w-12 md:h-12 rounded-md shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2A0050, #4A0030)' }}>
          <Music2 className="w-5 h-5 text-[#9D00FF]" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white leading-tight break-words">{entry.title}</p>
        <p className="text-xs text-[#B9A6D6] leading-tight break-words">{entry.artist}</p>
        <p className="text-[11px] text-[#7B6F90] mt-0.5 break-words">
          prod.{' '}
          <Link to={`/producers/${producerSlug(entry.producer)}`} className="text-[#C080FF] hover:text-white">{entry.producer}</Link>
          {entry.originalSample && <span> · {entry.originalSample}</span>}
        </p>
        {(entry.bpm || entry.key) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {entry.bpm && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-[#E0AAFF]" style={{ background: 'rgba(157,0,255,0.12)' }}>{entry.bpm} BPM</span>}
            {entry.key && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-[#E0AAFF]" style={{ background: 'rgba(157,0,255,0.12)' }}>{entry.key}</span>}
          </div>
        )}
        <p className="flex items-start gap-1 text-[11px] text-[#9B8FB0] mt-1">
          <SignalIcon className="w-3 h-3 mt-0.5 shrink-0 text-[#FF0080]" />
          {entry.signal.url ? <a href={entry.signal.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">{note}</a> : note}
        </p>
      </div>
      <div className="shrink-0 flex flex-col gap-1">
        {LINK_LABELS.filter(([k]) => entry.links[k]).map(([k, label, name]) => (
          <a
            key={k}
            href={entry.links[k]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${entry.title} on ${name}`}
            className="text-[9px] font-black w-7 h-5 flex items-center justify-center rounded text-[#C080FF] hover:text-white"
            style={{ background: 'rgba(157,0,255,0.1)', border: '1px solid rgba(157,0,255,0.2)' }}
          >
            {label}
          </a>
        ))}
      </div>
    </li>
  );
}

export function RisingNowList({ entries }: { entries: ChartEntry[] }) {
  return (
    <ol className="flex flex-col gap-2 list-none p-0 m-0">
      {entries.map(e => <RisingNowRow key={e.rank} entry={e} />)}
    </ol>
  );
}

/** Homepage section: top 10 of the latest week, under the Jersey Club Playlist */
export function RisingNowSection() {
  const chart = latestWeek ? getChart(latestWeek) : undefined;
  if (!chart) return null;
  return (
    <section className="flex flex-col p-3 md:p-4" style={CARD_STYLE} aria-labelledby="rising-now-heading">
      <div className="flex items-end justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 id="rising-now-heading" className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#FF0080]" /> Rising Now
          </h2>
          <p className="text-[11px] text-[#E0AAFF] font-semibold">Week of {formatWeek(chart.week)}</p>
        </div>
        <Link to="/hot" className="flex items-center gap-0.5 text-xs font-bold text-[#C080FF] hover:text-white whitespace-nowrap shrink-0">
          Full chart <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <RisingNowList entries={chart.entries.slice(0, 10)} />
    </section>
  );
}
