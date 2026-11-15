/* Renderer, camera, studio lights, shadow floor and orbit controls. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { $ } from './state.js';
import { radialTex, canvasTex } from '../atoms/textures.js';

/* canvas labels are lettered in Londrina Solid: ask for it by name (fonts only load once something uses them), but don't wait long */
await Promise.race([Promise.all([document.fonts.load('400 40px "Londrina Solid"'), document.fonts.load('900 40px "Londrina Solid"'), document.fonts.load('400 30px "Patrick Hand"'), document.fonts.ready]).catch(() => {}), new Promise(r => setTimeout(r, 2500))]);
export const stage = $('stage');
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
stage.prepend(renderer.domElement); $('loading')?.remove();
export const cv = renderer.domElement;

/* one look: a cardboard model on a workbench, in front of a big sheet of deep blue paper lit from the middle: a soft pool of blue behind
   the bench, falling to near-black navy at the corners, with the paper's grain in it (so it reads as a backdrop, not a flat fill).
   BG = its mid colour (the beats party fades over it); BACKDROP = the sheet */
export const scene = new THREE.Scene(); export const BG = new THREE.Color('#14274f');
export const BACKDROP = canvasTex(512, 512, (x, W, H) => { x.fillStyle = '#060c20'; x.fillRect(0, 0, W, H);
  x.save(); x.translate(W * .48, H * .52); x.scale(W * .75, H * .7); const g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, '#1c3566'); g.addColorStop(.38, '#14274f'); g.addColorStop(.72, '#0b1736'); g.addColorStop(1, '#060c20'); x.fillStyle = g; x.fillRect(-2, -2, 4, 4); x.restore();
  const d = x.getImageData(0, 0, W, H); for (let i = 0; i < d.data.length; i += 4) { const n = (Math.random() - .5) * 9; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n * 1.3 } x.putImageData(d, 0, 0) }).t;
scene.background = BACKDROP;
export const camera = new THREE.PerspectiveCamera(32, 1, .1, 300);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; // a little bounce light; card barely reflects it
/* the light: one diffused spotlight hanging over the craft mat (a big soft-edged pool: full strength over the synths, falling away
   towards the edges of the bench, which sit in shadow), a low warm fill so the shadows aren't black, and a faint cool back light.
   It comes from the front left, so card, paper and rubber show their grain and every piece throws a soft shadow away to the back right */
const MAT_CENTRE = new THREE.Vector3(-1.6, 0, .1);
export const hemi = new THREE.HemisphereLight('#ffe9cf', '#263a66', .36); scene.add(hemi);
export const rim = new THREE.DirectionalLight('#cfe0ff', .16); rim.position.set(9, 6, -12); scene.add(rim);
export const sun = new THREE.SpotLight('#fff1dc', 3.3, 0, .82, .78, 0); sun.position.set(-7.5, 27, 9.5); sun.target.position.copy(MAT_CENTRE); scene.add(sun.target); // decay 0: the pool's shape, not distance, sets the fall-off
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.focus = .72; sun.shadow.camera.near = 8; sun.shadow.camera.far = 70; sun.shadow.bias = -.0006; sun.shadow.normalBias = .03; scene.add(sun);
/* the room floor under the desk, and a soft studio pool of light on it */
export const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .3 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -30.9; floor.receiveShadow = true; scene.add(floor);
export const pool = new THREE.Mesh(new THREE.PlaneGeometry(64, 36), new THREE.MeshBasicMaterial({ color: '#23427f', map: radialTex([[0, 1], [.55, .45], [1, 0]]), transparent: true, depthWrite: false, opacity: .45 }));
pool.rotation.x = -Math.PI / 2; pool.position.set(-1.5, -30.87, -1.5); pool.renderOrder = -1; scene.add(pool);

export const controls = new OrbitControls(camera, cv);
Object.assign(controls, { enableDamping: true, dampingFactor: .06, enablePan: true, screenSpacePanning: false, zoomToCursor: false, rotateSpeed: .7, zoomSpeed: .9,
  minPolarAngle: .02, maxPolarAngle: 1.2 }); // turn all the way round the table; tilt is capped by zoom (page/camera.js)
