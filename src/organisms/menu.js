/* Menu behind the burger: a tray of cardboard boxes, in the same spot as the detail card, so the synth stays visible and reachable.
   Point at a box and its flaps lift; click and they fold open. A box with more inside (Projects, a section) opens onto the next tray;
   a section's projects are cassette tapes packed in its crate. Picking a project, About or Contact runs a cable from it to its key
   on the synth (#wire), then the journey starts.
   Root: MENU.items (default Home · About · Projects › · Contact; editable in /admin).
   Projects drills down to the five keyboard modes; a mode drills down to the projects on its keys.
   Picking a mode flies the camera to the keys and lights them; picking a project hands over to act.journey
   (pan out, fly into the synth, push the key, open the card where the menu was). */
import * as THREE from 'three';
import { $, S, V, CTRL, act, reduceMotion } from '../core/state.js';
import { CH, MENU, onKeys } from '../core/data.js';
import { camera, stage } from '../core/scene.js';
import { ensureAudio, drum, foley } from '../core/audio.js';
import { icon } from '../atoms/icons.js';

/* the sections under Projects, in menu order; labels read as sections, not button legends */
export const PROJECT_MODES = MENU.projects.filter(p => CH[p.key]).map(p => [p.key, p.label || CH[p.key].name]);
const LABEL = Object.fromEntries(PROJECT_MODES);
const isSlot = it => /^open slot$/i.test(String(it.t).trim()); // placeholders stay on the keys but not in the menu

const menu = $('menu'), mnu = $('mnu'), head = $('m-head'), back = $('m-back'), body = $('m-body');
let level = { k: 'root' }, hideId = 0;
const label = open => { mnu.setAttribute('aria-expanded', String(open)); mnu.setAttribute('aria-label', open ? 'Close menu' : 'Menu') };
export const menuOpen = () => !menu.hidden && !menu.classList.contains('out');

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const chev = `<span class="go">${icon('chevron-right', 20)}</span>`;
/* a closed box seen from above: two flaps with its name lettered across the seam, and whatever's inside underneath */
const flaps = t => `<i class="fl l"><b>${t}</b></i><i class="fl r"><b>${t}</b></i>`;
/* inside every box is a slip of paper with the box's name on it: you read it when the box is open */
const box = (attrs, t, n, c, here) => `<button class="m-row box${here ? ' here' : ''}" ${attrs}${here ? ' aria-current="true"' : ''} style="--n:${n}${c ? `;--c:${c}` : ''}"><span class="in"><b class="in-name">${t}</b></span>${flaps(t)}</button>`;
/* where you are now: Home on the overview, About / Contact on their cards, Projects (and that section's box) in a section.
   That box is shown already open and faded: you're in it */
const at = () => S.card?.ch === 'ab' || S.mode === 'ab' ? 'about' : S.card?.ch === 'cv' || S.mode === 'cv' ? 'contact' : S.mode ? 'mode:' + S.mode : S.card ? 'mode:' + S.card.ch : 'home';
const isHere = go => { const a = at(); return go === a || (go === 'projects' && a.startsWith('mode:') && PROJECT_MODES.some(([m]) => 'mode:' + m === a)) };
/* a project is a cassette tape: its name written on the label along the top, two reels in the window underneath */
const tape = (attrs, t, n) => `<button class="m-row tape" ${attrs} style="--n:${n}"><span class="lbl"><b>${t}</b></span><span class="win" aria-hidden="true"><i></i><i></i></span></button>`;
/* the box you opened becomes a big crate round everything that was inside it: its name is lettered on the top flap */
const crate = (name, inner, cls) => `<div class="crate"><p class="m-title crate-name">${name}</p><i class="cf l"></i><i class="cf r"></i><i class="cf b"></i><div class="m-list ${cls}">${inner}</div></div>`;
function render() {
  const { k, ch, i } = level; let h = '';
  if (k === 'root') {
    h = `<div class="m-list root boxes">${MENU.items.map(({ label: t, go, href }, n) => go === 'link'
      ? `<a class="m-row box" href="${esc(href || '#')}" target="_blank" rel="noopener" style="--n:${n}"><span class="in">${icon('external-link', 28)}</span>${flaps(esc(t))}</a>`
      : box(`data-go="${go}"${go === 'home' ? ' id="home"' : ''}`, esc(t), n, '', isHere(go))).join('')}</div>`;
  } else if (k === 'projects') {
    h = crate('Projects', PROJECT_MODES.map(([m, t], n) => CH[m] ? box(`data-mode="${m}"`, t, n, '', isHere('mode:' + m)) : '').join(''), 'boxes');
  } else {
    const c = CH[ch]; let n = 0;
    h = crate(LABEL[ch] || c.name, c.items.map((it, j) => isSlot(it) ? '' : tape(`data-item="${j}"${j === i ? ' aria-current="true"' : ''}`, it.t, n++)).join(''), 'tapes');
  }
  head.hidden = k === 'root'; back.querySelector('span').textContent = k === 'mode' && !level.direct ? 'Projects' : 'Menu';
  body.innerHTML = h; body.scrollTop = 0; menu.dataset.level = k; syncHome(); hidePeek(); busy = false;
  (body.querySelector('.tape[aria-current="true"]') || body.querySelector('.m-row:not(.here)') || body.querySelector('.m-row'))?.focus({ preventScroll: true });
}
/* fold a box's flaps open, then carry on (three drawings later) */
let busy = false;
const FOLD = reduceMotion ? 0 : 360;
function unbox(b, then) { if (busy) return; busy = true; b.classList.add('open'); drum('rim'); setTimeout(() => { busy = false; then() }, FOLD) }
/* the cable: from the box or card you picked to its key on the synth, drawn out in steps with a plug landing on the key */
const wire = $('wire'), wInk = wire.querySelector('.w-ink'), wCord = wire.querySelector('.w-cord'), wPlug = wire.querySelector('.w-plug'), v3 = new THREE.Vector3();
[wInk, wCord].forEach(p => p.setAttribute('pathLength', '1'));
function plugIn(el, ch, i, then) {
  const key = (onKeys(ch) ? CTRL.kb : CTRL[ch])?.[i];
  if (!key || reduceMotion) { then(); return }
  if (busy) return; busy = true; el.classList.add('plugged');
  const r = el.getBoundingClientRect(), st = stage.getBoundingClientRect(), side = innerWidth > 760; // the tray is on the right on desktop, at the bottom on phones
  key.getWorldPosition(v3).project(camera);
  const tx = Math.min(st.right - 24, Math.max(st.left + 24, st.left + (v3.x + 1) / 2 * st.width)), ty = Math.min(st.bottom - 24, Math.max(st.top + 70, st.top + (1 - v3.y) / 2 * st.height));
  const sx = side ? r.left + 6 : r.left + r.width / 2, sy = side ? r.top + r.height / 2 : r.top + 4, sag = Math.max(50, Math.hypot(sx - tx, sy - ty) * .22); // a cable lying on the bench: it leaves the box, droops, and comes up to the key
  const d = `M${sx} ${sy} C${sx - (side ? sag : 0)} ${sy + (side ? sag * .6 : -sag)},${tx + sag * .45} ${ty + sag * .7},${tx} ${ty}`;
  wInk.setAttribute('d', d); wCord.setAttribute('d', d); wPlug.setAttribute('cx', tx); wPlug.setAttribute('cy', ty); wire.style.setProperty('--c', CH[ch].col);
  wire.classList.remove('on', 'off'); void wire.getBoundingClientRect(); wire.classList.add('on');
  setTimeout(() => drum('rim'), 440);
  setTimeout(() => { busy = false; then(); wire.classList.add('off'); setTimeout(() => wire.classList.remove('on', 'off'), 320) }, 700);
}
/* hover preview: a project's lead image floats just under the row you point at (over the names below it), following the pointer
   sideways; keyboard focus shows it too. Fixed to the page so the panel never clips it. No preview on touch, or for items without images */
const peek = document.createElement('div'); peek.id = 'm-peek'; peek.hidden = true; peek.setAttribute('aria-hidden', 'true'); peek.innerHTML = '<img alt="">'; document.body.append(peek);
const pimg = peek.firstChild, PW = 260, PH = 163; let peekRow = null;
function showPeek(b, x) {
  const it = CH[level.ch]?.items[+b.dataset.item], src = it?.img?.[0]?.s; if (!src) { hidePeek(); return }
  if (peekRow !== b) { peekRow = b; peek.classList.remove('ok'); pimg.onload = () => peek.classList.add('ok'); pimg.src = src; if (pimg.complete) peek.classList.add('ok') }
  const r = b.getBoundingClientRect(), below = r.bottom + 6 + PH < innerHeight - 8; // hang below the row, or above it near the bottom of the screen
  const left = Math.min(innerWidth - PW - 8, Math.max(8, (x ?? r.left + r.width * .45) - PW * .35));
  peek.style.transform = `translate(${left}px,${below ? r.bottom + 6 : r.top - 6 - PH}px)`; peek.style.setProperty('--c', CH[level.ch].col); peek.hidden = false;
}
function hidePeek() { peekRow = null; peek.hidden = true; peek.classList.remove('ok') }
/* the dashed marker follows the pointer; it only follows keyboard focus once you've actually used the keyboard in the menu */
menu.addEventListener('keydown', e => { if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) menu.classList.add('kbd') });
menu.addEventListener('pointermove', () => menu.classList.remove('kbd'), { passive: true });
const syncHome = () => { $('home')?.setAttribute('data-at-home', String(!S.mode && !S.card)); // and keep the open box in step if the view changes while the menu is up
  body.querySelectorAll('.box[data-go],.box[data-mode]').forEach(b => { const h = isHere(b.dataset.go || 'mode:' + b.dataset.mode); b.classList.toggle('here', h); h ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current') }) };
function show(k, ch, i, direct) { const was = level.k; level = { k, ch, i, direct }; render(); if (was && was !== k) foley('page') } // moving between levels of the menu turns a page
/* cassettes knock against each other as the pointer passes from one to the next */
let overTape = null;
body.addEventListener('pointerover', e => { const b = e.target.closest?.('.tape'); if (b !== overTape) { overTape = b; if (b) foley('tap') } });
body.addEventListener('pointerleave', () => { overTape = null });

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
  if (!menuOpen()) return; label(false); S.menu = false; hidePeek(); const id = ++hideId;
  if (reduceMotion) { menu.hidden = true; return }
  menu.classList.add('out'); setTimeout(() => { if (id === hideId) { menu.hidden = true; menu.classList.remove('out') } }, 240);
}
/* Esc: up one level, then closed */
export function menuEsc() { if (level.k === 'mode') show(level.direct ? 'root' : 'projects'); else if (level.k === 'projects') show('root'); else { closeMenu(); mnu.focus() } }

mnu.onclick = () => { ensureAudio(); menuOpen() ? closeMenu() : openMenu() };
back.onclick = () => { drum('blip'); show(level.k === 'mode' && !level.direct ? 'projects' : 'root') };
body.addEventListener('click', e => {
  const b = e.target.closest('button.m-row'); if (!b) { if (e.target.closest('a.m-row')) closeMenu(); return }
  ensureAudio(); const { go, mode, item } = b.dataset;
  if (go === 'home') unbox(b, () => { closeMenu(); act.zoomOut() });
  else if (go === 'about') unbox(b, () => plugIn(b, 'ab', 0, () => { closeMenu(); act.journey('ab', 0) }));
  else if (go === 'contact') unbox(b, () => plugIn(b, 'cv', 1, () => { closeMenu(); act.journey('cv', 1) }));
  else if (go === 'projects') unbox(b, () => show('projects'));
  else if (go?.startsWith('mode:')) { const m = go.slice(5); if (CH[m]) { act.zoomTo(m); unbox(b, () => show('mode', m, undefined, true)) } } // a section straight from the top level
  else if (mode) { act.zoomTo(mode); unbox(b, () => show('mode', mode)) } // the camera flies to the keys while the box opens
  else if (item !== undefined) { const ch = level.ch; plugIn(b, ch, +item, () => { closeMenu(); act.journey(ch, +item) }) }
});
body.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const b = e.target.closest('[data-item]'); b ? showPeek(b, e.clientX) : hidePeek() });
body.addEventListener('pointerleave', hidePeek); body.addEventListener('scroll', hidePeek, { passive: true });
body.addEventListener('focusin', e => { const b = e.target.closest('[data-item]'); b && b.matches(':focus-visible') ? showPeek(b) : hidePeek() });
body.addEventListener('focusout', hidePeek);
document.addEventListener('pointerdown', e => { if (menuOpen() && !menu.contains(e.target) && !mnu.contains(e.target)) closeMenu() });
/* header Contact CTA: fly to the Contact synth, push its CONTACT key and open the Contact card */
$('ctaContact').onclick = () => { ensureAudio(); closeMenu(); act.journey('cv', 1, 'cta') };
$('brand').onclick = e => { e.preventDefault(); ensureAudio(); closeMenu(); if (S.mode || S.card || V.look) act.zoomOut() };
