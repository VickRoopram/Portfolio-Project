/* The remote: screen, master volume, Contact and four social keys. Its cable plugs into the synth while the remote is in focus.
   In jam mode (organisms/jam.js) it's the looper's transport: the same places hold REC and PLAY, STOP, UNDO, CLEAR, and the knob sets the tempo.
   RC keeps both sets so jam.js can swap them. */
import * as THREE from 'three';
import { S, act } from '../core/state.js';
import { playNote, drum } from '../core/audio.js';
import { scene } from '../core/scene.js';
import { rbox, flat } from '../atoms/geometry.js';
import { canvasTex } from '../atoms/textures.js';
import { M, C, decal } from '../atoms/materials.js';
import { itemCtrl, pressable, knob, boardCap } from '../molecules/controls.js';
import { cable, socket } from '../molecules/cable.js';
import { wonk, tape } from '../atoms/craft.js';

export const RM = new THREE.Group(); RM.position.set(-11.7, 0, .15); scene.add(RM);
const at = (o, x, y, z) => { o.position.set(x, y, z); RM.add(o); return o };
export const casing = at(rbox(2.15, .75, 6.6, .09, M(C.body, .55)), 0, .375, 0);
at(rbox(1.95, .1, 6.4, .05, M(C.recess, .8)), 0, .75, 0);
const tile = (w, d, x, z) => wonk(at(rbox(w - .07, .26, d - .07, .03, M(C.tile, .6)), x, .88, z), .01, .008);

tile(1.9, 1.3, 0, -2.5); export const rs = canvasTex(300, 200);
at(flat(1.74, 1.14, decal(new THREE.MeshBasicMaterial({ map: rs.t, toneMapped: false, transparent: true }))), 0, 1.015, -2.5);
export const RC = { folio: [], jam: [] }; const own = (set, o) => { RC[set].push(o); o.visible = set === 'folio'; return o };
tile(1.9, 1.7, 0, -1); own('folio', knob(RM, new THREE.Vector3(0, 1.01, -1), .44, 'vol', 'sm').g); own('jam', knob(RM, new THREE.Vector3(0, 1.01, -1), .44, 'tempo', 'sm').g); // master volume · jam: tempo
tile(1.9, .9, 0, .35); itemCtrl(own('folio', wonk(at(boardCap(1.5, .52, 'CONTACT', { paint: '#e0301a', size: 46, lw: .9, lh: .25 }), 0, 1.1, .35), .04, .02)), 'cv', 1, () => drum('clap'));
pressable(own('jam', wonk(at(boardCap(1.5, .52, 'REC', { paint: '#e0301a', size: 46, lw: .9, lh: .25 }), 0, 1.1, .35), .04, .02)), () => act.loop('rec'), 'Record · play, and it loops. Again to stop recording');
[['behance', -.47, 1.3], ['instagram', .47, 1.3], ['linkedin', -.47, 2.25], ['more-horizontal', .47, 2.25]].forEach(([glyph, x, z], j) => {
  tile(.95, .95, x, z); itemCtrl(own('folio', wonk(at(boardCap(.68, .68, null, { glyph, paint: '#e0301a', lw: .6, lh: .3 }), x, 1.1, z), .09, .035)), 'cv', 2 + j, () => playNote(67 + [0, 2, 4, 7][j], .5));
  const [word, tip] = [['PLAY', 'Play the loop'], ['STOP', 'Stop the loop'], ['UNDO', 'Take off the last layer'], ['CLEAR', 'Wipe the loop']][j];
  pressable(own('jam', wonk(at(boardCap(.68, .68, word, { paint: '#3a2a20', size: 30, lw: .62, lh: .24 }), x, 1.1, z), .09, .035)), () => act.loop(word.toLowerCase()), tip);
});
/* tape: holding the panel in, and the cable down where it leaves the box */
[[0, 2.98, 0, 1.3], [-.98, -1.6, 1.57, .9], [.98, .6, 1.57, .9]].forEach(([x, z, r, w]) => tape(RM, x, .808, z, w, .34, r));
cable([[-11.7, .3, 3.45], [-11.6, .12, 4.5], [-11.05, .1, 5.2], [-10.15, .1, 5.3], [-9.35, .1, 5.8], [-8.95, .11, 6.55]], // loose: a short lead trailing off the mat
      [[-11.7, .3, 3.45], [-11.6, .12, 4.4], [-11, .1, 4.6], [-10.4, .1, 3.4], [-10.25, .3, 1.5], [-9.75, .45, 1.5]], '#e0301a', .085, () => S.mode === 'cv' || S.play, socket([-9.5, .45, 1.5], [0, 0, Math.PI / 2]));
