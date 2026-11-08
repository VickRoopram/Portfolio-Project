/* The remote: screen, master volume, Contact and four social keys. Its cable plugs into the synth while the remote is in focus. */
import * as THREE from 'three';
import { S } from '../core/state.js';
import { playNote, drum } from '../core/audio.js';
import { scene } from '../core/scene.js';
import { rbox, flat } from '../atoms/geometry.js';
import { canvasTex } from '../atoms/textures.js';
import { M, C, decal } from '../atoms/materials.js';
import { itemCtrl, knob, cap } from '../molecules/controls.js';
import { cable, socket } from '../molecules/cable.js';

export const RM = new THREE.Group(); RM.position.set(-11.7, 0, .15); scene.add(RM);
const at = (o, x, y, z) => { o.position.set(x, y, z); RM.add(o); return o };
export const casing = at(rbox(2.15, .75, 6.6, .3, M(C.body, .55)), 0, .375, 0);
at(rbox(1.95, .1, 6.4, .05, M(C.recess, .8)), 0, .75, 0);
const tile = (w, d, x, z) => at(rbox(w - .07, .26, d - .07, .07, M(C.tile, .6)), x, .88, z);

tile(1.9, 1.3, 0, -2.5); export const rs = canvasTex(300, 200);
at(flat(1.74, 1.14, decal(new THREE.MeshBasicMaterial({ map: rs.t, toneMapped: false }))), 0, 1.015, -2.5);
tile(1.9, 1.7, 0, -1); knob(RM, new THREE.Vector3(0, 1.01, -1), .48, 'vol', 'sm'); // master volume
tile(1.9, .9, 0, .35); itemCtrl(at(cap(1.5, .5, .24, 'CONTACT', { ink: '#ff5d1a', size: 46, lw: .9, lh: .25 }), 0, 1.08, .35), 'cv', 1, () => drum('clap'));
[['BE', -.47, 1.3], ['IG', .47, 1.3], ['IN', -.47, 2.25], ['+', .47, 2.25]].forEach(([t, x, z], j) => {
  tile(.95, .95, x, z); itemCtrl(at(cap(.68, .68, .16, t, { ink: '#ff5d1a', lw: .6, lh: .3 }), x, 1.08, z), 'cv', 2 + j, () => playNote(67 + [0, 2, 4, 7][j], .5));
});
cable([[-11.7, .3, 3.45], [-11.6, .12, 4.6], [-10.2, .1, 5.5], [-8, .1, 5.2], [-6.4, .1, 6.2], [-6, .11, 7.4]],
      [[-11.7, .3, 3.45], [-11.6, .12, 4.4], [-11, .1, 4.6], [-10.4, .1, 3.4], [-10.25, .3, 1.5], [-9.75, .45, 1.5]], '#ff5d1a', .085, () => S.mode === 'cv', socket([-9.5, .45, 1.5], [0, 0, Math.PI / 2]));
