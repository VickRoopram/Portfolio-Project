/* Intro, in two parts, on one sheet of paper on the workbench.
   1 The loader: only the sketch of the site, drawn in CSS while the scene loads.
   2 The welcome: when the scene is ready, the name on one line, a line of copy and the red Enter button are written under the sketch.
     Press Enter, or scroll (the sheet slides up with the wheel), swipe or press a key, and it's whipped off the bench to show the site.
     It greets every visit and every refresh. */
import { $ } from '../core/state.js';
import { ensureAudio, drum } from '../core/audio.js';

const SHOWN = 2600, PULL = 220; // the sketch gets at least this long (ms from page load) to be drawn · how far (px of wheel) the sheet is dragged before it lets go
/* swoop() runs the camera's entrance once the sheet is whipped away */
export function initIntro(swoop) {
  const it = $('intro'), sheet = it?.querySelector('.in-sheet'); if (!it) return; let pulled = 0, idle = 0;
  const go = () => { if (it.classList.contains('out')) return; ensureAudio(); drum('whoosh'); it.classList.add('out'); setTimeout(() => it.remove(), 900); swoop(); for (const [ev, fn] of on) removeEventListener(ev, fn) };
  const drag = e => { pulled += Math.abs(e.deltaY); if (pulled > PULL) return go(); sheet.style.translate = `0 ${-pulled * .5}px`; // the sheet rides up with the scroll, and settles back if you stop short
    clearTimeout(idle); idle = setTimeout(() => { pulled = 0; sheet.style.translate = '' }, 500) };
  const on = [['wheel', drag], ['touchmove', go], ['keydown', e => { if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key !== 'Tab') go() }]];
  setTimeout(() => {
    it.classList.add('ready'); it.removeAttribute('aria-busy'); if (matchMedia('(hover: none)').matches) $('in-or').textContent = 'or swipe';
    $('enter').onclick = go; for (const [ev, fn] of on) addEventListener(ev, fn, { passive: true });
  }, Math.max(0, SHOWN - performance.now()));
}
