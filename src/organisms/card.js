/* Detail card: the work first, a tight headline group, then the story, links and gallery. Plus toast, lightbox and HUD state. */
import { $, S, CTRL, ROWBTN, act, reduceMotion } from '../core/state.js';
import { CH, onKeys } from '../core/data.js';
import { ensureAudio, playNote, drum, foley } from '../core/audio.js';
import { press } from '../molecules/controls.js';
import { icon } from '../atoms/icons.js';

import { cardHTML, EMAIL, ONE } from '../molecules/cardhtml.js';

export function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true }, 2600) }
/* HUD: Home greys out at home; phones hide the legend under the card sheet */
export function updateUI() {
  $('home')?.setAttribute('data-at-home', String(!S.mode && !S.card)); document.body.dataset.card = String(!!S.card);
}
const card = $('card'), ct = $('ct'), cf = $('cf');
/* o.from 'menu': opened through the menu, so the footer offers Back to menu and Cancel (kept while paging with prev/next).
   o.quiet: the key was already pushed on the way in, so don't press it again */
export function openCard(ch, i, o = {}) {
  const n = CH[ch].items.length; i = ((i % n) + n) % n;
  const was = S.card, from = o.from ?? (S.card?.ch === ch ? S.card.from : undefined); S.card = { ch, i, from }; updateUI(); cf.hidden = from !== 'menu';
  /* paging to another project in the same book turns the page: the page you were reading lifts off and swings over
     (to the left going forward, to the right going back), with its blank back showing, and the next page is underneath */
  const n0 = CH[ch].items.length, turn = was && !card.hidden && was.ch === ch && was.i !== i && ch !== ONE && !reduceMotion ? ((i - was.i + n0) % n0 <= n0 / 2 ? 1 : -1) : 0;
  if (turn) {
    const leaf = document.createElement('div'), front = ct.cloneNode(true), top = ct.scrollTop; leaf.className = 'leaf ' + (turn > 0 ? 'fwd' : 'back'); foley('page'); leaf.setAttribute('aria-hidden', 'true');
    front.removeAttribute('id'); front.classList.add('leaf-front'); leaf.style.cssText = `top:${ct.offsetTop}px;left:${ct.offsetLeft}px;width:${ct.offsetWidth}px;height:${ct.offsetHeight}px`;
    leaf.append(front, Object.assign(document.createElement('div'), { className: 'leaf-back' })); card.append(leaf); front.scrollTop = top; setTimeout(() => leaf.remove(), 600);
  }
  /* the arrows say where they go: the next project's name always, the previous one's on hover (desktop and tablet) */
  const name = d => CH[ch].items[(i + d + n) % n]?.t || '';
  $('nextT').innerHTML = `<small>Next</small>${name(1)}`; $('prevT').innerHTML = `<small>Previous</small>${name(-1)}`;
  $('next').setAttribute('aria-label', `Next project: ${name(1)}`); $('prev').setAttribute('aria-label', `Previous project: ${name(-1)}`);
  card.style.setProperty('--accent', CH[ch].col); const same = ch === ONE && was?.ch === ch && !card.hidden; // already on the About page: only scroll
  if (!same) ct.innerHTML = cardHTML(ch, i); card.dataset.one = String(ch === ONE); card.dataset.wide = String(!!CH[ch].items[i]?.case); card.dataset.proj = String(ch !== ONE && ch !== 'cv');
  if (!turn && !same) { card.hidden = true; void card.offsetWidth; card.hidden = false } // a new book: the sheet drops in
  const sec = ch === ONE && i ? ct.querySelector(`[data-sec="${i}"]`) : null;
  ct.scrollTo({ top: sec ? sec.getBoundingClientRect().top - ct.getBoundingClientRect().top + ct.scrollTop - 14 : 0, behavior: same && !reduceMotion ? 'smooth' : 'auto' });
  if (!o.quiet) { const rb = ROWBTN.find(a => a[1] === ch); if (rb) press(rb[0]); const m = (onKeys(ch) ? CTRL.kb : CTRL[ch])?.[i]; if (m) press(m) }
  const cp = $('cp'); if (cp) cp.onclick = () => navigator.clipboard?.writeText(EMAIL).then(() => {
    cp.classList.add('done'); cp.innerHTML = icon('check', 18, 'tick') + '<span>Copied</span>'; toast('Email copied to your clipboard'); drum('blip') }, () => toast(`Copy blocked: the address is ${EMAIL}`));
}
/* a soft scrim behind an open project: it keeps the eye on the window, and a click on it closes the project, like any dialog */
const scrim = document.createElement('div'); scrim.id = 'scrim'; scrim.setAttribute('aria-hidden', 'true'); card.before(scrim);
scrim.onclick = () => { drum('blip'); closeCard() };
export function closeCard() { S.card = null; card.hidden = true; cf.hidden = true; updateUI() }
/* footer CTAs (secondary): back to the menu level this card came from, or just close and stay on the synth */
$('tomenu').onclick = () => { const c = S.card; drum('blip'); closeCard(); if (c) act.openMenuFor(c.ch, c.i) };
$('cancel').onclick = () => { drum('blip'); closeCard() };
const step = d => { if (!S.card) return; ensureAudio(); openCard(S.card.ch, S.card.i + d); playNote(60 + [0, 4, 7, 12, 7, 4, 2, 5, 9, 11, 14, 16][S.card.i % 12]) };
$('prev').innerHTML = icon('chevron-left', 20); $('next').innerHTML = icon('chevron-right', 20); $('cls').innerHTML = icon('close', 20);
$('prev').onclick = $('prevT').onclick = () => step(-1); $('next').onclick = $('nextT').onclick = () => step(1); $('cls').onclick = closeCard;
const lb = $('lb');
ct.onclick = e => { const b = e.target.closest('.pic'); if (b) { lb.querySelector('img').src = b.dataset.src; lb.hidden = false } };
lb.onclick = () => lb.hidden = true;
