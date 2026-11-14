/* Material atoms. One look: a cardboard model (14 Nov 2026). Every surface is card or paper from atoms/craft.js. */
import * as THREE from 'three';
import { TEX, SPUN } from './textures.js';
import { card } from './craft.js';

/* a decal lying on a surface: pulled toward the camera in the depth test, so it never z-fights, however far away the camera is */
export const decal = mt => Object.assign(mt, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
/* hardware palette, keyed by role (the keys are just role ids): deep, warm and matte */
export const C = { body: '#d4d6db', tile: '#e3e4e8', cap: '#eeeff2', pad: '#2c2d31', black: '#232427', ring: '#c4c6cc', recess: '#1b1c1f' };
/* the cardboard model: every role is a kind of card or paper from the texture library, tinted */
const PRESET = {
  [C.body]:   () => card('corr', '#fff4e6'),                       // corrugated box card
  [C.tile]:   () => card('kraft', '#f3e7d3'),                      // kraft panels
  [C.cap]:    () => card('paper', '#fffaf0', { bumpScale: .2 }),   // cream paper keys and caps
  [C.pad]:    () => card('paper', '#3f9aa3', { bumpScale: .2 }),   // teal paper drum pads
  [C.black]:  () => card('edge', '#e9d9c2', { bumpScale: .6 }),    // the box's cut edge: you see the corrugation
  [C.ring]:   () => card('kraft', '#c9995c'),                      // darker card collars
  [C.recess]: () => card('dark', '#8a7663'),                       // the shadowed inside of the box
};
const mats = {};
/* a palette role, or any other colour as a sheet of coloured paper; cached per colour */
export const M = c => mats[c] || (mats[c] = PRESET[c] ? PRESET[c]() : card('paper', c, { bumpScale: .2 }));
/* knob caps: a card disc with pencil rings drawn round it (was spun steel) */
export const STEEL = card('paper', '#f1e2c6', { map: SPUN.map, bumpMap: null });
/* the knob's edge: a strip of card with pencil hatching */
export const KNURL = card('kraft', '#d9b98a', { bumpMap: TEX.knurl, bumpScale: .5, side: THREE.DoubleSide });
/* mode-button tabs: cream paper; their mode colour shows as a marker line round them and a wash of colour on the paper */
export const RUBBER = () => card('paper', '#fbf1dd', { bumpScale: .2, emissive: '#000000' });
