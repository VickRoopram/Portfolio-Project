/* Renderer, camera, studio lights, shadow floor and orbit controls. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { $ } from './state.js';
import { radialTex } from '../atoms/textures.js';

await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]); // canvas labels need the web fonts
export const stage = $('stage');
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
stage.prepend(renderer.domElement); $('loading').remove();
export const cv = renderer.domElement;

export const scene = new THREE.Scene(); export const BG = new THREE.Color('#ece5d8'); scene.background = BG; // BG: the themed colour (the beats backdrop swaps scene.background while it plays)
export const camera = new THREE.PerspectiveCamera(32, 1, .1, 300);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; // studio reflections for the metal
export const hemi = new THREE.HemisphereLight('#ffffff', '#b9bab6', .45); scene.add(hemi);
export const rim = new THREE.DirectionalLight('#dfe8ff', .9); rim.position.set(9, 6, -12); scene.add(rim);
export const sun = new THREE.DirectionalLight('#fff6ea', 2); sun.position.set(-7, 16, 9); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 20, bottom: -20, near: 1, far: 60 }); sun.shadow.radius = 6; sun.shadow.bias = -.0004; scene.add(sun);
/* the room floor under the desk, and a soft studio pool of light on it */
export const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .17 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -30.9; floor.receiveShadow = true; scene.add(floor);
export const pool = new THREE.Mesh(new THREE.PlaneGeometry(64, 36), new THREE.MeshBasicMaterial({ map: radialTex([[0, 1], [.55, .45], [1, 0]]), transparent: true, depthWrite: false, opacity: .5 }));
pool.rotation.x = -Math.PI / 2; pool.position.set(-1.5, -30.87, -1.5); pool.renderOrder = -1; scene.add(pool);

export const controls = new OrbitControls(camera, cv);
Object.assign(controls, { enableDamping: true, dampingFactor: .06, enablePan: true, screenSpacePanning: false, zoomToCursor: false, rotateSpeed: .7, zoomSpeed: .9,
  minPolarAngle: .02, maxPolarAngle: 1.2 }); // turn all the way round the table; tilt is capped by zoom (page/camera.js)
