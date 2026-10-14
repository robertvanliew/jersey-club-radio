import { useEffect } from 'react';
import { Link } from 'react-router';
import { Radio, Flame, Newspaper, Users } from 'lucide-react';
import { setHead } from '../lib/head';
import { CARD_STYLE } from '../components/RisingNow';

const LINKS = [
  { to: '/', label: 'Listen live', icon: Radio },
  { to: '/hot', label: 'Rising Now chart', icon: Flame },
  { to: '/news', label: 'Stories', icon: Newspaper },
  { to: '/artists', label: 'Artists', icon: Users },
];

/** Any URL the app doesn't know. The server answers these with a real 404 (dist/404.html). */
export function NotFound() {
  useEffect(() => {
    setHead({ title: 'Page Not Found | Jersey Club Radio', description: 'That page does not exist.', path: window.location.pathname, noindex: true });
  }, []);
  return (
    <div className="max-w-xl mx-auto w-full py-10 px-1">
      <section className="p-6 md:p-8 text-center" style={CARD_STYLE}>
        <p className="text-5xl font-black text-white">404</p>
        <h1 className="text-xl md:text-2xl font-black text-white mt-2">Page not found</h1>
        <p className="text-sm text-[#A99DBF] mt-2">That page doesn't exist, but the station is still playing.</p>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-bold text-white transition-colors hover:bg-white/10"
              style={{ background: 'rgba(157,0,255,0.12)', border: '1px solid rgba(157,0,255,0.25)' }}>
              <Icon className="w-4 h-4 text-[#C77DFF]" /> {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
