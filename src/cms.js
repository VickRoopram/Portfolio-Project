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
    return true;
  } catch { return false; }
}
