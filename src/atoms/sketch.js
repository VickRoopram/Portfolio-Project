/* Pencil on a canvas: a line drawn twice, a little off each time, the way a hand would. And the placeholder doodles for the snapshots
   (one each, until Vick's photos arrive), used on the desk's polaroids and on the phone page. No 3D in here. */
export function sketch(x, pts, { close = false, jit = 1.5, passes = 2 } = {}) {
  for (let p = 0; p < passes; p++) { x.beginPath();
    pts.forEach(([px, py], i) => { const jx = px + (Math.random() - .5) * jit * 2, jy = py + (Math.random() - .5) * jit * 2; i ? x.lineTo(jx, jy) : x.moveTo(jx, jy) });
    if (close) x.closePath(); x.stroke() }
}

export const DOODLES = [ // placeholder sketches, one per snapshot, in a 100 × 100 box
  x => { sketch(x, [[50, 12], [50, 88]]); sketch(x, [[26, 36], [74, 36]]) },                                                             // a cross
  x => { [[30, 40, 13], [58, 34, 16], [80, 46, 11]].forEach(([cx, cy, r]) => { sketch(x, Array.from({ length: 11 }, (_, i) => [cx + Math.cos(i / 10 * 6.3) * r, cy + Math.sin(i / 10 * 6.3) * r])); sketch(x, [[cx - r, cy + r + 30], [cx - r * .6, cy + r + 4], [cx + r * .6, cy + r + 4], [cx + r, cy + r + 30]]) }) }, // three people
  x => { sketch(x, [[8, 52], [30, 46], [70, 46], [92, 52], [70, 58], [30, 58]], { close: true }); sketch(x, [[44, 42], [50, 62], [56, 42]]) },    // a belt
  x => { sketch(x, [[50, 8], [88, 34], [74, 82], [26, 82], [12, 34]], { close: true }); sketch(x, [[50, 8], [50, 44], [88, 34]]); sketch(x, [[12, 34], [50, 44], [26, 82]]); sketch(x, [[50, 44], [74, 82]]) }, // a twenty-sided die
  x => { sketch(x, [[6, 84], [36, 26], [52, 54], [66, 36], [94, 84]]); sketch(x, [[27, 42], [36, 48], [44, 40]]) },                              // mountains
  x => { sketch(x, [[28, 50], [38, 30], [62, 30], [72, 50], [62, 76], [38, 76]], { close: true }); sketch(x, [[28, 50], [16, 26], [36, 34]]); sketch(x, [[72, 50], [84, 26], [64, 34]]); sketch(x, [[44, 62], [50, 68], [56, 62]]) }, // a dog
  x => { sketch(x, [[20, 84], [72, 22], [84, 34], [32, 94], [16, 98]], { close: true }); sketch(x, [[64, 32], [76, 44]]) },                      // a pencil
  x => { sketch(x, Array.from({ length: 13 }, (_, i) => [50 + Math.cos(i / 12 * 6.3) * 30, 48 + Math.sin(i / 12 * 6.3) * 34])); sketch(x, [[38, 58], [50, 66], [62, 58]]); sketch(x, [[38, 40], [42, 40]]); sketch(x, [[58, 40], [62, 40]]) }, // a face
];
