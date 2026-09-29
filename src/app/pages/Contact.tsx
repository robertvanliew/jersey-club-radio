import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Check, Loader2, Send, Megaphone, CalendarDays, Newspaper, MessageSquare } from 'lucide-react';
import { CARD_STYLE } from '../components/RisingNow';
import { post, Honeypot, INPUT, INPUT_STYLE, BTN, BTN_STYLE } from '../components/GrowthSection';
import { EMAILS } from '../config/contact';

const TOPICS = [
  { id: 'advertising', label: 'Advertise / sponsor', icon: Megaphone, email: EMAILS.ads, blurb: 'Reach Jersey club fans, dancers and producers: sponsor the Rising Now chart, the stream or the weekly email.' },
  { id: 'booking', label: 'Bookings', icon: CalendarDays, email: EMAILS.bookings, blurb: 'DJ sets, events and live broadcasts.' },
  { id: 'press', label: 'Press', icon: Newspaper, email: EMAILS.press, blurb: 'Interviews, features and media requests.' },
  { id: 'general', label: 'General', icon: MessageSquare, email: EMAILS.hello, blurb: 'Anything else: feedback, partnerships, questions.' },
] as const;
type TopicId = typeof TOPICS[number]['id'];

/** /contact (?topic=advertising preselects a topic) */
export function ContactPage() {
  const [params] = useSearchParams();
  const initial = (TOPICS.find(t => t.id === params.get('topic'))?.id ?? 'general') as TopicId;
  const [f, setF] = useState({ name: '', email: '', topic: initial, message: '', website: '' });
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'done' | 'error'; error?: string }>({ status: 'idle' });

  useEffect(() => {
    const prev = document.title;
    document.title = 'Contact & Advertise | Jersey Club Radio';
    return () => { document.title = prev; };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ status: 'sending' });
    const r = await post('contact', f);
    setState(r.ok ? { status: 'done' } : { status: 'error', error: r.error });
  };
  const topic = TOPICS.find(t => t.id === f.topic)!;

  return (
    <div className="max-w-2xl mx-auto w-full pb-10 flex flex-col gap-4">
      <header className="p-4 md:p-5" style={CARD_STYLE}>
        <h1 className="text-2xl md:text-3xl font-black text-white">Work with Jersey Club Radio</h1>
        <p className="text-sm text-[#B9A6D6] mt-1">Advertising, bookings, press or anything else: send us a message and we'll get back to you.</p>
        <p className="text-xs text-[#7B6F90] mt-2">Producers: to submit music, use the <Link to="/" className="text-[#C080FF] underline">Submit your track</Link> form on the homepage.</p>
      </header>

      <section className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2" style={CARD_STYLE} aria-label="Email us directly">
        {[
          ['General', EMAILS.hello], ['Advertising & sponsorship', EMAILS.ads], ['Bookings', EMAILS.bookings],
          ['Press', EMAILS.press], ['Music & submissions', EMAILS.music], ['Billing & refunds', EMAILS.refunds],
        ].map(([label, email]) => (
          <p key={email} className="text-xs text-[#9B8FB0]">
            <span className="block text-[10px] font-black uppercase tracking-wider text-[#7B6F90]">{label}</span>
            <a href={`mailto:${email}`} className="text-[#C080FF] hover:text-white">{email}</a>
          </p>
        ))}
      </section>

      <section className="p-4 md:p-5" style={CARD_STYLE}>
        {state.status === 'done' ? (
          <div className="py-8 text-center">
            <p className="text-lg font-bold text-white flex items-center justify-center gap-2"><Check className="w-5 h-5 text-[#00FF88]" /> Message sent</p>
            <p className="text-sm text-[#9B8FB0] mt-1">Thanks, {f.name}. We'll reply to {f.email}.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="relative flex flex-col gap-3">
            <Honeypot value={f.website} onChange={v => setF({ ...f, website: v })} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Topic">
              {TOPICS.map(t => (
                <button type="button" key={t.id} role="radio" aria-checked={f.topic === t.id} onClick={() => setF({ ...f, topic: t.id })}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg text-[11px] font-bold transition-colors"
                  style={{ background: f.topic === t.id ? 'rgba(157,0,255,0.2)' : '#06000F', border: `1px solid ${f.topic === t.id ? '#9D00FF' : 'rgba(157,0,255,0.2)'}`, color: f.topic === t.id ? '#fff' : '#9B8FB0' }}>
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#9B8FB0]">
              {topic.blurb} Prefer email? Write to{' '}
              <a href={`mailto:${topic.email}`} className="text-[#C080FF] underline hover:text-white">{topic.email}</a>.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={INPUT} style={INPUT_STYLE} placeholder="Your name or company" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required maxLength={80} aria-label="Name" />
              <input className={INPUT} style={INPUT_STYLE} type="email" placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required aria-label="Email" />
            </div>
            <textarea className={`${INPUT} h-36 py-2 resize-none`} style={INPUT_STYLE} placeholder="How can we help?" value={f.message} onChange={e => setF({ ...f, message: e.target.value })} required maxLength={5000} aria-label="Message" />
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={state.status === 'sending'} className={BTN} style={BTN_STYLE}>
                {state.status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send message
              </button>
              {state.status === 'error' && <p className="text-xs text-[#FF4D6D]" role="alert">{state.error}</p>}
            </div>
            <p className="text-[10px] text-[#5B4F70]">We only use your details to reply. <Link to="/privacy" className="underline">Privacy Policy</Link></p>
          </form>
        )}
      </section>
    </div>
  );
}
