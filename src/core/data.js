/* Content + modes. Waits for /admin overrides first, so every module that imports this sees the final content. */
import { CH, LINKS, MENU } from '../content.js';
import { applyCMS } from '../cms.js';
await applyCMS(CH, LINKS, MENU); // draft on previews, live on the live site
export { CH, LINKS, MENU };

const keys = k => CH[k].items.length;
/* one accent for the whole site: red. Every marker that says "you're pointing at this" or "this is selected" uses it (marker lines,
   rings, strokes, the cable, the notebook's underlines, the UI's buttons), so the section colours set in /admin are no longer shown */
export const ACCENT = '#e0301a';
for (const k in CH) CH[k].col = ACCENT;
const kb = n => ({ part: 'The keyboard', box: 'kb', glow: ACCENT, n });
/* each mode is a set of keys on the keyboard (or the remote) */
export const MODES = {
  gd: kb(keys('gd') + ' projects'),
  ux: kb(keys('ux') + ' case notes'),
  mo: kb(keys('mo') + ' pieces'),
  tl: kb(keys('tl') + ' keys'),
  xp: kb(keys('xp') + ' keys'),
  ab: kb(keys('ab') + ' keys'),
  cv: { part: 'The remote', box: 'cv', glow: ACCENT, n: 'CV, contact & socials' },
};
export const ORDER = ['gd', 'ux', 'mo', 'tl', 'xp', 'ab', 'cv']; // number keys 1-7
export const onKeys = ch => MODES[ch]?.box === 'kb';
