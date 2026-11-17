/* The phone page, held upright: Vick's office. One wall you look at, not a page you scroll (after juliamoresco.com.br): the synth sits
   on a shelf with the plant, eight snapshots hang on a string, and the menu is a stack of cardboard boxes on the floor. Tap anything
   and see what happens: boxes fly forward and open into a panel (About, a section's projects as cassettes, Contact), the plant lives
   its life, the lamp changes the light, the synth asks to be turned sideways (boot.js) and played. A counter keeps score of what's been
   found, Hints (the cardboard question mark) marks what hasn't. Contact sits in the bar the whole time; the burger is the quick way.
   No 3D in here: three.js only loads if the phone is turned. Motion is on twos like the rest of the site (skin.css steps). */
import { CH, MENU } from '../core/data.js';
import { DESK } from '../content.js';
import { cardHTML, EMAIL } from '../molecules/cardhtml.js';
import { icon } from '../atoms/icons.js';
import { DOODLES } from '../atoms/sketch.js';

const $ = id => document.getElementById(id), html = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const W = 390, H = 670, LIFT = 30; // the wall, in its own units (drawn 700 tall, its top 30 left empty); scaled to fit the screen (fit())
const PHONE_ICO = '<span class="ph-ico" aria-hidden="true"></span>';
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} } };

/* each snapshot's back: the Life (or About) note it stands for, found by its caption */
const BACKS = { faith: 'Faith', family: 'Family', 'on the mats': 'Jiu-Jitsu', 'game night': 'Dungeons & Dragons', 'up a mountain': 'Hiking & nature', 'the dogs': 'Dogs', sketchbook: 'Drawing', 'me, mostly': 'Indian, South African' };
const back = p => p.note || [...(CH.life?.items || []), ...(CH.ab?.items || [])].find(x => x.t === BACKS[p.cap])?.d || `<p>${p.cap}</p>`;

/* ── the boxes: what's in them, and where each one sits in the stack (x, y, width, height on the wall). Row one is on the floor,
   row two on row one's lids, About on top. Drawn back to front so the ones on top overlap the ones under them ── */
const SLOT = { gd: [16, 568, 128, 122], ux: [148, 568, 126, 122], mo: [278, 572, 96, 118], hello: [20, 492, 80, 82], tl: [104, 474, 138, 100], xp: [246, 478, 124, 96], about: [112, 382, 158, 98] };
const MARK = { tl: 'HEAVY', xp: 'FRAGILE: IDEAS', gd: '↑↑', ux: 'THIS WAY UP', mo: '↑↑', hello: '', about: '' };
const tape = (k, it, i) => `<button class="m-row tape" data-k="${k}" data-i="${i}" style="--n:${i}"><span class="lbl"><b>${it.t}</b></span><span class="win" aria-hidden="true"><i></i><i></i></span></button>`;
const tapes = (k, only) => `<div class="m-list tapes">${CH[k].items.map((it, i) => only == null || only === i ? tape(k, it, i) : '').join('')}</div>`;
const count = (n, one) => `${n} ${n === 1 ? one : one + 's'}`;
function boxes() {
  const n = k => count(CH[k].items.length, k === 'tl' ? 'tool' : 'project') + ' on tape';
  return [
    { id: 'about', name: 'About', sub: 'Who’s behind the cardboard', peek: 'snap', fill: () => `<div class="content">${cardHTML('ab', 0)}</div>` },
    ...MENU.projects.filter(p => CH[p.key]?.items.length && SLOT[p.key]).map(p => ({ id: p.key, name: p.label, sub: n(p.key), peek: 'tapes', fill: () => tapes(p.key) })),
    { id: 'hello', name: 'Contact', sub: 'A job, a project or a long chat', peek: 'mail', fill: () => `<div class="content">${cardHTML('cv', 1)}</div>${tapes('cv', 0)}` },
  ];
}

/* a closed box, seen from the front and a little above: front, lid and side, the lid taped down its seam. d is the side's depth,
   t the lid's. Ink outline, kraft card, a corrugated side, and a hand-written mark or two */
const D = 9, T = 12;
function boxSVG(w, h, mark) {
  const f = w - D, s = (f / 2) | 0;
  return `<svg class="ob-svg" viewBox="-2 -2 ${w + 4} ${h + 4}" width="${w + 4}" height="${h + 4}" aria-hidden="true">
    <rect x="0" y="${T}" width="${f}" height="${h - T}" fill="url(#p-kraft)"/>
    <polygon points="${f},${T} ${w},0 ${w},${h - T} ${f},${h}" fill="url(#p-corr)"/><polygon points="${f},${T} ${w},0 ${w},${h - T} ${f},${h}" fill="rgba(42,27,18,.32)"/>
    <polygon points="0,${T} ${D},0 ${w},0 ${f},${T}" fill="url(#p-kraft)"/><polygon points="0,${T} ${D},0 ${w},0 ${f},${T}" fill="rgba(255,240,210,.22)"/>
    <polygon class="ob-tape" points="${s - 8},${T} ${s - 8 + D},0 ${s + 8 + D},0 ${s + 8},${T} ${s + 8},${T + 15} ${s - 8},${T + 13}"/>
    <path class="ob-ink" d="M0 ${T}H${f}V${h}H0Z M${f} ${T}L${w} 0V${h - T}L${f} ${h} M0 ${T}L${D} 0H${w} M${s + D / 2} ${T / 2 + .5}" />
    <path class="ob-seam" d="M${s} ${T}L${s + D} 0"/>
    ${mark ? `<text class="ob-mark" x="${f - 7}" y="${h - 8}" text-anchor="end">${mark}</text>` : ''}
  </svg>`;
}
/* the same box, open: four flaps stood up and out, something peeking over the rim. Each flap unfolds from its hinge (pocket.css) */
function openSVG(peek) {
  const w = 220, h = 140, d = 16, t = 20, f = w - d;
  const pk = peek === 'tapes' ? `<g class="pk"><rect x="52" y="-26" width="58" height="38" rx="4" transform="rotate(-12 81 -7)"/><rect x="104" y="-30" width="58" height="38" rx="4" transform="rotate(9 133 -11)"/><circle cx="72" cy="-6" r="5"/><circle cx="91" cy="-10" r="5"/><circle cx="124" cy="-12" r="5"/><circle cx="143" cy="-9" r="5"/></g>`
    : peek === 'snap' ? `<g class="pk"><rect x="78" y="-46" width="54" height="62" transform="rotate(-8 105 -15)" fill="#fffdf6"/><rect x="85" y="-40" width="40" height="38" transform="rotate(-8 105 -15)" fill="#cfd8c4"/><rect x="118" y="-34" width="54" height="62" transform="rotate(10 145 -3)" fill="#fffdf6"/><rect x="125" y="-28" width="40" height="38" transform="rotate(10 145 -3)" fill="#d8c7c0"/></g>`
    : `<g class="pk"><rect x="66" y="-34" width="96" height="58" transform="rotate(-6 114 -5)" fill="#fffdf6"/><path d="M66 -34L114 2L162 -34" transform="rotate(-6 114 -5)" fill="none"/></g>`;
  return `<svg class="o-box" viewBox="-60 -70 ${w + 120} ${h + 80}" aria-hidden="true">
    <polygon points="0,${t} ${d},0 ${w},0 ${f},${t}" fill="#1c110b"/>
    <g class="fl fl-b"><polygon points="${d},0 ${w},0 ${w - 10},-52 ${d + 10},-52" fill="url(#p-kraft)"/><polygon points="${d},0 ${w},0 ${w - 10},-52 ${d + 10},-52" fill="rgba(42,27,18,.18)"/><path class="ob-ink" d="M${d} 0L${d + 10} -52H${w - 10}L${w} 0"/></g>
    ${pk}
    <g class="fl fl-l"><polygon points="0,${t} ${d},0 -38,-22 -54,${t - 4}" fill="url(#p-kraft)"/><path class="ob-ink" d="M0 ${t}L-54 ${t - 4}L-38 -22L${d} 0"/></g>
    <g class="fl fl-r"><polygon points="${f},${t} ${w},0 ${w + 46},-14 ${w + 34},${t + 6}" fill="url(#p-kraft)"/><polygon points="${f},${t} ${w},0 ${w + 46},-14 ${w + 34},${t + 6}" fill="rgba(42,27,18,.25)"/><path class="ob-ink" d="M${f} ${t}L${w + 34} ${t + 6}L${w + 46} -14L${w} 0"/></g>
    <rect x="0" y="${t}" width="${f}" height="${h - t}" fill="url(#p-kraft)"/>
    <polygon points="${f},${t} ${w},0 ${w},${h - t} ${f},${h}" fill="url(#p-corr)"/><polygon points="${f},${t} ${w},0 ${w},${h - t} ${f},${h}" fill="rgba(42,27,18,.32)"/>
    <path class="ob-ink" d="M0 ${t}H${f}V${h}H0Z M${f} ${t}L${w} 0V${h - t}L${f} ${h}"/>
    <g class="fl fl-f"><polygon points="0,${t} ${f},${t} ${f - 6},${t + 30} 6,${t + 30}" fill="url(#p-kraft)"/><polygon points="0,${t} ${f},${t} ${f - 6},${t + 30} 6,${t + 30}" fill="rgba(255,240,210,.2)"/><path class="ob-ink" d="M0 ${t}L6 ${t + 30}H${f - 6}L${f} ${t}"/></g>
  </svg>`;
}

/* ── the shelf: the synth (a cardboard copy of the desktop one: wood frame, screen, four knobs, the five section tags, keys and pads),
   the plant, and the tag that says Play ── */
function synthHTML() {
  const keys = Array.from({ length: 15 }, () => '<i></i>').join(''), blk = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12].map(n => `<b style="--k:${n}"></b>`).join('');
  return `<span class="syn-top"><span class="syn-scr"><svg viewBox="0 0 40 20" aria-hidden="true"><path d="M2 12 L8 6 L13 14 L19 5 L25 13 L31 8 L38 11"/></svg><i class="led"></i></span>
    ${'<span class="knob"></span>'.repeat(4)}<span class="grille"></span></span>
    <span class="syn-tags">${'<i></i>'.repeat(5)}</span>
    <span class="syn-low"><span class="keys">${keys}${blk}</span><span class="pads">${'<i></i>'.repeat(9)}</span></span>`;
}
const PLANT = `<svg viewBox="0 0 74 110" aria-hidden="true">
  <g class="pl-full"><path class="lf" d="M37 70 L10 22 L30 50Z"/><path class="lf b" d="M37 70 L22 6 L38 46Z"/><path class="lf" d="M37 70 L50 2 L44 48Z"/><path class="lf b" d="M37 70 L68 18 L46 52Z"/><path class="lf" d="M37 70 L72 46 L48 60Z"/><path class="lf b" d="M37 70 L2 48 L26 60Z"/></g>
  <g class="pl-dead"><path class="lf d" d="M36 68 Q18 52 4 70 Q10 84 14 92 Q16 74 34 70Z"/><path class="lf d" d="M38 68 Q58 50 70 66 Q66 80 62 90 Q60 72 40 70Z"/><path class="lf d" d="M37 68 Q34 40 20 34 Q26 50 30 52 Q34 58 36 68Z"/></g>
  <g class="pl-sprout"><path class="stem" d="M37 70 Q37 56 40 48"/><path class="lf" d="M40 48 Q52 34 60 40 Q50 50 40 48Z"/><path class="lf b" d="M39 54 Q26 44 20 50 Q28 58 39 54Z"/></g>
  <path class="pot" d="M14 68 H60 L55 108 H19Z"/><path class="pot-rim" d="M10 64 H64 V74 H10Z"/></svg>`;
const LAMP = `<svg viewBox="0 0 66 80" aria-hidden="true"><path class="lp-stand" d="M33 52 V72 M18 76 H48"/><path class="lp-base" d="M16 72 H50 L52 79 H14Z"/>
  <circle class="lp-glow" cx="33" cy="30" r="30"/><circle class="lp-shade" cx="33" cy="30" r="23"/><path class="lp-crease" d="M16 24 Q26 30 22 42 M38 9 Q34 22 44 30 M47 40 Q40 44 34 52"/></svg>`;

/* a snapshot's front: the polaroid (photo, or its doodle until the photo arrives) drawn on a canvas */
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

/* ── what's been found: every box, every snapshot, the synth, the plant and the lamp. Kept between visits on this phone ── */
let FINDS = [], found = new Set(store.get('vdc-office-found', []));
function find(id) {
  if (found.has(id) || !FINDS.includes(id)) return; found.add(id); store.set('vdc-office-found', [...found]);
  $('o-count').textContent = `${found.size} of ${FINDS.length} found`; $('o-count').classList.remove('bump'); void $('o-count').offsetWidth; $('o-count').classList.add('bump');
  document.querySelector(`[data-find="${id}"]`)?.classList.add('got');
  if (found.size === FINDS.length) setTimeout(() => toast(`All ${FINDS.length} found. Thorough. Let’s talk: Contact’s up top.`), 700);
}

/* ── the panel a box (or a snapshot) opens into: the room dims, the thing flies forward, its flaps open and what's inside is unpacked
   on a sheet of paper under it. Next takes you to the next box along ── */
let pan = null, BOX = [];
function fly(from, to) { // from where the tapped thing sits on the wall to where it lands in the panel, drawn on twos
  if (reduce || !from) return; const a = from.getBoundingClientRect(), b = to.getBoundingClientRect(); if (!b.width) return;
  to.style.transition = 'none'; to.style.transform = `translate(${a.left + a.width / 2 - b.left - b.width / 2}px,${a.top + a.height / 2 - b.top - b.height / 2}px) scale(${Math.max(.2, a.width / b.width)})`;
  void to.offsetWidth; to.style.transition = ''; to.style.transform = '';
}
function openPanel({ kind, key, title, sub, hero, body, next, from }) {
  const fresh = !pan; pan = { kind, key, from };
  const p = $('o-pan'); p.dataset.kind = kind;
  $('o-hero').innerHTML = hero; $('o-pan-h').textContent = title; $('o-pan-sub').textContent = sub;
  const b = $('o-body'); b.innerHTML = body; b.scrollTop = 0; wire(b);
  $('o-next').hidden = !next; if (next) { $('o-next').querySelector('span').textContent = next.label; $('o-next').onclick = next.go }
  p.hidden = false; html.classList.add('p-lock'); p.classList.remove('in'); void p.offsetWidth; p.classList.add('in');
  fly(from, $('o-hero').firstElementChild);
  if (fresh) { history.pushState({ pan: 1 }, ''); $('o-x').focus({ preventScroll: true }) }
}
function closePanel() { if (!pan) return; const f = pan.from; pan = null; $('o-pan').hidden = true; html.classList.remove('p-lock'); f?.focus({ preventScroll: true }) }
function openBox(id, from) {
  const i = BOX.findIndex(b => b.id === id); if (i < 0) return; const bx = BOX[i], nx = BOX[(i + 1) % BOX.length];
  from ||= document.querySelector(`.ob[data-box="${id}"]`); find('box:' + id);
  from?.classList.add('opened');
  openPanel({ kind: 'box', key: id, title: bx.name, sub: bx.sub, hero: openSVG(bx.peek), body: bx.fill(), from, next: { label: `Next box: ${nx.name}`, go: () => openBox(nx.id) } });
}
function openSnap(n, from) {
  const ps = DESK.polaroids.slice(0, 8), p = ps[n], m = (n + 1) % ps.length; from ||= document.querySelector(`.o-snap[data-n="${n}"]`); find('snap:' + n);
  openPanel({ kind: 'snap', key: n, title: p.cap || 'Snapshot', sub: 'Tap the photo to read the back', from,
    hero: `<button class="snap big" aria-pressed="false" aria-label="${p.cap}: flip to read the back"><span class="snap-in"><span class="snap-f"></span><span class="snap-b">${back(p)}</span></span></button>`,
    body: '', next: { label: 'Next snapshot', go: () => openSnap(m) } });
  const s = $('o-hero').querySelector('.snap'); s.querySelector('.snap-f').append(snapFront(p, n));
  s.onclick = () => { const on = s.classList.toggle('flip'); s.setAttribute('aria-pressed', on) };
}

/* ── the full page a project opens into (over the panel) ── */
let at = null;
function sheet(k, i) {
  const n = CH[k].items.length; i = (i + n) % n; const fresh = !at; at = { k, i };
  $('p-sh-ct').innerHTML = cardHTML(k, i); $('p-sh-ct').scrollTop = 0; wire($('p-sh-ct'));
  $('p-sh-kind').textContent = MENU.projects.find(p => p.key === k)?.label || CH[k].name;
  for (const b of ['p-sh-prev', 'p-sh-next']) $(b).hidden = n < 2;
  if (fresh) { $('p-sheet').hidden = false; history.pushState({ sheet: 1 }, ''); $('p-sh-back').focus({ preventScroll: true }) }
}
function unsheet() { if (!at) return; const t = document.querySelector(`.tape[data-k="${at.k}"][data-i="${at.i}"]`); at = null; $('p-sheet').hidden = true; t?.focus({ preventScroll: true }) }

/* everything tappable inside a panel or a page: tapes, pictures (to the lightbox), the Copy button */
function wire(root) {
  root.querySelectorAll('.tape').forEach(t => t.onclick = () => sheet(t.dataset.k, +t.dataset.i));
  root.querySelectorAll('.pic').forEach(b => b.onclick = () => { const lb = $('lb'); lb.querySelector('img').src = b.dataset.src; lb.hidden = false });
  const cp = root.querySelector('#cp'); if (cp) cp.onclick = () => navigator.clipboard?.writeText(EMAIL).then(() => { cp.classList.add('done'); cp.innerHTML = icon('check', 18) + '<span>Copied</span>'; toast('Email copied') }, () => toast('Copy blocked: the address is ' + EMAIL));
}
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true }, 2800) }

/* ── the menu: the burger opens a sheet of links, one per box ── */
function menu(on) {
  const nav = $('p-nav'), btn = $('p-mnu'); nav.hidden = !on; btn.setAttribute('aria-expanded', on); btn.setAttribute('aria-label', on ? 'Close the menu' : 'Menu');
  btn.innerHTML = icon(on ? 'close' : 'menu', 24); html.classList.toggle('p-navon', on);
  if (on) nav.querySelector('a').focus(); else btn.focus({ preventScroll: true });
}

/* ── Play the synth: on phones that allow it, go full screen and turn the picture sideways; everywhere else, ask for the phone to be
   turned (boot.js swaps to the synth the moment it is). A locked turn needs its own way back ── */
async function play() {
  find('synth');
  try { await html.requestFullscreen?.(); await screen.orientation.lock('landscape'); html.dataset.locked = '1' }
  catch { if (document.fullscreenElement) document.exitFullscreen?.(); $('p-turn').hidden = false; $('p-turn-ok').focus() }
}
function unplay() { screen.orientation?.unlock?.(); if (document.fullscreenElement) document.exitFullscreen?.(); delete html.dataset.locked }

/* the plant's life (as on the desk): full → it dies → a sprout → full again. The lamp: on or off */
const LIFE = ['full', 'dead', 'sprout'], LIFE_SAY = { dead: 'Oops. Too much feedback.', sprout: 'A sprout. It’s iterating.', full: 'Fully grown. Shipped.' };
function water(b) { const n = LIFE[(LIFE.indexOf(b.dataset.life) + 1) % 3]; b.dataset.life = n; b.setAttribute('aria-label', `The plant (${n === 'dead' ? 'wilted' : n}): tap to keep it going`); toast(LIFE_SAY[n]); find('plant') }
function light(b) { const on = html.dataset.dark !== undefined; on ? delete html.dataset.dark : (html.dataset.dark = ''); b.setAttribute('aria-pressed', on); toast(on ? 'Lights on. Back to work.' : 'Lights off. Very moody. Very Behance.'); find('lamp') }

/* Hints: a red dot on everything not found yet, for a few seconds */
function hints() {
  const st = $('o-stage'); st.classList.remove('hinting'); void st.offsetWidth; st.classList.add('hinting'); clearTimeout(hints.h); hints.h = setTimeout(() => st.classList.remove('hinting'), 5200);
  const left = FINDS.length - found.size; toast(left ? `Red dots: ${left} thing${left === 1 ? '' : 's'} you haven’t found yet.` : 'Nothing left to find. Show-off.');
}

/* the wall is drawn at 390 × 700 and scaled to whatever room the screen has between the bar and the line at the bottom */
function fit() {
  const top = $('p-bar').getBoundingClientRect().bottom, foot = $('o-foot').getBoundingClientRect().height, room = innerHeight - top - foot;
  const k = Math.min(innerWidth / W, room / H), r = $('pocket').style;
  r.setProperty('--k', k.toFixed(4)); r.setProperty('--top', `${top + Math.max(0, (room - H * k) / 2) - LIFT * k}px`);
}

/* every few seconds one thing not found yet gives a little hop, to say it can be tapped */
function nudge() {
  if (reduce) return; setInterval(() => {
    if (pan || at || document.hidden || !$('o-hello')?.hidden && $('o-hello')) return;
    const left = [...document.querySelectorAll('#o-stage [data-find]:not(.got)')]; const el = left[(Math.random() * left.length) | 0] || document.querySelector('#o-stage .ob');
    el?.classList.remove('hop'); void el?.offsetWidth; el?.classList.add('hop');
  }, 3600);
}

export function initPocket() {
  const root = $('pocket'), intro = $('intro');
  const hero = intro?.querySelector('.in-sheet')?.cloneNode(true);
  if (hero) { hero.querySelectorAll('[id]').forEach(e => e.id = 'p-' + e.id); hero.querySelector('.in-go')?.remove(); hero.querySelector('.in-or')?.remove() }
  if (html.dataset.view === 'page') intro?.remove(); // upright at the start: the office says hello itself (turning sideways goes straight to the synth)
  BOX = boxes();
  const snaps = DESK.polaroids.slice(0, 8);
  FINDS = ['synth', 'plant', 'lamp', ...snaps.map((_, i) => 'snap:' + i), ...BOX.map(b => 'box:' + b.id)];
  found = new Set([...found].filter(f => FINDS.includes(f)));
  const q = document.querySelector('#help svg')?.cloneNode(true);
  if (q) { q.querySelectorAll('[id]').forEach(e => e.id = 'p-' + e.id); q.querySelectorAll('[class]').forEach(e => e.setAttribute('class', e.getAttribute('class').replace(/\bq-(\w+)/g, 'q-$1 p-q-$1'))) }
  /* the string the snapshots hang from sags in the middle; each one is pegged where the string is */
  const sag = x => 214 + 22 * (1 - ((x - 195) / 181) ** 2);
  const snapAt = i => { const x = 18 + i * 44.6; return [x, sag(x + 21) - 4] };
  const boxHTML = b => { const [x, y, w, h] = SLOT[b.id]; return `<button class="ob" data-box="${b.id}" data-find="box:${b.id}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;--d:${D}px;--t:${T}px" aria-label="${b.name} box: ${b.sub}. Open it">
    ${boxSVG(w, h, MARK[b.id])}<span class="ob-lab"><span class="ob-tag"><b>${b.name}</b><small>${b.sub}</small></span></span><i class="o-dot"></i></button>` };
  const order = ['gd', 'ux', 'mo', 'hello', 'tl', 'xp', 'about'];

  root.innerHTML = `
    <svg class="o-defs" width="0" height="0" aria-hidden="true"><defs>
      <pattern id="p-kraft" patternUnits="userSpaceOnUse" width="160" height="160"><image href="assets/tex/kraft.jpg" width="160" height="160"/></pattern>
      <pattern id="p-corr" patternUnits="userSpaceOnUse" width="120" height="120"><image href="assets/tex/corrugated.jpg" width="120" height="120"/></pattern></defs></svg>
    <header class="p-bar" id="p-bar"><div class="o-id"><img src="assets/ui/logo-on-dark.svg" width="290" height="101" alt="Vickhal Roopram"><span class="o-count" id="o-count" aria-live="polite">${found.size} of ${FINDS.length} found</span></div>
      <a class="cta sm hdr-cta p-cta" href="#">${icon('mail', 18)}<span>Contact</span></a>
      <button class="ico p-mnu" id="p-mnu" aria-expanded="false" aria-controls="p-nav" aria-label="Menu">${icon('menu', 24)}</button></header>
    <nav class="p-nav" id="p-nav" aria-label="Sections" hidden><ul>
      <li><a href="#play">Play the synth</a></li><li><a href="#about">About</a></li>
      <li class="p-grp"><span>Projects</span><ul>${BOX.filter(b => SLOT[b.id] && !['about', 'hello'].includes(b.id)).map(b => `<li><a href="#${b.id}">${b.name}</a></li>`).join('')}</ul></li>
      <li><a href="#hello">Contact</a></li></ul></nav>
    <main class="o-room" id="o-room" aria-label="Vick’s office: tap things to explore">
      <div class="o-wall" aria-hidden="true"></div><div class="o-floor" aria-hidden="true"></div><div class="o-glow" aria-hidden="true"></div>
      <div class="o-stage" id="o-stage">
        <svg class="o-lines" viewBox="0 0 390 700" aria-hidden="true">
          <path class="o-cable" d="M30 132 C2 136 4 168 10 200 C16 260 2 330 8 420 C12 470 4 510 22 540"/><path class="o-cable c2" d="M30 132 C2 136 4 168 10 200 C16 260 2 330 8 420 C12 470 4 510 22 540"/><path class="o-cable c3" d="M30 132 C2 136 4 168 10 200 C16 260 2 330 8 420 C12 470 4 510 22 540"/>
          <path class="o-string" d="M14 214 Q195 258 376 214"/><circle class="o-nail" cx="14" cy="214" r="3"/><circle class="o-nail" cx="376" cy="214" r="3"/>
          <path class="o-tagstr" d="M152 166 L170 190 M188 166 L170 190"/>
        </svg>
        <div class="o-shelf" aria-hidden="true"><i class="br l"></i><i class="br r"></i></div>
        <button class="o-syn" data-find="synth" aria-label="The synth: play it (turn your phone sideways)">${synthHTML()}<i class="o-dot"></i></button>
        <button class="o-play" aria-label="Play the synth">${PHONE_ICO}<b>Play me</b></button>
        <button class="o-plant" data-find="plant" data-life="full" aria-label="The plant: tap to keep it going">${PLANT}<i class="o-dot"></i></button>
        ${snaps.map((p, i) => { const [x, y] = snapAt(i); return `<button class="o-snap" data-n="${i}" data-find="snap:${i}" style="left:${x}px;top:${y}px;--r:${[-5, 4, -2, 6, -4, 3, -6, 2][i]}deg" aria-label="Snapshot: ${p.cap}"><span class="o-peg"></span><span class="o-pol"></span><i class="o-dot"></i></button>` }).join('')}
        <p class="o-note" aria-hidden="true">Research like a nerd.<br>Play like a kid.<br><b>Use the box.</b></p>
        ${order.map(id => BOX.find(b => b.id === id)).filter(Boolean).map(boxHTML).join('')}
        <button class="o-lamp" data-find="lamp" aria-pressed="true" aria-label="The lamp: switch the light">${LAMP}<i class="o-dot"></i></button>
      </div>
    </main>
    <footer class="o-foot" id="o-foot"><button class="o-hint" id="o-hint" aria-label="Hints: show what you haven’t found yet"></button><p>Poke around. Things open.<br>The menu’s quicker, but less fun.</p></footer>
    <div class="o-pan" id="o-pan" role="dialog" aria-modal="true" aria-labelledby="o-pan-h" hidden>
      <button class="o-x" id="o-x" aria-label="Close">${icon('close', 22)}</button>
      <div class="o-hero" id="o-hero"></div>
      <div class="o-head"><h2 id="o-pan-h"></h2><p id="o-pan-sub"></p></div>
      <div class="o-body" id="o-body"></div>
      <footer class="o-pan-foot"><button class="pill" id="o-next"><span></span>${icon('chevron-right', 18)}</button></footer></div>
    <div class="o-hello" id="o-hello" role="dialog" aria-modal="true" aria-label="Welcome" tabindex="-1"><div class="o-hello-in"></div><button class="o-in" id="o-in">Tap anywhere to come in</button></div>
    <div class="p-turn" id="p-turn" role="dialog" aria-modal="true" aria-labelledby="p-turn-h" hidden><div class="p-turn-card">${PHONE_ICO}<h2 id="p-turn-h">Turn your phone sideways</h2><p>The synth only fits on its side. Turn back upright for the office.</p><button class="pill" id="p-turn-ok">Got it</button></div></div>
    <button class="pill p-unplay" id="p-unplay">${icon('chevron-left', 18)}<span>Back</span></button>
    <div class="p-sheet" id="p-sheet" role="dialog" aria-modal="true" aria-labelledby="p-sh-kind" hidden>
      <header class="p-sh-top"><button class="pill" id="p-sh-back">${icon('chevron-left', 18)}<span>Back</span></button><b id="p-sh-kind"></b></header>
      <div class="content" id="p-sh-ct"></div>
      <footer class="p-sh-foot"><button class="pill" id="p-sh-prev">${icon('chevron-left', 18)}<span>Previous</span></button><button class="pill" id="p-sh-next"><span>Next</span>${icon('chevron-right', 18)}</button></footer></div>`;
  if (hero) root.querySelector('.o-hello-in').append(hero); else $('o-hello').remove();
  if (q) $('o-hint').append(q); else $('o-hint').textContent = '?';
  document.body.append($('p-unplay')); // shown over the synth (outside the page), only while a Play has locked the screen sideways
  found.forEach(f => document.querySelector(`[data-find="${f}"]`)?.classList.add('got'));
  root.querySelectorAll('.o-snap').forEach(s => { const i = +s.dataset.n; s.querySelector('.o-pol').append(snapFront(snaps[i], i)); s.onclick = () => openSnap(i, s) });
  root.querySelectorAll('.ob').forEach(b => b.onclick = () => openBox(b.dataset.box, b));

  /* the welcome: the drawn sheet pinned over the office; any tap (or a swipe, or a key) and it drops away */
  const hello = $('o-hello');
  if (hello) { const go = () => { if (hello.classList.contains('out')) return; hello.classList.add('out'); setTimeout(() => { hello.hidden = true; $('o-room').focus?.() }, reduce ? 0 : 420) };
    hello.onclick = go; hello.addEventListener('touchmove', go, { passive: true }); hello.addEventListener('keydown', e => { if (e.key !== 'Tab') go() }); hello.focus({ preventScroll: true }) }

  /* the shelf and the room */
  const syn = root.querySelector('.o-syn');
  const playIt = () => { syn.classList.remove('tap'); void syn.offsetWidth; syn.classList.add('tap'); setTimeout(play, reduce ? 0 : 380) };
  syn.onclick = playIt; root.querySelector('.o-play').onclick = playIt;
  root.querySelector('.o-plant').onclick = e => water(e.currentTarget);
  root.querySelector('.o-lamp').onclick = e => light(e.currentTarget);
  $('o-hint').onclick = hints;

  /* bar, menu, panel, pages and the phone's back button */
  $('p-mnu').onclick = () => menu($('p-nav').hidden);
  $('p-nav').onclick = e => { const a = e.target.closest('a'); if (!a) return; e.preventDefault(); menu(false); const id = a.hash.slice(1); id === 'play' ? playIt() : openBox(id) };
  root.querySelector('.p-cta').onclick = e => { e.preventDefault(); if (!$('p-nav').hidden) menu(false); openBox('hello') };
  $('o-x').onclick = () => history.back();
  $('o-pan').addEventListener('click', e => { if (e.target === e.currentTarget) history.back() });
  $('p-turn-ok').onclick = () => { $('p-turn').hidden = true; syn.focus() }; $('p-unplay').onclick = unplay;
  matchMedia('(orientation: landscape)').addEventListener('change', e => { if (e.matches) $('p-turn').hidden = true });
  addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (!$('lb').hidden) $('lb').hidden = true; else if (!$('p-turn').hidden) $('p-turn').hidden = true; else if (at || pan) history.back(); else if (!$('p-nav').hidden) menu(false) });
  $('p-sh-back').onclick = () => history.back(); addEventListener('popstate', () => { if (at) unsheet(); else closePanel() });
  $('p-sh-prev').onclick = () => sheet(at.k, at.i - 1); $('p-sh-next').onclick = () => sheet(at.k, at.i + 1);
  $('lb').onclick = () => { $('lb').hidden = true };
  fit(); addEventListener('resize', fit); document.fonts?.ready.then(fit); nudge();
}
