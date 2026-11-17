/* The phone's shelf shows the desktop synths themselves: this page loads the real 3D synth and Contact synth, hides everything
   else (desk, cables, lights' helpers), tilts the view so the panels face the shelf at an angle, and renders a few drawings of it
   with the ink outlines boiled differently each time, like the desk's "on twos". tools/phone-synth/render.py saves them. */
import * as THREE from 'three';
/* the modules expect the site's page around them: borrow index.html's markup (its scripts don't run) before loading them */
const page = new DOMParser().parseFromString(await (await fetch('../../index.html')).text(), 'text/html');
page.querySelectorAll('script').forEach(s => s.remove()); document.body.innerHTML = page.body.innerHTML;
const { scene, sun } = await import('../../src/core/scene.js');
const { synth } = await import('../../src/organisms/synth.js');
const { RM } = await import('../../src/organisms/remote.js');
const { drawScreens } = await import('../../src/organisms/screens.js');
const { boil } = await import('../../src/atoms/craft.js');

/* wait for the photo textures and lettering to arrive (the cardboard skin is mostly textures) */
await Promise.race([new Promise(r => { THREE.DefaultLoadingManager.onLoad = r }), new Promise(r => setTimeout(r, 25000))]);
await document.fonts.ready; await new Promise(r => setTimeout(r, 1500));
const q = new URLSearchParams(location.search), W = +(q.get('w') || 1400), H = +(q.get('h') || 600), N = +(q.get('n') || 3);
const ELEV = +(q.get('elev') || 52) * Math.PI / 180, FOV = +(q.get('fov') || 16);
const keep = new Set([synth, RM]);
for (const o of scene.children) if (!o.isLight && !keep.has(o) && o !== sun.target) o.visible = false;
scene.background = null;
const R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
R.setPixelRatio(1); R.setSize(W, H); R.setClearColor(0x000000, 0);
R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.08;
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.append(R.domElement); document.getElementById('stage')?.remove();

const box = new THREE.Box3().expandByObject(synth).expandByObject(RM), c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
const cam = new THREE.PerspectiveCamera(FOV, W / H, .1, 500);
const dist = (size.x * 1.08 / 2) / Math.tan(THREE.MathUtils.degToRad(FOV) / 2) / cam.aspect;
cam.position.set(c.x, c.y + Math.sin(ELEV) * dist, c.z + Math.cos(ELEV) * dist); cam.lookAt(c);
const frames = [];
for (let i = 0; i < N; i++) {
  boil(); drawScreens(1.3 + i * .17); sun.shadow.needsUpdate = true; R.render(scene, cam); frames.push(R.domElement.toDataURL('image/png'));
}
window.FRAMES = frames; window.DONE = true;
