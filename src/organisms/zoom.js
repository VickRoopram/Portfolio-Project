/* Zoom guide: a scroll-wheel icon that sits bottom right. As soon as the visitor zooms (wheel or pinch), it slides to the bottom
   middle and opens up: a short instruction plus a bar that fills as you zoom in (empty = the whole table, full = one synth).
   It drops back to the icon a little after the zooming stops.
   At the limits the icon reacts: fully zoomed in it shakes (and shakes again if you keep scrolling in); fully zoomed out it relaxes
   (wheel stops, icon settles). Zoom limits live in V.zoom (set by the camera, page/camera.js lockZoom). */
import { $, S, V, desktop, reduceMotion } from '../core/state.js';
import { camera, controls } from '../core/scene.js';

const el = $('zoom'), bar = $('zr'), ico = $('zico');
const IDLE_AFTER = 2200, EDGE = .005;
let lastD = 0, openUntil = 0, quietUntil = 0, wasFlying = false, edge = '';
const dist = () => camera.position.distanceTo(controls.target);
/* 0 = the whole table, 1 = one synth; on a log scale so each wheel notch fills the bar by about the same amount */
const level = d => { const { min, max } = V.zoom; return Math.min(1, Math.max(0, Math.log(max / d) / Math.log(max / min))) };
const wake = (now, ms = IDLE_AFTER) => { openUntil = Math.max(openUntil, now + ms) };
/* restart a one-shot CSS animation (shake at full, settle at empty) */
const kick = cls => { if (reduceMotion) return; ico.classList.remove('shake', 'settle'); void ico.offsetWidth; ico.classList.add(cls) };
ico.addEventListener('animationend', e => { if (e.target === ico) ico.classList.remove('shake', 'settle') });

/* scrolling against a limit doesn't change the distance, so watch the wheel too: it still opens the guide and replays the reaction */
$('stage').addEventListener('wheel', e => {
  if (V.fly) return; const now = performance.now(); wake(now);
  if (edge === 'max' && e.deltaY < 0) kick('shake'); else if (edge === 'min' && e.deltaY > 0) kick('settle');
}, { passive: true, capture: true });
ico.onclick = () => wake(performance.now(), 4000); // the icon on its own shows the instructions for a moment

export function updateZoom(now) {
  const d = dist(), flying = !!V.fly;
  if (wasFlying && !flying) quietUntil = now + 300; wasFlying = flying; // landing re-locks the limits: not the visitor zooming
  if (!flying && now > quietUntil && lastD && Math.abs(d - lastD) / d > .0015) wake(now); // pan and orbit keep the distance; only zoom changes it
  lastD = d;
  const on = now < openUntil;
  el.dataset.state = on ? 'on' : 'idle'; document.body.dataset.zoom = on ? 'on' : 'off';
  el.classList.toggle('away', !desktop() && !!(S.card || S.menu)); // phones: the bottom sheet needs the space
  const k = level(d), pct = Math.round(k * 100);
  bar.style.setProperty('--k', (k * 100).toFixed(1) + '%'); if (bar.getAttribute('aria-valuenow') !== String(pct)) bar.setAttribute('aria-valuenow', String(pct));
  const e = flying ? edge : k >= 1 - EDGE ? 'max' : k <= EDGE ? 'min' : ''; // hold the edge state during flights
  if (e !== edge) { edge = e; el.dataset.edge = e; if (e === 'max') kick('shake'); else if (e === 'min') kick('settle') }
}
