/* Geometry atoms: cached rounded boxes, cylinders and a rounded-rect path (canvas or THREE.Shape). */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const geos = {};
export function rbox(w, h, d, r, mat) {
  const k = [w, h, d, r].join(); let g = geos[k];
  if (!g) { const rr = Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001); g = geos[k] = new RoundedBoxGeometry(w, h, d, 3, rr); g.userData.rr = { w, h, d, r: rr } }
  const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; return m;
}
export function cyl(rt, rb, h, mat, seg = 40) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.castShadow = m.receiveShadow = true; return m }
/* footprint of a box or cylinder mesh, for halos and strokes */
export function dims(mesh) { const g = mesh.geometry; if (g.userData.rr) return g.userData.rr; const p = g.parameters, R = Math.max(p.radiusTop, p.radiusBottom); return { w: 2 * R, h: p.height, d: 2 * R, r: R } }
/* quadratic corners: both the canvas API and THREE.Shape support them */
export function rrPath(p, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r); p.lineTo(x + w, y + h - r);
  p.quadraticCurveTo(x + w, y + h, x + w - r, y + h); p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r); p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y); p.closePath();
}
/* a flat plane lying on its parent's top face */
export function flat(w, h, mat, y = 0) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); p.rotation.x = -Math.PI / 2; p.position.y = y; return p }
