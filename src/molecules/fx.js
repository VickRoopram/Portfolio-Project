/* Press FX, hand-drawn: a marker ring round a cap + a marker stroke racing round the cap edge. */
import * as THREE from 'three';
import { S, V, reduceMotion } from '../core/state.js';
import { MODES } from '../core/data.js';
import { dims, rrPath, flat } from '../atoms/geometry.js';
import { haloTexture, canvasTex } from '../atoms/textures.js';
import { decal } from '../atoms/materials.js';
import { cutout } from '../atoms/craft.js';

export const FXL = [];   // every control with an effect record
/* mark materials (marker rings, strokes, washes, projections) */
export const FXMATS = { push: (...ms) => ms.forEach(m => { m.blending = THREE.NormalBlending; m.needsUpdate = true }) }; // the cardboard model is lit by daylight: marks are drawn in marker, not added as light
const FX = new Map();
/* the effect record for a control; creates its gap halo the first time */
export function fxOf(mesh) {
  let f = FX.get(mesh); if (f) return f; const { w, h, d, r } = dims(mesh), ht = haloTexture(w, d, r);
  const halo = flat(w + 2 * ht.m, d + 2 * ht.m, decal(new THREE.MeshBasicMaterial({ map: ht.t, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })));
  halo.position.set(mesh.position.x, mesh.position.y - h / 2 + .026, mesh.position.z); halo.renderOrder = 2; halo.visible = false; halo.rotation.z = mesh.rotation.y; mesh.parent.add(halo); FXMATS.push(halo.material);
  if (!mesh.noCut) cutout(mesh.parent, halo.position.x, halo.position.y - .012, halo.position.z, w, d, !mesh.geometry.userData.rr); // the hole it sits in, cut by hand (so it doesn't quite line up with the piece)
  f = { m: mesh, halo, w, h, d, r, stroke: null, t0: -1e9, amp: 0, col: new THREE.Color('#ff5d1a'), managed: false };
  FX.set(mesh, f); FXL.push(f); return f;
}
const STROKE_VS = `attribute float a;attribute float e;varying float vA;varying float vE;void main(){vA=a;vE=e;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const STROKE_FS = `uniform float uHead,uFade,uOp;uniform vec3 uCol;varying float vA;varying float vE;
void main(){float d=uHead-vA;float trail=d<0.?0.:smoothstep(.6,0.,d);float head=smoothstep(.07,0.,abs(d));
  float a=max(trail*.75+head,uFade);float edge=1.-pow(abs(vE*2.-1.),2.);
  gl_FragColor=vec4(uCol*(1.-head*.25),clamp(a*edge*uOp*1.6,0.,1.));
  #include <colorspace_fragment>
}`;
/* a thin ribbon hugging the cap outline; a = distance from the front centre (0) to the back (1), so two heads race round both sides */
function strokeFor(f) {
  if (f.stroke) return f.stroke; const o = .018, bw = .085, N = 192, s = new THREE.Shape(), hw = f.w / 2, hd = f.d / 2, r = Math.min(f.r, hw, hd);
  if (r >= Math.min(hw, hd) - .002 && Math.abs(hw - hd) < .002) s.absarc(0, 0, hw, 0, Math.PI * 2, false); else rrPath(s, -hw, -hd, f.w, f.d, r);
  const P = s.getSpacedPoints(N), front = p => p.y - Math.abs(p.x) * .01; let i0 = 0; P.forEach((p, i) => { if (front(p) > front(P[i0])) i0 = i });
  const pos = [], A = [], E = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const p = P[i % N], pa = P[(i - 1 + N) % N], pb = P[(i + 1) % N]; let nx = pb.y - pa.y, ny = pa.x - pb.x; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; if (nx * p.x + ny * p.y < 0) { nx = -nx; ny = -ny }
    const u = (((i - i0) / N) % 1 + 1) % 1, a = Math.min(u, 1 - u) * 2;
    pos.push(p.x + nx * o, 0, p.y + ny * o, p.x + nx * (o + bw), 0, p.y + ny * (o + bw)); A.push(a, a); E.push(0, 1);
    if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2) }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('a', new THREE.Float32BufferAttribute(A, 1)); g.setAttribute('e', new THREE.Float32BufferAttribute(E, 1)); g.setIndex(idx);
  const mt = new THREE.ShaderMaterial({ uniforms: { uHead: { value: 0 }, uFade: { value: 0 }, uOp: { value: 0 }, uCol: { value: new THREE.Color() } }, vertexShader: STROKE_VS, fragmentShader: STROKE_FS,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const st = new THREE.Mesh(g, mt); st.position.y = f.h * .12; st.renderOrder = 3; st.frustumCulled = false; f.m.add(st); FXMATS.push(mt); return f.stroke = st;
}
/* action lines: a burst of marker ticks that pops out round a control when it's pressed, held for three drawings (each a size up
   and turned a little), like the "pop" lines in a comic. One texture for every control */
const burstTex = canvasTex(256, 256, (x, W) => { x.strokeStyle = '#fff'; x.lineCap = 'round'; x.translate(W / 2, W / 2);
  for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2 + (Math.random() - .5) * .25, r0 = W * (.34 + Math.random() * .03), r1 = W * (.43 + Math.random() * .055);
    x.lineWidth = 7 + Math.random() * 5; x.beginPath(); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); x.lineTo(Math.cos(a + .04) * r1, Math.sin(a + .04) * r1); x.stroke() } }, { data: 1 }).t;
const BURST = [.78, 1, 1.2], BURST_HOLD = .085; // three drawings, each held for one picture at 12 a second
function burstFor(f) {
  if (f.burst) return f.burst;
  const b = flat(f.w + 1.1, f.d + 1.1, decal(new THREE.MeshBasicMaterial({ map: burstTex, transparent: true, depthWrite: false, toneMapped: false })));
  b.position.set(f.m.position.x, f.halo.position.y + .004, f.m.position.z); b.renderOrder = 4; b.visible = false; f.m.parent.add(b); return f.burst = b;
}
/* fire a press: gap flash + stroke. delay (ms) lets waves ripple across many controls */
export function pulse(mesh, delay = 0, amp = 1) { const f = fxOf(mesh); f.t0 = performance.now() + delay; f.amp = amp; if (!f.managed) f.col.set(S.mode ? MODES[S.mode].glow : '#ff5d1a') }
const lightCol = new THREE.Color();
export function updateFx(now) {
  const face = .5; // the cap's paper takes a wash of the colour; the marker ring round it carries the rest
  for (const f of FXL) {
    const mm = f.m.material, age = (now - f.t0) / 1000, flash = age < 0 ? 0 : f.amp * Math.pow(Math.max(0, 1 - age / .6), 1.4);
    let base = 0, col = f.col;
    if (f.managed) { base = mm.emissiveIntensity; col = mm.emissive; mm.emissiveIntensity = Math.max(base * face, flash * .85 * face) }
    else if (mm.emissive) { mm.emissive.copy(f.col); mm.emissiveIntensity = flash * .5 * face }
    lightCol.copy(col);
    const op = Math.min(1, Math.max(f.m.userData.edge || 0, base * 1.55) + flash);
    f.halo.visible = op > .004; if (f.halo.visible) { f.halo.material.opacity = op; f.halo.material.color.copy(lightCol) }
    if (age >= 0 && age < 1.15 && f.amp > 0) { const st = strokeFor(f), u = st.material.uniforms; st.visible = true;
      u.uHead.value = reduceMotion ? 1.3 : Math.min(1.3, age / .42); u.uFade.value = age < .38 ? 0 : Math.max(0, 1 - (age - .38) / .7) * .85; u.uOp.value = Math.min(1, f.amp * 1.2); u.uCol.value.copy(lightCol) }
    else if (f.stroke) f.stroke.visible = false;
    const k = age >= 0 && f.amp > 0 && !reduceMotion ? Math.floor(age / BURST_HOLD) : 9;
    if (k < BURST.length) { const b = burstFor(f); b.visible = true; b.scale.setScalar(BURST[k]); b.rotation.z = k * .31; b.material.color.copy(lightCol); b.material.opacity = Math.min(1, f.amp) }
    else if (f.burst) f.burst.visible = false;
  }
}
