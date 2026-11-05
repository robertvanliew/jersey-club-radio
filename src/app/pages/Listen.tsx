import { useEffect } from 'react';
import { Link } from 'react-router';
import { Play, Pause, Radio } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { LISTEN } from '../../data/seo/listen.mjs';
import { setHead } from '../lib/head';
import { CARD_STYLE } from '../components/RisingNow';
import { LiveStatus } from '../components/LiveStatus';
import { formatTrackTitle } from '../utils/formatTrackTitle';

/** /listen: answers "is there a 24/7 Jersey club radio station" with a play button first */
export function ListenPage() {
  const { isPlaying, togglePlay, currentTrack, isRadioMode, backToLive } = usePlayer();
  useEffect(() => { setHead({ title: LISTEN.title, description: LISTEN.description, path: LISTEN.path }); }, []);

  const play = () => (currentTrack && !isRadioMode ? backToLive() : togglePlay());

  return (
    <div className="max-w-3xl mx-auto w-full pb-10 flex flex-col gap-5">
      <section className="p-5 md:p-7" style={CARD_STYLE}>
        <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">{LISTEN.heading}</h1>
        <p className="text-sm md:text-base text-[#C9BFDB] leading-relaxed mt-3">{LISTEN.answer}</p>
        <div className="flex flex-wrap items-center gap-4 mt-5">
          <button onClick={play} className="h-12 px-6 rounded-full font-bold text-white flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #9D00FF, #FF0080)', boxShadow: '0 8px 30px rgba(157,0,255,0.3)' }}>
            {isPlaying && isRadioMode ? <><Pause className="w-5 h-5" /> Pause</> : <><Play className="w-5 h-5" /> Listen live</>}
          </button>
          {currentTrack && (
            <div className="min-w-0">
              <LiveStatus variant="bar" />
              <p className="text-sm text-white font-semibold truncate">{formatTrackTitle(currentTrack.snippet.title)}</p>
            </div>
          )}
        </div>
      </section>

      <section className="p-5 md:p-6" style={CARD_STYLE} aria-label="Station facts">
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 text-sm">
          {LISTEN.facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-[#7B6F90] font-semibold">{k}</dt>
              <dd className="text-white">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="p-5 md:p-6" style={CARD_STYLE}>
        <h2 className="text-lg md:text-xl font-black text-white mb-4 flex items-center gap-2"><Radio className="w-5 h-5 text-[#C77DFF]" /> Questions about Jersey club radio</h2>
        <div className="flex flex-col gap-5">
          {LISTEN.faq.map(f => (
            <div key={f.q}>
              <h3 className="text-sm md:text-base font-bold text-white">{f.q}</h3>
              <p className="text-sm text-[#A99DBF] leading-relaxed mt-1">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-6 pt-5" style={{ borderTop: '1px solid rgba(157,0,255,0.15)' }}>
          {LISTEN.links.map(([to, label]) => (
            <Link key={to} to={to} className="text-sm font-semibold text-[#C77DFF] hover:text-white">{label} →</Link>
          ))}
        </div>
      </section>
    </div>
  );
}
