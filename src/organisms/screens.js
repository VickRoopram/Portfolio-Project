/* The two "screens" are paper, written on by hand.
   The remote's is a taped note: CONTACT. The synth's is a little ring-bound notebook lying open:
   the page you're on is on the right, and the page before it has been turned over onto the left, where you can still read it.
   Pages: MY PROJECTS when nothing is happening; a project's name while its card is open, or while you point at its key in its mode;
   the sound, drawn on as you play (a pencil travels across the page tracing the waveform, in marker, pencil, stitches or dabs of paint,
   and at the edge the page turns and it starts a new one); and every 25–60 s the Vickhal Roopram logo, for 8 s (V.logo is up while it
   shows, and a click on the notebook opens the About summary: synth.js).
   Every change of page is a page turn round the rings: the right-hand page lifts, swings over the spine and lands on the left.
   drawScreens also hands the music level to the speaker. */
import { scope } from '../core/audio.js';
import { S, V, reduceMotion } from '../core/state.js';
import { CH } from '../core/data.js';
import { party, partyColours } from './party.js';
import { scr } from './synth.js';
import { rs } from './remote.js';
import { INK } from '../atoms/craft.js';

export const SCREEN_COL = '#d2451e'; // red marker
const W = 800, H = 476, PW = 368, PH = 432, GAP_X = 16, LX = (W - GAP_X) / 2 - PW, RX = (W + GAP_X) / 2, PY = (H - PH) / 2, TITLE = 'My Projects';
const TURN = .6, SWEEP = 2.6;      // seconds: one page turn · the pen crossing the page once
const hand = px => `400 ${px}px "Patrick Hand", "Comic Sans MS", cursive`, cut = (px, w = 900) => `${w} ${px}px "Londrina Solid", "Arial Narrow", sans-serif`;
const off = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return { c, x: c.getContext('2d') } };
const pg = off(PW, PH), from = off(PW, PH), prev = off(PW, PH); // the page you're on · the page that's turning · the page before, lying on the left
let dirty = true;
const paper = new Image(); paper.onload = () => { dirty = true; note(); if (!turned) pageFirst(prev.x) }; paper.src = 'assets/tex/paper.jpg';
const logo = new Image(); let logoInk = null; // the header logo, re-inked for paper
logo.onload = () => { const w = 560, h = Math.round(w * logo.height / logo.width), o = off(w, h); o.x.drawImage(logo, 0, 0, w, h); o.x.globalCompositeOperation = 'source-in'; o.x.fillStyle = INK; o.x.fillRect(0, 0, w, h); logoInk = o.c }; logo.src = 'assets/ui/logo-on-dark.svg';

/* a blank sheet: the paper photo, feint blue rules and a red margin */
function sheet(x, w, h, rule = 40, margin = 34) {
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.fillStyle = '#f7eedb'; x.fillRect(0, 0, w, h);
  if (paper.complete && paper.naturalWidth) { x.globalAlpha = .55; x.drawImage(paper, 0, 0, 1024 * Math.min(1, w / h), 1024 * Math.min(1, h / w), 0, 0, w, h); x.globalAlpha = 1 }
  x.strokeStyle = 'rgba(64,118,170,.3)'; x.lineWidth = 2; for (let y = rule * 1.6; y < h - 8; y += rule) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y + 1.5); x.stroke() }
  x.strokeStyle = 'rgba(210,69,30,.45)'; x.beginPath(); x.moveTo(margin, 0); x.lineTo(margin - 2, h); x.stroke();
}
/* a line that wobbles like one drawn freehand (the same wobble every time it's redrawn, so it doesn't crawl) */
function wavy(x, x0, y0, x1, y1, amp = 3, n = 14, ph = 0) { x.beginPath(); for (let i = 0; i <= n; i++) { const k = i / n; x.lineTo(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k + Math.sin(k * 9 + ph) * amp + Math.sin(k * 23 + ph * 2) * amp * .4) } x.stroke() }
function wrap(x, text, maxW) { const out = []; let line = ''; for (const w of String(text).split(/\s+/)) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { out.push(line); line = w } else line = t } if (line) out.push(line); return out }
/* the biggest lettering (from px down) at which every line fits maxW */
function fit(x, lines, px, maxW, w = 900) { for (; px > 20; px -= 4) { x.font = cut(px, w); if (lines.every(l => x.measureText(l).width <= maxW)) break } return px }

/* ── the pages ── */
function pageFirst(x) { // what's on the left before any page has been turned
  sheet(x, PW, PH); x.fillStyle = INK; x.textAlign = 'center'; x.textBaseline = 'middle'; x.save(); x.translate(PW / 2 + 10, PH / 2 - 20); x.rotate(.04);
  const px = fit(x, ['I AM', 'CREATIVE.'], 96, PW - 80); x.fillText('I AM', 0, -px * .5); x.fillText('CREATIVE.', 0, px * .5);
  x.strokeStyle = SCREEN_COL; x.lineWidth = 6; x.lineCap = 'round'; wavy(x, -130, px * 1.12, 130, px * 1.06, 4, 12); x.restore();
  x.fillStyle = 'rgba(42,27,18,.7)'; x.font = hand(24); x.fillText('— Vick', PW - 70, PH - 34);
}
function pageTitle(x) {
  sheet(x, PW, PH); x.save(); x.translate(PW / 2 + 12, PH / 2 - 26); x.rotate(-.045); x.fillStyle = INK; x.textAlign = 'center'; x.textBaseline = 'middle';
  const [a, b] = TITLE.toUpperCase().split(' '), px = fit(x, [a, b], 116, PW - 70);
  [[a, -px * .5], [b, px * .46]].forEach(([t, y]) => { x.fillText(t, 0, y); x.globalAlpha = .5; x.fillText(t, 2, y + 1.5); x.globalAlpha = 1 });
  x.strokeStyle = SCREEN_COL; x.lineWidth = 7; x.lineCap = 'round'; wavy(x, -140, px * 1.06, 140, px * .98, 5, 14); x.lineWidth = 4; wavy(x, -120, px * 1.2, 100, px * 1.14, 4, 12, 2); x.restore();
  x.fillStyle = 'rgba(42,27,18,.75)'; x.font = hand(25); x.textAlign = 'right'; x.textBaseline = 'alphabetic'; x.fillText('play a key to draw the sound →', PW - 16, PH - 18);
}
function pageItem(x, ch, i) {
  const c = CH[ch], it = c?.items[i]; sheet(x, PW, PH); if (!it) return;
  x.textBaseline = 'alphabetic'; x.textAlign = 'left'; x.fillStyle = c.col; const head = `${c.name}  ·  ${i + 1} of ${c.items.length}`.toUpperCase(); fit(x, [head], 30, PW - 70, 400); x.fillText(head, 48, 52);
  x.strokeStyle = c.col; x.lineWidth = 5; x.lineCap = 'round'; wavy(x, 48, 64, 48 + x.measureText(head).width, 62, 2.5, 10);
  const title = String(it.t).replace(/<[^>]+>/g, '').toUpperCase(); let px = 76, lines; x.fillStyle = INK;
  do { px -= 4; x.font = cut(px); lines = wrap(x, title, PW - 70) } while ((lines.length * px > PH - 130 || lines.some(l => x.measureText(l).width > PW - 62)) && px > 30);
  x.save(); x.translate(48, 92); x.rotate(-.012); lines.forEach((l, n) => x.fillText(l, 0, (n + 1) * px)); x.restore();
}
function pageLogo(x) {
  sheet(x, PW, PH); if (logoInk) { const w = PW - 70, h = w * logoInk.height / logoInk.width; x.save(); x.translate(PW / 2 + 12, PH / 2 - 20); x.rotate(-.03); x.drawImage(logoInk, -w / 2, -h / 2, w, h); x.restore() }
  x.fillStyle = SCREEN_COL; x.font = hand(28); x.textAlign = 'right'; x.textBaseline = 'alphabetic'; x.fillText('click to meet me →', PW - 18, PH - 20);
}
/* the sound page: whatever the pen has drawn so far this sweep, and the pencil */
const STYLES = ['marker', 'pencil', 'stitch', 'dabs'], trace = [], X0 = 46, X1 = PW - 22; // trace: [x, y] in page pixels
let peak = .2, sweepAt = 0, sweepN = 0, penX = X0;
function pageWave(x) {
  sheet(x, PW, PH); const style = STYLES[sweepN % STYLES.length], cy = PH / 2 + 10;
  x.fillStyle = 'rgba(42,27,18,.7)'; x.font = hand(26); x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillText(`the sound, in ${style === 'dabs' ? 'paint' : style}`, 48, 40);
  x.lineCap = x.lineJoin = 'round';
  if (style === 'marker') { x.strokeStyle = SCREEN_COL; x.lineWidth = 8; x.beginPath(); trace.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.stroke() }
  else if (style === 'pencil') { for (let p = 0; p < 3; p++) { x.strokeStyle = `rgba(42,27,18,${.75 - p * .2})`; x.lineWidth = 3 - p * .6; x.beginPath();
      trace.forEach(([px, py], i) => { const j = Math.sin(px * .37 + p * 5) * (2 + p * 2.2); i ? x.lineTo(px, py + j) : x.moveTo(px, py + j) }); x.stroke() } }
  else if (style === 'stitch') { x.strokeStyle = '#2f6f9f'; x.lineWidth = 6; x.setLineDash([14, 12]); x.beginPath(); trace.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.stroke(); x.setLineDash([]) }
  else { x.fillStyle = '#2f9aa6'; trace.forEach(([px, py], i) => { if (i % 4) return; x.beginPath(); x.ellipse(px, py, 6 + Math.abs(py - cy) * .05, 5 + (i % 3), i, 0, 7); x.fill() }) }
  const tip = trace[trace.length - 1]; if (tip) { // the pencil doing the drawing
    x.save(); x.translate(tip[0], tip[1]); x.rotate(-1.05); x.fillStyle = INK; x.beginPath(); x.moveTo(0, 0); x.lineTo(13, -7); x.lineTo(13, 7); x.closePath(); x.fill();
    x.fillStyle = '#e8b93c'; x.fillRect(13, -7, 66, 14); x.fillStyle = '#d2451e'; x.fillRect(79, -7, 12, 14); x.strokeStyle = INK; x.lineWidth = 2.5; x.strokeRect(13, -7, 78, 14); x.restore() }
}
/* the pen moves on: add the stretch of waveform it has just crossed */
function draw(wave, time) {
  const p = (time - sweepAt) / SWEEP, to = X0 + Math.min(1, p) * (X1 - X0), cy = PH / 2 + 10, amp = PH * .3; let m = 0;
  if (wave) for (let i = 0; i < wave.length; i += 8) m = Math.max(m, Math.abs(wave[i] - 128) / 128); peak = Math.max(m, peak * .97, .08);
  for (; penX < to; penX += 3) { const v = wave ? (wave[Math.floor((penX - X0) / (X1 - X0) * (wave.length - 1))] - 128) / 128 / peak : 0; trace.push([penX, cy + Math.max(-1, Math.min(1, v)) * amp]) }
  return p >= 1;
}
const newSweep = time => { sweepAt = time; sweepN++; trace.length = 0; penX = X0 };

/* ── the logo's turn: every 25–60 s, for 8 s ── */
const GAP = () => 25 + Math.random() * 35, L_HOLD = 8; let logoAt = GAP();
function logoUp(time) { if (!logoInk) return false; const e = time - logoAt; if (e < 0) return false; if (e > L_HOLD) { logoAt = time + GAP(); return false } return true }

/* ── the notebook: two pages either side of a row of rings. p (0..1) is how far the turning page has swung from the right to the left ── */
const ease = k => k * k * (3 - 2 * k);
function leafAt(x, img, x0, k, onLeft) { // a page seen partly edge-on: k = how much of its width shows; it's hinged at the spine
  if (k < .02) return; const w = PW * k; x.drawImage(img, 0, 0, PW, PH, onLeft ? x0 + PW - w : x0, PY - (1 - k) * 7, w, PH + (1 - k) * 14);
  x.fillStyle = `rgba(30,18,10,${(1 - k) * .45})`; x.fillRect(onLeft ? x0 + PW - w : x0, PY - (1 - k) * 7, w, PH + (1 - k) * 14);
  x.strokeStyle = INK; x.lineWidth = 2.5; x.strokeRect(onLeft ? x0 + PW - w : x0, PY - (1 - k) * 7, w, PH + (1 - k) * 14);
}
function book(x, p) {
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.translate(W / 2, H / 2); x.rotate(-.01); x.translate(-W / 2, -H / 2);
  x.fillStyle = '#6b4a34'; x.strokeStyle = INK; x.lineWidth = 3; x.fillRect(LX - 9, PY - 9, RX + PW - LX + 18, PH + 18); x.strokeRect(LX - 9, PY - 9, RX + PW - LX + 18, PH + 18); // the card cover showing round the pages
  x.fillStyle = '#e7dabd'; for (let i = 3; i > 0; i--) { x.fillRect(LX - i * 2, PY + i * 2, PW, PH); x.fillRect(RX + i * 2, PY + i * 2, PW, PH) }               // the pages underneath
  x.drawImage(prev.c, LX, PY); x.drawImage(pg.c, RX, PY); x.lineWidth = 2.5; x.strokeRect(LX, PY, PW, PH); x.strokeRect(RX, PY, PW, PH);
  if (p < 1) { const a = p * Math.PI, k = Math.abs(Math.cos(a)); // the turning page: edge-on at the half-way point
    if (p < .5) { const g = x.createLinearGradient(RX, 0, RX + PW * k + 60, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.8, 'rgba(0,0,0,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(RX, PY, PW, PH); leafAt(x, from.c, RX, k, false) }
    else leafAt(x, from.c, LX, k, true) }
  const g = x.createLinearGradient(LX + PW - 26, 0, RX + 26, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(LX + PW - 26, PY, GAP_X + 52, PH); // the gutter
  for (let i = 0; i < 8; i++) { const y = PY + 30 + i * (PH - 60) / 7; // the rings, and the holes they go through
    x.fillStyle = 'rgba(42,27,18,.85)'; for (const hx of [LX + PW - 15, RX + 15]) { x.beginPath(); x.arc(hx, y, 6, 0, 7); x.fill() }
    x.strokeStyle = INK; x.lineWidth = 8; x.lineCap = 'round'; x.beginPath(); x.moveTo(LX + PW - 15, y); x.quadraticCurveTo(W / 2, y - 15, RX + 15, y); x.stroke();
    x.strokeStyle = '#d9d2c4'; x.lineWidth = 4; x.beginPath(); x.moveTo(LX + PW - 15, y); x.quadraticCurveTo(W / 2, y - 15, RX + 15, y); x.stroke() }
  x.setTransform(1, 0, 0, 1, 0, 0);
}
/* the remote's note, taped in, written once (and again when the paper photo arrives) */
function tapeStrip(x, cx, cy, rot, w = 96, h = 30) { x.save(); x.translate(cx, cy); x.rotate(rot); x.fillStyle = 'rgba(238,222,172,.92)'; x.beginPath(); x.moveTo(-w / 2 + 5, -h / 2); x.lineTo(w / 2, -h / 2); x.lineTo(w / 2 - 6, 0); x.lineTo(w / 2, h / 2); x.lineTo(-w / 2, h / 2); x.lineTo(-w / 2 + 6, 0); x.closePath(); x.fill(); x.strokeStyle = 'rgba(90,70,36,.4)'; x.lineWidth = 1.5; x.stroke(); x.restore() }
function note() {
  const o = off(264, 164), x = o.x; sheet(x, 264, 164, 34, 30);
  x.save(); x.translate(140, 70); x.rotate(.05); x.fillStyle = INK; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = cut(66); x.fillText('CONTACT', 0, 0);
  x.strokeStyle = SCREEN_COL; x.lineWidth = 5; x.lineCap = 'round'; wavy(x, -92, 38, 92, 34, 3, 10); x.restore();
  x.fillStyle = 'rgba(42,27,18,.8)'; x.font = hand(26); x.textAlign = 'right'; x.fillText('say hello ↓', 250, 146);
  const r = rs.x; r.setTransform(1, 0, 0, 1, 0, 0); r.clearRect(0, 0, 300, 200); r.translate(150, 100); r.rotate(.03); r.translate(-132, -82);
  r.fillStyle = 'rgba(0,0,0,.4)'; r.fillRect(5, 7, 264, 164); r.drawImage(o.c, 0, 0); r.strokeStyle = INK; r.lineWidth = 3; r.strokeRect(0, 0, 264, 164);
  r.setTransform(1, 0, 0, 1, 0, 0); tapeStrip(r, 60, 20, -.5); tapeStrip(r, 240, 20, .45); rs.t.needsUpdate = true;
}
let turned = false;
document.fonts.ready.then(() => { dirty = true; note(); if (!turned) pageFirst(prev.x) }); note(); pageFirst(prev.x);

let heard = -1e9, wasActive = false, shown = '', turnAt = -1e9, wasTurning = false;
/* returns the music level (0..1) so the speaker can pulse with it */
export function drawScreens(time) {
  const { level, wave } = scope();
  if (level > .02) heard = time; const active = time - heard < 1.4; // the sound page stays up a moment after the sound stops
  if (active && !wasActive) newSweep(time); wasActive = active;
  if (active && draw(wave, time)) newSweep(time); // the pen reached the edge: next page
  const up = logoUp(time), h = S.hover?.userData, c = S.card;
  const want = up ? 'logo' : c && CH[c.ch] ? `item:${c.ch}:${c.i}` : active ? `wave:${sweepN}` : h?.item && S.mode === h.ch ? `item:${h.ch}:${h.i}` : 'title';
  V.logo = up ? 1 : 0;
  if (want !== shown) { // turn the page: what was on the right swings over to the left (and whatever was turning already is put down there first)
    if (shown) { if (time - turnAt < TURN) prev.x.drawImage(from.c, 0, 0); from.x.drawImage(pg.c, 0, 0); turnAt = reduceMotion ? time - TURN : time; turned = true }
    shown = want; dirty = true }
  const p = (time - turnAt) / TURN, turning = p < 1, live = want.startsWith('wave') || party() > .01;
  if (wasTurning && !turning) prev.x.drawImage(from.c, 0, 0); // it has landed: it's now the left-hand page
  if (!dirty && !turning && !wasTurning && !live) return level; // nothing has changed on the page
  wasTurning = turning; dirty = false; // (one more drawing after a turn ends, so the pages are left lying flat)
  const x = pg.x; x.save();
  if (want === 'logo') pageLogo(x); else if (want === 'title') pageTitle(x); else if (want.startsWith('item')) { const [, ch, i] = want.split(':'); pageItem(x, ch, +i) } else pageWave(x);
  const pp = party(); if (pp > .01) { const cols = partyColours(); x.setTransform(1, 0, 0, 1, 0, 0); // beats: dabs of paint in the video's colours along the foot of the page
    for (let i = 0; i < 16; i++) { const n = Math.abs(Math.sin(i * 12.99 + Math.floor(time * 6) * 4.1) * 43758.5) % 1; x.globalAlpha = pp * (.35 + n * .5); x.fillStyle = cols[i % cols.length]; x.beginPath(); x.arc(48 + i * (PW - 70) / 15, PH - 16 - n * 26, 5 + n * 9, 0, 7); x.fill() } x.globalAlpha = 1 }
  x.restore();
  book(scr.x, turning ? ease(Math.max(0, p)) : 1);
  scr.t.needsUpdate = true; return level;
}
drawScreens(0);
