/* Move-the-view controls, bottom right beside the zoom icon: rotate left / right round the table, and a pan pad that slides the
   view across the table top (to reach the CV synth, say). Hold a button to keep moving; a tap gives a short nudge. The centre dot
   recentres. The camera does the moving (page/camera.js panBy, spinBy, recentre via act); this only turns presses into speeds. */
import { $, S, act, desktop, reduceMotion } from '../core/state.js';

const el = $('nav'), PAN = .55, SPIN = 1.25, TAP = 220; // pan: view-widths per second · spin: radians per second · a tap moves for at least this long
let want = { x: 0, y: 0, r: 0 }, vel = { x: 0, y: 0, r: 0 }, until = 0, held = null;
function press(b) {
  if (b.dataset.recentre !== undefined) { act.recentre(); return }
  const [x, y] = (b.dataset.pan || '0,0').split(',').map(Number), r = +(b.dataset.spin || 0);
  want = { x, y, r }; held = b; until = performance.now() + TAP; b.classList.add('on'); act.cancelJourney?.();
}
function release() { if (held) held.classList.remove('on'); held = null }
el.addEventListener('pointerdown', e => { const b = e.target.closest('button'); if (!b) return; e.preventDefault(); try { b.setPointerCapture(e.pointerId) } catch {} press(b) });
addEventListener('pointerup', release); addEventListener('pointercancel', release);
el.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('button')) { e.preventDefault(); press(e.target.closest('button')); release() } }); // a key press = one tap
el.addEventListener('contextmenu', e => e.preventDefault());

export function updateNav(now, dt) {
  if (!held && now > until) want = { x: 0, y: 0, r: 0 };
  const k = reduceMotion ? 1 : Math.min(1, dt * 10); for (const a of ['x', 'y', 'r']) vel[a] += (want[a] - vel[a]) * k; // ease in and out
  if (Math.abs(vel.x) + Math.abs(vel.y) > 1e-3) act.panBy(vel.x * PAN * dt, vel.y * PAN * dt);
  if (Math.abs(vel.r) > 1e-3) act.spinBy(vel.r * SPIN * dt);
  el.classList.toggle('away', !desktop() && !!(S.card || S.menu)); // phones: the bottom sheet needs the space
}
