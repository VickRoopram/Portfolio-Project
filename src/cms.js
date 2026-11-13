/**
 * Content from the admin (/admin), applied over the built-in defaults in content.js.
 *
 * Which version is shown:
 *   • the live site            → "live"  (what was last Published)
 *   • version-01 preview, deploy previews, local dev, or any URL with ?draft → "draft" (what was last saved with Update preview)
 * If nothing has been saved yet, or the request fails, the site simply keeps the defaults from content.js.
 */
const host = location.hostname;
export const STAGE = /^(version-01--|deploy-preview-)/.test(host) || /^(localhost|127\.0\.0\.1)$/.test(host) || new URLSearchParams(location.search).has('draft') ? 'draft' : 'live';

/* the CV isn't downloadable from the site (Vick, 13 Nov 2026): drop any link to the CV file and the sentence pointing to it,
   from the defaults and from anything published in /admin (the admin applies the same rule when it loads, so the next Publish
   cleans the stored copy too) */
const CV_FILE = /(^|\/)assets\/cv\/|vickhal-roopram-cv\.pdf/i, CV_LINE = /\s*Open the PDF for a copy you can save or print\.?/gi;
export function noCVDownload(CH, LINKS = []) {
  for (const g of Object.values(CH)) for (const it of g.items || []) {
    if (Array.isArray(it.links)) it.links = it.links.filter(l => !CV_FILE.test(l?.[1] || ''));
    if (typeof it.d === 'string') it.d = it.d.replace(CV_LINE, '');
  }
  for (let i = LINKS.length - 1; i >= 0; i--) if (CV_FILE.test(LINKS[i]?.[1] || '')) LINKS.splice(i, 1);
}

export async function applyCMS(CH, LINKS) {
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 3500);
    const r = await fetch(`/api/content?stage=${STAGE}`, { signal: ctl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!r.ok) return false;
    const doc = await r.json();
    if (!doc?.ch) return false;
    for (const [k, g] of Object.entries(doc.ch)) {
      if (!CH[k]) CH[k] = { name: g.name, col: g.col, items: [] };
      Object.assign(CH[k], { name: g.name, col: g.col }, g.glow ? { glow: g.glow } : {}, g.knob ? { knob: g.knob } : {});
      CH[k].items = g.items;
    }
    if (Array.isArray(doc.links) && doc.links.length) LINKS.splice(0, LINKS.length, ...doc.links);
    noCVDownload(CH, LINKS);
    return true;
  } catch { return false; }
}
