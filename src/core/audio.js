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
