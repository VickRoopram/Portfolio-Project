/* Control molecules: buttons that press down, item keys that hold a piece of the portfolio, knobs that shape the sound. */
import * as THREE from 'three';
import { S, hits, anim, CTRL, realCh, act } from '../core/state.js';
import { CH, MODES } from '../core/data.js';
import { P, PNAMES, ensureAudio, applyP, playNote } from '../core/audio.js';
import { rbox, cyl } from '../atoms/geometry.js';
import { M, C, STEEL } from '../atoms/materials.js';
import { printed, printedIcon } from '../atoms/labels.js';
import { fxOf, pulse } from './fx.js';
import { card, rnd } from '../atoms/craft.js';

/* NB: these set mesh.userData wholesale, so keep extra per-mesh data on the mesh itself (e.g. mesh.core), never in userData beforehand */
export function press(m) { pulse(m); const u = m.userData; if (u.by === undefined) return; u.ty = u.by - .07; setTimeout(() => u.ty = u.by, 150) }
/* a slow, deep push you can watch (the menu's project journey): the cap sinks almost flush with its tile and holds, then springs back */
export function push(m, hold = 420) { if (!m) return; pulse(m); const u = m.userData; if (u.by === undefined) return; u.ty = u.by - .09; clearTimeout(m.upT); m.upT = setTimeout(() => u.ty = u.by, hold) }
const sprung = m => ({ by: m.position.y, ty: m.position.y });
/* a plain control (own material, so it can flash on its own) */
export function pressable(mesh, onPress, tip) {
  mesh.material = mesh.material.clone(); fxOf(mesh);
  mesh.userData = { tip, ...sprung(mesh), down() { press(mesh); onPress() } }; hits.push(mesh); anim.push(mesh);
}
/* an item control: item i of channel ch ('kb' follows the keyboard's current mode). First click zooms to the mode, the next opens the card */
export function itemCtrl(mesh, ch, i, sound) {
  CTRL[ch][i] = mesh; mesh.sound = sound; mesh.material = mesh.material.clone(); mesh.material.emissive = new THREE.Color(MODES[realCh(ch)].glow); fxOf(mesh).managed = true;
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
/* the knob's wide lower disc: a second, bigger circle of card under the cap, cut by hand (so it has corners) */
const DISC = card('kraft', '#e6c796');
export function knurl(parent, r, h, y, proxy) { const k = cyl(r, r, h, DISC, 11); k.position.y = y; k.rotation.y = rnd(1); k.userData.proxy = proxy; parent.add(k); hits.push(k); return k }
/* a brass paper fastener (split pin) holding two layers of card together */
const BRASS = new THREE.MeshStandardMaterial({ color: '#c9a23a', roughness: .45, metalness: .6, envMapIntensity: .8 });
export function screw(parent, x, y, z, r = .075) {
  const s = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, .03, 14), BRASS); s.position.set(x, y, z); s.raycast = () => {}; parent.add(s);
  const sl = new THREE.Mesh(new THREE.BoxGeometry(r * 1.5, .012, r * .22), new THREE.MeshBasicMaterial({ color: '#2a1b12' })); sl.position.set(x, y + .017, z); sl.rotation.y = rnd(Math.PI); sl.raycast = () => {}; parent.add(sl);
}
/* a keycap with a printed legend: a word, or a coolicons glyph when glyph is set */
export function cap(w, d, r, label, { col = C.cap, ink, inkDark, size = 50, lw = .66, lh = .32, glyph } = {}) {
  const k = rbox(w, .1, d, .035, M(col, .5)), l = glyph ? printedIcon(glyph, lw, lh, ink, undefined, inkDark) : label && printed(label, lw, lh, ink, size, inkDark);
  if (l) { l.position.y = .051; l.rotation.z = rnd(.08, -.04); k.add(l) } return k;
}
/* a sound knob, made of card: a collar, a wide disc and a smaller cap (all cut by hand, so they have corners), a brass split pin through the middle and a red paper pointer. Drag up/down to set P[key]; click for a note.
   sm and lg are the two sizes on the hardware: [ring grow top, bottom, height] · [cap height, y] · [knurl grow, height, y] · [indicator width, length/r, z/r] */
const SIZE = { sm: { ring: [.1, .1, .05], cap: [.09, .185], kn: [.05, .09, .095], ind: [.05, .7, .5] },
               lg: { ring: [.22, .22, .07], cap: [.12, .25], kn: [.09, .12, .13], ind: [.08, .586, .517] } };
export function knob(parent, pos, r, key, size, note) {
  const z = SIZE[size], g = new THREE.Group(), rot = new THREE.Group(); g.position.copy(pos); parent.add(g); g.add(rot);
  const ring = cyl(r + z.ring[0], r + z.ring[1], z.ring[2], M(C.ring, .5), 13); ring.position.y = z.ring[2] / 2; ring.rotation.y = rnd(1); g.add(ring);
  const cp = cyl(r, r, z.cap[0], STEEL.clone(), 12); cp.position.y = z.cap[1]; rot.add(cp); knurl(rot, r + z.kn[0], z.kn[1], z.kn[2], cp);
  screw(rot, 0, z.cap[1] + z.cap[0] / 2 + .012, 0, r * .16); // the split pin it turns on
  const ind = new THREE.Mesh(new THREE.BoxGeometry(z.ind[0], .02, r * z.ind[1]), M('#d2451e')); ind.position.set(0, z.cap[1] + z.cap[0] / 2 + .01, -r * z.ind[2] - r * .08); rot.add(ind);
  ring.userData.proxy = ind.userData.proxy = cp; hits.push(ring, ind, cp); anim.push(rot); fxOf(cp);
  const set = () => { rot.userData.r = (.5 - P[key]) * 4.4 }; set(); rot.rotation.y = rot.userData.r;
  cp.userData = { tip: `${PNAMES[key]} · drag up or down`, live: () => `${PNAMES[key]} ${Math.round(P[key] * 100)}%`,
    down() { pulse(cp); ensureAudio(); if (note) playNote(...note) }, drag(d) { P[key] = Math.min(1, Math.max(0, P[key] + d / 180)); set(); applyP() } };
  return { g, rot, cp };
}
