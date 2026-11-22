/* Which site to start. index.html decides before the first paint: the 3D desk (main.js) everywhere except a phone (html.phone).
   A phone held upright gets the office (organisms/pocket.js: one wall, the synth on a shelf, the menu as a stack of boxes); turned sideways it gets the playable synth (main.js in jam mode),
   which is only downloaded the first time the phone is turned. */
const html = document.documentElement;
if (!html.classList.contains('phone')) await import('./main.js');
else {
  const wide = matchMedia('(orientation: landscape)'),
    { initPocket } = await import('./organisms/pocket.js');
  let synth;
  initPocket();
  const view = () => {
    html.dataset.view = wide.matches ? 'play' : 'page';
    if (wide.matches) synth ||= import('./main.js');
  };
  wide.addEventListener('change', view);
  view();
}
