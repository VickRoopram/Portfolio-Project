/* Detail card: the work first, a tight headline group, then the story, links and gallery. Plus toast, lightbox and HUD state. */
import { $, S, CTRL, ROWBTN, act, reduceMotion } from '../core/state.js';
import { CH, LINKS, MODES, onKeys } from '../core/data.js';
import { ensureAudio, playNote, drum } from '../core/audio.js';
import { press } from '../molecules/controls.js';
import { icon, socialIcon } from '../atoms/icons.js';

const out = url => icon(/\.pdf$/i.test(url) ? 'download' : 'external-link', 16); // where a link goes: a file to save, or another site
const EMAIL = 'vickhal10@gmail.com';
/* images shimmer until they arrive, then fade in */
const pic = (g, cls = '') => `<button class="pic ${cls}" data-src="${g.s}" aria-label="Enlarge: ${g.a}"><img src="${g.s}" alt="${g.a}" loading="lazy" onload="this.parentNode.classList.add('ok')" onerror="this.parentNode.classList.add('ok')"></button>`;
function cardHTML(ch, i) {
  const it = CH[ch].items[i]; let h = it.img?.length ? pic(it.img[0], 'lead') : '';
  h += `<header class="hd"><h2>${it.t}</h2><p class="k">${it.k}</p></header>`;
  if (it.hero) h += `<div class="hero"><img src="assets/img/vick.jpg" alt="Portrait of Vickhal Roopram"><div class="d"><p><b>Vickhal Roopram</b><br>UX & Motion Designer<br>27 · South Africa</p></div></div>`;
  if (it.bars) h += `<div class="bars">${it.bars.map(b => `<div class="bar"><span>${b[0]}</span><small>${b[1]}</small><div><i style="--w:${b[2] * 100}%"></i></div></div>`).join('')}</div>`;
  if (it.life) h += CH.life.items.map(x => `<div class="d"><h3>${x.t}</h3>${x.d}</div>`).join('');
  if (it.contact) h += `<div class="d"><p>For work, collaborations or a chat about design and faith:</p></div><div class="cta-row"><a class="cta" href="mailto:${EMAIL}">${icon('mail', 18)}<span>Email ${EMAIL}</span></a><button class="cta ghost" id="cp">${icon('copy', 18)}<span>Copy</span></button></div>`
    + `<p class="copy">${icon('phone', 16)}Cell <span class="num">+27 73 482 7221</span></p><div class="socials">${LINKS.map(([n, u]) => `<a class="soc" href="${u}" target="_blank" rel="noopener">${socialIcon(n)}<span>${n}<small>${u.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '')}</small></span>${out(u)}</a>`).join('')}</div>`;
  if (it.d) h += `<div class="d">${it.d}</div>`;
  if (it.links) h += `<div class="cta-row">${it.links.map((l, k) => `<a class="cta${k ? ' ghost' : ''}" href="${l[1]}" target="_blank" rel="noopener"><span>${l[0]}</span>${out(l[1])}</a>`).join('')}</div>`;
  if (it.img?.length > 1) h += `<div class="gal">${it.img.slice(1).map(g => pic(g)).join('')}</div>`;
  return h;
}

export function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true }, 2600) }
/* HUD: Home greys out at home; header icons glow in the active mode's colour; phones hide the legend under the card sheet */
export function updateUI() {
  $('home')?.setAttribute('data-at-home', String(!S.mode && !S.card)); document.body.dataset.card = String(!!S.card);
  const g = S.card ? MODES[S.card.ch]?.glow : S.mode ? MODES[S.mode].glow : null;
  document.documentElement.style.setProperty('--glow', !g || g === '#ffffff' ? '#ff5d1a' : g);
}
const card = $('card'), ct = $('ct'), cf = $('cf');
/* o.from 'menu': opened through the menu, so the footer offers Back to menu and Cancel (kept while paging with prev/next).
   o.quiet: the key was already pushed on the way in, so don't press it again */
export function openCard(ch, i, o = {}) {
  const n = CH[ch].items.length; i = ((i % n) + n) % n;
  const was = S.card, from = o.from ?? (S.card?.ch === ch ? S.card.from : undefined); S.card = { ch, i, from }; updateUI(); cf.hidden = from !== 'menu';
  /* paging to another project in the same book turns the page: the page you were reading lifts off and swings over
     (to the left going forward, to the right going back), with its blank back showing, and the next page is underneath */
  const n0 = CH[ch].items.length, turn = was && !card.hidden && was.ch === ch && was.i !== i && !reduceMotion ? ((i - was.i + n0) % n0 <= n0 / 2 ? 1 : -1) : 0;
  if (turn) {
    const leaf = document.createElement('div'), front = ct.cloneNode(true), top = ct.scrollTop; leaf.className = 'leaf ' + (turn > 0 ? 'fwd' : 'back'); leaf.setAttribute('aria-hidden', 'true');
    front.removeAttribute('id'); front.classList.add('leaf-front'); leaf.style.cssText = `top:${ct.offsetTop}px;left:${ct.offsetLeft}px;width:${ct.offsetWidth}px;height:${ct.offsetHeight}px`;
    leaf.append(front, Object.assign(document.createElement('div'), { className: 'leaf-back' })); card.append(leaf); front.scrollTop = top; setTimeout(() => leaf.remove(), 600);
  }
  card.style.setProperty('--accent', CH[ch].col); ct.innerHTML = cardHTML(ch, i); ct.scrollTop = 0;
  if (!turn) { card.hidden = true; void card.offsetWidth; card.hidden = false } // a new book: the sheet drops in
  if (!o.quiet) { const rb = ROWBTN.find(a => a[1] === ch); if (rb) press(rb[0]); const m = (onKeys(ch) ? CTRL.kb : CTRL[ch])?.[i]; if (m) press(m) }
  const cp = $('cp'); if (cp) cp.onclick = () => navigator.clipboard?.writeText(EMAIL).then(() => {
    cp.classList.add('done'); cp.innerHTML = icon('check', 18, 'tick') + '<span>Copied</span>'; toast('Email copied to your clipboard'); drum('blip') }, () => toast(`Copy blocked: the address is ${EMAIL}`));
}
export function closeCard() { S.card = null; card.hidden = true; cf.hidden = true; updateUI() }
/* footer CTAs (secondary): back to the menu level this card came from, or just close and stay on the synth */
$('tomenu').onclick = () => { const c = S.card; drum('blip'); closeCard(); if (c) act.openMenuFor(c.ch, c.i) };
$('cancel').onclick = () => { drum('blip'); closeCard() };
const step = d => { ensureAudio(); openCard(S.card.ch, S.card.i + d); playNote(60 + [0, 4, 7, 12, 7, 4, 2, 5, 9, 11, 14, 16][S.card.i % 12]) };
$('prev').innerHTML = icon('chevron-left', 20); $('next').innerHTML = icon('chevron-right', 20); $('cls').innerHTML = icon('close', 20);
$('prev').onclick = () => step(-1); $('next').onclick = () => step(1); $('cls').onclick = closeCard;
const lb = $('lb');
ct.onclick = e => { const b = e.target.closest('.pic'); if (b) { lb.querySelector('img').src = b.dataset.src; lb.hidden = false } };
lb.onclick = () => lb.hidden = true;
