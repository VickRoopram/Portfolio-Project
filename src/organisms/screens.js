/* The two "screens" are sheets of paper taped into the boxes, written on by hand.
   The remote's is a note: CONTACT. The synth's is a notepad that turns its pages:
   - MY PROJECTS, lettered big, when nothing is happening;
   - a project's name while its card is open, or while you point at its key in its mode;
   - the sound, drawn on as you play: a pen travels across the page tracing the waveform (in marker, pencil, stitches or dabs of paint,
     a new one each page), and when it reaches the edge the page turns and it starts again;
   - every 25–60 s (a new random gap each time) the Vickhal Roopram logo, for 8 s. While it shows, V.logo is up and a click on the page
     opens the About summary (synth.js).
   Every change of page is a page turn: the old page folds over from the right. drawScreens also hands the music level to the speaker. */
import { scope } from '../core/audio.js';
import { S, V, reduceMotion } from '../core/state.js';
import { CH } from '../core/data.js';
import { party, partyColours } from './party.js';
import { scr } from './synth.js';
import { rs } from './remote.js';
import { INK } from '../atoms/craft.js';

export const SCREEN_COL = '#d2451e'; // red marker
const W = 800, H = 476, MG = 18, PW = W - MG * 2, PH = H - MG * 2, TITLE = 'My Projects';
const TURN = .55, SWEEP = 2.6;      // seconds: one page turn · the pen crossing the page once
const hand = px => `400 ${px}px "Patrick Hand", "Comic Sans MS", cursive`, cut = (px, w = 900) => `${w} ${px}px "Londrina Solid", "Arial Narrow", sans-serif`;
const off = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return { c, x: c.getContext('2d') } };
const pg = off(PW, PH), from = off(PW, PH); // the page being shown · the page that's turning away
let dirty = true;
const paper = new Image(); paper.onload = () => { dirty = true; note() }; paper.src = 'assets/tex/paper.jpg';
const logo = new Image(); let logoInk = null; // the header logo, re-inked for paper
logo.onload = () => { const w = 560, h = Math.round(w * logo.height / logo.width), o = off(w, h); o.x.drawImage(logo, 0, 0, w, h); o.x.globalCompositeOperation = 'source-in'; o.x.fillStyle = INK; o.x.fillRect(0, 0, w, h); logoInk = o.c }; logo.src = 'assets/ui/logo-on-dark.svg';

/* a blank sheet: the paper photo, feint blue rules, a red margin and punched holes */
function sheet(x, w, h, rule = 46, margin = 70) {
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.fillStyle = '#f7eedb'; x.fillRect(0, 0, w, h);
  if (paper.complete && paper.naturalWidth) { x.globalAlpha = .55; x.drawImage(paper, 0, 0, 1024, 1024 * h / w, 0, 0, w, h); x.globalAlpha = 1 }
  x.strokeStyle = 'rgba(64,118,170,.3)'; x.lineWidth = 2; for (let y = rule * 1.5; y < h - 8; y += rule) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y + 1.5); x.stroke() }
  x.strokeStyle = 'rgba(210,69,30,.45)'; x.beginPath(); x.moveTo(margin, 0); x.lineTo(margin - 2, h); x.stroke();
  x.fillStyle = 'rgba(42,27,18,.8)'; for (const y of [.2, .5, .8]) { x.beginPath(); x.arc(margin * .45, h * y, margin * .1, 0, 7); x.fill() }
}
/* a line that wobbles like one drawn freehand (the same wobble every time it's redrawn, so it doesn't crawl) */
function wavy(x, x0, y0, x1, y1, amp = 3, n = 14, ph = 0) { x.beginPath(); for (let i = 0; i <= n; i++) { const k = i / n; x.lineTo(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k + Math.sin(k * 9 + ph) * amp + Math.sin(k * 23 + ph * 2) * amp * .4) } x.stroke() }
function wrap(x, text, maxW) { const out = []; let line = ''; for (const w of String(text).split(/\s+/)) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { out.push(line); line = w } else line = t } if (line) out.push(line); return out }

/* ── the pages ── */
function pageTitle(x) {
  sheet(x, PW, PH); x.save(); x.translate(PW / 2 + 26, PH / 2 - 8); x.rotate(-.035); x.fillStyle = INK; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = cut(132); x.fillText(TITLE.toUpperCase(), 0, 0); x.globalAlpha = .5; x.fillText(TITLE.toUpperCase(), 2, 1.5); x.globalAlpha = 1;
  x.strokeStyle = SCREEN_COL; x.lineWidth = 7; x.lineCap = 'round'; wavy(x, -290, 78, 290, 70, 5, 18); x.lineWidth = 4; wavy(x, -250, 94, 210, 88, 4, 14, 2); x.restore();
  x.fillStyle = 'rgba(42,27,18,.75)'; x.font = hand(30); x.textAlign = 'right'; x.fillText('play a key to draw the sound →', PW - 22, PH - 20);
}
function pageItem(x, ch, i) {
  const c = CH[ch], it = c?.items[i]; sheet(x, PW, PH); if (!it) return;
  x.textBaseline = 'alphabetic'; x.textAlign = 'left'; x.fillStyle = c.col; x.font = cut(34, 400); const head = `${c.name}  ·  ${i + 1} of ${c.items.length}`; x.fillText(head.toUpperCase(), 92, 56);
  x.strokeStyle = c.col; x.lineWidth = 5; x.lineCap = 'round'; wavy(x, 92, 68, 92 + Math.min(PW - 130, x.measureText(head.toUpperCase()).width), 66, 2.5, 10);
  const title = String(it.t).replace(/<[^>]+>/g, ''); let px = 84; x.fillStyle = INK; let lines;
  do { x.font = cut(px); lines = wrap(x, title.toUpperCase(), PW - 130); px -= 6 } while ((lines.length > 3 || lines.length * px * 1.02 > PH - 110) && px > 36);
  x.save(); x.translate(92, 96); x.rotate(-.012); lines.slice(0, 3).forEach((l, n) => x.fillText(l, 0, (n + 1) * px * 1.0)); x.restore();
}
function pageLogo(x) {
  sheet(x, PW, PH); if (logoInk) { const w = 500, h = w * logoInk.height / logoInk.width; x.save(); x.translate(PW / 2 + 24, PH / 2 - 14); x.rotate(-.03); x.drawImage(logoInk, -w / 2, -h / 2, w, h); x.restore() }
  x.fillStyle = SCREEN_COL; x.font = hand(32); x.textAlign = 'right'; x.textBaseline = 'alphabetic'; x.fillText('click to meet me →', PW - 24, PH - 20);
}
/* the sound page: whatever the pen has drawn so far this sweep, and the pen */
const STYLES = ['marker', 'pencil', 'stitch', 'dabs'], trace = []; // trace: [x, y] in page pixels
let peak = .2, sweepAt = 0, sweepN = 0, penX = 0;
function pageWave(x, time) {
  sheet(x, PW, PH); const style = STYLES[sweepN % STYLES.length], cy = PH / 2 + 8;
  x.fillStyle = 'rgba(42,27,18,.7)'; x.font = hand(28); x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillText(`the sound, in ${style === 'dabs' ? 'paint' : style}`, 92, 40);
  x.lineCap = x.lineJoin = 'round';
  if (style === 'marker') { x.strokeStyle = SCREEN_COL; x.lineWidth = 9; x.beginPath(); trace.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.stroke() }
  else if (style === 'pencil') { for (let p = 0; p < 3; p++) { x.strokeStyle = `rgba(42,27,18,${.75 - p * .2})`; x.lineWidth = 3 - p * .6; x.beginPath();
      trace.forEach(([px, py], i) => { const j = Math.sin(px * .37 + p * 5) * (2 + p * 2.2); i ? x.lineTo(px, py + j) : x.moveTo(px, py + j) }); x.stroke() } }
  else if (style === 'stitch') { x.strokeStyle = '#2f6f9f'; x.lineWidth = 6; x.setLineDash([16, 13]); x.beginPath(); trace.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.stroke(); x.setLineDash([]) }
  else { x.fillStyle = '#2f9aa6'; trace.forEach(([px, py], i) => { if (i % 4) return; x.globalAlpha = .9; x.beginPath(); x.ellipse(px, py, 6 + Math.abs(py - cy) * .06, 5 + (i % 3), i, 0, 7); x.fill() }); x.globalAlpha = 1 }
  const tip = trace[trace.length - 1]; if (tip) { // the pencil doing the drawing
    x.save(); x.translate(tip[0], tip[1]); x.rotate(-.9); x.fillStyle = INK; x.beginPath(); x.moveTo(0, 0); x.lineTo(13, -7); x.lineTo(13, 7); x.closePath(); x.fill();
    x.fillStyle = '#e8b93c'; x.fillRect(13, -7, 70, 14); x.fillStyle = '#d2451e'; x.fillRect(83, -7, 12, 14); x.strokeStyle = INK; x.lineWidth = 2.5; x.strokeRect(13, -7, 82, 14); x.restore() }
}
/* the pen moves on: add the stretch of waveform it has just crossed */
function draw(wave, time) {
  const p = (time - sweepAt) / SWEEP, to = 92 + Math.min(1, p) * (PW - 92 - 30), cy = PH / 2 + 8, amp = PH * .34; let m = 0;
  if (wave) for (let i = 0; i < wave.length; i += 8) m = Math.max(m, Math.abs(wave[i] - 128) / 128); peak = Math.max(m, peak * .97, .08);
  for (; penX < to; penX += 3) { const v = wave ? (wave[Math.floor((penX - 92) / (PW - 122) * (wave.length - 1))] - 128) / 128 / peak : 0; trace.push([penX, cy + Math.max(-1, Math.min(1, v)) * amp]) }
  return p >= 1;
}
const newSweep = time => { sweepAt = time; sweepN++; trace.length = 0; penX = 92 };

/* ── the logo's turn: every 25–60 s, for 8 s ── */
const GAP = () => 25 + Math.random() * 35, L_HOLD = 8; let logoAt = GAP();
function logoUp(time) { if (!logoInk) return false; const e = time - logoAt; if (e < 0) return false; if (e > L_HOLD) { logoAt = time + GAP(); return false } return true }

/* ── putting the page in the box: a little crooked, taped at the top; a turning page folds over from the right ── */
const ease = k => k * k * (3 - 2 * k);
function tapeStrip(x, cx, cy, rot, w = 96, h = 30) { x.save(); x.translate(cx, cy); x.rotate(rot); x.fillStyle = 'rgba(238,222,172,.92)'; x.beginPath(); x.moveTo(-w / 2 + 5, -h / 2); x.lineTo(w / 2, -h / 2); x.lineTo(w / 2 - 6, 0); x.lineTo(w / 2, h / 2); x.lineTo(-w / 2, h / 2); x.lineTo(-w / 2 + 6, 0); x.closePath(); x.fill(); x.strokeStyle = 'rgba(90,70,36,.4)'; x.lineWidth = 1.5; x.stroke(); x.restore() }
function mount(x, cw, ch, page, old, p, tilt) {
  const pw = page.width, ph = page.height; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cw, ch);
  x.translate(cw / 2, ch / 2); x.rotate(tilt); x.translate(-pw / 2, -ph / 2);
  x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(5, 7, pw, ph); x.drawImage(page, 0, 0);
  if (old && p < 1) { const fold = pw * (1 - p), fw = Math.min(pw - fold, fold);
    x.save(); x.beginPath(); x.rect(0, 0, fold, ph); x.clip(); x.drawImage(old, 0, 0); x.restore();                                   // what's left of the old page
    let g = x.createLinearGradient(fold, 0, fold + 70, 0); g.addColorStop(0, 'rgba(0,0,0,.38)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(fold, 0, 70, ph); // its shadow on the new one
    g = x.createLinearGradient(fold - fw, 0, fold, 0); g.addColorStop(0, '#efe3c9'); g.addColorStop(.75, '#dccdae'); g.addColorStop(1, '#b9a988'); x.fillStyle = g; x.fillRect(fold - fw, -3, fw, ph + 6); // the back of the page, folded over
    x.strokeStyle = INK; x.lineWidth = 2.5; x.strokeRect(fold - fw, -3, fw, ph + 6);
    g = x.createLinearGradient(fold - fw - 40, 0, fold - fw, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); x.fillStyle = g; x.fillRect(fold - fw - 40, 0, 40, ph) }
  x.strokeStyle = INK; x.lineWidth = 3; x.strokeRect(0, 0, pw, ph);
  x.setTransform(1, 0, 0, 1, 0, 0); tapeStrip(x, 70, 20, -.5); tapeStrip(x, cw - 70, 20, .45);
}

/* the remote's note, written once (and again when the paper photo arrives) */
function note() {
  const o = off(264, 164), x = o.x; sheet(x, 264, 164, 34, 34);
  x.save(); x.translate(144, 70); x.rotate(.05); x.fillStyle = INK; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = cut(66); x.fillText('CONTACT', 0, 0);
  x.strokeStyle = SCREEN_COL; x.lineWidth = 5; x.lineCap = 'round'; wavy(x, -92, 38, 92, 34, 3, 10); x.restore();
  x.fillStyle = 'rgba(42,27,18,.8)'; x.font = hand(26); x.textAlign = 'right'; x.fillText('say hello ↓', 250, 146);
  mount(rs.x, 300, 200, o.c, null, 1, .03); rs.t.needsUpdate = true;
}
document.fonts.ready.then(() => { dirty = true; note() }); note();

let last = 0, heard = -1e9, wasActive = false, shown = '', turnAt = -1e9, wasTurning = false;
/* returns the music level (0..1) so the speaker can pulse with it */
export function drawScreens(time) {
  const { level, wave } = scope(); last = time;
  if (level > .02) heard = time; const active = time - heard < 1.4; // the sound page stays up a moment after the sound stops
  if (active && !wasActive) newSweep(time); wasActive = active;
  if (active && draw(wave, time)) newSweep(time); // the pen reached the edge: next page
  const up = logoUp(time), h = S.hover?.userData, c = S.card;
  const want = up ? 'logo' : c && CH[c.ch] ? `item:${c.ch}:${c.i}` : active ? `wave:${sweepN}` : h?.item && S.mode === h.ch ? `item:${h.ch}:${h.i}` : 'title';
  V.logo = up ? 1 : 0;
  if (want !== shown) { if (shown && !reduceMotion) { from.x.setTransform(1, 0, 0, 1, 0, 0); from.x.drawImage(pg.c, 0, 0); turnAt = time } shown = want; dirty = true }
  const p = (time - turnAt) / TURN, turning = p < 1, live = want.startsWith('wave') || party() > .01;
  if (!dirty && !turning && !wasTurning && !live) return level; // nothing has changed on the page
  wasTurning = turning; dirty = false; // (one more drawing after a turn ends, so the new page is left lying flat)
  const x = pg.x; x.save();
  if (want === 'logo') pageLogo(x); else if (want === 'title') pageTitle(x); else if (want.startsWith('item')) { const [, ch, i] = want.split(':'); pageItem(x, ch, +i) } else pageWave(x, time);
  const pp = party(); if (pp > .01) { const cols = partyColours(); x.setTransform(1, 0, 0, 1, 0, 0); // beats: dabs of paint in the video's colours along the foot of the page
    for (let i = 0; i < 26; i++) { const n = Math.abs(Math.sin(i * 12.99 + Math.floor(time * 6) * 4.1) * 43758.5) % 1; x.globalAlpha = pp * (.35 + n * .5); x.fillStyle = cols[i % cols.length]; x.beginPath(); x.arc(96 + i * (PW - 120) / 25, PH - 16 - n * 26, 5 + n * 9, 0, 7); x.fill() } x.globalAlpha = 1 }
  x.restore();
  mount(scr.x, W, H, pg.c, turning ? from.c : null, turning ? ease(Math.max(0, p)) : 1, -.012);
  scr.t.needsUpdate = true; return level;
}
drawScreens(0);
