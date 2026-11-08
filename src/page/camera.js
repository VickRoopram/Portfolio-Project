/* Camera: a near top-down overview, low cinematic angles per device, crane-shot swoops between them. */
import * as THREE from 'three';
import { S, V, CTRL, ROWBTN, desktop, lerp, reduceMotion } from '../core/state.js';
import { CH, MODES, onKeys } from '../core/data.js';
import { drum } from '../core/audio.js';
import { stage, camera, controls, renderer } from '../core/scene.js';
import { pulse } from '../molecules/fx.js';
import { keyMeshes, sharpMeshes } from '../organisms/synth.js';
import { GROUPS, boxOf } from '../organisms/underlights.js';
import { closeCard, updateUI } from '../organisms/card.js';

const BOX = { all: new THREE.Box3(new THREE.Vector3(-13.6, 0, -4.6), new THREE.Vector3(13.6, 1.6, 4.6)), // the synths fill the view; lamp and plant sit at the edge
  kb: boxOf([...keyMeshes, ...sharpMeshes, ...ROWBTN.map(a => a[0])]), cv: GROUPS.contact.box };
const POLAR = { all: .3, kb: 1.08, cv: 1 }; // angle from straight down
export function frameFor(key) {
  const b = BOX[key], c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3()), all = key === 'all', wide = desktop();
  const pol = wide ? POLAR[key] : all ? .12 : .78, T = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const tanV = !all && !wide ? T * .62 : T, tanH = T * stage.clientWidth / stage.clientHeight, m = all || !wide ? 1.04 : .96;
  const d = Math.max((s.x / 2 * m) / tanH, ((s.z * Math.cos(pol) + s.y * Math.sin(pol)) / 2 * m + .3) / tanV) + s.y * .5;
  return { t: c, p: new THREE.Vector3(c.x, c.y + d * Math.cos(pol), c.z + d * Math.sin(pol)), d };
}
const sA = new THREE.Spherical(), sB = new THREE.Spherical(), off = new THREE.Vector3();
/* swoop: interpolate in spherical coordinates around a moving target, lifting a little mid-flight, so the camera arcs down like a crane shot */
export function flyTo(key, dur = 2100) {
  const f = frameFor(key); sA.setFromVector3(off.copy(camera.position).sub(controls.target)); sB.setFromVector3(off.copy(f.p).sub(f.t));
  let dT = sB.theta - sA.theta; if (dT > Math.PI) dT -= 2 * Math.PI; if (dT < -Math.PI) dT += 2 * Math.PI;
  V.fly = { t0: controls.target.clone(), t1: f.t, r0: sA.radius, r1: sB.radius, p0: sA.phi, p1: sB.phi, th0: sA.theta, dT, lift: Math.min(.35, Math.abs(sB.phi - sA.phi) * .3), s: performance.now(), dur: reduceMotion ? 1 : dur };
  controls.enabled = false; controls.minDistance = f.d * .35; controls.maxDistance = Math.max(f.d * 1.8, frameFor('all').d * 1.5);
}
/* mode switch: its button strokes, then a wave of gap glow ripples across the keys that now hold its work */
function modeWave(ch) {
  ROWBTN.forEach(([m, k]) => { if (k === ch) pulse(m) });
  const g = onKeys(ch) ? 'kb' : CTRL[ch] ? ch : null; if (g) CTRL[g].forEach((m, j) => { if (m && j < CH[ch].items.length) pulse(m, 180 + j * 45, .55) });
}
export function zoomTo(ch) {
  if (S.mode === ch) return; if (onKeys(ch)) S.kb = ch;
  const same = S.mode && MODES[S.mode].box === MODES[ch].box; S.mode = ch; closeCard(); drum(same ? 'blip' : 'whoosh'); if (!same) flyTo(MODES[ch].box); updateUI(); modeWave(ch);
}
export function zoomOut() { S.mode = null; closeCard(); drum('whoosh'); flyTo('all'); updateUI() }
const ease = k => k < .5 ? 8 * k ** 4 : 1 - Math.pow(-2 * k + 2, 4) / 2; // quartic in-out: slow start, slow landing
let offX = 0, offY = 0;
export function updateCamera(now) {
  const F = V.fly; if (F) { const k = Math.min(1, (now - F.s) / F.dur), e = ease(k); controls.target.lerpVectors(F.t0, F.t1, e);
    sA.set(lerp(F.r0, F.r1, e) * (1 + F.lift * Math.sin(Math.PI * e)), lerp(F.p0, F.p1, e), F.th0 + F.dT * e); camera.position.copy(controls.target).add(off.setFromSpherical(sA));
    if (k >= 1) { V.fly = null; if (!V.drag) controls.enabled = true } }
  const w = stage.clientWidth, h = stage.clientHeight, wide = desktop(); // keep the zoomed part clear of the card
  offX += ((S.card && wide ? Math.min(235, w * .18) : 0) - offX) * .08; offY += ((S.card && !wide ? h * .28 : 0) - offY) * .08; camera.setViewOffset(w, h, offX, offY, w, h);
}
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  if (!V.fly) { const f = frameFor(S.mode ? MODES[S.mode].box : 'all'); camera.position.copy(f.p); controls.target.copy(f.t); controls.minDistance = f.d * .35; controls.maxDistance = frameFor('all').d * 1.5; controls.update() }
}
new ResizeObserver(resize).observe(stage); resize();
/* the entrance: start high above the synth and swoop down to the overview */
export function swoopIn() { const f = frameFor('all'); camera.position.copy(f.t).add(new THREE.Vector3(0, f.d * 1.9, f.d * .12)); controls.update(); flyTo('all', 2600) }
