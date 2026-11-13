/**
 * Site store for /admin: content lives in Netlify Blobs behind /api/*.
 *   Every change autosaves to the draft (what the version-01 preview shows); "Publish to live" copies the draft to the live site.
 *   Groups the synth no longer shows stay in the stored document untouched.
 */
import { esc } from './app.js';

const MANAGED = ['gd', 'ux', 'mo', 'tl', 'xp', 'ab', 'cv'];
const PREVIEW = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? '/' : 'https://version-01--vick-does-creative.netlify.app/';
const LIVE = 'https://vick-does-creative.netlify.app/';
const ago = iso => { if (!iso) return 'never'; const s = (Date.now() - Date.parse(iso)) / 1000; if (s < 50) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago';
  return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) };
const strip = (k, v) => k.startsWith('_') ? undefined : v; // upload placeholders and other UI-only fields never leave the page

export async function siteStore({ api, signOut, defaults, noCV }) {
  let base = null, from = 'defaults';
  for (const stage of ['draft', 'live']) { try { base = await api(`/api/content?stage=${stage}`); from = stage; break } catch (e) { if (e.message === 'signed out') throw e } }
  base ||= { v: 1, ch: {}, links: defaults.LINKS };
  const CH = JSON.parse(JSON.stringify(defaults.CH)), links = base.links?.length ? base.links : defaults.LINKS;
  for (const [k, g] of Object.entries(base.ch || {})) CH[k] = { ...(CH[k] || {}), ...g };
  noCV?.(CH, links); // the CV isn't downloadable from the site: same rule as the site itself
  const data = {
    groups: Object.fromEntries(MANAGED.map(k => [k, { name: CH[k].name, col: CH[k].col, ...(CH[k].glow ? { glow: CH[k].glow } : {}), ...(CH[k].knob ? { knob: CH[k].knob } : {}), items: CH[k].items || [] }])),
    socials: JSON.parse(JSON.stringify(links)), menu: JSON.parse(JSON.stringify(base.menu || defaults.MENU)),
  };
  let status = {}, app = null, timer = 0, saving = false, again = false, statusEl = null, ui = null;
  const refreshStatus = async () => { try { status = await api('/api/content?stage=status') } catch {} paint() };

  async function put() {
    if (saving) { again = true; return } saving = true; ui?.setSave('busy');
    const content = JSON.parse(JSON.stringify({ ...base, ch: { ...(base.ch || {}), ...data.groups }, links: data.socials.filter(l => l[0] && l[1]), menu: data.menu }, strip));
    for (const g of Object.values(content.ch)) for (const it of g.items || []) if (it.img) it.img = it.img.filter(m => m.s);
    try { const r = await api('/api/content', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }) });
      status.draft = r.updated; status.draftPublished = null; ui?.setSave('saved', 'Saved to preview'); paint() }
    catch (e) { if (e.message !== 'signed out') { ui?.setSave('error'); ui?.toast(e.message); clearTimeout(timer); timer = setTimeout(put, 4000) } }
    saving = false; if (again) { again = false; put() }
  }
  function paint() {
    if (!statusEl) return; const unpub = !!status.draft && !status.draftPublished;
    statusEl.innerHTML = `<div class="card"><h5>Publishing</h5>
      <div class="row"><b>Preview</b><span>${status.draft ? 'Updated ' + ago(status.draft) : 'Same as live'}</span><b>Live</b><span>${status.live ? 'Published ' + ago(status.live) : 'Built-in content'}</span></div>
      <p class="note">${unpub ? 'The preview has changes the live site doesn’t. Check them, then publish.' : 'The live site matches the preview.'}</p>
      <div class="btns"><a class="btn sm" href="${PREVIEW}" target="_blank" rel="noopener">${ui.icon('external-link', 16)}Open the preview</a>
        <button class="btn primary sm" id="pub" ${unpub ? '' : 'disabled'}>${ui.icon('upload', 16)}Publish to live</button>
        ${unpub && status.live ? `<button class="btn ghost sm" id="discard">${ui.icon('undo', 16)}Discard unpublished changes</button>` : ''}</div></div>`;
    statusEl.querySelector('#pub').onclick = async () => {
      if (!await ui.ask('Publish to the live site?', 'Everything on the preview goes live now. The version it replaces is kept, so you can bring it back from <b>Version history</b>.', 'Publish')) return;
      try { clearTimeout(timer); if (saving || again) await new Promise(r => setTimeout(r, 1500)); await api('/api/publish', { method: 'POST' }); ui.toast('Published. The live site shows it now.'); refreshStatus() } catch (e) { ui.toast(e.message) } };
    statusEl.querySelector('#discard') && (statusEl.querySelector('#discard').onclick = async () => {
      if (!await ui.ask('Discard unpublished changes?', 'The preview goes back to what’s live, and these edits are lost.', 'Discard', { danger: true })) return;
      try { await api('/api/content', { method: 'DELETE' }); location.reload() } catch (e) { ui.toast(e.message) } });
  }

  const store = {
    load: () => data,
    attach(a) { app = a; ui = a.ui; refreshStatus(); if (from === 'live') ui.toast('Showing the live content. Your first change starts a new preview.') },
    save() { ui?.setSave('busy'); clearTimeout(timer); timer = setTimeout(put, 1200) },
    async upload(blob) {
      const r = await api('/api/media', { method: 'POST', headers: { 'content-type': blob.type, 'x-file-name': encodeURIComponent(blob.name || 'image') }, body: blob });
      return r.url;
    },
    img: s => !s ? '' : /^(\/media\/|\/assets\/|https:\/\/)/.test(s) ? s : /^assets\//.test(s) ? '/' + s : '',
    previewHead: '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400..900&display=swap"><link rel="stylesheet" href="/src/styles.css">',
    renderStatus(el, u) { statusEl = el; ui ||= u; paint() },
    links: [{ label: 'Preview', href: PREVIEW, icon: 'external-link' }, { label: 'Live site', href: LIVE, icon: 'globe' }],
    account: [
      { label: 'Version history', icon: 'undo', run: history },
      { label: 'Change password', icon: 'edit', run: changePassword },
      '-',
      { label: 'Sign out', icon: 'arrow-right', run: () => signOut() },
    ],
  };
  async function history(ui) {
    let v; try { v = (await api('/api/publish')).versions } catch (e) { return ui.toast(e.message) }
    if (!v.length) return ui.ask('Version history', 'Nothing has been replaced yet. Each time you publish, the version it replaces is kept here.', 'OK', { cancel: '' });
    const d = await ui.ask('Bring back an earlier version', `<p style="margin:0 0 12px">It replaces the preview (not the live site), so you can check it and then publish.</p>
      <select class="select" id="ver">${v.map(k => `<option value="${esc(k)}">${esc(new Date(k.slice(8)).toLocaleString())}</option>`).join('')}</select>`, 'Restore to preview', { onOpen: () => {} });
    if (!d) return; try { await api('/api/publish', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: d.querySelector('#ver').value }) }); location.reload() } catch (e) { ui.toast(e.message) }
  }
  async function changePassword(ui) {
    const d = await ui.ask('Change password', `<div class="stack"><label class="field"><div class="label">Current password</div><input class="input" type="password" id="cur" autocomplete="current-password"></label>
      <label class="field"><div class="label">New password <small>at least 10 characters</small></div><input class="input" type="password" id="nxt" autocomplete="new-password"></label></div>`, 'Change password', { onOpen: () => {} });
    if (!d) return;
    try { const r = await api('/api/login', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ current: d.querySelector('#cur').value, next: d.querySelector('#nxt').value }) });
      store.onToken?.(r.token); ui.toast('Password changed. Other sessions are signed out.') } catch (e) { ui.toast(e.message) }
  }
  return store;
}
