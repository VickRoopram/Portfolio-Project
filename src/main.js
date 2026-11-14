/**
 * Vick Does Creative: a portfolio played as a 3D synthesizer.
 * Built atomically:  core (state, content, audio, renderer) → atoms (geometry, textures, materials, labels)
 *   → molecules (press FX, controls, cables) → organisms (synth, remote, desk, underlights, screens, card, menu, zoom guide, joystick, beats backdrop, intro)
 *   → page (camera, input), assembled and run here.
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
import { updateKeepsakes } from './organisms/keepsakes.js';
import { groupAt, updateUnderlights } from './organisms/underlights.js';
import { drawScreens } from './organisms/screens.js';
import { openCard, closeCard, updateUI } from './organisms/card.js';
import { openMenuFor } from './organisms/menu.js';
import { initIntro } from './organisms/intro.js';
import { updateZoom } from './organisms/zoom.js';
import { updateJoystick } from './organisms/joystick.js';
import { updateParty } from './organisms/party.js';
import { zoomTo, zoomOut, journey, cancelJourney, panBy, spinBy, recentre, updateCamera, swoopIn } from './page/camera.js';
import { ray, updateHover } from './page/input.js';
import { FPS, BOIL_EVERY, boil } from './atoms/craft.js';

Object.assign(act, { zoomTo, zoomOut, openCard, closeCard, journey, cancelJourney, openMenuFor, panBy, spinBy, recentre });

const clock = new THREE.Clock(); let last = performance.now(), drawn = -1e9, pictures = 0;
function loop() {
  const t = clock.getElapsedTime(), now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
  updateCamera(now); updateJoystick(now, dt); updateZoom(now);
  for (const o of anim) { const u = o.userData; if (u.ty !== undefined) o.position.y += (u.ty - o.position.y) * .35; if (u.r !== undefined) o.rotation.y += (u.r - o.rotation.y) * .18 } // keys spring, knobs turn
  updateHover(now);
  updateUnderlights(dt, S.grp || (S.hover && groupAt(S.hover, ray))); updateDesk(dt, t); updateKeepsakes(dt); // the view is kept over the table top by page/camera.js
  updateCables(); updateSynth(t); updateItemGlow(t); updateFx(now);
  grille.scale.setScalar(1 + drawScreens(t) * .04); updateParty(t);
  controls.update(); requestAnimationFrame(loop);
  /* animated on twos: everything keeps moving smoothly underneath, but a new picture is only drawn FPS (12) times a second,
     and the ink lines boil (are redrawn a touch different) on every second picture */
  if (now - drawn < 1000 / FPS - 3) return; drawn = now;
  if (++pictures % BOIL_EVERY === 0) boil();
  renderer.render(scene, camera);
}
updateUI(); initIntro(swoopIn); loop();
