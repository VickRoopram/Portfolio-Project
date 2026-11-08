/* The synth: a 17 × 6 grid of tiles on an aluminium body. Screen, four sound knobs, speaker, transport, mode buttons, drum pads, keys. */
import * as THREE from 'three';
import { S, V, ROWBTN, hits, act } from '../core/state.js';
import { CH, MODES } from '../core/data.js';
import { P, playNote, drum, toggleMute, toggleDemo, stopDemo, demo, track, TRACKS } from '../core/audio.js';
import { scene } from '../core/scene.js';
import { rbox, cyl, flat } from '../atoms/geometry.js';
import { canvasTex, radialTex } from '../atoms/textures.js';
import { M, C, RUBBER, themed, decal } from '../atoms/materials.js';
import { printed, engraved } from '../atoms/labels.js';
import { fxOf, FXMATS } from '../molecules/fx.js';
import { pressable, itemCtrl, knob, screw, cap } from '../molecules/controls.js';

export const synth = new THREE.Group(); scene.add(synth);
const TOP = .9, GX = c => -8 + c, GZ = r => -2.5 + r, at = (o, x, y, z) => { o.position.set(x, y, z); synth.add(o); return o };
export const casing = [at(rbox(18.9, .9, 7.3, .3, M(C.body, .55)), 0, .45, 0), at(rbox(18.9, .4, 7.3, .2, M(C.black, .5)), 0, .2, .14)];
at(rbox(17.25, .12, 6.25, .05, M(C.recess, .8)), 0, TOP, 0);
[[-9.2, -3.4], [9.2, -3.4], [-9.2, 3.4], [9.2, 3.4]].forEach(([x, z]) => screw(synth, x, .905, z));
/* a tile spanning w × h grid cells from column c, row r */
const tile = (c, r, w = 1, h = 1, mat = M(C.tile, .6)) => at(rbox(w - .07, .3, h - .07, .07, mat), GX(c) + (w - 1) / 2, TOP + .15, GZ(r) + (h - 1) / 2);
const capBtn = (c, r, label, onPress, tip, o) => { tile(c, r); const k = at(cap(.72, .72, .16, label, o), GX(c), TOP + .36, GZ(r)); pressable(k, onPress, tip); return k };
const onTile = (o, c, r, y = .305) => at(o, GX(c), TOP + y, GZ(r));

/* screen (clicks through to About) */
tile(0, 0, 4, 2, M(C.recess, .4));
export const scr = canvasTex(800, 380);
const scrP = onTile(flat(3.78, 1.8, decal(new THREE.MeshBasicMaterial({ map: scr.t, toneMapped: false }))), 1.5, .5);
scrP.userData = { tip: 'Screen · click for the About page', down() { act.zoomTo('ab'); act.openCard('ab', 0) } };

/* the four big sound knobs (drag up/down; click for a note). Set back a little so their legends sit clear of the mode row */
[['cutoff', 'FILTER'], ['q', 'RESONANCE'], ['decay', 'DECAY'], ['wet', 'ECHO']].forEach(([key, label], i) => {
  const c = 4 + i * 2; tile(c, 0, 2, 2);
  const { g } = knob(synth, new THREE.Vector3(GX(c + .5), TOP + .3, GZ(.5) - .08), .58, key, 'lg', [[48, 52, 55, 60][i], 1.2]);
  const L = printed(label, 1.5, .3, '#7b7e86', 40); L.position.set(0, .01, .98); g.add(L);
});

/* speaker grille, pulsing with the music */
tile(12, 0, 2, 2);
export const grille = onTile(flat(1.7, 1.7, decal(themed(new THREE.MeshBasicMaterial({ transparent: true, color: '#3a3b40', map: canvasTex(256, 256, x => { x.fillStyle = '#fff';
  for (let i = 0; i < 11; i++) for (let j = 0; j < 11; j++) if ((i - 5) ** 2 + (j - 5) ** 2 <= 27) { x.beginPath(); x.arc(28 + i * 20, 28 + j * 20, 5.2, 0, 7); x.fill() } }).t }), '#3a3b40', '#0e0f11'))), 12.5, .5);

/* detune knob, waveform, beats, stop, mute */
tile(14, 0, 2, 1); knob(synth, new THREE.Vector3(GX(14), TOP + .3, GZ(0)), .3, 'detune', 'sm', [60, .6]);
onTile(printed('DETUNE', .6, .29), 15, 0, .31);
capBtn(14, 1, 'WAVE', () => { P.wave = (P.wave + 1) % 3; playNote(67, .4) }, 'Waveform: triangle / square / saw');
const beatsBtn = capBtn(15, 1, 'BEATS', toggleDemo, 'Beats · each click plays the next of 5 tracks');
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
  const dark = V.themeK > .5;
  const beat = demo ? .4 + .25 * Math.max(0, Math.sin(t * Math.PI * 2 * (TRACKS[track]?.bpm || 120) / 60)) : 0;
  stopBtn.material.emissiveIntensity = beatsBtn.material.emissiveIntensity = beat;
  for (const [m, k] of ROWBTN) {
    let edge = S.mode === k ? .85 + .08 * Math.sin(t * 3) : 0;
    if (S.card?.ch === k || S.hover === m || S.mode === k && S.hover?.userData?.item && S.hover.userData.ch === k) edge = 1;
    m.userData.edge = edge; m.material.emissiveIntensity = edge ? .035 : 0; // the solid cap itself only shows a faint glow
    m.coreK += ((edge ? 1 : 0) - m.coreK) * .12; m.core.material.opacity = m.coreK * edge * (dark ? .32 : .22); m.core.visible = m.core.material.opacity > .003;
  }
}
