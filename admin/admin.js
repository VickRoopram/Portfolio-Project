/**
 * Content admin for Vick Does Creative.
 * Groups mirror the synth: filter buttons and role knobs fill the 14 keys, life personas fill the 8 pads,
 * the CV remote has 6 buttons, and the screen holds the About pages.
 * "Update preview" saves the draft (shown on the version-01 preview); "Publish to live" copies it to the live site.
 */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const norm = s => !s ? '' : /^(https?:|\/)/.test(s) ? s : '/' + s; // content uses "assets/…" relative to the site root

const PARTS = [
  { part: 'Filter buttons', slots: 'kb', limit: 14, keys: ['gd', 'ux', 'mo', 'tl', 'xp'], how: n => `Pressing the ${n} filter button loads these onto the 14 keys, in this order. Key 1 is the far left.` },
  { part: 'Role knobs', slots: 'kb', limit: 14, keys: ['ds', 'st', 'ar', 'te'], how: n => `Turning the ${n} knob lights the keys with these, in this order.` },
  { part: 'Life strip', slots: 'pad', limit: 8, keys: ['fm', 'fi', 'ex'], how: n => `Clicking ${n} on the life screen puts these on the 8 black pads (top row first).` },
  { part: 'CV remote', slots: 'cv', limit: 6, keys: ['cv'], how: () => 'The remote on the left: the orange knob, the CONTACT pill, then the four square buttons.' },
  { part: 'Synth screen', slots: 'ab', limit: 12, keys: ['ab'], how: () => 'Clicking the main screen opens these About pages. Visitors page through them with the arrows.' },
];
const PART_OF = Object.fromEntries(PARTS.flatMap(p => p.keys.map(k => [k, p])));
const GLOW = { gd: '#22ff7a', ux: '#3fb2ff', mo: '#ff6a20', tl: '#a46bff', xp: '#ff5ec8', ds: '#3fb2ff', st: '#2bd67b', ar: '#ffffff', te: '#ff7a2a', fm: '#2bd67b', fi: '#3db4ff', ex: '#ff3fb4', cv: '#ff6a20', ab: '#ff2a30' };
const CV_LABELS = ['Orange knob', 'CONTACT', 'BE', 'IG', 'IN', '+'], CV_SHORT = ['KNB', 'CON', 'BE', 'IG', 'IN', '+'];
const PREVIEW_URL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? '/' : 'https://version-01--vick-does-creative.netlify.app/';

let token = null, doc = null, cur = 'gd', sel = 0, dirty = false, status = {}, htmlMode = false, tab = 'edit';
try { token = sessionStorage.getItem('vdc-cms-token') } catch {}

/* ───────────── API ───────────── */
async function api(path, opts = {}) {
  const r = await fetch(path, { ...opts, cache: 'no-store', headers: { ...(opts.headers || {}), ...(token ? { authorization: `Bearer ${token}` } : {}) } });
  if (r.status === 401 && !path.startsWith('/api/login')) { signOut('Your session ended. Sign in again; your edits are still here.'); throw new Error('signed out') }
  let data = null; try { data = await r.json() } catch {}
  if (!r.ok) throw new Error(data?.error || `Something went wrong (${r.status})`);
  return data;
}

/* ───────────── sign in ───────────── */
$('loginForm').onsubmit = async e => {
  e.preventDefault(); $('loginErr').textContent = '';
  try {
    const r = await api('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: $('pw').value }) });
    token = r.token; try { sessionStorage.setItem('vdc-cms-token', token) } catch {}
    $('pw').value = ''; start();
  } catch (err) { $('loginErr').textContent = err.message }
};
function signOut(msg) {
  token = null; try { sessionStorage.removeItem('vdc-cms-token') } catch {}
  $('app').hidden = true; $('login').hidden = false; $('loginErr').textContent = msg || ''; $('pw').focus();
}
$('logoutBtn').onclick = async () => {
  $('logoutBtn').closest('details').open = false;
  if (dirty && !await ask('Sign out?', '<p>Some changes aren’t saved to the preview yet. They stay in this browser and come back next time you sign in here.</p>', 'Sign out')) return;
  doc = null; dirty = false; signOut();
};

/* ───────────── load ───────────── */
async function loadDoc() {
  for (const stage of ['draft', 'live']) {
    const r = await fetch(`/api/content?stage=${stage}`, { cache: 'no-store' });
    if (r.ok) return { doc: await r.json(), from: stage };
  }
  const m = await import('/src/content.js');
  return { doc: { v: 1, ch: clone(m.CH), links: clone(m.LINKS) }, from: 'defaults' };
}
async function start() {
  $('login').hidden = true; $('app').hidden = false;
  if (!doc) {
    const r = await loadDoc(); doc = r.doc;
    for (const k of Object.keys(PART_OF)) doc.ch[k] ||= { name: k.toUpperCase(), col: '#d71920', items: [] };
    doc.links ||= [];
    const b = backup.read();
    if (b && b.base === (doc.updated || 'defaults') && JSON.stringify(b.doc) !== JSON.stringify(doc)) {
      if (await ask('Restore unsaved edits?', '<p>This browser has edits that were never saved to the preview. Bring them back?</p>', 'Restore')) { doc = b.doc; dirty = true }
      else backup.clear();
    }
    if (r.from === 'defaults') toast('Loaded the site’s current content. Press Update preview to start the draft.');
  }
  render(); refreshStatus();
}

/* ───────────── status ───────────── */
const fmt = iso => { if (!iso) return '—'; const d = new Date(iso); const same = d.toDateString() === new Date().toDateString(); return d.toLocaleString([], same ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) };
async function refreshStatus() { try { status = await api('/api/content?stage=status') } catch { status = {} } renderStatus() }
function renderStatus() {
  const s = status, synced = s.draft && s.live && s.draft === s.live;
  $('status').innerHTML = (dirty ? '<span class="dirty">● Unsaved changes</span> · ' : '') +
    `Preview <b>${s.draft ? 'saved ' + fmt(s.draft) : 'not saved yet'}</b> · Live <b>${s.live ? 'published ' + fmt(s.live) : 'using built-in content'}</b>` +
    (s.draft && !synced ? ' · <span class="dirty">preview has changes not yet live</span>' : '');
  $('publishBtn').disabled = !dirty && (!s.draft || synced);
}
function touch() { dirty = true; backup.write(); renderStatus() }

/* local safety copy, so a closed tab doesn't lose work */
const backup = {
  write: (() => { let t; return () => { clearTimeout(t); t = setTimeout(() => { try { localStorage.setItem('vdc-cms-backup', JSON.stringify({ base: doc.updated || 'defaults', doc })) } catch {} }, 400) } })(),
  read() { try { return JSON.parse(localStorage.getItem('vdc-cms-backup')) } catch { return null } },
  clear() { try { localStorage.removeItem('vdc-cms-backup') } catch {} },
};
addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = '' } });

/* ───────────── save / publish / versions ───────────── */
async function save() {
  try {
    $('saveBtn').disabled = true;
    const r = await api('/api/content', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: doc }) });
    doc.updated = r.updated; dirty = false; backup.clear(); toast('Saved. The version-01 preview now shows these changes.'); await refreshStatus(); return true;
  } catch (e) { if (e.message !== 'signed out') toast(e.message, true); return false }
  finally { $('saveBtn').disabled = false }
}
$('saveBtn').onclick = save;
addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (!$('app').hidden) save() } });
$('publishBtn').onclick = async () => {
  if (!await ask('Publish to the live site?', `<p>Everything on the preview${dirty ? ' (including the changes you haven’t saved yet)' : ''} goes live on <b>vick-does-creative.netlify.app</b> within a minute. The current live version is kept, so you can restore it from <b>Live versions</b>.</p>`, 'Publish')) return;
  if (dirty && !await save()) return;
  try { await api('/api/publish', { method: 'POST' }); toast('Published. The live site is updated.'); await refreshStatus() } catch (e) { if (e.message !== 'signed out') toast(e.message, true) }
};
$('discardBtn').onclick = async () => {
  $('discardBtn').closest('details').open = false;
  if (!await ask('Discard draft changes?', '<p>The preview goes back to what’s currently live, and any unsaved edits here are dropped.</p>', 'Discard')) return;
  try { await api('/api/content', { method: 'DELETE' }); backup.clear(); dirty = false; doc = null; await start(); toast('Draft reset to the live version.') } catch (e) { if (e.message !== 'signed out') toast(e.message, true) }
};
$('versionsBtn').onclick = async () => {
  $('versionsBtn').closest('details').open = false;
  let list = []; try { list = (await api('/api/publish')).versions } catch (e) { return toast(e.message, true) }
  const body = list.length ? list.map(k => `<div class="ver"><span>${fmt(k.slice(8))}</span><button type="button" class="btn small" data-k="${esc(k)}">Restore to preview</button></div>`).join('') : '<p class="muted">No earlier live versions yet. Each time you publish, the version it replaces is kept here.</p>';
  const p = ask('Live versions', `<p class="muted">Restoring puts that version on the preview. Check it, then Publish.</p>${body}`, 'Close', true);
  $('dlgB').onclick = async e => { const k = e.target.closest('[data-k]')?.dataset.k; if (!k) return; try { await api('/api/publish', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: k }) }); $('dlg').close(); doc = null; dirty = false; backup.clear(); await start(); toast('Restored to the preview. Publish when it looks right.') } catch (er) { toast(er.message, true) } };
  await p;
};
$('openPreview').href = PREVIEW_URL;

$('pwBtn').onclick = async () => {
  $('pwBtn').closest('details').open = false;
  const ok = await ask('Change password', `<label class="field"><span>Current password</span><input id="pwC" type="password" autocomplete="current-password"></label>
    <label class="field"><span>New password <small>10+ characters</small></span><input id="pwN" type="password" autocomplete="new-password"></label>
    <label class="field"><span>New password again</span><input id="pwN2" type="password" autocomplete="new-password"></label>`, 'Change');
  if (!ok) return;
  const c = $('pwC').value, n = $('pwN').value, n2 = $('pwN2').value;
  if (n !== n2) return toast('The new passwords don’t match.', true);
  try {
    const r = await api('/api/login', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ current: c, next: n }) });
    token = r.token; try { sessionStorage.setItem('vdc-cms-token', token) } catch {}
    toast('Password changed. Other signed-in browsers have been signed out.');
  } catch (e) { if (e.message !== 'signed out') toast(e.message, true) }
};

/* ───────────── render: groups sidebar ───────────── */
function render() { renderGroups(); renderGroup(); renderEditor() }
function renderGroups() {
  $('groups').innerHTML = PARTS.map(p => `<h3>${p.part}</h3>` + p.keys.map(k => {
    const g = doc.ch[k], n = g.items.length;
    return `<button data-k="${k}" style="--c:${g.glow || GLOW[k]}" aria-current="${k === cur}"><i class="dot"></i><span>${esc(g.name)}</span><small class="${n > p.limit ? 'full' : ''}">${n}/${p.limit}</small></button>`;
  }).join('')).join('');
}
$('groups').onclick = e => { const k = e.target.closest('[data-k]')?.dataset.k; if (k) { cur = k; sel = 0; render() } };

/* ───────────── render: group (header, synth map, list) ───────────── */
const G = () => doc.ch[cur], glowOf = k => doc.ch[k].glow || GLOW[k];
function renderGroup() {
  const g = G(), p = PART_OF[cur], c = glowOf(cur);
  document.documentElement.style.setProperty('--glow', c === '#ffffff' ? '#9aa0aa' : c);
  $('groupPane').style.setProperty('--c', c); $('editor').style.setProperty('--c', c);
  $('gPart').textContent = p.part; $('gName').value = g.name; $('gHow').textContent = p.how(g.name);
  $('gCol').value = g.col || '#d71920'; $('gGlow').value = c;
  // the map of how this group sits on the synth
  const label = { kb: 'The 14 keys', pad: 'The 8 life pads', cv: 'The CV remote', ab: 'Screen pages' }[p.slots];
  $('slotsLabel').textContent = label; $('slotsCount').textContent = `${Math.min(g.items.length, p.limit)} of ${p.limit} used`;
  const n = p.slots === 'ab' ? Math.max(g.items.length, 1) : p.limit;
  $('slots').className = 'slots ' + p.slots;
  $('slots').innerHTML = Array.from({ length: n }, (_, i) => {
    const it = g.items[i], tag = p.slots === 'cv' ? CV_LABELS[i] : p.slots === 'kb' ? `KEY ${i + 1}` : p.slots === 'pad' ? `PAD ${i + 1}` : `PAGE ${i + 1}`;
    return it ? `<button class="slot on${i === sel ? ' sel' : ''}" data-i="${i}" style="--c:${c}" title="${esc(it.t)}"><b>${tag}</b><span>${esc(it.t || 'Untitled')}</span></button>`
      : `<div class="slot off" title="${p.slots === 'kb' ? 'Empty: this key only plays a note' : 'Empty'}"><b>${tag}</b><span>empty</span></div>`;
  }).join('');
  // the list
  $('items').innerHTML = g.items.map((it, i) => {
    const th = it.img?.[0]?.s ? `style="background-image:url('${esc(norm(it.img[0].s))}')"` : '';
    return `<li draggable="true" data-i="${i}" aria-current="${i === sel}" class="${i >= p.limit ? 'over-limit' : ''}" tabindex="0" title="${i >= p.limit ? 'Beyond the last ' + label.toLowerCase().replace('the ', '') + ': not shown on the synth' : 'Alt + ↑/↓ to move'}">
      <span class="grip" aria-hidden="true">⠿</span><span class="num">${p.slots === 'cv' ? CV_SHORT[i] || '—' : String(i + 1).padStart(2, '0')}</span><span class="th" ${th}></span>
      <span class="tx"><b>${esc(it.t || 'Untitled')}</b><small>${esc(it.k || '')}</small></span></li>`;
  }).join('') || '<li class="muted" style="cursor:default;grid-template-columns:1fr">Nothing here yet. Add the first project.</li>';
  $('orderHint').textContent = `drag to reorder · order = ${{ kb: 'key', pad: 'pad', cv: 'button', ab: 'page' }[p.slots]} order`;
  $('addItem').disabled = g.items.length >= p.limit;
  $('addItem').title = g.items.length >= p.limit ? `All ${p.limit} ${label.toLowerCase().replace('the ', '')} are used. Delete or move one first.` : '';
  // social links (CV remote only)
  $('linksBox').hidden = cur !== 'cv';
  if (cur === 'cv') $('socials').innerHTML = doc.links.map((l, i) => pairRow(l, i, 'soc')).join('');
}
const pairRow = (l, i, kind) => `<div class="pair" data-${kind}="${i}"><input placeholder="Label" value="${esc(l[0])}" data-f="0"><input placeholder="https://…" value="${esc(l[1])}" data-f="1"><button type="button" aria-label="Remove" data-x>×</button></div>`;

$('slots').onclick = e => { const i = e.target.closest('[data-i]')?.dataset.i; if (i != null) { sel = +i; renderGroup(); renderEditor() } };
$('items').onclick = e => { const i = e.target.closest('[data-i]')?.dataset.i; if (i != null) { sel = +i; renderGroup(); renderEditor() } };
$('items').onkeydown = e => {
  const li = e.target.closest('[data-i]'); if (!li) return; const i = +li.dataset.i;
  if (e.key === 'Enter') { sel = i; renderGroup(); renderEditor() }
  if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); const j = i + (e.key === 'ArrowUp' ? -1 : 1); if (move(i, j)) $('items').querySelector(`[data-i="${j}"]`)?.focus() }
};
function move(i, j) { const a = G().items; if (j < 0 || j >= a.length) return false; a.splice(j, 0, a.splice(i, 1)[0]); if (sel === i) sel = j; else if (sel === j) sel = i; touch(); render(); return true }
// drag to reorder
let dragI = null;
$('items').ondragstart = e => { dragI = +e.target.closest('[data-i]').dataset.i; e.dataTransfer.effectAllowed = 'move' };
$('items').ondragover = e => { const li = e.target.closest('[data-i]'); if (dragI == null || !li) return; e.preventDefault(); $('items').querySelectorAll('.drag-over').forEach(x => x.classList.remove('drag-over')); li.classList.add('drag-over') };
$('items').ondrop = e => { e.preventDefault(); const li = e.target.closest('[data-i]'); if (li && dragI != null) { const to = +li.dataset.i; const a = G().items, it = a.splice(dragI, 1)[0]; a.splice(to, 0, it); sel = to; touch(); render() } dragI = null };
$('items').ondragend = () => { dragI = null; $('items').querySelectorAll('.drag-over').forEach(x => x.classList.remove('drag-over')) };

$('gName').oninput = e => { G().name = e.target.value; touch(); renderGroups(); $('gHow').textContent = PART_OF[cur].how(G().name) };
$('gCol').oninput = e => { G().col = e.target.value; touch(); updatePreview() };
$('gGlow').oninput = e => { G().glow = e.target.value; touch(); renderGroups(); renderGroup() };
$('addItem').onclick = () => { G().items.push({ t: 'New project', k: '', d: '<p></p>', img: [], tags: [], links: [] }); sel = G().items.length - 1; touch(); render(); $('fT').select() };
$('addSocial').onclick = () => { doc.links.push(['', 'https://']); touch(); renderGroup() };
$('socials').oninput = e => { const r = e.target.closest('[data-soc]'); if (!r) return; doc.links[+r.dataset.soc][+e.target.dataset.f] = e.target.value; touch() };
$('socials').onclick = e => { const r = e.target.closest('[data-soc]'); if (r && e.target.hasAttribute('data-x')) { doc.links.splice(+r.dataset.soc, 1); touch(); renderGroup() } };

/* ───────────── render: item editor ───────────── */
const I = () => G().items[sel];
function renderEditor() {
  if (sel >= G().items.length) sel = Math.max(0, G().items.length - 1);
  const it = I(), p = PART_OF[cur];
  $('empty').hidden = !!it; $('form').hidden = !it || tab !== 'edit'; $('cardFrame').hidden = !it || tab !== 'preview';
  if (!it) return;
  $('iSlot').textContent = `${G().name} · ${p.slots === 'cv' ? CV_LABELS[sel] || 'not shown' : (p.slots === 'kb' ? 'key ' : p.slots === 'pad' ? 'pad ' : 'page ') + (sel + 1)}${sel >= p.limit ? ' · not shown (over the limit)' : ''}`;
  $('fT').value = it.t || ''; $('fK').value = it.k || '';
  setHTMLMode(false); $('fD').innerHTML = it.d || '';
  $('fTags').value = (it.tags || []).join(', '); $('upMsg').textContent = '';
  renderImgs(); renderLinks(); renderBars();
  $('flags').textContent = [it.hero && 'Also shows the portrait block at the top.', it.contact && 'Also shows email, phone and the social links (edit them in the list on the left).', it.life && 'Also shows the life summaries.'].filter(Boolean).join(' ');
  $('copyTo').innerHTML = '<option value="">group…</option>' + Object.keys(PART_OF).filter(k => k !== cur).map(k => `<option value="${k}">${esc(doc.ch[k].name)}</option>`).join('');
  updatePreview();
}
$('fT').oninput = e => { I().t = e.target.value; touch(); renderGroup(); updatePreview() };
$('fK').oninput = e => { I().k = e.target.value; touch(); renderGroup(); updatePreview() };
$('fTags').oninput = e => { I().tags = e.target.value.split(',').map(s => s.trim()).filter(Boolean); touch(); updatePreview() };

/* rich text: bold, italic, small heading, paragraph, bullets, links, clear; plus raw HTML for the special blocks */
$('fD').oninput = () => { I().d = $('fD').innerHTML; touch(); updatePreview() };
$('fD').onpaste = e => { e.preventDefault(); const t = e.clipboardData.getData('text/plain'); document.execCommand('insertText', false, t) };
$('fDhtml').oninput = e => { I().d = e.target.value; touch(); updatePreview() };
function setHTMLMode(on) {
  if (on === htmlMode) return; htmlMode = on;
  if (on) $('fDhtml').value = I()?.d || ''; else if (I()) $('fD').innerHTML = I().d || '';
  $('fD').hidden = on; $('fDhtml').hidden = !on; document.querySelector('[data-cmd="html"]').setAttribute('aria-pressed', on);
}
document.querySelector('.rte-bar').onclick = async e => {
  const b = e.target.closest('[data-cmd]'); if (!b) return; const cmd = b.dataset.cmd;
  if (cmd === 'html') return setHTMLMode(!htmlMode);
  if (htmlMode) return; $('fD').focus();
  if (cmd === 'h3' || cmd === 'p') document.execCommand('formatBlock', false, cmd);
  else if (cmd === 'link') {
    const range = getSelection().rangeCount ? getSelection().getRangeAt(0).cloneRange() : null;
    const url = await ask('Add a link', '<label class="field"><span>Web address</span><input id="lnk" value="https://"></label>', 'Add link', false, () => $('lnk'));
    if (url && range) { $('fD').focus(); const s = getSelection(); s.removeAllRanges(); s.addRange(range); document.execCommand('createLink', false, url) }
  } else document.execCommand(cmd, false, null);
  I().d = $('fD').innerHTML; touch(); updatePreview();
};

/* images */
function renderImgs() {
  const im = I().img ||= [];
  $('imgs').innerHTML = im.map((m, i) => `<div class="img" data-m="${i}"><div class="pic" style="background-image:url('${esc(norm(m.s))}')"></div>
    <div class="row"><input placeholder="Describe the image (alt text)" value="${esc(m.a)}"><button type="button" data-mv="-1" title="Move earlier" aria-label="Move earlier">←</button><button type="button" data-mv="1" title="Move later" aria-label="Move later">→</button><button type="button" data-x title="Remove" aria-label="Remove">×</button></div></div>`).join('');
}
$('imgs').oninput = e => { const r = e.target.closest('[data-m]'); if (r) { I().img[+r.dataset.m].a = e.target.value; touch(); updatePreview() } };
$('imgs').onclick = e => {
  const r = e.target.closest('[data-m]'); if (!r) return; const i = +r.dataset.m, a = I().img;
  if (e.target.hasAttribute('data-x')) a.splice(i, 1);
  else if (e.target.dataset.mv) { const j = i + +e.target.dataset.mv; if (j < 0 || j >= a.length) return; a.splice(j, 0, a.splice(i, 1)[0]) } else return;
  touch(); renderImgs(); renderGroup(); updatePreview();
};
$('fileIn').onchange = e => { upload([...e.target.files]); e.target.value = '' };
const drop = $('drop');
['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { if (e.dataTransfer?.types.includes('Files')) { e.preventDefault(); drop.classList.add('over') } }));
['dragleave', 'drop'].forEach(t => drop.addEventListener(t, () => drop.classList.remove('over')));
drop.addEventListener('drop', e => { e.preventDefault(); upload([...e.dataTransfer.files].filter(f => f.type.startsWith('image/'))) });
/* shrink to max 1800 px and WebP (JPEG where the browser can't make WebP) before upload; GIFs go as they are to keep animation */
async function shrink(file) {
  if (file.type === 'image/gif') return file;
  const bmp = await createImageBitmap(file), k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  const to = (type, q) => new Promise(r => c.toBlob(r, type, q));
  let b = await to('image/webp', .86); if (!b || b.type !== 'image/webp') b = await to('image/jpeg', .88);
  return b.size < file.size || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? b : file;
}
async function upload(files) {
  if (!files.length) return; const it = I(); let done = 0;
  for (const f of files) {
    $('upMsg').textContent = `Uploading ${done + 1} of ${files.length}…`;
    try {
      const b = await shrink(f);
      const r = await api('/api/media', { method: 'POST', headers: { 'content-type': b.type, 'x-file-name': encodeURIComponent(f.name) }, body: b });
      (it.img ||= []).push({ s: r.url, a: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') }); done++;
      touch(); if (I() === it) { renderImgs(); updatePreview() } renderGroup();
    } catch (e) { if (e.message === 'signed out') return; toast(`${f.name}: ${e.message}`, true) }
  }
  $('upMsg').textContent = done ? `${done} image${done > 1 ? 's' : ''} added. Add a short description to each for screen readers.` : '';
}

/* links + bars */
function renderLinks() { $('links').innerHTML = (I().links ||= []).map((l, i) => pairRow(l, i, 'ln')).join('') }
$('addLink').onclick = () => { I().links.push(['', 'https://']); touch(); renderLinks() };
$('links').oninput = e => { const r = e.target.closest('[data-ln]'); if (r) { I().links[+r.dataset.ln][+e.target.dataset.f] = e.target.value; touch(); updatePreview() } };
$('links').onclick = e => { const r = e.target.closest('[data-ln]'); if (r && e.target.hasAttribute('data-x')) { I().links.splice(+r.dataset.ln, 1); touch(); renderLinks(); updatePreview() } };
function renderBars() {
  const it = I(); $('barsField').hidden = !it.bars; if (!it.bars) return;
  $('bars').innerHTML = it.bars.map((b, i) => `<div class="pair bar3" data-bar="${i}"><input value="${esc(b[0])}" data-f="0" placeholder="Skill"><input value="${esc(b[1])}" data-f="1" placeholder="Level"><input type="range" min="0" max="100" value="${Math.round(b[2] * 100)}" data-f="2" aria-label="Bar length"><button type="button" data-x aria-label="Remove">×</button></div>`).join('');
}
$('addBar').onclick = () => { I().bars.push(['', '', .5]); touch(); renderBars() };
$('bars').oninput = e => { const r = e.target.closest('[data-bar]'); if (!r) return; const f = +e.target.dataset.f; I().bars[+r.dataset.bar][f] = f === 2 ? +e.target.value / 100 : e.target.value; touch(); updatePreview() };
$('bars').onclick = e => { const r = e.target.closest('[data-bar]'); if (r && e.target.hasAttribute('data-x')) { I().bars.splice(+r.dataset.bar, 1); touch(); renderBars(); updatePreview() } };

/* duplicate / copy / delete */
$('dupItem').onclick = () => { const a = G().items; a.splice(sel + 1, 0, { ...clone(I()), t: I().t + ' (copy)' }); sel++; touch(); render() };
$('copyTo').onchange = e => {
  const k = e.target.value; if (!k) return; const lim = PART_OF[k].limit;
  doc.ch[k].items.push(clone(I())); touch(); renderGroups(); e.target.value = '';
  toast(`Copied to ${doc.ch[k].name}${doc.ch[k].items.length > lim ? ` (it’s past the last of ${lim} slots, so it won’t show until you reorder)` : ''}.`);
};
$('delItem').onclick = async () => {
  if (!await ask('Delete this project?', `<p><b>${esc(I().t)}</b> will be removed from ${esc(G().name)}. Copies in other groups stay. Nothing changes on the preview until you press Update preview.</p>`, 'Delete')) return;
  G().items.splice(sel, 1); sel = Math.max(0, sel - 1); touch(); render();
};

/* ───────────── card preview, rendered with the site's own stylesheet ───────────── */
document.querySelector('.tabs').onclick = e => { const t = e.target.closest('[data-tab]'); if (!t) return; tab = t.dataset.tab; document.querySelectorAll('.tabs [data-tab]').forEach(b => b.setAttribute('aria-selected', b === t)); renderEditor() };
function cardHTML(it) {
  let h = `<h2>${esc(it.t)}</h2><p class="k">${esc(it.k)}</p>`;
  if (it.hero) h += `<div class="hero"><img src="/assets/img/vick.jpg" alt=""><div class="d"><p><b>Vickhal Roopram</b><br>UX & Motion Designer<br>27 · South Africa</p></div></div>`;
  if (it.bars) h += `<div class="bars">${it.bars.map(b => `<div class="bar"><span>${esc(b[0])}</span><small>${esc(b[1])}</small><div><i style="--w:${b[2] * 100}%"></i></div></div>`).join('')}</div>`;
  if (it.contact) h += `<div class="d"><p>For work, collaborations or a chat about design and faith:</p></div><div class="copy"><span>vickhal10@gmail.com</span><button class="btn">Copy email</button></div><div class="copy">Cell: +27 73 482 7221</div><div class="socials">${doc.links.map(l => `<a class="soc" href="${esc(l[1])}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/></svg><span>${esc(l[0])}<small>${esc(String(l[1]).replace(/^https:\/\/(www\.)?/, ''))}</small></span><b>↗</b></a>`).join('')}</div>`;
  if (it.d) h += `<div class="d">${it.d}</div>`;
  if (it.tags?.length) h += `<div class="tags">${it.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>`;
  if (it.links?.length) h += `<div class="links">${it.links.map(l => `<a href="${esc(l[1])}" target="_blank" rel="noopener">${esc(l[0])} ↗</a>`).join('')}</div>`;
  if (it.img?.length) h += `<div class="gal">${it.img.map(g => `<button><img src="${esc(norm(g.s))}" alt="${esc(g.a)}"></button>`).join('')}</div>`;
  return h;
}
function updatePreview() {
  if (tab !== 'preview' || !I()) return;
  const th = document.documentElement.dataset.theme;
  $('cardFrame').srcdoc = `<!doctype html><html data-theme="${th}"><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bungee&family=IBM+Plex+Mono:wght@500;600&family=Noto+Sans:wght@400;600;700&display=swap"><link rel="stylesheet" href="/src/styles.css">
<style>html,body{height:auto;overflow:auto}body{padding:18px}#card{position:relative!important;inset:auto!important;width:100%!important;max-width:430px;height:auto!important;margin:0 auto}.content{overflow:visible}</style></head>
<body><div id="card" style="--accent:${esc(G().col)}"><div class="ch"><div class="eyebrow"></div><button>‹</button><button>›</button><button>✕</button></div><div class="content">${cardHTML(I())}</div></div></body></html>`;
}

/* ───────────── small UI helpers ───────────── */
function toast(msg, bad) { const t = $('toast'); t.textContent = msg; t.className = 'toast' + (bad ? ' bad' : ''); t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, bad ? 6000 : 3500) }
/* dialog: resolves true/false, or the value of an input when getInput is given */
function ask(title, html, okLabel = 'OK', infoOnly = false, getInput = null) {
  const d = $('dlg'); $('dlgT').textContent = title; $('dlgB').innerHTML = html; $('dlgOk').textContent = okLabel;
  d.querySelector('[value=cancel]').hidden = infoOnly; $('dlgB').onclick = null;
  return new Promise(res => { d.onclose = () => res(d.returnValue === 'ok' ? (getInput ? getInput().value.trim() : true) : false); d.returnValue = ''; d.showModal(); getInput?.().select() });
}
$('themeBtn').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; try { localStorage.setItem('vdc-theme', t) } catch {} updatePreview() };
document.addEventListener('pointerdown', e => { const b = e.target.closest('.btn'); if (!b) return; b.classList.remove('zap'); void b.offsetWidth; b.classList.add('zap') });
document.addEventListener('animationend', e => { if (e.animationName === 'zap') e.target.classList.remove('zap') });

/* boot */
if (token) start().catch(() => signOut()); else $('login').hidden = false;
