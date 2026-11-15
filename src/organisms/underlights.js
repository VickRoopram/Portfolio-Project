/* Device marker lines (were underlights): a felt-tip line in the device's colour, drawn on the bench round its casing while you hover it in the overview;
   the keyboard's stays on (in its mode colour) while you're in a keyboard mode. */
import { foley } from '../core/audio.js';
import * as THREE from 'three';
import { S, V, reduceMotion, act } from '../core/state.js';
import { MODES, onKeys } from '../core/data.js';
import { scene } from '../core/scene.js';
import { markerLoop, eraser } from '../atoms/craft.js';
import { synth, casing as synthCasing } from './synth.js';
import { RM, casing as remoteCasing } from './remote.js';

scene.updateMatrixWorld(true);
export const boxOf = objs => { const b = new THREE.Box3(); objs.forEach(o => b.expandByObject(o)); return b };
export const GROUPS = {
  contact: { obj: RM, box: boxOf([RM]), foot: boxOf([remoteCasing]), col: () => '#e0301a', go: () => act.zoomTo('cv') },
  projects: { obj: synth, box: boxOf([synth]), foot: boxOf(synthCasing), col: () => MODES[S.kb]?.glow || '#00bfff', go: () => act.zoomTo(S.kb) },
};
const tmp = new THREE.Color();
for (const [key, g] of Object.entries(GROUPS)) {
  const s = g.foot.getSize(new THREE.Vector3()), c = g.foot.getCenter(new THREE.Vector3());
  const mesh = markerLoop(s.x + .8, s.z + .8, .45, .3), mat = mesh.material; mesh.position.set(c.x, .1, c.z) /* on the craft mat */; mesh.visible = false; scene.add(mesh);
  const rub = eraser(); scene.add(rub);
  Object.assign(g, { key, mesh, mat, rub, k: 0, tint: new THREE.Color(g.col()) });
}
/* which device the pointer is over: the control's parent chain first, then (over bare casing) the devices' bounding boxes */
export function groupAt(o, ray) {
  for (let p = o; p; p = p.parent) for (const g of Object.values(GROUPS)) if (g.obj === p) return g.key;
  if (o) return null; // a control that isn't on a device (the lamp)
  let best = null, bd = Infinity; const hit = new THREE.Vector3();
  for (const g of Object.values(GROUPS)) if (ray.ray.intersectBox(g.box, hit)) { const d = hit.distanceTo(ray.ray.origin); if (d < bd) { bd = d; best = g.key } }
  return best;
}
let wasLit = null;
export function updateUnderlights(dt, hoverGroup) {
  const lit = !S.mode && !S.card && !V.fly ? hoverGroup : null;
  if (lit !== wasLit) { if (lit) foley('marker'); wasLit = lit } // the marker squeaks as its line is drawn on
  const ease = reduceMotion ? 1 : 1 - Math.exp(-dt * 8), cEase = reduceMotion ? 1 : 1 - Math.exp(-dt * 4), breathe = reduceMotion ? 1 : 1 + .035 * Math.sin(performance.now() / 1000 * 1.6);
  const kbOn = S.mode && onKeys(S.mode) || S.card && onKeys(S.card.ch);
  for (const g of Object.values(GROUPS)) {
    const to = g.key === lit ? 1 : g.key === 'projects' && kbOn ? .75 : 0, wipe = to === 0 && g.k > .004 && !reduceMotion;
    g.k = wipe ? Math.max(0, g.k - dt * .7) : g.k + (to - g.k) * ease; // drawn on fast; rubbed out slower and at a steady pace, so you see the eraser run back along the line
    g.rub.visible = wipe && g.k > .004;
    if (g.rub.visible) { const [x, z] = g.mesh.userData.at(g.k), [x1, z1] = g.mesh.userData.at(g.k - .01), scrub = Math.sin(performance.now() / 45); // it scrubs as it goes
      g.rub.position.set(g.mesh.position.x + x, .13, g.mesh.position.z + z); g.rub.rotation.z = -Math.atan2(z1 - z, x1 - x) + Math.PI / 2 + scrub * .35 }
    g.tint.lerp(tmp.set(g.col()), cEase); g.mat.uniforms.uCol.value.copy(g.tint);
    g.mat.uniforms.uK.value = g.k; g.mesh.visible = g.k > .004; // the line is drawn on round the device as you point at it, and rubbed out by the eraser as you leave
  }
}
