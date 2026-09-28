# AutoMix Stage 1 Implementation Plan: Analysis, Storage and Smart Transition Points

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Analyze every natively streamable track (BPM, beat grid, key, cue points, energy), store the results on the server, and make the player start each transition at the outgoing song's outro (`cueOut`) with the incoming song entering at `cueIn`, with an admin kill switch.

**Architecture:** A Node script (`scripts/analyze-mixes.mjs`) decodes each track with ffmpeg, analyzes it with essentia.js, and uploads records to a new admin endpoint on the Supabase Edge Function, which stores them in KV key `jc_mix_analysis_v1`. `/tracks` attaches each record as `track.mix`, plus a `mixEnabled` flag. A pure planner (`src/app/lib/automix.ts`) turns two tracks' records into a transition plan, and `PlayerContext.tsx` uses it to time the existing fade. A daily GitHub Action runs the script.

**Tech Stack:** React 18 + TypeScript + Vite 6, Supabase Edge Functions (Deno + Hono), essentia.js 0.1.3 (WASM), ffmpeg-static, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-28-automix-design.md` (this plan implements "Build order" stage 1).

## Global Constraints

- The analysis script and e2e test run on **Node ≥ 24**: they import `.ts` files using Node's built-in type stripping. Local is Node 25; the GitHub Action pins 24.
- `.ts` files imported by Node scripts must use only erasable TypeScript syntax: no `enum`, no `namespace`, no parameter properties.
- Analysis runs at **44 100 Hz mono** (essentia `RhythmExtractor2013` assumes 44.1 kHz).
- KV keys: `jc_mix_analysis_v1` (map of videoId → `MixAnalysis`) and `jc_mix_enabled_v1` (boolean, default `true` when unset).
- `ANALYSIS_VERSION = 1`. Phrase length is `PHRASE_BARS = 8` bars of 4 beats.
- Stage 1 changes **timing only**: the existing volume curves (5 s solo lead-in, then an equal-power overlap) are unchanged. No time-stretching, filters or new styles.
- Tracks without a `mix` record, or with `mixEnabled === false`, must behave exactly as today (trigger at `duration − 15 s`, 5 s + 10 s curve).
- Tests must never write to the live backend: e2e tests block `radio/advance|heartbeat|report-duration`, `plays/track`, `visits/log`, `leaderboard/sync` and `vault/` and fake `radio/now-playing`.
- Colors and styles in admin UI follow `AdminPanel.tsx` (purple `#9D00FF`, green `#00FF88`, muted `#5B4F70`, card `#0A0716`).

## Review Focus

1. **SoundCloud replaced a track's audio after analysis** (the record's `duration` no longer matches the real audio): the player must fall back to legacy timing, not seek to wrong cue points. Pinned in Task 5 (`planTransition` duration-mismatch test).
2. **A listener joins after the cue window has passed** (for example the station is already at `cueOut + 30 s`): the transition must still happen, using legacy timing near the end, and not be skipped. Pinned in Task 5 (`shouldStartCrossfade` late-join test).
3. **The analysis script is given a DRM track or a download fails:** it must skip the track, log it, and continue with the rest, never aborting the whole run. Pinned in Task 4 (`analyzeTrack` returns `{ skipped }` test).
4. **A malformed or hostile upload to `/admin/mix-analysis`** (wrong types, cueIn ≥ cueOut, NaN): bad records are rejected individually while good ones are saved. Pinned in Task 3 (validator tests).
5. **The admin flips the kill switch while listeners are connected:** open pages must stop using cue timing within about a minute, without a reload. Pinned in Task 7 (e2e `mixEnabled` flip via `/radio/listeners`).

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/app/lib/camelot.ts` | create | Key/scale → Camelot code; Camelot compatibility |
| `src/app/lib/camelot.test.ts` | create | Unit tests for camelot.ts |
| `scripts/lib/mix-analysis.mjs` | create | Pure analysis: PCM → `MixAnalysis` (essentia + energy/phrase logic) |
| `scripts/lib/mix-analysis.test.mjs` | create | Unit + synthetic-audio tests |
| `scripts/analyze-mixes.mjs` | create | CLI: fetch tracks, download/decode, analyze, upload |
| `supabase/functions/make-server-715f71b9/mix_validate.ts` | create | Validate one uploaded record (shared by endpoint and tests) |
| `supabase/functions/make-server-715f71b9/mix_validate.test.ts` | create | Validator tests |
| `supabase/functions/make-server-715f71b9/index.ts` | modify | New endpoints; `/tracks` and `/radio/listeners` include mix data |
| `src/app/lib/automix.ts` | create | `MixAnalysis` type, `planTransition`, `shouldStartCrossfade`, constants |
| `src/app/lib/automix.test.ts` | create | Planner tests |
| `src/app/context/PlayerContext.tsx` | modify | Use planner for trigger/timing; seek incoming to cueIn; report true startedAt; mixEnabled |
| `src/app/components/AdminPanel.tsx` | modify | AutoMix on/off switch |
| `tests/e2e/automix-stage1.mjs` | create | Browser test with real analysis records on a faked station |
| `.github/workflows/analyze-mixes.yml` | create | Daily + manual analysis run |
| `package.json` | modify | devDeps + `test`, `analyze`, `test:e2e` scripts |

---

### Task 1: Test tooling and Camelot keys

**Files:**
- Modify: `package.json`
- Create: `src/app/lib/camelot.ts`
- Test: `src/app/lib/camelot.test.ts`

**Interfaces:**
- Produces: `toCamelot(key: string, scale: string): string` (throws on unknown key); `camelotCompatible(a: string, b: string): boolean`.

- [ ] **Step 1: Install dev tools**

```bash
npm i -D vitest@^3 essentia.js@0.1.3 ffmpeg-static@^5 playwright@^1.55
```

Then add to `package.json` `"scripts"` (keep `build` and `dev`):

```json
"test": "vitest run",
"analyze": "node scripts/analyze-mixes.mjs",
"test:e2e": "node tests/e2e/automix-stage1.mjs"
```

- [ ] **Step 2: Write the failing test** in `src/app/lib/camelot.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { toCamelot, camelotCompatible } from './camelot';

describe('toCamelot', () => {
  it.each([
    ['C', 'major', '8B'], ['A', 'minor', '8A'], ['G', 'major', '9B'], ['E', 'minor', '9A'],
    ['F', 'major', '7B'], ['D', 'minor', '7A'], ['B', 'major', '1B'], ['Ab', 'minor', '1A'],
    ['G#', 'minor', '1A'], ['F#', 'major', '2B'], ['Gb', 'major', '2B'], ['Eb', 'minor', '2A'],
    ['C#', 'major', '3B'], ['Db', 'major', '3B'], ['Bb', 'minor', '3A'], ['C#', 'minor', '12A'],
  ])('%s %s -> %s', (key, scale, code) => {
    expect(toCamelot(key, scale)).toBe(code);
  });
  it('throws on an unknown key', () => {
    expect(() => toCamelot('H', 'major')).toThrow();
  });
});

describe('camelotCompatible', () => {
  it('same code', () => expect(camelotCompatible('8A', '8A')).toBe(true));
  it('relative major/minor', () => expect(camelotCompatible('8A', '8B')).toBe(true));
  it('one step, same letter', () => {
    expect(camelotCompatible('8A', '9A')).toBe(true);
    expect(camelotCompatible('8A', '7A')).toBe(true);
  });
  it('wraps 12 -> 1', () => expect(camelotCompatible('12B', '1B')).toBe(true));
  it('two steps apart is a clash', () => expect(camelotCompatible('8A', '10A')).toBe(false));
  it('one step with other letter is a clash', () => expect(camelotCompatible('8A', '9B')).toBe(false));
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/app/lib/camelot.test.ts`
Expected: FAIL, "Failed to resolve import ./camelot".

- [ ] **Step 4: Implement** `src/app/lib/camelot.ts`

```ts
// Camelot wheel: the standard DJ notation for harmonic mixing.
// Number = position on the circle of fifths, A = minor, B = major.

const MAJOR: Record<string, number> = {
  C: 8, G: 9, D: 10, A: 11, E: 12, B: 1, 'F#': 2, Gb: 2, Db: 3, 'C#': 3,
  Ab: 4, 'G#': 4, Eb: 5, 'D#': 5, Bb: 6, 'A#': 6, F: 7,
};
const MINOR: Record<string, number> = {
  A: 8, E: 9, B: 10, 'F#': 11, Gb: 11, 'C#': 12, Db: 12, 'G#': 1, Ab: 1,
  'D#': 2, Eb: 2, 'A#': 3, Bb: 3, F: 4, C: 5, G: 6, D: 7,
};

export function toCamelot(key: string, scale: string): string {
  const minor = scale.toLowerCase() === 'minor';
  const n = (minor ? MINOR : MAJOR)[key];
  if (!n) throw new Error(`Unknown key: ${key} ${scale}`);
  return `${n}${minor ? 'A' : 'B'}`;
}

function parse(code: string): { n: number; letter: string } {
  return { n: parseInt(code, 10), letter: code.slice(-1) };
}

export function camelotCompatible(a: string, b: string): boolean {
  const x = parse(a);
  const y = parse(b);
  if (x.n === y.n) return true; // same key, or relative major/minor
  if (x.letter !== y.letter) return false;
  const diff = Math.abs(x.n - y.n);
  return diff === 1 || diff === 11; // neighbours, including 12 <-> 1
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/app/lib/camelot.test.ts`
Expected: PASS (all).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/app/lib/camelot.ts src/app/lib/camelot.test.ts
git commit -m "feat(automix): add test tooling and Camelot key helpers"
```

---

### Task 2: Audio analysis core

**Files:**
- Create: `scripts/lib/mix-analysis.mjs`
- Test: `scripts/lib/mix-analysis.test.mjs`

**Interfaces:**
- Consumes: `toCamelot` from `src/app/lib/camelot.ts`.
- Produces: `ANALYSIS_VERSION = 1`, `PHRASE_BARS = 8`, `analyzePcm(pcm: Float32Array, sampleRate: number): MixAnalysis | null`, and helpers `foldBpm`, `gridOffset`, `phraseEnergies`, `findDrop`, `findOutro`. A `MixAnalysis` object has exactly the spec fields: `version, bpm, beatOffset, cueIn, cueOut, energyIn, energyOut, energyDrop, camelot, keyStrength, duration, analyzedAt`.

- [ ] **Step 1: Write the failing tests** in `scripts/lib/mix-analysis.test.mjs`

```js
import { describe, it, expect } from 'vitest';
import { analyzePcm, foldBpm, gridOffset, findDrop, findOutro } from './mix-analysis.mjs';

const SR = 44100;

// Synthetic track: [lead] silence, then bars of kicks at `bpm` with an energy shape
// intro (introBars, quiet) -> drop (dropBars, loud) -> outro (outroBars, quiet),
// downbeats accented, plus an A-minor triad pad throughout.
function synth({ bpm, lead = 0.5, introBars = 16, dropBars = 32, outroBars = 16 }) {
  const beat = 60 / bpm;
  const bars = introBars + dropBars + outroBars;
  const len = Math.ceil((lead + bars * 4 * beat + 1) * SR);
  const pcm = new Float32Array(len);
  for (let b = 0; b < bars * 4; b++) {
    const bar = Math.floor(b / 4);
    const loud = bar >= introBars && bar < introBars + dropBars;
    const amp = (loud ? 0.9 : 0.25) * (b % 4 === 0 ? 1 : 0.7);
    const start = Math.floor((lead + b * beat) * SR);
    for (let i = 0; i < SR * 0.12 && start + i < len; i++) {
      const t = i / SR;
      pcm[start + i] += amp * Math.sin(2 * Math.PI * 55 * t) * Math.exp(-t * 30);
    }
  }
  for (let i = Math.floor(lead * SR); i < len; i++) {
    const t = i / SR;
    pcm[i] += 0.05 * (Math.sin(2 * Math.PI * 220 * t) + Math.sin(2 * Math.PI * 261.63 * t) + Math.sin(2 * Math.PI * 329.63 * t));
  }
  return { pcm, beat, bar: 4 * beat, lead, introBars, dropBars };
}

describe('foldBpm', () => {
  it('doubles half-time and halves double-time', () => {
    expect(foldBpm(70)).toBe(140);
    expect(foldBpm(280)).toBe(140);
    expect(foldBpm(140)).toBe(140);
  });
});

describe('gridOffset', () => {
  it('finds the phase of evenly spaced ticks', () => {
    const ticks = Array.from({ length: 20 }, (_, i) => 0.3 + i * 0.5);
    expect(gridOffset(ticks, 0.5)).toBeCloseTo(0.3, 2);
  });
});

describe('findDrop / findOutro', () => {
  const blocks = [0.3, 0.3, 1, 1, 1, 1, 0.3, 0.3];
  it('drop is the biggest rise in the first 60%', () => expect(findDrop(blocks)).toBe(2));
  it('outro starts where energy stays low', () => expect(findOutro(blocks)).toBe(6));
  it('no rise -> null', () => expect(findDrop([1, 1, 1, 1, 1])).toBeNull());
  it('never drops low -> null', () => expect(findOutro([1, 1, 1, 1])).toBeNull());
});

describe('analyzePcm on synthetic audio', { timeout: 60_000 }, () => {
  for (const bpm of [130, 140, 150]) {
    it(`detects tempo, cue points and key at ${bpm} BPM`, () => {
      const s = synth({ bpm });
      const r = analyzePcm(s.pcm, SR);
      expect(r).not.toBeNull();
      expect(Math.abs(r.bpm - bpm)).toBeLessThan(0.5);
      const drop = s.lead + s.introBars * s.bar;
      const outro = s.lead + (s.introBars + s.dropBars) * s.bar;
      expect(Math.abs(r.cueIn - (drop - 8 * s.bar))).toBeLessThan(s.bar);
      expect(Math.abs(r.cueOut - outro)).toBeLessThan(s.bar);
      expect(r.camelot).toBe('8A');
      expect(r.energyDrop).toBeGreaterThan(r.energyOut);
      expect(r.version).toBe(1);
    });
  }

  it('returns null for audio too short to mix', () => {
    const s = synth({ bpm: 140, introBars: 2, dropBars: 4, outroBars: 2 });
    expect(analyzePcm(s.pcm, SR)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run scripts/lib/mix-analysis.test.mjs`
Expected: FAIL, "Failed to resolve import ./mix-analysis.mjs".

- [ ] **Step 3: Implement** `scripts/lib/mix-analysis.mjs`

```js
// Pure audio analysis for AutoMix. Input: mono PCM at 44.1 kHz. Output: a MixAnalysis
// record (see docs/superpowers/specs/2026-09-28-automix-design.md) or null if the
// track is too short to mix.
import pkg from 'essentia.js';
import { toCamelot } from '../../src/app/lib/camelot.ts';

const { Essentia, EssentiaWASM } = pkg;
let essentia;
const getEssentia = () => (essentia ??= new Essentia(EssentiaWASM));

export const ANALYSIS_VERSION = 1;
export const PHRASE_BARS = 8;

/** Fold half/double-time estimates into the 100–180 BPM range jersey club lives in */
export function foldBpm(bpm) {
  let b = bpm;
  while (b < 100) b *= 2;
  while (b > 180) b /= 2;
  return b;
}

/** Phase (seconds, 0..beatSec) of a tick train, via circular mean */
export function gridOffset(ticks, beatSec) {
  let s = 0, c = 0;
  for (const t of ticks) {
    const a = (2 * Math.PI * (t % beatSec)) / beatSec;
    s += Math.sin(a);
    c += Math.cos(a);
  }
  let ang = Math.atan2(s, c);
  if (ang < 0) ang += 2 * Math.PI;
  return (ang / (2 * Math.PI)) * beatSec;
}

function lowpass(pcm, sr, hz = 150) {
  const a = 1 - Math.exp((-2 * Math.PI * hz) / sr);
  const out = new Float32Array(pcm.length);
  let y = 0;
  for (let i = 0; i < pcm.length; i++) { y += a * (pcm[i] - y); out[i] = y; }
  return out;
}

function rms(x, from, to) {
  const f = Math.max(0, Math.floor(from));
  const t = Math.min(x.length, Math.floor(to));
  if (t <= f) return 0;
  let s = 0;
  for (let i = f; i < t; i++) s += x[i] * x[i];
  return Math.sqrt(s / (t - f));
}

/** Which of the 4 beats in a bar is the downbeat: the one with the most low-end energy */
function downbeatPhase(low, sr, offset, beatSec) {
  const sums = [0, 0, 0, 0];
  const win = 0.1 * sr;
  for (let n = 0; offset + n * beatSec < low.length / sr; n++) {
    const s = (offset + n * beatSec) * sr;
    sums[n % 4] += rms(low, s, s + win);
  }
  return sums.indexOf(Math.max(...sums));
}

/** Per-bar RMS normalized to the track's 95th percentile (0..1) */
function barEnergies(pcm, sr, beatOffset, barSec) {
  const out = [];
  for (let t = beatOffset; t + barSec <= pcm.length / sr; t += barSec) {
    out.push(rms(pcm, t * sr, (t + barSec) * sr));
  }
  const sorted = [...out].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(0.95 * (sorted.length - 1))] || 1;
  return out.map(e => Math.min(1, e / p95));
}

const mean = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Mean energy of each 8-bar phrase */
export function phraseEnergies(bars) {
  const out = [];
  for (let i = 0; i + PHRASE_BARS <= bars.length; i += PHRASE_BARS) out.push(mean(bars.slice(i, i + PHRASE_BARS)));
  return out;
}

/** Phrase index of the first drop: the biggest energy rise in the first 60% of the track */
export function findDrop(blocks) {
  let best = null, bestJump = 0;
  const last = Math.floor(blocks.length * 0.6);
  for (let i = 1; i <= last && i < blocks.length; i++) {
    const jump = blocks[i] - blocks[i - 1];
    if (jump > bestJump) { bestJump = jump; best = i; }
  }
  return best;
}

/** Phrase index where the outro starts: energy stays below 60% of the median from here on */
export function findOutro(blocks) {
  const sorted = [...blocks].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const thr = 0.6 * median;
  let i = blocks.length;
  while (i > 1 && blocks[i - 1] < thr) i--;
  return i === blocks.length ? null : i;
}

export function analyzePcm(pcm, sampleRate) {
  const e = getEssentia();
  const vec = e.arrayToVector(pcm);
  let rhythm, key;
  try {
    rhythm = e.RhythmExtractor2013(vec, 208, 'multifeature', 40);
    key = e.KeyExtractor(vec, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 'edma', sampleRate);
  } finally {
    vec.delete?.();
  }
  const ticks = Array.from(e.vectorToArray(rhythm.ticks));
  const duration = pcm.length / sampleRate;

  const bpm = foldBpm(rhythm.bpm);
  const beatSec = 60 / bpm;
  const barSec = 4 * beatSec;
  const low = lowpass(pcm, sampleRate);
  const offset = gridOffset(ticks, beatSec);
  const beatOffset = offset + downbeatPhase(low, sampleRate, offset, beatSec) * beatSec;

  const bars = barEnergies(pcm, sampleRate, beatOffset, barSec);
  const blocks = phraseEnergies(bars);
  const phraseSec = PHRASE_BARS * barSec;
  const at = i => beatOffset + i * phraseSec;

  const dropIdx = findDrop(blocks);
  const outroIdx = findOutro(blocks);
  const lastAllowed = beatOffset + Math.floor((duration - phraseSec - beatOffset) / barSec) * barSec;
  const drop = dropIdx === null ? null : at(dropIdx);
  const cueIn = drop === null ? beatOffset : Math.max(beatOffset, drop - phraseSec);
  const cueOut = Math.min(outroIdx === null ? lastAllowed : at(outroIdx), lastAllowed);
  if (cueOut <= cueIn + phraseSec) return null;

  const barIdx = t => Math.round((t - beatOffset) / barSec);
  const energyAt = t => mean(bars.slice(barIdx(t), barIdx(t) + PHRASE_BARS));
  const round = (x, d = 3) => Math.round(x * 10 ** d) / 10 ** d;

  return {
    version: ANALYSIS_VERSION,
    bpm: round(bpm, 2),
    beatOffset: round(beatOffset),
    cueIn: round(cueIn),
    cueOut: round(cueOut),
    energyIn: round(energyAt(cueIn)),
    energyOut: round(energyAt(cueOut)),
    energyDrop: round(energyAt(drop ?? cueIn)),
    camelot: toCamelot(key.key, key.scale),
    keyStrength: round(key.strength),
    duration: round(duration, 2),
    analyzedAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run scripts/lib/mix-analysis.test.mjs`
Expected: PASS (all). If a synthetic BPM case fails on the downbeat (cue points off by exactly one or two beats), check `downbeatPhase` first; the synthetic downbeats are the loudest kicks.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/mix-analysis.mjs scripts/lib/mix-analysis.test.mjs
git commit -m "feat(automix): add audio analysis (tempo, beat grid, cue points, energy, key)"
```

---

### Task 3: Server storage, endpoints and kill switch

**Files:**
- Create: `supabase/functions/make-server-715f71b9/mix_validate.ts`
- Test: `supabase/functions/make-server-715f71b9/mix_validate.test.ts`
- Modify: `supabase/functions/make-server-715f71b9/index.ts` (`GET /tracks` around line 688–706; `GET /radio/listeners` around 3741–3743; add new routes after `PUT /admin/playlist-order`, around line 4056)

**Interfaces:**
- Produces: `validateMixRecord(rec: unknown): string | null` (error message or null);
  - `PUT /admin/mix-analysis` body `{ adminKey: string, records: Record<videoId, MixAnalysis> }` → `{ saved: number, rejected: Record<videoId, string> }`;
  - `PUT /admin/mix-enabled` (Supabase admin auth) body `{ enabled: boolean }` → `{ success: true, enabled }`;
  - `GET /tracks` adds `track.mix` and top-level `mixEnabled: boolean`;
  - `GET /radio/listeners` adds `mixEnabled: boolean`.

- [ ] **Step 1: Write the failing test** `supabase/functions/make-server-715f71b9/mix_validate.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { validateMixRecord } from './mix_validate';

const good = {
  version: 1, bpm: 140, beatOffset: 0.43, cueIn: 14.2, cueOut: 190.5,
  energyIn: 0.4, energyOut: 0.35, energyDrop: 0.95, camelot: '8A', keyStrength: 0.8,
  duration: 220.1, analyzedAt: '2026-09-28T12:00:00.000Z',
};

describe('validateMixRecord', () => {
  it('accepts a valid record', () => expect(validateMixRecord(good)).toBeNull());
  it('rejects non-objects', () => {
    expect(validateMixRecord(null)).not.toBeNull();
    expect(validateMixRecord('x')).not.toBeNull();
  });
  it.each([
    ['bpm', 'fast'], ['bpm', NaN], ['bpm', 40], ['bpm', 260],
    ['version', 0], ['version', 1.5],
    ['beatOffset', -1], ['beatOffset', 12],
    ['energyIn', 1.5], ['energyDrop', -0.1], ['keyStrength', 2],
    ['camelot', '13A'], ['camelot', '8C'], ['camelot', ''],
    ['duration', 10], ['duration', 5000],
    ['analyzedAt', 'yesterday'],
  ])('rejects bad %s = %s', (field, value) => {
    expect(validateMixRecord({ ...good, [field]: value })).not.toBeNull();
  });
  it('rejects cueIn at or after cueOut', () => {
    expect(validateMixRecord({ ...good, cueIn: 200, cueOut: 190 })).not.toBeNull();
  });
  it('rejects cueOut beyond duration', () => {
    expect(validateMixRecord({ ...good, cueOut: 230 })).not.toBeNull();
  });
  it('rejects unknown extra fields', () => {
    expect(validateMixRecord({ ...good, evil: '<script>' })).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run supabase/functions/make-server-715f71b9/mix_validate.test.ts`
Expected: FAIL, "Failed to resolve import ./mix_validate".

- [ ] **Step 3: Implement** `supabase/functions/make-server-715f71b9/mix_validate.ts`

```ts
// Validates one AutoMix analysis record uploaded by scripts/analyze-mixes.mjs.
// Returns an error message, or null when the record is valid.

const FIELDS = [
  'version', 'bpm', 'beatOffset', 'cueIn', 'cueOut', 'energyIn', 'energyOut',
  'energyDrop', 'camelot', 'keyStrength', 'duration', 'analyzedAt',
];

const num = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

export function validateMixRecord(rec: unknown): string | null {
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return 'record must be an object';
  const r = rec as Record<string, unknown>;
  const extra = Object.keys(r).filter(k => !FIELDS.includes(k));
  if (extra.length) return `unknown fields: ${extra.join(', ')}`;
  if (!Number.isInteger(r.version) || (r.version as number) < 1) return 'version must be an integer >= 1';
  if (!num(r.bpm, 60, 200)) return 'bpm must be 60-200';
  if (!num(r.duration, 30, 1200)) return 'duration must be 30-1200s';
  if (!num(r.beatOffset, 0, 10)) return 'beatOffset must be 0-10s';
  if (!num(r.cueIn, 0, r.duration as number)) return 'cueIn out of range';
  if (!num(r.cueOut, 0, r.duration as number)) return 'cueOut out of range';
  if ((r.cueIn as number) >= (r.cueOut as number)) return 'cueIn must be before cueOut';
  for (const f of ['energyIn', 'energyOut', 'energyDrop', 'keyStrength']) {
    if (!num(r[f], 0, 1)) return `${f} must be 0-1`;
  }
  if (typeof r.camelot !== 'string' || !/^(1[0-2]|[1-9])[AB]$/.test(r.camelot)) return 'camelot must look like 8A';
  if (typeof r.analyzedAt !== 'string' || Number.isNaN(Date.parse(r.analyzedAt))) return 'analyzedAt must be an ISO date';
  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run supabase/functions/make-server-715f71b9/mix_validate.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire it into the server.** In `index.ts`, add next to the existing `import * as kv from "./kv_store.ts";`:

```ts
import { validateMixRecord } from "./mix_validate.ts";
```

In `GET /tracks`, replace:

```ts
    const filteredNR = newReleases.filter((t: any) =>
```

with:

```ts
    // Attach AutoMix analysis records + the station-wide kill switch
    const mixMap = ((await kv.get('jc_mix_analysis_v1')) as Record<string, any>) || {};
    const mixEnabled = ((await kv.get('jc_mix_enabled_v1')) as boolean | null) ?? true;
    tracks = tracks.map((t: any) => {
      const id = t.id?.videoId;
      return id && mixMap[id] ? { ...t, mix: mixMap[id] } : t;
    });

    const filteredNR = newReleases.filter((t: any) =>
```

and in the same handler's response replace `filteredCount: filtered.length,` with:

```ts
      filteredCount: filtered.length,
      mixEnabled,
```

In `GET /radio/listeners`, replace:

```ts
    const totalVisitors = visitorLog?.totalUnique || 0;

    return c.json({ count: Math.max(1, activeCount), totalVisitors });
```

with:

```ts
    const totalVisitors = visitorLog?.totalUnique || 0;
    // Clients poll this every 60s; carrying the AutoMix kill switch here lets it
    // take effect on open pages without a reload.
    const mixEnabled = ((await kv.get('jc_mix_enabled_v1')) as boolean | null) ?? true;

    return c.json({ count: Math.max(1, activeCount), totalVisitors, mixEnabled });
```

After the `PUT /admin/playlist-order` handler, add:

```ts
// PUT /admin/mix-analysis — upload AutoMix analysis records (scripts/analyze-mixes.mjs)
app.put("/make-server-715f71b9/admin/mix-analysis", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    if (!ADMIN_KEY || body.adminKey !== ADMIN_KEY) return c.json({ error: 'Unauthorized' }, 401);
    const records = body.records;
    if (!records || typeof records !== 'object' || Array.isArray(records)) {
      return c.json({ error: 'records must be an object of videoId -> record' }, 400);
    }
    const accepted: Record<string, any> = {};
    const rejected: Record<string, string> = {};
    for (const [id, rec] of Object.entries(records)) {
      const err = validateMixRecord(rec);
      if (err) rejected[id] = err; else accepted[id] = rec;
    }
    const existing = ((await kv.get('jc_mix_analysis_v1')) as Record<string, any>) || {};
    await kv.set('jc_mix_analysis_v1', { ...existing, ...accepted });
    console.log(`[AutoMix] saved ${Object.keys(accepted).length} records, rejected ${Object.keys(rejected).length}`);
    return c.json({ saved: Object.keys(accepted).length, rejected });
  } catch (e) {
    console.log("[AutoMix] mix-analysis error:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// PUT /admin/mix-enabled — AutoMix kill switch (admin panel)
app.put("/make-server-715f71b9/admin/mix-enabled", async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  try {
    const { enabled } = await c.req.json();
    if (typeof enabled !== 'boolean') return c.json({ error: 'enabled must be a boolean' }, 400);
    await kv.set('jc_mix_enabled_v1', enabled);
    console.log(`[AutoMix] ${auth.userId} set AutoMix ${enabled ? 'ON' : 'OFF'}`);
    return c.json({ success: true, enabled });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});
```

- [ ] **Step 6: Deploy the function.** This needs the Supabase CLI logged in to the project owner's account. Ask the user to run `npx supabase login` once (it opens a browser). Then:

```bash
npx supabase functions deploy make-server-715f71b9 --project-ref jzsuxntewgderdhzdbeh --no-verify-jwt
```

Expected: "Deployed Functions on project jzsuxntewgderdhzdbeh: make-server-715f71b9".

- [ ] **Step 7: Verify live.** Run (PowerShell or bash) against the deployed function, with the anon key from `utils/supabase/info.tsx`:
  - `GET /tracks` → response has `"mixEnabled": true`; tracks have no `mix` yet.
  - `GET /radio/listeners` → response has `"mixEnabled": true`.
  - `PUT /admin/mix-analysis` with `{"adminKey":"wrong","records":{}}` → 401.
  - `PUT /admin/mix-enabled` with no auth token → 401.

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/make-server-715f71b9/mix_validate.ts supabase/functions/make-server-715f71b9/mix_validate.test.ts supabase/functions/make-server-715f71b9/index.ts
git commit -m "feat(automix): store analysis records, expose mix data and kill switch"
```

---

### Task 4: Analysis CLI

**Files:**
- Create: `scripts/analyze-mixes.mjs`
- Modify: `scripts/lib/mix-analysis.mjs` (add `analyzeTrack` for testability)
- Test: `scripts/lib/mix-analysis.test.mjs` (add `analyzeTrack` tests)

**Interfaces:**
- Consumes: `analyzePcm`, `ANALYSIS_VERSION` (Task 2); `PUT /admin/mix-analysis` (Task 3).
- Produces: CLI `node scripts/analyze-mixes.mjs [--dry-run] [--force] [--only id1,id2] [--limit N] [--out file.json]`. Env `ADMIN_KEY` is required unless `--dry-run`. `analyzeTrack(track, { getStreamUrl, decode }): Promise<{ record } | { skipped: string }>`.

- [ ] **Step 1: Write the failing test.** Append to `scripts/lib/mix-analysis.test.mjs` and add `analyzeTrack` to its import from `./mix-analysis.mjs`:

```js
describe('analyzeTrack', () => {
  const track = { id: { videoId: 'sc_1' }, snippet: { title: 'T' } };
  it('skips when the stream URL cannot be resolved (DRM)', async () => {
    const r = await analyzeTrack(track, {
      getStreamUrl: async () => { throw new Error('Stream resolve failed'); },
      decode: async () => { throw new Error('should not be called'); },
    });
    expect(r).toEqual({ skipped: 'stream: Stream resolve failed' });
  });
  it('skips when decoding fails', async () => {
    const r = await analyzeTrack(track, {
      getStreamUrl: async () => 'https://x/a.mp3',
      decode: async () => { throw new Error('ffmpeg exited 1'); },
    });
    expect(r).toEqual({ skipped: 'decode: ffmpeg exited 1' });
  });
  it('skips audio too short to mix', async () => {
    const r = await analyzeTrack(track, {
      getStreamUrl: async () => 'https://x/a.mp3',
      decode: async () => new Float32Array(44100 * 5),
    });
    expect(r).toEqual({ skipped: 'too short to mix' });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run scripts/lib/mix-analysis.test.mjs -t analyzeTrack`
Expected: FAIL, "analyzeTrack is not a function" (or not exported).

- [ ] **Step 3: Implement `analyzeTrack`.** Append to `scripts/lib/mix-analysis.mjs`:

```js
/** Analyze one playlist track. Never throws: failures come back as { skipped: reason }. */
export async function analyzeTrack(track, { getStreamUrl, decode }) {
  let url;
  try { url = await getStreamUrl(track); } catch (e) { return { skipped: `stream: ${e.message}` }; }
  let pcm;
  try { pcm = await decode(url); } catch (e) { return { skipped: `decode: ${e.message}` }; }
  if (pcm.length < 44100 * 30) return { skipped: 'too short to mix' };
  let record;
  try { record = analyzePcm(pcm, 44100); } catch (e) { return { skipped: `analysis: ${e.message}` }; }
  return record ? { record } : { skipped: 'too short to mix' };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run scripts/lib/mix-analysis.test.mjs`
Expected: PASS (all, including Task 2 tests).

- [ ] **Step 5: Implement the CLI** `scripts/analyze-mixes.mjs`

```js
#!/usr/bin/env node
// AutoMix analysis runner. Analyzes playlist tracks that have no current analysis
// record and uploads the results. Run daily by .github/workflows/analyze-mixes.yml.
//
//   node scripts/analyze-mixes.mjs [--dry-run] [--force] [--only id1,id2] [--limit N] [--out file.json]
//
// Env: ADMIN_KEY (required unless --dry-run)
import { readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import { analyzeTrack, ANALYSIS_VERSION } from './lib/mix-analysis.mjs';

const { values: args } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
    only: { type: 'string' },
    limit: { type: 'string' },
    out: { type: 'string' },
  },
});

const info = readFileSync(new URL('../utils/supabase/info.tsx', import.meta.url), 'utf8');
const projectId = info.match(/projectId\s*=\s*"([^"]+)"/)[1];
const anonKey = info.match(/publicAnonKey\s*=\s*"([^"]+)"/)[1];
const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-715f71b9`;
const HEADERS = { Authorization: `Bearer ${anonKey}` };

const adminKey = process.env.ADMIN_KEY;
if (!args['dry-run'] && !adminKey) {
  console.error('ADMIN_KEY env var is required (or pass --dry-run)');
  process.exit(1);
}

async function getStreamUrl(track) {
  const id = track.id.videoId.replace('sc_', '');
  const res = await fetch(`${BASE}/sc-stream?id=${id}`, { headers: HEADERS });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error || `HTTP ${res.status}`);
  return data.url;
}

function decode(url) {
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath, ['-v', 'error', '-i', url, '-ac', '1', '-ar', '44100', '-f', 'f32le', 'pipe:1']);
    const chunks = [];
    let err = '';
    ff.stdout.on('data', c => chunks.push(c));
    ff.stderr.on('data', c => { err += c; });
    ff.on('error', reject);
    ff.on('close', code => {
      if (code !== 0) return reject(new Error(`ffmpeg exited ${code}: ${err.trim().slice(0, 200)}`));
      const buf = Buffer.concat(chunks);
      // Copy into an aligned ArrayBuffer (Buffer.concat may return an unaligned view)
      resolve(new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length)));
    });
  });
}

const { tracks = [] } = await (await fetch(`${BASE}/tracks`, { headers: HEADERS })).json();
let todo = tracks.filter(t => t.source === 'soundcloud');
if (args.only) {
  const ids = new Set(args.only.split(','));
  todo = todo.filter(t => ids.has(t.id.videoId));
}
if (!args.force) todo = todo.filter(t => t.mix?.version !== ANALYSIS_VERSION);
if (args.limit) todo = todo.slice(0, Number(args.limit));
console.log(`[analyze] ${todo.length} track(s) to analyze (of ${tracks.length} in playlist)`);

const records = {};
let skipped = 0;
for (const [i, track] of todo.entries()) {
  const label = `[${i + 1}/${todo.length}] "${track.snippet.title}"`;
  const t0 = Date.now();
  const result = await analyzeTrack(track, { getStreamUrl, decode });
  if (result.skipped) {
    skipped++;
    console.log(`${label} skipped: ${result.skipped}`);
    continue;
  }
  const r = result.record;
  records[track.id.videoId] = r;
  console.log(`${label} ${r.bpm} BPM, ${r.camelot}, cueIn ${r.cueIn}s, cueOut ${r.cueOut}s / ${r.duration}s (${Date.now() - t0}ms)`);
}

if (args.out) writeFileSync(args.out, JSON.stringify(records, null, 2));
console.log(`[analyze] ${Object.keys(records).length} analyzed, ${skipped} skipped`);

if (!args['dry-run'] && Object.keys(records).length) {
  const res = await fetch(`${BASE}/admin/mix-analysis`, {
    method: 'PUT',
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminKey, records }),
  });
  const body = await res.json().catch(() => ({}));
  console.log(`[analyze] upload: HTTP ${res.status}`, body);
  if (!res.ok || Object.keys(body.rejected || {}).length) process.exitCode = 1;
}
```

- [ ] **Step 6: Dry-run on real tracks**

Run: `node scripts/analyze-mixes.mjs --dry-run --limit 3 --out analysis-sample.json`
Expected: three lines like `[1/3] "It's Time (Remix) ft. Fetty Wap" 139.9 BPM, 8A, cueIn 13.7s, cueOut 230.1s / 263s`, with BPMs in the 125–155 range and `cueIn < cueOut < duration`. Then:

Run: `node scripts/analyze-mixes.mjs --dry-run --only <videoId of "Swagg Talk">`
Expected: `skipped: stream: Stream resolve failed`. The run still exits 0.

Delete `analysis-sample.json` afterwards (don't commit it).

- [ ] **Step 7: Commit**

```bash
git add scripts/analyze-mixes.mjs scripts/lib/mix-analysis.mjs scripts/lib/mix-analysis.test.mjs
git commit -m "feat(automix): add analysis CLI (download, decode, analyze, upload)"
```

---

### Task 5: Transition planner

**Files:**
- Create: `src/app/lib/automix.ts`
- Test: `src/app/lib/automix.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface MixAnalysis { version: number; bpm: number; beatOffset: number; cueIn: number; cueOut: number;
    energyIn: number; energyOut: number; energyDrop: number; camelot: string; keyStrength: number; duration: number; analyzedAt: string }
  export const LEAD_IN_SEC = 5, LEGACY_OVERLAP_SEC = 10, LEGACY_TOTAL_SEC = 15, LEGACY_UI_SWITCH_SEC = 10, MIN_TRACK_FOR_XFADE = 30, PHRASE_BARS = 8;
  export type TransitionPlan =
    | { mode: 'legacy'; leadIn: number; overlapSec: number; totalSec: number; uiSwitchAt: number }
    | { mode: 'cued'; outStartAt: number; inStartAt: number; leadIn: number; overlapSec: number; totalSec: number; uiSwitchAt: number };
  export const secPerBar: (bpm: number) => number;
  export function planTransition(out: { mix?: MixAnalysis } | null | undefined, next: { mix?: MixAnalysis } | null | undefined, mixEnabled: boolean, outDuration: number): TransitionPlan;
  export function shouldStartCrossfade(plan: TransitionPlan, pos: number, duration: number): boolean;
  ```

- [ ] **Step 1: Write the failing test** `src/app/lib/automix.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { planTransition, shouldStartCrossfade, type MixAnalysis } from './automix';

const mix = (o: Partial<MixAnalysis> = {}): MixAnalysis => ({
  version: 1, bpm: 140, beatOffset: 0.4, cueIn: 14, cueOut: 200, energyIn: 0.4, energyOut: 0.3,
  energyDrop: 0.9, camelot: '8A', keyStrength: 0.8, duration: 240, analyzedAt: '2026-09-28T00:00:00Z', ...o,
});
const BAR_140 = (4 * 60) / 140;

describe('planTransition', () => {
  it('is legacy when AutoMix is disabled', () => {
    expect(planTransition({ mix: mix() }, { mix: mix() }, false, 240).mode).toBe('legacy');
  });
  it('is legacy when either track has no analysis', () => {
    expect(planTransition({ mix: mix() }, {}, true, 240).mode).toBe('legacy');
    expect(planTransition({}, { mix: mix() }, true, 240).mode).toBe('legacy');
    expect(planTransition(null, { mix: mix() }, true, 240).mode).toBe('legacy');
  });
  it('legacy plan keeps today\'s 5s + 10s timing', () => {
    expect(planTransition(null, null, true, 240)).toEqual({ mode: 'legacy', leadIn: 5, overlapSec: 10, totalSec: 15, uiSwitchAt: 10 });
  });
  it('cues out at the outgoing outro and in at the incoming cueIn, over 8 bars', () => {
    const p = planTransition({ mix: mix({ cueOut: 200 }) }, { mix: mix({ cueIn: 22 }) }, true, 240);
    expect(p.mode).toBe('cued');
    if (p.mode !== 'cued') return;
    expect(p.outStartAt).toBe(200);
    expect(p.inStartAt).toBe(22);
    expect(p.overlapSec).toBeCloseTo(8 * BAR_140, 5);
    expect(p.totalSec).toBeCloseTo(5 + 8 * BAR_140, 5);
    expect(p.uiSwitchAt).toBeCloseTo(5 + 4 * BAR_140, 5);
  });
  it('falls back to legacy when the real audio duration differs from the analysis (track replaced)', () => {
    expect(planTransition({ mix: mix({ duration: 240 }) }, { mix: mix() }, true, 180).mode).toBe('legacy');
  });
  it('tolerates small duration differences and unknown duration', () => {
    expect(planTransition({ mix: mix({ duration: 240 }) }, { mix: mix() }, true, 241.5).mode).toBe('cued');
    expect(planTransition({ mix: mix({ duration: 240 }) }, { mix: mix() }, true, 0).mode).toBe('cued');
  });
  it('falls back to legacy when the blend would run past the end', () => {
    expect(planTransition({ mix: mix({ cueOut: 235, duration: 240 }) }, { mix: mix() }, true, 240).mode).toBe('legacy');
  });
});

describe('shouldStartCrossfade', () => {
  const cued = planTransition({ mix: mix({ cueOut: 200 }) }, { mix: mix() }, true, 240);
  const legacy = planTransition(null, null, true, 240);
  it('cued: starts 5s before cueOut', () => {
    expect(shouldStartCrossfade(cued, 194.5, 240)).toBe(false);
    expect(shouldStartCrossfade(cued, 195.1, 240)).toBe(true);
  });
  it('cued: listener joined after the cue window -> legacy timing near the end', () => {
    // 210s: cue window (195–201s) has passed and 30s remain -> wait
    expect(shouldStartCrossfade(cued, 210, 240)).toBe(false);
    // 225.5s: 14.5s remain -> legacy trigger fires
    expect(shouldStartCrossfade(cued, 225.5, 240)).toBe(true);
  });
  it('legacy: starts with 15s remaining, not in the last 0.5s', () => {
    expect(shouldStartCrossfade(legacy, 224, 240)).toBe(false);
    expect(shouldStartCrossfade(legacy, 225.2, 240)).toBe(true);
    expect(shouldStartCrossfade(legacy, 239.8, 240)).toBe(false);
  });
  it('never crossfades tracks of 30s or less', () => {
    expect(shouldStartCrossfade(legacy, 20, 30)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/app/lib/automix.test.ts`
Expected: FAIL, "Failed to resolve import ./automix".

- [ ] **Step 3: Implement** `src/app/lib/automix.ts`

```ts
// AutoMix transition planning. Pure functions — no React, no DOM — so every
// timing decision is unit-tested. Spec: docs/superpowers/specs/2026-09-28-automix-design.md

export interface MixAnalysis {
  version: number;
  bpm: number;
  beatOffset: number;
  cueIn: number;
  cueOut: number;
  energyIn: number;
  energyOut: number;
  energyDrop: number;
  camelot: string;
  keyStrength: number;
  duration: number;
  analyzedAt: string;
}

export const LEAD_IN_SEC = 5;           // solo fade-out before the incoming track starts
export const LEGACY_OVERLAP_SEC = 10;
export const LEGACY_TOTAL_SEC = LEAD_IN_SEC + LEGACY_OVERLAP_SEC;
export const LEGACY_UI_SWITCH_SEC = 10;
export const MIN_TRACK_FOR_XFADE = 30;  // don't crossfade tracks shorter than this
export const PHRASE_BARS = 8;
const DURATION_TOLERANCE_SEC = 2;

export type TransitionPlan =
  | { mode: 'legacy'; leadIn: number; overlapSec: number; totalSec: number; uiSwitchAt: number }
  | { mode: 'cued'; outStartAt: number; inStartAt: number; leadIn: number; overlapSec: number; totalSec: number; uiSwitchAt: number };

const LEGACY: TransitionPlan = {
  mode: 'legacy', leadIn: LEAD_IN_SEC, overlapSec: LEGACY_OVERLAP_SEC, totalSec: LEGACY_TOTAL_SEC, uiSwitchAt: LEGACY_UI_SWITCH_SEC,
};

export const secPerBar = (bpm: number) => (4 * 60) / bpm;

/**
 * Decide how to transition from `out` to `next`.
 * `outDuration` is the real duration of the outgoing audio (0 if not known yet).
 */
export function planTransition(
  out: { mix?: MixAnalysis } | null | undefined,
  next: { mix?: MixAnalysis } | null | undefined,
  mixEnabled: boolean,
  outDuration: number,
): TransitionPlan {
  const a = out?.mix;
  const b = next?.mix;
  if (!mixEnabled || !a || !b) return LEGACY;
  // SoundCloud audio replaced since analysis — cue points would be wrong
  if (outDuration > 0 && Math.abs(outDuration - a.duration) > DURATION_TOLERANCE_SEC) return LEGACY;
  const overlapSec = PHRASE_BARS * secPerBar(a.bpm);
  const end = outDuration > 0 ? outDuration : a.duration;
  if (a.cueOut - LEAD_IN_SEC < 0 || a.cueOut + overlapSec > end) return LEGACY;
  return {
    mode: 'cued',
    outStartAt: a.cueOut,
    inStartAt: b.cueIn,
    leadIn: LEAD_IN_SEC,
    overlapSec,
    totalSec: LEAD_IN_SEC + overlapSec,
    uiSwitchAt: LEAD_IN_SEC + overlapSec / 2,
  };
}

/** Should the transition start now, given the outgoing position and duration (seconds)? */
export function shouldStartCrossfade(plan: TransitionPlan, pos: number, duration: number): boolean {
  if (!(duration > MIN_TRACK_FOR_XFADE)) return false;
  if (plan.mode === 'cued') {
    const start = plan.outStartAt - plan.leadIn;
    if (pos < start) return false;
    if (pos < plan.outStartAt + 1) return true;
    // Joined after the cue window: fall through to legacy timing near the end
  }
  const remaining = duration - pos;
  return remaining <= LEGACY_TOTAL_SEC && remaining > 0.5;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/app/lib/automix.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/lib/automix.ts src/app/lib/automix.test.ts
git commit -m "feat(automix): add transition planner"
```

---

### Task 6: Player integration

**Files:**
- Modify: `src/app/context/PlayerContext.tsx`
- Test: `tests/e2e/automix-stage1.mjs` (created in Task 7; this task is verified by it plus the manual check below)

**Interfaces:**
- Consumes: `planTransition`, `shouldStartCrossfade`, `MixAnalysis`, `TransitionPlan`, `LEAD_IN_SEC`, `LEGACY_*`, `MIN_TRACK_FOR_XFADE` (Task 5); `track.mix`, `mixEnabled` from `/tracks` and `/radio/listeners` (Task 3).
- Produces: console log lines the e2e test reads:
  - `[DJ] Starting cued transition at <pos>s: Deck X → Deck Y | "<title>" (out <outStartAt>s, in <inStartAt>s, overlap <n>s)`
  - `[DJ] Starting legacy transition at <pos>s: …`

- [ ] **Step 1: Types and imports.** At the top of `PlayerContext.tsx`, add:

```ts
import {
  planTransition, shouldStartCrossfade, LEAD_IN_SEC, LEGACY_TOTAL_SEC, LEGACY_OVERLAP_SEC,
  LEGACY_UI_SWITCH_SEC, MIN_TRACK_FOR_XFADE, type MixAnalysis, type TransitionPlan,
} from '../lib/automix';
```

Add `mix?: MixAnalysis;` to `interface Track` after `soundcloudUrl?: string;`.

Replace the constants block

```ts
const CROSSFADE_TOTAL = 15;        // total seconds for the entire transition
const LEAD_IN = 5;         // seconds of solo fade-out before incoming starts
const OVERLAP = CROSSFADE_TOTAL - LEAD_IN; // seconds of both decks playing
const UI_SWITCH_POINT = 10;         // seconds into crossfade when "now playing" switches
const CROSSFADE_TICK = 30;        // ms between volume updates (approx 33 fps for buttery smooth)
const MIN_TRACK_FOR_XFADE = 30;       // don't crossfade tracks shorter than this
```

with

```ts
// Legacy transition timing lives in ../lib/automix (LEGACY_*); cued timing comes from the planner
const CROSSFADE_TOTAL = LEGACY_TOTAL_SEC;
const CROSSFADE_TICK = 30;        // ms between volume updates (approx 33 fps for buttery smooth)
```

`CROSSFADE_TOTAL` is still used by the widget trigger. After this edit, search the file for `LEAD_IN`, `OVERLAP` and `UI_SWITCH_POINT`: every remaining use is inside `startCrossfade`, which Step 3 replaces.

- [ ] **Step 2: mixEnabled state and upcoming-plan cache.** After `const durationRef = useRef(0);` add:

```ts
  // AutoMix: station-wide kill switch (from /tracks, refreshed by the listeners poll)
  const mixEnabledRef = useRef(true);
  // The next track + transition plan, computed once per current track so shuffle's
  // random pick can't differ between the trigger check and the crossfade itself
  // planDur = the outgoing duration the plan was made with (0 = not known yet)
  const upcomingRef = useRef<{ forId: string; idx: number; plan: TransitionPlan; planDur: number } | null>(null);
```

In `fetchCachedTracks`, after `const data = await res.json();` add:

```ts
      if (typeof data.mixEnabled === 'boolean') mixEnabledRef.current = data.mixEnabled;
```

In the listener-count poll, replace

```ts
        .then(d => { if (d?.count) setListenerCount(d.count); if (d?.totalVisitors != null) setTotalVisitors(d.totalVisitors); })
```

with

```ts
        .then(d => {
          if (d?.count) setListenerCount(d.count);
          if (d?.totalVisitors != null) setTotalVisitors(d.totalVisitors);
          if (typeof d?.mixEnabled === 'boolean' && d.mixEnabled !== mixEnabledRef.current) {
            mixEnabledRef.current = d.mixEnabled;
            upcomingRef.current = null; // re-plan the next transition with the new setting
          }
        })
```

After the `calcNextIndex` callback, add:

```ts
  /** Next track index + transition plan for the current track (cached per track) */
  const getUpcoming = useCallback(() => {
    const cur = currentTrackRef.current;
    const playlist = playlistRef.current;
    if (!cur || !playlist.length) return null;
    const dur = durationRef.current;
    const cached = upcomingRef.current;
    if (cached?.forId === cur.id.videoId) {
      // Re-plan once the real duration is known, so the "audio replaced" check runs
      if (cached.planDur > 0 || dur <= 0) return cached;
      cached.plan = planTransition(cur, playlist[cached.idx], mixEnabledRef.current, dur);
      cached.planDur = dur;
      return cached;
    }
    const idx = calcNextIndex(); // may be random (shuffle): pick once per track
    const plan = planTransition(cur, playlist[idx], mixEnabledRef.current, dur);
    upcomingRef.current = { forId: cur.id.videoId, idx, plan, planDur: dur };
    return upcomingRef.current;
  }, [calcNextIndex]);
  const getUpcomingRef = useRef(getUpcoming);
  useEffect(() => { getUpcomingRef.current = getUpcoming; }, [getUpcoming]);
```

- [ ] **Step 3: Use the plan in `startCrossfade`.** Replace its opening, from `const playlist = playlistRef.current;` through the two `console.log` lines, with:

```ts
    const playlist = playlistRef.current;
    if (!playlist.length || isCrossfadingRef.current) return;

    const upcoming = getUpcoming();
    if (!upcoming) return;
    const nextIdx = upcoming.idx;
    const nextTrack = playlist[nextIdx];
    if (!nextTrack) return;
    const plan = upcoming.plan;

    const active = activeDeckRef.current;
    const incoming = otherDeck(active);
    incomingDeckRef.current = incoming;

    // Reset phase trackers
    incomingStartedRef.current = false;
    uiSwitchedRef.current = false;
    pendingTrackRef.current = { track: nextTrack, index: nextIdx };

    const outPos = active === 'A' ? scAudioA.current?.currentTime : scAudioB.current?.currentTime;
    console.log(plan.mode === 'cued'
      ? `[DJ] Starting cued transition at ${(outPos ?? 0).toFixed(1)}s: Deck ${active} → Deck ${incoming} | "${nextTrack.snippet.title}" (out ${plan.outStartAt}s, in ${plan.inStartAt}s, overlap ${plan.overlapSec.toFixed(1)}s)`
      : `[DJ] Starting legacy transition at ${(outPos ?? 0).toFixed(1)}s: Deck ${active} → Deck ${incoming} | "${nextTrack.snippet.title}"`);
```

Replace

```ts
    loadOnDeck(incoming, nextTrack, false, 0);
```

with

```ts
    loadOnDeck(incoming, nextTrack, false, 0);
    // Cued: the incoming song enters at its cueIn, so its drop lands as the old song leaves
    if (plan.mode === 'cued') seekDeck(incoming, plan.inStartAt);
```

Inside the interval, replace every use of the old constants with the plan: `LEAD_IN` → `plan.leadIn`, `OVERLAP` → `plan.overlapSec`, `UI_SWITCH_POINT` → `plan.uiSwitchAt`, `CROSSFADE_TOTAL` → `plan.totalSec`. There are exactly these occurrences: `elapsed < LEAD_IN`, `elapsed / LEAD_IN`, `elapsed - LEAD_IN`, `overlapElapsed / OVERLAP`, `elapsed >= UI_SWITCH_POINT`, `elapsed >= CROSSFADE_TOTAL`.

Update the dependency array `[calcNextIndex, loadOnDeck, playDeck, setDeckVolume, finishCrossfade]` to `[getUpcoming, loadOnDeck, playDeck, seekDeck, setDeckVolume, finishCrossfade]`.

- [ ] **Step 4: Trigger from the plan.** In the unified progress timer, replace

```ts
        // Synchronous crossfade trigger (YouTube or native SC audio)
        if (activeDur > MIN_TRACK_FOR_XFADE && activeDur > 0) {
          const remaining = activeDur - activeProg;
          if (remaining <= CROSSFADE_TOTAL && remaining > 0.5) {
            console.log(`[DJ] Crossfade trigger: ${activeProg.toFixed(1)}s / ${activeDur.toFixed(1)}s`);
            startCrossfadeRef.current();
          }
        }
```

with

```ts
        // Synchronous crossfade trigger (YouTube or native SC audio) — timing from the AutoMix plan
        const upcoming = getUpcomingRef.current();
        if (upcoming && shouldStartCrossfade(upcoming.plan, activeProg, activeDur)) {
          startCrossfadeRef.current();
        }
```

- [ ] **Step 5: Report the true start time to the station.** In `finishCrossfade`, replace

```ts
    if (radioModeRef.current && currentTrackRef.current) {
      const vid = currentTrackRef.current.id.videoId;
      fetch(`${BASE}/radio/advance`, {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: vid, startedAt: Date.now(), durationSec: 0 }),
      }).catch(() => { });
    }
```

with

```ts
    if (radioModeRef.current && currentTrackRef.current) {
      const vid = currentTrackRef.current.id.videoId;
      // The incoming song has been playing since mid-transition (and from cueIn when cued):
      // report when its position 0 would have been, so late joiners land in sync.
      const inAudio = incoming === 'A' ? scAudioA.current : scAudioB.current;
      const inMode = incoming === 'A' ? deckModeA.current : deckModeB.current;
      const inPos = inMode === 'native' && inAudio ? inAudio.currentTime : progressRef.current;
      fetch(`${BASE}/radio/advance`, {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: vid, startedAt: Date.now() - inPos * 1000, durationSec: 0 }),
      }).catch(() => { });
    }
```

- [ ] **Step 6: Build and run the unit tests**

Run: `npm run build`
Expected: `✓ built in …` with no errors.
Run: `npm test`
Expected: all Vitest suites PASS.

- [ ] **Step 7: Regression check.** Run the Pause-fix browser scenario (no analysis records exist yet, so everything is legacy):

Run: `npm run dev` (in the background), then `node tests/e2e/automix-stage1.mjs --legacy-only` once Task 7 exists. If Task 7 isn't done yet, defer this check to Task 7 Step 3.

- [ ] **Step 8: Commit**

```bash
git add src/app/context/PlayerContext.tsx
git commit -m "feat(automix): time transitions from analysis cue points"
```

---

### Task 7: End-to-end browser test

**Files:**
- Create: `tests/e2e/automix-stage1.mjs`

**Interfaces:**
- Consumes: `scripts/analyze-mixes.mjs --dry-run --only … --out …` (Task 4); player log lines (Task 6); `/tracks` `mix` + `mixEnabled`, `/radio/listeners` `mixEnabled` (Task 3).
- Produces: `node tests/e2e/automix-stage1.mjs [--legacy-only] [--url http://localhost:5173/]`. Exits non-zero on any failed check.

- [ ] **Step 1: Write the test** `tests/e2e/automix-stage1.mjs`

```js
// AutoMix stage 1 browser test. Uses REAL analysis of the first two natively streamable
// tracks, injected into a faked /tracks response, on a faked station clock. Every write
// to the live backend is blocked. Requires the dev server (npm run dev) and Node >= 24.
//
//   node tests/e2e/automix-stage1.mjs [--legacy-only] [--url http://localhost:5173/]
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';

const { values: args } = parseArgs({ options: { 'legacy-only': { type: 'boolean', default: false }, url: { type: 'string', default: 'http://localhost:5173/' } } });

const info = readFileSync(new URL('../../utils/supabase/info.tsx', import.meta.url), 'utf8');
const projectId = info.match(/projectId\s*=\s*"([^"]+)"/)[1];
const anonKey = info.match(/publicAnonKey\s*=\s*"([^"]+)"/)[1];
const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-715f71b9`;

const live = await (await fetch(`${BASE}/tracks`, { headers: { Authorization: `Bearer ${anonKey}` } })).json();
const tracks = live.tracks;
const A = tracks[0], B = tracks[1];

let mixes = {};
if (!args['legacy-only']) {
  const out = join(mkdtempSync(join(tmpdir(), 'automix-')), 'mix.json');
  console.log(`analyzing "${A.snippet.title}" and "${B.snippet.title}"…`);
  execFileSync(process.execPath, ['scripts/analyze-mixes.mjs', '--dry-run', '--force', '--only', `${A.id.videoId},${B.id.videoId}`, '--out', out], { stdio: 'inherit' });
  mixes = JSON.parse(readFileSync(out, 'utf8'));
  if (!mixes[A.id.videoId] || !mixes[B.id.videoId]) throw new Error('analysis failed for a test track');
}

const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`); };

async function scenario({ name, mixEnabled, flipToDisabledAfterLoad = false }) {
  console.log(`\n=== ${name}`);
  const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', m => { const t = m.text(); if (/\[DJ\]|\[Radio\]|\[SC Native\]/.test(t)) logs.push(t.split('\n')[0]); });

  let listenersMixEnabled = mixEnabled;
  const advances = [];
  await page.route(/make-server-715f71b9\/radio\/advance/, async r => {
    advances.push({ body: JSON.parse(r.request().postData() || '{}'), at: Date.now() });
    r.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.route(/make-server-715f71b9\/(radio\/(heartbeat|report-duration)|plays\/track|visits\/log|leaderboard\/sync|vault\/)/, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route(/make-server-715f71b9\/radio\/listeners/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 1, totalVisitors: 1, mixEnabled: listenersMixEnabled }) }));
  await page.route(/make-server-715f71b9\/radio\/now-playing/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ state: { videoId: A.id.videoId, startedAt: Date.now() - 40_000, durationSec: 0 } }) }));
  await page.route(/make-server-715f71b9\/tracks$/, r => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ ...live, mixEnabled, tracks: tracks.map(t => (mixes[t.id.videoId] ? { ...t, mix: mixes[t.id.videoId] } : t)) }),
  }));
  await page.addInitScript(() => {
    window.__audios = [];
    const Orig = window.Audio;
    window.Audio = function (...a) { const el = new Orig(...a); window.__audios.push(el); return el; };
    window.Audio.prototype = Orig.prototype;
  });

  await page.goto(args.url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__audios.some(a => !a.paused && a.duration > 0), null, { timeout: 45_000 });
  await page.waitForTimeout(4000);

  if (flipToDisabledAfterLoad) {
    listenersMixEnabled = false;
    // The listeners poll runs on load and every 60s; force a poll by waiting one interval
    await page.waitForTimeout(61_000);
  }

  const mA = mixes[A.id.videoId];
  const cued = mixEnabled && !flipToDisabledAfterLoad && !!mA;
  // Whenever analysis exists and AutoMix started on, jump just before the cue window, so a
  // broken kill switch would show up as a cued start at cueOut-5 instead of legacy at the end.
  const jumpTarget = mA && mixEnabled ? mA.cueOut - 10 : null;
  const jumpTo = await page.evaluate(({ target }) => {
    const a = window.__audios.find(x => !x.paused);
    a.currentTime = target ?? a.duration - 20;
    return a.currentTime;
  }, { target: jumpTarget });
  console.log(`jumped outgoing to ${jumpTo.toFixed(1)}s`);

  const startLine = await (async () => {
    for (let i = 0; i < 180; i++) { // up to 90s: legacy start may be well after cueOut
      await page.waitForTimeout(500);
      const l = logs.find(x => /Starting (cued|legacy) transition/.test(x));
      if (l) return l;
    }
    return null;
  })();
  check('transition started', !!startLine, startLine ?? 'no log line');
  const at = startLine ? parseFloat(startLine.match(/at ([\d.]+)s/)[1]) : NaN;
  if (cued) {
    check('uses cued timing', /cued/.test(startLine));
    check('starts 5s before cueOut', Math.abs(at - (mA.cueOut - 5)) < 1, `started ${at}s, cueOut ${mA.cueOut}s`);
  } else {
    check('uses legacy timing', /legacy/.test(startLine));
    const dur = await page.evaluate(() => window.__audios.find(a => a.duration > 0).duration);
    check('starts 15s before the end', Math.abs(at - (dur - 15)) < 1, `started ${at}s of ${dur.toFixed(1)}s`);
  }

  // Phase 2 begins 5s in: incoming should be playing from cueIn (cued) or ~0 (legacy)
  await page.waitForTimeout(7000);
  const inPos = await page.evaluate(() => {
    const playing = window.__audios.filter(a => !a.paused);
    return playing.length === 2 ? Math.min(...playing.map(a => a.currentTime)) : null;
  });
  const mB = mixes[B.id.videoId];
  if (cued) check('incoming enters at cueIn', inPos !== null && inPos >= mB.cueIn - 0.5 && inPos <= mB.cueIn + 3, `incoming at ${inPos?.toFixed(1)}s, cueIn ${mB.cueIn}s`);
  else check('incoming enters from the start', inPos !== null && inPos < 3, `incoming at ${inPos?.toFixed(1)}s`);

  // Wait for the transition to finish and check the reported station start time
  for (let i = 0; i < 30 && !advances.length; i++) await page.waitForTimeout(1000);
  const adv = advances.at(-1);
  const nowPos = await page.evaluate(() => window.__audios.find(a => !a.paused)?.currentTime ?? null);
  const impliedPos = adv ? (Date.now() - adv.body.startedAt) / 1000 : null;
  check('reported startedAt matches the incoming position', adv && nowPos !== null && Math.abs(impliedPos - nowPos) < 1.5, `implied ${impliedPos?.toFixed(1)}s, actual ${nowPos?.toFixed(1)}s`);

  // Pause regression
  await page.evaluate(() => document.querySelector('[aria-label="Pause"],[aria-label="Play"]').click());
  await page.waitForTimeout(1500);
  const afterPause = await page.evaluate(() => ({
    button: document.querySelector('[aria-label="Pause"],[aria-label="Play"]')?.getAttribute('aria-label'),
    anyPlaying: window.__audios.some(a => !a.paused),
  }));
  check('Pause still works after the transition', afterPause.button === 'Play' && !afterPause.anyPlaying);

  await browser.close();
}

if (!args['legacy-only']) {
  await scenario({ name: 'Cued transition (AutoMix on)', mixEnabled: true });
  await scenario({ name: 'Kill switch flipped off while listening', mixEnabled: true, flipToDisabledAfterLoad: true });
}
await scenario({ name: 'Legacy transition (AutoMix off)', mixEnabled: false });

console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`);
process.exit(results.every(Boolean) ? 0 : 1);
```

- [ ] **Step 2: Run it against the dev server**

Run: `npm run dev` (background), then `npm run test:e2e`
Expected: all three scenarios pass, ending with `N/N checks passed` and exit 0. The cued scenario shows `starts 5s before cueOut` and `incoming enters at cueIn`.

- [ ] **Step 3: If Task 6 Step 7 was deferred, confirm** `node tests/e2e/automix-stage1.mjs --legacy-only` passes too.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/automix-stage1.mjs
git commit -m "test(automix): add stage 1 browser test"
```

---

### Task 8: Admin kill switch

**Files:**
- Modify: `src/app/components/AdminPanel.tsx`

**Interfaces:**
- Consumes: `GET /tracks` → `mixEnabled`; `PUT /admin/mix-enabled` (Task 3).

- [ ] **Step 1: State.** In `AdminDashboard`, after `const [refreshing, setRefreshing] = useState(false);` add:

```tsx
  const [mixEnabled, setMixEnabled] = useState<boolean | null>(null);
  const [savingMix, setSavingMix] = useState(false);
```

In the mount effect, after `setPlaylist(mapped);` add:

```tsx
      if (typeof tracksData?.mixEnabled === 'boolean') setMixEnabled(tracksData.mixEnabled);
```

- [ ] **Step 2: Toggle handler.** After the `savePicks` callback add:

```tsx
  const toggleAutoMix = useCallback(async () => {
    if (mixEnabled === null || savingMix) return;
    const next = !mixEnabled;
    setSavingMix(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? adminToken;
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${BASE}/admin/mix-enabled`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMixEnabled(next);
      toast.success(`AutoMix ${next ? 'on' : 'off'}. Listeners switch within a minute.`);
    } catch (e) {
      toast.error('AutoMix toggle failed — ' + String(e));
    } finally {
      setSavingMix(false);
    }
  }, [mixEnabled, savingMix, adminToken]);
```

- [ ] **Step 3: Switch UI.** In the header, replace

```tsx
        <button
          onClick={onLogout}
```

with

```tsx
        <div className="flex items-center gap-4">
          {mixEnabled !== null && (
            <button
              onClick={toggleAutoMix}
              disabled={savingMix}
              role="switch"
              aria-checked={mixEnabled}
              aria-label="AutoMix"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all disabled:opacity-50"
              style={{
                background: '#0A0716',
                border: `1px solid ${mixEnabled ? 'rgba(0,255,136,0.35)' : 'rgba(80,30,140,0.3)'}`,
                color: mixEnabled ? '#00FF88' : '#5B4F70',
              }}
            >
              <span
                className="inline-block w-6 h-3.5 rounded-full relative transition-all"
                style={{ background: mixEnabled ? '#00FF88' : '#2A1F3D' }}
              >
                <span
                  className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all"
                  style={{ left: mixEnabled ? '12px' : '2px' }}
                />
              </span>
              AutoMix {mixEnabled ? 'On' : 'Off'}
            </button>
          )}
          <button
            onClick={onLogout}
```

and close the wrapper: after that logout button's closing `</button>`, add `</div>`.

- [ ] **Step 4: Verify manually**

Run: `npm run build` → no errors. Then with `npm run dev`, open `http://localhost:5173/admin`, log in, and:
- the header shows "AutoMix On" in green;
- click it: toast "AutoMix off…", the label turns grey "AutoMix Off";
- reload: it still shows Off (loaded from `/tracks`);
- click again to turn it back On.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/AdminPanel.tsx
git commit -m "feat(automix): add AutoMix kill switch to admin panel"
```

---

### Task 9: Daily analysis workflow and first live run

**Files:**
- Create: `.github/workflows/analyze-mixes.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: Analyze mixes

on:
  schedule:
    - cron: '0 6 * * *'   # daily, 06:00 UTC
  workflow_dispatch: {}

jobs:
  analyze:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - name: Analyze new tracks and upload
        run: node scripts/analyze-mixes.mjs
        env:
          ADMIN_KEY: ${{ secrets.ADMIN_KEY }}
```

- [ ] **Step 2: Commit and push** (pushing redeploys the site on Vercel; the player change is inert until records exist)

```bash
git add .github/workflows/analyze-mixes.yml
git commit -m "ci(automix): run mix analysis daily"
git push origin master
```

- [ ] **Step 3: Add the secret.** The user adds `ADMIN_KEY` in GitHub → `robertvanliew/jersey-club-radio` → Settings → Secrets and variables → Actions → New repository secret. The value is the `ADMIN_KEY` secret already set on the Supabase function (Supabase dashboard → Edge Functions → Secrets). If it can't be found, set a new value in both places.

- [ ] **Step 4: First run.** GitHub → Actions → "Analyze mixes" → Run workflow.
Expected: the log shows about 89 tracks analyzed and 11 skipped with `stream: Stream resolve failed`, then `upload: HTTP 200 { saved: 89, rejected: {} }`. Takes roughly 10–20 minutes.

- [ ] **Step 5: Verify live data.** `GET /tracks` → the non-DRM tracks now carry `mix`. Spot-check three: BPM 125–155, `cueIn < cueOut < duration`.

- [ ] **Step 6: Listening check (the user).** On the live site, listen through at least 5 transitions. Each should hand off at the old song's outro, with the new song's drop landing as the old one fades. If one sounds wrong, note the two song titles; the admin panel's AutoMix switch returns everyone to the old fade within a minute.
