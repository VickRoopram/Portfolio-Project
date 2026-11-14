/* Control molecules: buttons that press down, item keys that hold a piece of the portfolio, knobs that shape the sound. */
import * as THREE from 'three';
import { S, hits, anim, CTRL, realCh, act } from '../core/state.js';
import { CH, MODES } from '../core/data.js';
import { P, PNAMES, ensureAudio, applyP, playNote } from '../core/audio.js';
import { rbox, cyl, flat } from '../atoms/geometry.js';
import { M, C, STEEL } from '../atoms/materials.js';
import { printed, printedIcon } from '../atoms/labels.js';
import { fxOf, pulse } from './fx.js';
import { card, rnd, sketch, INK } from '../atoms/craft.js';
import { canvasTex } from '../atoms/textures.js';
import { decal } from '../atoms/materials.js';

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
/* a fixing, drawn on in pencil (no real nails or pins on a paper model): a little circle with a cross in it */
const PIN = canvasTex(64, 64, x => { x.strokeStyle = '#2a1b12'; x.lineWidth = 5; x.lineCap = 'round'; sketch(x, Array.from({ length: 13 }, (_, i) => [32 + Math.cos(i / 12 * 6.4) * 21, 32 + Math.sin(i / 12 * 6.4) * 21]), { jit: 1.2 });
  x.lineWidth = 4; sketch(x, [[20, 22], [44, 42]], { jit: 1 }); sketch(x, [[43, 21], [21, 43]], { jit: 1 }) }).t;
export function screw(parent, x, y, z, r = .085) {
  const s = flat(r * 2.4, r * 2.4, decal(new THREE.MeshBasicMaterial({ map: PIN, transparent: true, depthWrite: false })), y + .004); s.position.x = x; s.position.z = z; s.rotation.z = rnd(3); s.raycast = () => {}; s.renderOrder = 2; parent.add(s);
}
/* a keycap with a printed legend: a word, or a coolicons glyph when glyph is set */
export function cap(w, d, r, label, { col = C.cap, ink, inkDark, size = 50, lw = .66, lh = .32, glyph } = {}) {
  const k = rbox(w, .1, d, .035, M(col, .5)), l = glyph ? printedIcon(glyph, lw, lh, ink, undefined, inkDark) : label && printed(label, lw, lh, ink, size, inkDark);
  if (l) { l.position.y = .051; l.rotation.z = rnd(.08, -.04); k.add(l) } return k;
}
/* a sound knob, made of card: a collar, a wide disc and a smaller cap (all cut by hand, so they have corners), a pin drawn in the middle and a red paper pointer. The big ones (size 'lg') aren't built at all: they're drawn on the card (drawnKnob). Drag up/down to set P[key]; click for a note.
   sm and lg are the two sizes on the hardware: [ring grow top, bottom, height] · [cap height, y] · [knurl grow, height, y] · [indicator width, length/r, z/r] */
const SIZE = { sm: { ring: [.1, .1, .05], cap: [.09, .185], kn: [.05, .09, .095], ind: [.05, .7, .5] },
               lg: { ring: [.22, .22, .07], cap: [.12, .25], kn: [.09, .12, .13], ind: [.08, .586, .517] } };
/* a big knob isn't a thing at all: it's drawn on the card. dialBase = what stays put (a ring, tick marks round its travel, drawn in pencil);
   dialTurn = what turns with the value (the knob's circle, a pointer, a few hatch lines). Both are white, tinted by their material:
   ink normally, red marker while you're on it (the organism sets cp.hot / reads V.drag: see updateSynth) */
const dial = draw => canvasTex(320, 320, x => { x.translate(160, 160); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineCap = x.lineJoin = 'round'; draw(x) }).t;
const ringPts = (R, j = 0, n = 26, turns = 1.06) => Array.from({ length: n + 1 }, (_, i) => { const a = i / n * Math.PI * 2 * turns, rr = R + rnd(j * 2, -j); return [Math.cos(a) * rr, Math.sin(a) * rr] });
const dialBase = () => dial(x => { x.lineWidth = 5; sketch(x, ringPts(132, 2.5), { jit: 1.5 });
  x.lineWidth = 5; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 - 2.2 + i * .44, r0 = 140, r1 = i % 5 ? 150 : 157; x.beginPath(); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); x.lineTo(Math.cos(a + rnd(.04, -.02)) * r1, Math.sin(a) * r1); x.stroke() } });
const dialTurn = () => dial(x => { x.lineWidth = 9; sketch(x, ringPts(96, 2), { jit: 1.5 }); x.lineWidth = 5; sketch(x, ringPts(22, 1.5, 12), { jit: 1, passes: 1 });
  x.lineWidth = 12; sketch(x, [[0, -30], [0, -112]], { jit: 2 });                                    // the pointer (straight back = canvas up)
  x.lineWidth = 3.5; x.globalAlpha = .7; for (let i = 0; i < 9; i++) { const a = .6 + i * .52, r0 = 44 + rnd(10), r1 = r0 + 26 + rnd(14); x.beginPath(); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); x.lineTo(Math.cos(a + .1) * r1, Math.sin(a + .1) * r1); x.stroke() } });
function drawnKnob(parent, pos, r, key, note) {
  const g = new THREE.Group(), rot = new THREE.Group(), R = r * 1.72; g.position.copy(pos); g.position.y += .004; g.rotation.y = rnd(.1, -.05); parent.add(g); g.add(rot);
  const ink = () => decal(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, color: INK }));
  const base = flat(R * 2, R * 2, Object.assign(ink(), { map: dialBase() }), .002); base.raycast = () => {}; g.add(base);
  /* the part that turns is also what you grab: a flat disc, so the pointer finds it */
  const geo = new THREE.CircleGeometry(R * .82, 28); geo.rotateX(-Math.PI / 2); geo.userData.rr = { w: R * 1.64, h: .01, d: R * 1.64, r: R * .82 };
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, .5 + (uv.getX(i) - .5) * .82, .5 + (uv.getY(i) - .5) * .82); // the disc shows the middle 82% of the drawing
  const cp = new THREE.Mesh(geo, Object.assign(ink(), { map: dialTurn() })); cp.position.y = .006; cp.renderOrder = 2; cp.noCut = true; cp.base = base; rot.add(cp);
  hits.push(cp); anim.push(rot); fxOf(cp);
  const set = () => { rot.userData.r = (.5 - P[key]) * 4.4 }; set(); rot.rotation.y = rot.userData.r;
  cp.userData = { tip: `${PNAMES[key]} · drag up or down`, live: () => `${PNAMES[key]} ${Math.round(P[key] * 100)}%`,
    down() { cp.hot = performance.now(); pulse(cp); ensureAudio(); if (note) playNote(...note) }, drag(d) { cp.hot = performance.now(); P[key] = Math.min(1, Math.max(0, P[key] + d / 180)); set(); applyP() } };
  return { g, rot, cp };
}
export function knob(parent, pos, r, key, size, note) {
  if (size === 'lg') return drawnKnob(parent, pos, r, key, note);

  const z = SIZE[size], g = new THREE.Group(), rot = new THREE.Group(); g.position.copy(pos); parent.add(g); g.add(rot);
  const ring = cyl(r + z.ring[0], r + z.ring[1], z.ring[2], M(C.ring, .5), 13); ring.position.y = z.ring[2] / 2; ring.rotation.y = rnd(1); g.add(ring);
  const cp = cyl(r, r, z.cap[0], STEEL.clone(), 12); cp.position.y = z.cap[1]; rot.add(cp); knurl(rot, r + z.kn[0], z.kn[1], z.kn[2], cp);
  screw(rot, 0, z.cap[1] + z.cap[0] / 2 + .002, 0, r * .2); // the pin it turns on, drawn on
  const ind = new THREE.Mesh(new THREE.BoxGeometry(z.ind[0], .02, r * z.ind[1]), M('#d2451e')); ind.position.set(0, z.cap[1] + z.cap[0] / 2 + .01, -r * z.ind[2] - r * .08); rot.add(ind);
  ring.userData.proxy = ind.userData.proxy = cp; hits.push(ring, ind, cp); anim.push(rot); fxOf(cp);
  const set = () => { rot.userData.r = (.5 - P[key]) * 4.4 }; set(); rot.rotation.y = rot.userData.r;
  cp.userData = { tip: `${PNAMES[key]} · drag up or down`, live: () => `${PNAMES[key]} ${Math.round(P[key] * 100)}%`,
    down() { pulse(cp); ensureAudio(); if (note) playNote(...note) }, drag(d) { P[key] = Math.min(1, Math.max(0, P[key] + d / 180)); set(); applyP() } };
  return { g, rot, cp };
}
