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

/* the overview shows the whole bench (mat, synths, polaroids, lamp, plant, to-do note) on a wide screen; on a phone, held upright, it stays on the synths so they're big enough to play */
const BOX = { all: desktop() ? new THREE.Box3(new THREE.Vector3(-15.9, 0, -9.5), new THREE.Vector3(17.1, 1.6, 9.3)) : new THREE.Box3(new THREE.Vector3(-13.6, 0, -4.6), new THREE.Vector3(13.6, 1.6, 4.6)),
  kb: boxOf([...keyMeshes, ...sharpMeshes, ...ROWBTN.map(a => a[0])]), cv: GROUPS.contact.box,
  desk: new THREE.Box3(new THREE.Vector3(-15.7, -.9, -9.4), new THREE.Vector3(16.9, 0, 9.2)) }; // the whole table top: the furthest you can zoom out
const POLAR = { all: .3, kb: 1.08, cv: 1, desk: .3 }; // angle from straight down
const TABLE = BOX.desk.getCenter(new THREE.Vector3()).setY(0); // the middle of the table top: where the view centres at 0%
const CORNERS = [0, 1, 2, 3, 4, 5, 6, 7].map(i => new THREE.Vector3(i & 1 ? BOX.desk.max.x : BOX.desk.min.x, i & 2 ? BOX.desk.max.y : BOX.desk.min.y, i & 4 ? BOX.desk.max.z : BOX.desk.min.z));
const vR = new THREE.Vector3(), vU = new THREE.Vector3(), vD = new THREE.Vector3(), vC = new THREE.Vector3(), eye = new THREE.Vector3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
/* how far back the camera must sit, looking straight on at the table's middle from tilt phi, for every corner of the table to be in view */
function tableFit(phi, theta = 0) {
  const T = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), tanH = T * stage.clientWidth / stage.clientHeight;
  eye.setFromSphericalCoords(1, phi, theta).add(TABLE); q.setFromRotationMatrix(m4.lookAt(eye, TABLE, camera.up));
  vR.set(1, 0, 0).applyQuaternion(q); vU.set(0, 1, 0).applyQuaternion(q); vD.set(0, 0, 1).applyQuaternion(q); let d = 0;
  for (const c of CORNERS) { vC.copy(c).sub(TABLE); const z = vC.dot(vD); d = Math.max(d, Math.abs(vC.dot(vR)) / tanH + z, Math.abs(vC.dot(vU)) / T + z) }
  return d * 1.05;
}
/* zoom is locked: in = one synth filling the view (the closest device framing), out (0%) = the whole table, from the angle you're
   looking from (you can turn all the way round). Tilt is reined in as you zoom out (tiltCap below), so 0% looks down on the table */
const theta = () => Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
const fitNow = () => Math.max(V.zoom.min * 1.5, tableFit(.3, theta()), tableFit(TILT_OUT, theta()));
/* looking closer at something small on the bench (a polaroid, the to-do note): keepsakes register a box and the camera flies in over it.
   While you're there (V.look) the zoom-in limit is that close-up, not a synth */
export function lookAt(key, box, pol = .32) { cancelJourney(); if (S.mode || S.card) { S.mode = null; closeCard(); updateUI() } BOX[key] = box; POLAR[key] = pol; drum('whoosh'); flyTo(key, 1500) }
export function lockZoom() {
  V.zoom.min = Math.min(frameFor('kb').d, frameFor('cv').d, V.look && BOX[V.look] ? frameFor(V.look).d : Infinity) * .97; V.zoom.max = fitNow();
  if (!V.fly) { controls.minDistance = V.zoom.min; controls.maxDistance = V.zoom.max }
}
const level = d => Math.min(1, Math.max(0, Math.log(V.zoom.max / d) / Math.log(V.zoom.max / V.zoom.min))); // 0 = the whole table, 1 = one synth
/* the side panel (card or menu) on desktop: how much width it takes, and whether one is open (or about to open, mid-journey) */
const sideW = w => Math.min(462, w * .45);
const sideOn = () => desktop() && !!(S.card || S.menu || V.side);
export function frameFor(key) {
  const b = BOX[key], c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3()), all = key === 'all' || key === 'desk', wide = desktop();
  const vw = stage.clientWidth - (wide && !all && sideOn() ? sideW(stage.clientWidth) : 0); // fit the part into the space beside the panel
  const pol = wide || V.look === key ? POLAR[key] : all ? .12 : .78, T = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const tanV = !all && !wide ? T * .62 : T, tanH = T * vw / stage.clientHeight, m = all || !wide ? 1.04 : .96;
  const d = Math.max((s.x / 2 * m) / tanH, ((s.z * Math.cos(pol) + s.y * Math.sin(pol)) / 2 * m + .3) / tanV) + s.y * .5;
  return { t: c, p: new THREE.Vector3(c.x, c.y + d * Math.cos(pol), c.z + d * Math.sin(pol)), d };
}
const sA = new THREE.Spherical(), sB = new THREE.Spherical(), off = new THREE.Vector3();
/* swoop: interpolate in spherical coordinates around a moving target, lifting a little mid-flight, so the camera arcs down like a crane shot */
let framedSide = false, moved = false, grabbing = false; // the panel state the current framing was made for · the visitor has orbited/zoomed since · a drag is in progress
controls.addEventListener('start', () => { moved = true; grabbing = true }); controls.addEventListener('end', () => { grabbing = false });
/* the view always centres on the table top. focus (home.t) = where the last flight looked (a device, or the synths in the overview);
   panning (drag, or the pan pad) moves it and it stays there, kept over the table top (FOCUS). Zooming out slides the centre towards
   the middle of the table, reaching it at 0%. Orbiting (drag, or the rotate buttons) turns all the way round that centre */
const home = { t: new THREE.Vector3(), k: 1 }, want = new THREE.Vector3(), nudge = new THREE.Vector3(), before = new THREE.Vector3();
const FOCUS = new THREE.Box3(new THREE.Vector3(-14.5, 0, -8), new THREE.Vector3(15.7, 1.6, 7.8)); // the table top, a little in from the edge
const dist = () => camera.position.distanceTo(controls.target);
const setHome = t => { home.t.copy(t); home.k = level(dist()) || 1 };
const blend = () => Math.min(1, Math.max(0, 1 - level(dist()) / home.k)); // 0 at the focus's own zoom, 1 at 0%
/* move the orbit centre (and the camera with it, so the view slides rather than turns), kept over the table top */
function shiftView(v) { before.copy(controls.target); controls.target.add(v); FOCUS.clampPoint(controls.target, controls.target); camera.position.add(before.subVectors(controls.target, before)) }
/* after a drag-pan: keep the new centre as the focus (undoing the zoom-out blend so it doesn't drift back) */
const grabT = new THREE.Vector3(); controls.addEventListener('start', () => grabT.copy(controls.target));
controls.addEventListener('end', () => { if (grabT.distanceTo(controls.target) < 1e-3) return; const w = blend(); /* only a real pan: a wheel zoom fires start/end too */ if (w < .98) home.t.copy(controls.target).addScaledVector(want.copy(TABLE), -w).multiplyScalar(1 / (1 - w)); FOCUS.clampPoint(home.t, home.t) });
const pR = new THREE.Vector3(), vF = new THREE.Vector3(), vT = new THREE.Vector3(), AXIS_Y = new THREE.Vector3(0, 1, 0);
/* the pan pad: x = screen right, y = screen up (away from you on the table), in fractions of the view distance */
export function panBy(x, y) {
  if (V.fly) return; const d = dist();
  pR.set(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize();
  vF.set(0, 1, 0).applyQuaternion(camera.quaternion).add(vT.set(0, 0, -1).applyQuaternion(camera.quaternion)).setY(0).normalize(); // screen-up on the table, at any tilt
  nudge.copy(pR).multiplyScalar(x * d).addScaledVector(vF, y * d); home.t.add(nudge); FOCUS.clampPoint(home.t, home.t); shiftView(nudge);
}
/* the rotate buttons: turn round the centre by a radians */
export function spinBy(a) { if (V.fly) return; nudge.subVectors(camera.position, controls.target).applyAxisAngle(AXIS_Y, a); camera.position.copy(controls.target).add(nudge) }
/* the pad's centre button: back to the framing for where you are (a device, or the overview) */
export function recentre() { if (!V.fly) flyTo(S.mode ? MODES[S.mode].box : V.look || 'all', 900) }
/* tilt follows zoom: zoomed out the view looks down on the table (so 0% always shows all of it from above), and the low,
   cinematic angles open up as you zoom in towards a synth */
const TILT_OUT = .55, tiltCap = k => Math.min(1.2, TILT_OUT + .65 * k / .8);
function centre() {
  /* 0% follows the angle you look from: when you're all the way out, stay all the way out as you turn, so the whole table stays in view */
  const d = dist(), out = d >= V.zoom.max * .995; V.zoom.max = fitNow(); controls.maxDistance = V.zoom.max;
  if (out && !grabbing) camera.position.sub(controls.target).setLength(V.zoom.max).add(controls.target);
  controls.maxPolarAngle = tiltCap(level(dist()));
  if (grabbing) { nudge.copy(controls.target); FOCUS.clampPoint(nudge, nudge); if (!nudge.equals(controls.target)) shiftView(vT.subVectors(nudge, controls.target)); return } // a drag-pan stays over the table
  want.lerpVectors(home.t, TABLE, blend()); nudge.subVectors(want, controls.target).multiplyScalar(.12); // glide to the focus
  if (nudge.lengthSq() > 1e-8) { controls.target.add(nudge); camera.position.add(nudge) }
}
export function flyTo(key, dur = 2100) {
  V.look = key in POLAR && !['all', 'kb', 'cv', 'desk'].includes(key) ? key : null;
  const f = frameFor(key); framedSide = key !== 'all' && key !== 'desk' && sideOn(); moved = false; sA.setFromVector3(off.copy(camera.position).sub(controls.target)); sB.setFromVector3(off.copy(f.p).sub(f.t));
  let dT = sB.theta - sA.theta; if (dT > Math.PI) dT -= 2 * Math.PI; if (dT < -Math.PI) dT += 2 * Math.PI;
  V.fly = { t0: controls.target.clone(), t1: f.t, r0: sA.radius, r1: sB.radius, p0: sA.phi, p1: sB.phi, th0: sA.theta, dT, lift: Math.min(.35, Math.abs(sB.phi - sA.phi) * .3), s: performance.now(), dur: reduceMotion ? 1 : dur };
  controls.enabled = false; controls.minDistance = 0; controls.maxDistance = Infinity; controls.maxPolarAngle = Math.PI / 2; // the flight may start outside the zoom range (the intro) or below the tilt cap; locked again on landing
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
export async function journey(ch, i, from = 'menu') { // from: 'menu' shows Back to menu / Cancel on the card; 'cta' (the header Contact button) doesn't
  closeCard(); const id = ++run, live = () => id === run, box = MODES[ch].box, m = (onKeys(ch) ? CTRL.kb : CTRL[ch])?.[i];
  const arrive = () => { if (onKeys(ch)) S.kb = ch; S.mode = ch; updateUI(); modeWave(ch) };
  if (reduceMotion) { arrive(); V.side = true; flyTo(box); V.side = false; push(m, 200); m?.sound?.(); openCard(ch, i, { from, quiet: true }); return }
  if (S.mode || V.fly) { S.mode = null; updateUI(); drum('whoosh'); flyTo('all', OUT); await wait(OUT); if (!live()) return } // pan out first when zoomed in
  arrive(); V.side = true; drum('whoosh'); flyTo(box, IN); // framed for the card that will open beside it
  await wait(IN + 120); if (!live()) return;
  if (m) { push(m); m.sound?.(); S.hover = m; S.hoverUntil = performance.now() + 1600 } // the hover tip names the project as its key goes down
  await wait(480); if (!live()) return;
  openCard(ch, i, { from, quiet: true }); V.side = false;
}
const ease = k => k < .5 ? 8 * k ** 4 : 1 - Math.pow(-2 * k + 2, 4) / 2; // quartic in-out: slow start, slow landing
let offX = 0, offY = 0;
export function updateCamera(now) {
  if (!stage.clientWidth || !stage.clientHeight) return; // hidden: nothing to frame until it has a size again
  const F = V.fly; if (F) { const k = Math.min(1, (now - F.s) / F.dur), e = ease(k); controls.target.lerpVectors(F.t0, F.t1, e);
    sA.set(lerp(F.r0, F.r1, e) * (1 + F.lift * Math.sin(Math.PI * e)), lerp(F.p0, F.p1, e), F.th0 + F.dT * e); camera.position.copy(controls.target).add(off.setFromSpherical(sA));
    if (k >= 1) { V.fly = null; lockZoom(); setHome(F.t1); if (!V.drag) controls.enabled = true } }
  else centre();
  /* a panel opened or closed while zoomed in (and the visitor hasn't moved the camera): glide to the framing that fits beside it */
  if (!F && !V.drag && !moved && S.mode && sideOn() !== framedSide) flyTo(MODES[S.mode].box, 800);
  const w = stage.clientWidth, h = stage.clientHeight, wide = desktop(); if (!w || !h) return; // keep the zoomed part clear of the card or the menu panel
  const side = S.card || S.menu || V.side; offX += ((side && wide ? sideW(w) / 2 : 0) - offX) * .08; offY += ((side && !wide ? h * .28 : 0) - offY) * .08; camera.setViewOffset(w, h, offX, offY, w, h);
}
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; // a hidden page (zero size) would turn every framing into NaN and stick the camera
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  lockZoom(); if (!V.fly) { const f = frameFor(S.mode ? MODES[S.mode].box : V.look || 'all'); camera.position.copy(f.p); controls.target.copy(f.t); controls.update(); setHome(f.t) }
}
new ResizeObserver(resize).observe(stage); resize();
/* the entrance: start high above the synth and swoop down to the overview */
export function swoopIn() { const f = frameFor('all'); camera.position.copy(f.t).add(new THREE.Vector3(0, f.d * 1.9, f.d * .12)); controls.update(); flyTo('all', 2600) }
