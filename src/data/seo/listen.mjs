// /listen: the "24/7 Jersey club radio station" answer page. One source for the React page
// (src/app/pages/Listen.tsx) and the prerendered HTML (scripts/prerender-charts.mjs).

export const LISTEN = {
  path: '/listen',
  title: 'Jersey Club Radio Station: Listen to Jersey Club Music 24/7, Free',
  description: 'Jersey Club Radio is a free online radio station that plays only Jersey club music, 24 hours a day. No sign-up, no app, no ads between songs. Press play.',
  heading: 'Listen to Jersey club radio, 24/7',
  answer: 'Jersey Club Radio is a free online radio station that plays only Jersey club music, 24 hours a day, 7 days a week. It runs in your browser on any phone or computer with no sign-up and no app, and everyone listening hears the same live mix, blended from one track into the next like a DJ set.',
  facts: [
    ['Format', 'Jersey club only, around the clock'],
    ['Cost', 'Free, no account needed'],
    ['Works on', 'Any phone, tablet or computer browser'],
    ['What you hear', 'Classics from the Brick City era to this week\'s rising tracks'],
    ['New music', 'The Rising Now chart updates every Monday'],
  ],
  faq: [
    {
      q: 'Is there a 24/7 Jersey club radio station?',
      a: 'Yes. Jersey Club Radio at jerseyclubradio.com streams Jersey club music non-stop, every day. Most Jersey club radio is a weekly or monthly show on a general station; this is a station that plays nothing else.',
    },
    {
      q: 'Is Jersey Club Radio free?',
      a: 'Yes. Listening is free with no account. Press play on the site and the station starts where everyone else is listening.',
    },
    {
      q: 'Can I listen on my phone?',
      a: 'Yes. Open jerseyclubradio.com in your phone\'s browser and press play. You can add it to your home screen so it opens like an app.',
    },
    {
      q: 'What music does Jersey Club Radio play?',
      a: 'Only Jersey club: the Newark sound from pioneers like DJ Tameil and the Brick Bandits, the DJ Sliink, DJ Jayhood and UNIIQU3 era, and the newest Jersey club remixes and flips rising on SoundCloud right now.',
    },
    {
      q: 'How is this different from a Jersey club playlist?',
      a: 'A playlist plays the same list from the top for everyone. Jersey Club Radio is live: one shared mix that never stops, with DJ-style transitions, plus the SoundCloud edits and remixes that often are not on Spotify or Apple Music.',
    },
    {
      q: 'Where can I find Jersey club radio shows?',
      a: 'Weekly and monthly Jersey club shows air on stations like SiriusXM BPM, NTS and Kiosk Radio. Jersey Club Radio is the station you can leave on between them.',
    },
    {
      q: 'Can I get my Jersey club track played?',
      a: 'Producers can submit a SoundCloud link with the Submit your track form on the homepage. Every track that plays credits its producer.',
    },
  ],
  links: [
    ['/', 'Listen live now'],
    ['/hot', 'This week\'s Rising Now chart'],
    ['/news/history-of-jersey-club-music', 'The history of Jersey club'],
    ['/artists', 'Jersey club artists'],
  ],
};
