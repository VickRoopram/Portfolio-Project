/* Control molecules: buttons that press down, item keys that hold a piece of the portfolio, knobs that shape the sound. */
import * as THREE from 'three';
import { S, hits, anim, CTRL, realCh, act } from '../core/state.js';
import { CH, MODES } from '../core/data.js';
import { P, PNAMES, ensureAudio, applyP, playNote } from '../core/audio.js';
import { rbox, cyl } from '../atoms/geometry.js';
import { M, C, STEEL, KNURL } from '../atoms/materials.js';
import { printed } from '../atoms/labels.js';
import { fxOf, pulse } from './fx.js';

/* NB: these set mesh.userData wholesale, so keep extra per-mesh data on the mesh itself (e.g. mesh.core), never in userData beforehand */
export function press(m) { pulse(m); const u = m.userData; if (u.by === undefined) return; u.ty = u.by - .07; setTimeout(() => u.ty = u.by, 150) }
const sprung = m => ({ by: m.position.y, ty: m.position.y });
/* a plain control (own material, so it can flash on its own) */
export function pressable(mesh, onPress, tip) {
  mesh.material = mesh.material.clone(); fxOf(mesh);
  mesh.userData = { tip, ...sprung(mesh), down() { press(mesh); onPress() } }; hits.push(mesh); anim.push(mesh);
}
/* an item control: item i of channel ch ('kb' follows the keyboard's current mode). First click zooms to the mode, the next opens the card */
export function itemCtrl(mesh, ch, i, sound) {
  CTRL[ch][i] = mesh; mesh.material = mesh.material.clone(); mesh.material.emissive = new THREE.Color(MODES[realCh(ch)].glow); fxOf(mesh).managed = true;
  const has = () => i < CH[realCh(ch)].items.length;
  mesh.userData = { get ch() { return realCh(ch) }, i, get item() { return has() }, tip: 'Play a note', ...sprung(mesh),
    down() { sound?.(); press(mesh); if (!has()) return; const c = realCh(ch); S.mode !== c ? act.zoomTo(c) : act.openCard(c, i) } };
  hits.push(mesh); anim.push(mesh);
}
/* glow of the item controls: lit while their mode is on, brighter on hover and for the open card */
export function updateItemGlow(t) {
  for (const g in CTRL) { const ch = realCh(g), n = CH[ch].items.length, peek = g === 'kb' && S.hover?.userData?.filter;
    CTRL[g].forEach((m, j) => { if (!m) return; const mt = m.material;
      if (peek && peek !== ch) { mt.emissive.set(MODES[peek].glow); mt.emissiveIntensity = j < CH[peek].items.length ? .3 : 0; return } // preview a hovered mode button's keys
      if (g === 'kb') { mt.emissive.set(MODES[ch].glow); if (j >= n) { mt.emissiveIntensity = 0; return } }
      let e = 0;
      if (S.mode === ch) e = S.hover === m ? .55 : .45 + .12 * Math.sin(t * 3 + j * .5);
      else if (!S.mode && S.hover?.userData.ch === ch) e = .22;
      if (S.card?.ch === ch && S.card.i === j) e = .7;
      mt.emissiveIntensity = e });
  }
}
export function knurl(parent, r, h, y, proxy) { const k = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64, 1, true), KNURL); k.position.y = y; k.castShadow = true; k.userData.proxy = proxy; parent.add(k); hits.push(k); return k }
export function screw(parent, x, y, z) {
  const s = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .025, 20), M(C.ring)); s.position.set(x, y, z); parent.add(s);
  const sl = new THREE.Mesh(new THREE.BoxGeometry(.11, .012, .022), new THREE.MeshStandardMaterial({ color: '#55575c' })); sl.position.set(x, y + .014, z); sl.rotation.y = Math.random() * Math.PI; parent.add(sl);
}
/* a square keycap with a printed legend */
export function cap(w, d, r, label, { col = C.cap, ink, inkDark, size = 50, lw = .66, lh = .32 } = {}) {
  const k = rbox(w, .16, d, r, M(col, .5)); if (label) { const l = printed(label, lw, lh, ink, size, inkDark); l.position.y = .081; k.add(l) } return k;
}
/* a sound knob: brass ring, forged steel cap, knurled band and an indicator. Drag up/down to set P[key]; click for a note.
   sm and lg are the two sizes on the hardware: [ring grow top, bottom, height] · [cap height, y] · [knurl grow, height, y] · [indicator width, length/r, z/r] */
const SIZE = { sm: { ring: [.08, .1, .08], cap: [.3, .22], kn: [.028, .2, .17], ind: [.04, .7, .5] },
               lg: { ring: [.22, .26, .12], cap: [.42, .33], kn: [.05, .26, .26], ind: [.07, .586, .517] } };
export function knob(parent, pos, r, key, size, note) {
  const z = SIZE[size], g = new THREE.Group(), rot = new THREE.Group(); g.position.copy(pos); parent.add(g); g.add(rot);
  const ring = cyl(r + z.ring[0], r + z.ring[1], z.ring[2], M(C.ring, .5)); ring.position.y = z.ring[2] / 2; g.add(ring);
  const cp = cyl(r, r + .02, z.cap[0], STEEL.clone()); cp.position.y = z.cap[1]; rot.add(cp); knurl(rot, r + z.kn[0], z.kn[1], z.kn[2], cp);
  const ind = new THREE.Mesh(new THREE.BoxGeometry(z.ind[0], .02, r * z.ind[1]), M('#1d1e21', .5)); ind.position.set(0, z.cap[1] + z.cap[0] / 2 + .01, -r * z.ind[2]); rot.add(ind);
  ring.userData.proxy = ind.userData.proxy = cp; hits.push(ring, ind, cp); anim.push(rot); fxOf(cp);
  const set = () => { rot.userData.r = (.5 - P[key]) * 4.4 }; set(); rot.rotation.y = rot.userData.r;
  cp.userData = { tip: `${PNAMES[key]} · drag up or down`, live: () => `${PNAMES[key]} ${Math.round(P[key] * 100)}%`,
    down() { pulse(cp); ensureAudio(); if (note) playNote(...note) }, drag(d) { P[key] = Math.min(1, Math.max(0, P[key] + d / 180)); set(); applyP() } };
  return { g, rot, cp };
}
