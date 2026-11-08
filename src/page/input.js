/* Input: pointer picking, drags on knobs, taps on bare casing, the floating hover tip, and the computer keyboard as a synth. */
import * as THREE from 'three';
import { $, S, V, hits, act } from '../core/state.js';
import { CH, MODES, ORDER } from '../core/data.js';
import { ensureAudio, playNote, drum } from '../core/audio.js';
import { camera, controls, cv, stage } from '../core/scene.js';
import { press } from '../molecules/controls.js';
import { keyMeshes, sharpMeshes, PADS, wMidi } from '../organisms/synth.js';
import { GROUPS, groupAt } from '../organisms/underlights.js';
import { menuOpen, closeMenu } from '../organisms/menu.js';

export const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2(), lbl = $('lbl'), lb = $('lb');
/* the control under the pointer: walk up to whatever handles input, then follow a proxy (a tile passes clicks to its cap) */
function pick(e) {
  const r = cv.getBoundingClientRect(); ptr.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ptr, camera);
  let o = ray.intersectObjects(hits, true)[0]?.object; while (o && !o.userData.down && !o.userData.proxy) o = o.parent; return o?.userData.proxy || o;
}
const tipHTML = ({ userData: u }) => u.item ? (S.mode === u.ch ? CH[u.ch].items[u.i].t : `${MODES[u.ch].n}<small>Click to open</small>`) : u.tip;
let tap = null, live = '';
/* capture phase: runs before OrbitControls, so grabbing a control never also orbits the camera */
cv.addEventListener('pointerdown', e => {
  ensureAudio(); if (e.button > 0) return; // right drag pans, middle zooms
  const o = pick(e); if (!o) { const g = !S.mode && !S.card && groupAt(null, ray); if (g) tap = { g, x: e.clientX, y: e.clientY }; return }
  controls.enabled = false; V.drag = { o, x: e.clientX, y: e.clientY }; o.userData.down?.();
  if (e.pointerType !== 'mouse') { S.hover = o; S.hoverUntil = performance.now() + 1600 } try { cv.setPointerCapture(e.pointerId) } catch {}
}, { capture: true });
cv.addEventListener('pointermove', e => {
  const d = V.drag; if (d) { const dy = e.clientY - d.y, dx = e.clientX - d.x; d.y = e.clientY; d.x = e.clientX; d.o.userData.drag?.(-dy + dx * .5); live = d.o.userData.live?.() || ''; return }
  if (e.pointerType !== 'mouse') return; const o = pick(e); S.grp = S.mode || S.card ? null : groupAt(o, ray);
  cv.style.cursor = o || S.grp ? 'pointer' : 'grab'; S.hover = o || null; S.hoverUntil = Infinity;
});
const end = () => { if (!V.drag) return; V.drag = null; live = ''; if (!V.fly) controls.enabled = true };
cv.addEventListener('pointerup', e => { if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 6 && !S.mode) GROUPS[tap.g].go(); tap = null; end() });
cv.addEventListener('pointercancel', end);
cv.addEventListener('pointerleave', () => { if (!V.drag) S.hover = null; S.grp = null });

/* hover tip: follows the control, kept inside the window */
const v3 = new THREE.Vector3();
export function updateHover(now) {
  if (S.hover && now > S.hoverUntil && !V.drag) S.hover = null;
  const o = V.drag?.o || S.hover; if (!o) { lbl.hidden = true; return }
  o.getWorldPosition(v3); v3.y += .45; v3.project(camera);
  const html = live || tipHTML(o); lbl.hidden = false; if (lbl._h !== html) { lbl.innerHTML = html; lbl._h = html; lbl._half = lbl.offsetWidth / 2 + 8 }
  const w = stage.clientWidth, half = lbl._half;
  lbl.style.left = Math.min(w - half, Math.max(half, (v3.x + 1) / 2 * w)) + 'px'; lbl.style.top = (1 - v3.y) / 2 * stage.clientHeight + 'px';
}

/* keyboard: A–; white keys, W E T Y U O P sharps, Z–. drum pads, 1–7 modes, 0 overview, arrows step the card, Esc backs out */
const KW = 'asdfghjkl;', KS = { w: 0, e: 1, t: 2, y: 3, u: 4, o: 5, p: 6 }, KD = 'zxcvbnm,.', held = new Set();
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return; const k = e.key.toLowerCase();
  if (k === 'escape') { if (menuOpen()) { closeMenu(); $('mnu').focus() } else if (!lb.hidden) lb.hidden = true; else if (S.card) act.closeCard(); else if (S.mode) act.zoomOut(); return }
  if (held.has(k)) return; held.add(k);
  const one = k.length === 1, i = one ? KW.indexOf(k) : -1;
  if (i >= 0) { ensureAudio(); press(keyMeshes[i]); playNote(wMidi(i)) }
  else if (k in KS) { ensureAudio(); sharpMeshes[KS[k]]?.userData.down() }
  else if (one && KD.includes(k)) { ensureAudio(); drum(PADS[KD.indexOf(k)]) }
  else if (one && k >= '1' && k <= String(ORDER.length)) { ensureAudio(); act.zoomTo(ORDER[+k - 1]) }
  else if (k === '0') { ensureAudio(); act.zoomOut() }
  else if (S.card && (k === 'arrowright' || k === 'arrowleft')) act.openCard(S.card.ch, S.card.i + (k === 'arrowright' ? 1 : -1));
});
addEventListener('keyup', e => held.delete(e.key.toLowerCase()));
