/* Joystick, locked to the bottom right (the zoom guide sits beside it):
   - the stick pans: push it and the view slides across the table that way, faster the further you push (a rate control);
     let go and it springs back to centre with a little overshoot. A tap (no drag) recentres the view.
   - the ring round it rotates: drag it round and the view turns with it, one for one. It doubles as a compass (it turns
     with the view however you rotate, with a north tick), and its two arrows turn the view a step (hold to keep turning).
   - it mirrors the mouse and trackpad: pan or rotate the view by dragging and the stick leans the way the view is moving
     (and the ring turns), the way the zoom guide shows scrolling. Flights and zooming don't count.
   The camera does the moving (page/camera.js panBy, spinBy, recentre via act). */
import * as THREE from 'three';
import { $, S, V, act, desktop, reduceMotion } from '../core/state.js';
import { camera, controls } from '../core/scene.js';

const el = $('joy'), stick = $('jstick'), dial = $('jdial');
const PAN = .25, SPIN = 1.25, TAP = 220, K = 260, C = 20; // pan: view-distances/s at full push · spin: rad/s · nudge length (ms) · spring
let travel = 22, st = { x: 0, y: 0, vx: 0, vy: 0, held: false }, grab = null, spin = { want: 0, v: 0, until: 0, btn: null }, keyPan = { x: 0, y: 0, until: 0 };
const measure = () => { travel = (el.offsetWidth * .5 - stick.offsetWidth * .5) * .62 };
addEventListener('resize', measure); measure();

/* stick */
stick.addEventListener('pointerdown', e => {
  e.preventDefault(); try { stick.setPointerCapture(e.pointerId) } catch {} measure(); act.cancelJourney?.();
  const r = stick.getBoundingClientRect(); grab = { id: e.pointerId, cx: r.left + r.width / 2 - st.x, cy: r.top + r.height / 2 - st.y, t: performance.now(), moved: 0 }; st.held = true;
});
stick.addEventListener('pointermove', e => {
  if (!grab || e.pointerId !== grab.id) return; let x = e.clientX - grab.cx, y = e.clientY - grab.cy; const l = Math.hypot(x, y);
  grab.moved = Math.max(grab.moved, l); if (l > travel) { x *= travel / l; y *= travel / l } st.x = x; st.y = y;
});
const drop = e => { if (!grab || (e && e.pointerId !== grab.id)) return; if (grab.moved < 6 && performance.now() - grab.t < 350) act.recentre(); grab = null; st.held = false };
stick.addEventListener('pointerup', drop); stick.addEventListener('pointercancel', drop);
stick.addEventListener('keydown', e => {
  const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
  if (d) { e.preventDefault(); keyPan = { x: d[0], y: d[1], until: performance.now() + TAP } } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act.recentre() }
});

/* ring: drag round to turn the view */
let ring = null;
const angleAt = e => { const r = el.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) };
dial.addEventListener('pointerdown', e => { e.preventDefault(); try { dial.setPointerCapture(e.pointerId) } catch {} ring = { id: e.pointerId, a: angleAt(e) }; dial.classList.add('on'); act.cancelJourney?.() });
dial.addEventListener('pointermove', e => { if (!ring || e.pointerId !== ring.id) return; const a = angleAt(e); let d = a - ring.a; d = Math.atan2(Math.sin(d), Math.cos(d)); ring.a = a; act.spinBy(d) });
const ringUp = e => { if (ring && e.pointerId === ring.id) { ring = null; dial.classList.remove('on') } };
dial.addEventListener('pointerup', ringUp); dial.addEventListener('pointercancel', ringUp);

/* ring arrows: tap = a step, hold = keep turning */
el.querySelectorAll('[data-spin]').forEach(b => {
  b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId) } catch {} spin = { ...spin, want: +b.dataset.spin, until: performance.now() + TAP, btn: b }; b.classList.add('on'); act.cancelJourney?.() });
  const up = () => { if (spin.btn === b) { spin.btn = null; b.classList.remove('on') } };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); spin = { ...spin, want: +b.dataset.spin, until: performance.now() + TAP } } });
});
el.addEventListener('contextmenu', e => e.preventDefault());

/* mirror: how the view moved since last frame, in the stick's terms */
const lastT = new THREE.Vector3(), dT = new THREE.Vector3(), mR = new THREE.Vector3(), mF = new THREE.Vector3(), mU = new THREE.Vector3();
let lastTh = null, lastPh = 0, lastD = 0, mirror = { x: 0, y: 0 };
function sense(dt, th) {
  const off = camera.position.clone().sub(controls.target), d = off.length(), ph = Math.acos(Math.min(1, Math.max(-1, off.y / d)));
  dT.subVectors(controls.target, lastT); lastT.copy(controls.target);
  let dth = th - (lastTh ?? th); dth = Math.atan2(Math.sin(dth), Math.cos(dth)); const dph = ph - lastPh, zooming = lastD && Math.abs(d - lastD) / d > .002;
  lastTh = th; lastPh = ph; lastD = d;
  if (V.fly || zooming || st.held || ring || spin.btn || dt <= 0) { mirror.x = mirror.y = 0; return }
  mR.set(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize();
  mF.set(0, 1, 0).applyQuaternion(camera.quaternion).add(mU.set(0, 0, -1).applyQuaternion(camera.quaternion)).setY(0).normalize();
  const px = dT.dot(mR) / d / dt / PAN, py = dT.dot(mF) / d / dt / PAN; // pan, as a fraction of a full push
  const rx = -dth / dt / (SPIN * 2), ry = dph / dt / 1.5;               // orbit: sideways turn and tilt
  mirror.x = Math.max(-1, Math.min(1, px + rx)); mirror.y = Math.max(-1, Math.min(1, py + ry));
}

export function updateJoystick(now, dt) {
  const th = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z); sense(dt, th);
  /* stick: held = follow the finger; released = damped spring towards the mirrored movement (centre when still), a small overshoot */
  const mx = mirror.x * travel, my = -mirror.y * travel; el.classList.toggle('mirror', Math.hypot(mirror.x, mirror.y) > .08);
  if (!st.held) { if (reduceMotion) { st.x = mx; st.y = my; st.vx = st.vy = 0 } else { st.vx += (-K * (st.x - mx) - C * st.vx) * dt; st.vy += (-K * (st.y - my) - C * st.vy) * dt; st.x += st.vx * dt; st.y += st.vy * dt } }
  stick.style.transform = `translate(${st.x.toFixed(1)}px,${st.y.toFixed(1)}px)`;
  let px = st.held ? st.x / travel : 0, py = st.held ? -st.y / travel : 0;
  if (now < keyPan.until) { px = keyPan.x; py = keyPan.y }
  if (px || py) act.panBy(px * PAN * dt, py * PAN * dt);
  /* arrows: eased spin */
  const want = spin.btn || now < spin.until ? spin.want : 0; spin.v += (want - spin.v) * (reduceMotion ? 1 : Math.min(1, dt * 10));
  if (Math.abs(spin.v) > 1e-3) act.spinBy(spin.v * SPIN * dt);
  /* the ring turns with the view: a compass */
  dial.style.transform = `rotate(${(th * 180 / Math.PI).toFixed(2)}deg)`;
  el.classList.toggle('away', !desktop() && !!(S.card || S.menu)); // phones: the bottom sheet needs the space
}
