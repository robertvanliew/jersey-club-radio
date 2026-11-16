// Per-page SEO for the app's static routes. Used by:
//  - scripts/prerender-charts.mjs: writes dist/<path>/index.html with these head tags and a
//    short crawler-readable intro, so each page has its own title, description and canonical
//  - src/app/components/Layout.tsx: applies the same tags when navigating inside the app
// Pages with dynamic content (/hot, /news, /producers, /artists/:slug) set their own tags.

export const ROUTE_SEO = {
  '/': {
    title: 'Jersey Club Radio | 24/7 Jersey Club Music Station & Chart',
    description: 'Listen to Jersey club music 24/7, free. Non-stop Jersey club from DJ Sliink, UNIIQU3, DJ Jayhood and more, plus the weekly Rising Now chart.',
    intro: 'Jersey Club Radio streams Jersey club music 24/7 for free: the Newark sound from pioneers like DJ Tameil to today\'s producers, plus a weekly chart of the fastest-rising Jersey club tracks.',
  },
  '/new-releases': {
    title: 'New Jersey Club Releases | Latest Jersey Club Music',
    description: 'The newest Jersey club songs, remixes and flips as they drop. Stream the latest Jersey club releases free on Jersey Club Radio.',
    intro: 'The latest Jersey club releases, remixes and flips, updated as new music drops.',
  },
  '/search': {
    title: 'Search Jersey Club Music | Jersey Club Radio',
    description: 'Search Jersey club songs, remixes and artists and play them instantly on Jersey Club Radio.',
    intro: 'Search Jersey club songs, remixes and artists.',
    noindex: true,
  },
  '/chat': {
    title: 'Jersey Club Live Chat | Talk With Fans While You Listen',
    description: 'Chat live with Jersey club fans from around the world while the station plays. Free, no account needed.',
    intro: 'Chat live with Jersey club fans while the station plays.',
    noindex: true,
  },
  '/artists': {
    title: 'Jersey Club Artists & DJs: Sliink, UNIIQU3, Tameil and More',
    description: 'Profiles of the DJs, producers and artists who built Jersey club, from pioneer DJ Tameil to DJ Sliink, UNIIQU3, DJ Jayhood, DJ Lilman and DJ Taj.',
    intro: 'Profiles of the DJs, producers and artists behind Jersey club music.',
  },
  '/dance-videos': {
    title: 'Jersey Club Dance Videos | Newest Jersey Club Dance Shorts',
    description: 'Watch the newest Jersey club dance videos and shorts, updated every few hours. The dances and challenges behind the Jersey club sound.',
    intro: 'The newest Jersey club dance videos and shorts, updated every few hours.',
  },
  '/merch': {
    title: 'Jersey Club Radio Merch | Official Apparel',
    description: 'Official Jersey Club Radio merch: shirts, hoodies and accessories for Jersey club fans. Rep the 24/7 station and the Newark sound wherever you go.',
    intro: 'Official Jersey Club Radio merch for Jersey club fans.',
  },
  '/games': {
    title: 'Jersey Club Games: Spades, Blackjack, Chess and a Beat Maker',
    description: 'Play free games while you listen to Jersey club radio: spades, blackjack, chess, checkers, crosswords and a Jersey club beat maker.',
    intro: 'Free games to play while you listen: spades, blackjack, chess, checkers, crosswords and a Jersey club beat maker.',
  },
  '/games/spades': { title: 'Play Spades Online Free | Jersey Club Radio Game Hub', description: 'Play spades online for free while you listen to Jersey club music 24/7.', intro: 'Play spades online while the station plays.', noindex: true },
  '/games/blackjack': { title: 'Play Blackjack Online Free | Jersey Club Radio Game Hub', description: 'Play free blackjack while you listen to Jersey club music 24/7.', intro: 'Play blackjack while the station plays.', noindex: true },
  '/games/crossword': { title: 'Jersey Club Crossword | Daily Puzzle on Jersey Club Radio', description: 'A daily crossword puzzle for Jersey club fans. Play free while you listen.', intro: 'A daily crossword for Jersey club fans.', noindex: true },
  '/games/beat-maker': { title: 'Jersey Club Beat Maker | Make a Jersey Club Beat Online', description: 'Make a Jersey club beat in your browser with the classic triplet kicks, claps and bed squeak. Free, no download.', intro: 'Make a Jersey club beat in your browser: triplet kicks, claps and the bed squeak.' },
  '/games/chess': { title: 'Play Chess Online Free | Jersey Club Radio Game Hub', description: 'Play free chess online while you listen to Jersey club music.', intro: 'Play chess while the station plays.', noindex: true },
  '/games/checkers': { title: 'Play Checkers Online Free | Jersey Club Radio Game Hub', description: 'Play free checkers online while you listen to Jersey club music.', intro: 'Play checkers while the station plays.', noindex: true },
  '/about': {
    title: 'About Jersey Club Radio | The 24/7 Home of Jersey Club Music',
    description: 'Jersey Club Radio is a free 24/7 station for Jersey club music, built by a Jersey club DJ to champion the Newark sound and the artists behind it.',
    intro: 'Jersey Club Radio is a free 24/7 station for Jersey club music, built by a Jersey club DJ.',
  },
  '/contact': {
    title: 'Contact & Advertise | Jersey Club Radio',
    description: 'Contact Jersey Club Radio to advertise or sponsor the station, book a Jersey club DJ, or reach us about press, partnerships and general questions.',
    intro: 'Advertising, sponsorship, bookings, press and general inquiries.',
  },
  '/terms': { title: 'Terms of Service | Jersey Club Radio', description: 'The terms for using Jersey Club Radio: listening to the station, chat, games, purchases and how to reach us with questions about them.', intro: 'The terms that apply when you use Jersey Club Radio: listening to the station, chatting, playing games and making purchases. Questions about them? Use the contact page.' },
  '/privacy': { title: 'Privacy Policy | Jersey Club Radio', description: 'How Jersey Club Radio collects, uses and protects information when you listen, chat or play games, including analytics, and how to contact us.', intro: 'How Jersey Club Radio collects, uses and protects information when you listen, chat or play games, including analytics, and how to contact us about your data.' },
  '/pricing': { title: 'Pricing | Jersey Club Radio', description: 'Jersey Club Radio is free to listen 24/7 with no account needed. Compare the optional upgrades and what each one includes.', intro: 'Jersey Club Radio is free to listen 24/7, with no account needed. Optional upgrades are listed here with what each one includes.' },
  '/refund-policy': { title: 'Refund Policy | Jersey Club Radio', description: 'How refunds work for Jersey Club Radio purchases and upgrades: what qualifies for a refund and how to request one from our team.', intro: 'How refunds work for Jersey Club Radio purchases and upgrades, what qualifies, and how to request one.' },
  // Personal / utility pages: kept out of search results
  '/queue': { title: 'Your Queue | Jersey Club Radio', description: 'Your listening queue.', noindex: true },
  '/crate': { title: 'Your Crate | Jersey Club Radio', description: 'Your saved tracks.', noindex: true },
  '/admin': { title: 'Admin | Jersey Club Radio', description: 'Admin.', noindex: true },
};

// Titles over ~60 characters get cut off in search results: drop the brand suffix first
const SUFFIX = ' | Jersey Club Radio';
const fit = t => (t.length > 60 && t.endsWith(SUFFIX) ? t.slice(0, -SUFFIX.length) : t);

/** Artist profile SEO from an artist record (name, role, bio) */
export function artistSeo(a) {
  const bio = String(a.bio || '').replace(/\s+/g, ' ').trim();
  const short = bio.length > 150 ? bio.slice(0, bio.lastIndexOf(' ', 147)) + '…' : bio;
  return {
    title: fit(`${a.name} | Jersey Club ${a.role || 'Artist'} Profile | Jersey Club Radio`),
    description: short || `${a.name}, Jersey club ${a.role || 'artist'}. Listen on Jersey Club Radio.`,
  };
}
