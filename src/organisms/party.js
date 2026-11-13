/* Beats party: while a BEATS track plays, Vick's motion backgrounds play with it (one per track, BEATS[i].bg, 720p loops in
   assets/beats/bg made from his 4K files; originals in Google Drive):
   - behind the desk: the video fills the background, cropped to cover the window, eased in and out over the backdrop colour (BG);
   - on the table top: the same video projected under the synths with soft edges (additive, so it glows);
   - the synth screen's dot matrix twinkles in colours sampled live from the video (partyColours, read by screens.js).
   Videos load only when a track starts. Off under reduced motion. */
import * as THREE from 'three';
import { scene, BG, BACKDROP } from '../core/scene.js';
import { V, reduceMotion } from '../core/state.js';
import { demo, track, BEATS } from '../core/audio.js';
import { canvasTex } from '../atoms/textures.js';
import { decal } from '../atoms/materials.js';
import { FXMATS } from '../molecules/fx.js';

const vid = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, preload: 'none' });
vid.setAttribute('playsinline', ''); vid.setAttribute('muted', '');
const vtex = new THREE.VideoTexture(vid); vtex.colorSpace = THREE.SRGBColorSpace;

/* background: the video drawn over BG into a canvas (cover-cropped to the window's shape, fading with p) */
const bgc = canvasTex(640, 360), bx = bgc.x;
/* table-top projection with soft edges: an alpha map that fades to nothing at the desk's edges */
const fade = canvasTex(256, 146, (x, W, H) => { x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.filter = 'blur(14px)'; x.fillStyle = '#fff'; x.beginPath(); x.roundRect(26, 22, W - 52, H - 44, 30); x.fill() }).t;
const proj = new THREE.Mesh(new THREE.PlaneGeometry(32.5, 18.5), decal(new THREE.MeshBasicMaterial({ map: vtex, alphaMap: fade, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })));
/* like a projector: only the bright, colourful parts of the video land on the table (alpha follows brightness), so dark
   footage doesn't smudge the oak */
proj.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <alphamap_fragment>', '#include <alphamap_fragment>\n\tdiffuseColor.a *= smoothstep(.1, .6, max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)));') };
proj.rotation.x = -Math.PI / 2; proj.position.set(.6, .012, -.1); proj.renderOrder = 1; proj.visible = false; scene.add(proj); FXMATS.push(proj.material);

/* colour sampling for the screen twinkle */
const smp = Object.assign(document.createElement('canvas'), { width: 8, height: 5 }), sx = smp.getContext('2d', { willReadFrequently: true });
let cols = ['#ff5d1a', '#ffd23f', '#00e5ff', '#ff2d95'], sampledAt = 0;
export const partyColours = () => cols;
function sample(t) {
  if (t - sampledAt < .5 || vid.readyState < 2) return; sampledAt = t; sx.drawImage(vid, 0, 0, 8, 5); const d = sx.getImageData(0, 0, 8, 5).data, c = [];
  for (let i = 0; i < d.length; i += 4) { const r = d[i], g = d[i + 1], b = d[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b); const k = 230 / Math.max(10, mx); c.push([mx - mn + mx * .3, `rgb(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0})`]) /* lifted so dark videos still twinkle */ }
  c.sort((a, b) => b[0] - a[0]); cols = c.slice(0, 4).map(v => v[1]);
}

let p = 0, last = 0, playing = '';
export const party = () => p; // 0..1, how much the party is on
export function updateParty(t) {
  const dt = Math.min(.1, Math.max(0, t - last)); last = t; const on = !!demo && !reduceMotion, want = on ? BEATS[track]?.bg : '';
  if (want && want !== playing) { playing = want; vid.preload = 'auto'; vid.src = `assets/beats/bg/${want}.mp4`; vid.play().catch(() => {}) }
  p += ((on ? 1 : 0) - p) * Math.min(1, dt * (on ? 2.2 : 1.2));
  if (p < .003) { p = 0; if (scene.background !== BACKDROP) { scene.background = BACKDROP; proj.visible = false; vid.pause(); playing = '' } return }
  if (vid.paused && on) vid.play().catch(() => {});
  const ready = vid.readyState >= 2;
  // background: BG, then the video over it (cover crop), at p
  const W = 640, H = 360, A = innerWidth / Math.max(1, innerHeight); bgc.t.repeat.set(1, 1);
  bx.globalAlpha = 1; bx.fillStyle = '#' + BG.getHexString(); bx.fillRect(0, 0, W, H);
  if (ready) { const va = (vid.videoWidth || 16) / (vid.videoHeight || 9); let sw = vid.videoWidth, sh = vid.videoHeight, ox = 0, oy = 0;
    if (A > va) { sh = sw / A; oy = (vid.videoHeight - sh) / 2 } else { sw = sh * A; ox = (vid.videoWidth - sw) / 2 }
    bx.globalAlpha = p; bx.drawImage(vid, ox, oy, sw, sh, 0, 0, W, H); sample(t) }
  bgc.t.needsUpdate = true; if (scene.background !== bgc.t) scene.background = bgc.t;
  // table top
  proj.visible = ready; proj.material.opacity = p * .65;
}
