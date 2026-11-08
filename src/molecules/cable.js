/* Patch cable: eases between a loose and a plugged-in route; plugs itself in while its condition holds. */
import * as THREE from 'three';
import { scene } from '../core/scene.js';
import { drum } from '../core/audio.js';
import { rbox, cyl } from '../atoms/geometry.js';
import { M } from '../atoms/materials.js';

const CABLES = [];
/* a jack socket with a status LED beside it */
export function socket(pos, rot) {
  const g = new THREE.Group(); g.position.set(...pos); scene.add(g);
  const s = cyl(.2, .2, .14, M('#1a1a1c', .4)); s.rotation.set(...rot); g.add(s);
  const led = cyl(.06, .06, .04, new THREE.MeshStandardMaterial({ color: '#3a3b40', emissive: '#ff5d1a', emissiveIntensity: 0 })); led.position.set(rot[2] ? 0 : .35, .47, rot[2] ? .35 : 0); g.add(led);
  return led;
}
export function cable(loose, plug, color, r, isOn, led) {
  const mat = M(color, .5), m = new THREE.Mesh(new THREE.BufferGeometry(), mat), end = rbox(.32, .22, .6, .06, mat); m.castShadow = true; scene.add(m, end);
  const c = { t: 0, isOn, led, build() {
    const k = c.t < .5 ? 2 * c.t * c.t : 1 - Math.pow(-2 * c.t + 2, 2) / 2, lift = Math.sin(Math.PI * c.t) * .9;
    const pts = loose.map((p, i) => new THREE.Vector3(...p.map((v, a) => v + (plug[i][a] - v) * k + (a === 1 && i > 0 && i < loose.length - 1 ? lift : 0))));
    m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, r, 10);
    end.position.copy(pts.at(-1)); end.position.y = Math.max(end.position.y, .11); end.lookAt(pts.at(-2)) } };
  c.build(); CABLES.push(c); return c;
}
export function updateCables() {
  for (const c of CABLES) {
    const tgt = c.isOn() ? 1 : 0;
    if (Math.abs(c.t - tgt) < .002) { if (c.t !== tgt) { c.t = tgt; c.build(); if (tgt) drum('rim') } } else { c.t += (tgt - c.t) * .06; c.build() }
    c.led.material.emissiveIntensity = c.t > .97 ? 1.6 : 0;
  }
}
