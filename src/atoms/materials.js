/* Material atoms. The site has one look (dark; light mode was removed on 13 Nov 2026), so materials are set once. */
import * as THREE from 'three';
import { TEX, SPUN } from './textures.js';

/* a decal lying on a surface: pulled toward the camera in the depth test, so it never z-fights, however far away the camera is */
export const decal = mt => Object.assign(mt, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
/* hardware palette, keyed by role (the keys are just role ids): deep, warm and matte */
export const C = { body: '#d4d6db', tile: '#e3e4e8', cap: '#eeeff2', pad: '#2c2d31', black: '#232427', ring: '#c4c6cc', recess: '#1b1c1f' };
const PRESET = { // role → colour, env strength, surface
  [C.body]:   { color: '#3a342c', envMapIntensity: .45, metalness: .25, roughness: .52, roughnessMap: TEX.brush, bumpMap: TEX.brush, bumpScale: .18 },
  [C.tile]:   { color: '#2b2721', envMapIntensity: .4, metalness: .15, roughness: .62, roughnessMap: TEX.grain, bumpMap: TEX.grain, bumpScale: .2 },
  [C.cap]:    { color: '#5a544a', envMapIntensity: .7, metalness: 0, roughness: .55, clearcoat: .3, clearcoatRoughness: .45, bumpMap: TEX.grain, bumpScale: .12 },
  [C.pad]:    { color: '#3d3932', envMapIntensity: .7, metalness: 0, roughness: .5, clearcoat: .35, clearcoatRoughness: .4, bumpMap: TEX.grain, bumpScale: .12 },
  [C.black]:  { color: '#28241f', envMapIntensity: .55, metalness: .2, roughness: .55, roughnessMap: TEX.grain, bumpMap: TEX.grain, bumpScale: .15 },
  [C.ring]:   { color: '#8c7b5a', envMapIntensity: .7, metalness: .85, roughness: .28 },   // brass rings + screws
  [C.recess]: { color: '#14120f', metalness: .1, roughness: .75, bumpMap: TEX.grain, bumpScale: .2 },
};
const mats = {};
/* a palette role or any other colour (plain satin plastic); cached per colour + surface */
export const M = (c, r = .62, m = 0) => {
  const k = c + r + m; if (mats[k]) return mats[k]; const p = PRESET[c];
  if (p) return mats[k] = new THREE.MeshPhysicalMaterial({ envMapIntensity: 1, ...p });
  return mats[k] = new THREE.MeshPhysicalMaterial({ color: c, roughness: Math.min(r, .5), metalness: Math.max(m, .15), clearcoat: .25, clearcoatRoughness: .35, bumpMap: TEX.grain, bumpScale: .08, envMapIntensity: .9 });
};
/* forged, spun steel knob caps: part-metal so they read grey from every angle, not a black mirror of the room */
export const STEEL = new THREE.MeshPhysicalMaterial({ color: '#aeb2b8', envMapIntensity: 1.3, map: SPUN.map, metalness: .6, roughness: .46, roughnessMap: SPUN.data, bumpMap: SPUN.data, bumpScale: .35,
  clearcoat: .35, clearcoatRoughness: .25, sheen: .25, sheenColor: '#ffffff', sheenRoughness: .4 });
export const KNURL = new THREE.MeshPhysicalMaterial({ color: '#868990', envMapIntensity: .8, metalness: 1, roughness: .32, bumpMap: TEX.knurl, bumpScale: 1.2, side: THREE.DoubleSide });
/* matte rubber mode-button caps: light only leaks from the gap around them */
export const RUBBER = () => new THREE.MeshPhysicalMaterial({ color: '#24221f', envMapIntensity: .35, roughness: .88, metalness: 0, sheen: .6, sheenColor: '#6d675d', sheenRoughness: .7, bumpMap: TEX.grain, bumpScale: .08, emissive: '#000000' });
