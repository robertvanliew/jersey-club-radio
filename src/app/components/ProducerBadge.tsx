import { useMemo, useState } from 'react';
import { Download, Code2, Check } from 'lucide-react';
import { badgeSvg, badgeEmbed, bestPeak, BADGE_W, BADGE_H } from '../../data/charts/badge.mjs';
import { CARD_STYLE } from './RisingNow';

type History = { name: string; tracks: { title: string; weeks: { week: string; rank: number }[] }[] };

/** "Charted on Jersey Club Radio" badge: preview, PNG download for socials, embed code for sites */
export function ProducerBadge({ slug, history }: { slug: string; history: History }) {
  const peak = bestPeak(history) as { rank: number; week: string } | null;
  const svg = useMemo(() => (peak ? badgeSvg({ name: history.name, rank: peak.rank, week: peak.week }) : ''), [history.name, peak?.rank, peak?.week]);
  const [copied, setCopied] = useState(false);
  if (!peak) return null;

  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  // Draw the SVG at 2x on a canvas and save it as a PNG (Instagram and TikTok don't take SVG)
  const downloadPng = () => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = BADGE_W * 2; c.height = BADGE_H * 2;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = `${slug}-jersey-club-radio-rising-now.png`;
      a.click();
    };
    img.src = src;
  };

  const copyEmbed = async () => {
    try { await navigator.clipboard.writeText(badgeEmbed(slug, history.name, peak.rank)); setCopied(true); } catch { }
  };

  return (
    <section className="p-4" style={CARD_STYLE} aria-labelledby="badge-heading">
      <h2 id="badge-heading" className="text-sm font-black text-white">Charted on Jersey Club Radio</h2>
      <p className="text-xs text-[#9B8FB0] mt-0.5">Producers: share your chart badge or add it to your site. It links back to this page.</p>
      <img src={src} alt={`${history.name}: Rising Now #${peak.rank} on Jersey Club Radio`} width={300} height={100} className="mt-3 w-full max-w-[360px] h-auto" />
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={downloadPng} className="h-9 px-4 rounded-lg text-xs font-bold text-white flex items-center gap-1.5" style={{ background: 'linear-gradient(135deg, #9D00FF, #FF0080)' }}>
          <Download className="w-3.5 h-3.5" /> Download for socials
        </button>
        <button onClick={copyEmbed} className="h-9 px-4 rounded-lg text-xs font-bold text-[#C77DFF] flex items-center gap-1.5" style={{ border: '1px solid rgba(157,0,255,0.35)' }}>
          {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Code2 className="w-3.5 h-3.5" /> Copy embed code</>}
        </button>
      </div>
    </section>
  );
}
