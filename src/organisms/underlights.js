/* Device underlights: a thin LED-strip glow hugging each device's casing. On while you hover a device in the overview;
   the keyboard's stays on (in its mode colour) while you're in a keyboard mode. */
import * as THREE from 'three';
import { S, V, reduceMotion, act } from '../core/state.js';
import { MODES, onKeys } from '../core/data.js';
import { scene } from '../core/scene.js';
import { flat } from '../atoms/geometry.js';
import { underlightTexture } from '../atoms/textures.js';
import { decal } from '../atoms/materials.js';
import { FXMATS } from '../molecules/fx.js';
import { synth, casing as synthCasing } from './synth.js';
import { RM, casing as remoteCasing } from './remote.js';

scene.updateMatrixWorld(true);
export const boxOf = objs => { const b = new THREE.Box3(); objs.forEach(o => b.expandByObject(o)); return b };
export const GROUPS = {
  contact: { obj: RM, box: boxOf([RM]), foot: boxOf([remoteCasing]), col: () => '#ff2020', go: () => act.zoomTo('cv') },
  projects: { obj: synth, box: boxOf([synth]), foot: boxOf(synthCasing), col: () => MODES[S.kb]?.glow || '#00bfff', go: () => act.zoomTo(S.kb) },
};
const tmp = new THREE.Color();
for (const [key, g] of Object.entries(GROUPS)) {
  const s = g.foot.getSize(new THREE.Vector3()), c = g.foot.getCenter(new THREE.Vector3()), { t, m } = underlightTexture(s.x, s.z, .09);
  const mat = decal(new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0, toneMapped: false, color: g.col() }));
  const mesh = flat(s.x + 2 * m, s.z + 2 * m, mat); mesh.position.set(c.x, .01, c.z); mesh.renderOrder = 1; mesh.visible = false; scene.add(mesh); FXMATS.push(mat);
  Object.assign(g, { key, mesh, mat, k: 0, tint: new THREE.Color(g.col()) });
}
/* which device the pointer is over: the control's parent chain first, then (over bare casing) the devices' bounding boxes */
export function groupAt(o, ray) {
  for (let p = o; p; p = p.parent) for (const g of Object.values(GROUPS)) if (g.obj === p) return g.key;
  if (o) return null; // a control that isn't on a device (the lamp)
  let best = null, bd = Infinity; const hit = new THREE.Vector3();
  for (const g of Object.values(GROUPS)) if (ray.ray.intersectBox(g.box, hit)) { const d = hit.distanceTo(ray.ray.origin); if (d < bd) { bd = d; best = g.key } }
  return best;
}
export function updateUnderlights(dt, hoverGroup) {
  const lit = !S.mode && !S.card && !V.fly ? hoverGroup : null;
  const ease = reduceMotion ? 1 : 1 - Math.exp(-dt * 6), cEase = reduceMotion ? 1 : 1 - Math.exp(-dt * 4), breathe = reduceMotion ? 1 : 1 + .035 * Math.sin(performance.now() / 1000 * 1.6);
  const kbOn = S.mode && onKeys(S.mode) || S.card && onKeys(S.card.ch);
  for (const g of Object.values(GROUPS)) {
    g.k += ((g.key === lit ? 1 : g.key === 'projects' && kbOn ? .75 : 0) - g.k) * ease;
    g.tint.lerp(tmp.set(g.col()), cEase); g.mat.color.copy(g.tint);
    g.mat.opacity = g.k * .48 * breathe; g.mesh.visible = g.k > .004;
  }
}
