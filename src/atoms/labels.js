/* Label atoms: printed legends (tinted, so the theme can recolour them) and engraved legends sunk into a cap. */
import * as THREE from 'three';
import { canvasTex } from './textures.js';
import { themed, decal } from './materials.js';
import { flat } from './geometry.js';
import { drawIcon } from './icons.js';

const PRINT_DARK = { '#6b6e76': '#b9ab92', '#7b7e86': '#a99c86' }; // grey legends warm up at night
const mono = '600 SIZEpx "IBM Plex Mono", monospace';
/* white text tinted by the material colour; 256×124 canvas stretched over w × h */
export function printed(text, w = .62, h = .3, color = '#6b6e76', size = 50, dark) {
  const { t } = canvasTex(256, 124, (x, W, H) => { x.fillStyle = '#fff'; x.font = mono.replace('SIZE', size); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, W / 2, H / 2 + 2) });
  return tinted(t, w, h, color, dark);
}
/* a printed coolicons glyph instead of a word (same tinting) */
export function printedIcon(name, w = .6, h = .3, color = '#6b6e76', s = 84, dark) {
  return tinted(canvasTex(256, 124, (x, W, H) => drawIcon(x, name, W / 2, H / 2, s, '#fff', 2.2)).t, w, h, color, dark);
}
const tinted = (t, w, h, color, dark) => flat(w, h, decal(themed(new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, color }), color, dark || PRINT_DARK[color] || color)));
/* inlaid white letters a touch below the surface: a shadowed top wall and a catch-light on the lower lip.
   The canvas grows with the plane (160 px per unit across, 248 down), so long words never run off its edge. */
export function engraved(text, w, h, size) {
  const { t } = canvasTex(Math.ceil(w * 160), Math.ceil(h * 248), (x, W, H) => {
    x.font = `700 ${size}px Montserrat, "Noto Sans", sans-serif`; if (x.letterSpacing !== undefined) x.letterSpacing = '2px'; x.textAlign = 'center'; x.textBaseline = 'middle';
    [['rgba(0,0,0,.85)', .5], ['rgba(255,255,255,.22)', 3.5], ['rgba(226,222,214,.88)', 2]].forEach(([c, dy]) => { x.fillStyle = c; x.fillText(text, W / 2, H / 2 + dy) }) });
  return flat(w, h, decal(new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })));
}
