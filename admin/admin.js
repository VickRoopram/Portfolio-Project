/**
 * /admin entry: sign in, then run the shared admin (app.js) on the site store (store-site.js).
 * The sign-in token lasts 12 hours and lives in this tab only (sessionStorage).
 */
import { startAdmin, esc } from './app.js';
import { siteStore } from './store-site.js';
import { icon } from '/src/atoms/icons.js';

const root = document.getElementById('root');
let token = null; try { token = sessionStorage.getItem('vdc-cms-token') } catch {}
const keep = t => { token = t; try { t ? sessionStorage.setItem('vdc-cms-token', t) : sessionStorage.removeItem('vdc-cms-token') } catch {} };

async function api(path, opts = {}) {
  const r = await fetch(path, { ...opts, cache: 'no-store', headers: { ...(opts.headers || {}), ...(token ? { authorization: `Bearer ${token}` } : {}) } });
  if (r.status === 401 && !path.startsWith('/api/login')) { signOut('Your session ended. Sign in again.'); throw new Error('signed out') }
  let data = null; try { data = await r.json() } catch {}
  if (!r.ok) throw new Error(data?.error || `Something went wrong (${r.status})`);
  return data;
}
function signOut(msg = '') { keep(null); login(msg) }

function login(msg = '') {
  root.innerHTML = `<div class="center"><form class="login" id="lf">
    <div class="brand"><span class="mark">[:]</span><div><b>Vick Does Creative</b><br><small>Content admin</small></div></div>
    <p>Sign in to edit the projects, images, menu and links on your synth portfolio.</p>
    <label class="field"><div class="label">Password</div><input class="input" id="pw" type="password" autocomplete="current-password" required autofocus></label>
    <p class="err" id="le" role="alert">${esc(msg)}</p><button class="btn primary" type="submit">Sign in</button></form></div>`;
  document.getElementById('lf').onsubmit = async e => {
    e.preventDefault(); const b = e.submitter; b.disabled = true; document.getElementById('le').textContent = '';
    try { const r = await api('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: document.getElementById('pw').value }) }); keep(r.token); start() }
    catch (err) { document.getElementById('le').textContent = err.message; b.disabled = false }
  };
}

async function start() {
  root.innerHTML = '<div class="center"><span class="spin"></span>Loading your content…</div>';
  try {
    const [{ CH, LINKS, MENU }, { noCVDownload }] = await Promise.all([import('/src/content.js'), import('/src/cms.js')]);
    const store = await siteStore({ api, signOut, defaults: { CH, LINKS, MENU }, noCV: noCVDownload });
    store.onToken = keep;
    startAdmin(root, { store, icon });
  } catch (e) { if (e.message !== 'signed out') root.innerHTML = `<div class="center"><b>Couldn’t load the content.</b><span>${esc(e.message)}</span><button class="btn" onclick="location.reload()">Try again</button></div>` }
}
token ? start() : login();
