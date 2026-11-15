/* Web Audio synth: two detuned oscillators + sub through a filter and an echo, synthesised drums, and the BEATS tracks
   (Vick's own audio files, with the synthesised patterns as a fallback). */
import { $, flip } from './state.js';

export const P = { cutoff: .62, q: .22, dtime: .35, fb: .3, wet: .22, detune: .15, decay: .45, attack: .03, sub: .3, drums: .8, vol: .7, wave: 1 };
export const PNAMES = { cutoff: 'Filter', q: 'Resonance', wet: 'Echo mix', detune: 'Detune', decay: 'Decay', vol: 'Volume' };
const WAVES = ['triangle', 'square', 'sawtooth'];
let ac, master, filter, delay, fb, wet, an, noiseBuf, tdata;
export let muted = false;

export function ensureAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return }
  try { ac = new (window.AudioContext || window.webkitAudioContext)() } catch { return }
  master = ac.createGain(); filter = ac.createBiquadFilter(); filter.type = 'lowpass';
  delay = ac.createDelay(1.2); fb = ac.createGain(); wet = ac.createGain(); an = ac.createAnalyser(); an.fftSize = 1024; tdata = new Uint8Array(an.fftSize);
  filter.connect(master); filter.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
  master.connect(an); an.connect(ac.destination);
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  applyP();
}
export function applyP() {
  if (!ac) return; const t = ac.currentTime, to = (p, v, k = .02) => p.setTargetAtTime(v, t, k);
  to(filter.frequency, 180 * Math.pow(90, P.cutoff)); to(filter.Q, .5 + P.q * 16);
  to(delay.delayTime, .05 + P.dtime * .7, .05); to(fb.gain, P.fb * .85); to(wet.gain, P.wet); to(master.gain, muted ? 0 : P.vol * .8);
}
export function playNote(m, len = 1) {
  if (!ac || muted) return; const t = ac.currentTime, f = 440 * Math.pow(2, (m - 69) / 12), g = ac.createGain(), dec = .25 + P.decay * 2.2 * len;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.22, t + .005 + P.attack * .6); g.gain.exponentialRampToValueAtTime(.0008, t + dec); g.connect(filter);
  const osc = (type, fq, det, out) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = fq; o.detune.value = det; o.connect(out); o.start(t); o.stop(t + dec + .05) };
  osc(WAVES[P.wave], f, -P.detune * 30, g); osc(WAVES[P.wave], f, P.detune * 30, g);
  const sg = ac.createGain(); sg.gain.value = P.sub; sg.connect(g); osc('sine', f / 2, 0, sg);
}
/* Foley: small paper-and-plastic noises for the interface, made from filtered noise and clicks. Quiet, and wired straight to the
   speakers (not through the synth's chain), so they don't echo, don't follow the volume knob and don't make the notebook draw a waveform.
   They obey mute. Each kind is rate-limited so a fast pointer can't machine-gun it.
     marker: a felt-tip dragged round an edge · slide: card sliding on card · page: a page turning · tap: two cassette shells knocking */
const FOLEY_GAP = { marker: 380, slide: 90, page: 160, tap: 55 }, lastFoley = {};
export function foley(k, vol = 1) {
  if (!ac || muted || ac.state !== 'running') return; const now = performance.now(); if (now - (lastFoley[k] || 0) < FOLEY_GAP[k]) return; lastFoley[k] = now;
  const t = ac.currentTime, out = ac.createGain(); out.gain.value = .5 * vol; out.connect(ac.destination);
  const nz = (d, type, fq, q = 1, t0 = t) => { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = .8 + Math.random() * .4; const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = fq; f.Q.value = q; s.connect(f); s.start(t0, Math.random() * .5); s.stop(t0 + d); return f };
  const shape = (node, pts, t0 = t) => { const g = ac.createGain(); g.gain.setValueAtTime(.0001, t0); pts.forEach(([dt, v]) => g.gain.linearRampToValueAtTime(Math.max(.0001, v), t0 + dt)); node.connect(g); g.connect(out); return g };
  ({
    /* a squeaky felt tip: a narrow band of hiss that wavers as the pen catches the card, in two strokes (it goes round twice) */
    marker: () => { for (const [t0, d] of [[0, .34], [.3, .3]]) { const f = nz(d, 'bandpass', 2600 + Math.random() * 500, 3.5, t + t0); f.frequency.linearRampToValueAtTime(3400 + Math.random() * 600, t + t0 + d);
        shape(f, [[.03, .16], [d * .3, .07], [d * .45, .15], [d * .7, .06], [d * .85, .12], [d, 0]], t + t0) } },
    /* card on card: a short, dry, low shush */
    slide: () => { const d = .16 + Math.random() * .08, f = nz(d, 'bandpass', 620 + Math.random() * 380, .8); shape(f, [[.03, .2], [d * .6, .13], [d, 0]]); const h = nz(d, 'highpass', 4200); shape(h, [[.02, .03], [d, 0]]) },
    /* a page: the lift (a bright swish rising), then the flop as it lands */
    page: () => { const f = nz(.34, 'bandpass', 1500, .7); f.frequency.exponentialRampToValueAtTime(5200, t + .26); shape(f, [[.05, .2], [.2, .1], [.34, 0]]);
      const l = nz(.09, 'lowpass', 900, 1, t + .3); shape(l, [[.008, .28], [.09, 0]], t + .3) },
    /* plastic on plastic: two quick hollow clicks, the second lighter (one shell settling against the next) */
    tap: () => { for (const [t0, v] of [[0, 1], [.055 + Math.random() * .03, .5]]) { const f = nz(.03, 'bandpass', 2300 + Math.random() * 900, 6, t + t0); shape(f, [[.002, .5 * v], [.03, 0]], t + t0);
        const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(1500 + Math.random() * 500, t + t0); o.frequency.exponentialRampToValueAtTime(700, t + t0 + .04); o.start(t + t0); o.stop(t + t0 + .05); shape(o, [[.002, .16 * v], [.045, 0]], t + t0) } },
  })[k]?.();
}
/* Beep, the tour guide (organisms/tour.js), chirps before he speaks: two or three quick square-wave notes, a different little phrase
   for each thing he explains. Like the foley it goes straight to the speakers (no echo, no waveform on the notebook) and obeys mute. */
const CHIRPS = [[0, 7, 12], [0, 5], [7, 0, 7], [0, 12], [5, 9], [12, 7], [0, 4, 7], [9, 5, 12]];
export function beep(n = 0) {
  if (!ac || muted) return; const t = ac.currentTime + .02, out = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; out.gain.value = .07; lp.connect(out); out.connect(ac.destination);
  CHIRPS[n % CHIRPS.length].forEach((semi, i) => { const t0 = t + i * .085, o = ac.createOscillator(), g = ac.createGain(), f = 880 * Math.pow(2, semi / 12);
    o.type = 'square'; o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * 1.06, t0 + .06);
    g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(1, t0 + .008); g.gain.setValueAtTime(1, t0 + .05); g.gain.linearRampToValueAtTime(.0001, t0 + .075);
    o.connect(g); g.connect(lp); o.start(t0); o.stop(t0 + .09) });
}
export function drum(k) {
  if (!ac || muted) return; const t = ac.currentTime, out = ac.createGain(); out.gain.value = P.drums; out.connect(master);
  const env = (node, a, d, t0 = t) => { const g = ac.createGain(); g.gain.setValueAtTime(a, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + d); node.connect(g); g.connect(out); return g };
  const nz = (d, type, fq, t0 = t) => { const s = ac.createBufferSource(); s.buffer = noiseBuf; const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = fq; s.connect(f); s.start(t0); s.stop(t0 + d); return f };
  const osc = (type, f0, f1, d) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d); o.start(t); o.stop(t + d); return o };
  ({ kick: () => env(osc('sine', 150, 40, .4), 1, .4),
     snare: () => { env(nz(.2, 'bandpass', 1800), .7, .18); env(osc('triangle', 220, 160, .12), .5, .12) },
     hat: () => env(nz(.06, 'highpass', 7000), .4, .05),
     clap: () => [0, .012, .024].forEach(o => env(nz(.15, 'bandpass', 1200, t + o), .6, .12, t + o)),
     tom: () => env(osc('sine', 220, 90, .3), .8, .3),
     rim: () => env(osc('square', 800, 600, .03), .3, .04),
     shaker: () => env(nz(.12, 'highpass', 4500), .25, .11),
     crash: () => env(nz(1.2, 'highpass', 3500), .35, 1.1),
     blip: () => env(osc('square', 1200, 2400, .08), .2, .08),
     whoosh: () => { const f = nz(.6, 'bandpass', 600); f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3000, t + .5); env(f, .35, .55) } })[k]?.();
}
/* loudness of what's playing (0..1) plus the raw waveform, for the screens */
export function scope() {
  if (!an) return { level: 0, wave: null }; an.getByteTimeDomainData(tdata); let s = 0;
  for (let i = 0; i < tdata.length; i += 4) { const v = (tdata[i] - 128) / 128; s += v * v }
  return { level: Math.min(1, Math.sqrt(s / (tdata.length / 4)) * 4), wave: tdata };
}
export function toggleMute() {
  muted = !muted; if (muted) stopDemo(); const b = $('snd');
  b.setAttribute('aria-label', muted ? 'Sound off: unmute' : 'Sound on: mute'); b.setAttribute('aria-pressed', !muted); flip(b); ensureAudio(); applyP();
}

/* ── BEATS: each click plays the next of Vick's tracks (assets/beats/audio, 128k-ish VBR MP3s made from his WAVs; originals in
   Google Drive). They play through the master gain (volume, mute) into the analyser (screen waveform, speaker, lights) and loop
   until the next click or STOP. bg = the party video that goes with each (assets/beats/bg, see organisms/party.js).
   bpm = estimated from the audio, used for the light pulse. If a file can't play, that slot's synthesised pattern runs. ── */
export const BEATS = [
  { n: 'Chill', src: 'assets/beats/audio/chill.mp3', bpm: 81, bg: 'retro-galaxy' },
  { n: 'Cute little microhouse', src: 'assets/beats/audio/cute-little-microhouse.mp3', bpm: 129, bg: 'party-strips' },
  { n: 'Interlaken', src: 'assets/beats/audio/interlaken.mp3', bpm: 152, bg: 'square-tunnel' },
  { n: 'Little music studio', src: 'assets/beats/audio/little-music-studio.mp3', bpm: 76, bg: 'mosaic' },
  { n: 'Matterhorn', src: 'assets/beats/audio/matterhorn.mp3', bpm: 118, bg: 'retrograde' },
  { n: 'One more month', src: 'assets/beats/audio/one-more-month.mp3', bpm: 152, bg: 'party-strips' }];
/* the synthesised fallback patterns */
export const TRACKS = [
  { n: 'NEON DRIVE', bpm: 118, wave: 2, base: 45, prog: [0, 8, 3, 10], lead: '0.2.4.2.0.4.7.4.', bass: 'x..x..x.x..x..x.', k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.' },
  { n: 'SUNDAY LO-FI', bpm: 82, wave: 0, base: 48, prog: [0, 9, 5, 7], lead: '4..2..0...2.4...', bass: 'x.....x...x.....', k: 'x......x..x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  { n: 'ARCADE RUN', bpm: 140, wave: 1, base: 52, prog: [0, 0, 5, 7], lead: '02470247.7420742', bass: 'x.x.x.x.x.x.x.x.', k: 'x...x...x...x...', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' },
  { n: 'DEEP HOUSE', bpm: 124, wave: 2, base: 41, prog: [0, 0, 3, 5], lead: '....4...4.....6.', bass: '..x...x...x..x..', k: 'x...x...x...x...', s: '....x.......x...', c: '....x.......x...', h: '..x...x...x...x.' },
  { n: 'JIU-JITSU BREAKS', bpm: 100, wave: 1, base: 43, prog: [0, 3, 5, 3], lead: '0..0..3.5..3.0..', bass: 'x..x...x..x.x...', k: 'x.....x...x.....', s: '....x.......x..x', h: 'x.xxx.x.x.xxx.x.' }];
const SCALE = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15];
export let demo = null, track = -1; // demo: { el } while a file plays, { iv } while a fallback pattern plays, null when quiet
let step = 0, el = null;
export function stopDemo() { if (!demo) return; demo.el?.pause(); if (demo.iv) clearInterval(demo.iv); demo = null }
export function toggleDemo() {
  ensureAudio(); stopDemo(); track = (track + 1) % BEATS.length; const B = BEATS[track];
  if (!el) { el = new Audio(); el.loop = true; el.preload = 'auto'; ac.createMediaElementSource(el).connect(master) } // wired into the master once
  const d = demo = { el }, fallback = () => { if (demo === d) { el.pause(); demo = { iv: synthLoop(TRACKS[track % TRACKS.length]) } } };
  el.onerror = fallback; el.src = B.src; el.currentTime = 0; el.play().catch(fallback);
}
function synthLoop(T) {
  step = 0; P.wave = T.wave;
  return setInterval(() => {
    const i = step % 16, root = T.base + T.prog[Math.floor(step / 16) % 4];
    if (T.k[i] === 'x') drum('kick'); if (T.s[i] === 'x') drum('snare'); if (T.h[i] === 'x') drum('hat'); if (T.c?.[i] === 'x') drum('clap');
    if (T.bass[i] === 'x') playNote(root - 12, .22); const d = T.lead[i]; if (d !== '.') playNote(root + 12 + SCALE[+d], .3);
    step++;
  }, 60000 / T.bpm / 4);
}
$('snd').onclick = toggleMute;
