// EQ Mix browser test. Runs against the dev server (npm run dev) with a faked station
// clock; every write to the live backend is blocked, so runs never touch real data.
//
//   node tests/e2e/eq-mix.mjs [--url http://localhost:5173/]
//
// Scenarios:
//   1. Normal → normal track: Rise sweep, bass swap, clean hand-off, Pause afterwards
//   2. Pause in the middle of a mix: everything stops and all FX reset to neutral
//   3. Normal → DRM-only track (widget fallback): no errors, Pause still works
//   4. Mobile Safari autoplay rules: one tap unlocks both decks, the new track is audible
//   5. Mobile Safari, second deck stays blocked: the song finishes and the next one plays
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';

const { values: args } = parseArgs({ options: { url: { type: 'string', default: 'http://localhost:5173/' } } });

const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

/**
 * Mobile Safari's rule, simulated in Chrome: an <audio> element can play only after play() was
 * called on it inside a real tap. `neverUnlock` = element indexes that refuse to unlock.
 */
const iosRules = neverUnlock => {
  const orig = HTMLMediaElement.prototype.play;
  const unlocked = new WeakSet();
  let inTap = false;
  for (const ev of ['click', 'touchend', 'keydown']) window.addEventListener(ev, e => { if (e.isTrusted) { inTap = true; setTimeout(() => { inTap = false; }, 0); } }, true);
  HTMLMediaElement.prototype.play = function () {
    if (inTap && !neverUnlock.includes(window.__audios.indexOf(this))) unlocked.add(this);
    return unlocked.has(this) ? orig.call(this) : Promise.reject(new DOMException('simulated iOS block', 'NotAllowedError'));
  };
};

/** What each deck is sending to the speakers (level after its gain), loudest of a few reads */
const output = async page => {
  const peak = [0, 0];
  for (let i = 0; i < 6; i++) {
    const lv = await page.evaluate(() => ['A', 'B'].map(k => {
      const an = window.__jcMix.fx[k]?.an;
      if (!an) return 0;
      const buf = new Float32Array(an.fftSize);
      an.getFloatTimeDomainData(buf);
      return Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length) * (window.__jcMix.gain(k) ?? 0);
    }));
    lv.forEach((v, k) => { peak[k] = Math.max(peak[k], v); });
    await page.waitForTimeout(250);
  }
  return peak;
};

async function openStation(stationIdx, { ios = false, neverUnlock = [] } = {}) {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', m => { const t = m.text(); if (/\[DJ\]|\[SC Native\]|\[Radio\]/.test(t)) logs.push({ t: Date.now(), text: t.split('\n')[0] }); });
  page.on('pageerror', e => logs.push({ t: Date.now(), text: `PAGEERROR ${e.message}` }));

  let tracks = [];
  page.on('response', async r => { if (/\/tracks$/.test(r.url()) && r.request().method() === 'GET') { try { tracks = (await r.json()).tracks; } catch { } } });
  await page.route(/make-server-715f71b9\/(radio\/(advance|heartbeat|report-duration)|plays\/track|visits\/log|leaderboard\/sync|vault\/)/, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route(/make-server-715f71b9\/radio\/now-playing/, async r => {
    for (let i = 0; i < 50 && !tracks.length; i++) await new Promise(res => setTimeout(res, 100));
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ state: { videoId: tracks[stationIdx].id.videoId, startedAt: Date.now() - 40_000, durationSec: 0 } }) });
  });
  await page.addInitScript(() => {
    window.__audios = [];
    const Orig = window.Audio;
    window.Audio = function (...a) { const el = new Orig(...a); window.__audios.push(el); return el; };
    window.Audio.prototype = Orig.prototype;
  });
  if (ios) {
    await page.addInitScript(() => localStorage.setItem('jcr-terms-seen', 'true')); // no welcome drawer over the button
    await page.addInitScript(iosRules, neverUnlock);
  }

  await page.goto(args.url, { waitUntil: 'domcontentloaded' });
  if (ios) {
    // Autoplay is refused under these rules: the visitor taps Tune In
    await page.getByRole('button', { name: 'Tune In' }).first().click({ timeout: 30_000 });
  }
  await page.waitForFunction(() => window.__audios.some(a => !a.paused && a.duration > 0), null, { timeout: 45_000 });
  await page.waitForTimeout(4000);
  console.log(`station: "${tracks[stationIdx].snippet.title}" -> next: "${tracks[stationIdx + 1].snippet.title}"`);
  return { browser, page, logs };
}

/** Jump the live deck to 20s before its end and wait for the transition to start. Returns its start time. */
async function startTransition(page, logs) {
  await page.evaluate(() => { const a = window.__audios.find(x => !x.paused); a.currentTime = a.duration - 20; });
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(250);
    const l = logs.find(x => /Starting .*crossfade/.test(x.text));
    if (l) return l.t;
  }
  return null;
}

const fx = page => page.evaluate(() => {
  const m = window.__jcMix;
  const d = k => m.fx[k] && { hp: m.fx[k].hp.frequency.value, ls: m.fx[k].ls.gain.value, mid: m.fx[k].mid.gain.value, echo: m.fx[k].echo.gain.value };
  return {
    A: d('A'), B: d('B'), scheduled: { ...m.scheduled },
    playing: window.__audios.map(a => !a.paused),
    button: document.querySelector('[aria-label="Pause"],[aria-label="Play"]')?.getAttribute('aria-label'),
  };
});
const waitUntil = async (t0, sec) => { const ms = t0 + sec * 1000 - Date.now(); if (ms > 0) await new Promise(r => setTimeout(r, ms)); };
const neutral = d => d && Math.abs(d.hp - 20) < 1 && Math.abs(d.ls) < 0.5 && Math.abs(d.mid) < 0.5 && d.echo < 0.01;

// ── 1. Normal → normal ──────────────────────────────────────────────────────
{
  console.log('\n=== 1. EQ Mix between two normal tracks');
  const { browser, page, logs } = await openStation(0);
  const t0 = await startTransition(page, logs);
  check('transition started', !!t0);
  check('EQ Mix was scheduled', logs.some(l => /EQ Mix scheduled/.test(l.text)));

  await waitUntil(t0, 2.5);
  const rise = await fx(page);
  check('Rise: outgoing highpass sweeping up during lead-in', rise.A.hp > 25 && rise.A.hp < 150, `hp ${rise.A.hp.toFixed(0)} Hz`);

  await waitUntil(t0, 7.5);
  const pre = await fx(page);
  check('both tracks playing in the overlap', pre.playing.filter(Boolean).length === 2);
  check('before swap: incoming bass cut, outgoing bass full', pre.B.ls < -20 && Math.abs(pre.A.ls) < 0.5, `in ${pre.B.ls.toFixed(1)} dB, out ${pre.A.ls.toFixed(1)} dB`);
  check('bring-in: incoming enters highs-only (highpass open-down)', pre.B.hp > 60 && pre.B.hp < 350, `incoming hp ${pre.B.hp.toFixed(0)} Hz`);
  check('outgoing mids dipped to make room', pre.A.mid < -4, `mid ${pre.A.mid.toFixed(1)} dB`);

  // Volume change mid-mix (mute, then unmute) re-schedules the curves
  const muteBtn = () => page.evaluate(() => document.querySelector('input[type="range"][max="100"]').previousElementSibling.click());
  await waitUntil(t0, 8.5);
  await muteBtn();
  await page.waitForTimeout(300);
  const muted = await page.evaluate(() => [window.__jcMix.gain('A'), window.__jcMix.gain('B')]);
  check('mute mid-mix silences both decks', muted.every(g => g < 0.001), muted.map(g => g.toFixed(3)).join(', '));
  await muteBtn();
  await page.waitForTimeout(300);
  const unmuted = await page.evaluate(() => [window.__jcMix.gain('A'), window.__jcMix.gain('B')]);
  check('unmute mid-mix restores both decks on their curves', unmuted.every(g => g > 0.05), unmuted.map(g => g.toFixed(3)).join(', '));

  await waitUntil(t0, 12.5);
  const post = await fx(page);
  check('after swap: incoming bass back, outgoing bass cut', Math.abs(post.B.ls) < 0.5 && post.A.ls < -20, `in ${post.B.ls.toFixed(1)} dB, out ${post.A.ls.toFixed(1)} dB`);

  await waitUntil(t0, 14.4);
  const tail = await fx(page);
  check('echo-out builds at the end, outgoing filtering out', tail.A.echo > 0.3 && tail.A.hp > 300, `echo ${tail.A.echo.toFixed(2)}, hp ${tail.A.hp.toFixed(0)} Hz`);

  await waitUntil(t0, 17);
  const done = await fx(page);
  check('hand-off complete: only the new track plays', done.playing[1] && !done.playing[0]);
  check('new track has neutral EQ and no automation', neutral(done.B) && !done.scheduled.B, JSON.stringify(done.B));

  await page.evaluate(() => document.querySelector('[aria-label="Pause"],[aria-label="Play"]').click());
  await page.waitForTimeout(1500);
  const paused = await fx(page);
  check('Pause works after the mix', paused.button === 'Play' && paused.playing.every(p => !p));
  check('no page errors', !logs.some(l => l.text.startsWith('PAGEERROR')), logs.filter(l => l.text.startsWith('PAGEERROR')).map(l => l.text).join('; '));
  await browser.close();
}

// ── 2. Pause mid-mix ────────────────────────────────────────────────────────
{
  console.log('\n=== 2. Pause in the middle of a mix');
  const { browser, page, logs } = await openStation(0);
  const t0 = await startTransition(page, logs);
  await waitUntil(t0, 7.5);
  await page.evaluate(() => document.querySelector('[aria-label="Pause"],[aria-label="Play"]').click());
  await page.waitForTimeout(1500);
  const s = await fx(page);
  check('everything stopped', s.playing.every(p => !p) && s.button === 'Play');
  check('both decks back to neutral EQ, no automation', neutral(s.A) && neutral(s.B) && !s.scheduled.A && !s.scheduled.B, JSON.stringify({ A: s.A, B: s.B }));

  // Resuming ~7s before the end: the original track plays again and, being inside its
  // last 15s, a fresh mix starts (instead of the song ending abruptly)
  const startsBefore = logs.filter(l => /Starting .*crossfade/.test(l.text)).length;
  await page.evaluate(() => document.querySelector('[aria-label="Pause"],[aria-label="Play"]').click());
  await page.waitForTimeout(2500);
  const r = await fx(page);
  check('Play resumes the original track', r.playing[0] && r.button === 'Pause');
  check('a fresh mix starts because the song is near its end', logs.filter(l => /Starting .*crossfade/.test(l.text)).length === startsBefore + 1);
  await browser.close();
}

// ── 3. Next track is SoundCloud-only (label-restricted) ─────────────────────
{
  console.log('\n=== 3. Next track can only be played on SoundCloud');
  const { browser, page, logs } = await openStation(9); // "I Am Newark" -> "In Ya City" (SoundCloud-only)
  const t0 = await startTransition(page, logs);
  check('transition started', !!t0);
  await waitUntil(t0, 20);
  check('SoundCloud-only track is skipped', logs.some(l => /can only be played on SoundCloud/.test(l.text)));
  check('mix restarts into the following track', logs.filter(l => /Starting .*crossfade/.test(l.text)).length >= 2);
  const s1 = await fx(page);
  check('music keeps playing (no stall)', s1.playing.some(Boolean), JSON.stringify(s1.playing));
  await page.evaluate(() => document.querySelector('[aria-label="Pause"],[aria-label="Play"]').click());
  await page.waitForTimeout(1500);
  const s = await fx(page);
  check('Pause works', s.button === 'Play' && s.playing.every(p => !p));
  check('no page errors', !logs.some(l => l.text.startsWith('PAGEERROR')), logs.filter(l => l.text.startsWith('PAGEERROR')).map(l => l.text).join('; '));
  await browser.close();
}

// ── 4. Mobile Safari: the mix must reach the speakers on the second deck ────
{
  console.log('\n=== 4. Mobile Safari rules: one tap unlocks both decks');
  const { browser, page, logs } = await openStation(0, { ios: true });
  const t0 = await startTransition(page, logs);
  check('transition started', !!t0);
  await waitUntil(t0, 18);
  const [a, b] = await output(page);
  check('new track is audible after the hand-off', b > 0.005 && a === 0, `out A ${a.toFixed(3)}, B ${b.toFixed(3)}`);
  check('no blocked deck', !logs.some(l => /blocked by the browser/.test(l.text)));
  await browser.close();
}

// ── 5. Mobile Safari, second deck never unlocks: no silence ─────────────────
{
  console.log('\n=== 5. Second deck blocked: current song finishes, next one plays');
  const { browser, page, logs } = await openStation(0, { ios: true, neverUnlock: [1] });
  const t0 = await startTransition(page, logs);
  check('transition started', !!t0);
  await waitUntil(t0, 8);
  check('mix is called off instead of going silent', logs.some(l => /finishing the current song instead of mixing/.test(l.text)));
  await waitUntil(t0, 26);
  const [a, b] = await output(page);
  check('next song plays on the working deck', a > 0.005 && b === 0, `out A ${a.toFixed(3)}, B ${b.toFixed(3)}`);
  check('no page errors', !logs.some(l => l.text.startsWith('PAGEERROR')), logs.filter(l => l.text.startsWith('PAGEERROR')).map(l => l.text).join('; '));
  await browser.close();
}

console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`);
process.exit(results.every(Boolean) ? 0 : 1);
