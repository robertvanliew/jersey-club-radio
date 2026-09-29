import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CARD_STYLE } from '../components/RisingNow';
import { ContactForm, TOPICS, type TopicId } from '../components/ContactForm';
import { EMAILS } from '../config/contact';

/** /contact (?topic=advertising preselects a topic) */
export function ContactPage() {
  const [params] = useSearchParams();
  const initial = (TOPICS.find(t => t.id === params.get('topic'))?.id ?? 'general') as TopicId;

  useEffect(() => {
    const prev = document.title;
    document.title = 'Contact & Advertise | Jersey Club Radio';
    return () => { document.title = prev; };
  }, []);

  return (
    <div className="max-w-2xl mx-auto w-full pb-10 flex flex-col gap-4">
      <header className="p-4 md:p-5" style={CARD_STYLE}>
        <h1 className="text-2xl md:text-3xl font-black text-white">Work with Jersey Club Radio</h1>
        <p className="text-sm text-[#B9A6D6] mt-1">Advertising, bookings, press or anything else: send us a message and we'll get back to you.</p>
        <p className="text-xs text-[#7B6F90] mt-2">Producers: to submit music, use the <Link to="/" className="text-[#C080FF] underline">Submit your track</Link> form on the homepage.</p>
      </header>

      <section className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2" style={CARD_STYLE} aria-label="Email us directly">
        {[
          ['General', EMAILS.info], ['Advertising & sponsorship', EMAILS.ads], ['Bookings', EMAILS.bookings],
          ['Press', EMAILS.press], ['Music & submissions', EMAILS.music], ['Billing & refunds', EMAILS.refunds],
        ].map(([label, email]) => (
          <p key={email} className="text-xs text-[#9B8FB0]">
            <span className="block text-[10px] font-black uppercase tracking-wider text-[#7B6F90]">{label}</span>
            <a href={`mailto:${email}`} className="text-[#C080FF] hover:text-white">{email}</a>
          </p>
        ))}
      </section>

      <section className="p-4 md:p-5" style={CARD_STYLE}>
        <ContactForm key={initial} initialTopic={initial} />
      </section>
    </div>
  );
}
