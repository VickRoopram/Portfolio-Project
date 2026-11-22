/* Toast: a one-line status note that shows for a moment (#toast in index.html), e.g. "Email copied".
   Shared by the desk (organisms/card.js) and the phone page (organisms/pocket.js). */
export function toast(msg, ms = 2600) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  t.classList.remove('show');
  void t.offsetWidth; // restart the animation
  t.classList.add('show');
  clearTimeout(toast.h);
  toast.h = setTimeout(() => {
    t.hidden = true;
  }, ms);
}
