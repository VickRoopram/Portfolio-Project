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

/* one look: a cardboard model on a workbench in a dark, warm room: a smooth chocolate-brown gradient, darkest at the top (no grain).
   BG = its mid colour (the beats party fades over it); BACKDROP = the gradient behind the desk */
export const scene = new THREE.Scene(); export const BG = new THREE.Color('#2a1a13');
export const BACKDROP = canvasTex(8, 512, (x, W, H) => { const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1a100b'); g.addColorStop(.3, '#23150e'); g.addColorStop(.65, '#2e1d15'); g.addColorStop(1, '#2a1a13'); x.fillStyle = g; x.fillRect(0, 0, W, H) }).t;
scene.background = BACKDROP;
export const camera = new THREE.PerspectiveCamera(32, 1, .1, 300);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; // a little bounce light; card barely reflects it
/* the light: one diffused spotlight hanging over the craft mat (a big soft-edged pool: full strength over the synths, falling away
   towards the edges of the bench, which sit in shadow), a low warm fill so the shadows aren't black, and a faint cool back light.
   It hangs at the back left: THE light for the whole site. Every piece throws a soft shadow forward and to the right, and every shadow
   on the page (styles/skin.css --sh-s / --sh-m / --sh-l) falls the same way: down and to the right, soft-edged */
const MAT_CENTRE = new THREE.Vector3(-1.6, 0, .1);
export const hemi = new THREE.HemisphereLight('#ffe9cf', '#3a281c', .36); scene.add(hemi);
export const rim = new THREE.DirectionalLight('#cfe0ff', .16); rim.position.set(9, 6, -12); scene.add(rim);
export const sun = new THREE.SpotLight('#fff1dc', 3.3, 0, .82, .78, 0); sun.position.set(-8.5, 27, -8); sun.target.position.copy(MAT_CENTRE); scene.add(sun.target); // decay 0: the pool's shape, not distance, sets the fall-off
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.focus = .72; sun.shadow.camera.near = 8; sun.shadow.camera.far = 70; sun.shadow.bias = -.0006; sun.shadow.normalBias = .03; scene.add(sun);
/* the ground: the only thing on it is the bench's own shadow, one soft patch under and a little forward-right of it (away from the light).
   It's painted, not computed, so nothing else (legs, lamp, plant, the things on the bench) ever marks the floor */
export const pool = new THREE.Mesh(new THREE.PlaneGeometry(62, 40), new THREE.MeshBasicMaterial({ color: '#0b0604', map: radialTex([[0, .85], [.45, .7], [.8, .2], [1, 0]]), transparent: true, depthWrite: false }));
pool.rotation.x = -Math.PI / 2; pool.position.set(3.2, -30.87, 2.6); pool.renderOrder = -1; scene.add(pool);

export const controls = new OrbitControls(camera, cv);
Object.assign(controls, { enableDamping: true, dampingFactor: .06, enablePan: true, screenSpacePanning: false, zoomToCursor: false, rotateSpeed: .7, zoomSpeed: .9,
  minPolarAngle: .02, maxPolarAngle: 1.2 }); // turn all the way round the table; tilt is capped by zoom (page/camera.js)
