/* Intro and loader: a sheet of paper on the workbench with the site sketched on it (drawn in CSS while the scene loads), one headline
   and one primary action. Entering whips the sheet away. Skipped for the rest of the session once entered. */
import { $ } from '../core/state.js';
import { muted, toggleMute, ensureAudio, drum } from '../core/audio.js';

/* swoop() runs the camera's entrance once the overlay starts fading */
export function initIntro(swoop) {
  const it = $('intro'), enter = $('enter'); if (!it) return;
  if (document.documentElement.classList.contains('entered')) { it.remove(); return }
  const go = sound => {
    if (it.classList.contains('out')) return; try { sessionStorage.setItem('vdc-in', '1') } catch {}
    if (!sound && !muted) toggleMute(); ensureAudio(); if (sound) drum('whoosh');
    it.classList.add('out'); setTimeout(() => it.remove(), 900); swoop();
  };
  enter.disabled = false; enter.querySelector('span').textContent = 'Enter the portfolio';
  enter.onclick = () => go(true); $('quiet').onclick = () => go(false);
}
