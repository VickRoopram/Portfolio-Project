/* The tour. A cardboard question mark sits bottom left (#help, index.html). Click it and Beep pops out: a small wooden TV that floats,
   with eyes and a mouth on his screen. He explains the site one thing at a time, in a cardboard speech bubble that comes from his mouth:
   a heading of three words at most and one or two lines under it. Arrows step on and back; "Skip tour" sits bottom middle.
     · he beeps before each thing he says (core/audio.js beep), and his mouth moves while the line is written out
     · his eyes follow the pointer; when it rests they go back to the thing he's talking about, which gets a felt-tip ring round it
     · like everything else he's animated on twos: one tick here is one drawing (12 a second)
   He never blocks the page: you can try what he's describing while he's up. Esc or the question mark sends him away. */
import { $, S, V, act, desktop, reduceMotion } from '../core/state.js';
import { ensureAudio, beep, foley } from '../core/audio.js';
import { icon } from '../atoms/icons.js';

const touch = matchMedia('(hover: none)').matches, click = touch ? 'Tap' : 'Click';
/* what he says. h: three words at most · p: one or two lines · at: an element's id, or a thing on the bench (main.js spot) · wide: only where the whole bench is in view */
const STEPS = [
  { h: 'Hi, I’m Beep!', p: 'I live on Vick’s desk. Let me show you round his portfolio.', mood: 'happy' },
  { h: 'Play the synth', p: `${click} the synth to fly in. Every key opens one of Vick’s projects.`, at: 'synth' },
  { h: 'Around the desk', p: `Polaroids and notes show the person behind the work. ${click} one!`, at: 'desk', wide: true },
  { h: 'Look around', p: 'Drag to turn the desk, or steer with this dial.', at: '#joy' },
  { h: 'Zoom right in', p: `${touch ? 'Pinch' : 'Scroll'} to go from the whole desk to one synth.`, at: '#zoom' },
  { h: 'Open the menu', p: 'Everything is boxed up in here if you’d rather pick from a list.', at: '#mnu' },
  { h: 'Sound on, off', p: `The keys really play. ${click} here whenever you need quiet.`, at: '#snd', mood: 'wow' },
  { h: 'Say hello', p: 'Contact flies you straight to Vick’s details. He’d love to chat.', at: '#ctaContact', mood: 'happy' },
];

const INK = '#2a1b12', CREAM = '#fbf1dd', RED = '#e0301a';
/* Beep: a wooden cabinet (the wood from the texture library), a cream card bezel, a dark tube with his face on it, two knobs, a speaker,
   two aerials, a sticker, and his plug dangling underneath. The face (.tv-face) is moved to look; eyes and mouths are swapped by data-eyes / data-m */
const BOX = 'M24 45Q22 38 30 37L170 35Q180 35 181 44L183 156Q183 165 174 166L30 168Q21 168 21 159Z';
const TV = `<svg class="tv" viewBox="0 0 200 204" aria-hidden="true" focusable="false" data-eyes="open" data-m="rest">
  <defs><pattern id="tvWood" patternUnits="userSpaceOnUse" width="220" height="220"><image href="assets/tex/wood.jpg" width="220" height="220"/></pattern>
    <clipPath id="tvTube"><path d="M42 59Q86 55 131 59Q135 101 131 145Q86 149 42 145Q38 101 42 59Z"/></clipPath></defs>
  <g class="tv-cord"><path d="M96 167Q90 180 100 185Q110 190 104 198" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M96 167Q90 180 100 185Q110 190 104 198" fill="none" stroke="${RED}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M98 194L111 196L109 204L96 202Z" fill="${CREAM}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/></g>
  <g class="tv-ant" fill="none" stroke="${INK}" stroke-linecap="round"><path d="M88 38L64 10M106 38L134 7" stroke-width="7"/><path d="M88 38L64 10M106 38L134 7" stroke="#c9a06c" stroke-width="2.8"/><circle cx="63" cy="9" r="4.6" fill="${CREAM}" stroke-width="2.6"/><circle cx="135" cy="6" r="4.6" fill="${RED}" stroke-width="2.6"/></g>
  <path d="${BOX}" transform="translate(3 3)" fill="none" stroke="${CREAM}" stroke-width="13" stroke-linejoin="round" opacity=".9"/>
  <g transform="translate(6 6)"><path d="${BOX}" fill="url(#tvWood)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="${BOX}" fill="${INK}" opacity=".5"/></g>
  <path d="${BOX}" fill="url(#tvWood)"/><path d="${BOX}" fill="#f6b272" opacity=".46"/>
  <g fill="none" stroke="${INK}" stroke-linecap="round" opacity=".28" stroke-width="1.4"><path d="M30 42Q90 39 172 40"/><path d="M148 52Q150 100 149 160"/><path d="M27 161Q80 163 140 161"/><path d="M26 60Q25 100 26 140"/></g>
  <path d="${BOX}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M35 50L136 49Q142 49 142 55L143 148Q143 154 137 154L36 155Q30 155 30 149L29 56Q29 50 35 50Z" fill="${CREAM}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M42 59Q86 55 131 59Q135 101 131 145Q86 149 42 145Q38 101 42 59Z" fill="#1d130d" stroke="${INK}" stroke-width="3"/>
  <g clip-path="url(#tvTube)"><g class="tv-lines" stroke="${CREAM}" stroke-width="1.2" opacity=".1">${[66, 74, 82, 90, 98, 106, 114, 122, 130, 138].map(y => `<path d="M38 ${y}H136"/>`).join('')}</g>
    <g class="tv-face"><circle cx="55" cy="114" r="6" fill="${RED}" opacity=".55"/><circle cx="119" cy="114" r="6" fill="${RED}" opacity=".55"/>
      <g class="e-open" fill="${CREAM}"><rect x="62" y="80" width="16" height="24" rx="6"/><rect x="96" y="80" width="16" height="24" rx="6"/></g>
      <g class="e-wow" fill="${CREAM}"><rect x="60" y="76" width="19" height="30" rx="8"/><rect x="95" y="76" width="19" height="30" rx="8"/></g>
      <g class="e-happy" fill="none" stroke="${CREAM}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M60 98Q70 80 80 98"/><path d="M94 98Q104 80 114 98"/></g>
      <g class="e-shut" fill="none" stroke="${CREAM}" stroke-width="5" stroke-linecap="round"><path d="M61 94H79"/><path d="M95 94H113"/></g>
      <g class="e-wink"><rect x="62" y="80" width="16" height="24" rx="6" fill="${CREAM}"/><path d="M95 90L111 95L95 100" fill="none" stroke="${CREAM}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>
      <path class="m-rest" d="M74 119Q87 131 100 119" fill="none" stroke="${CREAM}" stroke-width="5" stroke-linecap="round"/>
      <ellipse class="m-a" cx="87" cy="123" rx="6.5" ry="5" fill="${CREAM}"/>
      <g class="m-b"><path d="M73 116H101Q100 135 87 135Q74 135 73 116Z" fill="${CREAM}"/><path d="M80 130Q87 124 94 130Q90 135 87 135Q84 135 80 130Z" fill="${RED}"/></g>
      <path class="m-c" d="M77 123H97" fill="none" stroke="${CREAM}" stroke-width="5" stroke-linecap="round"/>
      <ellipse class="m-o" cx="87" cy="124" rx="7" ry="9" fill="${CREAM}"/></g>
    <path d="M47 64Q62 60 80 61L58 92Q45 88 44 70Z" fill="#fff" opacity=".1"/></g>
  <g stroke="${INK}" stroke-linecap="round"><circle cx="163" cy="62" r="9.5" fill="${CREAM}" stroke-width="2.8"/><path d="M163 62L168 55" stroke-width="2.8"/><circle cx="163" cy="88" r="9.5" fill="${CREAM}" stroke-width="2.8"/><path d="M163 88L156 84" stroke-width="2.8"/>
    <g stroke-width="2.6"><path d="M154 108H172"/><path d="M154 116H172"/><path d="M154 124H172"/><path d="M154 132H172"/><path d="M154 140H172"/></g><circle class="tv-led" cx="163" cy="153" r="3.6" fill="${RED}" stroke-width="2"/></g>
  <g transform="rotate(-9 34 30)"><rect x="20" y="20" width="27" height="23" fill="${CREAM}" stroke="${INK}" stroke-width="2.2"/><path d="M27 27V36M27 27H25M27 36H25M40 27V36M40 27H42M40 36H42" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><circle cx="33.5" cy="28.5" r="1.5" fill="${RED}"/><circle cx="33.5" cy="34.5" r="1.5" fill="${RED}"/></g>
</svg>`;

/* built once, on the first click */
let el, say, hEl, pEl, pips, back, next, ring, face, tvSvg, ringSize = '';
/* the loop, on a 100 × 100 square; stretched to whatever it goes round */
const LOOP = [[52, 4], [24, 2, 4, 22, 5, 50], [6, 80, 28, 97, 52, 96], [80, 95, 97, 76, 95, 48], [93, 20, 72, 3, 44, 6], [36, 7, 30, 9, 26, 12]];
const loop = (w, h) => LOOP.map((c, i) => (i ? 'C' : 'M') + c.map((v, k) => (v / 100 * (k % 2 ? h : w)).toFixed(1)).join(' ')).join('');
function build() {
  el = document.createElement('div'); el.id = 'tour'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Site tour with Beep');
  el.innerHTML = `<div class="tv-wrap">${TV}</div>
    <div class="tv-say"><i class="ply" aria-hidden="true"></i>
      <div class="say-in" aria-live="polite"><div class="say-top"><h2 id="tour-h"></h2><span class="pips" aria-hidden="true"></span></div><p id="tour-p"></p></div>
      <div class="say-nav"><button class="t-nav" id="tour-back" aria-label="Back">${icon('chevron-left', 22)}</button>
        <button class="t-skip" id="tour-skip">Skip tour</button>
        <button class="t-nav t-next" id="tour-next" aria-label="Next">${icon('chevron-right', 22)}${icon('check', 22, 'done')}</button></div></div>`;
  /* the felt-tip ring round what he's talking about: one wobbly loop that overshoots where it started, like the marker lines on the bench */
  ring = document.createElement('div'); ring.id = 'tour-ring'; ring.hidden = true; ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = '<svg><path pathLength="1"/></svg>';
  document.body.append(ring, el);
  say = el.querySelector('.tv-say'); hEl = $('tour-h'); pEl = $('tour-p'); pips = el.querySelector('.pips'); back = $('tour-back'); next = $('tour-next');
  tvSvg = el.querySelector('.tv'); face = el.querySelector('.tv-face');
  back.onclick = () => go(at - 1); next.onclick = () => go(at + 1); $('tour-skip').onclick = () => close();
}

const help = $('help');
let steps = [], at = -1, open = false, timer = 0, tick = 0, typed = 0, startTick = 0, blinkAt = 0, mx = 0, my = 0, movedAt = -1e9, placed = '';
const visible = id => { const e = document.querySelector(id), r = e?.getBoundingClientRect(); return !!r && r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' };
/* where the thing he's on about is right now (it moves: the camera flies, the zoom guide slides) */
function target() {
  const s = steps[at]; if (!s?.at) return null;
  const r = s.at[0] === '#' ? document.querySelector(s.at)?.getBoundingClientRect() : act.spot?.(s.at); if (!r || r.right - r.left < 2) return null;
  const pad = s.at[0] === '#' ? 9 : 4, w = innerWidth, h = innerHeight;
  const b = { l: Math.max(6, r.left - pad), t: Math.max(6, r.top - pad), r: Math.min(w - 6, r.right + pad), b: Math.min(h - 6, r.bottom + pad) };
  return b.r - b.l < 8 || b.b - b.t < 8 ? null : b;
}
/* put him next to it, on whichever side has the room, with the TV on the end nearest it; with nothing to point at he floats in the middle */
function place(force) {
  const T = target(), w = innerWidth, h = innerHeight, gw = el.offsetWidth, gh = el.offsetHeight, m = 12, gap = 20, top0 = desktop() ? 70 : 58;
  let x, y;
  if (!T) { x = (w - gw) / 2; y = Math.max(top0, h * .56 - gh / 2) }
  else {
    const cx = (T.l + T.r) / 2, cy = (T.t + T.b) / 2, room = { below: h - T.b, above: T.t - top0, left: T.l, right: w - T.r };
    const fits = { below: room.below > gh + gap + m, above: room.above > gh + gap + m, left: room.left > gw + gap + m, right: room.right > gw + gap + m };
    const best = (a, b) => fits[a] && fits[b] ? (room[a] >= room[b] ? a : b) : fits[a] ? a : fits[b] ? b : null, side = best('below', 'above') || best('left', 'right'); // over or under it first: beside it only when there's no room
    if (side === 'below') { x = cx - gw / 2; y = T.b + gap } else if (side === 'above') { x = cx - gw / 2; y = T.t - gh - gap }
    else if (side === 'left') { x = T.l - gw - gap; y = cy - gh / 2 } else if (side === 'right') { x = T.r + gap; y = cy - gh / 2 }
    else { x = m; y = h - gh - m - 90 } // nowhere beside it (it fills the view): he tucks into the bottom left, over it
    x = Math.min(w - gw - m, Math.max(m, x)); y = Math.min(h - gh - m, Math.max(top0, y));
    el.classList.toggle('flip', desktop() && cx > x + gw / 2);
  }
  if (!T) el.classList.remove('flip');
  const key = `${Math.round(x)},${Math.round(y)}`; if (key !== placed || force) { placed = key; el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px' }
  if (T) { const rw = Math.round(T.r - T.l), rh = Math.round(T.b - T.t); ring.hidden = false; Object.assign(ring.style, { left: T.l + 'px', top: T.t + 'px', width: rw + 'px', height: rh + 'px' });
    if (ringSize !== rw + 'x' + rh) { ringSize = rw + 'x' + rh; ring.querySelector('path').setAttribute('d', loop(rw, rh)) } } else ring.hidden = true;
  return T;
}
const setEyes = k => { if (tvSvg.dataset.eyes !== k) tvSvg.dataset.eyes = k }, setMouth = k => { if (tvSvg.dataset.m !== k) tvSvg.dataset.m = k };
const TALK = ['a', 'b', 'a', 'c', 'b', 'a', 'c', 'a', 'b', 'c'];
/* one drawing: write a little more of the line (his mouth moving), look, blink, and keep up with whatever he's pointing at */
function draw() {
  if (!open) return; tick++; const s = steps[at], T = place(), n = s.p.length, since = tick - startTick;
  if (typed < n && since > 2) { typed = Math.min(n, typed + 3); pEl.firstChild.textContent = s.p.slice(0, typed); pEl.lastChild.textContent = s.p.slice(typed) }
  const talking = typed < n && since > 2, last = at === steps.length - 1;
  setMouth(talking ? TALK[(tick >> 1) % TALK.length] : s.mood === 'wow' && since < 26 ? 'o' : 'rest');
  /* eyes: a blink now and then; otherwise the mood for this line (a happy squint to say hello, wide at the surprise, a wink to finish) */
  if (tick > blinkAt + 1) blinkAt = tick + 26 + Math.floor(Math.random() * 30);
  setEyes(tick >= blinkAt ? 'shut' : s.mood === 'happy' && since < 14 ? 'happy' : s.mood === 'wow' && since < 26 ? 'wow' : last && !talking && since < n / 2 + 22 ? 'wink' : 'open');
  /* looking: at the pointer while it moves, back to what he's talking about once it's been still a moment (or at you, with nothing to point at) */
  const r = tvSvg.getBoundingClientRect(), ex = r.left + r.width * .435, ey = r.top + r.height * .47, chase = performance.now() - movedAt < 1100;
  let gx = 0, gy = 0; const to = chase ? { x: mx, y: my } : T ? { x: (T.l + T.r) / 2, y: (T.t + T.b) / 2 } : null;
  if (to) { const dx = to.x - ex, dy = to.y - ey, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 160); gx = dx / d * k * 9; gy = dy / d * k * 7 }
  face.setAttribute('transform', `translate(${gx.toFixed(1)} ${gy.toFixed(1)})`);
}
function go(i) {
  if (i < 0) return; if (i >= steps.length) return close(true);
  at = i; const s = steps[i], last = i === steps.length - 1;
  hEl.textContent = s.h; pEl.innerHTML = '<span></span><span class="rest"></span>'; typed = reduceMotion ? s.p.length : 0;
  pEl.firstChild.textContent = s.p.slice(0, typed); pEl.lastChild.textContent = s.p.slice(typed); pEl.setAttribute('aria-label', s.p);
  pips.innerHTML = steps.map((_, k) => `<i${k === i ? ' class="on"' : ''}></i>`).join('');
  back.disabled = i === 0; next.classList.toggle('last', last); next.setAttribute('aria-label', last ? 'Finish the tour' : 'Next');
  startTick = tick; beep(i); foley('marker', .6);
  for (const e of [say, ring, tvSvg]) { e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop') } // the bubble pops, the ring is drawn again, his aerials twitch
  place(true);
}
function start() {
  if (!el) build(); ensureAudio();
  if (S.menu) act.closeMenu?.(); if (S.mode || S.card || V.look) act.zoomOut?.(); // back to the whole bench, so everything he points at is in view
  steps = STEPS.filter(s => !(s.wide && !desktop()) && !(s.at?.[0] === '#' && !visible(s.at)));
  open = true; el.hidden = false; el.classList.remove('out'); help.setAttribute('aria-expanded', 'true'); help.classList.remove('nudge'); document.body.dataset.tour = 'on';
  try { localStorage.setItem('vdc-tour', '1') } catch {}
  tick = 0; blinkAt = 30; go(0); clearInterval(timer); timer = setInterval(draw, 1000 / 12); next.focus({ preventScroll: true });
}
function close(done) {
  if (!open) return; open = false; clearInterval(timer); ring.hidden = true; help.setAttribute('aria-expanded', 'false'); delete document.body.dataset.tour;
  if (done) beep(7); el.classList.add('out'); setTimeout(() => { if (!open) el.hidden = true }, reduceMotion ? 0 : 320); help.focus({ preventScroll: true });
}
help.onclick = () => open ? close() : start();
addEventListener('pointermove', e => { if (open && e.pointerType !== 'touch') { mx = e.clientX; my = e.clientY; movedAt = performance.now() } }, { passive: true });
addEventListener('resize', () => { if (open) place(true) });
/* keys, ahead of the synth's own (page/input.js): Esc sends him away, the arrows step (unless a project card is using them) */
addEventListener('keydown', e => {
  if (!open || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape') { e.stopImmediatePropagation(); close() }
  else if (!S.card && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.stopImmediatePropagation(); go(at + (e.key === 'ArrowRight' ? 1 : -1)) }
}, { capture: true });
/* until it's been used once, the question mark hops now and then to say it's there */
try { if (!localStorage.getItem('vdc-tour')) help.classList.add('nudge') } catch { help.classList.add('nudge') }
