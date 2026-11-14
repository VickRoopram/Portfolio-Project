/* Label atoms: printed legends (tinted, so the theme can recolour them) and engraved legends sunk into a cap. */
import * as THREE from 'three';
import { canvasTex } from './textures.js';
import { decal } from './materials.js';
import { flat } from './geometry.js';
import { drawIcon } from './icons.js';
import { INK } from './craft.js';

const PRINT_TONE = { '#6b6e76': INK, '#7b7e86': INK, '#ff5d1a': '#d2451e' }; // legends are lettered by hand in ink (orange ones in red marker)
const mono = '400 SIZEpx "Londrina Solid", "Arial Narrow", sans-serif';
/* hand lettering: each letter sits a little off the line and a little turned, and the word is gone over twice */
function letter(x, text, cx, cy, size, track = 0) {
  const ws = [...text].map(ch => x.measureText(ch).width + track), total = ws.reduce((a, b) => a + b, 0); let px = cx - total / 2; x.textAlign = 'center';
  [...text].forEach((ch, i) => { const w = ws[i]; x.save(); x.translate(px + w / 2, cy + (Math.random() - .5) * size * .07); x.rotate((Math.random() - .5) * .07);
    x.fillText(ch, 0, 0); x.globalAlpha = .55; x.fillText(ch, (Math.random() - .5) * 1.6, (Math.random() - .5) * 1.6); x.restore(); px += w });
}
/* white text tinted by the material colour; 256×124 canvas stretched over w × h */
export function printed(text, w = .62, h = .3, color = '#6b6e76', size = 50, dark) {
  /* the canvas takes the plane's shape (413 px per unit, so a .62 × .3 legend is still 256 × 124): lettering is never stretched */
  const { t } = canvasTex(Math.round(w * 413), Math.round(h * 413), (x, W, H) => { const px = Math.round(size * 1.7 * H / 124); x.fillStyle = '#fff'; x.font = mono.replace('SIZE', px); x.textBaseline = 'middle'; letter(x, text, W / 2, H / 2 + 2, px, 2) });
  return tinted(t, w, h, color, dark);
}
/* a printed coolicons glyph instead of a word (same tinting) */
export function printedIcon(name, w = .6, h = .3, color = '#6b6e76', s = 104, dark) {
  return tinted(canvasTex(256, 124, (x, W, H) => drawIcon(x, name, W / 2, H / 2, s, '#fff', 2.4)).t, w, h, color, dark);
}
const tinted = (t, w, h, color, dark) => flat(w, h, decal(new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, color: dark || PRINT_TONE[color] || color })));
/* a tab's name, lettered in ink with a brush pen (was engraved white letters).
   The canvas grows with the plane (200 px per unit), so long words never run off its edge. */
export function engraved(text, w, h, size) {
  const { t } = canvasTex(Math.ceil(w * 200), Math.ceil(h * 200), (x, W, H) => {
    x.font = `900 ${Math.round(size * 2.2)}px "Londrina Solid", "Arial Narrow", sans-serif`; x.textBaseline = 'middle'; x.fillStyle = INK; letter(x, text, W / 2, H / 2 + 3, size * 2.2, 4) });
  return flat(w, h, decal(new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })));
}
