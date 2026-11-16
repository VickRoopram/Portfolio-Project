/**
 * Vick Does Creative: a portfolio played as a 3D synthesizer.
 * Built atomically:  core (state, content, audio, renderer) → atoms (geometry, textures, materials, labels)
 *   → molecules (press FX, controls, cables) → organisms (synth, remote, desk, underlights, screens, card, menu, zoom guide, joystick, beats backdrop, intro, tour guide, jam mode)
 *   → page (camera, input), assembled and run here.
 */
import * as THREE from 'three';
import { S, anim, act } from './core/state.js';
import { renderer, scene, camera, controls, sun } from './core/scene.js';
import { updateFx } from './molecules/fx.js';
import { updateItemGlow } from './molecules/controls.js';
import { updateCables } from './molecules/cable.js';
import { grille, updateSynth, PARTS } from './organisms/synth.js';
import './organisms/remote.js';
import { updateDesk } from './organisms/desk.js';
import { updateKeepsakes } from './organisms/keepsakes.js';
import { GROUPS, boxOf, groupAt, updateUnderlights } from './organisms/underlights.js';
import { drawScreens } from './organisms/screens.js';
import { openCard, closeCard, updateUI } from './organisms/card.js';
import { openMenuFor, closeMenu } from './organisms/menu.js';
import { initIntro } from './organisms/intro.js';
import { updateZoom } from './organisms/zoom.js';
import { updateJoystick } from './organisms/joystick.js';
import { updateParty } from './organisms/party.js';
import { zoomTo, zoomOut, journey, cancelJourney, panBy, spinBy, recentre, lookAt, updateCamera, swoopIn } from './page/camera.js';
import { ray, updateHover } from './page/input.js';
import { FPS, BOIL_EVERY, boil } from './atoms/craft.js';
import './organisms/tour.js';
import { updateJam } from './organisms/jam.js';

/* where a thing on the bench is on screen right now (for Beep, the tour guide, to point at): its box's corners through the camera */
const SPOTS = { synth: GROUPS.projects.box, remote: GROUPS.contact.box, beats: boxOf(PARTS.beats), pads: boxOf(PARTS.pads), knobs: boxOf(PARTS.knobs), desk: new THREE.Box3(new THREE.Vector3(-8.6, 0, -8.7), new THREE.Vector3(9.8, .3, -6.2)) }, corner = new THREE.Vector3();
function spot(key) {
  const b = SPOTS[key], r = renderer.domElement.getBoundingClientRect(); if (!b) return null; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < 8; i++) { corner.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(camera); if (corner.z > 1) return null;
    const x = r.left + (corner.x + 1) / 2 * r.width, y = r.top + (1 - corner.y) / 2 * r.height; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
  return { left: x0, top: y0, right: x1, bottom: y1 };
}
Object.assign(act, { zoomTo, zoomOut, openCard, closeCard, journey, cancelJourney, openMenuFor, panBy, spinBy, recentre, lookAt, closeMenu, spot });

const clock = new THREE.Clock(); let last = performance.now(), drawn = -1e9, pictures = 0;
function loop() {
  const t = clock.getElapsedTime(), now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
  updateCamera(now); updateJoystick(now, dt); updateZoom(now);
  for (const o of anim) { const u = o.userData; if (u.ty !== undefined) o.position.y += (u.ty - o.position.y) * .35; if (u.r !== undefined) o.rotation.y += (u.r - o.rotation.y) * .18 } // keys spring, knobs turn
  updateHover(now);
  updateUnderlights(dt, S.grp || (S.hover && groupAt(S.hover, ray))); updateDesk(dt, t); updateKeepsakes(dt); // the view is kept over the table top by page/camera.js
  updateCables(); updateJam(); updateSynth(t); updateItemGlow(t); updateFx(now);
  grille.scale.setScalar(1 + drawScreens(t) * .04); updateParty(t);
  controls.update(); requestAnimationFrame(loop);
  /* animated on twos: everything keeps moving smoothly underneath, but a new picture is only drawn FPS (12) times a second,
     and the ink lines boil (are redrawn a touch different) on every second picture */
  if (now - drawn < 1000 / FPS - 3) return; drawn = now;
  if (++pictures % BOIL_EVERY === 0) boil();
  if (pictures % 3 === 0) sun.shadow.needsUpdate = true; // shadows: four times a second is plenty
  renderer.render(scene, camera);
}
updateUI(); initIntro(swoopIn); loop();
