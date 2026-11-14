/* Craft atoms: the cardboard-model look. Photo textures of card, paper and wood (assets/tex, from Vick's texture library),
   the ink outline every piece gets, and the frame rate the whole site is animated at. */
import * as THREE from 'three';

/* "On twos": every drawing is held for two frames of a 24 fps film, so the site shows 12 new pictures a second.
   Change this one number to make the stop-motion feel choppier (8, 6 …) or smoother (24). The CSS twin is --step in styles/skin.css. */
export const FPS = 12;
/* the hand-drawn line "boils": outlines are redrawn a touch thicker or thinner on every second picture */
export const BOIL_EVERY = 2;

const loader = new THREE.TextureLoader();
/* a photo texture, mirror-tiled so it never shows a seam; data: a bump map (linear, not sRGB) */
const photo = (file, data) => { const t = loader.load('assets/tex/' + file); t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = 8; if (!data) t.colorSpace = THREE.SRGBColorSpace; return t };
const pair = file => ({ map: photo(file), bump: photo(file, 1) });
export const PAPER = { kraft: pair('kraft.jpg'), dark: pair('kraft-dark.jpg'), corr: pair('corrugated.jpg'), edge: pair('edge.jpg'), paper: pair('paper.jpg'), wood: pair('wood.jpg') };
/* a piece of card or paper: matte, a little tooth from the photo, almost no reflection. tint multiplies the photo */
export const card = (kind, tint = '#ffffff', o = {}) => new THREE.MeshStandardMaterial({ map: PAPER[kind].map, bumpMap: PAPER[kind].bump, bumpScale: .35, color: tint, roughness: .96, metalness: 0, envMapIntensity: .18, ...o });

/* ink outline: the same shape, a little bigger, drawn inside out in ink, so every piece gets a marker line round its silhouette */
export const INK = '#2a1b12';
const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
const LINES = [];
export function outline(mesh, w, h, d, t = .03) {
  const o = new THREE.Mesh(mesh.geometry, inkMat); o.raycast = () => {}; o.line = { w, h, d, t };
  o.scale.set((w + 2 * t) / w, (h + 2 * t) / h, (d + 2 * t) / d); mesh.add(o); LINES.push(o); return o;
}
/* boil: each line's thickness is redrawn between 70% and 130%, like a line traced again for every drawing */
export function boil() { for (const o of LINES) { const { w, h, d } = o.line, t = o.line.t * (.7 + Math.random() * .6); o.scale.set((w + 2 * t) / w, (h + 2 * t) / h, (d + 2 * t) / d) } }

/* a wobbly hand-drawn line through points on a canvas: drawn twice, slightly off, like a marker gone over */
export function sketch(x, pts, { close = false, jit = 1.5, passes = 2 } = {}) {
  for (let p = 0; p < passes; p++) { x.beginPath();
    pts.forEach(([px, py], i) => { const jx = px + (Math.random() - .5) * jit * 2, jy = py + (Math.random() - .5) * jit * 2; i ? x.lineTo(jx, jy) : x.moveTo(jx, jy) });
    if (close) x.closePath(); x.stroke() }
}

/* ── hand-made: nothing is cut or stuck down perfectly ── */
/* a repeatable random (same model on every visit) */
let seed = 20261114;
export const rnd = (a = 1, b = 0) => { seed = (seed * 1664525 + 1013904223) >>> 0; return b + seed / 4294967296 * a };
/* put a piece down by hand: turned a little and a little off its mark (rot in radians, off in units) */
export function wonk(o, rot = .04, off = .018) { o.rotation.y += rnd(rot * 2, -rot); o.position.x += rnd(off * 2, -off); o.position.z += rnd(off * 2, -off); return o }

const onTop = mt => Object.assign(mt, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
const lay = (w, d, mat) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); p.rotation.x = -Math.PI / 2; p.raycast = () => {}; return p };
const canvas = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t };
/* masking tape: a torn strip, a little see-through, with a crease or two. Three strips to pick from */
const TAPES = [0, 1, 2].map(() => canvas(256, 96, (x, W, H) => {
  const edge = (x0, dir) => { for (let y = 0; y <= H; y += 8) x.lineTo(x0 + dir * (4 + rnd(12)), y * dir > 0 ? y : H - y) };
  x.beginPath(); x.moveTo(10, 0); x.lineTo(W - 10, 0); edge(W - 16, 1); x.lineTo(10, H); edge(16, -1); x.closePath();
  x.fillStyle = 'rgba(238,222,172,.9)'; x.fill(); x.save(); x.clip();
  for (let i = 0; i < 5; i++) { x.fillStyle = `rgba(255,255,255,${.06 + rnd(.1)})`; x.fillRect(0, rnd(H), W, 2 + rnd(7)) }
  for (let i = 0; i < 3; i++) { x.strokeStyle = 'rgba(120,96,50,.22)'; x.lineWidth = 1.5; x.beginPath(); const cx = rnd(W); x.moveTo(cx, 0); x.lineTo(cx + rnd(30, -15), H); x.stroke() }
  x.restore(); x.strokeStyle = 'rgba(90,70,36,.35)'; x.lineWidth = 2; x.stroke() }));
/* a strip of tape lying on parent at (x, y, z): w long, d wide, turned rot */
export function tape(parent, x, y, z, w = .7, d = .26, rot = 0) {
  const t = lay(w, d, onTop(new THREE.MeshBasicMaterial({ map: TAPES[Math.floor(rnd(3))], transparent: true, depthWrite: false })));
  t.position.set(x, y, z); t.rotation.z = rot + rnd(.24, -.12); t.renderOrder = 3; parent.add(t); return t;
}
/* cut-out: the hole a control sits in, cut by hand with a craft knife: never quite square, a pencil guide line still showing */
const CUTS = {};
export function cutout(parent, x, y, z, w, d, round) {
  const k = [w.toFixed(2), d.toFixed(2), round ? 1 : 0, Math.floor(rnd(3))].join(), m = .16, S = 110, W = Math.round((w + 2 * m) * S), H = Math.round((d + 2 * m) * S);
  const t = CUTS[k] || (CUTS[k] = canvas(W, H, x => { const g = .07 * S, j = () => rnd(.05 * S, -.025 * S), x0 = m * S - g, y0 = m * S - g, x1 = W - m * S + g, y1 = H - m * S + g;
    const path = () => { x.beginPath(); if (round) { for (let a = 0; a < 6.3; a += .45) x.lineTo(W / 2 + Math.cos(a) * ((x1 - x0) / 2 + j()), H / 2 + Math.sin(a) * ((y1 - y0) / 2 + j())) }
      else { x.moveTo(x0 + j(), y0 + j()); x.lineTo((x0 + x1) / 2, y0 + j()); x.lineTo(x1 + j(), y0 + j()); x.lineTo(x1 + j(), (y0 + y1) / 2); x.lineTo(x1 + j(), y1 + j()); x.lineTo((x0 + x1) / 2, y1 + j()); x.lineTo(x0 + j(), y1 + j()); x.lineTo(x0 + j(), (y0 + y1) / 2) } x.closePath() };
    path(); x.fillStyle = '#2f2018'; x.fill(); x.strokeStyle = 'rgba(20,12,8,.9)'; x.lineWidth = 3; x.stroke();
    x.strokeStyle = 'rgba(60,44,34,.4)'; x.lineWidth = 1.6; x.setLineDash([7, 6]); x.strokeRect(x0 - 7 + j(), y0 - 7 + j(), x1 - x0 + 14, y1 - y0 + 14) })); // the pencil guide
  const c = lay(w + 2 * m, d + 2 * m, onTop(new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })));
  c.position.set(x, y, z); c.rotation.z = rnd(.05, -.025); c.renderOrder = 1; parent.add(c); return c;
}
/* marker loop: a felt-tip line drawn round a w × d footprint, lying flat. Set material.uniforms.uK (0..1) to draw it on or rub it out,
   uCol for its colour. It goes round twice and the passes don't quite meet; the edge is streaky, like a marker running dry */
export function markerLoop(w, d, r = .3, width = .16) {
  const N = 260, M = 140, pos = [], A = [], E = [], idx = [], hw = w / 2, hd = d / 2, sh = new THREE.Shape();
  sh.moveTo(-hw + r, -hd); sh.lineTo(hw - r, -hd); sh.absarc(hw - r, -hd + r, r, -Math.PI / 2, 0); sh.lineTo(hw, hd - r); sh.absarc(hw - r, hd - r, r, 0, Math.PI / 2);
  sh.lineTo(-hw + r, hd); sh.absarc(-hw + r, hd - r, r, Math.PI / 2, Math.PI); sh.lineTo(-hw, -hd + r); sh.absarc(-hw + r, -hd + r, r, Math.PI, Math.PI * 1.5);
  const P = sh.getSpacedPoints(M), TURNS = 1.9; // P[i] round the footprint (shape y = world z)
  for (let i = 0; i <= N; i++) { const u = i / N, f = (u * TURNS + .12) * M, i0 = Math.floor(f), k = f - i0, p0 = P[i0 % M], p1 = P[(i0 + 1) % M], pa = P[(i0 - 1 + M) % M], pb = P[(i0 + 2) % M];
    const px = p0.x + (p1.x - p0.x) * k, pz = p0.y + (p1.y - p0.y) * k; let nx = pb.y - pa.y, nz = pa.x - pb.x; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l; if (nx * px + nz * pz < 0) { nx = -nx; nz = -nz }
    const pass = u * TURNS > 1 ? 1 : 0, wob = Math.sin(u * 47) * .035 + Math.sin(u * 13 + 2) * .05 + (pass ? .08 : 0), wd = width * (.75 + .35 * Math.sin(u * 31 + pass));
    pos.push(px + nx * (wob - wd / 2), 0, pz + nz * (wob - wd / 2), px + nx * (wob + wd / 2), 0, pz + nz * (wob + wd / 2)); A.push(u, u); E.push(0, 1);
    if (i < N) { const q = i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2) } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('a', new THREE.Float32BufferAttribute(A, 1)); g.setAttribute('e', new THREE.Float32BufferAttribute(E, 1)); g.setIndex(idx);
  const mt = onTop(new THREE.ShaderMaterial({ uniforms: { uK: { value: 0 }, uCol: { value: new THREE.Color('#d2451e') } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: 'attribute float a;attribute float e;varying float vA;varying float vE;void main(){vA=a;vE=e;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform float uK;uniform vec3 uCol;varying float vA;varying float vE;
      void main(){ if(vA>uK) discard; float edge=smoothstep(0.,.18,vE)*smoothstep(1.,.82,vE);
        float streak=.72+.28*step(.35,fract(sin(floor(vE*9.)*91.7+floor(vA*40.)*3.1)*43758.5)); float tip=smoothstep(uK,uK-.012,vA);
        gl_FragColor=vec4(uCol,edge*streak*(.55+.45*tip)*.92);
        #include <colorspace_fragment>
      }` }));
  const m = new THREE.Mesh(g, mt); m.raycast = () => {}; m.frustumCulled = false; m.renderOrder = 2; return m;
}
