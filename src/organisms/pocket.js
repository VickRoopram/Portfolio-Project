/* The phone page. Held upright, a phone gets this instead of the 3D desk: one scrolling page where the playful part is carried by
   cardboard boxes seen from above. Each box is taped shut; tap it and its four flaps fold up and out (on twos) to show what's packed
   inside: About (with the snapshots), a section's projects as cassette tapes, and Contact. The boxes shuffle a little on the bench as
   the page scrolls. Contact sits in the bar the whole way down; Play the synth sits at the very top (turn sideways: boot.js).
   No 3D in here: three.js only loads if the phone is turned. */
import { CH, MENU } from '../core/data.js';
import { DESK } from '../content.js';
import { cardHTML, EMAIL } from '../molecules/cardhtml.js';
import { icon } from '../atoms/icons.js';
import { DOODLES } from '../atoms/sketch.js';

const $ = id => document.getElementById(id), html = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const go = el => el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
const count = (n, one) => `${n} ${n === 1 ? one : one + 's'}`;
const PHONE_ICO = '<span class="ph-ico" aria-hidden="true"></span>';

/* each snapshot's back: the Life (or About) note it stands for, found by its caption */
const BACKS = { faith: 'Faith', family: 'Family', 'on the mats': 'Jiu-Jitsu', 'game night': 'Dungeons & Dragons', 'up a mountain': 'Hiking & nature', 'the dogs': 'Dogs', sketchbook: 'Drawing', 'me, mostly': 'Indian, South African' };
const back = p => p.note || [...CH.life.items, ...CH.ab.items].find(x => x.t === BACKS[p.cap])?.d || `<p>${p.cap}</p>`;

/* ── a box, from above: a label stuck on its top edge, four flaps taped shut. The label is the button; tapping the flaps works too.
   What's inside is packed the first time it opens ── */
function box(id, name, sub, fill, open = false) {
  const b = Object.assign(document.createElement('section'), { className: 'pbox', id: 'p-' + id });
  b.innerHTML = `<h2 class="pbox-tag"><button class="lid" id="p-${id}-lid" aria-expanded="false" aria-controls="p-${id}-in"><b>${name}</b><small>${sub}</small>${icon('chevron-down', 20, 'chev')}</button></h2>
    <div class="crate"><i class="fx t"></i><i class="fx b"></i><i class="fx l"></i><i class="fx r"></i><i class="fx-tape"></i>
      <div class="pbox-in" id="p-${id}-in" role="region" aria-labelledby="p-${id}-lid" inert><div class="pbox-body"></div></div></div>`;
  const lid = b.querySelector('.lid'), inner = b.querySelector('.pbox-in'), body = b.querySelector('.pbox-body');
  b.toggle = (on = !b.classList.contains('open')) => {
    if (on && !body.firstChild) { body.innerHTML = fill(); wire(body) }
    b.classList.toggle('open', on); lid.setAttribute('aria-expanded', on); inner.inert = !on;
    b.classList.remove('jig'); void b.offsetWidth; b.classList.add('jig'); // a little jolt as the tape gives (or the flaps go back down)
  };
  lid.onclick = () => b.toggle(); b.querySelector('.crate').addEventListener('click', e => { if (!b.classList.contains('open') && !e.target.closest('.pbox-in')) b.toggle(true) });
  if (open) b.toggle(true); return b;
}

/* a project is a cassette tape: its name on the paper label, two reels in the window (the same tapes as the desktop menu's) */
const tape = (k, it, i) => `<button class="m-row tape" data-k="${k}" data-i="${i}" style="--n:${i}"><span class="lbl"><b>${it.t}</b></span><span class="win" aria-hidden="true"><i></i><i></i></span></button>`;
const tapes = (k, only) => `<div class="m-list tapes">${CH[k].items.map((it, i) => only == null || only === i ? tape(k, it, i) : '').join('')}</div>`;

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
const snaps = () => `<h3 class="p-sub">Off the clock</h3><p class="p-lead">Eight snapshots. Tap one to read the back.</p><div class="snaps">${DESK.polaroids.slice(0, 8).map((p, i) => `<button class="snap" data-n="${i}" aria-pressed="false" aria-label="${p.cap}: flip to read the back"><span class="snap-in"><span class="snap-f"></span><span class="snap-b">${back(p)}</span></span></button>`).join('')}</div>`;

/* ── the full page a project opens into ── */
let at = null;
function sheet(k, i) {
  const n = CH[k].items.length; i = (i + n) % n; const fresh = !at; at = { k, i };
  $('p-sh-ct').innerHTML = cardHTML(k, i); $('p-sh-ct').scrollTop = 0; wire($('p-sh-ct'));
  $('p-sh-kind').textContent = MENU.projects.find(p => p.key === k)?.label || CH[k].name;
  for (const b of ['p-sh-prev', 'p-sh-next']) $(b).hidden = n < 2;
  if (fresh) { $('p-sheet').hidden = false; html.classList.add('p-lock'); history.pushState({ sheet: 1 }, ''); $('p-sh-back').focus({ preventScroll: true }) }
}
function unsheet() { if (!at) return; const t = document.querySelector(`.tape[data-k="${at.k}"][data-i="${at.i}"]`); at = null; $('p-sheet').hidden = true; html.classList.remove('p-lock'); t?.focus({ preventScroll: true }) }

/* everything tappable inside a box or a page: tapes, snapshots, pictures (to the lightbox), the Copy button */
function wire(root) {
  root.querySelectorAll('.tape').forEach(t => t.onclick = () => sheet(t.dataset.k, +t.dataset.i));
  root.querySelectorAll('.snap').forEach(s => { const i = +s.dataset.n; s.querySelector('.snap-f').append(snapFront(DESK.polaroids[i], i));
    s.onclick = () => { const on = s.classList.toggle('flip'); s.setAttribute('aria-pressed', on) } });
  root.querySelectorAll('.pic').forEach(b => b.onclick = () => { const lb = $('lb'); lb.querySelector('img').src = b.dataset.src; lb.hidden = false });
  const cp = root.querySelector('#cp'); if (cp) cp.onclick = () => navigator.clipboard?.writeText(EMAIL).then(() => { cp.classList.add('done'); cp.innerHTML = icon('check', 18) + '<span>Copied</span>'; toast('Email copied') }, () => toast('Copy blocked: the address is ' + EMAIL));
}
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true }, 2600) }

/* ── the menu: the burger opens a sheet of links, one per box ── */
function menu(on) {
  const nav = $('p-nav'), btn = $('p-mnu'); nav.hidden = !on; btn.setAttribute('aria-expanded', on); btn.setAttribute('aria-label', on ? 'Close the menu' : 'Menu'); html.classList.toggle('p-lock', on);
  btn.innerHTML = icon(on ? 'close' : 'menu', 24);
  if (on) nav.querySelector('a').focus(); else btn.focus({ preventScroll: true });
}
function jump(id) { const b = $(id); if (!b) return; b.toggle?.(true); go(b) }

/* ── Play the synth: on phones that allow it, go full screen and turn the picture sideways; everywhere else, ask for the phone to be
   turned (boot.js swaps to the synth the moment it is). A locked turn needs its own way back ── */
async function play() {
  try { await html.requestFullscreen?.(); await screen.orientation.lock('landscape'); html.dataset.locked = '1' }
  catch { if (document.fullscreenElement) document.exitFullscreen?.(); $('p-turn').hidden = false; $('p-turn-ok').focus() }
}
function unplay() { screen.orientation?.unlock?.(); if (document.fullscreenElement) document.exitFullscreen?.(); delete html.dataset.locked }

/* the boxes shuffle on the bench as the page scrolls: each one nudged and turned a touch, by where it is on the screen, redrawn on twos */
function shuffle(root) {
  const boxes = [...root.querySelectorAll('.pbox')]; let last = 0, queued = false;
  const seen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target) } }), { root, threshold: .15 });
  boxes.forEach(b => seen.observe(b)); if (reduce) return;
  const draw = now => { queued = false; if (now - last < 83) return queue(); last = now; const h = root.clientHeight;
    boxes.forEach((b, i) => { const r = b.getBoundingClientRect(); if (r.bottom < -60 || r.top > h + 60) return; const k = (r.top + r.height / 2) / h - .5; // -0.5 (top) … 0.5 (bottom)
      b.style.setProperty('--sx', (Math.sin(k * 3 + i * 1.7) * 5).toFixed(1) + 'px'); b.style.setProperty('--sr', (Math.sin(k * 2.4 + i * 2.3) * 1.3 - (i % 2 ? .4 : -.4)).toFixed(2) + 'deg') }) };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(draw) } };
  root.addEventListener('scroll', queue, { passive: true }); queue();
}

export function initPocket() {
  const root = $('pocket'), intro = $('intro');
  const hero = intro?.querySelector('.in-sheet')?.cloneNode(true);
  if (hero) { hero.querySelectorAll('[id]').forEach(e => e.id = 'p-' + e.id); hero.querySelector('.in-go')?.remove(); const or = hero.querySelector('.in-or'); if (or) or.textContent = 'Scroll to continue ↓' }
  /* upright at the start: the page is the welcome, so the 3D intro is never needed (turning sideways goes straight to the synth) */
  if (html.dataset.view === 'page') intro?.remove();
  root.innerHTML = `
    <header class="p-bar"><a class="p-logo" href="#p-top" aria-label="Vickhal Roopram: back to the top"><img src="assets/ui/logo-on-dark.svg" width="290" height="101" alt=""></a>
      <a class="cta sm hdr-cta p-cta" href="#p-hello">${icon('mail', 18)}<span>Contact</span></a>
      <button class="ico p-mnu" id="p-mnu" aria-expanded="false" aria-controls="p-nav" aria-label="Menu">${icon('menu', 24)}</button></header>
    <nav class="p-nav" id="p-nav" aria-label="Sections" hidden><ul>
      <li><a href="#p-play">Play the synth</a></li><li><a href="#p-about">About</a></li>
      <li class="p-grp"><span>Projects</span><ul>${MENU.projects.map(p => `<li><a href="#p-${p.key}">${p.label}</a></li>`).join('')}</ul></li>
      <li><a href="#p-hello">Contact</a></li></ul></nav>
    <main class="p-main" id="p-top">
      <button class="p-play" id="p-play">${PHONE_ICO}<span><b>Play the synth</b><small>Turn your phone sideways and jam</small></span>${icon('chevron-right', 22)}</button>
      <section class="p-hero" aria-labelledby="p-in-h"></section><div class="p-boxes" id="p-boxes"></div>
      <footer class="p-foot"><p class="quote">Research like a nerd. Play like a kid. Use the box.</p><p>Made of cardboard, tape and a lot of homework. © Vickhal Roopram</p></footer></main>
    <div class="p-turn" id="p-turn" role="dialog" aria-modal="true" aria-labelledby="p-turn-h" hidden><div class="p-turn-card">${PHONE_ICO}<h2 id="p-turn-h">Turn your phone sideways</h2><p>The synth only fits on its side. Turn back upright for the portfolio.</p><button class="pill" id="p-turn-ok">Got it</button></div></div>
    <button class="pill p-unplay" id="p-unplay">${icon('chevron-left', 18)}<span>Back</span></button>
    <div class="p-sheet" id="p-sheet" role="dialog" aria-modal="true" aria-labelledby="p-sh-kind" hidden>
      <header class="p-sh-top"><button class="pill" id="p-sh-back">${icon('chevron-left', 18)}<span>Back</span></button><b id="p-sh-kind"></b></header>
      <div class="content" id="p-sh-ct"></div>
      <footer class="p-sh-foot"><button class="pill" id="p-sh-prev">${icon('chevron-left', 18)}<span>Previous</span></button><button class="pill" id="p-sh-next"><span>Next</span>${icon('chevron-right', 18)}</button></footer></div>`;
  if (hero) root.querySelector('.p-hero').append(hero);
  document.body.append($('p-unplay')); // shown over the synth (outside the page), only while a Play has locked the screen sideways
  const n = k => count(CH[k].items.length, k === 'tl' ? 'tool' : 'project');
  $('p-boxes').append(
    box('about', 'About', 'Who’s behind the cardboard, with snapshots', () => `<div class="content">${cardHTML('ab', 0)}${snaps()}</div>`),
    Object.assign(document.createElement('h2'), { className: 'p-h', textContent: 'Projects' }),
    ...MENU.projects.filter(p => CH[p.key]?.items.length).map(p => box(p.key, p.label, n(p.key) + ' on tape', () => tapes(p.key))),
    box('hello', 'Contact', 'A job, a project or a long chat', () => `<div class="content">${cardHTML('cv', 1)}</div>${tapes('cv', 0)}`, true));
  /* bar, menu, page and the phone's back button */
  $('p-mnu').onclick = () => menu($('p-nav').hidden);
  $('p-nav').onclick = e => { const a = e.target.closest('a'); if (!a) return; e.preventDefault(); menu(false); a.hash === '#p-play' ? play() : jump(a.hash.slice(1)) };
  root.querySelector('.p-logo').onclick = e => { e.preventDefault(); go($('p-top')) };
  root.querySelector('.p-cta').onclick = e => { e.preventDefault(); jump('p-hello') };
  $('p-play').onclick = play; $('p-turn-ok').onclick = () => { $('p-turn').hidden = true; $('p-play').focus() }; $('p-unplay').onclick = unplay;
  matchMedia('(orientation: landscape)').addEventListener('change', e => { if (e.matches) $('p-turn').hidden = true });
  addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (!$('lb').hidden) $('lb').hidden = true; else if (!$('p-turn').hidden) $('p-turn').hidden = true; else if (at) history.back(); else if (!$('p-nav').hidden) menu(false) });
  $('p-sh-back').onclick = () => history.back(); addEventListener('popstate', unsheet);
  $('p-sh-prev').onclick = () => sheet(at.k, at.i - 1); $('p-sh-next').onclick = () => sheet(at.k, at.i + 1);
  $('lb').onclick = () => { $('lb').hidden = true };
  shuffle(root);
}
