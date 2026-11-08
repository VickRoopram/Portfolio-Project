/* Detail card: the work first, a tight headline group, then the story, links and gallery. Plus toast, lightbox and HUD state. */
import { $, S, CTRL, ROWBTN } from '../core/state.js';
import { CH, LINKS, MODES, onKeys } from '../core/data.js';
import { ensureAudio, playNote, drum } from '../core/audio.js';
import { press } from '../molecules/controls.js';

const svg = (w, body) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" aria-hidden="true">${body}</svg>`;
const line = (d, sw = 2, cls = '') => `<path${cls} d="${d}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
const ICON = { prev: svg(20, line('M15 5l-7 7 7 7')), next: svg(20, line('M9 5l7 7-7 7')), close: svg(20, line('M6 6l12 12M18 6L6 18')), out: svg(16, line('M8 16L16 8M9 8h7v7')),
  copy: svg(16, '<rect x="8" y="8" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>' + line('M5 15V6a1 1 0 0 1 1-1h9')), check: svg(16, line('M5 12.5l4.5 4.5L19 7.5', 2.4, ' class="tick"')) };
/* generic social marks, drawn in currentColor */
const glyph = (t, size, weight = 800, y = 16.5) => `<text x="12" y="${y}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="${weight}" font-size="${size}" fill="currentColor">${t}</text>`;
const SOCIAL = { behance: glyph('Bē', 11), threads: glyph('@', 17, 700, 17.5),
  instagram: '<rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16.6" cy="7.4" r="1.2" fill="currentColor"/>',
  linkedin: '<rect x="3.5" y="3.5" width="17" height="17" rx="3.5" fill="currentColor"/>' + glyph('in', 10, 800, 16.6).replace('currentColor', '#fff'),
  x: '<path d="M5 4.5h3.6l10.4 15h-3.6z" fill="currentColor"/><path d="M18.6 4.5 5.4 19.5" stroke="currentColor" stroke-width="1.8"/>' };
const socialIcon = label => svg(24, SOCIAL[label.toLowerCase().split(/[ (]/)[0]] || '<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/>');
const EMAIL = 'vickhal10@gmail.com';
/* images shimmer until they arrive, then fade in */
const pic = (g, cls = '') => `<button class="pic ${cls}" data-src="${g.s}" aria-label="Enlarge: ${g.a}"><img src="${g.s}" alt="${g.a}" loading="lazy" onload="this.parentNode.classList.add('ok')" onerror="this.parentNode.classList.add('ok')"></button>`;
function cardHTML(ch, i) {
  const it = CH[ch].items[i]; let h = it.img?.length ? pic(it.img[0], 'lead') : '';
  h += `<header class="hd"><h2>${it.t}</h2><p class="k">${it.k}</p></header>`;
  if (it.hero) h += `<div class="hero"><img src="assets/img/vick.jpg" alt="Portrait of Vickhal Roopram"><div class="d"><p><b>Vickhal Roopram</b><br>UX & Motion Designer<br>27 · South Africa</p></div></div>`;
  if (it.bars) h += `<div class="bars">${it.bars.map(b => `<div class="bar"><span>${b[0]}</span><small>${b[1]}</small><div><i style="--w:${b[2] * 100}%"></i></div></div>`).join('')}</div>`;
  if (it.life) h += CH.life.items.map(x => `<div class="d"><h3>${x.t}</h3>${x.d}</div>`).join('');
  if (it.contact) h += `<div class="d"><p>For work, collaborations or a chat about design and faith:</p></div><div class="cta-row"><a class="cta" href="mailto:${EMAIL}">Email ${EMAIL}</a><button class="cta ghost" id="cp">${ICON.copy}<span>Copy</span></button></div>`
    + `<p class="copy">Cell <span class="num">+27 73 482 7221</span></p><div class="socials">${LINKS.map(([n, u]) => `<a class="soc" href="${u}" target="_blank" rel="noopener">${socialIcon(n)}<span>${n}<small>${u.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '')}</small></span>${ICON.out}</a>`).join('')}</div>`;
  if (it.d) h += `<div class="d">${it.d}</div>`;
  if (it.links) h += `<div class="cta-row">${it.links.map((l, k) => `<a class="cta${k ? ' ghost' : ''}" href="${l[1]}" target="_blank" rel="noopener">${l[0]} ${ICON.out}</a>`).join('')}</div>`;
  if (it.img?.length > 1) h += `<div class="gal">${it.img.slice(1).map(g => pic(g)).join('')}</div>`;
  return h;
}

export function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true }, 2600) }
/* HUD: Home greys out at home; header icons glow in the active mode's colour; phones hide the legend under the card sheet */
export function updateUI() {
  $('home').dataset.atHome = String(!S.mode && !S.card); document.body.dataset.card = String(!!S.card);
  const g = S.card ? MODES[S.card.ch]?.glow : S.mode ? MODES[S.mode].glow : null;
  document.documentElement.style.setProperty('--glow', !g || g === '#ffffff' ? '#ff5d1a' : g);
}
const card = $('card'), ct = $('ct');
export function openCard(ch, i) {
  const n = CH[ch].items.length; i = ((i % n) + n) % n; S.card = { ch, i }; updateUI();
  card.style.setProperty('--accent', CH[ch].col); ct.innerHTML = cardHTML(ch, i); ct.scrollTop = 0;
  card.hidden = true; void card.offsetWidth; card.hidden = false; // replay the pop-in
  const rb = ROWBTN.find(a => a[1] === ch); if (rb) press(rb[0]);
  const m = (onKeys(ch) ? CTRL.kb : CTRL[ch])?.[i]; if (m) press(m);
  const cp = $('cp'); if (cp) cp.onclick = () => navigator.clipboard?.writeText(EMAIL).then(() => {
    cp.classList.add('done'); cp.innerHTML = ICON.check + '<span>Copied</span>'; toast('Email copied to your clipboard'); drum('blip') }, () => toast(`Copy blocked: the address is ${EMAIL}`));
}
export function closeCard() { S.card = null; card.hidden = true; updateUI() }
const step = d => { ensureAudio(); openCard(S.card.ch, S.card.i + d); playNote(60 + [0, 4, 7, 12, 7, 4, 2, 5, 9, 11, 14, 16][S.card.i % 12]) };
$('prev').innerHTML = ICON.prev; $('next').innerHTML = ICON.next; $('cls').innerHTML = ICON.close;
$('prev').onclick = () => step(-1); $('next').onclick = () => step(1); $('cls').onclick = closeCard;
const lb = $('lb');
ct.onclick = e => { const b = e.target.closest('.pic'); if (b) { lb.querySelector('img').src = b.dataset.src; lb.hidden = false } };
lb.onclick = () => lb.hidden = true;
