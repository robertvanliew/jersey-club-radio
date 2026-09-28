import { motion, AnimatePresence, useInView } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router';
import { articles } from '../../data/news';
import { plainText } from '../../data/news/newsUtils.mjs';

/* ─── Types ──────────────────────────────────────────────────────── */
interface Article {
    title: string;
    source: string;
    author: string | null;
    published_date: string | null;
    url: string;
    summary: string;
    angle: string;
}

/* ─── Data ───────────────────────────────────────────────────────── */
// Real articles; titles, authors and dates checked against each page (Sept 28, 2026).
// Summaries are our own words.
const ARTICLES: Article[] = [
    {
        title: 'The Sky’s The Limit: An Oral History of Jersey Club',
        source: 'The FADER', author: 'Ruth Saxelby', published_date: '2014-06-12',
        url: 'https://www.thefader.com/2014/06/12/the-skys-the-limit-an-oral-history-of-jersey-club',
        summary: 'DJ Tameil, DJ Sliink, UNiiQU3 and more tell the story of how the Downtown Newark sound grew from CDs sold on Broad Street into a movement.',
        angle: 'scene history',
    },
    {
        title: 'How “Just Wanna Rock” Helped Jersey Club Take Over TikTok',
        source: 'Complex', author: 'Jordan Rose', published_date: '2022-12-16',
        url: 'https://www.complex.com/music/a/j-rose/lil-uzi-vert-just-wanna-rock-jersey-club-tiktok',
        summary: 'How Lil Uzi Vert’s MCVertt-produced single carried Jersey club from viral dance clips to the mainstream charts.',
        angle: 'industry trend',
    },
    {
        title: 'Jersey Club Queen UNIIQU3 mixes the past, present, and future in Hometown Sounds',
        source: 'The FADER', author: null, published_date: '2024-05-15',
        url: 'https://www.thefader.com/2024/05/15/jersey-club-queen-uniiqu3-serato-hometown-sounds',
        summary: 'The DJ and producer known as the Jersey Club Queen on flipping new and nostalgic samples into the Newark sound.',
        angle: 'artist profile',
    },
    {
        title: 'Jersey Club Keeps on Moving',
        source: 'Bandcamp Daily', author: 'Michael Piantini', published_date: '2026-01-12',
        url: 'https://daily.bandcamp.com/scene-report/jersey-club-music-on-bandcamp',
        summary: 'A scene report on the pioneering genre in all of its forms, and the producers pushing it forward today.',
        angle: 'scene history',
    },
    {
        title: 'Brick City Club Music: The Evolution of Jersey Club, Jersey Trap, and Tang Dance',
        source: 'The Music Origins Project', author: 'David Grandison Jr.', published_date: '2025-03-11',
        url: 'https://musicorigins.org/jersey-club-jersey-trap-and-tang-dance/',
        summary: 'From underground Newark parties to viral fame: how Jersey club, Jersey trap and the Tang dance style evolved and spread.',
        angle: 'scene history',
    },
    {
        title: 'Lil Uzi Vert – “Just Wanna Rock”',
        source: 'Stereogum', author: 'Tom Breihan', published_date: '2022-10-18',
        url: 'https://www.stereogum.com/2203171/lil-uzi-vert-just-wanna-rock/music/',
        summary: 'The release of the Jersey club single that had already racked up huge views as a leaked TikTok snippet.',
        angle: 'news',
    },
];

/* Once our own article retelling a source is published, show and link ours instead */
type Shown = Article & { internal?: string; excerpt?: string; tag?: string };
const SHOWN: Shown[] = ARTICLES.map(a => {
    const own = articles.find(n => n.sources[0]?.url === a.url);
    if (!own) return a;
    const first = own.body.find(b => 'p' in b) as { p: string } | undefined;
    return {
        ...a, title: own.title, source: 'Jersey Club Radio', author: null, published_date: own.date,
        summary: own.dek, internal: `/news/${own.slug}`, tag: own.tag, excerpt: first ? plainText(first.p) : undefined,
    };
});

/* ─── Palette ────────────────────────────────────────────────────── */
const PALETTE: Record<string, { text: string; border: string; glow: string }> = {
    'scene history': { text: '#C084FC', border: '#9D00FF', glow: 'rgba(157,0,255,0.5)' },
    'artist profile': { text: '#FF8AC0', border: '#FF0080', glow: 'rgba(255,0,128,0.5)' },
    'industry trend': { text: '#67E8F9', border: '#00B8D9', glow: 'rgba(0,184,217,0.4)' },
    'op-ed': { text: '#FCD34D', border: '#F59E0B', glow: 'rgba(245,158,11,0.4)' },
    'interview': { text: '#6EE7B7', border: '#10B981', glow: 'rgba(16,185,129,0.4)' },
    'news': { text: '#C084FC', border: '#9D00FF', glow: 'rgba(157,0,255,0.5)' },
};
const getPal = (angle: string) => PALETTE[angle.toLowerCase()] ?? PALETTE['scene history'];

function fmtDate(iso: string | null) {
    if (!iso) return null;
    // Date-only strings parse as UTC midnight; format in UTC so US visitors don't see the previous day
    try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }); }
    catch { return iso; }
}

/* ─── Component ──────────────────────────────────────────────────── */
export function JerseyClubArticles() {
    const [idx, setIdx] = useState(0);
    const [dir, setDir] = useState<1 | -1>(1);
    const [paused, setPaused] = useState(false);

    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

    const go = (d: 1 | -1) => { setDir(d); setIdx(i => (i + d + ARTICLES.length) % ARTICLES.length); };
    const jumpTo = (i: number) => { setDir(i > idx ? 1 : -1); setIdx(i); };

    useEffect(() => {
        if (paused) return;
        const t = setInterval(() => { setDir(1); setIdx(i => (i + 1) % ARTICLES.length); }, 7000);
        return () => clearInterval(t);
    }, [paused]);

    const art = SHOWN[idx];
    const p = getPal(art.angle);
    const isReal = art.url !== '#';
    const num = String(idx + 1).padStart(2, '0');
    const words = art.title.split(' ');

    return (
        <div ref={sectionRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10 mb-6">
            <div className="lg:col-span-2 flex flex-col">

                {/* Section header */}
                <motion.div
                    className="flex items-center gap-3 mb-5"
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    <motion.span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: '#9D00FF', boxShadow: '0 0 8px #9D00FF' }}
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <h2
                        className="font-black text-white tracking-tight text-base md:text-[17px] leading-none"
                        style={{ fontFamily: "'Archivo', sans-serif" }}
                    >
                        Jersey Club History
                    </h2>
                    <span
                        className="text-[10px] font-semibold tracking-widest uppercase hidden sm:block"
                        style={{
                            background: 'linear-gradient(90deg, #9D00FF, #FF00FF)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        · Culture · History · Profiles
                    </span>
                </motion.div>

                {/* ── MAIN CARD ── */}
                <motion.div
                    className="relative flex overflow-hidden rounded-2xl flex-1"
                    style={{ minHeight: '440px', background: '#07010E' }}
                    initial={{ clipPath: 'inset(0 0 100% 0 round 16px)' }}
                    animate={isInView ? { clipPath: 'inset(0 0 0% 0 round 16px)' } : {}}
                    transition={{ duration: 0.75, delay: 0.15, ease: [0.76, 0, 0.24, 1] }}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                >
                    {/* Subtle border */}
                    <div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{ border: '1px solid rgba(255,255,255,0.055)', zIndex: 10 }}
                    />

                    {/* Radial color wash */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse 65% 50% at 95% 5%, ${p.border}0E, transparent 60%)`,
                            transition: 'background 0.85s ease',
                        }}
                    />

                    {/* Left accent bar — draws down */}
                    <motion.div
                        className="flex-shrink-0"
                        style={{
                            width: '3px',
                            background: `linear-gradient(180deg, ${p.border} 0%, ${p.border}55 60%, transparent 100%)`,
                            boxShadow: `4px 0 24px ${p.border}35`,
                            transition: 'background 0.85s ease, box-shadow 0.85s ease',
                            originY: 0,
                        }}
                        initial={{ scaleY: 0 }}
                        animate={isInView ? { scaleY: 1 } : {}}
                        transition={{ duration: 0.5, delay: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
                    />

                    {/* Content — fades in after card reveals */}
                    <motion.div
                        className="relative flex flex-col flex-1 overflow-hidden"
                        style={{ zIndex: 2 }}
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : {}}
                        transition={{ duration: 0.35, delay: 0.65 }}
                    >
                        {/* Ghost number */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`g${idx}`}
                                className="absolute font-black pointer-events-none select-none"
                                style={{
                                    right: '-0.05em',
                                    bottom: '-0.08em',
                                    fontSize: 'clamp(130px, 20vw, 240px)',
                                    lineHeight: 1,
                                    color: p.border,
                                    fontFamily: "'Archivo', sans-serif",
                                    letterSpacing: '-0.07em',
                                    transition: 'color 0.85s ease',
                                    zIndex: 0,
                                }}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 0.05, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.45 }}
                            >
                                {num}
                            </motion.div>
                        </AnimatePresence>

                        {/* ── TOP BAR ── */}
                        <div
                            className="flex items-center justify-between px-6 py-[14px] flex-shrink-0"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`meta-${idx}`}
                                    className="flex items-center gap-2.5 min-w-0"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.28 }}
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                        style={{ background: p.border, boxShadow: `0 0 6px ${p.border}` }}
                                    />
                                    <span
                                        className="text-[10px] font-black tracking-[0.28em] uppercase truncate"
                                        style={{ color: p.text, transition: 'color 0.85s ease' }}
                                    >
                                        {art.source}
                                    </span>
                                    <span className="w-px h-3 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
                                    <span
                                        className="text-[9px] font-bold tracking-[0.18em] uppercase truncate"
                                        style={{ color: p.border, opacity: 0.65, transition: 'color 0.85s ease' }}
                                    >
                                        {art.angle}
                                    </span>
                                </motion.div>
                            </AnimatePresence>

                            <div className="flex items-center gap-2.5 flex-shrink-0">
                                <span
                                    className="text-[11px] font-mono tabular-nums"
                                    style={{ color: 'rgba(255,255,255,0.2)' }}
                                >
                                    {num} / {String(ARTICLES.length).padStart(2, '0')}
                                </span>
                                <div className="flex gap-1">
                                    {([-1, 1] as const).map(d => (
                                        <motion.button
                                            key={d}
                                            onClick={() => go(d)}
                                            className="flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150"
                                            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)' }}
                                            whileHover={{ scale: 1.12 }}
                                            whileTap={{ scale: 0.88 }}
                                        >
                                            {d === -1 ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── BODY ── */}
                        <div className="flex-1 px-6 pt-7 pb-4 flex flex-col relative" style={{ zIndex: 1 }}>
                            <AnimatePresence mode="wait" custom={dir}>
                                <motion.div
                                    key={idx}
                                    custom={dir}
                                    variants={{
                                        enter: (d: number) => ({ opacity: 0, y: d * 18 }),
                                        center: { opacity: 1, y: 0 },
                                        exit: (d: number) => ({ opacity: 0, y: d * -18 }),
                                    }}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    className="flex flex-col flex-1"
                                >
                                    {/* Title — luxury word-reveal */}
                                    <h3
                                        className="font-black text-white leading-[1.06] tracking-tight mb-5"
                                        style={{
                                            fontFamily: "'Archivo', sans-serif",
                                            fontSize: 'clamp(24px, 3.4vw, 46px)',
                                            textShadow: `0 0 50px ${p.border}1A`,
                                            transition: 'text-shadow 0.85s ease',
                                        }}
                                    >
                                        {words.map((word, wi) => (
                                            <span
                                                key={`wrap-${idx}-${wi}`}
                                                style={{
                                                    display: 'inline-block',
                                                    overflow: 'hidden',
                                                    marginRight: '0.22em',
                                                    verticalAlign: 'bottom',
                                                    lineHeight: 1.12,
                                                }}
                                            >
                                                <motion.span
                                                    key={`w-${idx}-${wi}`}
                                                    style={{ display: 'inline-block' }}
                                                    initial={{ y: '110%' }}
                                                    animate={{ y: '0%' }}
                                                    transition={{
                                                        delay: 0.06 + wi * 0.052,
                                                        duration: 0.52,
                                                        ease: [0.16, 1, 0.3, 1],
                                                    }}
                                                >
                                                    {word}
                                                </motion.span>
                                            </span>
                                        ))}
                                    </h3>

                                    {/* Rule */}
                                    <motion.div
                                        style={{
                                            height: '1px',
                                            transformOrigin: 'left center',
                                            background: `linear-gradient(90deg, ${p.border}44, transparent 50%)`,
                                            marginBottom: '1.1rem',
                                            flexShrink: 0,
                                            transition: 'background 0.85s ease',
                                        }}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ delay: 0.22, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    />

                                    {/* Summary */}
                                    <motion.p
                                        className="text-base leading-relaxed font-medium"
                                        style={{ color: '#CDBFE3' }}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.28, duration: 0.38 }}
                                    >
                                        {art.summary}
                                    </motion.p>
                                    {/* Opening paragraph of our own article, for a fuller editorial feature */}
                                    {art.excerpt && (
                                        <motion.p
                                            className="text-sm leading-relaxed mt-3 line-clamp-4"
                                            style={{ color: '#8E80A8' }}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.36, duration: 0.38 }}
                                        >
                                            {art.excerpt}
                                        </motion.p>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* ── FOOTER ── */}
                        <div
                            className="px-6 py-3 flex items-center justify-between flex-wrap gap-2"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                        >
                            <span
                                className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                                style={{ color: 'rgba(255,255,255,0.2)' }}
                            >
                                {art.author ?? 'Jersey Club Radio'}
                                {fmtDate(art.published_date) ? ` · ${fmtDate(art.published_date)}` : ''}
                            </span>

                            {art.internal ? (
                                <Link
                                    to={art.internal}
                                    className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.16em] uppercase px-4 py-2 rounded-full hover:scale-105 transition-transform"
                                    style={{ color: '#fff', background: `linear-gradient(135deg, ${p.border}, ${p.border}CC)`, boxShadow: `0 0 20px ${p.glow}` }}
                                >
                                    Read Article
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            ) : isReal && (
                                <motion.a
                                    href={art.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.16em] uppercase px-4 py-2 rounded-full"
                                    style={{
                                        color: '#fff',
                                        background: `linear-gradient(135deg, ${p.border}, ${p.border}CC)`,
                                        boxShadow: `0 0 20px ${p.glow}`,
                                        transition: 'background 0.85s ease',
                                    }}
                                    whileHover={{ scale: 1.05, boxShadow: `0 0 36px ${p.glow}` }}
                                    whileTap={{ scale: 0.94 }}
                                    transition={{ duration: 0.16 }}
                                >
                                    Read Article
                                    <ExternalLink className="w-3 h-3" />
                                </motion.a>
                            )}
                        </div>

                        {/* ── PROGRESS BAR ── */}
                        <div className="px-6 pb-5 flex-shrink-0">
                            <div className="flex items-center gap-1">
                                {ARTICLES.map((a, i) => {
                                    const cp = PALETTE[a.angle.toLowerCase()] ?? PALETTE['scene history'];
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => jumpTo(i)}
                                            className="relative rounded-full overflow-hidden flex-1 transition-opacity duration-200 hover:opacity-60"
                                            style={{ height: '2px', background: 'rgba(255,255,255,0.07)' }}
                                            title={a.title}
                                        >
                                            {i === idx && (
                                                <motion.span
                                                    className="absolute inset-y-0 left-0 rounded-full"
                                                    style={{ background: cp.border }}
                                                    initial={{ width: '0%' }}
                                                    animate={{ width: '100%' }}
                                                    transition={{ duration: 7, ease: 'linear' }}
                                                />
                                            )}
                                            {i < idx && (
                                                <span
                                                    className="absolute inset-0 rounded-full"
                                                    style={{ background: cp.border, opacity: 0.3 }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Reserved right column */}
            {/* ── TOP STORIES (Billboard-style numbered list) ── */}
            <motion.aside
                className="lg:col-span-1 flex flex-col lg:mt-[42px] rounded-2xl p-5"
                style={{ background: '#07010E', border: '1px solid rgba(157,0,255,0.14)' }}
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
                aria-label="Top stories"
            >
                <div className="pt-3 mb-3" style={{ borderTop: '4px solid #fff' }}>
                    <h3 className="text-white font-black uppercase tracking-tight text-xl leading-none" style={{ fontFamily: "'Archivo', sans-serif" }}>
                        Top Stories
                    </h3>
                </div>
                <ol className="flex flex-col list-none p-0 m-0 flex-1">
                    {SHOWN.map((a, i) => {
                        const active = i === idx;
                        const label = (a.tag ?? a.angle).toUpperCase();
                        return (
                            <li key={a.url} style={{ borderTop: i ? '1px solid rgba(157,0,255,0.14)' : 'none' }}>
                                <button
                                    onClick={() => { jumpTo(i); setPaused(true); }}
                                    className="w-full text-left flex gap-3 py-3 group"
                                    aria-current={active ? 'true' : undefined}
                                >
                                    <span
                                        className="text-2xl font-black leading-none w-7 shrink-0 transition-colors"
                                        style={{ fontFamily: "'Archivo', sans-serif", color: active ? '#FF0080' : '#3A2D52' }}
                                    >
                                        {i + 1}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-[9px] font-black tracking-[0.18em]" style={{ color: getPal(a.angle).text }}>{label}</span>
                                        <span className={`block text-sm font-bold leading-snug mt-0.5 transition-colors ${active ? 'text-white' : 'text-[#B9A6D6] group-hover:text-white'}`}>
                                            {a.title}
                                        </span>
                                        <span className="block text-[10px] text-[#6E6088] mt-0.5">
                                            {a.source}{fmtDate(a.published_date) ? ` · ${fmtDate(a.published_date)}` : ''}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
                {SHOWN.some(a => a.internal) && (
                    <Link to="/news" className="self-end inline-flex items-center gap-1 text-xs font-bold text-[#C080FF] hover:text-white mt-2">
                        All stories <ArrowRight className="w-3 h-3" />
                    </Link>
                )}
            </motion.aside>
        </div>
    );
}
