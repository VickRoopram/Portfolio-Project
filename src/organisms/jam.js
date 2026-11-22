/* Jam mode: the Play button clears the portfolio away and leaves the bench as an instrument.
   · the keys, sharps, pads and big knobs play as always; the keys hold no projects (molecules/controls.js)
   · the five section buttons pick the keys' sound (core/audio.js VOICES); 1–5 on the keyboard do the same
   · the remote is a looper: REC records what you play into a two-bar loop that keeps going round, and every pass you play over it adds
     a layer; PLAY and STOP run it, UNDO takes the last layer off, CLEAR wipes it, the knob sets the tempo. Its note shows what it's doing.
   Notes land on the nearest sixteenth, and playback is scheduled on the audio clock a little ahead of time, so the loop stays tight even
   though the pictures are on twos. "Back to portfolio" (or Esc) puts everything back, and Bleep says hello again. */
import { $, S, act } from '../core/state.js';
import { P, VOICES, LIVE, clock, applyP, ensureAudio, playNote, drum } from '../core/audio.js';
import { PADS } from './synth.js';
import { RC } from './remote.js';
import { note } from './screens.js';
import { welcomeBack } from './tour.js';
import * as THREE from 'three';

const BEATS = 8,
  GRID = 4,
  AHEAD = 0.12; // beats in the loop · steps per beat that notes snap to · seconds scheduled ahead
const L = { on: false, rec: false, pos: 0, sched: 0, last: 0, layer: 0, timer: 0 },
  events = []; // an event: { b: beat, k: 'n' | 'd', a: note or drum, len, v: voice, layer, from }
const bpm = () => Math.round(70 + P.tempo * 80),
  voiceNow = () => ({ wave: P.wave, attack: P.attack, sub: P.sub, oct: P.oct }),
  wear = (v) => Object.assign(P, { wave: v.wave, attack: v.attack, sub: v.sub, oct: v.oct });
let kept = null,
  shown = '';

/* the scheduler: every 25 ms, hand the audio clock everything due in the next AHEAD seconds (and a click on each beat while recording) */
function tick() {
  const now = clock(),
    spb = 60 / bpm();
  L.pos += (now - L.last) / spb;
  L.last = now;
  const to = L.pos + AHEAD / spb,
    when = (b) => now + (b - L.pos) * spb;
  for (let n = Math.floor(L.sched / BEATS); n * BEATS <= to; n++)
    for (const e of events) {
      const b = n * BEATS + e.b;
      if (b > L.sched && b <= to && b >= e.from) e.k === 'n' ? playNote(e.a, e.len, when(b), e.v) : drum(e.a, when(b));
    }
  if (L.rec)
    for (let b = Math.ceil(L.sched + 1e-9); b <= to; b++) drum(b % BEATS ? (b % 4 ? 'hat' : 'rim') : 'blip', when(b));
  L.sched = to;
}
const run = () => {
  if (L.on) return;
  ensureAudio();
  L.on = true;
  L.pos = 0;
  L.sched = -1e-6;
  L.last = clock();
  L.timer = setInterval(tick, 25);
  tick();
};
const halt = () => {
  L.on = L.rec = false;
  clearInterval(L.timer);
};
/* what's played by hand while REC is on goes into the loop, on the nearest sixteenth (it has just sounded, so it's not played again this pass) */
LIVE.fn = (k, a, len) => {
  if (!S.play || !L.rec || (k === 'd' && !PADS.includes(a))) return;
  events.push({
    b: (Math.round((L.pos % BEATS) * GRID) / GRID) % BEATS,
    k,
    a,
    len,
    v: k === 'n' ? voiceNow() : null,
    layer: L.layer,
    from: L.pos + 0.5,
  });
};

const DO = {
  rec() {
    if (L.rec) L.rec = false;
    else {
      run();
      L.rec = true;
      L.layer++;
    }
  },
  play() {
    run();
    L.rec = false;
  },
  stop: halt,
  undo() {
    if (!L.layer) return;
    for (let i = events.length; i--; ) if (events[i].layer === L.layer) events.splice(i, 1);
    L.layer--;
  },
  clear() {
    events.length = 0;
    L.layer = 0;
    L.rec = false;
  },
};
act.loop = (what) => {
  if (S.play) {
    DO[what]?.();
    drawNote();
  }
};
act.voice = (j) => {
  const v = VOICES[j];
  if (!S.play || !v) return;
  S.voice = j;
  wear(v);
  ensureAudio();
  playNote(60, 0.5);
};

/* the remote's note: REC / LOOP / JAM, and under it the tempo and how much is on the loop */
function drawNote() {
  const layers = new Set(events.map((e) => e.layer)).size,
    beat = L.on ? Math.floor(L.pos % BEATS) + 1 : 0;
  const s = `${L.rec ? 'REC' : L.on ? 'LOOP' : 'JAM'}|${bpm()} bpm · ${L.on ? `${beat}/${BEATS}` : layers ? `${layers} layer${layers > 1 ? 's' : ''}` : 'hit REC ↓'}`;
  if (s !== shown) {
    shown = s;
    note(...s.split('|'));
  }
}
export function updateJam() {
  if (S.play) drawNote();
}

const BOX = new THREE.Box3(new THREE.Vector3(-13, 0, -4.2), new THREE.Vector3(9.7, 1.2, 4.3)); // both boxes, a bit closer than the whole bench
if (document.documentElement.classList.contains('phone')) ((BOX.min.x = -15.2), (BOX.max.x = 10.2)); // a phone's screen is all synth: leave room for the whole remote
const PHONE = document.documentElement.classList.contains('phone');
/* on a phone the synth is only ever in jam mode (turning upright is the way back), and the loop stops when it's turned upright */
if (PHONE)
  matchMedia('(orientation: portrait)').addEventListener('change', (e) => {
    if (e.matches && L.on) {
      halt();
      drawNote();
    }
  });
act.jam = (on) => {
  if (on === S.play || (PHONE && !on)) return;
  ensureAudio();
  if (on) {
    act.cancelJourney();
    if (S.menu) act.closeMenu();
    kept = voiceNow();
    S.play = true;
    S.voice = 0;
    wear(VOICES[0]);
    act.lookAt('jam', BOX);
    shown = '';
    drawNote();
  } else {
    halt();
    DO.clear();
    S.play = false;
    wear(kept);
    act.zoomOut();
    note();
    setTimeout(welcomeBack, 1300);
  }
  for (const o of RC.folio) o.visible = !on;
  for (const o of RC.jam) o.visible = on;
  S.hover = S.grp = null;
  applyP();
  if (on) document.body.dataset.play = 'on';
  else delete document.body.dataset.play;
  $('jamBack').hidden = !on;
};
$('jam').onclick = () => act.jam(true);
$('jamBack').onclick = () => act.jam(false);
