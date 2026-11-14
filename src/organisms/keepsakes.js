/* On the workbench around the synths: a light green rubber cutting mat under them, eight polaroids and a sticky-note to-do list.
   The polaroids are views into Vick's life, personality and faith: their images and captions come from DESK in content.js
   (a pencil placeholder until an image is set). Click one and it hops (and opens its picture, once it has one). */
import * as THREE from 'three';
import { $, hits, reduceMotion } from '../core/state.js';
import { DESK } from '../content.js';
import { drum } from '../core/audio.js';
import { scene } from '../core/scene.js';
import { rbox, flat } from '../atoms/geometry.js';
import { canvasTex, TEX } from '../atoms/textures.js';
import { decal } from '../atoms/materials.js';
import { card, rnd, tape, sketch, INK } from '../atoms/craft.js';

const hand = px => `400 ${px}px "Patrick Hand", "Comic Sans MS", cursive`, cut = (px, w = 900) => `${w} ${px}px "Londrina Solid", "Arial Narrow", sans-serif`;

/* ── the craft mat: light green rubber with a printed grid, like a cutting mat. Its right edge stops half way between
   the projects synth (edge at x 9.45) and the lamp (x 12.4); the other sides keep about the same margin round both synths ── */
const MAT = { x0: -14.1, x1: 10.9, z0: -5.3, z1: 5.5, h: .06 }, MW = MAT.x1 - MAT.x0, MD = MAT.z1 - MAT.z0, PPU = 80;
const matTex = canvasTex(Math.round(MW * PPU), Math.round(MD * PPU), (x, W, H) => {
  x.fillStyle = '#a9d7a0'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) { x.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(40,90,50,.05)'; x.fillRect(Math.random() * W, Math.random() * H, 2, 2) } // the rubber's tooth
  const m = .6 * PPU, line = (a, b, c, d, lw, col) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke() };
  for (let u = 0; m + u * PPU / 2 <= W - m + 1; u++) line(m + u * PPU / 2, m, m + u * PPU / 2, H - m, u % 2 ? 1 : 2.2, u % 2 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.7)');
  for (let v = 0; m + v * PPU / 2 <= H - m + 1; v++) line(m, m + v * PPU / 2, W - m, m + v * PPU / 2, v % 2 ? 1 : 2.2, v % 2 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.7)');
  x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 4; x.strokeRect(m, m, W - 2 * m, H - 2 * m);
  x.fillStyle = 'rgba(255,255,255,.85)'; x.font = '600 20px "Patrick Hand", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let u = 0; m + u * PPU <= W - m + 1; u += 2) { x.fillText(u, m + u * PPU, m * .5); x.fillText(u, m + u * PPU, H - m * .5) }
  for (let v = 0; m + v * PPU <= H - m + 1; v += 2) { x.fillText(v, m * .5, m + v * PPU); x.fillText(v, W - m * .5, m + v * PPU) }
  line(m, m, m + 4 * PPU, m + 4 * PPU, 1.6, 'rgba(255,255,255,.5)'); line(W - m, H - m, W - m - 4 * PPU, H - m - 4 * PPU, 1.6, 'rgba(255,255,255,.5)'); // the 45° guides
  x.font = cut(26, 400); x.textAlign = 'left'; x.fillText('VICK DOES CREATIVE  ·  CRAFT MAT', m + 14, H - m - 22) }).t;
const mat = rbox(MW, MAT.h, MD, .05, new THREE.MeshStandardMaterial({ color: '#8fc48a', roughness: .92, metalness: 0, envMapIntensity: .15 }));
mat.position.set((MAT.x0 + MAT.x1) / 2, MAT.h / 2, (MAT.z0 + MAT.z1) / 2); mat.castShadow = false; scene.add(mat);
const matTop = flat(MW - .12, MD - .12, decal(new THREE.MeshStandardMaterial({ map: matTex, roughness: .9, metalness: 0, envMapIntensity: .15, bumpMap: TEX.grain, bumpScale: .12 })), MAT.h / 2 + .002);
matTop.receiveShadow = true; matTop.raycast = () => {}; mat.add(matTop);

/* ── things you can pick at: they hop when clicked ── */
const HOPS = [];
function keepsake(mesh, tip, onClick) { mesh.userData = { tip, tipHTML: typeof tip === 'function' ? tip : undefined, down() { mesh.hop = 1; drum('rim'); onClick?.() } }; mesh.y0 = mesh.position.y; hits.push(mesh); HOPS.push(mesh) }

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
  const T = canvasTex(380, 460, (x, W, H) => draw(x, null));
  function draw(x, img) { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 380, 460); const S = 336, o = 22;
    if (img) { const s = Math.max(S / img.width, S / img.height), w = img.width * s, h = img.height * s; x.save(); x.beginPath(); x.rect(o, o, S, S); x.clip(); x.drawImage(img, o + (S - w) / 2, o + (S - h) / 2, w, h); x.restore() }
    else { x.fillStyle = ['#d9cbb0', '#cfd8c4', '#d8c7c0', '#c9d3d8'][i % 4]; x.fillRect(o, o, S, S); x.strokeStyle = 'rgba(42,27,18,.13)'; x.lineWidth = 2; for (let k = -S; k < S; k += 16) { x.beginPath(); x.moveTo(o + Math.max(0, k), o + Math.max(0, -k)); x.lineTo(o + Math.min(S, k + S), o + Math.min(S, S - k)); x.stroke() }
      x.save(); x.translate(o + S / 2 - 105, o + S / 2 - 105); x.scale(2.1, 2.1); x.strokeStyle = INK; x.lineWidth = 2.6; x.lineCap = x.lineJoin = 'round'; DOODLES[i % DOODLES.length](x); x.restore() }
    x.strokeStyle = 'rgba(42,27,18,.55)'; x.lineWidth = 2; x.strokeRect(o, o, S, S);
    x.fillStyle = INK; x.font = hand(44); x.textAlign = 'center'; x.textBaseline = 'middle'; x.save(); x.translate(190, 410); x.rotate(-.03); x.fillText(p.cap || '', 0, 0); x.restore() }
  if (p.img) { const im = new Image(); im.onload = () => { draw(T.x, im); T.t.needsUpdate = true }; im.src = p.img }
  document.fonts.ready.then(() => { if (!p.img) { draw(T.x, null); T.t.needsUpdate = true } });
  return T.t;
}
/* where they were left: round the edge of the bench, off the mat */
const SPOTS = [[-11.2, -7.4, .22], [-5.2, -7.7, -.14], [1.2, -7.3, .09], [7.2, -7.6, -.3], [14.4, 2.2, .36], [9.4, 7.5, -.12], [3.6, 7.3, .2], [-13.6, 7.4, -.26]];
const lb = $('lb');
DESK.polaroids.slice(0, 8).forEach((p, i) => { const [x, z, r] = SPOTS[i];
  const m = rbox(PW, .03, PD, .02, WHITE); m.position.set(x, .016 + i * .0004, z); m.rotation.y = r + rnd(.1, -.05); scene.add(m);
  const f = flat(PW, PD, decal(new THREE.MeshStandardMaterial({ map: snap(p, i), transparent: true, roughness: .7, metalness: 0, envMapIntensity: .2 })), .017); f.receiveShadow = true; f.raycast = () => {}; m.add(f);
  if (i % 3 === 0) tape(m, rnd(.3, -.15), .02, -PD / 2 + .04, .8, .28, 0);
  keepsake(m, () => (p.cap || 'A snapshot') + (p.note ? `<small>${p.note}</small>` : p.img ? '' : '<small>Photo coming soon</small>'), () => { if (p.img) { lb.querySelector('img').src = p.img; lb.hidden = false } }) });

/* ── the sticky note: a to-do list of things every designer means to get round to ── */
const noteTex = canvasTex(512, 512, x => drawNote(x));
function drawNote(x) { x.setTransform(1, 0, 0, 1, 0, 0); const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#f2d95c'); g.addColorStop(.12, '#f8e676'); g.addColorStop(1, '#f6e06a'); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  x.fillStyle = INK; x.textBaseline = 'middle'; x.textAlign = 'left'; x.font = cut(64); x.save(); x.translate(34, 62); x.rotate(-.03); x.fillText('TO DO', 0, 0); x.restore();
  x.strokeStyle = '#d2451e'; x.lineWidth = 6; x.lineCap = 'round'; sketch(x, [[32, 100], [120, 96], [200, 101]], { jit: 2 });
  DESK.todo.slice(0, 8).forEach((it, n) => { const y = 142 + n * 45; x.strokeStyle = INK; x.lineWidth = 3.5; sketch(x, [[34, y - 13], [60, y - 14], [61, y + 12], [35, y + 13]], { close: true, jit: 1.2 });
    if (it.done) { x.strokeStyle = '#d2451e'; x.lineWidth = 6; sketch(x, [[36, y - 2], [46, y + 9], [68, y - 20]], { jit: 1, passes: 1 }) }
    x.fillStyle = INK; x.font = hand(34); x.fillText(it.t, 78, y + 2); if (it.done) { x.strokeStyle = 'rgba(42,27,18,.7)'; x.lineWidth = 3; sketch(x, [[76, y + 3], [78 + x.measureText(it.t).width, y + 1]], { jit: 1.5, passes: 1 }) } }) }
document.fonts.ready.then(() => { drawNote(noteTex.x); noteTex.t.needsUpdate = true });
{ const m = rbox(2.5, .02, 2.5, .02, card('paper', '#f6e06a', { bumpScale: .1 })); m.position.set(13.9, .012, 6.3); m.rotation.y = -.16; scene.add(m);
  const f = flat(2.5, 2.5, decal(new THREE.MeshStandardMaterial({ map: noteTex.t, roughness: .8, metalness: 0, envMapIntensity: .2 })), .012); f.receiveShadow = true; f.raycast = () => {}; m.add(f);
  keepsake(m, () => 'To do<small>One day. Probably.</small>') }

/* a hop: up and back down in three drawings' time, with a little twist */
export function updateKeepsakes(dt) { for (const m of HOPS) { if (!m.hop) continue; m.hop = Math.max(0, m.hop - dt * (reduceMotion ? 99 : 3.4)); const k = Math.sin(m.hop * Math.PI); m.position.y = m.y0 + k * .5; m.rotation.z = k * .12 } }
