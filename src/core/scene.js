/* Renderer, camera, studio lights, shadow floor and orbit controls. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { $ } from './state.js';
import { radialTex, canvasTex } from '../atoms/textures.js';

await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]); // canvas labels need the web fonts
export const stage = $('stage');
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
stage.prepend(renderer.domElement); $('loading').remove();
export const cv = renderer.domElement;

/* one look (light mode removed 13 Nov 2026), matched to Vick's reference render: a cool charcoal room, near-black at the top,
   lifting a touch towards the middle. BG = its mid colour (the beats party fades over it); BACKDROP = the gradient behind the desk */
export const scene = new THREE.Scene(); export const BG = new THREE.Color('#14171c');
export const BACKDROP = canvasTex(64, 256, (x, W, H) => { const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0f1013'); g.addColorStop(.18, '#111317'); g.addColorStop(.5, '#16191f'); g.addColorStop(1, '#14171c'); x.fillStyle = g; x.fillRect(0, 0, W, H) }).t;
scene.background = BACKDROP;
export const camera = new THREE.PerspectiveCamera(32, 1, .1, 300);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; // studio reflections for the metal
/* the dark look's lights (were the theme engine's night values), with a cool sky and rim to sit in the charcoal room */
export const hemi = new THREE.HemisphereLight('#7f8899', '#0d0f13', .22); scene.add(hemi);
export const rim = new THREE.DirectionalLight('#9fb2ff', 1.2); rim.position.set(9, 6, -12); scene.add(rim);
export const sun = new THREE.DirectionalLight('#ffe2c4', .75); sun.position.set(-7, 16, 9); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 20, bottom: -20, near: 1, far: 60 }); sun.shadow.radius = 6; sun.shadow.bias = -.0004; scene.add(sun);
/* the room floor under the desk, and a soft studio pool of light on it */
export const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .55 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -30.9; floor.receiveShadow = true; scene.add(floor);
export const pool = new THREE.Mesh(new THREE.PlaneGeometry(64, 36), new THREE.MeshBasicMaterial({ color: '#232730', map: radialTex([[0, 1], [.55, .45], [1, 0]]), transparent: true, depthWrite: false, opacity: 1 }));
pool.rotation.x = -Math.PI / 2; pool.position.set(-1.5, -30.87, -1.5); pool.renderOrder = -1; scene.add(pool);

export const controls = new OrbitControls(camera, cv);
Object.assign(controls, { enableDamping: true, dampingFactor: .06, enablePan: true, screenSpacePanning: false, zoomToCursor: false, rotateSpeed: .7, zoomSpeed: .9,
  minPolarAngle: .02, maxPolarAngle: 1.2 }); // turn all the way round the table; tilt is capped by zoom (page/camera.js)
