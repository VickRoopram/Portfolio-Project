/* Full-screen menu behind the burger: Home, About, Projects, Contact, CV. */
import { $, S, act, reduceMotion } from '../core/state.js';
import { ensureAudio, drum } from '../core/audio.js';
import { GROUPS } from './underlights.js';

const menu = $('menu'), mnu = $('mnu');
const label = open => { mnu.setAttribute('aria-expanded', String(open)); mnu.setAttribute('aria-label', open ? 'Close menu' : 'Menu') };
export const menuOpen = () => !menu.hidden;
function openMenu() { menu.classList.remove('out'); menu.hidden = false; label(true); drum('blip'); menu.querySelector('button')?.focus({ preventScroll: true }) }
export function closeMenu() {
  if (menu.hidden) return; label(false); if (reduceMotion) { menu.hidden = true; return }
  menu.classList.add('out'); menu.addEventListener('animationend', () => { if (menu.classList.contains('out')) { menu.hidden = true; menu.classList.remove('out') } }, { once: true });
}
mnu.onclick = () => { ensureAudio(); menu.hidden || menu.classList.contains('out') ? openMenu() : closeMenu() };
menu.addEventListener('click', e => {
  const k = e.target.closest('[data-go]')?.dataset.go; if (k === 'home') return; closeMenu(); if (!k) return; // links and empty space just close it
  ensureAudio(); if (k === 'about') { act.zoomTo('ab'); act.openCard('ab', 0); return }
  S.mode = null; GROUPS[k].go();
});
document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && !mnu.contains(e.target)) closeMenu() });
$('home').onclick = () => { ensureAudio(); closeMenu(); act.zoomOut() };
$('brand').onclick = e => { e.preventDefault(); ensureAudio(); closeMenu(); if (S.mode || S.card) act.zoomOut() };
