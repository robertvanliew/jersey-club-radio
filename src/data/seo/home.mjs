// "What is Jersey club?" copy for the homepage. One source for both the React homepage
// (src/app/components/JerseyClubExplainer.tsx) and the prerendered HTML that crawlers
// without JavaScript read (scripts/prerender-charts.mjs). Links are site paths.

export const HOME_EXPLAINER = {
  heading: 'What is Jersey club music?',
  definition:
    'Jersey club is a fast, bouncy style of dance music that started in Newark, New Jersey, in the late 1990s and early 2000s. ' +
    'It grew out of Baltimore club, and it usually runs at around 130 to 140 BPM. You can spot it by its rapid bursts of kick drums, ' +
    'chopped and repeated vocal samples, and sound effects like the famous bed squeak. DJs such as DJ Tameil and his Brick Bandits crew ' +
    'built the sound at Newark parties and on mixtapes, and a later wave of producers including DJ Sliink, DJ Jayhood, DJ Lilman and ' +
    'UNIIQU3 carried it to clubs and festivals around the world. Since the early 2020s, TikTok dances and hits like Lil Uzi Vert\'s ' +
    '"Just Wanna Rock" have made Jersey club one of the most recognizable sounds in pop and hip-hop.',
  facts: [
    ['Origin', 'Newark, New Jersey, late 1990s'],
    ['Tempo', 'Around 130 to 140 BPM'],
    ['Roots', 'Baltimore club, house and hip-hop'],
    ['Signature sounds', 'Triplet kick patterns, vocal chops, bed squeaks'],
    ['Key artists', 'DJ Tameil, DJ Sliink, DJ Jayhood, DJ Lilman, UNIIQU3'],
  ],
  faq: [
    {
      q: 'Where can I listen to Jersey club music 24/7?',
      a: 'Jersey Club Radio streams Jersey club music around the clock for free at jerseyclubradio.com. There is no account or app needed, and the station mixes from one track into the next like a live DJ set.',
    },
    {
      q: 'What is the difference between Jersey club and Baltimore club?',
      a: 'Baltimore club came first and gave Jersey club its breakbeat-driven, sample-heavy style. Jersey club is usually a little faster and leans on more aggressive kick patterns, playful sound effects and chopped vocal hooks built for dancing.',
    },
    {
      q: 'Who are the best Jersey club artists?',
      a: 'Pioneers include DJ Tameil, founder of the Brick Bandits crew. Well-known names from the next generation include DJ Sliink, DJ Jayhood, DJ Lilman, DJ Taj and UNIIQU3, often called the Queen of Jersey club.',
    },
    {
      q: 'What are the most popular Jersey club songs right now?',
      a: 'The Rising Now chart on Jersey Club Radio ranks the fastest-rising Jersey club tracks every Monday, so it is the quickest way to find what is hot this week.',
    },
  ],
  links: [
    ['/news/history-of-jersey-club-music', 'Read the full history of Jersey club'],
    ['/hot', 'See this week\'s Rising Now chart'],
    ['/artists', 'Meet the artists'],
  ],
};
