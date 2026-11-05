// Evergreen guide pages ("What is Jersey club?", comparisons). One source for the React
// page (src/app/pages/Guide.tsx) and the prerendered HTML (scripts/prerender-charts.mjs).
// Each opens with a short, quotable answer, uses question-style headings, cites sources,
// and shows when it was last updated: the shape AI answers and featured snippets quote.
// Links in text use [label](/path). Keep claims to what the listed sources support.

const SOURCES = {
  wikiJersey: { name: 'Wikipedia: Jersey club', url: 'https://en.wikipedia.org/wiki/Jersey_club' },
  wikiBmore: { name: 'Wikipedia: Baltimore club', url: 'https://en.wikipedia.org/wiki/Baltimore_club' },
  wikiTameil: { name: 'Wikipedia: DJ Tameil', url: 'https://en.wikipedia.org/wiki/DJ_Tameil' },
  djmag: { name: 'DJ Mag: The endless evolution of Jersey club', url: 'https://djmag.com/features/endless-evolution-jersey-club' },
  xxl: { name: 'XXL: Jersey club music', url: 'https://www.xxlmag.com/jersey-club-music/' },
  pbs: { name: 'PBS Sound Field: Why is Jersey club music everywhere?', url: 'https://www.pbs.org/video/why-is-jersey-club-music-everywhere-8b6ote' },
};

export const GUIDES = [
  {
    path: '/what-is-jersey-club',
    title: 'What Is Jersey Club Music? BPM, Sound, History and Artists',
    description: 'Jersey club is a fast, bouncy dance music from Newark, New Jersey, at about 130 to 140 BPM. Its sound, history, key artists and dances, with music you can play right here.',
    heading: 'What is Jersey club music?',
    updated: '2026-11-05',
    answer: 'Jersey club is a high-energy style of dance music that started in Newark, New Jersey, in the late 1990s and early 2000s. It grew out of Baltimore club and usually runs at about 130 to 140 BPM, built on bursts of kick drums, chopped and repeated vocal samples, and playful sound effects like the famous bed squeak.',
    facts: [
      ['Where it started', 'Newark, New Jersey'],
      ['When', 'Late 1990s to early 2000s'],
      ['Tempo', 'About 130 to 140 BPM'],
      ['Grew out of', 'Baltimore club'],
      ['Signature sounds', 'Rapid kick patterns, vocal chops, bed squeaks, call-and-response hooks'],
      ['Early figures', 'DJ Tameil and the Brick Bandits crew'],
      ['Later stars', 'DJ Sliink, DJ Jayhood, DJ Lilman, UNIIQU3, Bandmanrill'],
    ],
    sections: [
      {
        h2: 'What does Jersey club sound like?',
        body: [
          'The first thing most people notice is the kick drum. Instead of a steady four-on-the-floor beat, Jersey club producers fire kicks in quick clusters, often in triplet-feel runs that make the track feel like it is bouncing. Over that sit short vocal samples chopped into stutters and repeated until they become part of the rhythm.',
          'Producers also love sound effects. The bed squeak, a creaking-mattress sample, became so common that it works almost like a signature. Gunshot hits, horn stabs and quick "hey" shouts show up too. The goal is simple: make people dance, and leave space for dancers to hit the breaks.',
        ],
      },
      {
        h2: 'Where did Jersey club come from?',
        body: [
          'Jersey club came out of Newark parties in the late 1990s and early 2000s, when local DJs took the Baltimore club records they were playing and started making their own versions with a harder, faster New Jersey feel. DJ Tameil is widely credited as one of the people who shaped the early sound, and his Brick Bandits crew helped spread it through mixtapes and parties across the Newark area.',
          'For years the music lived mostly on mixtapes, local parties and early sites like YouTube and SoundCloud. A second wave of producers, including DJ Sliink, DJ Jayhood and DJ Lilman, pushed it into bigger clubs and festivals in the 2010s. Read the full story in [The History of Jersey Club Music](/news/history-of-jersey-club-music).',
        ],
      },
      {
        h2: 'How fast is Jersey club? (BPM)',
        body: [
          'Most Jersey club tracks sit between about 130 and 140 BPM. That is in the same range as a lot of house and Baltimore club, but the busy kick patterns make Jersey club feel faster than the number suggests. Some newer offshoots, such as Jersey drill, slow the tempo down, while others speed it up much further.',
        ],
      },
      {
        h2: 'Who are the biggest Jersey club artists?',
        body: [
          'Early names include [DJ Tameil](/artists/djtameil) and the Brick Bandits. The generation that took the sound worldwide includes [DJ Sliink](/artists/djsliink), [DJ Jayhood](/artists/djjayhood), [DJ Lilman](/artists/djlilman) and [UNIIQU3](/artists/uniiqu3), often called the Queen of Jersey club. Bandmanrill helped popularize Jersey drill, a blend of Jersey club and drill rap.',
          'Every Monday the [Rising Now chart](/hot) tracks the newest Jersey club tracks gaining the most listeners, so it is the easiest way to find the producers coming up right now.',
        ],
      },
      {
        h2: 'Why is Jersey club so popular on TikTok?',
        body: [
          'Jersey club was built for dancing, and its short, punchy hooks and breaks fit short-form video perfectly. Dances that started in Newark spread online, and from the early 2020s Jersey club remixes of pop and R&B hits became some of the most used sounds on TikTok. Mainstream artists followed: Lil Uzi Vert\'s "Just Wanna Rock" took the sound onto the Billboard charts ([the story behind it](/news/just-wanna-rock-mcvertt-jersey-club)). More in [How TikTok Turned Jersey Club Into a Global Sound](/news/how-tiktok-made-jersey-club-go-viral).',
        ],
      },
      {
        h2: 'How is Jersey club different from Baltimore club?',
        body: [
          'They are close relatives. Baltimore club came first and gave Jersey club its breakbeat-based, sample-heavy approach. Jersey club usually leans harder on rapid kick patterns, sound effects and chopped vocal hooks. See the side-by-side comparison in [Jersey Club vs Baltimore Club](/jersey-club-vs-baltimore-club).',
        ],
      },
    ],
    faq: [
      { q: 'Is Jersey club a genre?', a: 'Yes. Jersey club is a genre of dance music from Newark, New Jersey. It is related to Baltimore club and house music, and it has its own offshoots such as Jersey drill.' },
      { q: 'What BPM is Jersey club?', a: 'Most Jersey club tracks run at about 130 to 140 BPM, though the quick kick patterns make it feel faster.' },
      { q: 'Who invented Jersey club?', a: 'No single person invented it. Newark DJs in the late 1990s and early 2000s built it from Baltimore club, and DJ Tameil and the Brick Bandits are widely credited with shaping and spreading the early sound.' },
      { q: 'Where can I listen to Jersey club 24/7?', a: 'Jersey Club Radio streams Jersey club music around the clock for free at jerseyclubradio.com, with no account or app needed.' },
    ],
    sources: [SOURCES.wikiJersey, SOURCES.wikiTameil, SOURCES.djmag, SOURCES.xxl, SOURCES.pbs],
    related: [['/listen', 'Listen to Jersey club radio 24/7'], ['/hot', 'This week\'s Rising Now chart'], ['/jersey-club-vs-baltimore-club', 'Jersey club vs Baltimore club'], ['/artists', 'Jersey club artists']],
  },
  {
    path: '/jersey-club-vs-baltimore-club',
    title: 'Jersey Club vs Baltimore Club: The Differences Explained',
    description: 'Jersey club grew out of Baltimore club. How the two compare on origin, tempo, drums, samples and dance, in one table, with the artists who define each.',
    heading: 'Jersey club vs Baltimore club',
    updated: '2026-11-05',
    answer: 'Baltimore club came first, starting in Baltimore in the late 1980s and early 1990s, and Jersey club grew out of it in Newark in the late 1990s and early 2000s. Both are fast, sample-heavy dance music around 130 BPM or more. Baltimore club is built on chopped breakbeats, while Jersey club leans on rapid kick-drum bursts, sound effects and stuttering vocal chops.',
    table: {
      head: ['', 'Baltimore club', 'Jersey club'],
      rows: [
        ['Where it started', 'Baltimore, Maryland', 'Newark, New Jersey'],
        ['When', 'Late 1980s to early 1990s', 'Late 1990s to early 2000s'],
        ['Tempo', 'Around 130 BPM', 'About 130 to 140 BPM'],
        ['Drums', 'Chopped breakbeats and heavy, looping kicks', 'Rapid kick clusters with a triplet, bouncing feel'],
        ['Samples', 'Breakbeats and short vocal loops', 'Chopped, repeated vocal hooks and sound effects like the bed squeak'],
        ['Made for', 'Club dancing', 'Club dancing and, more recently, short-form video dances'],
        ['Relationship', 'The parent style', 'Grew directly out of Baltimore club'],
      ],
    },
    sections: [
      {
        h2: 'How did Baltimore club lead to Jersey club?',
        body: [
          'Baltimore club grew up in Baltimore in the late 1980s and early 1990s, mixing house music with hip-hop breakbeats into a fast, raw style for local clubs. Its records traveled up the East Coast, and by the late 1990s DJs in Newark were playing them and making their own tracks in the same spirit.',
          'Over time the Newark version developed its own identity: harder and busier kick patterns, more sound effects, and vocal chops cut into tight stutters. That became Jersey club. Read more in [What is Jersey club?](/what-is-jersey-club).',
        ],
      },
      {
        h2: 'How can you tell them apart by ear?',
        body: [
          'Listen to the drums first. Baltimore club tends to ride a chopped breakbeat that loops under the track. Jersey club tends to hit you with sudden runs of kicks that make the groove bounce. If you hear a creaking bed squeak or a vocal sample stuttered over and over, you are almost certainly listening to Jersey club.',
        ],
      },
      {
        h2: 'Are there other club styles?',
        body: [
          'Yes. Philly club developed in Philadelphia alongside Jersey club, and Jersey drill mixes Jersey club drums with drill rap. All of them trace back to the same Baltimore club roots. The [Rising Now chart](/hot) shows which styles are moving right now.',
        ],
      },
    ],
    faq: [
      { q: 'Did Jersey club come from Baltimore club?', a: 'Yes. Jersey club grew out of Baltimore club when Newark DJs in the late 1990s and early 2000s started making their own versions of the Baltimore club records they played.' },
      { q: 'Which is faster, Jersey club or Baltimore club?', a: 'They overlap at around 130 BPM, and Jersey club often runs a little faster, up to about 140 BPM. Its busy kick patterns also make it feel faster.' },
      { q: 'Where can I hear Jersey club?', a: 'Jersey Club Radio plays Jersey club 24/7 for free at jerseyclubradio.com.' },
    ],
    sources: [SOURCES.wikiBmore, SOURCES.wikiJersey, SOURCES.djmag, SOURCES.xxl],
    related: [['/what-is-jersey-club', 'What is Jersey club?'], ['/listen', 'Listen to Jersey club radio 24/7'], ['/news/history-of-jersey-club-music', 'The history of Jersey club']],
  },
  {
    path: '/jersey-club-dances',
    title: 'Jersey Club Dances: Running Man, Sexy Walk, Bunny Hop and More',
    description: 'A guide to Jersey club dances: the Running Man, Sexy Walk, Pattycake, Bunny Hop, the Tang and the TikTok-era dances, with who made them famous and the songs behind them.',
    heading: 'Jersey club dances',
    updated: '2026-11-05',
    answer: 'Jersey club dances are the party moves that grew up with Newark\'s club sound. The Running Man is the base step most others build on. Around it sit the Sexy Walk, the Pattycake, the Slide, the Bunny Hop and Rock Your Hips, plus older party dances like Lock It Up and TikTok-era challenges like the "Just Wanna Rock" dance.',
    facts: [
      ['Base step', 'The Running Man'],
      ['First move credited to a woman', 'The Sexy Walk (originated by Ashley Ford, per The Gumbo)'],
      ['Where dances spread', 'Newark teen parties, skating rinks, school cafeterias, then YouTube, Vine and TikTok'],
      ['Biggest viral moments', 'Running Man Challenge (2016), "Vibe (If I Back It Up)" (2020), "Just Wanna Rock" (2022)'],
    ],
    sections: [
      { h2: 'Why is dance so central to Jersey club?', body: [
        'Jersey club grew on the dance floor as much as in the studio. Dance Mogul Magazine puts it simply: Jersey club "did not become a culture because people simply listened to it. They danced to it." DJs called out moves on the mic all night, and some records are named after a move, like "Sexy Walk" and "Bunny Hop."',
        'Dance also gave Newark\'s young people a place to compete. Skating rinks like Branch Brook and Skate 22, school cafeterias and teen parties were the stages, and dance battles became central. The Gumbo writes that self-taught dancers drove Jersey club\'s spread on social media, with kids learning the newest moves on YouTube before a party.',
      ] },
      { h2: 'What is the Running Man?', body: [
        'The Running Man is the base step of Jersey club dancing. Dancers bend their knees and rock their feet back and forth in a running motion, and The FADER notes that almost every other Jersey club move either starts with it or is combined with it. [DJ Lilman](/artists/djlilman) says it came out of a Newark party in late 2009 and that he named it a few days later.',
        'In 2016 Kevin Vincent and Jerry Hall from Hillside, New Jersey turned it into the Running Man Challenge, which went viral worldwide. They started the challenge, not the dance.',
      ] },
      { h2: 'What is the Sexy Walk?', body: [
        'The Sexy Walk is a confident strut that The Gumbo describes as a blend of Harlem\'s heel-toe and Chuck Berry\'s duck walk, with neck snaps and head rolls. The Gumbo credits Ashley Ford with originating it and Miss CTE with popularizing it, and calls it the first Jersey club move created by and credited to a woman.',
        'It has its own anthem: "Sexy Walk" by DJ Lilman and [Ms. Porsh](/artists/msporsh), which The FADER covered in 2010, calling the dance "a proper, super-popular dance in Jerz."',
      ] },
      { h2: 'What are the Pattycake, the Slide and Rock Your Hips?', body: [
        'These are moves dancers mix with the Running Man. The Pattycake keeps the Running Man footwork and adds patty-cake style hand clapping. The FADER also names the Slide and Rock Your Hips among the Jersey-born moves that combine with it. Producer Kayy Drizz lists the Patty Cake, the Running Man and the Sharp Bounce among the dances of his era.',
      ] },
      { h2: 'What is the Jersey club Bunny Hop?', body: [
        'The Jersey club Bunny Hop is a dance from DJ Lilman\'s 2012 record "Bunny Hop," featuring K-Shiz, which was billed as a brand new dance. It is a different dance from the 1950s Bunny Hop. The FADER lists it among the moves dancers mix with the Running Man.',
      ] },
      { h2: 'What is the Tang?', body: [
        'The Tang is a club dance with Philadelphia roots that Jersey club dancers also do. Philadelphia magazine describes gyrating hips and warrior-style arm crosses, and calls it a good move for a dance-off. It has nothing to do with the rap group. More on it in [the Tang dance and Jersey club dance culture](/news/tang-dance-jersey-drill-dance-culture).',
      ] },
      { h2: 'Which older party dances came before?', body: [
        'Before the Running Man era, Newark house parties had dances like Lock It Up (also called Stolen Car) and the Wall, remembered by dancer Anthony "Solo" Harris and [DJ Tameil](/artists/djtameil). Dance Mogul also lists the Percolator and One Leg Get Back as part of the wider Jersey club dance vocabulary, and Wikipedia notes that Tim Dolla\'s track "Swing Dat" is named after a popular move.',
      ] },
      { h2: 'What are the TikTok-era Jersey club dances?', body: [
        'Cookiee Kawaii\'s "Vibe (If I Back It Up)" became, in Dance Mogul\'s words, "a major TikTok dance phenomenon in 2020." In fall 2022 the "Just Wanna Rock" dance took off on TikTok after creators posted it on September 14, 2022, with Kai Cenat helping it spread. Know Your Meme describes side-stepping, cross-stepping and hip-shaking, similar to the Blick, a Philly club move. Read [the story behind "Just Wanna Rock"](/news/just-wanna-rock-mcvertt-jersey-club).',
      ] },
    ],
    faq: [
      { q: 'What is the most famous Jersey club dance?', a: 'The Running Man. It is the base step most Jersey club moves are built on, and the 2016 Running Man Challenge made it famous worldwide.' },
      { q: 'How do you dance to Jersey club?', a: 'Start with the Running Man: knees bent, feet rocking back and forth in a running motion on the beat. Then add moves like the Pattycake (claps), the Slide or Rock Your Hips, and save bigger moves for the breaks in the track.' },
      { q: 'Who created the Sexy Walk?', a: 'The Gumbo credits Ashley Ford with originating the Sexy Walk and Miss CTE with popularizing it. DJ Lilman and Ms. Porsh made the song "Sexy Walk" around it.' },
      { q: 'Where can I hear Jersey club music to dance to?', a: 'Jersey Club Radio plays Jersey club 24/7 for free at jerseyclubradio.com, and the Rising Now chart lists the newest tracks every Monday.' },
    ],
    sources: [
      { name: 'The FADER: The Real Story Behind The Running Man Challenge (2016)', url: 'https://www.thefader.com/2016/05/06/real-story-behind-the-running-man-challenge' },
      { name: 'The FADER: DJ Lilman & Ms. Porsh, "Sexy Walk" (2010)', url: 'https://www.thefader.com/2010/07/27/dj-lilman-ms-porsh-sexy-walk-mp3' },
      { name: 'The Gumbo: The Unsung Women Innovators of Jersey Club Music (2021)', url: 'https://thegumbo.net/blog/2021/1/4/the-unsung-women-innovators-of-jersey-club-music' },
      { name: 'Dance Mogul Magazine: What Is Jersey Club? The Dancer Perspective (2019)', url: 'https://www.dancemogul.com/?p=14815' },
      { name: 'Dance Mogul Magazine: 25 Years of Jersey Club (2026)', url: 'https://www.dancemogul.com/25-years-of-jersey-club/' },
      { name: 'Mixcloud: On Rotation, A Guide to Jersey Club (2023)', url: 'https://www.mixcloud.com/blog/2023/07/05/mixclouds-on-rotation-a-guide-to-jersey-club/' },
      { name: 'Philadelphia magazine: Popular Dance Moves With Philly Roots (2020)', url: 'https://www.phillymag.com/things-to-do/2020/03/07/dance-moves-philadelphia/' },
      { name: 'Know Your Meme: Lil Uzi Vert "Just Wanna Rock" Dance', url: 'https://knowyourmeme.com/memes/lil-uzi-vert-just-wanna-rock-dance' },
      { name: 'Wikipedia: Jersey club', url: 'https://en.wikipedia.org/wiki/Jersey_club' },
    ],
    related: [['/dance-videos', 'Watch Jersey club dance videos'], ['/what-is-jersey-club', 'What is Jersey club?'], ['/listen', 'Listen to Jersey club 24/7']],
  },
];

export const guideByPath = path => GUIDES.find(g => g.path === path);
