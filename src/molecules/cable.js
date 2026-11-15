/* Patch lead: a chain of taped card boxes that eases between a loose and a plugged-in route; plugs itself in while its condition holds. */
import * as THREE from 'three';
import { scene } from '../core/scene.js';
import { drum } from '../core/audio.js';
import { rbox, cyl } from '../atoms/geometry.js';
import { M } from '../atoms/materials.js';
import { card, tape, rnd, INK } from '../atoms/craft.js';

const CABLES = [];
/* a jack socket with a status LED beside it */
export function socket(pos, rot) {
  const g = new THREE.Group(); g.position.set(...pos); scene.add(g);
  const s = cyl(.2, .2, .14, M('#1a1a1c', .4)); s.rotation.set(...rot); g.add(s);
  const led = cyl(.06, .06, .04, new THREE.MeshStandardMaterial({ color: '#3a3b40', emissive: '#e0301a', emissiveIntensity: 0 })); led.position.set(rot[2] ? 0 : .35, .47, rot[2] ? .35 : 0); g.add(led);
  return led;
}
/* the lead isn't a rubber cable: it's a chain of little card boxes, painted orange and taped end to end, laid along the same route.
   N boxes follow the curve (each turned to face the next, and a touch crooked); a strip of tape bridges every joint; a bigger box at the
   end is the plug. On the craft mat the chain rides on top of the rubber. It moves between the loose and plugged-in routes exactly as the cord did */
const N = 26, ORANGE = '#f28a2e', onMat = (x, z) => x > -14.1 && x < 10.9 && z > -5.3 && z < 5.5, dummy = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0);
export function cable(loose, plug, color, r, isOn, led) {
  const paint = card('paper', ORANGE, { bumpScale: .25 }), L = .27, W = r * 2.5, H = r * 1.9;
  const link = rbox(L, H, W, .02, paint), boxes = new THREE.InstancedMesh(link.geometry, paint, N), lines = new THREE.InstancedMesh(link.geometry, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }), N);
  const strips = new THREE.InstancedMesh(new THREE.BoxGeometry(.13, .012, W * 1.25), new THREE.MeshStandardMaterial({ color: '#eedcaa', roughness: .8, transparent: true, opacity: .93 }), N - 1);
  boxes.castShadow = boxes.receiveShadow = true; [boxes, lines, strips].forEach(o => { o.frustumCulled = false; o.raycast = () => {}; scene.add(o) });
  const end = rbox(.3, H * 1.5, W * 1.6, .03, paint); end.rotation.order = 'YXZ'; scene.add(end); tape(end, 0, H * .75 + .004, 0, .34, .16, Math.PI / 2);
  const wob = Array.from({ length: N }, () => [rnd(.16, -.08), rnd(.14, -.07)]); // each box: a little turned, a little rolled
  const c = { t: 0, isOn, led, build() {
    const k = c.t < .5 ? 2 * c.t * c.t : 1 - Math.pow(-2 * c.t + 2, 2) / 2, lift = Math.sin(Math.PI * c.t) * .9;
    const curve = new THREE.CatmullRomCurve3(loose.map((p, i) => new THREE.Vector3(...p.map((v, a) => v + (plug[i][a] - v) * k + (a === 1 && i > 0 && i < loose.length - 1 ? lift : 0)))));
    const pts = curve.getSpacedPoints(N + 1).map(p => { p.y = Math.max(p.y, H / 2 + .012) + (onMat(p.x, p.z) ? .07 : 0); return p });
    for (let i = 0; i < N; i++) { const a = pts[i], b = pts[i + 1]; dummy.position.copy(a).lerp(b, .5); dummy.up.copy(up); dummy.lookAt(b); dummy.rotateY(Math.PI / 2 + wob[i][0]); dummy.rotateX(wob[i][1]);
      const d = a.distanceTo(b) / L * .9; dummy.scale.set(d, 1, 1); dummy.updateMatrix(); boxes.setMatrixAt(i, dummy.matrix);
      dummy.scale.set(d * 1.12, 1.22, 1.14); dummy.updateMatrix(); lines.setMatrixAt(i, dummy.matrix);
      if (i) { dummy.position.copy(a); dummy.position.y += H / 2 + .008; dummy.scale.set(1, 1, 1); dummy.updateMatrix(); strips.setMatrixAt(i - 1, dummy.matrix) } }
    [boxes, lines, strips].forEach(o => { o.instanceMatrix.needsUpdate = true });
    end.position.copy(pts.at(-1)); end.lookAt(pts.at(-2)); end.rotateY(Math.PI / 2) } };
  c.build(); CABLES.push(c); return c;
}
export function updateCables() {
  for (const c of CABLES) {
    const tgt = c.isOn() ? 1 : 0;
    if (Math.abs(c.t - tgt) < .002) { if (c.t !== tgt) { c.t = tgt; c.build(); if (tgt) drum('rim') } } else { c.t += (tgt - c.t) * .06; c.build() }
    c.led.material.emissiveIntensity = c.t > .97 ? 1.6 : 0;
  }
}
