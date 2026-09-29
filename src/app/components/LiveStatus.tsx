import { Radio } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

/**
 * LIVE when the listener is on the shared station; otherwise "My Pick" plus a clear
 * Go Live button that puts them back on the same song as everyone else.
 * `hero` = homepage Now Playing card, `bar` = the bottom player.
 */
export function LiveStatus({ variant, center = false }: { variant: 'hero' | 'bar'; center?: boolean }) {
  const { isRadioMode, isPlaying, backToLive, currentTrack } = usePlayer();
  const hero = variant === 'hero';
  const justify = center ? 'justify-center' : 'justify-start';

  if (isRadioMode || !currentTrack) {
    return (
      <div className={`flex items-center ${hero ? 'gap-2' : 'gap-1.5'} ${justify}`}>
        <span
          className={`${hero ? 'w-2 h-2' : 'w-1.5 h-1.5'} rounded-full flex-shrink-0`}
          style={{ background: '#FF2D55', boxShadow: '0 0 5px #FF2D55', animation: isPlaying ? 'pulse 1.1s ease-in-out infinite' : 'none' }}
        />
        <span className={`${hero ? 'text-xs font-extrabold' : 'text-[9px] font-bold'} uppercase tracking-widest text-[#FF3355]`}>
          {hero ? 'Live now' : 'Live'}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${justify}`}>
      <span className={`${hero ? 'text-xs font-extrabold' : 'text-[9px] font-bold'} uppercase tracking-widest text-[#C084FC]`}>My pick</span>
      <button
        onClick={backToLive}
        title="Rejoin the live station: the same song everyone else is hearing"
        className={`flex items-center gap-1 rounded-full font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#FF2D55] ${hero ? 'text-[11px] px-3 py-1' : 'text-[9px] px-2 py-0.5'}`}
        style={{ background: 'rgba(255,45,85,0.18)', border: '1px solid #FF2D55' }}
      >
        <Radio className={hero ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} /> Go live
      </button>
    </div>
  );
}
