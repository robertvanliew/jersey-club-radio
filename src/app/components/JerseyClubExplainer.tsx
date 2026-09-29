import { Link } from 'react-router';
import { HOME_EXPLAINER } from '../../data/seo/home.mjs';
import { CARD_STYLE } from './RisingNow';

type Explainer = { heading: string; definition: string; facts: string[][]; faq: { q: string; a: string }[]; links: string[][] };

/** Plain-language guide to the genre. The same copy is prerendered for crawlers that skip JavaScript. */
export function JerseyClubExplainer() {
  const e = HOME_EXPLAINER as Explainer;
  return (
    <section aria-labelledby="what-is-jersey-club" className="p-4 md:p-6" style={CARD_STYLE}>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <h2 id="what-is-jersey-club" className="text-lg md:text-xl font-black text-white mb-3">{e.heading}</h2>
          <p className="text-sm leading-relaxed text-[#C9BFDB]">{e.definition}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
            {e.links.map(([to, label]) => (
              <Link key={to} to={to} className="text-sm font-semibold text-[#C77DFF] hover:text-white">{label} →</Link>
            ))}
          </div>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm self-start">
          {e.facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-[#7B6F90] font-semibold">{k}</dt>
              <dd className="text-white">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="grid gap-4 md:grid-cols-2 mt-6 pt-5" style={{ borderTop: '1px solid rgba(157,0,255,0.15)' }}>
        {e.faq.map(f => (
          <div key={f.q}>
            <h3 className="text-sm font-bold text-white mb-1">{f.q}</h3>
            <p className="text-sm leading-relaxed text-[#A99DBF]">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
