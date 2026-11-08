/* The desk the synths sit on (top surface at y = 0), a snake plant and a mushroom lamp you can switch on and off. */
import * as THREE from 'three';
import { V, hits, lerp, reduceMotion } from '../core/state.js';
import { drum } from '../core/audio.js';
import { scene } from '../core/scene.js';
import { rbox, cyl, flat } from '../atoms/geometry.js';
import { canvasTex, radialTex, TEX } from '../atoms/textures.js';
import { themed, decal } from '../atoms/materials.js';
import { FXMATS } from '../molecules/fx.js';

const put = (parent, o, x, y, z) => { o.position.set(x, y, z); parent.add(o); return o };
/* light oak by day, walnut under the lamp at night, on grey metal legs */
const wood = canvasTex(2048, 1024, (x, W, H) => { x.fillStyle = '#d9c6a6'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) { const y = Math.random() * H, a = .03 + Math.random() * .08; x.strokeStyle = Math.random() < .5 ? `rgba(120,86,48,${a})` : `rgba(255,240,215,${a})`; x.lineWidth = .6 + Math.random() * 2.2;
    x.beginPath(); x.moveTo(0, y); for (let s = 0; s <= W; s += 64) x.lineTo(s, y + Math.sin(s * .004 + i) * 6 + (Math.random() - .5) * 2); x.stroke() }
  x.strokeStyle = 'rgba(120,86,48,.06)'; for (let k = 0; k < 9; k++) { const cx = Math.random() * W, cy = Math.random() * H; for (let r = 4; r < 38; r += 5) { x.beginPath(); x.ellipse(cx, cy, r * 3.2, r * .7, 0, 0, 7); x.stroke() } } }).t;
put(scene, rbox(32.5, .9, 18.5, .3, themed(new THREE.MeshPhysicalMaterial({ map: wood, roughness: .58, clearcoat: .25, clearcoatRoughness: .5, bumpMap: TEX.grain, bumpScale: .05 }), '#ffffff', '#5d4f41', 1, .6)), .6, -.45, -.1).castShadow = false;
const steel = themed(new THREE.MeshPhysicalMaterial({ color: '#c3c6cc', metalness: .85, roughness: .38 }), '#c3c6cc', '#4a4d54', 1, .7);
[[-15.2, -8.8], [16.4, -8.8], [-15.2, 8.6], [16.4, 8.6]].forEach(([x, z]) => { put(scene, rbox(.85, 30, .85, .2, steel), x, -15.9, z).castShadow = false });
put(scene, rbox(30.5, .7, .2, .05, steel), .6, -1.25, -9.1);

/* snake plant in a white ceramic pot; the leaves sway a little */
const PLANT = put(scene, new THREE.Group(), 14.7, 0, -7.6), leaves = [];
{ const pot = put(PLANT, cyl(1.25, 1, 2.1, new THREE.MeshPhysicalMaterial({ color: '#f1efea', roughness: .32, clearcoat: .6, clearcoatRoughness: .25 }), 48), 0, 1.05, 0);
  put(PLANT, new THREE.Mesh(new THREE.TorusGeometry(1.2, .07, 10, 48), pot.material), 0, 2.1, 0).rotation.x = -Math.PI / 2;
  const soil = put(PLANT, new THREE.Mesh(new THREE.CircleGeometry(1.16, 40), new THREE.MeshStandardMaterial({ color: '#3b2c22', roughness: 1 })), 0, 1.98, 0); soil.rotation.x = -Math.PI / 2;
  const leaf = c => new THREE.MeshPhysicalMaterial({ color: c, roughness: .45, clearcoat: .4, clearcoatRoughness: .4, side: THREE.DoubleSide }), LM = [leaf('#5aa15a'), leaf('#3f8a47')];
  const shape = h => { const s = new THREE.Shape(); s.moveTo(-.26, 0); s.bezierCurveTo(-.36, h * .45, -.2, h * .8, 0, h); s.bezierCurveTo(.2, h * .8, .36, h * .45, .26, 0); s.closePath(); return new THREE.ShapeGeometry(s, 12) };
  [[0, 5.2, 0, .06], [1.1, 4.4, .35, .22], [2.2, 4.8, -.3, .18], [3.3, 3.9, .4, .3], [4.3, 4.6, .2, .14], [5.2, 3.6, -.4, .32], [.6, 3.4, -.2, .36], [2.8, 3.2, .5, .4], [4.9, 5, 0, .1]].forEach(([a, h, o, lean], i) => {
    const g = put(PLANT, new THREE.Group(), Math.cos(a) * o * .9, 1.98, Math.sin(a) * o * .9); g.rotation.y = a;
    const l = new THREE.Mesh(shape(h), LM[i % 3 ? 1 : 0]); l.rotation.x = -lean; l.castShadow = true; g.add(l); leaves.push({ l, base: -lean, ph: i * 1.7 }) });
}

/* coral mushroom lamp with a cream shade and a warm light: click it to switch it on or off */
const LAMP = put(scene, new THREE.Group(), 12.4, 0, -1.6);
const light = put(LAMP, new THREE.PointLight('#ffb36b', 0, 22, 1.6), 0, 3.1, 0);
const coral = new THREE.MeshPhysicalMaterial({ color: '#ea8a7d', roughness: .35, clearcoat: .5, clearcoatRoughness: .3 });
const dome = put(LAMP, new THREE.Mesh(new THREE.SphereGeometry(1.35, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#f6ecdc', roughness: .6, emissive: '#ffcf96', emissiveIntensity: 0, side: THREE.DoubleSide })), 0, 3.05, 0);
dome.scale.y = .78; dome.castShadow = true;
const bulb = put(LAMP, new THREE.Mesh(new THREE.SphereGeometry(.28, 20, 12), new THREE.MeshBasicMaterial({ color: '#fff1d6' })), 0, 3, 0);
[put(LAMP, cyl(.85, .92, .18, coral, 48), 0, .09, 0), put(LAMP, cyl(.075, .075, 3.1, coral, 20), 0, 1.7, 0)].forEach(m => { m.userData.proxy = dome; hits.push(m) });
const glowPool = put(scene, flat(13, 13, decal(new THREE.MeshBasicMaterial({ map: radialTex([[0, 1, '255,190,120'], [.35, .45, '255,170,100'], [1, 0, '255,160,90']]), transparent: true, depthWrite: false, opacity: 0, toneMapped: false }))), 12.4, .006, -1.6);
glowPool.renderOrder = 1; FXMATS.push(glowPool.material);
const L = { on: true, k: 1, dip: 0 };
dome.userData = { tip: 'Lamp · click to switch it on or off', down() { L.on = !L.on; L.dip = 1; drum(L.on ? 'blip' : 'rim') } }; hits.push(dome);

export function updateDesk(dt, t) {
  L.k += ((L.on ? 1 : 0) - L.k) * (reduceMotion ? 1 : 1 - Math.exp(-dt * 8));
  const dk = Math.max(0, V.themeK), k = L.k;
  light.intensity = k * lerp(9, 26, dk); dome.material.emissiveIntensity = k * lerp(.25, .85, dk);
  bulb.material.color.setRGB(1, lerp(.8, .95, k), lerp(.62, .84, k)).multiplyScalar(.35 + .65 * k);
  glowPool.material.opacity = k * lerp(.18, .55, dk); glowPool.visible = k > .01;
  L.dip = Math.max(0, L.dip - dt * 5); dome.position.y = 3.05 - .06 * Math.sin(L.dip * Math.PI); // a little press on click
  if (!reduceMotion) leaves.forEach(o => { o.l.rotation.x = o.base + Math.sin(t * .7 + o.ph) * .025 });
}
