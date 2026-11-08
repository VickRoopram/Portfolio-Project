/* Zoom guide: a scroll-wheel icon that sits bottom right. As soon as the visitor zooms (wheel, pinch or the bar), it slides to the
   bottom middle and opens up: a short instruction plus a bar showing where the camera is between the whole table and one synth.
   It drops back to the icon a little after the zooming stops. The bar is also a slider (drag it, or arrow keys once focused).
   Zoom limits live in V.zoom (set by the camera, page/camera.js lockZoom). */
import { $, S, V, act, desktop } from '../core/state.js';
import { camera, controls } from '../core/scene.js';

const el = $('zoom'), range = $('zr'), ico = $('zico'), off = camera.position.clone();
const IDLE_AFTER = 2200;
let lastD = 0, openUntil = 0, quietUntil = 0, wasFlying = false, held = false;
const dist = () => camera.position.distanceTo(controls.target);
/* 0 = the whole table, 1 = one synth; on a log scale so each wheel notch moves the bar by about the same amount */
const level = d => { const { min, max } = V.zoom; return Math.min(1, Math.max(0, Math.log(max / d) / Math.log(max / min))) };
const distAt = k => { const { min, max } = V.zoom; return max * Math.pow(min / max, k) };
const wake = (now, ms = IDLE_AFTER) => { openUntil = Math.max(openUntil, now + ms) };

/* the bar as a slider: move the camera along its current line of sight */
range.addEventListener('input', () => {
  const now = performance.now(); act.cancelJourney?.(); if (V.fly) { V.fly = null; controls.enabled = true; controls.minDistance = V.zoom.min; controls.maxDistance = V.zoom.max }
  off.copy(camera.position).sub(controls.target).setLength(distAt(range.value / 1000)); camera.position.copy(controls.target).add(off); controls.update(); wake(now);
});
range.addEventListener('pointerdown', () => { held = true; wake(performance.now()) });
addEventListener('pointerup', () => { held = false }); addEventListener('pointercancel', () => { held = false });
range.addEventListener('keydown', () => wake(performance.now(), 4000));
ico.onclick = () => wake(performance.now(), 4000); // the icon on its own shows the instructions for a moment

export function updateZoom(now) {
  const d = dist(), flying = !!V.fly;
  if (wasFlying && !flying) quietUntil = now + 300; wasFlying = flying; // landing re-locks the limits: not the visitor zooming
  if (!flying && now > quietUntil && lastD && Math.abs(d - lastD) / d > .0015) wake(now); // pan and orbit keep the distance; only zoom changes it
  lastD = d;
  const on = now < openUntil || held;
  el.dataset.state = on ? 'on' : 'idle'; document.body.dataset.zoom = on ? 'on' : 'off';
  el.classList.toggle('away', !desktop() && !!(S.card || S.menu)); // phones: the bottom sheet needs the space
  const k = level(d); if (!held) range.value = String(Math.round(k * 1000));
  range.style.setProperty('--k', (range.value / 10) + '%');
}
