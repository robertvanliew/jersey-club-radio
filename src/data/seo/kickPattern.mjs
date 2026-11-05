// /jersey-club-kick-pattern: the classic Jersey club kick, playable, editable and
// downloadable as MIDI or WAV. One source for the React page (src/app/pages/KickPattern.tsx)
// and the prerendered HTML. The pattern itself lives in src/app/lib/jerseyDrums.ts.

export const KICK_PAGE = {
  path: '/jersey-club-kick-pattern',
  title: 'Jersey Club Kick Pattern: Free MIDI + Play It in Your Browser',
  description: 'Hear the classic Jersey club kick pattern, edit it, and download it free as MIDI or a WAV loop for FL Studio, Ableton, BandLab or GarageBand.',
  heading: 'The Jersey club kick pattern',
  updated: '2026-11-05',
  answer: 'The classic Jersey club kick pattern puts five kicks in each bar of 16th notes, on steps 1, 5, 9, 12 and 15: two quarter-note kicks, then two dotted eighths and an eighth that make the beat bounce. Producers usually set it around 140 BPM, add claps on beats 2 and 4, and end phrases with a fast kick roll.',
  sections: [
    { h2: 'How does the Jersey club kick pattern work?', body: [
      'Count one bar as 16 steps. The kick hits on steps 1, 5 and 9, which are the first three beats, then on 12 and 15 instead of on beat four. Those last two kicks land just off the beat, and that push is what gives Jersey club its bounce. Native Instruments describes the same rhythm as two quarter-note kicks, two dotted eighths and an eighth.',
      'Different guides describe the pattern in different ways, as steps, note lengths or a "three-beat" feel, but when you line them up on a grid they point to the same five kicks. Play the Classic preset above to hear it.',
    ] },
    { h2: 'What is the Jersey club kick roll?', body: [
      'Near the end of a phrase, producers often fire a quick run of kicks, usually in 16th-note triplets, that builds into the next section. Turn "Kick roll at the end" on and off above to hear the difference. It is one of the most recognizable sounds in the genre.',
    ] },
    { h2: 'How do I use the MIDI in FL Studio, Ableton, BandLab or GarageBand?', body: [
      'FL Studio: drag the .mid file onto a channel or the playlist, then point each note at your kick, clap and hat samples in the Channel Rack. Ableton Live: drag it onto a MIDI track with a Drum Rack; the notes use the standard General MIDI drum map, so kick C1, clap D#1 and hat F#1 line up with most kits.',
      'BandLab: import the WAV loop into a track, or import the MIDI into a drum instrument track. GarageBand: drag the .mid onto a Drummer or Drum Kit track. Set your project to the same BPM you downloaded, around 140 for classic Jersey club.',
    ] },
    { h2: 'What else makes a beat sound like Jersey club?', body: [
      'The kick pattern is the backbone, but most Jersey club tracks also chop a vocal sample into short stutters, add playful sound effects and leave breaks for dancers. The famous bed squeak comes from a copyrighted record, so this tool uses an original squeak-style sound instead. For tempo help, use the free Jersey club BPM tool, and to hear the real thing, play Jersey Club Radio.',
    ] },
  ],
  faq: [
    { q: 'What is the Jersey club kick pattern?', a: 'Five kicks per bar of 16th notes, on steps 1, 5, 9, 12 and 15, usually around 140 BPM, with claps on beats 2 and 4 and a kick roll to end phrases.' },
    { q: 'What BPM is Jersey club?', a: 'Usually about 130 to 140 BPM, with 140 the most common tempo today.' },
    { q: 'Is this MIDI free to use?', a: 'Yes. The patterns and the synthesized sounds on this page are free to use in your own music. A rhythm pattern on its own is not copyrighted.' },
    { q: 'Where is the bed squeak?', a: 'The original bed squeak is a sample from a copyrighted record, so it is not included. The squeak lane uses an original sound, and in your own project you can put any sound on its MIDI note (C4).' },
  ],
  sources: [
    { name: 'Native Instruments: What is Jersey club?', url: 'https://www.native-instruments.com/blogs/blog/jersey-club' },
    { name: 'Orphiq: What is Jersey club?', url: 'https://orphiq.com/resources/what-is-jersey-club' },
    { name: 'Wikipedia: Jersey club', url: 'https://en.wikipedia.org/wiki/Jersey_club' },
  ],
  related: [['/free-jersey-club-drum-kits', 'Free Jersey club drum kits'], ['/jersey-club-bed-squeak', 'Bed squeak + free sounds'], ['/jersey-club-bpm', 'Jersey club BPM tool'], ['/games/beat-maker', 'Jersey club beat maker'], ['/what-is-jersey-club', 'What is Jersey club?'], ['/listen', 'Listen to Jersey club 24/7']],
};
