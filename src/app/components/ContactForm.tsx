import React, { useState } from 'react';
import { Link } from 'react-router';
import { Check, Loader2, Send, Megaphone, CalendarDays, Newspaper, MessageSquare } from 'lucide-react';
import { post, Honeypot, INPUT, INPUT_STYLE, BTN, BTN_STYLE } from './GrowthSection';
import { EMAILS } from '../config/contact';

export const TOPICS = [
  { id: 'advertising', label: 'Advertise / sponsor', icon: Megaphone, email: EMAILS.ads, blurb: 'Reach Jersey club fans, dancers and producers: sponsor the Rising Now chart, the stream or the weekly email.' },
  { id: 'booking', label: 'Bookings', icon: CalendarDays, email: EMAILS.bookings, blurb: 'DJ sets, events and live broadcasts.' },
  { id: 'press', label: 'Press', icon: Newspaper, email: EMAILS.press, blurb: 'Interviews, features and media requests.' },
  { id: 'general', label: 'General', icon: MessageSquare, email: EMAILS.info, blurb: 'Anything else: feedback, partnerships, questions.' },
] as const;
export type TopicId = typeof TOPICS[number]['id'];

/** Which form topic (and, for addresses without their own topic, which subject) an address maps to */
export function topicForEmail(address: string): { topic: TopicId; subject?: string } {
  const a = address.toLowerCase();
  if (a === EMAILS.ads) return { topic: 'advertising' };
  if (a === EMAILS.bookings) return { topic: 'booking' };
  if (a === EMAILS.press) return { topic: 'press' };
  if (a === EMAILS.music) return { topic: 'general', subject: 'Music & submissions' };
  if (a === EMAILS.privacy) return { topic: 'general', subject: 'Privacy & data request' };
  if (a === EMAILS.refunds) return { topic: 'general', subject: 'Billing & refunds' };
  return { topic: 'general' };
}

/** Contact form used on /contact and in the email pop-up. `subject` is prefixed to the message. */
export function ContactForm({ initialTopic = 'general', subject }: { initialTopic?: TopicId; subject?: string }) {
  const [f, setF] = useState({ name: '', email: '', topic: initialTopic, message: '', website: '' });
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'done' | 'error'; error?: string }>({ status: 'idle' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ status: 'sending' });
    const r = await post('contact', { ...f, message: subject ? `[${subject}] ${f.message}` : f.message });
    setState(r.ok ? { status: 'done' } : { status: 'error', error: r.error });
  };
  const topic = TOPICS.find(t => t.id === f.topic)!;

  if (state.status === 'done') {
    return (
      <div className="py-8 text-center">
        <p className="text-lg font-bold text-white flex items-center justify-center gap-2"><Check className="w-5 h-5 text-[#00FF88]" /> Message sent</p>
        <p className="text-sm text-[#9B8FB0] mt-1">Thanks, {f.name}. We'll reply to {f.email}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="relative flex flex-col gap-3">
      <Honeypot value={f.website} onChange={v => setF({ ...f, website: v })} />
      {!subject && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Topic">
          {TOPICS.map(t => (
            <button type="button" key={t.id} role="radio" aria-checked={f.topic === t.id} onClick={() => setF({ ...f, topic: t.id })}
              className="flex flex-col items-center gap-1 p-3 rounded-lg text-[11px] font-bold transition-colors"
              style={{ background: f.topic === t.id ? 'rgba(157,0,255,0.2)' : '#06000F', border: `1px solid ${f.topic === t.id ? '#9D00FF' : 'rgba(157,0,255,0.2)'}`, color: f.topic === t.id ? '#fff' : '#9B8FB0' }}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      )}
      {!subject && <p className="text-xs text-[#9B8FB0]">{topic.blurb}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={INPUT} style={INPUT_STYLE} placeholder="Your name or company" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required maxLength={80} aria-label="Name" autoComplete="name" />
        <input className={INPUT} style={INPUT_STYLE} type="email" placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required aria-label="Email" autoComplete="email" />
      </div>
      <textarea className={`${INPUT} h-36 py-2 resize-none`} style={INPUT_STYLE} placeholder="How can we help?" value={f.message} onChange={e => setF({ ...f, message: e.target.value })} required maxLength={4900} aria-label="Message" />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={state.status === 'sending'} className={BTN} style={BTN_STYLE}>
          {state.status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send message
        </button>
        {state.status === 'error' && <p className="text-xs text-[#FF4D6D]" role="alert">{state.error}</p>}
      </div>
      <p className="text-[10px] text-[#5B4F70]">We only use your details to reply. <Link to="/privacy" className="underline">Privacy Policy</Link></p>
    </form>
  );
}
