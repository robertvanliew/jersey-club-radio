import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ChevronDown, Shield, Key, Infinity, CreditCard,
  Fingerprint, Star, Check, Radio, HardDrive, Headphones, ArrowRight,
} from 'lucide-react';

interface TermsPricingDrawerProps {
  open: boolean;
  onClose: () => void;
}

const EFFECTIVE_DATE = 'September 29, 2026';
const GOLD = 'linear-gradient(135deg, #bf953f, #fcf6ba 55%, #b38728)';

const SUMMARY = [
  { icon: Headphones, title: 'Free to listen', body: 'No account and no sign-up. Press play and the station runs 24/7.' },
  { icon: Fingerprint, title: 'No login needed', body: 'An anonymous device ID saves your crate and game progress. We never ask for your name to listen.' },
  { icon: HardDrive, title: 'Saved on your device', body: 'Your crate, games and listening history live in your browser. No cross-site tracking.' },
];

const PERKS = ['Unlimited crate saves', 'Gold vinyl status', 'Gold name in the Game Hub', 'Recovery key for new devices'];

export function TermsPricingDrawer({ open, onClose }: TermsPricingDrawerProps) {
  const [section, setSection] = useState<string | null>(null);

  useEffect(() => {
    if (open) setSection(null);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Panel: slides in from the right on desktop, full-screen on mobile */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-title"
            className="fixed top-0 right-0 bottom-0 z-[201] w-full md:max-w-[480px] flex flex-col overflow-hidden"
            style={{
              background: '#0A0716',
              borderLeft: '1px solid rgba(157,0,255,0.18)',
              boxShadow: '-16px 0 80px rgba(0,0,0,0.85)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="h-[3px] flex-shrink-0" style={{ background: 'linear-gradient(90deg, #9D00FF, #FF0080)' }} />

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-6 pt-6 pb-6 space-y-7">

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9D00FF, #FF0080)' }}>
                        <Radio className="w-3.5 h-3.5 text-white" />
                      </span>
                      <span className="text-xs font-semibold text-[#A99DBF]">Jersey Club Radio</span>
                    </div>
                    <h1 id="terms-title" className="text-2xl font-extrabold text-white leading-tight tracking-tight">
                      Welcome to the station
                    </h1>
                    <p className="text-sm text-[#A99DBF] mt-1.5 leading-relaxed">
                      Here is the short version of how the site works.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-white/10"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-[#A99DBF]" />
                  </button>
                </div>

                {/* The short version */}
                <ul className="space-y-4">
                  {SUMMARY.map(({ icon: Icon, title, body }) => (
                    <li key={title} className="flex gap-3.5">
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(157,0,255,0.12)', border: '1px solid rgba(157,0,255,0.22)' }}>
                        <Icon className="w-4 h-4 text-[#C77DFF]" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{title}</p>
                        <p className="text-[13px] text-[#A99DBF] leading-relaxed mt-0.5">{body}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Optional upgrade */}
                <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #150a26 0%, #0F0022 100%)', border: '1px solid rgba(191,149,63,0.3)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d4b56a]">Optional upgrade</p>
                      <p className="text-lg font-bold text-white mt-1">24K Crate Digger</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-extrabold" style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>$7.99</p>
                      <p className="text-[11px] text-[#8A7FA0]">one-time, lifetime</p>
                    </div>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-4">
                    {PERKS.map(p => (
                      <li key={p} className="flex items-center gap-2 text-[13px] text-[#D9D0E8]">
                        <Check className="w-3.5 h-3.5 flex-shrink-0 text-[#d4b56a]" />{p}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-[#8A7FA0] leading-relaxed mt-4 pt-4" style={{ borderTop: '1px solid rgba(191,149,63,0.15)' }}>
                    Buyers get a recovery key. Keep it somewhere safe: it is the only way to restore the upgrade on a new device. Everything else on the site stays free.
                  </p>
                </div>

                {/* Full terms */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7B6F90] mb-2.5">The details</p>
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                    <Section id="what" icon={Infinity} title="What the upgrade includes" active={section} setActive={setSection}>
                      <p className="mb-3">A 24K Crate Digger purchase gives you a single, non-transferable, lifetime license to:</p>
                      <ul className="space-y-2.5">
                        <LegalItem label="Unlimited crate storage">The default 7-track save limit is removed for your device.</LegalItem>
                        <LegalItem label="Gold vinyl status">Your saved records show gold vinyl art across the site.</LegalItem>
                        <LegalItem label="Gold name in the Game Hub">Your name shows in gold in Spades, Chess, Checkers and the other multiplayer games.</LegalItem>
                        <LegalItem label="Recovery key">A unique key (J-CLUB-XXXX-XXXX-XXXX) tied to your device ID. Use it to restore the upgrade on a new device.</LegalItem>
                        <LegalItem label="Crate priority">Your saved crate is given priority in the radio rotation.</LegalItem>
                      </ul>
                    </Section>

                    <Section id="billing" icon={CreditCard} title="Payment and refunds" active={section} setActive={setSection}>
                      <ul className="space-y-2.5">
                        <LegalItem label="Payments">Handled by a secure third-party payment processor. Jersey Club Radio never sees or stores your card details.</LegalItem>
                        <LegalItem label="Price">$7.99 USD, one-time. Not a subscription.</LegalItem>
                        <LegalItem label="Refunds">The upgrade activates instantly, so sales are final unless the law where you live says otherwise. See the <a href="/refund-policy" target="_blank" rel="noopener" className="text-[#C77DFF] underline underline-offset-2">refund policy</a>.</LegalItem>
                        <LegalItem label="Chargebacks">A fraudulent chargeback removes the upgrade and cancels the recovery key.</LegalItem>
                      </ul>
                    </Section>

                    <Section id="key" icon={Key} title="Your recovery key" active={section} setActive={setSection}>
                      <ul className="space-y-2.5">
                        <LegalItem label="Keep it safe">You are responsible for saving your key. A password manager works well.</LegalItem>
                        <LegalItem label="Lost keys">We cannot recover a lost key. Your current device keeps the upgrade until its browser storage is cleared.</LegalItem>
                        <LegalItem label="Clearing browser data">This resets your device ID. Enter your key to get the upgrade back.</LegalItem>
                        <LegalItem label="Sharing">Keys are personal and non-transferable. Sharing one may get it revoked.</LegalItem>
                      </ul>
                    </Section>

                    <Section id="privacy" icon={Fingerprint} title="Privacy and your data" active={section} setActive={setSection}>
                      <ul className="space-y-2.5">
                        <LegalItem label="Device ID">We create an anonymous ID from your browser setup. It is how the site remembers you without a login.</LegalItem>
                        <LegalItem label="What we store">Your crate, upgrade status and a hashed reference to your recovery key.</LegalItem>
                        <LegalItem label="Emails">We only have your email if you join the newsletter, submit a track or contact us, and we only use it for that.</LegalItem>
                        <LegalItem label="Payments">We receive a payment confirmation and a customer reference from the payment processor, nothing more.</LegalItem>
                        <LegalItem label="Analytics">Anonymous, aggregate listening stats that cannot be linked to you.</LegalItem>
                        <LegalItem label="Deleting your data">Email us with your recovery key or device ID and we will delete your record.</LegalItem>
                      </ul>
                    </Section>

                    <Section id="security" icon={Shield} title="Security and age" active={section} setActive={setSection}>
                      <ul className="space-y-2.5">
                        <LegalItem label="Encryption">Everything is sent over TLS 1.2 or newer.</LegalItem>
                        <LegalItem label="Storage">Records are kept in an isolated server-side store. Payment keys never reach your browser.</LegalItem>
                        <LegalItem label="Age">You must be at least 13, or the digital consent age where you live, to buy the upgrade.</LegalItem>
                      </ul>
                    </Section>
                  </div>
                </div>

                <p className="text-xs text-[#7B6F90] leading-relaxed">
                  We may update these terms with 14 days' notice. Governed by the laws of New Jersey, USA. Effective {EFFECTIVE_DATE}.{' '}
                  Read the full <a href="/terms" target="_blank" rel="noopener" className="text-[#C77DFF] hover:text-white">Terms of Service</a>,{' '}
                  <a href="/privacy" target="_blank" rel="noopener" className="text-[#C77DFF] hover:text-white">Privacy Policy</a> and{' '}
                  <a href="/refund-policy" target="_blank" rel="noopener" className="text-[#C77DFF] hover:text-white">Refund Policy</a>.
                </p>
              </div>
            </div>

            {/* Agree and enter */}
            <div className="flex-shrink-0 px-6 pt-4 pb-5" style={{ background: '#0A0716', borderTop: '1px solid rgba(157,0,255,0.15)' }}>
              <motion.button
                onClick={onClose}
                className="w-full h-12 rounded-xl font-bold text-[15px] text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #9D00FF, #FF0080)', boxShadow: '0 8px 30px rgba(157,0,255,0.3)' }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
              >
                Agree and start listening <ArrowRight className="w-4 h-4" />
              </motion.button>
              <p className="text-center text-[11px] text-[#7B6F90] mt-2.5">
                By continuing you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface SectionProps {
  id: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  active: string | null;
  setActive: (id: string | null) => void;
}

function Section({ id, icon: Icon, title, children, active, setActive }: SectionProps) {
  const isOpen = active === id;
  return (
    <div className="border-b border-white/[0.06] last:border-b-0" style={{ background: isOpen ? 'rgba(157,0,255,0.05)' : 'transparent' }}>
      <button
        onClick={() => setActive(isOpen ? null : id)}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isOpen ? '#C77DFF' : '#7B6F90' }} />
        <span className={`flex-1 text-sm font-medium ${isOpen ? 'text-white' : 'text-[#D9D0E8]'}`}>{title}</span>
        <ChevronDown
          className="w-4 h-4 flex-shrink-0 transition-transform text-[#7B6F90]"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-11 text-[13px] text-[#A99DBF] leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LegalItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="list-none">
      <span className="text-white font-medium">{label}. </span>
      <span>{children}</span>
    </li>
  );
}
