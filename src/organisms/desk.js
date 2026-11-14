/* The workbench the cardboard synths sit on (top surface at y = 0), a paper snake plant and a paper mushroom lamp you can switch on and off. */
import * as THREE from 'three';
import { hits, lerp, reduceMotion } from '../core/state.js';
import { drum } from '../core/audio.js';
import { scene } from '../core/scene.js';
import { rbox, cyl, flat } from '../atoms/geometry.js';
import { canvasTex, radialTex, TEX } from '../atoms/textures.js';
import { decal } from '../atoms/materials.js';
import { PAPER, card, outline } from '../atoms/craft.js';
import { FXMATS } from '../molecules/fx.js';
import { icon } from '../atoms/icons.js';

const put = (parent, o, x, y, z) => { o.position.set(x, y, z); parent.add(o); return o };
/* the workbench: dark wood from the texture library (one photo, mirror-tiled along the top); the legs and rail are rolled card tubes */
const woodMap = PAPER.wood.map.clone(); woodMap.repeat.set(.5, .5); const woodBump = PAPER.wood.bump.clone(); woodBump.repeat.copy(woodMap.repeat);
export const DESK = { wood: new THREE.MeshStandardMaterial({ map: woodMap, bumpMap: woodBump, bumpScale: .25, color: '#c9b39c', roughness: .85, metalness: 0, envMapIntensity: .2 }),
  steel: card('dark', '#b39a80') };
put(scene, rbox(32.5, .9, 18.5, .3, DESK.wood), .6, -.45, -.1).castShadow = false;
const steel = DESK.steel;
[[-15.2, -8.8], [16.4, -8.8], [-15.2, 8.6], [16.4, 8.6]].forEach(([x, z]) => { put(scene, rbox(.85, 30, .85, .2, steel), x, -15.9, z).castShadow = false });
put(scene, rbox(30.5, .7, .2, .05, steel), .6, -1.25, -9.1);

/* snake plant in a white ceramic pot; the leaves sway a little */
const PLANT = put(scene, new THREE.Group(), 14.7, 0, -7.6), leaves = [];
{ const pot = put(PLANT, cyl(1.25, 1, 2.1, card('kraft', '#f6e9d2'), 48), 0, 1.05, 0);
  put(PLANT, new THREE.Mesh(new THREE.TorusGeometry(1.2, .07, 10, 48), pot.material), 0, 2.1, 0).rotation.x = -Math.PI / 2;
  /* soil: a low dark mound just inside the white rim (sitting on the pot's top, so it shows), flecked with grit, so the pot and the plant's base read apart */
  const grit = canvasTex(256, 256, (x, W, H) => { x.fillStyle = '#4a3527'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 1400; i++) { const s = Math.random(); x.fillStyle = s < .45 ? 'rgba(25,16,10,.55)' : s < .8 ? 'rgba(110,82,60,.45)' : 'rgba(190,170,150,.35)'; x.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 1 + Math.random() * 3) } }).t;
  const soil = put(PLANT, new THREE.Mesh(new THREE.SphereGeometry(1.14, 40, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ map: grit, color: '#8a7a6c', roughness: 1 })), 0, 2.07, 0);
  soil.scale.y = .13; soil.receiveShadow = true;
  const leaf = c => card('paper', c, { side: THREE.DoubleSide, bumpScale: .15 }), LM = [leaf('#8fbf4a'), leaf('#5f9a3c')];
  const shape = h => { const s = new THREE.Shape(); s.moveTo(-.26, 0); s.bezierCurveTo(-.36, h * .45, -.2, h * .8, 0, h); s.bezierCurveTo(.2, h * .8, .36, h * .45, .26, 0); s.closePath(); return new THREE.ShapeGeometry(s, 12) };
  [[0, 5.2, 0, .06], [1.1, 4.4, .35, .22], [2.2, 4.8, -.3, .18], [3.3, 3.9, .4, .3], [4.3, 4.6, .2, .14], [5.2, 3.6, -.4, .32], [.6, 3.4, -.2, .36], [2.8, 3.2, .5, .4], [4.9, 5, 0, .1]].forEach(([a, h, o, lean], i) => {
    const g = put(PLANT, new THREE.Group(), Math.cos(a) * o * .9, 2.12, Math.sin(a) * o * .9); g.rotation.y = a;
    const l = new THREE.Mesh(shape(h), LM[i % 3 ? 1 : 0]); l.rotation.x = -lean; l.castShadow = true; g.add(l); leaves.push({ l, base: -lean, ph: i * 1.7 }) });
}

/* coral mushroom lamp with a cream shade and a warm light: click it to switch it on or off */
const LAMP = put(scene, new THREE.Group(), 12.4, 0, -1.6);
const light = put(LAMP, new THREE.PointLight('#ffb36b', 0, 22, 1.6), 0, 3.1, 0);
const coral = card('paper', '#e2614b', { bumpScale: .15 });
const dome = put(LAMP, new THREE.Mesh(new THREE.SphereGeometry(1.35, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), card('paper', '#fff6e4', { emissive: '#ffcf96', emissiveIntensity: 0, side: THREE.DoubleSide, bumpScale: .15 })), 0, 3.05, 0);
dome.scale.y = .78; dome.castShadow = true; outline(dome, 2.7, 1.35, 2.7, .05);
const bulb = put(LAMP, new THREE.Mesh(new THREE.SphereGeometry(.28, 20, 12), new THREE.MeshBasicMaterial({ color: '#fff1d6' })), 0, 3, 0);
[put(LAMP, cyl(.85, .92, .18, coral, 48), 0, .09, 0), put(LAMP, cyl(.075, .075, 3.1, coral, 20), 0, 1.7, 0)].forEach(m => { m.userData.proxy = dome; hits.push(m) });
const glowPool = put(scene, flat(13, 13, decal(new THREE.MeshBasicMaterial({ map: radialTex([[0, 1, '255,190,120'], [.35, .45, '255,170,100'], [1, 0, '255,160,90']]), transparent: true, depthWrite: false, opacity: 0, toneMapped: false }))), 12.4, .006, -1.6);
glowPool.renderOrder = 1; FXMATS.push(glowPool.material);
const L = { on: true, k: 1, dip: 0 };
/* hover tip: a bulb that's lit or not, and the word On or Off */
dome.userData = { tip: 'Lamp', tipHTML: () => `<span class="lamp-tip${L.on ? ' on' : ''}">${icon('bulb', 18)}${L.on ? 'On' : 'Off'}</span>`, down() { L.on = !L.on; L.dip = 1; drum(L.on ? 'blip' : 'rim') } }; hits.push(dome);

export function updateDesk(dt, t) {
  L.k += ((L.on ? 1 : 0) - L.k) * (reduceMotion ? 1 : 1 - Math.exp(-dt * 8));
  const k = L.k;
  light.intensity = k * 26; dome.material.emissiveIntensity = k * .85;
  bulb.material.color.setRGB(1, lerp(.8, .95, k), lerp(.62, .84, k)).multiplyScalar(.35 + .65 * k);
  glowPool.material.opacity = k * .55; glowPool.visible = k > .01;
  L.dip = Math.max(0, L.dip - dt * 5); dome.position.y = 3.05 - .06 * Math.sin(L.dip * Math.PI); // a little press on click
  if (!reduceMotion) leaves.forEach(o => { o.l.rotation.x = o.base + Math.sin(t * .7 + o.ph) * .025 });
}
