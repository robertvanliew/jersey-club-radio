import { useEffect } from 'react';
import { Link } from 'react-router';
import { ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
import { KITS_PAGE } from '../../data/seo/drumKits.mjs';
import { setHead } from '../lib/head';
import { CARD_STYLE } from '../components/RisingNow';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
type Kit = { name: string; creator: string; url: string; price: string; contents: string; license: string };

/** /free-jersey-club-drum-kits: hand-checked directory, grouped by license clarity */
export function DrumKits() {
  const p = KITS_PAGE;
  useEffect(() => { setHead({ title: p.title, description: p.description, path: p.path }); }, []);

  return (
    <article className="max-w-3xl mx-auto w-full pb-10 flex flex-col gap-5">
      <header className="p-5 md:p-7" style={CARD_STYLE}>
        <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">{p.heading}</h1>
        <p className="text-xs text-[#7B6F90] mt-2">By <a href="https://robertvanliew.com" target="_blank" rel="author noopener" className="text-[#C080FF] hover:text-white">Robert Van Liew</a> · Links and licenses checked {fmtDate(p.checked)}</p>
        <p className="text-sm md:text-base text-[#D9D0E8] leading-relaxed mt-4">{p.answer}</p>
      </header>

      <section className="p-5 md:p-6" style={{ ...CARD_STYLE, border: '1px solid rgba(255,0,128,0.35)' }}>
        <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#FF0080]" /> Free from Jersey Club Radio</h2>
        <ul className="flex flex-col gap-2 mt-3">
          {p.ours.map(([to, name, desc]) => (
            <li key={to} className="text-sm text-[#A99DBF]"><Link to={to} className="font-bold text-[#C77DFF] hover:text-white">{name}</Link>: {desc}</li>
          ))}
        </ul>
      </section>

      {p.groups.map(g => (
        <section key={g.name} className="p-5 md:p-7" style={CARD_STYLE}>
          <h2 className="text-lg md:text-xl font-black text-white">{g.name}</h2>
          <p className="text-sm text-[#A99DBF] mt-1">{g.intro}</p>
          <ul className="flex flex-col gap-5 mt-5">
            {(g.kits as Kit[]).map(k => (
              <li key={k.url}>
                <a href={k.url} target="_blank" rel="noopener nofollow" className="text-sm md:text-base font-bold text-[#C77DFF] hover:text-white inline-flex items-center gap-1.5">
                  {k.name} <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-xs text-[#7B6F90] mt-0.5">by {k.creator} · {k.price}</p>
                <p className="text-sm text-[#C9BFDB] leading-relaxed mt-1">{k.contents}</p>
                <p className="text-xs text-[#A99DBF] mt-1"><span className="font-semibold text-white">License:</span> {k.license}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="p-5 md:p-7" style={CARD_STYLE}>
        <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-[#FFB020]" /> How to spot fake "free Jersey club kit" pages</h2>
        <ul className="flex flex-col gap-2 mt-3 list-disc pl-5">
          {p.warnings.map(w => <li key={w} className="text-sm text-[#C9BFDB] leading-relaxed">{w}</li>)}
        </ul>
      </section>

      <section className="p-5 md:p-7" style={CARD_STYLE}>
        <h2 className="text-lg md:text-xl font-black text-white mb-4">Common questions</h2>
        <div className="flex flex-col gap-5">{p.faq.map(f => <div key={f.q}><h3 className="text-sm md:text-base font-bold text-white">{f.q}</h3><p className="text-sm text-[#A99DBF] leading-relaxed mt-1">{f.a}</p></div>)}</div>
      </section>

      <footer className="p-5 md:p-6 text-sm" style={CARD_STYLE}>
        <p className="text-[#A99DBF]">Made a free Jersey club kit? <Link to="/contact" className="text-[#C77DFF] hover:text-white underline">Send it to us</Link> with its license and we'll check it for the list.</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(157,0,255,0.15)' }}>
          {p.related.map(([to, label]) => <Link key={to} to={to} className="font-semibold text-[#C77DFF] hover:text-white">{label} →</Link>)}
        </div>
      </footer>
    </article>
  );
}
