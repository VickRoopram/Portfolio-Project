/* On the workbench around the synths: a light green rubber cutting mat under them, eight polaroids in a row along the back of the bench and a sticky-note to-do list.
   The polaroids are views into Vick's life, personality and faith: their images and captions come from DESK in content.js
   (a pencil placeholder until an image is set). Click one and the camera flies in over it; click again and it hops (and opens its picture, once it has one). Esc, Home or the logo take you back out. */
import * as THREE from 'three';
import { $, V, hits, act, reduceMotion } from '../core/state.js';
import { DESK } from '../content.js';
import { drum } from '../core/audio.js';
import { scene } from '../core/scene.js';
import { rbox, flat } from '../atoms/geometry.js';
import { canvasTex } from '../atoms/textures.js';
import { decal } from '../atoms/materials.js';
import { card, rnd, sketch, outline, INK } from '../atoms/craft.js';

const hand = px => `400 ${px}px "Patrick Hand", "Comic Sans MS", cursive`, cut = (px, w = 900) => `${w} ${px}px "Londrina Solid", "Arial Narrow", sans-serif`;

/* ── the craft mat: light green rubber with a printed grid, like a cutting mat. Its right edge stops half way between
   the projects synth (edge at x 9.45) and the lamp (x 12.4); the other sides keep about the same margin round both synths ── */
const MAT = { x0: -14.1, x1: 10.9, z0: -5.3, z1: 5.5, h: .07, r: .7 }, MW = MAT.x1 - MAT.x0, MD = MAT.z1 - MAT.z0, PPU = 80;
/* a used mat: knife cuts (long straight ones along a ruler, short curved ones, a few deep), scuffs and a ring from a mug. The same marks
   go into the colour (pale lines, as cuts show on a self-healing mat) and into a bump map, so they catch the light */
const CUTS = [], SCUFFS = [];
for (let i = 0; i < 260; i++) { const x0 = rnd(MW * PPU), y0 = rnd(MD * PPU), a = rnd() < .55 ? [0, Math.PI / 2, .78, -.78][Math.floor(rnd(4))] + rnd(.12, -.06) : rnd(Math.PI), L = rnd() < .25 ? 300 + rnd(700) : 30 + rnd(190);
  CUTS.push({ x0, y0, x1: x0 + Math.cos(a) * L, y1: y0 + Math.sin(a) * L, bend: rnd() < .35 ? rnd(40, -20) : 0, deep: rnd() < .18, w: .7 + rnd(1.3) }) }
for (let i = 0; i < 26; i++) SCUFFS.push({ x: rnd(MW * PPU), y: rnd(MD * PPU), rx: 30 + rnd(120), ry: 14 + rnd(50), a: rnd(3) });
const marks = (x, light, dark) => { x.lineCap = 'round';
  for (const c of CUTS) { x.strokeStyle = c.deep ? dark : light; x.globalAlpha = c.deep ? .5 : .28 + c.w * .14; x.lineWidth = c.deep ? c.w + 1 : c.w; x.beginPath(); x.moveTo(c.x0, c.y0);
    x.quadraticCurveTo((c.x0 + c.x1) / 2 + c.bend, (c.y0 + c.y1) / 2 - c.bend, c.x1, c.y1); x.stroke(); if (c.deep) { x.strokeStyle = light; x.globalAlpha = .5; x.lineWidth = 1; x.beginPath(); x.moveTo(c.x0 + 1.5, c.y0 + 1.5); x.quadraticCurveTo((c.x0 + c.x1) / 2 + c.bend + 1.5, (c.y0 + c.y1) / 2 - c.bend + 1.5, c.x1 + 1.5, c.y1 + 1.5); x.stroke() } }
  x.globalAlpha = 1 };
const round = (x, x0, y0, w, h, r) => { x.beginPath(); x.moveTo(x0 + r, y0); x.lineTo(x0 + w - r, y0); x.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); x.lineTo(x0 + w, y0 + h - r); x.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h); x.lineTo(x0 + r, y0 + h); x.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r); x.lineTo(x0, y0 + r); x.quadraticCurveTo(x0, y0, x0 + r, y0); x.closePath() };
const matTex = canvasTex(Math.round(MW * PPU), Math.round(MD * PPU), (x, W, H) => {
  x.fillStyle = '#9fd096'; x.fillRect(0, 0, W, H);
  const sh = x.createRadialGradient(W * .45, H * .5, H * .2, W * .5, H * .5, W * .62); sh.addColorStop(0, 'rgba(255,255,255,.07)'); sh.addColorStop(1, 'rgba(20,70,40,.16)'); x.fillStyle = sh; x.fillRect(0, 0, W, H); // worn paler in the middle, where the work happens
  for (let i = 0; i < 16000; i++) { x.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(30,80,45,.06)'; x.fillRect(Math.random() * W, Math.random() * H, 2, 2) } // the rubber's tooth
  for (const s of SCUFFS) { x.save(); x.translate(s.x, s.y); x.rotate(s.a); x.scale(s.rx, s.ry); const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, 'rgba(235,250,230,.16)'); g.addColorStop(1, 'rgba(235,250,230,0)'); x.fillStyle = g; x.fillRect(-1, -1, 2, 2); x.restore() }
  const m = .7 * PPU, line = (a, b, c, d, lw, col) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke() };
  x.save(); round(x, m, m, W - 2 * m, H - 2 * m, .35 * PPU); x.clip();
  for (let u = 0; m + u * PPU / 2 <= W - m + 1; u++) line(m + u * PPU / 2, m, m + u * PPU / 2, H - m, u % 2 ? 1 : 2, u % 2 ? 'rgba(245,255,240,.3)' : 'rgba(245,255,240,.62)');
  for (let v = 0; m + v * PPU / 2 <= H - m + 1; v++) line(m, m + v * PPU / 2, W - m, m + v * PPU / 2, v % 2 ? 1 : 2, v % 2 ? 'rgba(245,255,240,.3)' : 'rgba(245,255,240,.62)');
  line(m, m, m + 4 * PPU, m + 4 * PPU, 1.6, 'rgba(245,255,240,.5)'); line(m, m, m + 2 * PPU, m + 4 * PPU, 1.2, 'rgba(245,255,240,.4)'); line(W - m, H - m, W - m - 4 * PPU, H - m - 4 * PPU, 1.6, 'rgba(245,255,240,.5)'); x.restore(); // 45° and 60° guides
  x.strokeStyle = 'rgba(245,255,240,.8)'; x.lineWidth = 4; round(x, m, m, W - 2 * m, H - 2 * m, .35 * PPU); x.stroke();
  x.fillStyle = 'rgba(245,255,240,.8)'; x.font = '600 20px "Patrick Hand", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let u = 2; m + u * PPU <= W - m - PPU; u += 2) { x.fillText(u, m + u * PPU, m * .5); x.fillText(u, m + u * PPU, H - m * .5) }
  for (let v = 2; m + v * PPU <= H - m - PPU; v += 2) { x.fillText(v, m * .5, m + v * PPU); x.fillText(v, W - m * .5, m + v * PPU) }
  x.font = cut(26, 400); x.textAlign = 'left'; x.fillText('VICK DOES CREATIVE  ·  CRAFT MAT', m + 18, H - m - 22);
  x.strokeStyle = 'rgba(90,60,30,.16)'; x.lineWidth = 7; x.beginPath(); x.arc(W * .93, H * .2, 58, .4, 5.6); x.stroke(); // where a mug stood
  marks(x, '#eefbe8', '#3f7a4c') }).t;
const matBump = canvasTex(Math.round(MW * PPU / 2), Math.round(MD * PPU / 2), (x, W, H) => { x.fillStyle = '#808080'; x.fillRect(0, 0, W, H);
  const d = x.getImageData(0, 0, W, H); for (let i = 0; i < d.data.length; i += 4) { const v = 122 + Math.random() * 12; d.data[i] = d.data[i + 1] = d.data[i + 2] = v } x.putImageData(d, 0, 0);
  x.scale(.5, .5); marks(x, '#3a3a3a', '#000') }, { data: 1 }).t;
/* the mat itself: a rounded slab of rubber (rounded in plan, so it's cut from a shape, not a box) with the print on top */
const plan = new THREE.Shape(); { const w = MW / 2, d = MD / 2, r = MAT.r; plan.moveTo(-w + r, -d); plan.lineTo(w - r, -d); plan.absarc(w - r, -d + r, r, -Math.PI / 2, 0); plan.lineTo(w, d - r); plan.absarc(w - r, d - r, r, 0, Math.PI / 2);
  plan.lineTo(-w + r, d); plan.absarc(-w + r, d - r, r, Math.PI / 2, Math.PI); plan.lineTo(-w, -d + r); plan.absarc(-w + r, -d + r, r, Math.PI, Math.PI * 1.5) }
const slab = new THREE.ExtrudeGeometry(plan, { depth: MAT.h, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 2, curveSegments: 10 }); slab.rotateX(-Math.PI / 2); slab.translate(0, -MAT.h / 2, 0);
const mat = new THREE.Mesh(slab, new THREE.MeshStandardMaterial({ color: '#7fb87a', roughness: .9, metalness: 0, envMapIntensity: .15 })); mat.receiveShadow = true;
mat.position.set((MAT.x0 + MAT.x1) / 2, MAT.h / 2, (MAT.z0 + MAT.z1) / 2); scene.add(mat); outline(mat, MW, MAT.h, MD, .03);
const topGeo = new THREE.ShapeGeometry(plan, 10); { const p = topGeo.attributes.position, uv = topGeo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / MW + .5, p.getY(i) / MD + .5) } topGeo.rotateX(-Math.PI / 2);
const matTop = new THREE.Mesh(topGeo, decal(new THREE.MeshStandardMaterial({ map: matTex, roughness: .78, metalness: 0, envMapIntensity: .3, bumpMap: matBump, bumpScale: .6 })));
matTop.position.y = MAT.h / 2 + .017; matTop.receiveShadow = true; matTop.raycast = () => {}; mat.add(matTop);

/* ── things you can pick at: they hop when clicked ── */
const HOPS = [];
/* the first click flies the camera in over it (pad = how much bench to leave round it); once you're there a click makes it hop and runs onClick */
function keepsake(mesh, key, tip, pad, onClick) {
  const box = new THREE.Box3().setFromCenterAndSize(mesh.position, new THREE.Vector3(pad, .2, pad));
  mesh.userData = { tip: '', tipHTML: () => tip() + (V.look === key ? '' : '<small>Click to look closer</small>'),
    down() { mesh.hop = 1; drum('rim'); if (V.look === key) onClick?.(); else act.lookAt(key, box) } };
  mesh.y0 = mesh.position.y; hits.push(mesh); HOPS.push(mesh);
}

/* ── polaroids ── */
const PW = .95 * 2, PD = 1.15 * 2, WHITE = card('paper', '#fffdf6', { bumpScale: .1 });
const DOODLES = [ // placeholder sketches, one per snapshot, in a 100 × 100 box
  x => { sketch(x, [[50, 12], [50, 88]]); sketch(x, [[26, 36], [74, 36]]) },                                                             // a cross
  x => { [[30, 40, 13], [58, 34, 16], [80, 46, 11]].forEach(([cx, cy, r]) => { sketch(x, Array.from({ length: 11 }, (_, i) => [cx + Math.cos(i / 10 * 6.3) * r, cy + Math.sin(i / 10 * 6.3) * r])); sketch(x, [[cx - r, cy + r + 30], [cx - r * .6, cy + r + 4], [cx + r * .6, cy + r + 4], [cx + r, cy + r + 30]]) }) }, // three people
  x => { sketch(x, [[8, 52], [30, 46], [70, 46], [92, 52], [70, 58], [30, 58]], { close: true }); sketch(x, [[44, 42], [50, 62], [56, 42]]) },    // a belt
  x => { sketch(x, [[50, 8], [88, 34], [74, 82], [26, 82], [12, 34]], { close: true }); sketch(x, [[50, 8], [50, 44], [88, 34]]); sketch(x, [[12, 34], [50, 44], [26, 82]]); sketch(x, [[50, 44], [74, 82]]) }, // a twenty-sided die
  x => { sketch(x, [[6, 84], [36, 26], [52, 54], [66, 36], [94, 84]]); sketch(x, [[27, 42], [36, 48], [44, 40]]) },                              // mountains
  x => { sketch(x, [[28, 50], [38, 30], [62, 30], [72, 50], [62, 76], [38, 76]], { close: true }); sketch(x, [[28, 50], [16, 26], [36, 34]]); sketch(x, [[72, 50], [84, 26], [64, 34]]); sketch(x, [[44, 62], [50, 68], [56, 62]]) }, // a dog
  x => { sketch(x, [[20, 84], [72, 22], [84, 34], [32, 94], [16, 98]], { close: true }); sketch(x, [[64, 32], [76, 44]]) },                      // a pencil
  x => { sketch(x, Array.from({ length: 13 }, (_, i) => [50 + Math.cos(i / 12 * 6.3) * 30, 48 + Math.sin(i / 12 * 6.3) * 34])); sketch(x, [[38, 58], [50, 66], [62, 58]]); sketch(x, [[38, 40], [42, 40]]); sketch(x, [[58, 40], [62, 40]]) }, // a face
];
function snap(p, i) { // the face of a polaroid: the picture (or its placeholder) and a handwritten caption
  const T = canvasTex(760, 920, (x, W, H) => draw(x, null)); // drawn at twice the size, to be read close up
  function draw(x, img) { x.setTransform(2, 0, 0, 2, 0, 0); x.clearRect(0, 0, 380, 460); const S = 336, o = 22;
    if (img) { const s = Math.max(S / img.width, S / img.height), w = img.width * s, h = img.height * s; x.save(); x.beginPath(); x.rect(o, o, S, S); x.clip(); x.drawImage(img, o + (S - w) / 2, o + (S - h) / 2, w, h); x.restore() }
    else { x.fillStyle = ['#d9cbb0', '#cfd8c4', '#d8c7c0', '#c9d3d8'][i % 4]; x.fillRect(o, o, S, S); x.strokeStyle = 'rgba(42,27,18,.13)'; x.lineWidth = 2; for (let k = -S; k < S; k += 16) { x.beginPath(); x.moveTo(o + Math.max(0, k), o + Math.max(0, -k)); x.lineTo(o + Math.min(S, k + S), o + Math.min(S, S - k)); x.stroke() }
      x.save(); x.translate(o + S / 2 - 105, o + S / 2 - 105); x.scale(2.1, 2.1); x.strokeStyle = INK; x.lineWidth = 2.6; x.lineCap = x.lineJoin = 'round'; DOODLES[i % DOODLES.length](x); x.restore() }
    x.strokeStyle = 'rgba(42,27,18,.55)'; x.lineWidth = 2; x.strokeRect(o, o, S, S);
    x.fillStyle = INK; x.font = hand(44); x.textAlign = 'center'; x.textBaseline = 'middle'; x.save(); x.translate(190, 410); x.rotate(-.03); x.fillText(p.cap || '', 0, 0); x.restore() }
  if (p.img) { const im = new Image(); im.onload = () => { draw(T.x, im); T.t.needsUpdate = true }; im.src = p.img }
  document.fonts.ready.then(() => { if (!p.img) { draw(T.x, null); T.t.needsUpdate = true } });
  return T.t;
}
/* lined up along the back of the bench, evenly spaced and square, except one in the middle that's been knocked a little askew */
const ROW = { x0: -7.45, x1: 8.65, z: -7.45, skew: 3, by: .17 }, STEP = (ROW.x1 - ROW.x0) / 7; // 2.3 apart: a finger's width between them
const SPOTS = Array.from({ length: 8 }, (_, i) => [ROW.x0 + i * STEP + (i === ROW.skew ? .05 : 0), ROW.z + (i === ROW.skew ? .1 : 0), i === ROW.skew ? ROW.by : 0]);
const lb = $('lb');
DESK.polaroids.slice(0, 8).forEach((p, i) => { const [x, z, r] = SPOTS[i];
  const m = rbox(PW, .03, PD, .02, WHITE); m.position.set(x, .016 + i * .0004, z); m.rotation.y = r; scene.add(m);
  const f = flat(PW, PD, decal(new THREE.MeshStandardMaterial({ map: snap(p, i), transparent: true, roughness: .7, metalness: 0, envMapIntensity: .2 })), .017); f.receiveShadow = true; f.raycast = () => {}; m.add(f);
  keepsake(m, 'snap' + i, () => (p.cap || 'A snapshot') + (p.note ? `<small>${p.note}</small>` : p.img ? '' : '<small>Photo coming soon</small>'), 4.4, () => { if (p.img) { lb.querySelector('img').src = p.img; lb.hidden = false } }) });

/* ── the sticky note: a to-do list of things every designer means to get round to ── */
const noteTex = canvasTex(1024, 1024, x => drawNote(x));
function drawNote(x) { x.setTransform(2, 0, 0, 2, 0, 0); const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#f2d95c'); g.addColorStop(.12, '#f8e676'); g.addColorStop(1, '#f6e06a'); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  x.fillStyle = INK; x.textBaseline = 'middle'; x.textAlign = 'left'; x.font = cut(64); x.save(); x.translate(34, 62); x.rotate(-.03); x.fillText('TO DO', 0, 0); x.restore();
  x.strokeStyle = '#d2451e'; x.lineWidth = 6; x.lineCap = 'round'; sketch(x, [[32, 100], [120, 96], [200, 101]], { jit: 2 });
  DESK.todo.slice(0, 8).forEach((it, n) => { const y = 142 + n * 45; x.strokeStyle = INK; x.lineWidth = 3.5; sketch(x, [[34, y - 13], [60, y - 14], [61, y + 12], [35, y + 13]], { close: true, jit: 1.2 });
    if (it.done) { x.strokeStyle = '#d2451e'; x.lineWidth = 6; sketch(x, [[36, y - 2], [46, y + 9], [68, y - 20]], { jit: 1, passes: 1 }) }
    x.fillStyle = INK; x.font = hand(34); x.fillText(it.t, 78, y + 2); if (it.done) { x.strokeStyle = 'rgba(42,27,18,.7)'; x.lineWidth = 3; sketch(x, [[76, y + 3], [78 + x.measureText(it.t).width, y + 1]], { jit: 1.5, passes: 1 }) } }) }
document.fonts.ready.then(() => { drawNote(noteTex.x); noteTex.t.needsUpdate = true });
{ const m = rbox(2.5, .02, 2.5, .02, card('paper', '#f6e06a', { bumpScale: .1 })); m.position.set(13.9, .012, 6.3); m.rotation.y = -.16; scene.add(m);
  const f = flat(2.5, 2.5, decal(new THREE.MeshStandardMaterial({ map: noteTex.t, roughness: .8, metalness: 0, envMapIntensity: .2 })), .012); f.receiveShadow = true; f.raycast = () => {}; m.add(f);
  keepsake(m, 'todo', () => 'To do<small>One day. Probably.</small>', 3.6) }

/* a hop: up and back down in three drawings' time, with a little twist */
export function updateKeepsakes(dt) { for (const m of HOPS) { if (!m.hop) continue; m.hop = Math.max(0, m.hop - dt * (reduceMotion ? 99 : 3.4)); const k = Math.sin(m.hop * Math.PI); m.position.y = m.y0 + k * .5; m.rotation.z = k * .12 } }
