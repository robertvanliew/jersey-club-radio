// /jersey-club-bpm: answer + free tap-tempo tool. One source for the React page
// (src/app/pages/BpmTool.tsx) and the prerendered HTML.

export const BPM_PAGE = {
  path: '/jersey-club-bpm',
  title: 'Jersey Club BPM: Tempo Range + Free Tap Tempo Tool',
  description: 'Jersey club usually runs at about 130 to 140 BPM. Tap along to any song to find its tempo, then see how to bring it to Jersey club speed.',
  heading: 'Jersey club BPM',
  updated: '2026-11-05',
  answer: 'Jersey club usually runs at about 130 to 140 beats per minute (BPM), with 140 very common. Newer hybrids, like Jersey club rap and some TikTok remixes, often push faster, toward 150 to 160 BPM. The busy kick patterns make Jersey club feel faster than its BPM.',
  ranges: [
    ['Classic Jersey club', 'About 130 to 140 BPM'],
    ['Most common today', '140 BPM'],
    ['Faster hybrids (Jersey club rap, some remixes)', 'About 150 to 160 BPM'],
    ['Baltimore club (for comparison)', 'Around 130 BPM'],
  ],
  faq: [
    { q: 'What BPM is Jersey club?', a: 'Most Jersey club tracks sit between about 130 and 140 BPM, and 140 is the most common tempo today. Some newer styles run faster, around 150 to 160.' },
    { q: 'How do I find a song\'s BPM?', a: 'Use the tap tool on this page: tap along to the beat for a few seconds and it shows the tempo. Tap on every kick or every beat you feel, not on every drum hit.' },
    { q: 'How do I turn a song into Jersey club tempo?', a: 'Find the song\'s BPM, then speed it up or slow it down to the Jersey club tempo you want, usually 140. Slow songs can sit at half-time: a 70 BPM ballad lines up with a 140 beat at double its speed without being sped up at all. The converter on this page shows the change for you.' },
    { q: 'Is Jersey club faster than house music?', a: 'A little. House music usually sits around 120 to 128 BPM, while Jersey club is usually 130 to 140, and its rapid kick bursts make it feel even faster.' },
  ],
  sources: [
    { name: 'Wikipedia: Jersey club', url: 'https://en.wikipedia.org/wiki/Jersey_club' },
    { name: 'Wikipedia: Baltimore club', url: 'https://en.wikipedia.org/wiki/Baltimore_club' },
    { name: 'Native Instruments: What is Jersey club?', url: 'https://www.native-instruments.com/blogs/blog/jersey-club' },
  ],
  related: [['/jersey-club-kick-pattern', 'Jersey club kick pattern + free MIDI'], ['/what-is-jersey-club', 'What is Jersey club?'], ['/games/beat-maker', 'Make a Jersey club beat'], ['/listen', 'Listen to Jersey club 24/7']],
};

/** Tempo math for the converter: the nearest Jersey club tempo and the speed change to get there */
export function toJerseyTempo(bpm, target = 140) {
  if (!(bpm > 0)) return null;
  // A slow song can sit at half-time under a Jersey beat; a fast one at double-time
  const candidates = [bpm, bpm * 2, bpm / 2];
  const best = candidates.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
  const relation = best === bpm ? 'straight' : best > bpm ? 'half-time' : 'double-time';
  const percent = ((target / best) - 1) * 100;
  return { relation, effective: best, percent, semitones: 12 * Math.log2(target / best) };
}
