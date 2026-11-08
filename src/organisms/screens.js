/* The two screens. The synth's shows what you're pointing at (or the track playing) over a live oscilloscope; the remote's shows volume and status. */
import { S, pad } from '../core/state.js';
import { CH, MODES } from '../core/data.js';
import { P, muted, demo, track, TRACKS, scope } from '../core/audio.js';
import { scr } from './synth.js';
import { rs } from './remote.js';

function wrap(x, text, max) { const L = []; let l = ''; for (const s of text.split(' ')) { const t = l ? l + ' ' + s : s; if (x.measureText(t).width > max && l) { L.push(l); l = s } else l = t } L.push(l); return L }
const col = ch => CH[ch]?.col || '#ff4a50';
const count = (ch, i) => `${pad(i + 1)}/${pad(CH[ch].items.length)}`;
function screenText() {
  const o = S.hover?.userData;
  if (o?.item) { const c = CH[o.ch];
    return S.mode === o.ch ? { h: c.name, r: count(o.ch, o.i), t: c.items[o.i].t.toUpperCase(), col: col(o.ch) }
      : { h: c.name, r: MODES[o.ch].n.toUpperCase(), t: `${MODES[o.ch].part.toUpperCase()} · CLICK TO ZOOM IN`, col: col(o.ch) } }
  if (demo && !o) return { h: 'NOW PLAYING', r: `TRACK ${track + 1}/5`, t: TRACKS[track].n, col: '#ff5d1a' };
  if (o?.live) return { h: 'SOUND', r: 'DRAG TO CHANGE', t: o.live().toUpperCase(), col: '#d8d2c6' };
  if (o?.tip) return { h: 'VICKHAL ROOPRAM', r: '', t: o.tip.toUpperCase(), col: '#9a9ca3' };
  if (S.card) return { h: CH[S.card.ch].name, r: count(S.card.ch, S.card.i), t: CH[S.card.ch].items[S.card.i].t.toUpperCase(), col: col(S.card.ch) };
  if (S.mode) return { h: CH[S.mode].name, r: MODES[S.mode].n.toUpperCase(), t: 'HOVER A CONTROL · CLICK TO OPEN', col: col(S.mode) };
  return { h: 'VICKHAL ROOPRAM', r: '', t: 'UX & MOTION DESIGNER. PICK A MODE BELOW.', col: '#ff4a50' };
}
let lastRemote = '';
/* returns the music level (0..1) so the speaker can pulse with it */
export function drawScreens(time) {
  const { level, wave } = scope(), x = scr.x, W = 800, T = screenText();
  x.fillStyle = '#0c0c0e'; x.fillRect(0, 0, W, 380); x.textBaseline = 'top';
  x.font = '26px Bungee, Impact, sans-serif'; x.fillStyle = T.col; x.textAlign = 'left'; x.fillText(T.h, 30, 26);
  x.font = '600 24px "IBM Plex Mono", monospace'; x.fillStyle = '#8a8c92'; x.textAlign = 'right'; x.fillText(T.r, W - 30, 28); x.textAlign = 'left';
  x.font = '700 44px "Noto Sans", sans-serif'; x.fillStyle = '#f4f4f4'; wrap(x, T.t, W - 60).slice(0, 3).forEach((l, j) => x.fillText(l, 30, 78 + j * 52));
  x.strokeStyle = T.col; x.lineWidth = 3; x.beginPath();
  for (let i = 0; i <= 200; i++) { const px = 30 + i * (W - 60) / 200, v = wave ? (wave[Math.floor(i * wave.length / 201)] - 128) / 128 * 55 : Math.sin(i * .12 + time * 2) * 5; i ? x.lineTo(px, 320 + v) : x.moveTo(px, 320 + v) }
  x.stroke(); scr.t.needsUpdate = true;
  const key = [muted, P.vol, demo ? track + 1 : 0].join();
  if (key !== lastRemote) { lastRemote = key; const r = rs.x; r.fillStyle = '#0c0c0e'; r.fillRect(0, 0, 300, 200); r.textBaseline = 'top';
    r.fillStyle = '#ff5d1a'; r.font = '34px Bungee, Impact, sans-serif'; r.fillText('CV', 22, 22);
    r.font = '600 20px "IBM Plex Mono", monospace'; r.fillStyle = '#8a8c92'; r.fillText(muted ? 'MUTED' : `VOL ${Math.round(P.vol * 100)}%`, 22, 84);
    r.fillStyle = demo ? '#ff5d1a' : '#6b6d73'; r.fillText(demo ? `● TRACK ${track + 1}/5` : 'CONTACT · SOCIALS', 22, 124); rs.t.needsUpdate = true }
  return level;
}
