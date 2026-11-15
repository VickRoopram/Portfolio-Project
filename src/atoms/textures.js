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
