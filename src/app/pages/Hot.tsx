import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { weeks, latestWeek, getChart, weekNeighbours, getProducer, producers } from '../../data/charts';
import { formatWeek } from '../../data/charts/chartUtils.mjs';
import { RisingNowList, CARD_STYLE } from '../components/RisingNow';
import { ProducerBadge } from '../components/ProducerBadge';

/** Set the tab title while a page is mounted (crawlers get full <head> tags from the prerendered HTML) */
function useTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => { document.title = prev; };
  }, [title]);
}

const linkCls = 'flex items-center gap-1 text-xs font-bold text-[#C080FF] hover:text-white';

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="max-w-3xl mx-auto w-full flex flex-col gap-4 pb-8">{children}</div>;
}

/** /hot (latest week) and /hot/:date */
export function HotPage() {
  const { date } = useParams();
  const week = date ?? latestWeek;
  const chart = week ? getChart(week) : undefined;
  useTitle(chart ? `Rising Now: Jersey Club Chart, Week of ${formatWeek(chart.week)} | Jersey Club Radio` : 'Rising Now | Jersey Club Radio');

  if (!chart) {
    return (
      <Shell>
        <div className="p-6 text-center" style={CARD_STYLE}>
          <h1 className="text-xl font-black text-white mb-2">Rising Now</h1>
          <p className="text-sm text-[#9B8FB0]">{date ? 'No chart for that week.' : 'The first chart is coming soon.'}</p>
          {date && latestWeek && <Link to="/hot" className={`${linkCls} justify-center mt-3`}>See this week's chart</Link>}
        </div>
      </Shell>
    );
  }
  const { newer, older } = weekNeighbours(chart.week);
  return (
    <Shell>
      <header className="p-4" style={CARD_STYLE}>
        <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#FF0080]" /> Rising Now
        </h1>
        <p className="text-sm text-[#E0AAFF] font-semibold">Jersey Club Chart · Week of {formatWeek(chart.week)}</p>
        <p className="text-xs text-[#7B6F90] mt-1">This week's hottest new Jersey club tracks, hand-picked by Jersey Club Radio, with the evidence for why each one is rising.</p>
      </header>
      <WeekNav newer={newer} older={older} />
      <div className="p-3 md:p-4" style={CARD_STYLE}>
        <RisingNowList entries={chart.entries} />
      </div>
      <WeekNav newer={newer} older={older} />
    </Shell>
  );
}

function WeekNav({ newer, older }: { newer: string | null; older: string | null }) {
  return (
    <nav className="flex items-center justify-between gap-2 px-1" aria-label="Chart weeks">
      {older ? <Link to={`/hot/${older}`} className={linkCls}><ChevronLeft className="w-3.5 h-3.5" />Week of {formatWeek(older)}</Link> : <span />}
      <Link to="/hot/archive" className={linkCls}>All weeks</Link>
      {newer ? <Link to={newer === latestWeek ? '/hot' : `/hot/${newer}`} className={linkCls}>Week of {formatWeek(newer)}<ChevronRight className="w-3.5 h-3.5" /></Link> : <span />}
    </nav>
  );
}

/** /hot/archive */
export function HotArchivePage() {
  useTitle('Rising Now Chart Archive | Jersey Club Radio');
  return (
    <Shell>
      <header className="p-4" style={CARD_STYLE}>
        <h1 className="text-xl md:text-2xl font-black text-white">Rising Now Archive</h1>
        <p className="text-xs text-[#7B6F90]">Every weekly Jersey club chart, newest first.</p>
        <Link to="/producers" className={`${linkCls} mt-2`}>Every producer who has charted <ChevronRight className="w-3.5 h-3.5" /></Link>
      </header>
      <ol className="flex flex-col gap-2 list-none p-0 m-0">
        {weeks.map(w => {
          const top = getChart(w)!.entries[0];
          return (
            <li key={w} className="p-3" style={CARD_STYLE}>
              <Link to={w === latestWeek ? '/hot' : `/hot/${w}`} className="block hover:opacity-80">
                <span className="text-sm font-bold text-white">Week of {formatWeek(w)}</span>
                <span className="block text-xs text-[#9B8FB0]">#1: {top.title} by {top.artist}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Shell>
  );
}

/** /producers/:slug */
export function ProducerPage() {
  const { slug = '' } = useParams();
  const history = getProducer(slug);
  useTitle(history ? `${history.name}: Jersey Club Producer Chart History | Jersey Club Radio` : 'Producer | Jersey Club Radio');
  if (!history) {
    return (
      <Shell>
        <div className="p-6 text-center" style={CARD_STYLE}>
          <p className="text-sm text-[#9B8FB0]">No charted tracks for this producer yet.</p>
          <Link to="/hot" className={`${linkCls} justify-center mt-3`}>See this week's chart</Link>
        </div>
      </Shell>
    );
  }
  return (
    <Shell>
      <header className="p-4" style={CARD_STYLE}>
        <p className="text-[11px] font-bold tracking-widest text-[#7B6F90] uppercase">Producer</p>
        <h1 className="text-xl md:text-2xl font-black text-white">{history.name}</h1>
        <p className="text-xs text-[#9B8FB0]">{history.tracks.length} track{history.tracks.length === 1 ? '' : 's'} on the Rising Now chart</p>
      </header>
      <ol className="flex flex-col gap-2 list-none p-0 m-0">
        {history.tracks.map(t => (
          <li key={`${t.title}|${t.artist}`} className="p-3" style={CARD_STYLE}>
            <p className="text-sm font-bold text-white">{t.title}</p>
            <p className="text-xs text-[#B9A6D6]">{t.artist} · peak #{t.bestRank} · {t.weeks.length} week{t.weeks.length === 1 ? '' : 's'}</p>
            <p className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
              {t.weeks.map(w => (
                <Link key={w.week} to={w.week === latestWeek ? '/hot' : `/hot/${w.week}`} className="text-[11px] text-[#C080FF] hover:text-white">
                  #{w.rank} · {formatWeek(w.week)}
                </Link>
              ))}
            </p>
          </li>
        ))}
      </ol>
      <ProducerBadge slug={slug} history={history} />
      <p className="flex flex-wrap gap-4">
        <Link to="/hot" className={linkCls}>See this week's chart <ChevronRight className="w-3.5 h-3.5" /></Link>
        <Link to="/producers" className={linkCls}>All charted producers <ChevronRight className="w-3.5 h-3.5" /></Link>
      </p>
    </Shell>
  );
}

/** /producers: every producer who has charted, A to Z */
export function ProducersIndexPage() {
  useTitle('Jersey Club Producers on the Rising Now Chart | Jersey Club Radio');
  return (
    <Shell>
      <header className="p-4" style={CARD_STYLE}>
        <p className="text-[11px] font-bold tracking-widest text-[#7B6F90] uppercase">Rising Now</p>
        <h1 className="text-xl md:text-2xl font-black text-white">Jersey Club Producers</h1>
        <p className="text-xs text-[#9B8FB0]">Every producer behind a track on the weekly Rising Now chart: {producers.length} so far.</p>
      </header>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none p-0 m-0">
        {producers.map(p => (
          <li key={p.slug} className="p-3" style={CARD_STYLE}>
            <Link to={`/producers/${p.slug}`} className="text-sm font-bold text-white hover:text-[#C080FF]">{p.name}</Link>
            <p className="text-xs text-[#B9A6D6]">{p.tracks} track{p.tracks === 1 ? '' : 's'} · peak #{p.bestRank} · last charted {formatWeek(p.lastWeek)}</p>
          </li>
        ))}
      </ul>
      <Link to="/hot" className={linkCls}>See this week's chart <ChevronRight className="w-3.5 h-3.5" /></Link>
    </Shell>
  );
}
