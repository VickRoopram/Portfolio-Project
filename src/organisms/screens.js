/* The two screens, in a dot-matrix pixel font. The remote's reads CONTACT. The synth's reads MY PROJECTS, and when sound plays
   (keys, pads, beats) the words ease smaller up to the top to make room for a big live waveform underneath; when it goes quiet
   they ease back. The waveform keeps changing style, cross-fading every few seconds: a wavy line → pixel blocks on the dot grid →
   broken, glitchy dashes → dots. Every 25–60 s (a new random gap each time) the Vickhal Roopram logo takes over the screen in LED
   dots on a finer pitch: it dissolves in dot by dot, holds 8 s, dissolves out. While it shows, V.logo is up and a click on the screen
   opens the About summary (synth.js). drawScreens also hands the music level to the speaker. */
import { scope } from '../core/audio.js';
import { V, reduceMotion } from '../core/state.js';
import { party, partyColours } from './party.js';
import { pixelScreen, drawMatrix, drawPixelText, dotsWide } from '../atoms/pixelfont.js';
import { scr } from './synth.js';
import { rs } from './remote.js';

export const SCREEN_COL = '#ff7a3d'; // orange poster paint
const W = 800, H = 380, TITLE = 'My Projects', PAD = 46, BIG = Math.floor((W - PAD * 2) / dotsWide(TITLE)), SMALL = 3.6, GRID = 10;
pixelScreen(rs.x, 300, 200, 'Contact', SCREEN_COL, 26); rs.t.needsUpdate = true;

const STYLES = ['line', 'pixel', 'broken', 'dots'], HOLD = 3.4, FADE = .6; // seconds per style, cross-fade
let last = 0, act = 0, heard = -1e9, styleAt = 0, peak = .2, wasActive = false, cache = '';
const mix = (a, b, k) => a + (b - a) * k, ease = k => k * k * (3 - 2 * k);

/* sample the waveform into n points (-1..1), normalised so quiet sounds still fill the screen */
function samples(wave, n) {
  const out = new Float32Array(n); let m = 0;
  for (let i = 0; i < n; i++) { const v = wave ? (wave[Math.floor(i * wave.length / n)] - 128) / 128 : 0; out[i] = v; m = Math.max(m, Math.abs(v)) }
  peak = Math.max(m, peak * .96, .08); for (let i = 0; i < n; i++) out[i] /= peak; return out;
}
function drawWave(x, style, a, top, h, t, lvl) {
  if (a <= .01) return; const cy = top + h / 2, amp = h * .46; x.save(); x.globalAlpha = a; x.strokeStyle = x.fillStyle = SCREEN_COL; x.shadowColor = SCREEN_COL; x.shadowBlur = 14; x.lineCap = 'round';
  if (style === 'line') { const s = samples(cur, 160); x.lineWidth = 4 + lvl * 4; x.beginPath();
    s.forEach((v, i) => { const px = 30 + i * (W - 60) / 159, py = cy + v * amp; i ? x.lineTo(px, py) : x.moveTo(px, py) }); x.stroke() }
  else if (style === 'pixel') { const cols = Math.floor((W - 60) / GRID), s = samples(cur, cols), r = GRID * .38; // LED bars on the dot grid, mirrored
    s.forEach((v, i) => { const n = Math.round(Math.abs(v) * amp / GRID), px = 30 + i * GRID + GRID / 2;
      for (let k = -n; k <= n; k++) { x.globalAlpha = a * (1 - Math.abs(k) / (n + 2) * .6); x.beginPath(); x.arc(px, cy + k * GRID, r, 0, 7); x.fill() } }) }
  else if (style === 'broken') { const s = samples(cur, 96); x.lineWidth = 5; x.setLineDash([22, 12]); x.lineDashOffset = -t * 90;
    for (let seg = 0; seg < 8; seg++) { const j = Math.sin(seg * 12.9 + Math.floor(t * 6) * 3.7) * 10 * lvl; x.beginPath(); // glitch: each slice jumps a little on the beat
      for (let i = seg * 12; i <= Math.min(95, seg * 12 + 12); i++) { const px = 30 + i * (W - 60) / 95, py = cy + s[i] * amp + j; i === seg * 12 ? x.moveTo(px, py) : x.lineTo(px, py) } x.stroke() } }
  else { const s = samples(cur, 90); s.forEach((v, i) => { const px = 30 + i * (W - 60) / 89, r = 3 + Math.abs(v) * 7; x.beginPath(); x.arc(px, cy + v * amp, r, 0, 7); x.fill();
      x.globalAlpha = a * .35; x.beginPath(); x.arc(px, cy - v * amp * .5, r * .55, 0, 7); x.fill(); x.globalAlpha = a }) }
  x.restore();
}
/* ── logo: the header logo SVG rasterised into a dot mask (5 px pitch), each dot with a random reveal order ── */
const LP = 5, LOGO = { dots: [], ready: false }, GAP = () => 25 + Math.random() * 35, L_IN = .9, L_HOLD = 8, L_OUT = .9;
let logoAt = GAP(), logoK = 0;
(() => { const img = new Image(); img.onload = () => {
  const cols = Math.floor((W - 90) / LP), rows = Math.round(cols * img.height / img.width), c = Object.assign(document.createElement('canvas'), { width: cols, height: rows }), g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, cols, rows); const d = g.getImageData(0, 0, cols, rows).data, ox = (W - cols * LP) / 2, oy = (H - rows * LP) / 2;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (d[(y * cols + x) * 4 + 3] > 110) LOGO.dots.push([ox + x * LP + LP / 2, oy + y * LP + LP / 2, Math.random()]);
  LOGO.ready = true }; img.src = 'assets/ui/logo-on-dark.svg' })();
function logoLevel(time) { // 0..1 through in → hold → out; schedules the next appearance after each one
  if (!LOGO.ready) return 0; const e = time - logoAt; if (e < 0) return 0;
  if (e > L_IN + L_HOLD + L_OUT) { logoAt = time + GAP(); return 0 }
  return reduceMotion ? 1 : e < L_IN ? e / L_IN : e < L_IN + L_HOLD ? 1 : 1 - (e - L_IN - L_HOLD) / L_OUT;
}
function drawLogo(x, k, time) {
  x.save(); x.fillStyle = '#fff3e6'; x.shadowColor = SCREEN_COL; x.shadowBlur = 7; const r = LP * .42, tw = Math.sin(time * 3) * .5 + .5;
  for (const [px, py, o] of LOGO.dots) { if (o > k) continue; x.globalAlpha = .82 + .18 * ((o * 7 + tw) % 1); x.beginPath(); x.arc(px, py, r, 0, 7); x.fill() }
  x.restore();
}
let cur = null;
/* returns the music level (0..1) so the speaker can pulse with it */
export function drawScreens(time) {
  const { level, wave } = scope(), dt = Math.min(.1, Math.max(0, time - last)); last = time; cur = wave;
  if (level > .02) heard = time; const active = time - heard < 1.4; // stays up a moment after the sound stops
  act += ((active ? 1 : 0) - act) * Math.min(1, dt * (active ? 4 : 1.6));
  if (active && !wasActive) styleAt = time; wasActive = active;
  logoK = logoLevel(time); V.logo = logoK;
  const key = act < .002 && party() < .01 && logoK === 0 ? 'idle' : null; if (key && cache === key) return level; cache = key || ''; // idle: nothing to redraw
  const x = scr.x, k = ease(act), cell = mix(BIG, SMALL, k), ty = mix(H / 2, 26 + 3.5 * SMALL, k);
  x.fillStyle = '#2b1d15'; x.fillRect(0, 0, W, H); drawMatrix(x, W, H, k < .5 ? BIG : GRID);
  const pp = party(); if (pp > .01) { const cols = partyColours(); // beats: the unlit matrix twinkles in colours sampled from the party video
    for (let gy = 0; gy < H; gy += GRID) for (let gx = 0; gx < W; gx += GRID) { const n = Math.sin(gx * 12.99 + gy * 78.23 + Math.floor(time * 8) * 4.1) * 43758.5 % 1;
      if (n > .82) { x.globalAlpha = pp * (n - .82) * 2.2; x.fillStyle = cols[Math.floor(n * 97) % cols.length]; x.beginPath(); x.arc(gx + GRID / 2, gy + GRID / 2, GRID * .34, 0, 7); x.fill() } }
    x.globalAlpha = 1 }
  x.globalAlpha = 1 - logoK; drawPixelText(x, TITLE, W / 2, ty, cell, SCREEN_COL); x.globalAlpha = 1; // the logo takes the screen while it's up
  if (k > .01) { // the waveform grows in under the shrinking title; styles take turns
    const e = time - styleAt, idx = Math.floor(e / HOLD), f = Math.min(1, (e - idx * HOLD) / FADE), top = mix(H, 64, k), h = (H - 24 - 64) * k;
    const kw = k * (1 - logoK); drawWave(x, STYLES[idx % 4], kw * f, top, h, time, level); if (idx > 0 && f < 1) drawWave(x, STYLES[(idx - 1) % 4], kw * (1 - f), top, h, time, level);
  }
  if (logoK > 0) drawLogo(x, logoK, time);
  scr.t.needsUpdate = true; return level;
}
drawScreens(0);
