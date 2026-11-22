/* The pointer, animated on twos. The real pointer is hidden and a cardboard cut-out stands in for it, moved to where the mouse is
   12 times a second (the same rate as everything else), so it travels in small jumps. Each jump it's put down at a slightly different
   angle, like a cut-out moved by hand between frames; it squashes while the button is down. Arrow by default, a pointing hand over
   anything pressable, an open hand where you can drag. Loaded on its own from index.html so it's there from the first paint.
   Touch screens and reduced-motion visitors keep the system's own pointer (skin.css still gives them the cardboard cursor images). */
const FPS = 12,
  HOT = { arrow: [3, 2], point: [12, 2], grab: [14, 12] },
  TILT = [-7, 5, -3, 8, 0, -5];
const PRESS = 'button,a,.pic,.m-row,[role="button"],summary,label',
  DRAG = '.j-dial,.j-stick';
if (
  matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  const el = Object.assign(document.createElement('i'), { id: 'cur' });
  el.setAttribute('aria-hidden', 'true');
  document.body.append(el);
  let x = 0,
    y = 0,
    lx = -1,
    ly = -1,
    over = null,
    on = false,
    down = false,
    beat = 0;
  const kind = (t) =>
    !t?.closest
      ? 'arrow'
      : t.tagName === 'CANVAS'
        ? t.dataset.cur === 'point'
          ? 'point'
          : 'grab'
        : t.closest(DRAG)
          ? 'grab'
          : t.closest(PRESS)
            ? 'point'
            : 'arrow';
  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      x = e.clientX;
      y = e.clientY;
      over = e.target;
      if (!on) {
        on = true;
        document.documentElement.classList.add('cur');
      }
    },
    { passive: true },
  );
  addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType !== 'touch') down = true;
    },
    { passive: true },
  );
  addEventListener(
    'pointerup',
    () => {
      down = false;
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => {
    on = false;
    el.hidden = true;
  });
  addEventListener('blur', () => {
    on = false;
    el.hidden = true;
  });
  setInterval(() => {
    // one drawing
    if (!on) return;
    const k = kind(over),
      [hx, hy] = HOT[k],
      moved = x !== lx || y !== ly;
    if (moved) beat++;
    lx = x;
    ly = y;
    el.hidden = false;
    el.dataset.k = k;
    el.style.transformOrigin = `${hx}px ${hy}px`;
    el.style.transform = `translate(${x - hx}px,${y - hy}px) rotate(${moved ? TILT[beat % TILT.length] : 0}deg) scale(${down ? 0.84 : 1})`;
  }, 1000 / FPS);
}
