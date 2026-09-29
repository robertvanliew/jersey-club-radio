import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Copy, Check } from 'lucide-react';
import { ContactForm, TOPICS, topicForEmail } from './ContactForm';

const SITE_DOMAIN = '@jerseyclubradio.com';

/**
 * Clicking any of the site's own email addresses (mailto:…@jerseyclubradio.com, anywhere on the
 * site) opens this contact form instead of the visitor's mail app. Links marked `data-mail-app`
 * and other addresses (e.g. a submitter's email in the admin inbox) still open the mail app.
 */
export function ContactModal() {
  const [address, setAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href^="mailto:"]') as HTMLAnchorElement | null;
      if (!a || a.hasAttribute('data-mail-app')) return;
      const to = decodeURIComponent(a.href.slice('mailto:'.length).split('?')[0]).trim().toLowerCase();
      if (!to.endsWith(SITE_DOMAIN)) return;
      e.preventDefault();
      setCopied(false);
      setAddress(to);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    if (!address) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAddress(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [address]);

  const route = address ? topicForEmail(address) : null;
  const heading = route?.subject ?? TOPICS.find(t => t.id === route?.topic && t.id !== 'general')?.label ?? 'Send us a message';

  const copy = async () => {
    if (!address) return;
    try { await navigator.clipboard.writeText(address); setCopied(true); } catch { }
  };

  return (
    <AnimatePresence>
      {address && route && (
        <>
          <motion.div
            className="fixed inset-0 z-[210] bg-black/75 backdrop-blur-sm"
            onClick={() => setAddress(null)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <div className="fixed inset-0 z-[211] flex items-end sm:items-center justify-center pointer-events-none sm:p-4">
            <motion.div
              role="dialog" aria-modal="true" aria-labelledby="contact-modal-title"
              className="pointer-events-auto w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
              style={{ background: '#0A0716', border: '1px solid rgba(157,0,255,0.25)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', fontFamily: 'Inter, system-ui, sans-serif' }}
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            >
              <div className="h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #9D00FF, #FF0080)' }} />
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h2 id="contact-modal-title" className="text-xl font-extrabold text-white leading-tight">{heading}</h2>
                    <p className="text-sm text-[#A99DBF] mt-1 flex items-start gap-1.5 min-w-0">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0 text-[#C77DFF] mt-[3px]" />
                      <span>Goes straight to <span className="whitespace-nowrap">{address}</span></span>
                    </p>
                  </div>
                  <button onClick={() => setAddress(null)} aria-label="Close"
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-white/10"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <X className="w-4 h-4 text-[#A99DBF]" />
                  </button>
                </div>

                <ContactForm key={address} initialTopic={route.topic} subject={route.subject} />

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-4 text-xs text-[#7B6F90]" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span>Prefer your own email?</span>
                  <a href={`mailto:${address}`} data-mail-app className="font-semibold text-[#C77DFF] hover:text-white">Open mail app</a>
                  <button type="button" onClick={copy} className="text-xs font-semibold text-[#C77DFF] hover:text-white flex items-center gap-1">
                    {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy address</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
