/* Camera: a near top-down overview, low cinematic angles per device, crane-shot swoops between them. */
import * as THREE from 'three';
import { S, V, CTRL, ROWBTN, desktop, lerp, reduceMotion } from '../core/state.js';
import { CH, MODES, onKeys } from '../core/data.js';
import { drum } from '../core/audio.js';
import { push } from '../molecules/controls.js';
import { stage, camera, controls, renderer } from '../core/scene.js';
import { pulse } from '../molecules/fx.js';
import { keyMeshes, sharpMeshes } from '../organisms/synth.js';
import { GROUPS, boxOf } from '../organisms/underlights.js';
import { openCard, closeCard, updateUI } from '../organisms/card.js';

const BOX = { all: new THREE.Box3(new THREE.Vector3(-13.6, 0, -4.6), new THREE.Vector3(13.6, 1.6, 4.6)), // the synths fill the view; lamp and plant sit at the edge
  kb: boxOf([...keyMeshes, ...sharpMeshes, ...ROWBTN.map(a => a[0])]), cv: GROUPS.contact.box,
  desk: new THREE.Box3(new THREE.Vector3(-15.7, -.9, -9.4), new THREE.Vector3(16.9, 0, 9.2)) }; // the whole table top: the furthest you can zoom out
const POLAR = { all: .3, kb: 1.08, cv: 1, desk: .3 }; // angle from straight down
const TABLE = BOX.desk.getCenter(new THREE.Vector3()).setY(0); // the middle of the table top: where the view centres at 0%
const CORNERS = [0, 1, 2, 3, 4, 5, 6, 7].map(i => new THREE.Vector3(i & 1 ? BOX.desk.max.x : BOX.desk.min.x, i & 2 ? BOX.desk.max.y : BOX.desk.min.y, i & 4 ? BOX.desk.max.z : BOX.desk.min.z));
const vR = new THREE.Vector3(), vU = new THREE.Vector3(), vD = new THREE.Vector3(), vC = new THREE.Vector3(), eye = new THREE.Vector3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
/* how far back the camera must sit, looking straight on at the table's middle from tilt phi, for every corner of the table to be in view */
function tableFit(phi) {
  const T = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), tanH = T * stage.clientWidth / stage.clientHeight;
  eye.setFromSphericalCoords(1, phi, 0).add(TABLE); q.setFromRotationMatrix(m4.lookAt(eye, TABLE, camera.up));
  vR.set(1, 0, 0).applyQuaternion(q); vU.set(0, 1, 0).applyQuaternion(q); vD.set(0, 0, 1).applyQuaternion(q); let d = 0;
  for (const c of CORNERS) { vC.copy(c).sub(TABLE); const z = vC.dot(vD); d = Math.max(d, Math.abs(vC.dot(vR)) / tanH + z, Math.abs(vC.dot(vU)) / T + z) }
  return d * 1.05;
}
/* zoom is locked: in = one synth filling the view (the closest device framing), out (0%) = the whole table seen from above.
   Rotation and tilt are reined in as you zoom out (tiltCap/turnCap below), so at 0% the camera is straight on and the table fits */
export function lockZoom() {
  V.zoom.min = Math.min(frameFor('kb').d, frameFor('cv').d) * .97; V.zoom.max = Math.max(V.zoom.min * 1.5, tableFit(.3), tableFit(TILT_OUT));
  if (!V.fly) { controls.minDistance = V.zoom.min; controls.maxDistance = V.zoom.max }
}
const level = d => Math.min(1, Math.max(0, Math.log(V.zoom.max / d) / Math.log(V.zoom.max / V.zoom.min))); // 0 = the whole table, 1 = one synth
/* the side panel (card or menu) on desktop: how much width it takes, and whether one is open (or about to open, mid-journey) */
const sideW = w => Math.min(462, w * .45);
const sideOn = () => desktop() && !!(S.card || S.menu || V.side);
export function frameFor(key) {
  const b = BOX[key], c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3()), all = key === 'all' || key === 'desk', wide = desktop();
  const vw = stage.clientWidth - (wide && !all && sideOn() ? sideW(stage.clientWidth) : 0); // fit the part into the space beside the panel
  const pol = wide ? POLAR[key] : all ? .12 : .78, T = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const tanV = !all && !wide ? T * .62 : T, tanH = T * vw / stage.clientHeight, m = all || !wide ? 1.04 : .96;
  const d = Math.max((s.x / 2 * m) / tanH, ((s.z * Math.cos(pol) + s.y * Math.sin(pol)) / 2 * m + .3) / tanV) + s.y * .5;
  return { t: c, p: new THREE.Vector3(c.x, c.y + d * Math.cos(pol), c.z + d * Math.sin(pol)), d };
}
const sA = new THREE.Spherical(), sB = new THREE.Spherical(), off = new THREE.Vector3();
/* swoop: interpolate in spherical coordinates around a moving target, lifting a little mid-flight, so the camera arcs down like a crane shot */
let framedSide = false, moved = false, grabbing = false; // the panel state the current framing was made for · the visitor has orbited/zoomed since · a drag is in progress
controls.addEventListener('start', () => { moved = true; grabbing = true }); controls.addEventListener('end', () => { grabbing = false });
/* the view always centres on the table and its synths. home = where the last flight looked (a device, or the synths in the overview)
   and how far in it was. Zooming out from there slides the centre towards the middle of the table, reaching it at 0%.
   Panning can nudge the view (up to PAN_MAX) while you drag; let go and it springs back to centre. Orbiting turns around that centre */
const home = { t: new THREE.Vector3(), k: 1 }, want = new THREE.Vector3(), nudge = new THREE.Vector3(), PAN_MAX = 2.5;
const setHome = t => { home.t.copy(t); home.k = level(camera.position.distanceTo(controls.target)) || 1 };
/* tilt follows zoom: zoomed out the view looks down on the table (so 0% always shows all of it from above), and the low,
   cinematic angles open up as you zoom in towards a synth */
const TILT_OUT = .55, tiltCap = k => Math.min(1.2, TILT_OUT + .65 * k / .8), turnCap = k => 1.1 * Math.min(1, k / .45);
function centre() {
  const k = level(camera.position.distanceTo(controls.target)), w = Math.min(1, Math.max(0, 1 - k / home.k));
  controls.maxPolarAngle = tiltCap(k); controls.minAzimuthAngle = -turnCap(k); controls.maxAzimuthAngle = turnCap(k);
  want.lerpVectors(home.t, TABLE, w); nudge.subVectors(want, controls.target);
  if (grabbing) { const over = nudge.length() - PAN_MAX; if (over <= 0) return; nudge.setLength(over) } // dragging: only stop it straying too far
  else nudge.multiplyScalar(.12);                                                                       // let go: spring back
  if (nudge.lengthSq() < 1e-8) return; controls.target.add(nudge); camera.position.add(nudge);
}
export function flyTo(key, dur = 2100) {
  const f = frameFor(key); framedSide = key !== 'all' && key !== 'desk' && sideOn(); moved = false; sA.setFromVector3(off.copy(camera.position).sub(controls.target)); sB.setFromVector3(off.copy(f.p).sub(f.t));
  let dT = sB.theta - sA.theta; if (dT > Math.PI) dT -= 2 * Math.PI; if (dT < -Math.PI) dT += 2 * Math.PI;
  V.fly = { t0: controls.target.clone(), t1: f.t, r0: sA.radius, r1: sB.radius, p0: sA.phi, p1: sB.phi, th0: sA.theta, dT, lift: Math.min(.35, Math.abs(sB.phi - sA.phi) * .3), s: performance.now(), dur: reduceMotion ? 1 : dur };
  controls.enabled = false; controls.minDistance = 0; controls.maxDistance = Infinity; controls.maxPolarAngle = Math.PI / 2; controls.minAzimuthAngle = -Math.PI; controls.maxAzimuthAngle = Math.PI; // the flight may start outside the zoom range (the intro) or below the tilt cap; locked again on landing
}
/* mode switch: its button strokes, then a wave of gap glow ripples across the keys that now hold its work */
function modeWave(ch) {
  ROWBTN.forEach(([m, k]) => { if (k === ch) pulse(m) });
  const g = onKeys(ch) ? 'kb' : CTRL[ch] ? ch : null; if (g) CTRL[g].forEach((m, j) => { if (m && j < CH[ch].items.length) pulse(m, 180 + j * 45, .55) });
}
export function zoomTo(ch) {
  cancelJourney(); if (S.mode === ch) return; if (onKeys(ch)) S.kb = ch;
  const same = S.mode && MODES[S.mode].box === MODES[ch].box; S.mode = ch; closeCard(); drum(same ? 'blip' : 'whoosh'); if (!same) flyTo(MODES[ch].box); updateUI(); modeWave(ch);
}
export function zoomOut() { cancelJourney(); S.mode = null; closeCard(); drum('whoosh'); flyTo('all'); updateUI() }

/* The menu's project journey: the camera pans out to the whole desk, swoops into the device that holds the item,
   the item's key is pushed down (you see it sink and hear it), then the card opens on the side where the menu was.
   Any other navigation (a click on the synth, a mode key, Home, the menu again) cancels the steps still to come. */
const OUT = 950, IN = 1500, wait = ms => new Promise(r => setTimeout(r, ms));
let run = 0;
export const cancelJourney = () => { run++; V.side = false };
export async function journey(ch, i) {
  closeCard(); const id = ++run, live = () => id === run, box = MODES[ch].box, m = (onKeys(ch) ? CTRL.kb : CTRL[ch])?.[i];
  const arrive = () => { if (onKeys(ch)) S.kb = ch; S.mode = ch; updateUI(); modeWave(ch) };
  if (reduceMotion) { arrive(); V.side = true; flyTo(box); V.side = false; push(m, 200); m?.sound?.(); openCard(ch, i, { from: 'menu', quiet: true }); return }
  if (S.mode || V.fly) { S.mode = null; updateUI(); drum('whoosh'); flyTo('all', OUT); await wait(OUT); if (!live()) return } // pan out first when zoomed in
  arrive(); V.side = true; drum('whoosh'); flyTo(box, IN); // framed for the card that will open beside it
  await wait(IN + 120); if (!live()) return;
  if (m) { push(m); m.sound?.(); S.hover = m; S.hoverUntil = performance.now() + 1600 } // the hover tip names the project as its key goes down
  await wait(480); if (!live()) return;
  openCard(ch, i, { from: 'menu', quiet: true }); V.side = false;
}
const ease = k => k < .5 ? 8 * k ** 4 : 1 - Math.pow(-2 * k + 2, 4) / 2; // quartic in-out: slow start, slow landing
let offX = 0, offY = 0;
export function updateCamera(now) {
  const F = V.fly; if (F) { const k = Math.min(1, (now - F.s) / F.dur), e = ease(k); controls.target.lerpVectors(F.t0, F.t1, e);
    sA.set(lerp(F.r0, F.r1, e) * (1 + F.lift * Math.sin(Math.PI * e)), lerp(F.p0, F.p1, e), F.th0 + F.dT * e); camera.position.copy(controls.target).add(off.setFromSpherical(sA));
    if (k >= 1) { V.fly = null; lockZoom(); setHome(F.t1); if (!V.drag) controls.enabled = true } }
  else centre();
  /* a panel opened or closed while zoomed in (and the visitor hasn't moved the camera): glide to the framing that fits beside it */
  if (!F && !V.drag && !moved && S.mode && sideOn() !== framedSide) flyTo(MODES[S.mode].box, 800);
  const w = stage.clientWidth, h = stage.clientHeight, wide = desktop(); // keep the zoomed part clear of the card or the menu panel
  const side = S.card || S.menu || V.side; offX += ((side && wide ? sideW(w) / 2 : 0) - offX) * .08; offY += ((side && !wide ? h * .28 : 0) - offY) * .08; camera.setViewOffset(w, h, offX, offY, w, h);
}
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  lockZoom(); if (!V.fly) { const f = frameFor(S.mode ? MODES[S.mode].box : 'all'); camera.position.copy(f.p); controls.target.copy(f.t); controls.update(); setHome(f.t) }
}
new ResizeObserver(resize).observe(stage); resize();
/* the entrance: start high above the synth and swoop down to the overview */
export function swoopIn() { const f = frameFor('all'); camera.position.copy(f.t).add(new THREE.Vector3(0, f.d * 1.9, f.d * .12)); controls.update(); flyTo('all', 2600) }
