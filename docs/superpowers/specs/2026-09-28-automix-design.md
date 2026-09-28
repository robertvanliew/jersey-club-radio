# AutoMix: DJ-style transitions for Jersey Club Radio

**Date:** 2026-09-28
**Status:** Draft for review

## Goal

Replace the fixed 15-second crossfade with transitions that sound like Apple Music's AutoMix and Spotify's Mix: each song hands off at a musically sensible point, beats stay locked during the overlap, and the transition style fits the two songs. Every listener hears the same mix at the same moment, because the site is one shared radio station.

### Success criteria

- On analyzed song pairs, the handoff starts at the outgoing song's outro and the incoming song's first drop lands as the outgoing song leaves.
- During a Blend, kicks from both songs stay aligned within 30 ms.
- Tempo changes during a mix are not audible: pitch is preserved, the speed change is at most ±6%, and speed eases back to 1.0 after the mix.
- Songs without analysis (DRM-only, or new and not yet analyzed) still transition with today's fade, with no errors.
- An admin can switch AutoMix off for the whole station without a redeploy.
- Listening checks on real song pairs sound like a DJ mix, not a crossfade.

### Out of scope

- Mixing for the 11 DRM-only tracks. They play through the SoundCloud widget, which can't be analyzed, time-stretched or filtered, so they always get the Fade style.
- A per-listener on/off toggle. The mix belongs to the station, like a DJ set.
- Pitch-shifting songs into a compatible key, user-editable transitions and YouTube tracks.

## Current state

- `src/app/context/PlayerContext.tsx` runs two decks (A/B). Natively streamed SoundCloud tracks play through `<audio>` → MediaElementSource → per-deck GainNode → DynamicsCompressor → makeup gain → output.
- The crossfade starts when 15 s remain, using a 5 s solo fade-out followed by a 10 s equal-power overlap. Volumes are stepped by a 30 ms `setInterval`.
- The station clock is `radio_now_playing_v1 = { videoId, startedAt, durationSec }` in KV. Clients compute their position as `(now − startedAt)`, and each client runs its own transitions and reports `/radio/advance`.
- 89 of the 100 playlist tracks resolve to a progressive MP3 through `/sc-stream`. The other 11 are label-monetized and served only as DRM-encrypted HLS, so they use the widget fallback.

## Design

### 1. Analysis record

Stored per track in the single KV key `jc_mix_analysis_v1`, as a map of `videoId` → record:

```ts
interface MixAnalysis {
  version: number;      // analysis algorithm version; bump to force re-analysis
  bpm: number;          // e.g. 140.0 (normalized to the 100–180 range)
  beatOffset: number;   // seconds to the first downbeat; beat n = beatOffset + n·60/bpm
  cueIn: number;        // seconds; start point when mixing in (a downbeat, 8 bars before the first drop)
  cueOut: number;       // seconds; start of the outro (a downbeat, at least 8 bars before the end)
  energyIn: number;     // 0–1, mean energy of the 8 bars from cueIn
  energyOut: number;    // 0–1, mean energy of the 8 bars from cueOut
  energyDrop: number;   // 0–1, mean energy of the 8 bars after the first drop
  camelot: string;      // musical key as a Camelot code, e.g. "8A" (A minor), "8B" (C major)
  keyStrength: number;  // 0–1 confidence of the key estimate
  duration: number;     // seconds
  analyzedAt: string;   // ISO timestamp
}
```

The beat grid is stored as `bpm` + `beatOffset` instead of a list of beats. Jersey club is produced on a fixed tempo grid, so this is enough to describe every beat.

`/tracks` attaches the record to each track as `track.mix` and adds `mixEnabled` (the kill switch) to its response.

### 2. Transition planner (pure function)

`planTransition(out: Track, next: Track, mixEnabled: boolean): TransitionPlan`, placed in a new file `src/app/lib/automix.ts` with no React or DOM dependencies so it can be unit-tested.

Style selection, in order:

| Condition | Style |
|---|---|
| `mixEnabled` is false, or either track has no `mix` record, or either is in widget mode | **Fade**: today's behavior exactly (trigger at `duration − 15 s`, 5 s + 10 s curve) |
| Tempo ratio (allowing ×2/÷2 for half/double time) is outside ±6% | **Echo out** |
| `next.mix.energyDrop − out.mix.energyOut ≥ 0.25` | **Rise** |
| Otherwise | **Blend** |

**Key compatibility** (as Apple and Spotify use): two keys are compatible on the Camelot wheel if they have the same code, the same number with the other letter, or numbers one apart with the same letter (12 wraps to 1). If either `keyStrength < 0.5`, the key counts as unknown and is treated as compatible. A Blend between incompatible keys is shortened from 8 bars to 4, which reduces how long the clashing notes overlap. Rise and Echo out are unaffected because they already keep the overlap short or filtered.

Plan output: `{ style, outStartAt /* cueOut */, inStartAt /* cueIn */, bars /* 8, or 4 for a key-clash Blend */, rate /* bpmOut/bpmIn, 1 for Echo/Fade */, secPerBar }`.

### 3. Playback engine changes

**Audio graph per deck.** `source → highpass (Rise) → lowshelf 200 Hz (bass swap) → deckGain → compressor`, plus an echo send `deckGain → delay (feedback ≈0.45) → compressor`, active only during Echo out. Filters are neutral when unused.

**Scheduling on the audio clock.** Gain, filter and delay changes are scheduled with `AudioParam` automation (`setValueAtTime`, `linearRampToValueAtTime`, `setTargetAtTime`) on `AudioContext.currentTime`, not with `setInterval`. Background tabs and locked phones throttle timers but not audio-clock automation. The 400 ms progress timer still detects when to start a transition.

**Trigger.** The transition starts when the outgoing deck reaches `plan.outStartAt − 2 bars`. With no analysis, it keeps today's trigger of `duration − 15 s`.

**Pre-roll and beat lock (Blend, Rise).**
1. Two bars before `outStartAt`, the incoming deck starts playing **silently** at `cueIn − 2 bars`, with `preservesPitch = true` and `playbackRate = plan.rate`.
2. During the silent pre-roll, the engine measures the phase error between the two decks' beat grids (`beatOffset`, `bpm`, `currentTime`) and corrects it by nudging `playbackRate` up to ±2% (proportional correction), so the decks are locked before the incoming song becomes audible. If it can't lock within ±30 ms, it falls back to Echo out.
3. Correction continues every progress tick for the length of the blend.

**Styles** (8 bars unless noted):
- **Blend:** equal-power volume curves over 8 bars. Incoming lowshelf at −24 dB until bar 4, then swap on the bar 4 downbeat (incoming bass in, outgoing bass out).
- **Rise:** outgoing highpass sweeps from 20 Hz to 1 kHz over 8 bars while the incoming song stays quiet. On the downbeat where the incoming drop lands, the outgoing song cuts out and the incoming song comes in at full level.
- **Echo out:** on the downbeat at `cueOut`, the outgoing song is sent into the delay (1-beat delay time) and its dry signal cuts. The incoming song starts at `cueIn` one bar later at full level, and the echo tail fades out over 2 bars.
- **Fade:** unchanged from today.

**Tempo return.** After the outgoing song stops, the incoming `playbackRate` eases to 1.0 over 4 bars.

**Station sync.** When a transition finishes, the client reports `startedAt = Date.now() − incomingAudio.currentTime × 1000`, so late joiners land on the incoming song's real position. Clients never seek into a song based on the mix, only on `startedAt`, as today.

**Failure handling.**
- If the incoming stream fails to load before the pre-roll, fall back to a Fade from the current position.
- If the outgoing song ends early, hard-advance, as today.
- Pausing during a transition cancels it and resets every filter, delay and rate to neutral.

### 4. UI

While a transition is running, the Now Playing area shows "Mixing into {next title}" with a small indicator. The artwork cross-dissolves over the second half of the transition. Nothing changes when no transition is running.

### 5. Analysis pipeline

**Script:** `scripts/analyze-mixes.mjs` (Node 20+, run from the repo)

1. `GET /tracks`; skip SoundCloud tracks whose `mix.version` is current.
2. `GET /sc-stream?id=` → MP3 URL. On failure (DRM), skip and log.
3. Download, then decode with ffmpeg to mono 44.1 kHz float PCM.
4. essentia.js `RhythmExtractor2013` → BPM and beat times. Fold the BPM into 100–180. Choose the downbeat phase (0–3) by maximum low-band onset energy, which gives `beatOffset`.
5. Compute RMS energy per bar (full band and below 150 Hz) and normalize to the track's 95th percentile. On the 8-bar grid:
   - first drop = the 8-bar boundary with the largest positive energy jump in the first 60% of the track;
   - outro start = the last 8-bar boundary after which energy stays below 60% of the median.
   - `cueIn = max(beatOffset, drop − 8 bars)`; `cueOut = min(outro start, duration − 8 bars)`, snapped to downbeats.
6. essentia.js `KeyExtractor` (EDMA profile, suited to electronic music) → key, scale and strength, converted to a Camelot code.
7. `PUT /admin/mix-analysis` with `{ adminKey, records }`.

**Server** (`supabase/functions/make-server-715f71b9/index.ts`):
- `PUT /admin/mix-analysis`: checks `ADMIN_KEY` as the existing admin-key endpoints do; validates each record's fields and ranges; merges into `jc_mix_analysis_v1`.
- `GET /tracks`: merges `mix` records in and adds `mixEnabled` (from `jc_mix_enabled_v1`, default `true`).
- `PUT /admin/mix-enabled`: uses `requireAdmin` (Supabase auth, as the admin panel does); sets `jc_mix_enabled_v1`.
- Deploying requires the Supabase CLI to be logged in to the project.

**Admin panel:** an "AutoMix" on/off switch in `AdminPanel.tsx` that calls `/admin/mix-enabled`.

**Automation:** `.github/workflows/analyze-mixes.yml` runs daily at 06:00 UTC and on manual dispatch, on `ubuntu-latest` (ffmpeg preinstalled) with Node 20, using repo secret `ADMIN_KEY`.

## Testing

- **Unit tests (Vitest, dev dependency):**
  - `planTransition`: style selection for each row of the table, half/double-time tempo matching, rate and start times, 4-bar Blend for clashing keys, and unknown keys treated as compatible.
  - Camelot conversion and compatibility: every key/scale maps to the right code; wheel neighbours including the 12→1 wrap.
  - Analysis on synthetic audio: generated tracks with known BPM (130/140/150) and an intro → drop → outro energy shape. The detected BPM must be within 0.5 and the cue points within 1 bar. A synthetic A-minor chord track must be detected as "8A".
- **Browser test (Playwright, faked station, all backend writes blocked):**
  - A Blend between two stub-analyzed tracks has a phase error under 30 ms between the decks' beat grids during the audible part.
  - `playbackRate` returns to 1.0 after the transition.
  - "Mixing into…" appears and then clears.
  - Pause mid-transition leaves every filter and rate neutral and all audio stopped.
  - A pair with a missing record falls back to Fade.
- **Listening check:** run the analysis on the real playlist and listen to at least 5 real transitions (at least one per style) before shipping each stage.

## Build order

Each stage ships on its own and is covered by the kill switch:

1. Analysis script, server endpoints, `mix` on `/tracks`, kill switch, and smart transition points (the Fade style using `cueOut`/`cueIn`).
2. Beat lock and tempo stretching → Blend (without bass swap).
3. Audio graph filters and delay → bass swap, Rise, Echo out.
4. "Mixing into…" UI and artwork dissolve.

## Risks

- **Beat detection on jersey club.** The genre's triplet kick patterns may confuse the downbeat choice. Mitigation: the synthetic tests plus the listening check; the analysis `version` allows re-running an improved method.
- **Safari/iOS time-stretch quality.** `preservesPitch` is supported but may sound worse at larger rate changes. Mitigation: the ±6% cap and the Echo-out fallback.
- **Clients drifting apart.** Each browser mixes on its own clock, as it does today, so small offsets between listeners remain. This is unchanged from current behavior.
