/**
 * Artifact store: content lives in this Claude artifact's database; Claude carries it to the site on request.
 *   groups/<key> · site/socials · site/menu · site/sync (requests and what was last sent)
 * Images picked from the computer go into the artifact's assets as "asset:<id>"; a sync uploads them to the site.
 */
const PREVIEW = 'https://version-01--vick-does-creative.netlify.app/', LIVE = 'https://vick-does-creative.netlify.app/';
const PATH = part => part === 'socials' ? 'site/socials' : part === 'menu' ? 'site/menu' : 'groups/' + part;
const strip = (k, v) => k.startsWith('_') ? undefined : v;

/* the fingerprint Claude records when it sends content, so the page can tell what hasn't been sent yet */
const FIELDS = ['t', 'k', 'd', 'img', 'tags', 'links', 'bars', 'hero', 'contact', 'life'], KEYS = ['gd', 'ux', 'mo', 'tl', 'xp', 'ab', 'cv'];
function canon(S) {
  const ch = {};
  for (const k of KEYS) { const g = S.groups[k]; if (!g) continue;
    ch[k] = { name: g.name || '', col: g.col || '#d71920', ...(g.glow ? { glow: g.glow } : {}), items: (g.items || []).map(it => { const o = {};
      for (const f of FIELDS) if (it[f] !== undefined && it[f] !== '' && !(Array.isArray(it[f]) && !it[f].length)) o[f] = f === 'img' ? it.img.filter(m => m.s).map(m => ({ s: m.s, a: m.a ?? '' })) : it[f]; return o }) } }
  return { ch, links: (S.socials || []).filter(l => l[0] && l[1]), menu: { items: (S.menu.items || []).map(x => ({ label: x.label, go: x.go, ...(x.go === 'link' ? { href: x.href || '' } : {}) })), projects: (S.menu.projects || []).map(p => ({ key: p.key, label: p.label || '' })) } };
}
const fnv = str => { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) } return (h >>> 0).toString(16).padStart(8, '0') };
const hashes = S => { const c = canon(S), o = { links: fnv(JSON.stringify(c.links)), menu: fnv(JSON.stringify(c.menu)) }; for (const k in c.ch) o[k] = fnv(JSON.stringify(c.ch[k])); return { all: fnv(JSON.stringify(c)), groups: o } };
const ago = iso => { if (!iso) return 'never'; const s = (Date.now() - Date.parse(iso)) / 1000; if (s < 50) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago';
  return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) };

async function artifactStore(defaultMenu) {
  const db = await claude.use('db'); if (!db) throw new Error('signed-out');
  const assets = await claude.use('assets');
  const data = { groups: {}, socials: [], menu: JSON.parse(JSON.stringify(defaultMenu)) };
  let sync = {}, app = null, ui = null, statusEl = null;
  const pending = {}, timers = {}, writing = {};
  const busy = () => Object.values(pending).some(Boolean) || Object.values(writing).some(Boolean);

  async function flush(part) {
    if (writing[part]) { timers[part] = setTimeout(() => flush(part), 300); return }
    writing[part] = true; pending[part] = false;
    const body = JSON.parse(JSON.stringify(part === 'socials' ? { links: data.socials } : part === 'menu' ? data.menu : data.groups[part], strip));
    try { await db.doc(PATH(part)).set(body); writing[part] = false; if (!busy()) ui?.setSave('saved'); paint() }
    catch (e) { writing[part] = false; pending[part] = true; ui?.setSave('error'); timers[part] = setTimeout(() => flush(part), 2500 + Math.random() * 1500) }
  }
  function paint() {
    if (!statusEl || !app) return; const h = hashes(app.state), r = sync.request;
    const unsent = sync.preview?.hash ? sync.preview.hash !== h.all : !!sync.preview, liveBehind = sync.live?.hash && sync.preview?.hash && sync.live.hash !== sync.preview.hash;
    statusEl.innerHTML = `<div class="card"><h5>Send to the site</h5>
      <div class="row"><b>Preview</b><span>${sync.preview ? 'Sent ' + ago(sync.preview.at) : 'Not sent yet'}</span><b>Live</b><span>${sync.live ? 'Published ' + ago(sync.live.at) : '—'}</span></div>
      ${r ? `<p class="note">${r === 'live' ? 'Ready to publish.' : 'Ready for the preview.'} Tell Claude <code>${r === 'live' ? 'publish my portfolio' : 'sync my portfolio'}</code>.</p>
             <div class="btns"><button class="btn ghost sm" id="cancel">${ui.icon('undo', 16)}Cancel request</button></div>`
          : `<p class="note">${unsent ? 'You have edits the preview doesn’t have yet.' : liveBehind ? 'The preview is ahead of the live site.' : 'The site is up to date with these edits.'}</p>
             <div class="btns"><button class="btn primary sm" id="toPrev" ${unsent ? '' : 'disabled'}>${ui.icon('upload', 16)}Send to preview</button>
             <button class="btn sm" id="toLive" ${liveBehind && !unsent ? '' : 'disabled'}>${ui.icon('globe', 16)}Publish live</button></div>`}
      <p class="note">Edits save here as you type. Claude carries them to the site when you ask: preview first, live once you approve.</p></div>`;
    const req = async kind => { const hh = hashes(app.state); try { await db.doc('site/sync').set({ ...sync, request: kind, requestedAt: new Date().toISOString(), requestHash: hh.all, requestGroups: hh.groups });
      ui.toast(kind === 'live' ? 'Ready: tell Claude “publish my portfolio”' : 'Ready: tell Claude “sync my portfolio”') } catch { ui.toast('Couldn’t save the request. Try again.') } };
    statusEl.querySelector('#toPrev') && (statusEl.querySelector('#toPrev').onclick = () => req('preview'));
    statusEl.querySelector('#toLive') && (statusEl.querySelector('#toLive').onclick = async () => { if (await ui.ask('Publish to the live site?', 'Claude copies what’s on the preview to the live site when you tell it to. Check the preview first.', 'Mark ready to publish')) req('live') });
    statusEl.querySelector('#cancel') && (statusEl.querySelector('#cancel').onclick = async () => { const b = { ...sync }; for (const k of ['request', 'requestedAt', 'requestHash', 'requestGroups']) delete b[k]; try { await db.doc('site/sync').set(b) } catch {} });
  }
  /* content was loaded from the site: record its fingerprints as what the preview and live site already have */
  function baseline() {
    if (sync.preview?.hash !== 'seed' || !app) return; const h = hashes(app.state), b = JSON.parse(JSON.stringify(sync));
    b.preview = { ...b.preview, hash: h.all, groups: h.groups }; if (b.live?.hash === 'seed') b.live = { ...b.live, hash: h.all, groups: h.groups };
    db.doc('site/sync').set(b).catch(() => {});
  }

  /* subscribe once; resolve when everything has arrived the first time */
  await new Promise((resolve, reject) => {
    const got = { g: 0, s: 0, m: 0, y: 0 }, ready = () => got.g && got.s && got.m && got.y;
    let first = true; const t = setTimeout(() => reject(new Error('slow')), 15000);
    const after = () => { if (first && ready()) { first = false; clearTimeout(t); resolve() } else if (!first && app) { app.replace({ groups: data.groups, socials: data.socials, menu: data.menu }); paint() } };
    db.collection('groups').onSnapshot(snap => { for (const d of snap.docs) if (!pending[d.id] && !writing[d.id]) data.groups[d.id] = JSON.parse(JSON.stringify(d.data())); got.g = 1; after() }, e => reject(e));
    db.doc('site/socials').onSnapshot(s => { if (!pending.socials && !writing.socials && s.exists) data.socials = JSON.parse(JSON.stringify(s.data().links || [])); got.s = 1; after() }, e => reject(e));
    db.doc('site/menu').onSnapshot(s => { if (!pending.menu && !writing.menu && s.exists) data.menu = JSON.parse(JSON.stringify(s.data())); got.m = 1; after() }, e => reject(e));
    db.doc('site/sync').onSnapshot(s => { sync = s.exists ? JSON.parse(JSON.stringify(s.data())) : {}; got.y = 1; if (!first) { baseline(); paint() } else after() }, e => reject(e));
  });

  return {
    load: () => data,
    attach(a) { app = a; ui = a.ui; baseline(); paint() },
    save(part) { pending[part] = true; ui?.setSave('busy'); clearTimeout(timers[part]); timers[part] = setTimeout(() => flush(part), 700); paint() },
    async upload(blob) { if (!assets) throw new Error('uploads need edit access to this page'); const r = await assets.upload(blob); return 'asset:' + r.id },
    img: s => !s ? '' : /^\/?assets\/img\//.test(s) ? 'img/' + s.split('/').pop() : s.startsWith('asset:') ? '/_blob/' + s.slice(6) : '',
    previewHead: '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400..900&display=swap"><style>' + SITE_CSS + '</style>',
    previewTheme: () => 'dark',
    renderStatus(el, u) { statusEl = el; ui ||= u; paint() },
    links: [{ label: 'Preview', href: PREVIEW, icon: 'external-link' }, { label: 'Live site', href: LIVE, icon: 'globe' }],
    account: [],
  };
}
