// /best-jersey-club-songs: the canon by era. One source for the React page
// (src/app/pages/BestSongs.tsx) and the prerendered HTML. Every "why" is grounded in the
// song's listed sources. Producer is shown only when it differs from the artist.
// Update `updated` whenever songs are added; add new eras at the end.

export const BEST_SONGS = {
  path: '/best-jersey-club-songs',
  title: 'Best Jersey Club Songs of All Time, by Era (2026)',
  description: 'The essential Jersey club songs from Brick City classics to TikTok hits: DJ Tameil, Tim Dolla, DJ Sliink, Jayhood, UNIIQU3, Bandmanrill and more, with why each one matters.',
  heading: 'The best Jersey club songs of all time',
  updated: '2026-11-05',
  answer: 'The essential Jersey club songs run from DJ Tameil\'s 2001 Dat Butt EP and Tim Dolla\'s "Swing Dat Shyt," through second-wave classics like DJ Sliink\'s "Vibrate" and Nadus\'s "Nxwxrk," to TikTok-era hits like Cookiee Kawaii\'s "Vibe (If I Back It Up)" and Lil Uzi Vert\'s MCVertt-produced "Just Wanna Rock." Here they are by era, with why each one matters.',
  eras: [
    {
      name: 'Brick City foundations', years: '1999 to about 2009',
      intro: 'Jersey club started in Newark as Brick City club, branching off Baltimore club around 1999 and 2000. DJ Tameil, Tim Dolla, Mike V and the Brick Bandits crew sold mixtapes and CDs locally, and a run of dance-call records built the sound.',
      songs: [
        { title: 'Dat Butt (EP)', artist: 'DJ Tameil', year: '2001', why: 'Released on Tameil\'s own Anthrax Records, it was one of the first club records made by a Jersey producer, and its success pushed other Newark DJs to start making tracks.', sources: ['https://en.wikipedia.org/wiki/DJ_Tameil', 'https://www.xxlmag.com/jersey-club-music/'] },
        { title: 'Look At My Butt (Final)', artist: 'DJ Tameil', why: 'VICE put it on the soundtrack of its documentary on the Newark roots of the genre, next to other early Brick Bandits records.', sources: ['https://www.vice.com/pt/article/parte-1-subculture-jersey-club/'] },
        { title: 'Happy Tappin', artist: 'Mike V', why: 'A track by Brick Bandits co-founder Mike V. VICE opens its documentary on the genre\'s beginnings with it.', sources: ['https://www.vice.com/pt/article/parte-1-subculture-jersey-club/'] },
        { title: 'Give It To Me (Tim Dolla Remix)', artist: 'Rick James', producer: 'Tim Dolla', why: 'An early Tim Dolla remix on VICE\'s soundtrack of foundational Brick Bandits records.', sources: ['https://www.vice.com/pt/article/parte-1-subculture-jersey-club/'] },
        { title: 'Swing Dat Shyt', artist: 'Tim Dolla', year: '2009', why: 'Mixmag says it carried Jersey club to a much wider audience, and its viral success led to a wave of dance-move tracks from the scene.', sources: ['https://mixmag.net/read/tim-dolla-jersey-club-pioneer-died-july-2022-news', 'https://en.wikipedia.org/wiki/Jersey_club'] },
        { title: 'Tote It (Remix)', artist: 'Unicorn151 (Killa Kherk Cobain) and DJ K-Swift', year: '2007 or 2008', why: 'Credited as the first time anyone rapped on a Jersey club beat.', sources: ['https://en.wikipedia.org/wiki/Jersey_club'] },
        { title: 'Ride That Wave', artist: 'DJ Frosty', producer: 'DJ Saucy P', year: 'about 2009', why: 'Built from Celebby\'s "Make It Jump" vocals, it got heavy play on Hot 97 and took a Newark club record onto New York radio.', sources: ['https://en.wikipedia.org/wiki/Jersey_club', 'https://www.okayplayer.com/music/jersey-club-rap.html'] },
        { title: 'Shake Ya Tail', artist: 'DJ Frosty', why: 'VICE uses a remix of it to soundtrack the early Newark scene.', sources: ['https://www.vice.com/pt/article/parte-1-subculture-jersey-club/'] },
        { title: 'Go Silly', artist: 'DJ Fresh', why: 'Credited with turning Jersey club parties toward competitive dancing and battles.', sources: ['https://en.wikipedia.org/wiki/Jersey_club'] },
        { title: 'My Butt Too Fat', artist: 'DJ Jayhood', year: '2009', why: 'One of the records built on vocal clips from Celebby, whose voice turned up on records all over New Jersey.', sources: ['https://en.wikipedia.org/wiki/Jersey_club'] },
        { title: 'Heartbroken (remix)', artist: 'DJ Jayhood', why: 'R3LL calls this flip of T2\'s UK tune the first Jersey club song to go viral "before viral even existed," and Jayhood told i-D it was one of the first remixes people went crazy for.', sources: ['https://dmy.co/lists/the-10-best-jersey-club-tracks-according-to-r3ll', 'https://i-d.co/?p=133187'] },
      ],
    },
    {
      name: 'The second wave', years: 'about 2009 to 2016',
      intro: 'A younger group, many of them Brick Bandits members, took the sound out of Newark through SoundCloud, remixes and labels like Mad Decent and Atlantic. DJ Sliink, Jayhood, Nadus, R3LL, DJ Lilman and UNIIQU3 made the records that clubs outside New Jersey first heard.',
      songs: [
        { title: 'Hit It', artist: 'Chad B', producer: 'DJ Saucy P', year: '2010', why: 'Okayplayer names Chad B as one of the first rappers to work over Jersey club beats, years before Jersey club rap became a category.', sources: ['https://www.okayplayer.com/music/jersey-club-rap.html'] },
        { title: 'Hands On Ya Hips', artist: 'DJ Jayhood and DJ Joker', year: '2011', why: 'Jayhood calls it his breakout record and a worldwide hit that put his voice and visuals in front of a wider audience.', sources: ['https://i-d.co/?p=133187'] },
        { title: 'Get The Patty Cake Goin', artist: 'DJ Jayhood', why: 'It went viral on YouTube as a dance track, and R3LL calls its dance one of his all-time favorites.', sources: ['https://dmy.co/lists/the-10-best-jersey-club-tracks-according-to-r3ll', 'https://i-d.co/?p=133187'] },
        { title: 'Show Me Love (Mike Gip and Jayhood Remix)', artist: 'Robin S', producer: 'Mike Gip and DJ Jayhood', why: 'R3LL ranked it first on his list of the best Jersey club tracks because it has stood the test of time.', sources: ['https://dmy.co/lists/the-10-best-jersey-club-tracks-according-to-r3ll'] },
        { title: 'Vibrate', artist: 'DJ Sliink', year: '2012', why: 'The title track of his Body High EP was built from a recording of his own phone vibrating, and R3LL calls it "definitely a classic."', sources: ['https://xlr8r.com/?p=86318', 'https://dmy.co/lists/the-10-best-jersey-club-tracks-according-to-r3ll'] },
        { title: 'Put Cha Back In It', artist: 'DJ Sliink', year: '2012', why: 'Billboard\'s introduction to Sliink\'s all-time list names it as one of the records that define the movement.', sources: ['https://www.yahoo.com/entertainment/41-best-jersey-club-songs-174549959.html'] },
        { title: 'Na Na (DJ Sliink Remix)', artist: 'Trey Songz', producer: 'DJ Sliink', year: '2014', why: 'After Atlantic signed the remix, Sliink called it the first step toward Jersey club reaching major labels and their artists.', sources: ['https://thefader.com/2014/06/12/the-skys-the-limit-an-oral-history-of-jersey-club'] },
        { title: 'One In A Million (R3LL Remix)', artist: 'Aaliyah', producer: 'R3LL', why: 'R3LL says it is his biggest remix, with more than 500,000 plays on his old SoundCloud.', sources: ['https://dmy.co/lists/the-10-best-jersey-club-tracks-according-to-r3ll'] },
        { title: 'Nxwxrk', artist: 'Nadus', year: '2014', why: 'This Newark anthem from his Broke City EP on Pelican Fly drew remixes from RL Grime and DJ Sliink.', sources: ['https://thefader.com/2014/05/27/listen-to-jersey-club-producer-nadus-city-celebrating-anthem', 'https://dancingastronaut.com/2014/06/heels-200k-likes-rl-grime-gives-away-edit-nadus-nxwxrk/'] },
        { title: 'Team Lilman Anthem', artist: 'DJ Lilman', producer: '93rd', year: '2014', why: 'A track that calls out dances by name, it won Best Original at Complex\'s CLUBJERSEY Awards and had more than 1.8 million SoundCloud plays at the time.', sources: ['https://www.complex.com/music/a/androids/clubjersey-awards-2014-best-original'] },
        { title: 'Back Up On It (Jasmine)', artist: 'Dougie F and DJ Fire', year: '2014', why: 'Mad Decent signed it and Lil Internet directed the video, which put a Jersey club song in front of a label audience.', sources: ['https://www.complex.com/music/a/androids/clubjersey-awards-2014-best-original'] },
        { title: 'Takin\' It No More', artist: 'Sharaya J', producer: 'DJ Jayhood', year: '2014', why: 'Complex pointed to it as a Jersey club and hip-hop hybrid from two artists with Missy Elliott co-signs.', sources: ['https://www.complex.com/music/a/androids/clubjersey-awards-2014-best-original'] },
        { title: 'Jumpin Like Jordan (DJ Fresh Remix)', artist: 'Migos', producer: 'DJ Fresh', why: 'R3LL calls the remix genius for adding a dribbling basketball and the Chicago Bulls theme.', sources: ['https://dmy.co/lists/the-10-best-jersey-club-tracks-according-to-r3ll'] },
        { title: 'Yo (I\'m Lit)', artist: 'UNIIQU3 and Saint', why: 'Dancing Astronaut called it probably UNIIQU3\'s most notable track up to 2018, with Jersey club used to picture LA party life.', sources: ['https://dancingastronaut.com/2018/03/10-jersey-club-classics/'] },
      ],
    },
    {
      name: 'The Vine era', years: 'about 2014 to 2019',
      intro: 'Short video apps turned Jersey club dances into challenges, and producers started making tracks meant to be filmed and shared. By the end of the decade the sound was on major-label singles and New York radio, and it was starting to meet drill.',
      songs: [
        { title: 'Phone Anthem', artist: 'DJ 809', year: '2014', why: 'Built from a phone dial tone and about a minute long, it spread through Vines.', sources: ['https://www.complex.com/music/a/androids/clubjersey-awards-2014-best-original'] },
        { title: 'BBE Challenge', artist: 'DJ Sliick (VMG)', year: '2014', why: 'It went viral partly on DJ Taj\'s co-sign and got people filming themselves "double tapping," an early challenge record.', sources: ['https://www.complex.com/music/a/androids/clubjersey-awards-2014-best-original'] },
        { title: 'Trippy\'s Theme', artist: 'Trippy Turtle', year: '2014', why: 'It came out on Mad Decent with a cartoon video, and Complex described it as a smoother, less aggressive take on Jersey club.', sources: ['https://www.complex.com/music/a/androids/clubjersey-awards-2014-best-original'] },
        { title: 'We Are Young (Jersey club edit)', artist: 'fun.', producer: 'Kyle Edwards and DJ Smallz 732', year: '2015', why: 'The edit became known through a viral Vine, and a Jersey remix of the song was later sampled on Ciara\'s "Level Up."', sources: ['https://dancingastronaut.com/2018/03/10-jersey-club-classics/', 'https://en.wikipedia.org/wiki/Level_Up_(Ciara_song)'] },
        { title: 'Jersey Slide', artist: 'DJ Lilman featuring Big O', why: 'The FADER credits this track and its dance crew with bringing the Running Man into the Jersey club scene before it became a national challenge in 2016.', sources: ['https://www.thefader.com/2016/05/06/real-story-behind-the-running-man-challenge'] },
        { title: 'Stay (DJ Taj Remix)', artist: 'Zedd featuring Alessia Cara', producer: 'DJ Taj', why: 'Dancing Astronaut uses it to show DJ Taj as the go-to name for Jersey club remixes of Top 40 and rap hits.', sources: ['https://dancingastronaut.com/2018/03/10-jersey-club-classics/'] },
        { title: 'Text Ur Number', artist: 'DJ Envy featuring DJ Sliink and Fetty Wap', producer: 'DJ Envy and DJ Sliink', year: '2017', why: 'Dancing Astronaut points to it as Jersey club entering mainstream radio, with the beat switching into double time after eight bars.', sources: ['https://dancingastronaut.com/2018/03/10-jersey-club-classics/'] },
        { title: 'F*** It Up Challenge', artist: 'DJ Telly Tellz', year: '2017', why: 'A viral challenge track built on the Jersey remix of "We Are Young." The same sample later anchored Ciara\'s "Level Up."', sources: ['https://en.wikipedia.org/wiki/Level_Up_(Ciara_song)', 'https://thesource.com/2018/07/23/ciara-snags-a-hit-with-the-jersey-club-influence-in-level-up/'] },
        { title: 'Level Up', artist: 'Ciara', producer: 'J.R. Rotem and Nas Luke', year: '2018', why: 'A pop star\'s comeback single built on Jersey club, it set off a #LevelUp dance challenge and reached No. 59 on the Hot 100.', sources: ['https://en.wikipedia.org/wiki/Level_Up_(Ciara_song)', 'https://thesource.com/2018/07/23/ciara-snags-a-hit-with-the-jersey-club-influence-in-level-up/'] },
        { title: 'It\'s Time', artist: 'Unicorn151', year: '2018 or 2019', why: 'Credited with moving the sound toward mainstream hip-hop.', sources: ['https://en.wikipedia.org/wiki/Jersey_club', 'https://es.njpac.org/wp-content/uploads/2024/12/Unicorn151_trg.pdf'] },
        { title: 'Dior (DJ Fade and DJ Taj Remix)', artist: 'Pop Smoke', producer: 'DJ Fade and DJ Taj', year: '2019', why: 'DJ Fade says this unofficial remix helped set the tone for the Jersey drill sound.', sources: ['https://www.okayplayer.com/music/jersey-club-rap.html'] },
      ],
    },
    {
      name: 'TikTok, Jersey drill and crossover', years: '2020 to 2026',
      intro: 'TikTok made Jersey club rhythms one of the most used sounds on the app, and Newark rappers and producers like Bandmanrill and MCVertt mixed it with drill. Pop and rap stars followed, and by the mid-2020s Jersey club records were reaching the Billboard top 10.',
      songs: [
        { title: 'Vibe (If I Back It Up)', artist: 'Cookiee Kawaii', producer: 'TrillzMix', year: '2019, viral in 2020', why: 'XXL credits it with giving the sound a national hit, and Okayplayer calls it one of TikTok\'s first big breakouts for an original song.', sources: ['https://www.xxlmag.com/jersey-club-music/', 'https://www.thefader.com/2020/02/19/cookiee-kawaii-vibe-interview-tiktok-jersey-club', 'https://www.okayplayer.com/originals/viral-tiktok-songs-club-music-drake-beyonce.html'] },
        { title: 'Heartbroken', artist: 'Bandmanrill', producer: 'MCVertt', year: '2021', why: 'It began as a viral skit, launched the Jersey club and drill hybrid, and Pitchfork named it a must-hear rap song.', sources: ['https://en.wikipedia.org/wiki/Bandmanrill', 'https://www.okayplayer.com/music/jersey-club-rap.html'] },
        { title: 'Bullet', artist: 'Bandmanrill', producer: 'MCVertt', year: '2021', why: 'One of the early Bandmanrill and MCVertt drill records cited when the Jersey drill style took off.', sources: ['https://en.wikipedia.org/wiki/Jersey_club', 'https://www.xxlmag.com/jersey-club-music/'] },
        { title: 'Microdosing', artist: 'UNIIQU3', year: '2021', why: 'Her breakthrough single soundtracked the Versace and Fendi "Fendace" runway show in September 2021 and made Billboard\'s list of the best dance songs of 2021.', sources: ['https://en.wikipedia.org/wiki/Uniiqu3'] },
        { title: 'Real Hips', artist: 'Bandmanrill', year: '2022', why: 'Jon Caramanica of The New York Times praised it as a single that links drill, Jersey club and bass music.', sources: ['https://en.wikipedia.org/wiki/Bandmanrill'] },
        { title: 'Jiggy in Jersey', artist: 'Bandmanrill and Sha EK', producer: 'MCVertt', year: '2022', why: 'The collaboration did well enough to lead to a full 2023 joint album with the same name.', sources: ['https://www.xxlmag.com/jersey-club-music/', 'https://www.thefader.com/2023/06/02/bandmanrill-sha-ek-and-mcvertt-announce-jiggy-in-jersey-mixtape'] },
        { title: 'Currents', artist: 'Drake', year: '2022', why: 'On Honestly, Nevermind, Drake used Jersey club drum patterns and the "Some Cut" bed squeak, which showed how far the sound had traveled.', sources: ['https://www.xxlmag.com/jersey-club-music/', 'https://en.wikipedia.org/wiki/Jersey_club'] },
        { title: 'Just Wanna Rock', artist: 'Lil Uzi Vert', producer: 'MCVertt and Synthetic', year: '2022', why: 'After previews on TikTok, the Newark-produced track peaked at No. 10 on the Hot 100, and XXL says it changed how the public saw Jersey club.', sources: ['https://en.wikipedia.org/wiki/Just_Wanna_Rock', 'https://www.xxlmag.com/jersey-club-music/'] },
        { title: 'Players (DJ Smallz 732 Jersey Club Remix)', artist: 'Coi Leray', producer: 'DJ Smallz 732', year: '2022', why: 'The remix had more than 1.6 million TikTok creations and helped push "Players" to No. 9 on the Hot 100.', sources: ['https://1053rnb.com/playlist/hip-shakers-5-of-the-biggest-jersey-philly-club-inspired-songs-that-went-from-tiktok-to-billboard', 'https://www.okayplayer.com/music/jersey-club-rap.html'] },
        { title: 'In Ha Mood', artist: 'Ice Spice', producer: 'RIOTUSA', year: '2023', why: 'Its Jersey club-inspired hook drew more than 771,000 TikTok creations and reached No. 58 on the Hot 100.', sources: ['https://1053rnb.com/playlist/hip-shakers-5-of-the-biggest-jersey-philly-club-inspired-songs-that-went-from-tiktok-to-billboard'] },
        { title: 'Boy\'s a Liar Pt. 2', artist: 'PinkPantheress and Ice Spice', year: '2023', why: 'This Jersey club-inspired single reached No. 3 on both the Hot 100 and the Billboard Global 200.', sources: ['https://en.wikipedia.org/wiki/Jersey_club', 'https://www.okayplayer.com/music/jersey-club-rap.html'] },
        { title: 'Jersey Luv', artist: 'Groovy', year: '2023', why: 'Complex put it on its list of the 50 best songs of 2023, a newer Jersey club record on a general best-of list.', sources: ['https://au.complex.com/music/a/ecleen-luzmila/the-best-songs-of-2023'] },
        { title: 'What You Saying', artist: 'Lil Uzi Vert', producer: 'MCVertt', year: '2025', why: 'Uzi and MCVertt teamed up again, and the song peaked at No. 12 on the Hot 100 in January 2026 and hit No. 1 on Rhythmic Airplay.', sources: ['https://en.wikipedia.org/wiki/MCVertt'] },
      ],
    },
  ],
  sourceNames: {
    'en.wikipedia.org': 'Wikipedia', 'www.xxlmag.com': 'XXL', 'www.vice.com': 'VICE', 'mixmag.net': 'Mixmag', 'www.okayplayer.com': 'Okayplayer',
    'dmy.co': 'Dummy (R3LL)', 'i-d.co': 'i-D', 'xlr8r.com': 'XLR8R', 'www.yahoo.com': 'Billboard (via Yahoo)', 'thefader.com': 'The FADER',
    'www.thefader.com': 'The FADER', 'dancingastronaut.com': 'Dancing Astronaut', 'www.complex.com': 'Complex', 'au.complex.com': 'Complex',
    'thesource.com': 'The Source', 'es.njpac.org': 'NJPAC', '1053rnb.com': '105.3 RNB',
  },
  related: [['/listen', 'Hear Jersey club 24/7'], ['/hot', 'This week\'s Rising Now chart'], ['/what-is-jersey-club', 'What is Jersey club?'], ['/jersey-club-dances', 'Jersey club dances']],
};

export const songCount = () => BEST_SONGS.eras.reduce((n, e) => n + e.songs.length, 0);
export const sourceLabel = url => { try { return BEST_SONGS.sourceNames[new URL(url).hostname] ?? new URL(url).hostname.replace(/^www\./, ''); } catch { return 'source'; } };
