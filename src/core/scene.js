/* Renderer, camera, studio lights, shadow floor and orbit controls. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { $ } from './state.js';
import { radialTex, canvasTex } from '../atoms/textures.js';

/* canvas labels are lettered in Londrina Solid: ask for it by name (fonts only load once something uses them), but don't wait long */
await Promise.race([Promise.all([document.fonts.load('400 40px "Londrina Solid"'), document.fonts.load('900 40px "Londrina Solid"'), document.fonts.ready]).catch(() => {}), new Promise(r => setTimeout(r, 2500))]);
export const stage = $('stage');
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
stage.prepend(renderer.domElement); $('loading')?.remove();
export const cv = renderer.domElement;

/* one look: a cardboard model on a workbench, photographed in a dark, warm room (like Vick's paper-UI references):
   chocolate brown, darkest at the top. BG = its mid colour (the beats party fades over it); BACKDROP = the gradient behind the desk */
export const scene = new THREE.Scene(); export const BG = new THREE.Color('#2a1a13');
export const BACKDROP = canvasTex(64, 256, (x, W, H) => { const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1c110c'); g.addColorStop(.25, '#24160f'); g.addColorStop(.6, '#2e1d15'); g.addColorStop(1, '#2a1a13'); x.fillStyle = g; x.fillRect(0, 0, W, H) }).t;
scene.background = BACKDROP;
export const camera = new THREE.PerspectiveCamera(32, 1, .1, 300);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; // a little bounce light; card barely reflects it
/* a craft-table set-up: a big warm key light from the front left (soft shadows under every piece), an even warm fill, a faint cool back light */
export const hemi = new THREE.HemisphereLight('#fff3df', '#4a3324', .95); scene.add(hemi);
export const rim = new THREE.DirectionalLight('#cfe0ff', .35); rim.position.set(9, 6, -12); scene.add(rim);
export const sun = new THREE.DirectionalLight('#fff0d8', 2.1); sun.position.set(-7, 16, 9); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 20, bottom: -20, near: 1, far: 60 }); sun.shadow.radius = 3; sun.shadow.bias = -.0004; scene.add(sun);
/* the room floor under the desk, and a soft studio pool of light on it */
export const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .55 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -30.9; floor.receiveShadow = true; scene.add(floor);
export const pool = new THREE.Mesh(new THREE.PlaneGeometry(64, 36), new THREE.MeshBasicMaterial({ color: '#3d291e', map: radialTex([[0, 1], [.55, .45], [1, 0]]), transparent: true, depthWrite: false, opacity: 1 }));
pool.rotation.x = -Math.PI / 2; pool.position.set(-1.5, -30.87, -1.5); pool.renderOrder = -1; scene.add(pool);

export const controls = new OrbitControls(camera, cv);
Object.assign(controls, { enableDamping: true, dampingFactor: .06, enablePan: true, screenSpacePanning: false, zoomToCursor: false, rotateSpeed: .7, zoomSpeed: .9,
  minPolarAngle: .02, maxPolarAngle: 1.2 }); // turn all the way round the table; tilt is capped by zoom (page/camera.js)
