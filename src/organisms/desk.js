/* The workbench the cardboard synths sit on (top surface at y = 0), a cut-paper snake plant in a folded card pot (click it: it wilts, sprouts and
   grows back) and a folded-paper lamp you can switch on and off. */
import * as THREE from 'three';
import { hits, lerp, reduceMotion } from '../core/state.js';
import { drum } from '../core/audio.js';
import { scene } from '../core/scene.js';
import { rbox, cyl, flat } from '../atoms/geometry.js';
import { canvasTex, radialTex } from '../atoms/textures.js';
import { decal } from '../atoms/materials.js';
import { PAPER, card } from '../atoms/craft.js';
import { FXMATS } from '../molecules/fx.js';
import { icon } from '../atoms/icons.js';

const put = (parent, o, x, y, z) => {
  o.position.set(x, y, z);
  parent.add(o);
  return o;
};
/* the workbench: dark wood from the texture library (one photo, mirror-tiled along the top); the legs and rail are rolled card tubes */
const woodMap = PAPER.wood.map.clone();
woodMap.repeat.set(0.5, 0.5);
const woodBump = PAPER.wood.bump.clone();
woodBump.repeat.copy(woodMap.repeat);
export const DESK = {
  wood: new THREE.MeshStandardMaterial({
    map: woodMap,
    bumpMap: woodBump,
    bumpScale: 0.7,
    color: '#c9b39c',
    roughness: 0.78,
    metalness: 0,
    envMapIntensity: 0.2,
  }),
  steel: card('dark', '#b39a80'),
};
put(scene, rbox(32.5, 0.9, 18.5, 0.3, DESK.wood), 0.6, -0.45, -0.1).castShadow = false;
/* the bench falls into shadow towards its edges: a soft dark wash on the wood, clear under the light over the mat and deepest at the
   edges and corners (the spotlight's own fall-off does the same to everything standing on it) */
{
  const sh = canvasTex(256, 256, (x, W) => {
    const g = x.createRadialGradient(W * 0.43, W * 0.47, W * 0.2, W * 0.47, W * 0.5, W * 0.74);
    g.addColorStop(0, 'rgba(14,7,3,0)');
    g.addColorStop(0.55, 'rgba(14,7,3,.3)');
    g.addColorStop(1, 'rgba(14,7,3,.78)');
    x.fillStyle = g;
    x.fillRect(0, 0, W, W);
    for (const [a, b, c, d] of [
      [0, 0, 0, 34],
      [0, W, 0, W - 34],
      [0, 0, 34, 0],
      [W, 0, W - 34, 0],
    ]) {
      const e = x.createLinearGradient(a, b, c, d);
      e.addColorStop(0, 'rgba(10,5,2,.6)');
      e.addColorStop(1, 'rgba(10,5,2,0)');
      x.fillStyle = e;
      x.fillRect(0, 0, W, W);
    }
  }).t;
  const v = flat(
    32.4,
    18.4,
    decal(new THREE.MeshBasicMaterial({ map: sh, transparent: true, depthWrite: false })),
    0.004,
  );
  v.position.x = 0.6;
  v.position.z = -0.1;
  v.renderOrder = 0;
  v.raycast = () => {};
  scene.add(v);
}
const steel = DESK.steel;
[
  [-15.2, -8.8],
  [16.4, -8.8],
  [-15.2, 8.6],
  [16.4, 8.6],
].forEach(([x, z]) => {
  put(scene, rbox(0.85, 30, 0.85, 0.2, steel), x, -15.9, z).castShadow = false;
});
put(scene, rbox(30.5, 0.7, 0.2, 0.05, steel), 0.6, -1.25, -9.1);

/* snake plant: leaves cut from green paper (felt-tip bands and an ink edge drawn on), in an eight-sided pot folded from corrugated card with a
   kraft collar. The leaves sway a little; click it and it runs through its life (updateDesk) */
const PLANT = put(scene, new THREE.Group(), 14.7, 0, -7.6),
  leaves = [],
  LIFE = { t: -1, sprung: false },
  GREEN = new THREE.Color('#ffffff'),
  DEAD = new THREE.Color('#a8763c');
const LM = [
  ['#9fcf58', '#5f9a3c'],
  ['#6fa843', '#3f7a30'],
].map(
  ([paper, pen]) =>
    new THREE.MeshStandardMaterial({
      roughness: 0.9,
      side: THREE.DoubleSide,
      map: canvasTex(128, 512, (x, W, H) => {
        x.fillStyle = paper;
        x.fillRect(0, 0, W, H);
        x.strokeStyle = pen;
        x.lineWidth = 9;
        x.lineCap = 'round';
        for (let y = 30; y < H; y += 46) {
          x.beginPath();
          x.moveTo(8, y + Math.random() * 14);
          x.lineTo(W * 0.5, y + 18 + Math.random() * 10);
          x.lineTo(W - 8, y + Math.random() * 14);
          x.stroke();
        } // the snake plant's bands, in felt-tip
        x.strokeStyle = 'rgba(42,27,18,.55)';
        x.lineWidth = 4;
        x.beginPath();
        x.moveTo(W / 2, H);
        x.lineTo(W / 2 + 3, 40);
        x.stroke();
      }).t,
    }),
); // a pencil line up the middle
{
  const pot = put(PLANT, cyl(1.3, 1, 2.1, card('corr', '#fff4e6'), 8), 0, 1.05, 0);
  const collar = put(PLANT, cyl(1.4, 1.36, 0.42, card('kraft', '#c9995c'), 8), 0, 1.95, 0);
  collar.userData.proxy = pot;
  hits.push(collar);
  /* soil: a low dark mound inside the collar, flecked with grit */
  const grit = canvasTex(256, 256, (x, W, H) => {
    x.fillStyle = '#4a3527';
    x.fillRect(0, 0, W, H);
    for (let i = 0; i < 1400; i++) {
      const s = Math.random();
      x.fillStyle = s < 0.45 ? 'rgba(25,16,10,.55)' : s < 0.8 ? 'rgba(110,82,60,.45)' : 'rgba(190,170,150,.35)';
      x.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }
  }).t;
  const soil = put(
    PLANT,
    new THREE.Mesh(
      new THREE.SphereGeometry(1.14, 40, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ map: grit, color: '#8a7a6c', roughness: 1 }),
    ),
    0,
    2.16,
    0,
  );
  soil.scale.y = 0.13;
  soil.receiveShadow = true;
  /* a leaf: a pointed blade with a snipped, slightly lopsided tip; its texture runs base to tip, and the ink edge is a second blade just behind it */
  const blade = (h, w = 0.3) => {
    const s = new THREE.Shape();
    s.moveTo(-w, 0);
    s.bezierCurveTo(-w * 1.4, h * 0.45, -w * 0.7, h * 0.82, -0.03, h);
    s.lineTo(0.07, h * 0.97);
    s.bezierCurveTo(w * 0.8, h * 0.8, w * 1.4, h * 0.45, w, 0);
    s.closePath();
    const g = new THREE.ShapeGeometry(s, 10),
      p = g.attributes.position,
      uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (w * 2.8) + 0.5, p.getY(i) / h);
    return g;
  };
  const ink = new THREE.MeshBasicMaterial({ color: '#2a1b12', side: THREE.DoubleSide });
  [
    [0, 5.2, 0, 0.06],
    [1.1, 4.4, 0.35, 0.22],
    [2.2, 4.8, -0.3, 0.18],
    [3.3, 3.9, 0.4, 0.3],
    [4.3, 4.6, 0.2, 0.14],
    [5.2, 3.6, -0.4, 0.32],
    [0.6, 3.4, -0.2, 0.36],
    [2.8, 3.2, 0.5, 0.4],
    [4.9, 5, 0, 0.1],
  ].forEach(([a, h, o, lean], i) => {
    const g = put(PLANT, new THREE.Group(), Math.cos(a) * o * 0.9, 2.2, Math.sin(a) * o * 0.9);
    g.rotation.y = a;
    const l = new THREE.Mesh(blade(h), LM[i % 3 ? 1 : 0]),
      edge = new THREE.Mesh(blade(h + 0.09, 0.36), ink);
    edge.position.set(0, -0.04, -0.012);
    edge.raycast = () => {};
    l.add(edge);
    l.rotation.x = -lean;
    l.castShadow = true;
    l.userData.proxy = pot;
    hits.push(l);
    g.add(l);
    leaves.push({ l, base: -lean, ph: i * 1.7 });
  });
  pot.userData = {
    tip: 'Plant · give it a poke',
    down() {
      if (LIFE.t < 0) {
        LIFE.t = 0;
        LIFE.sprung = false;
        drum('shaker');
      }
    },
  };
  hits.push(pot);
}

/* desk lamp made of card: a ten-sided shade folded from cream paper, a red rolled-paper stem and a kraft foot. Click it to switch it on or off */
const LAMP = put(scene, new THREE.Group(), 12.4, 0, -1.6),
  SHADE_Y = 3.3;
const light = put(LAMP, new THREE.PointLight('#ffb36b', 0, 22, 1.6), 0, 3.1, 0);
const dome = put(
  LAMP,
  cyl(0.5, 1.5, 1.3, card('paper', '#fff6e4', { emissive: '#ffcf96', emissiveIntensity: 0, bumpScale: 0.15 }), 10),
  0,
  SHADE_Y,
  0,
);
dome.rotation.y = 0.2;
const bulb = put(
  LAMP,
  new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff1d6' })),
  0,
  2.6,
  0,
);
[
  put(LAMP, cyl(0.9, 1, 0.22, card('kraft', '#c9995c'), 8), 0, 0.11, 0),
  put(LAMP, cyl(0.09, 0.09, 2.6, card('paper', '#e0301a', { bumpScale: 0.15 }), 8), 0, 1.5, 0),
  put(LAMP, cyl(0.2, 0.2, 0.3, card('kraft', '#c9995c'), 8), 0, 2.72, 0),
].forEach((m) => {
  m.userData.proxy = dome;
  hits.push(m);
});
const glowPool = put(
  scene,
  flat(
    13,
    13,
    decal(
      new THREE.MeshBasicMaterial({
        map: radialTex([
          [0, 1, '255,190,120'],
          [0.35, 0.45, '255,170,100'],
          [1, 0, '255,160,90'],
        ]),
        transparent: true,
        depthWrite: false,
        opacity: 0,
        toneMapped: false,
      }),
    ),
  ),
  12.4,
  0.006,
  -1.6,
);
glowPool.renderOrder = 1;
FXMATS.push(glowPool.material);
const L = { on: true, k: 1, dip: 0 };
/* hover tip: a bulb that's lit or not, and the word On or Off */
dome.userData = {
  tip: 'Lamp',
  tipHTML: () => `<span class="lamp-tip${L.on ? ' on' : ''}">${icon('bulb', 18)}${L.on ? 'On' : 'Off'}</span>`,
  down() {
    L.on = !L.on;
    L.dip = 1;
    drum(L.on ? 'blip' : 'rim');
  },
};
hits.push(dome);

export function updateDesk(dt, t) {
  L.k += ((L.on ? 1 : 0) - L.k) * (reduceMotion ? 1 : 1 - Math.exp(-dt * 8));
  const k = L.k;
  light.intensity = k * 26;
  dome.material.emissiveIntensity = k * 0.85;
  bulb.material.color.setRGB(1, lerp(0.8, 0.95, k), lerp(0.62, 0.84, k)).multiplyScalar(0.35 + 0.65 * k);
  glowPool.material.opacity = k * 0.55;
  glowPool.visible = k > 0.01;
  L.dip = Math.max(0, L.dip - dt * 5);
  dome.position.y = SHADE_Y - 0.06 * Math.sin(L.dip * Math.PI); // a little press on click
  /* the plant's life: 0–1.4s it wilts (droops, goes brown) · –2.2 the dead leaves shrivel away · –3.3 one sprout pushes up · –4.8 every leaf grows back */
  if (LIFE.t >= 0) {
    LIFE.t += dt;
    if (LIFE.t > 2.2 && !LIFE.sprung) {
      LIFE.sprung = true;
      drum('blip');
    }
    if (LIFE.t > 4.8 || reduceMotion) LIFE.t = -1;
  }
  const T = LIFE.t,
    back = (k) => 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2,
    cl = (k) => Math.max(0, Math.min(1, k)); // back: grows a touch too far, then settles
  const wilt = T < 0 ? 0 : T < 2.2 ? cl(T / 1.4) : 0;
  LM.forEach((m) => m.color.copy(GREEN).lerp(DEAD, wilt));
  leaves.forEach((o, i) => {
    let s = 1,
      droop = 0;
    if (T >= 0) {
      if (T < 2.2) {
        droop = wilt * (0.75 + 0.25 * Math.sin(o.ph));
        s = (1 - 0.2 * wilt) * (1 - cl((T - 1.4) / 0.8));
      } else if (T < 3.3) s = i ? 0 : 0.3 * back(cl((T - 2.2) / 0.6));
      else s = back(cl((T - 3.3 - i * 0.07) / 0.8)) * (i ? 1 : 0.7) + (i ? 0 : 0.3);
    }
    o.l.scale.setScalar(Math.max(0.001, s));
    o.l.visible = s > 0.002;
    o.l.rotation.x = o.base - droop + (reduceMotion ? 0 : Math.sin(t * 0.7 + o.ph) * 0.025);
  });
}
