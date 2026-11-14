/* Texture atoms drawn on canvases at load (labels, marker rings, pencil marks). The card, paper and wood photos are in atoms/craft.js. */
import * as THREE from 'three';
import { rrPath } from './geometry.js';

/* a canvas texture. rep: tile it; data: a bump/roughness map (linear, not sRGB) */
export function canvasTex(w, h, draw, { rep, data } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw?.(x, w, h);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; if (!data) t.colorSpace = THREE.SRGBColorSpace;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep) }
  return { c, x, t };
}
/* soft round light filling the canvas (an ellipse when w ≠ h); stops are [offset, alpha, rgb?] */
export const radialTex = (stops, w = 256, h = 256) => canvasTex(w, h, (x, W, H) => {
  x.save(); x.translate(W / 2, H / 2); x.scale(W / 2, H / 2); const g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
  stops.forEach(([o, a, rgb = '255,255,255']) => g.addColorStop(o, `rgba(${rgb},${a})`)); x.fillStyle = g; x.fillRect(-1, -1, 2, 2); x.restore() }).t;

export const TEX = {
  brush: canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const y = Math.random() * h, g = 110 + Math.random() * 60 | 0; x.strokeStyle = `rgba(${g},${g},${g},${.15 + Math.random() * .35})`; x.lineWidth = Math.random() * 1.4 + .3; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y + (Math.random() - .5) * 2); x.stroke() } }, { rep: [2, 2], data: 1 }).t,
  grain: canvasTex(256, 256, (x, w, h) => { const d = x.createImageData(w, h); for (let i = 0; i < d.data.length; i += 4) { const v = 118 + Math.random() * 24 | 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255 } x.putImageData(d, 0, 0) }, { rep: [3, 3], data: 1 }).t,
  /* pencil hatching round the edge of a knob (was a diamond knurl) */
  knurl: canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, w, h); x.lineWidth = 2.4; x.strokeStyle = 'rgba(30,30,30,.9)';
    for (let i = 0; i < w; i += 9) { x.beginPath(); x.moveTo(i + Math.random() * 3, 4 + Math.random() * 8); x.lineTo(i + 3 + Math.random() * 3, h - 4 - Math.random() * 8); x.stroke() } }, { rep: [6, 1], data: 1 }).t,
};

/* the knob caps: a disc of card with pencil rings and a few hatch marks, drawn by hand (was spun steel).
   A cylinder's top face maps its centre to the cap's centre, so the rings sit true. */
export const SPUN = (() => {
  const N = 512, C0 = N / 2, R = (a, b = 0) => b + Math.random() * a;
  const { c } = canvasTex(N, N, x => { x.fillStyle = '#fff'; x.fillRect(0, 0, N, N); x.lineCap = 'round';
    [.42, .3, .13].forEach((r, k) => { for (let p = 0; p < 2; p++) { x.strokeStyle = `rgba(58,40,28,${k ? .5 : .85})`; x.lineWidth = k ? 5 : 9; x.beginPath();
      for (let a = 0; a <= 6.4; a += .2) { const rr = N * r * (1 + (Math.random() - .5) * .035); x.lineTo(C0 + Math.cos(a + p) * rr, C0 + Math.sin(a + p) * rr) } x.stroke() } });
    x.strokeStyle = 'rgba(58,40,28,.28)'; x.lineWidth = 3;
    for (let i = 0; i < 26; i++) { const a = R(6.28), r0 = N * R(.08, .15), r1 = r0 + N * R(.1, .04); x.beginPath(); x.moveTo(C0 + Math.cos(a) * r0, C0 + Math.sin(a) * r0); x.lineTo(C0 + Math.cos(a + .05) * r1, C0 + Math.sin(a + .05) * r1); x.stroke() } });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { map: t, data: t };
})();

/* marker ring: a wobbly felt-tip outline drawn round a control on the card under it (was a blurred glow in the gap).
   Two passes that don't quite meet, like a line gone over twice. Tinted by the material colour. */
const haloCache = {};
export function haloTexture(w, d, r) {
  const k = [w, d, r].map(v => v.toFixed(3)).join(); if (haloCache[k]) return haloCache[k];
  const m = .3, s = 96, W = Math.round((w + 2 * m) * s), H = Math.round((d + 2 * m) * s);
  const { t } = canvasTex(W, H, x => { x.strokeStyle = '#fff'; x.lineCap = x.lineJoin = 'round';
    for (let p = 0; p < 2; p++) { const g = (.035 + p * .03) * s, j = () => (Math.random() - .5) * .035 * s; x.lineWidth = (.06 - p * .02) * s; x.globalAlpha = p ? .7 : 1;
      x.save(); x.translate(W / 2 + j(), H / 2 + j()); x.rotate((Math.random() - .5) * .03); x.beginPath(); rrPath(x, -w * s / 2 - g, -d * s / 2 - g, w * s + 2 * g, d * s + 2 * g, r * s + g); x.stroke(); x.restore() } }, { data: 1 });
  t.anisotropy = 4; return haloCache[k] = { t, m };
}
/* device underlight: brightest right at the casing edge, falling off almost immediately */
export function underlightTexture(w, d, lam) {
  const m = lam * 7, PPU = 56, W = Math.round((w + 2 * m) * PPU), H = Math.max(32, Math.round((d + 2 * m) * PPU)), sx = (w + 2 * m) / W, sz = (d + 2 * m) / H, r = Math.min(.32, d / 3);
  const { t } = canvasTex(W, H, x => { const img = x.createImageData(W, H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const qx = Math.abs((i + .5) * sx - m - w / 2) - (w / 2 - r), qz = Math.abs((j + .5) * sz - m - d / 2) - (d / 2 - r);
      const dist = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;   // signed distance to the footprint edge
      const a = dist <= 0 ? 1 : Math.exp(-dist / lam) * .8 + Math.exp(-dist / (lam * 3)) * .12;        // sharp peak + a short soft tail
      const o = (j * W + i) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = 255; img.data[o + 3] = Math.min(1, a) * 255 }
    x.putImageData(img, 0, 0) }, { data: 1 });
  return { t, m };
}
