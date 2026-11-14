/* Pixel font atom: a 5 × 7 dot-matrix alphabet drawn as LED dots on a canvas, so the screens read like a hardware display
   (no web font to load). Each glyph is 7 rows of 5 bits, top row first. Unlit dots show faintly, like a real matrix. */
const G = {
  A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110', C: '01110 10001 10000 10000 10000 10001 01110',
  D: '11110 10001 10001 10001 10001 10001 11110', E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001', I: '01110 00100 00100 00100 00100 00100 01110',
  J: '00111 00010 00010 00010 00010 10010 01100', K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 11001 10101 10011 10001 10001 10001', O: '01110 10001 10001 10001 10001 10001 01110',
  P: '11110 10001 10001 11110 10000 10000 10000', Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100', U: '10001 10001 10001 10001 10001 10001 01110',
  V: '10001 10001 10001 10001 10001 01010 00100', W: '10001 10001 10001 10101 10101 10101 01010', X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111', ' ': '00000 00000 00000 00000 00000 00000 00000',
};
const rows = ch => (G[ch] || G[' ']).split(' ');
/* text width in dots (5 per letter, 1 between) */
export const dotsWide = text => text.length * 6 - 1;
/* the unlit matrix: faint dots on a `cell` pitch across the whole canvas */
export function drawMatrix(x, W, H, cell, ox = 0, oy = 0) {
  const r = cell * .36; x.fillStyle = 'rgba(255,236,200,.07)';
  for (let gy = (oy % cell) - cell; gy < H; gy += cell) for (let gx = (ox % cell) - cell; gx < W; gx += cell) { x.beginPath(); x.arc(gx + cell / 2, gy + cell / 2, r, 0, 7); x.fill() }
}
/* lit text centred on (cx, cy), `cell` px per dot (any size, so it can ease between sizes), with a soft bloom */
export function drawPixelText(x, text, cx, cy, cell, color) {
  text = text.toUpperCase(); const ox = cx - dotsWide(text) * cell / 2, oy = cy - 3.5 * cell, r = cell * .41;
  x.save(); x.fillStyle = color; /* paint dabs on dark paper: no glow */
  [...text].forEach((ch, i) => rows(ch).forEach((row, ry) => [...row].forEach((b, rx) => {
    if (b !== '1') return; x.beginPath(); x.arc(ox + (i * 6 + rx) * cell + cell / 2, oy + ry * cell + cell / 2, r, 0, 7); x.fill() })));
  x.restore();
}
/* fill a W × H canvas: a dark panel with a faint dot grid, and `text` lit in `color`, centred, as large as fits inside `pad` */
export function pixelScreen(x, W, H, text, color, pad = 40) {
  const cell = Math.floor(Math.min((W - pad * 2) / dotsWide(text), (H - pad * 2) / 7)), ox = Math.round((W - dotsWide(text) * cell) / 2), oy = Math.round((H - 7 * cell) / 2);
  x.fillStyle = '#2b1d15'; x.fillRect(0, 0, W, H); drawMatrix(x, W, H, cell, ox, oy); drawPixelText(x, text, W / 2, H / 2, cell, color);
}
