/* Material atoms. Every material tagged with themed() is eased between its light and dark colour by the theme engine. */
import * as THREE from 'three';
import { TEX, SPUN } from './textures.js';

/* a decal lying on a surface: pulled toward the camera in the depth test, so it never z-fights, however far away the camera is */
export const decal = mt => Object.assign(mt, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
export function themed(mt, l, d, le = mt.envMapIntensity, de = le) { mt.userData.tc = { l, d, le, de }; return mt }
/* hardware palette, keyed by role: playful, warm and matte by day (cream, warm grey), deep and warm at night */
export const C = { body: '#d4d6db', tile: '#e3e4e8', cap: '#eeeff2', pad: '#2c2d31', black: '#232427', ring: '#c4c6cc', recess: '#1b1c1f' };
const PRESET = { // light colour → dark colour, env strength in dark mode, surface
  [C.body]:   { color: '#e7dcc8', dark: '#3a342c', denv: .45, metalness: .25, roughness: .52, roughnessMap: TEX.brush, bumpMap: TEX.brush, bumpScale: .18 },
  [C.tile]:   { color: '#d9cdb6', dark: '#2b2721', denv: .4, metalness: .15, roughness: .62, roughnessMap: TEX.grain, bumpMap: TEX.grain, bumpScale: .2 },
  [C.cap]:    { color: '#f5eddc', dark: '#5a544a', denv: .7, metalness: 0, roughness: .55, clearcoat: .3, clearcoatRoughness: .45, bumpMap: TEX.grain, bumpScale: .12 },
  [C.pad]:    { color: '#5b554b', dark: '#3d3932', denv: .7, metalness: 0, roughness: .5, clearcoat: .35, clearcoatRoughness: .4, bumpMap: TEX.grain, bumpScale: .12 },
  [C.black]:  { color: '#4b453c', dark: '#28241f', denv: .55, metalness: .2, roughness: .55, roughnessMap: TEX.grain, bumpMap: TEX.grain, bumpScale: .15 },
  [C.ring]:   { color: '#d6c59e', dark: '#8c7b5a', denv: .7, metalness: .85, roughness: .28 },   // brass rings + screws
  [C.recess]: { color: '#24201b', dark: '#14120f', metalness: .1, roughness: .75, bumpMap: TEX.grain, bumpScale: .2 },
};
const mats = {};
/* a palette role (themed) or any other colour (plain satin plastic); cached per colour + surface */
export const M = (c, r = .62, m = 0) => {
  const k = c + r + m; if (mats[k]) return mats[k]; const p = PRESET[c];
  if (p) { const { dark, denv, ...o } = p; return mats[k] = themed(new THREE.MeshPhysicalMaterial(o), o.color, dark, 1, denv ?? 1) }
  return mats[k] = new THREE.MeshPhysicalMaterial({ color: c, roughness: Math.min(r, .5), metalness: Math.max(m, .15), clearcoat: .25, clearcoatRoughness: .35, bumpMap: TEX.grain, bumpScale: .08, envMapIntensity: .9 });
};
/* forged, spun steel knob caps: part-metal so they read grey from every angle, not a black mirror of the room */
export const STEEL = themed(new THREE.MeshPhysicalMaterial({ color: '#c9ccd1', map: SPUN.map, metalness: .6, roughness: .46, roughnessMap: SPUN.data, bumpMap: SPUN.data, bumpScale: .35,
  clearcoat: .35, clearcoatRoughness: .25, sheen: .25, sheenColor: '#ffffff', sheenRoughness: .4 }), '#c9ccd1', '#aeb2b8', 1.1, 1.3);
export const KNURL = themed(new THREE.MeshPhysicalMaterial({ color: '#b9bcc2', metalness: 1, roughness: .32, bumpMap: TEX.knurl, bumpScale: 1.2, side: THREE.DoubleSide }), '#b9bcc2', '#868990', 1, .8);
/* matte rubber mode-button caps: light only leaks from the gap around them */
export const RUBBER = () => themed(new THREE.MeshPhysicalMaterial({ color: '#3b3833', roughness: .88, metalness: 0, sheen: .6, sheenColor: '#6d675d', sheenRoughness: .7, bumpMap: TEX.grain, bumpScale: .08, emissive: '#000000' }), '#3b3833', '#24221f', .5, .35);
