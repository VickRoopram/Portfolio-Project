/* Shared state and tiny helpers. Every layer reads and writes here, so no module has to import "upward". */
export const $ = id => document.getElementById(id);
export const pad = n => String(n).padStart(2, '0');
export const lerp = (a, b, k) => a + (b - a) * k;
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const desktop = () => innerWidth > 760;
/* restart a one-shot CSS animation (icon flips) */
export const flip = b => { b.classList.remove('flip'); void b.offsetWidth; b.classList.add('flip') };

export const S = { mode: null, card: null, hover: null, hoverUntil: 0, kb: 'gd', grp: null, menu: false }; // what the visitor is doing (menu: the side panel is open)
export const V = { themeK: -1, themeT: 0, fly: null, drag: null, side: false, zoom: { min: 1, max: 100 }, logo: 0 };          // eased theme, camera flight, active drag, a panel is about to open, zoom limits (synth ↔ table), how much the logo is showing on the synth screen (0..1)
export const hits = [], anim = [];          // raycast targets · meshes easing toward userData.ty / .r
export const CTRL = { kb: [], cv: [] };     // item controls: the keys (current keyboard mode) and the remote
export const ROWBTN = [];                   // mode buttons: [mesh, mode]
export const realCh = ch => ch === 'kb' ? S.kb : ch;
/* app actions (zoomTo, zoomOut, openCard, closeCard, journey, cancelJourney, openMenuFor), wired in main.js once the page exists */
export const act = {};
