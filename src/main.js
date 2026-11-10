/**
 * Vick Does Creative: a portfolio played as a 3D synthesizer.
 * Built atomically:  core (state, content, audio, renderer) → atoms (geometry, textures, materials, labels)
 *   → molecules (press FX, controls, cables) → organisms (synth, remote, desk, underlights, screens, card, menu, zoom guide, joystick, intro)
 *   → page (camera, theme, input), assembled and run here.
 */
import * as THREE from 'three';
import { S, V, anim, act } from './core/state.js';
import { renderer, scene, camera, controls } from './core/scene.js';
import { updateFx } from './molecules/fx.js';
import { updateItemGlow } from './molecules/controls.js';
import { updateCables } from './molecules/cable.js';
import { grille, updateSynth } from './organisms/synth.js';
import './organisms/remote.js';
import { updateDesk } from './organisms/desk.js';
import { groupAt, updateUnderlights } from './organisms/underlights.js';
import { drawScreens } from './organisms/screens.js';
import { openCard, closeCard, updateUI } from './organisms/card.js';
import { openMenuFor } from './organisms/menu.js';
import { initIntro } from './organisms/intro.js';
import { updateZoom } from './organisms/zoom.js';
import { updateJoystick } from './organisms/joystick.js';
import { zoomTo, zoomOut, journey, cancelJourney, panBy, spinBy, recentre, updateCamera, swoopIn } from './page/camera.js';
import { updateTheme } from './page/theme.js';
import { ray, updateHover } from './page/input.js';

Object.assign(act, { zoomTo, zoomOut, openCard, closeCard, journey, cancelJourney, openMenuFor, panBy, spinBy, recentre });

const clock = new THREE.Clock(); let last = performance.now();
function loop() {
  const t = clock.getElapsedTime(), now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
  updateCamera(now); updateJoystick(now, dt); updateZoom(now);
  for (const o of anim) { const u = o.userData; if (u.ty !== undefined) o.position.y += (u.ty - o.position.y) * .35; if (u.r !== undefined) o.rotation.y += (u.r - o.rotation.y) * .18 } // keys spring, knobs turn
  updateHover(now);
  updateUnderlights(dt, S.grp || (S.hover && groupAt(S.hover, ray))); updateDesk(dt, t); // the view is kept over the table top by page/camera.js
  updateTheme(); updateCables(); updateSynth(t); updateItemGlow(t); updateFx(now);
  grille.scale.setScalar(1 + drawScreens(t) * .04);
  controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop);
}
updateUI(); initIntro(swoopIn); loop();
