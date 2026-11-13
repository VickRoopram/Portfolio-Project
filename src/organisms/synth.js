/* The synth: a 17 × 6.5 grid of tiles on an aluminium body. Screen, four sound knobs (each with a lit ring and their names below),
   speaker, transport, mode buttons, drum pads, keys. The top section (rows 0–1) has an extra half row under it so the knob names sit clear. */
import * as THREE from 'three';
import { S, V, ROWBTN, hits, act } from '../core/state.js';
import { CH, MODES } from '../core/data.js';
import { P, playNote, drum, toggleMute, toggleDemo, stopDemo, demo, track, BEATS } from '../core/audio.js';
import { scene } from '../core/scene.js';
import { rbox, cyl, flat } from '../atoms/geometry.js';
import { canvasTex, radialTex } from '../atoms/textures.js';
import { M, C, RUBBER, decal } from '../atoms/materials.js';
import { printed, engraved } from '../atoms/labels.js';
import { fxOf, FXMATS } from '../molecules/fx.js';
import { pressable, itemCtrl, knob, screw, cap } from '../molecules/controls.js';

export const synth = new THREE.Group(); scene.add(synth);
const TOP = .9, GX = c => -8 + c, GZ = r => -2.75 + r + (r >= 2 ? .5 : 0) /* rows 2+ sit half a row further forward */, at = (o, x, y, z) => { o.position.set(x, y, z); synth.add(o); return o };
export const casing = [at(rbox(18.9, .9, 7.8, .3, M(C.body, .55)), 0, .45, 0), at(rbox(18.9, .4, 7.8, .2, M(C.black, .5)), 0, .2, .14)];
at(rbox(17.25, .12, 6.75, .05, M(C.recess, .8)), 0, TOP, 0);
[[-9.2, -3.65], [9.2, -3.65], [-9.2, 3.65], [9.2, 3.65]].forEach(([x, z]) => screw(synth, x, .905, z));
/* a tile spanning w × h grid cells from column c, row r */
const tile = (c, r, w = 1, h = 1, mat = M(C.tile, .6)) => at(rbox(w - .07, .3, h - .07, .07, mat), GX(c) + (w - 1) / 2, TOP + .15, GZ(r) + (h - 1) / 2);
const capBtn = (c, r, label, onPress, tip, o) => { tile(c, r); const k = at(cap(.72, .72, .16, label, o), GX(c), TOP + .36, GZ(r)); pressable(k, onPress, tip); return k };
const onTile = (o, c, r, y = .305) => at(o, GX(c), TOP + y, GZ(r));

/* the top section is 2.5 rows deep; the right-hand column (detune, wave, beats, stop, mute) gets a blank half tile under it */
const UPPER = 2.5, upperZ = GZ(0) + (UPPER - 1) / 2;
at(rbox(3 - .07, .3, .5 - .07, .07, M(C.tile, .6)), GX(15), TOP + .15, GZ(1) + .75);

/* screen (clicks through to About) */
tile(0, 0, 4, UPPER, M(C.recess, .4));
export const scr = canvasTex(800, 380);
const scrP = at(flat(3.78, 1.8, decal(new THREE.MeshBasicMaterial({ map: scr.t, toneMapped: false }))), GX(1.5), TOP + .305, upperZ);
/* the screen opens the About page; while the Vickhal Roopram logo is up on it (screens.js, every 25–60 s) its tip invites the click
   and the click flies to the About key, presses it and opens the "about me" summary (the first About card) */
scrP.userData = { tip: 'Screen · click for the About page', tipHTML: () => V.logo > .5 ? 'Vickhal Roopram<small>Click to meet me</small>' : 'Screen · click for the About page',
  down() { if (V.logo > .3) act.journey('ab', 0, 'logo'); else { act.zoomTo('ab'); act.openCard('ab', 0) } } };

/* the four big sound knobs (drag up/down; click for a note), each in a 2 × 2.5 tile with its name underneath.
   While you adjust a knob, a lit ring fades in on its bezel, round the cap (where the press stroke runs): a dim track over the knob's travel, a brighter arc up to its value, and a light dot that
   follows the knob as it turns (updateSynth). It fades out about a second after you let go */
const RING_R = .73, RING_Y = .127, TRAVEL = 2.2, LED = '#ff5d1a'; // on the top of the knob's brass bezel, round the cap
const dotTex = radialTex([[0, 1], [.3, .55], [1, 0]], 128, 128);
const ringMat = o => decal(new THREE.MeshBasicMaterial({ color: LED, transparent: true, depthWrite: false, toneMapped: false, ...o }));
export const KNOB_RINGS = [];
[['cutoff', 'FILTER'], ['q', 'RESONANCE'], ['decay', 'DECAY'], ['wet', 'ECHO']].forEach(([key, label], i) => {
  const c = 4 + i * 2; tile(c, 0, 2, UPPER);
  const { g, rot, cp } = knob(synth, new THREE.Vector3(GX(c + .5), TOP + .3, GZ(0) + .48), .58, key, 'lg', [[48, 52, 55, 60][i], 1.2]);
  const L = printed(label, 1.6, .32, '#7b7e86', 40); L.position.set(0, .01, 1.3); g.add(L);
  // arcs lie flat on the tile; angle t on the ring = knob turn a + π/2 (a = 0 points straight back, like the knob's indicator)
  const track = new THREE.Mesh(new THREE.RingGeometry(RING_R - .022, RING_R + .022, 72, 1, Math.PI / 2 - TRAVEL, TRAVEL * 2), ringMat({ opacity: .35 }));
  const value = new THREE.Mesh(new THREE.BufferGeometry(), ringMat({ opacity: .85 }));
  const dot = new THREE.Mesh(new THREE.CircleGeometry(.055, 20), ringMat({ color: '#fff3e6' }));
  const glow = flat(.42, .42, ringMat({ map: dotTex, opacity: .9 }));
  [track, value].forEach(m => { m.rotation.x = -Math.PI / 2; m.position.y = RING_Y; m.renderOrder = 2; g.add(m) });
  dot.rotation.x = -Math.PI / 2; dot.position.y = RING_Y + .004; dot.renderOrder = 3; glow.position.y = RING_Y + .002; glow.renderOrder = 2; g.add(dot, glow);
  FXMATS.push(track.material, value.material, glow.material);
  [track, value, dot, glow].forEach(m => { m.material.userData.op = m.material.opacity; m.visible = false });
  KNOB_RINGS.push({ rot, cp, value, dot, glow, parts: [track, value, dot, glow], a: null, last: -1e9, k: 0 });
});

/* speaker grille, pulsing with the music */
tile(12, 0, 2, UPPER);
export const grille = at(flat(1.7, 1.7, decal(new THREE.MeshBasicMaterial({ transparent: true, color: '#0e0f11', map: canvasTex(256, 256, x => { x.fillStyle = '#fff';
  for (let i = 0; i < 11; i++) for (let j = 0; j < 11; j++) if ((i - 5) ** 2 + (j - 5) ** 2 <= 27) { x.beginPath(); x.arc(28 + i * 20, 28 + j * 20, 5.2, 0, 7); x.fill() } }).t }))), GX(12.5), TOP + .305, upperZ);

/* detune knob, waveform, beats, stop, mute */
tile(14, 0, 2, 1); knob(synth, new THREE.Vector3(GX(14), TOP + .3, GZ(0)), .3, 'detune', 'sm', [60, .6]);
onTile(printed('DETUNE', .6, .29), 15, 0, .31);
capBtn(14, 1, 'WAVE', () => { P.wave = (P.wave + 1) % 3; playNote(67, .4) }, 'Waveform: triangle / square / saw');
const beatsBtn = capBtn(15, 1, 'BEATS', toggleDemo, `Beats · each click plays the next of ${BEATS.length} tracks`);
const stopBtn = capBtn(16, 0, 'STOP', () => { stopDemo(); drum('rim') }, 'Stop the music');
{ const sq = flat(.11, .11, decal(new THREE.MeshBasicMaterial({ color: '#d71920' }))); sq.position.set(0, .082, -.27); stopBtn.add(sq) }
[stopBtn, beatsBtn].forEach(m => { m.material.emissive = new THREE.Color('#ff5d1a'); fxOf(m).managed = true });
capBtn(16, 1, 'MUTE', toggleMute, 'Sound on / off');

/* mode buttons: solid rubber caps with engraved white legends; light leaks from the gap, plus a dim core under a translucent top */
const coreTex = radialTex([[0, .9], [.45, .4], [1, 0]], 256, 64);
[['gd', 'DESIGN'], ['ux', 'UI/UX'], ['mo', 'MOTION'], ['tl', 'TOOLS'], ['xp', 'EXPERIMENTAL']].forEach(([f, label], j) => {
  const W = 17 / 5, x = -8.5 + W * (j + .5), glow = MODES[f].glow;
  const t = at(rbox(W - .07, .3, .93, .07, M(C.tile, .6)), x, TOP + .15, GZ(2));
  const k = at(rbox(W - .3, .16, .72, .16, RUBBER()), x, TOP + .36, GZ(2));
  k.core = flat(W - .62, .5, decal(new THREE.MeshBasicMaterial({ map: coreTex, color: glow, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })), .082); k.core.visible = false; k.coreK = 0;
  const l = engraved(label, W - .5, .5, 30); l.position.y = .084; l.renderOrder = 1; k.add(k.core, l); FXMATS.push(k.core.material);
  pressable(k, () => { playNote(72 + [0, 4, 7, 11, 14][j], .5); act.zoomTo(f) }, `${CH[f].name} · ${MODES[f].n}`); // after the core: pressable replaces userData
  k.userData.filter = f; t.userData.proxy = k; hits.push(t); k.material.emissive = new THREE.Color(glow); fxOf(k).managed = true; ROWBTN.push([k, f]);
});

/* drum pads (graphite caps, light print) */
export const PADS = ['kick', 'snare', 'hat', 'clap', 'tom', 'rim', 'shaker', 'crash', 'blip'];
PADS.forEach((p, i) => capBtn(14 + i % 3, 3 + Math.floor(i / 3), p.toUpperCase(), () => drum(p), `Drum pad · ${p}`, { col: C.pad, ink: '#efe4cf', inkDark: '#cdbfa6' }));

/* the keyboard: 14 white keys hold the current mode's projects; sharps just play */
const WHITE = [0, 2, 4, 5, 7, 9, 11], SHARP = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 };
export const wMidi = i => 60 + 12 * Math.floor(i / 7) + WHITE[i % 7];
export const keyMeshes = [], sharpMeshes = [];
for (let i = 0; i < 14; i++) {
  tile(i, 3); const kt = tile(i, 4, 1, 2), k = at(rbox(.76, .16, 1.62, .26, M(C.cap, .5)), GX(i), TOP + .36, GZ(4.5));
  kt.userData.proxy = k; hits.push(kt); keyMeshes.push(k); itemCtrl(k, 'kb', i, () => playNote(wMidi(i)));
  if (i < 13 && SHARP[i % 7] !== undefined) { const m = 60 + 12 * Math.floor(i / 7) + SHARP[i % 7], s = at(cyl(.3, .3, .18, M('#111214', .35)), GX(i) + .5, TOP + .4, GZ(3));
    pressable(s, () => playNote(m), 'Sharp key'); sharpMeshes.push(s) }
}
for (let i = 0; i < 10; i++) at(cyl(.035, .035, .02, M('#6a6c72')), 9.18, .91, -1.2 + i * .22);
hits.push(scrP);

/* lights: the transport pulses on the beat; a mode button lights its gap when hovered or active, with its soft core easing in */
export function updateSynth(t) {
  /* knob rings: the dot rides the knob's (eased) turn; the value arc is rebuilt only when the turn changes */
  const now = performance.now(), dt = Math.min(.05, (now - (updateSynth.last ?? now)) / 1000); updateSynth.last = now;
  for (const R of KNOB_RINGS) {
    const a = R.rot.rotation.y, x = -Math.sin(a) * RING_R, z = -Math.cos(a) * RING_R;
    /* shown while it's being dragged or still turning, then a fade out */
    if (V.drag?.o === R.cp || (R.a !== null && Math.abs(R.a - a) > .004)) R.last = now;
    const want = now - R.last < 900 ? 1 : 0; R.k += (want - R.k) * Math.min(1, dt * (want ? 9 : 2.5));
    const on = R.k > .01; R.parts.forEach(m => { m.visible = on; m.material.opacity = m.material.userData.op * R.k });
    if (!on) { R.a = a; continue }
    R.dot.position.x = R.glow.position.x = x; R.dot.position.z = R.glow.position.z = z;
    R.glow.material.opacity = (.75 + .2 * Math.sin(t * 2.4)) * R.k; // a slow breathe so it reads as lit
    if (R.a === null || Math.abs(R.a - a) > .004) { R.a = a; R.value.geometry.dispose(); R.value.geometry = new THREE.RingGeometry(RING_R - .028, RING_R + .028, 64, 1, a + Math.PI / 2, Math.max(.001, TRAVEL - a)) }
  }
  const beat = demo ? .4 + .25 * Math.max(0, Math.sin(t * Math.PI * 2 * (BEATS[track]?.bpm || 120) / 60)) : 0;
  stopBtn.material.emissiveIntensity = beatsBtn.material.emissiveIntensity = beat;
  for (const [m, k] of ROWBTN) {
    let edge = S.mode === k ? .85 + .08 * Math.sin(t * 3) : 0;
    if (S.card?.ch === k || S.hover === m || S.mode === k && S.hover?.userData?.item && S.hover.userData.ch === k) edge = 1;
    m.userData.edge = edge; m.material.emissiveIntensity = edge ? .035 : 0; // the solid cap itself only shows a faint glow
    m.coreK += ((edge ? 1 : 0) - m.coreK) * .12; m.core.material.opacity = m.coreK * edge * .32; m.core.visible = m.core.material.opacity > .003;
  }
}
