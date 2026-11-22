/* Patch lead: a chain of taped card boxes that eases between a loose and a plugged-in route; plugs itself in while its condition holds. */
import * as THREE from 'three';
import { scene } from '../core/scene.js';
import { drum } from '../core/audio.js';
import { rbox, cyl } from '../atoms/geometry.js';
import { M } from '../atoms/materials.js';
import { card, tape, rnd, INK } from '../atoms/craft.js';

const CABLES = [];
/* a jack socket with a status LED beside it */
export function socket(pos, rot) {
  const g = new THREE.Group();
  g.position.set(...pos);
  scene.add(g);
  const s = cyl(0.2, 0.2, 0.14, M('#1a1a1c', 0.4));
  s.rotation.set(...rot);
  g.add(s);
  const led = cyl(
    0.06,
    0.06,
    0.04,
    new THREE.MeshStandardMaterial({ color: '#3a3b40', emissive: '#e0301a', emissiveIntensity: 0 }),
  );
  led.position.set(rot[2] ? 0 : 0.35, 0.47, rot[2] ? 0.35 : 0);
  g.add(led);
  return led;
}
/* the lead isn't a rubber cable: it's a chain of little card boxes, painted orange and taped end to end, laid along the same route.
   A few chunky boxes (N) follow the curve, each turned to face the next and plainly crooked: put down by hand, none the same size; a strip of tape bridges every joint; a bigger box at the
   end is the plug. On the craft mat the chain rides on top of the rubber. It moves between the loose and plugged-in routes exactly as the cord did */
const N = 11,
  ORANGE = '#f28a2e',
  onMat = (x, z) => x > -14.1 && x < 10.9 && z > -5.3 && z < 5.5,
  dummy = new THREE.Object3D(),
  up = new THREE.Vector3(0, 1, 0);
export function cable(loose, plug, color, r, isOn, led) {
  const paint = card('paper', ORANGE, { bumpScale: 0.25 }),
    L = 0.27,
    W = r * 3.1,
    H = r * 2.2;
  const link = rbox(L, H, W, 0.02, paint),
    boxes = new THREE.InstancedMesh(link.geometry, paint, N),
    lines = new THREE.InstancedMesh(
      link.geometry,
      new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }),
      N,
    );
  const strips = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.2, 0.012, W * 1.2),
    new THREE.MeshStandardMaterial({ color: '#eedcaa', roughness: 0.8, transparent: true, opacity: 0.93 }),
    N - 1,
  );
  boxes.castShadow = boxes.receiveShadow = true;
  [boxes, lines, strips].forEach((o) => {
    o.frustumCulled = false;
    o.raycast = () => {};
    scene.add(o);
  });
  const end = rbox(0.3, H * 1.5, W * 1.6, 0.03, paint);
  end.rotation.order = 'YXZ';
  scene.add(end);
  tape(end, 0, H * 0.75 + 0.004, 0, 0.34, 0.16, Math.PI / 2);
  const wob = Array.from({ length: N }, () => [rnd(0.5, -0.25), rnd(0.3, -0.15), 0.78 + rnd(0.4), 0.8 + rnd(0.35)]); // each box: turned, rolled, and its own width and height
  const skew = Array.from({ length: N }, () => rnd(0.5, -0.25)),
    rndAt = (i) => skew[i]; // each strip of tape slapped on at its own angle
  const c = {
    t: 0,
    isOn,
    led,
    build() {
      const k = c.t < 0.5 ? 2 * c.t * c.t : 1 - Math.pow(-2 * c.t + 2, 2) / 2,
        lift = Math.sin(Math.PI * c.t) * 0.9;
      const curve = new THREE.CatmullRomCurve3(
        loose.map(
          (p, i) =>
            new THREE.Vector3(
              ...p.map((v, a) => v + (plug[i][a] - v) * k + (a === 1 && i > 0 && i < loose.length - 1 ? lift : 0)),
            ),
        ),
      );
      const pts = curve.getSpacedPoints(N + 1).map((p) => {
        p.y = Math.max(p.y, H / 2 + 0.012) + (onMat(p.x, p.z) ? 0.07 : 0);
        return p;
      });
      for (let i = 0; i < N; i++) {
        const a = pts[i],
          b = pts[i + 1];
        dummy.position.copy(a).lerp(b, 0.5);
        dummy.up.copy(up);
        dummy.lookAt(b);
        dummy.rotateY(Math.PI / 2 + wob[i][0]);
        dummy.rotateX(wob[i][1]);
        const d = (a.distanceTo(b) / L) * 0.84,
          [, , sw, sh] = wob[i];
        dummy.scale.set(d, sh, sw);
        dummy.updateMatrix();
        boxes.setMatrixAt(i, dummy.matrix);
        dummy.scale.set(d + 0.2, sh * 1.2, sw * 1.12);
        dummy.updateMatrix();
        lines.setMatrixAt(i, dummy.matrix);
        if (i) {
          dummy.position.copy(a);
          dummy.position.y += H / 2 + 0.012;
          dummy.rotateY(rndAt(i));
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          strips.setMatrixAt(i - 1, dummy.matrix);
        }
      }
      [boxes, lines, strips].forEach((o) => {
        o.instanceMatrix.needsUpdate = true;
      });
      end.position.copy(pts.at(-1));
      end.lookAt(pts.at(-2));
      end.rotateY(Math.PI / 2);
    },
  };
  c.build();
  CABLES.push(c);
  return c;
}
export function updateCables() {
  for (const c of CABLES) {
    const tgt = c.isOn() ? 1 : 0;
    if (Math.abs(c.t - tgt) < 0.002) {
      if (c.t !== tgt) {
        c.t = tgt;
        c.build();
        if (tgt) drum('rim');
      }
    } else {
      c.t += (tgt - c.t) * 0.06;
      c.build();
    }
    c.led.material.emissiveIntensity = c.t > 0.97 ? 1.6 : 0;
  }
}
