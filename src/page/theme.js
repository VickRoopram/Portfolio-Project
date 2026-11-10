/* Light / dark: every light, the background and every themed material ease between two looks; a light sweep re-lights the controls. */
import * as THREE from 'three';
import { $, V, flip, lerp, reduceMotion } from '../core/state.js';
import { ensureAudio, drum } from '../core/audio.js';
import { scene, renderer, hemi, sun, rim, floor, pool, BG } from '../core/scene.js';
import { FXL, FXMATS, pulse } from '../molecules/fx.js';

const LOOK = { // [light, dark]
  bg: ['#ece5d8', '#16140f'], sky: ['#fff8ec', '#8f7a62'], gnd: ['#c9bca6', '#120f0c'], sunCol: ['#fff1dc', '#ffd9b0'], rimCol: ['#ffe9cf', '#ffab70'], pool: ['#ffffff', '#2b241d'],
  hemi: [.55, .22], sun: [1.9, .75], rim: [.7, 1.2], shadow: [.2, .55], exp: [1, 1.05], poolOp: [.5, 1] };
for (const k in LOOK) if (typeof LOOK[k][0] === 'string') LOOK[k] = LOOK[k].map(c => new THREE.Color(c));
const mix = (c, [a, b], k) => c.lerpColors(a, b, k), num = ([a, b], k) => lerp(a, b, k);
let themed = null, blendDark = null;
function applyTheme(k) {
  themed ||= [...new Set((() => { const a = []; scene.traverse(o => [o.material].flat().forEach(m => m?.userData?.tc && a.push(m))); return a })())];
  mix(BG, LOOK.bg, k); mix(hemi.color, LOOK.sky, k); mix(hemi.groundColor, LOOK.gnd, k); mix(sun.color, LOOK.sunCol, k); mix(rim.color, LOOK.rimCol, k); mix(pool.material.color, LOOK.pool, k);
  hemi.intensity = num(LOOK.hemi, k); sun.intensity = num(LOOK.sun, k); rim.intensity = num(LOOK.rim, k); floor.material.opacity = num(LOOK.shadow, k);
  renderer.toneMappingExposure = num(LOOK.exp, k); pool.material.opacity = num(LOOK.poolOp, k);
  for (const m of themed) { const u = m.userData.tc; m._tc ||= [new THREE.Color(u.l), new THREE.Color(u.d)]; m.color.lerpColors(m._tc[0], m._tc[1], k); if (u.le !== undefined && 'envMapIntensity' in m) m.envMapIntensity = lerp(u.le, u.de, k) }
  const bd = k > .5; if (bd !== blendDark) { blendDark = bd; FXMATS.forEach(m => { m.blending = bd ? THREE.AdditiveBlending : THREE.NormalBlending; m.needsUpdate = true }) }
}
const root = document.documentElement, btn = $('thm');
function setTheme(dark, { save = true, sweep = true } = {}) {
  V.themeT = dark ? 1 : 0; root.dataset.theme = dark ? 'dark' : 'light';
  if (save) try { localStorage.setItem('vdc-theme', root.dataset.theme) } catch {}
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#16140f' : '#ece5d8');
  btn.setAttribute('aria-pressed', String(dark)); btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  if (sweep) { flip(btn); const v = new THREE.Vector3(); FXL.forEach(f => { f.m.getWorldPosition(v); pulse(f.m, (v.x + 13) * 32, .6) }); drum(dark ? 'blip' : 'rim') } // left-to-right re-light
}
btn.onclick = () => { ensureAudio(); setTheme(V.themeT < .5) };
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', e => { let saved = null; try { saved = localStorage.getItem('vdc-theme') } catch {} if (!saved) setTheme(e.matches, { save: false }) });
setTheme(root.dataset.theme === 'dark', { save: false, sweep: false });
/* ease the scene toward the chosen look (snaps on the first frame) */
export function updateTheme() {
  if (Math.abs(V.themeK - V.themeT) <= .002) return;
  V.themeK = V.themeK < 0 ? V.themeT : V.themeK + (V.themeT - V.themeK) * (reduceMotion ? 1 : .075); if (Math.abs(V.themeK - V.themeT) <= .002) V.themeK = V.themeT; applyTheme(V.themeK);
}
