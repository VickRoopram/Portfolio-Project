/* The design library page: renders library/manifest.json (scripts/generate.mjs) and the live tokens. */
import { PATHS, icon } from '../src/atoms/icons.js';
import { toast } from '../src/molecules/toast.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const kb = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const live = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const m = await (await fetch('manifest.json', { cache: 'no-store' })).json();

/* tokens: a swatch for colours, a specimen for type, a bar for space, a tile for textures */
const isColour = (v) => /^(#|rgb|hsl)/.test(v) || /^var\(--pal-/.test(v);
function sample(t) {
  const n = t.name;
  if (/gradient/.test(t.value) || n === '--room') return `<span class="sw" style="background:var(${n})"></span>`;
  if (isColour(t.value)) return `<span class="sw" style="background:var(${n})"></span>`;
  if (/^url\(/.test(t.value) && !/cursor/.test(n))
    return `<span class="sw tex" style="background-image:var(${n})"></span>`;
  if (/^--t-/.test(n)) return `<span class="type" style="font-size:var(${n})">Aa</span>`;
  if (/^--(display|body|mono)$/.test(n)) return `<span class="type" style="font-family:var(${n})">Use the box</span>`;
  if (/^--s\d/.test(n)) return `<span class="bar" style="width:var(${n})"></span>`;
  if (/^--(r\d|cut)/.test(n)) return `<span class="sw" style="border-radius:var(${n});background:var(--kraft)"></span>`;
  if (/^--cur-/.test(n))
    return `<span class="sw" style="cursor:var(${n});background:var(--cream)" title="point here"></span>`;
  return '';
}
$('#tiers').innerHTML = m.tiers
  .map(
    (tier) =>
      `<h3>${esc(tier.tier)}</h3><div class="lib-tokens">${tier.tokens
        .map(
          (t) =>
            `<div class="tok">${sample(t)}<div><code>${esc(t.name)}</code><small>${esc(t.value)}${
              isColour(t.value) && live(t.name) !== t.value ? ` → ${esc(live(t.name))}` : ''
            }</small>${t.note ? `<small class="note">${esc(t.note)}</small>` : ''}</div></div>`,
        )
        .join('')}</div>`,
  )
  .join('');

/* icons */
$('#icon-grid').innerHTML = Object.keys(PATHS)
  .sort()
  .map((n) => `<figure>${icon(n, 28)}<figcaption>${esc(n)}</figcaption></figure>`)
  .join('');
$('#lib-toast').addEventListener('click', () => toast('Email copied'));

/* code components, by layer */
const LAYERS = [
  ['app', 'Entry points and content'],
  ['core', 'Core: state, content, audio, renderer'],
  ['atoms', 'Atoms: geometry, textures, materials, icons, labels'],
  ['molecules', 'Molecules: controls, cables, press effects, card markup, toast'],
  ['organisms', 'Organisms: the synth, remote, desk, menu, card, tour, phone page…'],
  ['page', 'Page: camera and input'],
  ['styles', 'Styles: tokens → base → atoms → molecules → organisms → skin → tour → phone'],
];
$('#layers').innerHTML = LAYERS.map(([k, title]) => {
  const rows = m.components.filter((c) => c.layer === k);
  return rows.length
    ? `<h3>${esc(title)}</h3><table><thead><tr><th>File</th><th>What it is</th><th>Exports</th><th>Lines</th></tr></thead><tbody>${rows
        .map(
          (c) =>
            `<tr><td><code>${esc(c.file.replace('src/', ''))}</code></td><td>${esc(c.about)}</td><td>${c.exports.map((e) => `<code>${esc(e)}</code>`).join(' ')}</td><td>${c.lines}</td></tr>`,
        )
        .join('')}</tbody></table>`
    : '';
}).join('');

/* assets, by folder, with what uses each one */
const groups = Object.groupBy(m.assets, (a) => a.kind);
const total = m.assets.reduce((s, a) => s + a.bytes, 0),
  unused = m.assets.filter((a) => !a.usedBy.length);
$('#asset-sum').textContent =
  `${m.assets.length} files, ${kb(total)}. ${unused.length ? `Not referenced in the code (may be used by /admin content): ${unused.map((a) => a.path).join(', ')}.` : 'All referenced in the code.'}`;
$('#asset-groups').innerHTML = Object.entries(groups)
  .map(
    ([k, list]) =>
      `<h3>${esc(k)} <small>${list.length} · ${kb(list.reduce((s, a) => s + a.bytes, 0))}</small></h3><div class="lib-grid assets">${list
        .map((a) => {
          const pic = /\.(jpe?g|png|webp|svg)$/.test(a.path)
            ? `<img src="../${esc(a.path)}" alt="" loading="lazy">`
            : `<span class="file">${esc(a.path.split('.').pop())}</span>`;
          return `<figure${a.usedBy.length ? '' : ' class="unused"'}>${pic}<figcaption><code>${esc(a.path.split('/').pop())}</code><small>${kb(a.bytes)}${a.w ? ` · ${a.w}×${a.h}` : ''}</small><small>${a.usedBy.length ? 'in ' + a.usedBy.map((u) => esc(u.split('/').pop())).join(', ') : 'not referenced'}</small></figcaption></figure>`;
        })
        .join('')}</div>`,
  )
  .join('');
