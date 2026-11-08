/* Menu behind the burger: a side panel in the same spot as the detail card, so the synth stays visible and reachable.
   Root: Home · About · Projects › · Contact · Download CV.
   Projects drills down to the five keyboard modes; a mode drills down to the projects on its keys.
   Picking a mode flies the camera to the keys and lights them; picking a project hands over to act.journey
   (pan out, fly into the synth, push the key, open the card where the menu was). */
import { $, S, pad, act, reduceMotion } from '../core/state.js';
import { CH, MODES } from '../core/data.js';
import { ensureAudio, drum } from '../core/audio.js';
import { icon } from '../atoms/icons.js';

/* the project modes, in the order of the synth's mode buttons; labels read as sections, not button legends */
export const PROJECT_MODES = [['gd', 'Graphic design'], ['ux', 'UI/UX design'], ['mo', 'Motion & 3D'], ['tl', 'Tools'], ['xp', 'Experimental']];
const LABEL = Object.fromEntries(PROJECT_MODES);
const isSlot = it => /^open slot$/i.test(String(it.t).trim()); // placeholders stay on the keys but not in the menu

const menu = $('menu'), mnu = $('mnu'), head = $('m-head'), back = $('m-back'), body = $('m-body');
let level = { k: 'root' }, hideId = 0;
const label = open => { mnu.setAttribute('aria-expanded', String(open)); mnu.setAttribute('aria-label', open ? 'Close menu' : 'Menu') };
export const menuOpen = () => !menu.hidden && !menu.classList.contains('out');

const chev = `<span class="go">${icon('chevron-right', 20)}</span>`;
const row = (attrs, inner, n) => `<button class="m-row" ${attrs} style="--n:${n}">${inner}</button>`;
function render() {
  const { k, ch, i } = level; let h = '';
  if (k === 'root') {
    h = `<div class="m-list root">${[['home', 'Home'], ['about', 'About'], ['projects', 'Projects', 1], ['contact', 'Contact']].map(([go, t, sub], n) =>
      row(`data-go="${go}"${go === 'home' ? ' id="home"' : ''}`, `<span class="tx"><b>${t}</b></span>${sub ? chev : ''}`, n)).join('')}
      <a class="m-row cv" href="assets/cv/vickhal-roopram-cv.pdf" target="_blank" rel="noopener" style="--n:4"><span class="tx"><b>Download CV</b></span><span class="go">${icon('download', 20)}</span></a></div>`;
  } else if (k === 'projects') {
    h = `<p class="m-title">Projects</p><p class="m-sub">Pick a mode: the camera flies to the keys that hold it.</p><div class="m-list">${PROJECT_MODES.map(([m, t], n) => {
      const c = CH[m]; if (!c) return ''; const count = c.items.filter(x => !isSlot(x)).length;
      return row(`data-mode="${m}" style="--c:${c.col}"`, `<i class="dot"></i><span class="tx"><b>${t}</b><small>${count} ${count === 1 ? 'project' : 'projects'}</small></span>${chev}`, n);
    }).join('')}</div>`;
  } else {
    const c = CH[ch]; let n = 0;
    h = `<p class="m-title" style="--c:${c.col}">${LABEL[ch] || c.name}</p><p class="m-sub">Pick a project to play its key.</p><div class="m-list" style="--c:${c.col}">${c.items.map((it, j) => isSlot(it) ? '' :
      row(`data-item="${j}"${j === i ? ' aria-current="true"' : ''}`, `<span class="no">${pad(j + 1)}</span>${it.img?.[0] ? `<img class="th" src="${it.img[0].s}" alt="" loading="lazy">` : ''}<span class="tx"><b>${it.t}</b>${it.k ? `<small>${it.k}</small>` : ''}</span>${chev}`, n++)).join('')}</div>`;
  }
  head.hidden = k === 'root'; back.querySelector('span').textContent = k === 'mode' ? 'Projects' : 'Menu';
  body.innerHTML = h; body.scrollTop = 0; menu.dataset.level = k; syncHome();
  (body.querySelector('[aria-current="true"]') || body.querySelector('.m-row'))?.focus({ preventScroll: true });
}
const syncHome = () => $('home')?.setAttribute('data-at-home', String(!S.mode && !S.card));
function show(k, ch, i) { level = { k, ch, i }; render() }

/* open at a level (the burger opens the root). The card and the menu share one side, so the card closes first */
export function openMenu(k = 'root', ch, i) {
  if (S.card) act.closeCard(); act.cancelJourney?.(); hideId++;
  menu.classList.remove('out'); menu.hidden = false; S.menu = true; label(true); drum('blip'); show(k, ch, i);
}
/* "Back to menu" from a card: projects return to their mode's list (with that project marked); About and Contact to the root */
export function openMenuFor(ch, i) { PROJECT_MODES.some(([m]) => m === ch) ? openMenu('mode', ch, i) : openMenu('root') }
/* close: never wait on animationend (the old bug: it didn't fire, so an invisible menu kept covering the synth).
   The panel stops taking pointer input at once and is hidden after its exit animation. */
export function closeMenu() {
  if (!menuOpen()) return; label(false); S.menu = false; const id = ++hideId;
  if (reduceMotion) { menu.hidden = true; return }
  menu.classList.add('out'); setTimeout(() => { if (id === hideId) { menu.hidden = true; menu.classList.remove('out') } }, 240);
}
/* Esc: up one level, then closed */
export function menuEsc() { if (level.k === 'mode') show('projects'); else if (level.k === 'projects') show('root'); else { closeMenu(); mnu.focus() } }

mnu.onclick = () => { ensureAudio(); menuOpen() ? closeMenu() : openMenu() };
back.onclick = () => { drum('blip'); show(level.k === 'mode' ? 'projects' : 'root') };
body.addEventListener('click', e => {
  const b = e.target.closest('button.m-row'); if (!b) { if (e.target.closest('a.m-row')) closeMenu(); return }
  ensureAudio(); const { go, mode, item } = b.dataset;
  if (go === 'home') { closeMenu(); act.zoomOut() }
  else if (go === 'about') { closeMenu(); act.journey('ab', 0) }
  else if (go === 'contact') { closeMenu(); act.journey('cv', 1) }
  else if (go === 'projects') { drum('blip'); show('projects') }
  else if (mode) { show('mode', mode); act.zoomTo(mode) } // the camera flies to the keys while the list opens
  else if (item !== undefined) { const ch = level.ch; closeMenu(); act.journey(ch, +item) }
});
document.addEventListener('pointerdown', e => { if (menuOpen() && !menu.contains(e.target) && !mnu.contains(e.target)) closeMenu() });
$('brand').onclick = e => { e.preventDefault(); ensureAudio(); closeMenu(); if (S.mode || S.card) act.zoomOut() };
