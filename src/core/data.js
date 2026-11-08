/* Content + modes. Waits for /admin overrides first, so every module that imports this sees the final content. */
import { CH, LINKS } from '../content.js';
import { applyCMS } from '../cms.js';
await applyCMS(CH, LINKS); // draft on previews, live on the live site
export { CH, LINKS };

const keys = k => CH[k].items.length;
const kb = (glow, n) => ({ part: 'The keyboard', box: 'kb', glow, n });
/* each mode is a set of keys on the keyboard (or the remote); glow colours can be changed in /admin */
export const MODES = {
  gd: kb('#22ff7a', keys('gd') + ' projects'),
  ux: kb('#3fb2ff', keys('ux') + ' case notes'),
  mo: kb('#ff6a20', keys('mo') + ' pieces'),
  tl: kb('#a46bff', keys('tl') + ' keys'),
  xp: kb('#ff5ec8', keys('xp') + ' keys'),
  ab: kb('#ff2a30', keys('ab') + ' keys'),
  cv: { part: 'The remote', box: 'cv', glow: '#ff6a20', n: 'CV, contact & socials' },
};
for (const k in MODES) if (CH[k]?.glow) MODES[k].glow = CH[k].glow;
export const ORDER = ['gd', 'ux', 'mo', 'tl', 'xp', 'ab', 'cv']; // number keys 1-7
export const onKeys = ch => MODES[ch]?.box === 'kb';
