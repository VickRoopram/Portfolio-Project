/* Beats party: while a BEATS track plays, the scene gets playful. Coloured stage-light pools drift across the table top and
   swell with the music (the part you actually see behind the synths), and the background beyond the desk turns into soft
   colour blobs with confetti tumbling down and a flash on the loud hits. Each of the 5 tracks has its own palette (the synth's
   screen twinkles in it too, see screens.js). It eases in when a track starts and back to the plain look when the music stops. */
import * as THREE from 'three';
import { scene, BG } from '../core/scene.js';
import { V, reduceMotion } from '../core/state.js';
import { demo, track, scope } from '../core/audio.js';
import { canvasTex, radialTex } from '../atoms/textures.js';
import { flat } from '../atoms/geometry.js';
import { decal } from '../atoms/materials.js';
import { FXMATS } from '../molecules/fx.js';

export const PAL = [ // NEON DRIVE · SUNDAY LO-FI · ARCADE RUN · DEEP HOUSE · JIU-JITSU BREAKS
  ['#ff2d95', '#7a2cff', '#00e5ff', '#ffd23f'], ['#ff9f80', '#ffd6a5', '#cdb4db', '#a0e7e5'], ['#ffe600', '#00ff85', '#ff3b30', '#3d5afe'],
  ['#1e3cff', '#00c2a8', '#9b5de5', '#f15bb5'], ['#ff6b00', '#ffd000', '#2ec4b6', '#e71d36']];
const W = 320, H = 180, bg = canvasTex(W, H), x = bg.x;
const BLOBS = [0, 1, 2, 3, 4, 5].map(i => ({ sx: .13 + i * .041, sy: .17 + i * .033, ph: i * 1.7, r: .32 + (i % 3) * .07, c: i % 4 }));
const BITS = Array.from({ length: 46 }, (_, i) => ({ x: Math.random(), y: Math.random(), v: .05 + Math.random() * .09, s: 2 + Math.random() * 3.5, spin: (Math.random() - .5) * 6, c: i % 4 }));
/* stage-light pools on the table top (y just above the wood; the synths and lamp sit over them) */
const poolTex = radialTex([[0, 1], [.45, .5], [1, 0]]);
const POOLS = [0, 1, 2, 3].map(i => { const m = flat(11, 11, decal(new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, opacity: 0, toneMapped: false })), .012);
  m.renderOrder = 1; m.visible = false; scene.add(m); FXMATS.push(m.material); return { m, ph: i * 1.6, sx: .21 + i * .05, sz: .17 + i * .04, c: i } });
let p = 0, last = 0, pal = 0;
export const party = () => p; // 0..1, how much the party is on (screens.js reads it)

export function updateParty(t) {
  const dt = Math.min(.1, Math.max(0, t - last)); last = t; const on = !!demo && !reduceMotion;
  p += ((on ? 1 : 0) - p) * Math.min(1, dt * (on ? 2.2 : 1.2)); if (on) pal = Math.max(0, track) % PAL.length;
  if (p < .003) { p = 0; if (scene.background !== BG) { scene.background = BG; POOLS.forEach(o => { o.m.visible = false }) } return }
  const { level } = scope(), cols = PAL[pal], dark = V.themeK > .5, a = p * (dark ? .62 : .5);
  for (const o of POOLS) { // drift over the table top, swell on the beat
    o.m.visible = true; o.m.position.x = .6 + 13 * Math.sin(t * o.sx + o.ph); o.m.position.z = -.1 + 7 * Math.cos(t * o.sz + o.ph * 1.3);
    o.m.scale.setScalar(.8 + level * .7 + .1 * Math.sin(t * 2 + o.ph)); o.m.material.color.set(cols[o.c]); o.m.material.opacity = p * (dark ? .5 : .38) * (.75 + level * .5);
  }
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.fillStyle = '#' + BG.getHexString(); x.fillRect(0, 0, W, H);
  // drifting blobs that swell on the beat
  for (const b of BLOBS) {
    const cx = (.5 + .42 * Math.sin(t * b.sx * 2.2 + b.ph)) * W, cy = (.5 + .4 * Math.cos(t * b.sy * 2.2 + b.ph * 1.3)) * H, r = (b.r + level * .22) * W * .55;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, cols[b.c]); g.addColorStop(1, cols[b.c] + '00');
    x.globalAlpha = a; x.fillStyle = g; x.fillRect(0, 0, W, H);
  }
  // confetti
  for (const c of BITS) {
    c.y += c.v * dt * (1 + level * 2); if (c.y > 1.05) { c.y = -.05; c.x = Math.random() } const px = c.x * W + Math.sin(t * 1.3 + c.spin) * 6, py = c.y * H;
    x.save(); x.translate(px, py); x.rotate(t * c.spin); x.globalAlpha = p * .85; x.fillStyle = cols[c.c]; x.fillRect(-c.s, -c.s * .5, c.s * 2, c.s); x.restore();
  }
  // a flash on the loud hits
  if (level > .35) { x.globalAlpha = p * (level - .35) * .5; x.fillStyle = cols[0]; x.fillRect(0, 0, W, H) }
  x.globalAlpha = 1; bg.t.needsUpdate = true; if (scene.background !== bg.t) scene.background = bg.t;
}
