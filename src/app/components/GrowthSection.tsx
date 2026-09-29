import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Globe, MapPin, Music2, Radio, Flame, Send, Mail, Check, Loader2, Zap } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { usePlayer } from '../context/PlayerContext';
import { weeks } from '../../data/charts';
import { STRIPE_FAST_TRACK_URL, FAST_TRACK_LABEL } from '../config/monetization';
import { CARD_STYLE } from './RisingNow';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-715f71b9`;
const HEADERS = { Authorization: `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' };

export const INPUT = 'w-full h-10 px-3 rounded-lg text-sm text-white placeholder-[#5B4F70] outline-none focus:ring-2 focus:ring-[#9D00FF]';
export const INPUT_STYLE: React.CSSProperties = { background: '#06000F', border: '1px solid rgba(157,0,255,0.25)' };
export const BTN = 'h-10 px-5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60';
export const BTN_STYLE: React.CSSProperties = { background: 'linear-gradient(135deg, #9D00FF, #FF0080)' };

export async function post(path: string, body: unknown): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const r = await fetch(`${BASE}/${path}`, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, id: d.id } : { ok: false, error: d.error || 'Something went wrong. Please try again.' };
  } catch {
    return { ok: false, error: 'Network error. Please try again.' };
  }
}

/** Honeypot: hidden from people, filled by bots */
export const Honeypot = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={value} onChange={e => onChange(e.target.value)}
    style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
);

/** Reach and catalogue stats. Raw visitor counts are left out on purpose until traffic grows. */
function StatsBand() {
  const { tracks } = usePlayer();
  const [reach, setReach] = useState<{ cities: number; countries: number } | null>(null);
  useEffect(() => {
    fetch(`${BASE}/visits/map`, { headers: { Authorization: `Bearer ${publicAnonKey}` } })
      .then(r => r.json())
      .then(d => {
        const cities = new Set((d.dots ?? []).map((x: any) => `${x.city}|${x.country}`).filter((k: string) => !k.startsWith('undefined'))).size;
        setReach({ cities, countries: d.uniqueCountries ?? 0 });
      })
      .catch(() => { });
  }, []);
  const stats = [
    { icon: Radio, value: '24/7', label: 'Live Jersey club, non-stop' },
    reach?.countries ? { icon: Globe, value: String(reach.countries), label: 'Countries tuning in' } : null,
    reach?.cities ? { icon: MapPin, value: String(reach.cities), label: 'Cities on the map' } : null,
    tracks.length ? { icon: Music2, value: String(tracks.length), label: 'Tracks in rotation' } : null,
    weeks.length ? { icon: Flame, value: 'Weekly', label: 'Rising Now chart, every Monday' } : null,
  ].filter(Boolean) as { icon: typeof Radio; value: string; label: string }[];
  return (
    <section aria-label="Jersey Club Radio by the numbers" className="p-4 md:p-5" style={CARD_STYLE}>
      <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#7B6F90] mb-3">Jersey Club Radio by the numbers</p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map(s => (
          <div key={s.label} className="flex items-start gap-2.5 min-w-0">
            <s.icon className="w-4 h-4 text-[#FF0080] mt-1 shrink-0" />
            <div className="min-w-0">
              <p className="text-2xl md:text-3xl font-black text-white leading-none" style={{ fontFamily: "'Archivo', sans-serif" }}>{s.value}</p>
              <p className="text-[11px] text-[#9B8FB0] mt-1 leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SubmitTrackCard() {
  const [f, setF] = useState({ name: '', email: '', soundcloudUrl: '', note: '', website: '' });
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'done' | 'error'; id?: string; error?: string }>({ status: 'idle' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ status: 'sending' });
    const r = await post('submissions', f);
    setState(r.ok ? { status: 'done', id: r.id } : { status: 'error', error: r.error });
  };
  const fastTrackHref = STRIPE_FAST_TRACK_URL && state.id
    ? `${STRIPE_FAST_TRACK_URL}?client_reference_id=${encodeURIComponent(state.id)}&prefilled_email=${encodeURIComponent(f.email)}`
    : '';
  return (
    <section className="lg:col-span-2 p-4 md:p-5 flex flex-col" style={CARD_STYLE} aria-labelledby="submit-heading">
      <h2 id="submit-heading" className="text-lg font-black text-white flex items-center gap-2"><Send className="w-4 h-4 text-[#FF0080]" /> Submit your track</h2>
      <p className="text-xs text-[#9B8FB0] mt-1 mb-4">Producers and DJs: send us your Jersey club. We listen to every submission for the station rotation. Rising Now stays organic: it's ranked by SoundCloud growth, and placement can't be bought.</p>
      {state.status === 'done' ? (
        <div className="flex flex-col gap-3 flex-1 justify-center">
          <p className="text-sm text-white flex items-center gap-2"><Check className="w-4 h-4 text-[#00FF88]" /> Got it, thanks! We'll give it a listen.</p>
          {fastTrackHref && (
            <a href={fastTrackHref} target="_blank" rel="noopener noreferrer" className={`${BTN} self-start`} style={BTN_STYLE}>
              <Zap className="w-4 h-4" /> {FAST_TRACK_LABEL}
            </a>
          )}
          <button onClick={() => { setF({ name: '', email: '', soundcloudUrl: '', note: '', website: '' }); setState({ status: 'idle' }); }} className="text-xs text-[#C080FF] self-start hover:text-white">Submit another track</button>
        </div>
      ) : (
        <form onSubmit={submit} className="relative grid gap-3 sm:grid-cols-2">
          <Honeypot value={f.website} onChange={v => setF({ ...f, website: v })} />
          <input className={INPUT} style={INPUT_STYLE} placeholder="Artist / producer name" value={f.name} onChange={set('name')} required maxLength={80} aria-label="Artist or producer name" />
          <input className={INPUT} style={INPUT_STYLE} type="email" placeholder="Email (for our reply)" value={f.email} onChange={set('email')} required aria-label="Email" />
          <input className={`${INPUT} sm:col-span-2`} style={INPUT_STYLE} type="url" placeholder="SoundCloud track link: https://soundcloud.com/…" value={f.soundcloudUrl} onChange={set('soundcloudUrl')} required aria-label="SoundCloud track link" />
          <textarea className={`${INPUT} sm:col-span-2 h-20 py-2 resize-none`} style={INPUT_STYLE} placeholder="Anything we should know? (optional)" value={f.note} onChange={set('note')} maxLength={1000} aria-label="Note" />
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={state.status === 'sending'} className={BTN} style={BTN_STYLE}>
              {state.status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit track
            </button>
            {state.status === 'error' && <p className="text-xs text-[#FF4D6D]" role="alert">{state.error}</p>}
          </div>
          <p className="sm:col-span-2 text-[10px] text-[#5B4F70]">By submitting you agree to our <Link to="/privacy" className="underline">Privacy Policy</Link>. We only use your email to reply about this track.</p>
        </form>
      )}
    </section>
  );
}

function ChartSignupCard() {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'done' | 'error'; error?: string }>({ status: 'idle' });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ status: 'sending' });
    const r = await post('subscribe', { email, website });
    setState(r.ok ? { status: 'done' } : { status: 'error', error: r.error });
  };
  return (
    <section className="p-4 md:p-5 flex flex-col" style={{ ...CARD_STYLE, background: 'linear-gradient(160deg, #1A0033 0%, #0A0716 60%)' }} aria-labelledby="signup-heading">
      <h2 id="signup-heading" className="text-lg font-black text-white flex items-center gap-2"><Mail className="w-4 h-4 text-[#FFD700]" /> Rising Now in your inbox</h2>
      <p className="text-xs text-[#B9A6D6] mt-1 mb-4">The week's fastest-rising Jersey club tracks, every Monday. Be first to hear what's next.</p>
      <ul className="flex flex-col gap-2 mb-4 list-none p-0">
        {['The Rising Now top 10 and this week\'s breakouts', 'Producers to watch before they blow up', 'New stories from the Jersey club scene'].map(t => (
          <li key={t} className="flex items-start gap-2 text-xs text-[#D8CCEA]"><Check className="w-3.5 h-3.5 text-[#00FF88] mt-0.5 shrink-0" />{t}</li>
        ))}
      </ul>
      {state.status === 'done' ? (
        <p className="text-sm text-white flex items-center gap-2 mt-auto mb-auto"><Check className="w-4 h-4 text-[#00FF88]" /> You're on the list.</p>
      ) : (
        <form onSubmit={submit} className="relative flex flex-col gap-3 mt-auto">
          <Honeypot value={website} onChange={setWebsite} />
          <input className={INPUT} style={INPUT_STYLE} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required aria-label="Email for the weekly chart" />
          <button type="submit" disabled={state.status === 'sending'} className={BTN} style={BTN_STYLE}>
            {state.status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Get the chart
          </button>
          {state.status === 'error' && <p className="text-xs text-[#FF4D6D]" role="alert">{state.error}</p>}
          <p className="text-[10px] text-[#5B4F70]">No spam. Unsubscribe anytime. <Link to="/privacy" className="underline">Privacy</Link></p>
        </form>
      )}
    </section>
  );
}

/** Homepage section under the stories: reach stats, track submissions, weekly chart signup */
export function GrowthSection() {
  return (
    <div className="flex flex-col gap-6 mb-6">
      <StatsBand />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SubmitTrackCard />
        <ChartSignupCard />
      </div>
    </div>
  );
}
