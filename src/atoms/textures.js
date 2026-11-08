/* Texture atoms, all drawn on canvases at load: no image files to fetch. */
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
  /* diamond knurl (crossed 45° grooves), as on precision audio knobs */
  knurl: canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#8a8a8a'; x.fillRect(0, 0, w, h); x.lineWidth = 3.2;
    for (let i = -h; i < w + h; i += 8) { x.strokeStyle = 'rgba(235,235,235,.9)'; x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); x.strokeStyle = 'rgba(40,40,40,.9)'; x.beginPath(); x.moveTo(i + h, 0); x.lineTo(i, h); x.stroke() } }, { rep: [6, 1], data: 1 }).t,
};

/* forged & spun steel for the knob caps: lathe rings, tool-pass bands, radial forging grain, wear scratches, pits and a spindle mark.
   One canvas drives colour, roughness and bump; a cylinder's top face maps its centre to the cap's centre, so the rings sit true. */
export const SPUN = (() => {
  const N = 1024, C0 = N / 2, R = (a, b = 0) => b + Math.random() * a, grey = (g, a) => `rgba(${g},${g},${g},${a})`;
  const { c, x } = canvasTex(N, N, x => { x.fillStyle = '#8c8c8c'; x.fillRect(0, 0, N, N) });
  const ring = (r, g, a, lw) => { x.strokeStyle = grey(g, a); x.lineWidth = lw; x.beginPath(); x.arc(C0, C0, r, 0, 7); x.stroke() };
  for (let r = 2; r < C0 * 1.42; r += 1.15) ring(r, R(44, 118) | 0, R(.45, .25), R(1.1, .6));
  for (let k = 0; k < 14; k++) ring(R(C0 * 1.3, 40), Math.random() < .5 ? 90 : 170, .35, R(3, 2));
  x.save(); x.translate(C0, C0);
  for (let i = 0; i < 720; i++) { const a = R(Math.PI * 2), r0 = R(C0 * .3), r1 = r0 + C0 * R(1.1, .3);
    x.strokeStyle = grey(Math.random() < .5 ? 100 : 160, R(.06, .04)); x.lineWidth = R(1.4, .6); x.beginPath(); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); x.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); x.stroke() }
  x.restore();
  for (let i = 0; i < 70; i++) { const x0 = R(N), y0 = R(N), a = R(Math.PI * 2), L = 20 + R(Math.random() < .15 ? 420 : 140), bend = (Math.random() - .5) * .6;
    x.strokeStyle = Math.random() < .6 ? grey(40, R(.4, .35)) : grey(235, R(.4, .3)); x.lineWidth = R(1.3, .5); x.beginPath(); x.moveTo(x0, y0);
    x.quadraticCurveTo(x0 + Math.cos(a + bend) * L * .5, y0 + Math.sin(a + bend) * L * .5, x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); x.stroke() }
  for (let i = 0; i < 260; i++) { x.fillStyle = grey(Math.random() < .5 ? 60 : 200, R(.3, .15)); x.fillRect(R(N), R(N), R(2, 1), R(2, 1)) }
  const sp = x.createRadialGradient(C0, C0, 0, C0, C0, 26); sp.addColorStop(0, '#5a5a5a'); sp.addColorStop(.6, '#7a7a7a'); sp.addColorStop(1, 'rgba(140,140,140,0)');
  x.fillStyle = sp; x.beginPath(); x.arc(C0, C0, 26, 0, 7); x.fill();
  const mk = cs => { const t = new THREE.CanvasTexture(c); t.colorSpace = cs; t.anisotropy = 8; return t };
  return { map: mk(THREE.SRGBColorSpace), data: mk(THREE.NoColorSpace) };
})();

/* gap halo: a blurred rounded-rect mask, drawn with an off-canvas shadow so it works without ctx.filter */
const haloCache = {};
export function haloTexture(w, d, r) {
  const k = [w, d, r].map(v => v.toFixed(3)).join(); if (haloCache[k]) return haloCache[k];
  const m = .3, s = 96, W = Math.round((w + 2 * m) * s), H = Math.round((d + 2 * m) * s), off = W * 4;
  const { t } = canvasTex(W, H, x => {
    x.shadowColor = '#fff'; x.shadowOffsetX = off;
    x.shadowBlur = .16 * s; x.fillStyle = '#fff'; x.beginPath(); rrPath(x, m * s - off, m * s, w * s, d * s, r * s); x.fill();     // wide soft bloom
    x.shadowBlur = .035 * s; x.lineWidth = .05 * s; x.strokeStyle = '#fff'; x.beginPath();
    rrPath(x, m * s - off - .015 * s, m * s - .015 * s, (w + .03) * s, (d + .03) * s, (r + .015) * s); x.stroke() }, { data: 1 }); // bright rim at the gap
  t.anisotropy = 1; return haloCache[k] = { t, m };
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
