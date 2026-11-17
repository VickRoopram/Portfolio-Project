/* The phone page. Held upright, a phone gets this instead of the 3D desk: one scrolling page where the playful part is carried by
   cardboard boxes. A simple menu jumps to each box; tap a box and its flaps fold open to show what's inside. Projects open as a full
   paper page. Turn the phone sideways and the synth takes over (boot.js), and a note at the bottom says so.
   No 3D in here: three.js only loads if the phone is turned. */
import { CH, MENU } from '../core/data.js';
import { DESK } from '../content.js';
import { cardHTML, EMAIL } from '../molecules/cardhtml.js';
import { icon } from '../atoms/icons.js';
import { sketch, DOODLES } from '../atoms/sketch.js';

const $ = id => document.getElementById(id), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const go = el => el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
const count = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

/* each snapshot's back: the Life (or About) note it stands for, found by its caption */
const BACKS = { faith: 'Faith', family: 'Family', 'on the mats': 'Jiu-Jitsu', 'game night': 'Dungeons & Dragons', 'up a mountain': 'Hiking & nature', 'the dogs': 'Dogs', sketchbook: 'Drawing', 'me, mostly': 'Indian, South African' };
const back = p => p.note || [...CH.life.items, ...CH.ab.items].find(x => x.t === BACKS[p.cap])?.d || `<p>${p.cap}</p>`;

/* ── a box: the flaps are the button; the inside is drawn the first time it opens ── */
const BOXES = [];
function box(id, name, sub, fill, open = false) {
  const b = Object.assign(document.createElement('section'), { className: 'pbox', id: 'p-' + id });
  b.innerHTML = `<h2 class="pbox-h"><button class="lid" id="p-${id}-lid" aria-expanded="false" aria-controls="p-${id}-in">
      <span class="flaps" aria-hidden="true"><i class="fl"></i><i class="fr"></i><i class="tape"></i></span>
      <span class="face"><b>${name}</b><small>${sub}</small>${icon('chevron-down', 22, 'chev')}</span></button></h2>
    <div class="pbox-in" id="p-${id}-in" role="region" aria-labelledby="p-${id}-lid" inert><div class="pbox-body"></div></div>`;
  const lid = b.querySelector('.lid'), inner = b.querySelector('.pbox-in'), body = b.querySelector('.pbox-body');
  b.toggle = (on = !b.classList.contains('open')) => {
    if (on && !body.firstChild) { body.innerHTML = fill(); wire(body) }
    b.classList.toggle('open', on); lid.setAttribute('aria-expanded', on); inner.inert = !on;
  };
  lid.onclick = () => b.toggle(); if (open) b.toggle(true); BOXES.push(b); return b;
}

/* a project tile: the lead picture (or the project's number on card), its name and kicker */
const tile = (k, it, i) => `<button class="tile" data-k="${k}" data-i="${i}"><span class="t-pic">${it.img?.[0] ? `<img src="${it.img[0].s}" alt="" loading="lazy">` : `<b>${String(i + 1).padStart(2, '0')}</b>`}</span><b class="t-name">${it.t}</b><small>${it.k || ''}</small></button>`;
const tiles = k => `<div class="tiles">${CH[k].items.map((it, i) => tile(k, it, i)).join('')}</div>`;

/* a snapshot: the polaroid's front (photo, or its doodle until the photo arrives) and, flipped, the note on its back */
function snapFront(p, i) {
  const c = document.createElement('canvas'); c.width = 380; c.height = 460; const x = c.getContext('2d'), S = 336, o = 22;
  const draw = img => { x.clearRect(0, 0, 380, 460); x.fillStyle = '#fffdf6'; x.fillRect(0, 0, 380, 460);
    if (img) { const s = Math.max(S / img.width, S / img.height); x.save(); x.beginPath(); x.rect(o, o, S, S); x.clip(); x.drawImage(img, o + (S - img.width * s) / 2, o + (S - img.height * s) / 2, img.width * s, img.height * s); x.restore() }
    else { x.fillStyle = ['#d9cbb0', '#cfd8c4', '#d8c7c0', '#c9d3d8'][i % 4]; x.fillRect(o, o, S, S);
      x.save(); x.translate(o + S / 2 - 105, o + S / 2 - 105); x.scale(2.1, 2.1); x.strokeStyle = '#2a1b12'; x.lineWidth = 2.6; x.lineCap = x.lineJoin = 'round'; DOODLES[i % DOODLES.length](x); x.restore() }
    x.strokeStyle = 'rgba(42,27,18,.55)'; x.lineWidth = 2; x.strokeRect(o, o, S, S);
    x.fillStyle = '#2a1b12'; x.font = '400 44px "Patrick Hand", cursive'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(p.cap || '', 190, 410) };
  document.fonts.ready.then(() => draw(null));
  if (p.img) { const im = new Image(); im.onload = () => document.fonts.ready.then(() => draw(im)); im.src = p.img }
  return c;
}
const snaps = () => `<p class="p-lead">Eight snapshots. Tap one to read the back.</p><div class="snaps">${DESK.polaroids.slice(0, 8).map((p, i) => `<button class="snap" data-n="${i}" aria-pressed="false" aria-label="${p.cap}: flip to read the back"><span class="snap-in"><span class="snap-f"></span><span class="snap-b">${back(p)}</span></span></button>`).join('')}</div>`;

/* ── the full page a project opens into ── */
let at = null;
function sheet(k, i) {
  const n = CH[k].items.length; i = (i + n) % n; const fresh = !at; at = { k, i };
  $('p-sh-ct').innerHTML = cardHTML(k, i); $('p-sh-ct').scrollTop = 0; wire($('p-sh-ct'));
  $('p-sh-kind').textContent = MENU.projects.find(p => p.key === k)?.label || CH[k].name;
  for (const b of ['p-sh-prev', 'p-sh-next']) $(b).hidden = n < 2;
  if (fresh) { $('p-sheet').hidden = false; document.documentElement.classList.add('p-lock'); history.pushState({ sheet: 1 }, ''); $('p-sh-back').focus({ preventScroll: true }) }
}
function unsheet() { if (!at) return; const t = document.querySelector(`.tile[data-k="${at.k}"][data-i="${at.i}"]`); at = null; $('p-sheet').hidden = true; document.documentElement.classList.remove('p-lock'); t?.focus({ preventScroll: true }) }

/* everything tappable inside a box or a page: tiles, snapshots, pictures (to the lightbox), the Copy button */
function wire(root) {
  root.querySelectorAll('.tile').forEach(t => t.onclick = () => sheet(t.dataset.k, +t.dataset.i));
  root.querySelectorAll('.snap').forEach(s => { const i = +s.dataset.n; s.querySelector('.snap-f').append(snapFront(DESK.polaroids[i], i));
    s.onclick = () => { const on = s.classList.toggle('flip'); s.setAttribute('aria-pressed', on) } });
  root.querySelectorAll('.pic').forEach(b => b.onclick = () => { const lb = $('lb'); lb.querySelector('img').src = b.dataset.src; lb.hidden = false });
  const cp = root.querySelector('#cp'); if (cp) cp.onclick = () => navigator.clipboard?.writeText(EMAIL).then(() => { cp.classList.add('done'); cp.innerHTML = icon('check', 18) + '<span>Copied</span>'; toast('Email copied') }, () => toast('Copy blocked: the address is ' + EMAIL));
}
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true }, 2600) }

/* ── the menu: a sheet of links, one per box ── */
function menu(on) {
  const nav = $('p-nav'), btn = $('p-mnu'); nav.hidden = !on; btn.setAttribute('aria-expanded', on); document.documentElement.classList.toggle('p-lock', on);
  btn.innerHTML = icon(on ? 'close' : 'menu', 20) + `<span>${on ? 'Close' : 'Menu'}</span>`;
  if (on) nav.querySelector('a').focus(); else btn.focus({ preventScroll: true });
}
function jump(id) { const b = $(id); if (!b) return; b.toggle?.(true); go(b) }

export function initPocket() {
  const root = $('pocket'), intro = $('intro');
  const hero = intro?.querySelector('.in-sheet')?.cloneNode(true);
  if (hero) { hero.querySelectorAll('[id]').forEach(e => e.id = 'p-' + e.id); hero.classList.add('p-hero-sheet') }
  /* upright at the start: the page is the welcome, so the 3D intro is never needed (turning sideways goes straight to the synth) */
  if (document.documentElement.dataset.view === 'page') intro?.remove();
  const items = k => count(CH[k].items.length, k === 'tl' ? 'tool' : 'project');
  root.innerHTML = `
    <header class="p-bar"><a class="p-logo" href="#p-top" aria-label="Vickhal Roopram: back to the top"><img src="assets/ui/logo-on-dark.svg" width="290" height="101" alt=""></a>
      <button class="pill p-mnu" id="p-mnu" aria-expanded="false" aria-controls="p-nav"></button></header>
    <nav class="p-nav" id="p-nav" aria-label="Sections" hidden><ul>
      <li><a href="#p-about">About</a></li>
      <li class="p-grp"><span>Projects</span><ul>${MENU.projects.map(p => `<li><a href="#p-${p.key}">${p.label}</a></li>`).join('')}</ul></li>
      <li><a href="#p-life">Off the clock</a></li><li><a href="#p-hello">Say hello</a></li></ul>
      <p class="p-nav-flip"><span class="ph-ico" aria-hidden="true"></span>Turn your phone sideways to play the synth.</p></nav>
    <main class="p-main" id="p-top"><section class="p-hero" aria-labelledby="p-in-h"></section><div id="p-boxes"></div>
      <footer class="p-foot"><p class="quote">Research like a nerd. Play like a kid. Use the box.</p><p>Made of cardboard, tape and a lot of homework. © Vickhal Roopram</p></footer></main>
    <p class="p-flip" id="p-flip" role="note"><span class="ph-ico" aria-hidden="true"></span><span>Turn sideways to play the synth</span></p>
    <div class="p-sheet" id="p-sheet" role="dialog" aria-modal="true" aria-labelledby="p-sh-kind" hidden>
      <header class="p-sh-top"><button class="pill" id="p-sh-back">${icon('chevron-left', 18)}<span>Back</span></button><b id="p-sh-kind"></b></header>
      <div class="content" id="p-sh-ct"></div>
      <footer class="p-sh-foot"><button class="pill" id="p-sh-prev">${icon('chevron-left', 18)}<span>Previous</span></button><button class="pill" id="p-sh-next"><span>Next</span>${icon('chevron-right', 18)}</button></footer></div>`;
  if (hero) root.querySelector('.p-hero').append(hero);
  const ent = $('p-enter'); if (ent) { ent.onclick = () => jump('p-about'); ent.setAttribute('aria-label', 'Enter: go to About') }
  $('p-boxes').append(
    box('about', 'About', 'Who’s behind the cardboard', () => `<div class="content">${cardHTML('ab', 0)}</div>`),
    Object.assign(document.createElement('h2'), { className: 'p-h', textContent: 'Projects' }),
    ...MENU.projects.filter(p => CH[p.key]?.items.length).map(p => box(p.key, p.label, items(p.key) + ' inside', () => tiles(p.key))),
    box('life', 'Off the clock', 'Snapshots of the person behind the work', snaps),
    box('hello', 'Say hello', 'A job, a project or a long chat', () => `<div class="content">${cardHTML('cv', 1)}</div><div class="tiles one">${tile('cv', CH.cv.items[0], 0)}</div>`, true));
  /* menu, page and back button */
  $('p-mnu').innerHTML = icon('menu', 20) + '<span>Menu</span>'; $('p-mnu').onclick = () => menu($('p-nav').hidden);
  $('p-nav').onclick = e => { const a = e.target.closest('a'); if (!a) return; e.preventDefault(); menu(false); jump(a.hash.slice(1)) };
  root.querySelector('.p-logo').onclick = e => { e.preventDefault(); go($('p-top')) };
  addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (!$('lb').hidden) $('lb').hidden = true; else if (at) history.back(); else if (!$('p-nav').hidden) menu(false) });
  $('p-sh-back').onclick = () => history.back(); addEventListener('popstate', unsheet);
  $('p-sh-prev').onclick = () => sheet(at.k, at.i - 1); $('p-sh-next').onclick = () => sheet(at.k, at.i + 1);
  $('lb').onclick = () => { $('lb').hidden = true };
}
