/* Craft atoms: the cardboard-model look. Photo textures of card, paper and wood (assets/tex, from Vick's texture library),
   the ink outline every piece gets, and the frame rate the whole site is animated at. */
import * as THREE from 'three';

/* "On twos": every drawing is held for two frames of a 24 fps film, so the site shows 12 new pictures a second.
   Change this one number to make the stop-motion feel choppier (8, 6 …) or smoother (24). The CSS twin is --step in styles/skin.css. */
export const FPS = 12;
/* the hand-drawn line "boils": outlines are redrawn a touch thicker or thinner on every second picture */
export const BOIL_EVERY = 2;

const loader = new THREE.TextureLoader();
/* a photo texture, mirror-tiled so it never shows a seam; data: a bump map (linear, not sRGB) */
const photo = (file, data) => { const t = loader.load('assets/tex/' + file); t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = 8; if (!data) t.colorSpace = THREE.SRGBColorSpace; return t };
const pair = file => ({ map: photo(file), bump: photo(file, 1) });
export const PAPER = { kraft: pair('kraft.jpg'), dark: pair('kraft-dark.jpg'), corr: pair('corrugated.jpg'), edge: pair('edge.jpg'), paper: pair('paper.jpg'), wood: pair('wood.jpg') };
/* a piece of card or paper: matte, a little tooth from the photo, almost no reflection. tint multiplies the photo */
export const card = (kind, tint = '#ffffff', o = {}) => new THREE.MeshStandardMaterial({ map: PAPER[kind].map, bumpMap: PAPER[kind].bump, bumpScale: .35, color: tint, roughness: .96, metalness: 0, envMapIntensity: .18, ...o });

/* ink outline: the same shape, a little bigger, drawn inside out in ink, so every piece gets a marker line round its silhouette */
export const INK = '#2a1b12';
const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
const LINES = [];
export function outline(mesh, w, h, d, t = .03) {
  const o = new THREE.Mesh(mesh.geometry, inkMat); o.raycast = () => {}; o.line = { w, h, d, t };
  o.scale.set((w + 2 * t) / w, (h + 2 * t) / h, (d + 2 * t) / d); mesh.add(o); LINES.push(o); return o;
}
/* boil: each line's thickness is redrawn between 70% and 130%, like a line traced again for every drawing */
export function boil() { for (const o of LINES) { const { w, h, d } = o.line, t = o.line.t * (.7 + Math.random() * .6); o.scale.set((w + 2 * t) / w, (h + 2 * t) / h, (d + 2 * t) / d) } }

/* a wobbly hand-drawn line through points on a canvas: drawn twice, slightly off, like a marker gone over */
export function sketch(x, pts, { close = false, jit = 1.5, passes = 2 } = {}) {
  for (let p = 0; p < passes; p++) { x.beginPath();
    pts.forEach(([px, py], i) => { const jx = px + (Math.random() - .5) * jit * 2, jy = py + (Math.random() - .5) * jit * 2; i ? x.lineTo(jx, jy) : x.moveTo(jx, jy) });
    if (close) x.closePath(); x.stroke() }
}
