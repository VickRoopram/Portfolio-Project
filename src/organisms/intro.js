/* Intro and loader: a sheet of paper on the workbench with the site sketched on it (drawn in CSS while the scene loads), the name and one line.
   No button: when the scene is ready the sketch fades away, and the sheet can be clicked, scrolled, swiped or keyed off the bench.
   Skipped for the rest of the session once entered. */
import { $ } from '../core/state.js';
import { ensureAudio, drum } from '../core/audio.js';

const SHOWN = 2600; // the sketch gets at least this long (ms from page load) to be drawn before it goes
/* swoop() runs the camera's entrance once the sheet is whipped away */
export function initIntro(swoop) {
  const it = $('intro'); if (!it) return;
  if (document.documentElement.classList.contains('entered')) { it.remove(); return }
  const go = () => {
    if (it.classList.contains('out')) return; try { sessionStorage.setItem('vdc-in', '1') } catch {}
    ensureAudio(); drum('whoosh'); it.classList.add('out'); setTimeout(() => it.remove(), 900); swoop();
    for (const [ev, fn] of on) removeEventListener(ev, fn);
  };
  const on = [['wheel', go], ['touchmove', go], ['keydown', e => { if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key !== 'Tab') go() }]];
  setTimeout(() => {
    it.classList.add('ready'); it.removeAttribute('aria-busy'); $('in-hint').textContent = matchMedia('(hover: none)').matches ? 'Tap or swipe to come in' : 'Click or scroll to come in';
    it.onclick = go; for (const [ev, fn] of on) addEventListener(ev, fn, { passive: true });
  }, Math.max(0, SHOWN - performance.now()));
}
