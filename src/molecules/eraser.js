/* Eraser: a small block rubber made of card, like everything else on the bench: a cream block with one end worn round, in a red paper
   sleeve. It rubs a marker line out (organisms/underlights.js). Put the group where the line's end is and turn it (rotation.y) along the line;
   the block inside is tipped onto its worn end, the way you hold one to rub. */
import * as THREE from 'three';
import { rbox } from '../atoms/geometry.js';
import { M } from '../atoms/materials.js';

export function eraser() {
  const g = new THREE.Group(),
    block = new THREE.Group(),
    body = rbox(0.92, 0.26, 0.44, 0.09, M('#fbf1dd')),
    sleeve = rbox(0.46, 0.3, 0.48, 0.04, M('#e0301a'));
  sleeve.position.x = -0.14;
  block.add(body, sleeve);
  block.rotation.z = -0.3;
  block.position.y = 0.24; // nose down on its leading end
  g.add(block);
  g.visible = false;
  g.traverse((o) => {
    o.raycast = () => {};
  });
  return g;
}
