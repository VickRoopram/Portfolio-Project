/**
 * Content admin · Vick Does Creative: the interface, shared by the site's /admin and the Claude artifact admin.
 * It knows nothing about where content is kept: a store (store-site.js or the artifact's store) loads it, saves it,
 * uploads images and runs the publish actions.
 *
 *   startAdmin(root, { store, icon })
 *     store.load()            → { groups: {gd, ux, mo, tl, xp, ab, cv}, socials: [[label, url]], menu: {items, projects} }
 *     store.save(part, data)  part = a group key | 'socials' | 'menu'; the store debounces and reports through ui.setSave
 *     store.upload(file)      → the image's src for content ("/media/img/…" or "asset:<id>")
 *     store.img(src)          → a URL this page can show, or '' when it can't
 *     store.previewHead       → <link>/<style> for the card preview frame
 *     store.renderStatus(el)  → the publish panel in the sidebar
 *     store.account           → [{label, icon, run}] in the header's ⋯ menu ('-' draws a divider)
 *     store.attach(handle)    → called once with { ui, replace(data), state }
 */
const ORDER = ['gd', 'ux', 'mo', 'tl', 'xp', 'ab', 'cv'];
export const SECTIONS = {
  gd: { title: 'Design', part: 'Mode button', glow: '#22ff7a', slots: 'kb', noun: 'project', how: 'Pressing DESIGN on the synth loads these onto the 14 keys, left to right.' },
  ux: { title: 'UI/UX', part: 'Mode button', glow: '#3fb2ff', slots: 'kb', noun: 'case note', how: 'Pressing UI/UX loads these onto the 14 keys, left to right.' },
  mo: { title: 'Motion & 3D', part: 'Mode button', glow: '#ff6a20', slots: 'kb', noun: 'piece', how: 'Pressing MOTION loads these onto the 14 keys, left to right.' },
  tl: { title: 'Tools', part: 'Mode button', glow: '#a46bff', slots: 'kb', noun: 'tool', how: 'Pressing TOOLS loads these onto the 14 keys, left to right.' },
  xp: { title: 'Experimental', part: 'Mode button', glow: '#ff5ec8', slots: 'kb', noun: 'experiment', how: 'Pressing EXPERIMENTAL loads these onto the 14 keys, left to right.' },
  ab: { title: 'About', part: 'Screen & menu', glow: '#ff2a30', slots: 'kb', noun: 'page', how: 'The synth screen and About in the menu open the first page; visitors page through the rest with the card arrows.' },
  cv: { title: 'Remote', part: 'CV & contact', glow: '#ff6a20', slots: 'cv', noun: 'button', how: 'The remote on the left of the synth. Its buttons open these, in this order.' },
};
const LIMIT = { kb: 14, cv: 6 };
const CV_SLOT = ['Card arrows', 'CONTACT', 'Behance', 'Instagram', 'LinkedIn', '··· More'];
const GO = { home: 'Home (overview)', about: 'About pages', projects: 'Projects list', contact: 'Contact card', link: 'Web link' };
const EMAIL = 'vickhal10@gmail.com';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild };

/* descriptions keep simple formatting only; nothing that can run code */
const OK = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'A', 'UL', 'OL', 'LI', 'H3', 'H4', 'DIV', 'SPAN', 'SMALL', 'BLOCKQUOTE', 'HR']);
export function clean(html) {
  const t = document.createElement('template'); t.innerHTML = String(html || '');
  const walk = n => [...n.childNodes].forEach(c => {
    if (c.nodeType === 8) return c.remove(); if (c.nodeType !== 1) return;
    if (!OK.has(c.tagName)) { if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|SVG|MATH|TEMPLATE|FORM|INPUT|BUTTON|TEXTAREA|SELECT|LINK|META|BASE|IMG|VIDEO|AUDIO)$/.test(c.tagName)) return c.remove(); walk(c); c.replaceWith(...c.childNodes); return }
    [...c.attributes].forEach(a => { const n = a.name.toLowerCase(), v = a.value;
      const keep = (n === 'class' && /^[\w\s-]*$/.test(v)) || (n === 'style' && !/url\s*\(|expression|javascript:|@import|behavior/i.test(v)) || (c.tagName === 'A' && n === 'href' && /^(https?:|mailto:|tel:|\/|#|assets\/)/i.test(v.trim()));
      if (!keep) c.removeAttribute(a.name) });
    if (c.tagName === 'A') { c.setAttribute('target', '_blank'); c.setAttribute('rel', 'noopener') }
    walk(c) });
  walk(t.content); return t.innerHTML.trim();
}

export function startAdmin(root, { store, icon }) {
  const S = { ...store.load(), view: 'gd', edit: null, tab: 'content', html: false };
  const brandIcon = (label, s = 20) => icon(String(label).toLowerCase().split(/[ (·]/)[0], s);
  const G = k => S.groups[k], glow = k => G(k)?.glow || SECTIONS[k].glow, lim = k => LIMIT[SECTIONS[k].slots];
  const slotName = (k, i) => SECTIONS[k].slots === 'cv' ? CV_SLOT[i] || 'Not on the remote' : `Key ${String(i + 1).padStart(2, '0')}`;
  const changed = part => store.save(part, part === 'socials' ? S.socials : part === 'menu' ? S.menu : G(part));

  /* ── feedback: save pill, toasts with undo, dialogs, pop-over menus ── */
  let toastEl = null;
  const ui = {
    icon, esc,
    setSave(st, msg) { const p = root.querySelector('#save'); if (!p) return; p.className = 'save' + (st === 'busy' ? ' busy' : st === 'error' ? ' err' : ''); p.lastChild.textContent = msg || (st === 'busy' ? 'Saving…' : st === 'error' ? 'Not saved · retrying' : 'All changes saved') },
    toast(msg, undo) {
      toastEl?.remove(); clearTimeout(ui.toast.t);
      toastEl = h(`<div class="toast${undo ? '' : ' plain'}" role="status"><span>${esc(msg)}</span>${undo ? '<button class="btn sm">Undo</button>' : ''}</div>`);
      if (undo) toastEl.querySelector('button').onclick = () => { undo(); toastEl.remove() };
      document.body.append(toastEl); ui.toast.t = setTimeout(() => toastEl?.remove(), undo ? 6000 : 3200);
    },
    ask(title, body, ok = 'OK', { danger = false, cancel = 'Cancel', onOpen } = {}) {
      return new Promise(res => {
        const d = h(`<dialog><h3>${esc(title)}</h3><div class="body">${body}</div><div class="act">${cancel ? `<button class="btn ghost" data-v="0">${esc(cancel)}</button>` : ''}<button class="btn ${danger ? 'danger' : 'primary'}" data-v="1">${esc(ok)}</button></div></dialog>`);
        document.body.append(d); d.showModal(); onOpen?.(d);
        d.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) { const v = b.dataset.v === '1' ? (onOpen ? d : true) : false; d.close(); d.remove(); res(v) } });
        d.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); d.querySelector('[data-v="1"]').click() } });
        d.addEventListener('cancel', () => { d.remove(); res(false) });
      });
    },
    refresh: () => renderAll(),
  };
  function pop(anchor, items) {
    document.querySelector('.pop')?.remove();
    const p = h(`<div class="pop" role="menu">${items.map((it, i) => it === '-' ? '<hr>' : it.sub ? `<div class="sub">${esc(it.sub)}</div>` : `<button role="menuitem" data-i="${i}" class="${it.danger ? 'danger' : ''}">${it.icon ? icon(it.icon, 16) : ''}<span>${esc(it.label)}</span></button>`).join('')}</div>`);
    document.body.append(p); const r = anchor.getBoundingClientRect(), w = p.offsetWidth, hh = p.offsetHeight;
    p.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + 'px'; p.style.top = (r.bottom + 6 + hh > innerHeight ? Math.max(8, r.top - 6 - hh) : r.bottom + 6) + 'px';
    p.onclick = e => { const b = e.target.closest('[data-i]'); if (b) { p.remove(); items[+b.dataset.i].run() } };
    setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!p.contains(e.target)) { p.remove(); document.removeEventListener('pointerdown', off) } }), 0);
    p.querySelector('button')?.focus();
  }

  /* drag to reorder: rows (by their handle) or cards (anywhere). onMove(from, to) */
  function sortable(list, sel, onMove, { handle } = {}) {
    let from = null;
    list.querySelectorAll(sel).forEach((el, i) => {
      el.dataset.idx = i;
      if (handle) { const hd = el.querySelector(handle); hd?.addEventListener('pointerdown', () => el.draggable = true); el.addEventListener('dragend', () => el.draggable = false) } else el.draggable = true;
      el.addEventListener('dragstart', e => { from = i; el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)) });
      el.addEventListener('dragend', () => { el.classList.remove('dragging'); list.querySelectorAll('.drop-before').forEach(x => x.classList.remove('drop-before')) });
      el.addEventListener('dragover', e => { if (from == null) return; e.preventDefault(); list.querySelectorAll('.drop-before').forEach(x => x.classList.remove('drop-before')); el.classList.add('drop-before') });
      el.addEventListener('drop', e => { e.preventDefault(); if (from != null && from !== i) onMove(from, i); from = null });
    });
  }
  const move = (arr, a, b) => { arr.splice(b, 0, arr.splice(a, 1)[0]) };

  /* ── shell ── */
  root.innerHTML = `<div class="shell">
    <header class="top"><div class="brand"><span class="mark">[:]</span><div><b>Vick Does Creative</b><br><small>Content admin</small></div></div>
      <span class="save" id="save"><i></i><span>All changes saved</span></span>
      ${store.links.map(l => `<a class="btn ghost hide-sm" href="${esc(l.href)}" target="_blank" rel="noopener">${icon(l.icon, 16)}${esc(l.label)}</a>`).join('')}
      ${store.account?.length ? `<button class="iconbtn" id="acct" aria-label="More">${icon('more-horizontal', 20)}</button>` : ''}</header>
    <nav class="side" id="side" aria-label="Sections"></nav>
    <main class="main" id="main"></main></div>`;
  root.querySelector('#acct') && (root.querySelector('#acct').onclick = e => pop(e.currentTarget, store.account.map(a => a === '-' ? a : { ...a, run: () => a.run(ui) })));
  const side = root.querySelector('#side'), main = root.querySelector('#main');

  function renderSide() {
    const nav = (k, label, extra = '', ic = '') => `<button class="nav" data-v="${k}" ${S.view === k ? 'aria-current="page"' : ''} ${extra}>${ic}<span>${esc(label)}</span>`;
    const sec = k => { const n = G(k).items.length; return nav(k, SECTIONS[k].title, `style="--c:${glow(k)}"`, '<i class="dot"></i>') + `<small class="${n > lim(k) ? 'over' : ''}">${n}/${lim(k)}</small></button>` };
    side.innerHTML = `<h4>Mode buttons</h4>${['gd', 'ux', 'mo', 'tl', 'xp'].map(sec).join('')}<h4>More of the synth</h4>${sec('ab')}${sec('cv')}
      <h4>Site</h4>${nav('menu', 'Menu', '', icon('menu', 18))}<small>${S.menu.items.length}</small></button>${nav('socials', 'Social links', '', icon('globe', 18))}<small>${S.socials.length}</small></button>
      <div class="status" id="status"></div>`;
    side.onclick = e => { const v = e.target.closest('[data-v]')?.dataset.v; if (v && v !== S.view) { S.view = v; closeEditor(); renderSide(); renderMain(); main.scrollTop = 0 } };
    store.renderStatus(side.querySelector('#status'), ui);
  }
  function renderMain() { S.view === 'menu' ? renderMenu() : S.view === 'socials' ? renderSocials() : renderSection() }
  function renderAll() { renderSide(); renderMain(); if (S.edit) renderEditor() }

  /* ── a section: the synth strip and the item cards ── */
  function renderSection() {
    const k = S.view, g = G(k), m = SECTIONS[k], n = g.items.length, L = lim(k), c = glow(k);
    const thumb = it => { const u = store.img(it.img?.[0]?.s || ''); return u ? `style="background-image:url('${esc(u)}')"` : '' };
    main.innerHTML = `<div class="page" style="--c:${c}">
      <div class="phead"><div class="t"><div class="eyebrow"><i class="dot"></i>${esc(m.part)}${g.name && g.name.toLowerCase() !== m.title.toLowerCase() ? ` · shown as “${esc(g.name)}”` : ''}</div><h1>${esc(m.title)}</h1><p>${esc(m.how)}</p></div>
        <div class="acts"><button class="btn" id="secSet">${icon('edit', 16)}Section settings</button><button class="btn primary" id="add" ${n >= L ? 'disabled' : ''} title="${n >= L ? `All ${L} slots are used. Delete or move one first.` : ''}">${icon('plus', 16)}New ${esc(m.noun)}</button></div></div>
      <div class="strip ${m.slots}" id="strip">${Array.from({ length: L }, (_, i) => { const it = g.items[i];
        return `<button class="${it ? 'on' : 'empty'}" data-i="${i}" title="${esc(it ? `${slotName(k, i)}: ${it.t}` : `${slotName(k, i)}: empty. Click to add.`)}">${m.slots === 'cv' ? esc(CV_SLOT[i].split(' ')[0]) : i + 1}</button>` }).join('')}</div>
      <div class="strip-legend"><span>${m.slots === 'cv' ? 'The remote’s buttons' : 'The 14 keys'} · ${Math.min(n, L)} of ${L} used</span><span>Drag cards to reorder</span></div>
      <div class="grid" id="grid">${g.items.map((it, i) => `<article class="item${i >= L ? ' over' : ''}" data-i="${i}" tabindex="0" aria-label="${esc(it.t)}">
          <div class="thumb" ${thumb(it)}>${thumb(it) ? '' : icon('image', 30)}</div>
          <div class="tags"><span class="badge glow">${esc(slotName(k, i))}</span>${i >= L ? '<span class="badge warn">Not shown</span>' : ''}${/^open slot$/i.test(it.t) ? '<span class="badge">Placeholder</span>' : ''}</div>
          <button class="iconbtn more" data-more="${i}" aria-label="Actions for ${esc(it.t)}">${icon('more-horizontal', 18)}</button>
          <div class="meta"><b>${esc(it.t || 'Untitled')}</b><small>${esc(it.k || '—')}</small></div></article>`).join('')}
        ${n < L ? `<button class="add-tile" id="addTile">${icon('plus', 26)}<span>New ${esc(m.noun)} on ${esc(slotName(k, n).toLowerCase())}</span></button>` : ''}</div></div>`;
    const grid = main.querySelector('#grid');
    sortable(grid, '.item', (a, b) => { move(g.items, a, b); changed(k); renderSection(); renderSide(); ui.toast(`Moved to ${slotName(k, b).toLowerCase()}`) });
    grid.onclick = e => { const more = e.target.closest('[data-more]'); if (more) { e.stopPropagation(); return itemMenu(more, k, +more.dataset.more) } const it = e.target.closest('.item'); if (it) openEditor(k, +it.dataset.i) };
    grid.onkeydown = e => { const it = e.target.closest('.item'); if (it && e.key === 'Enter') openEditor(k, +it.dataset.i) };
    main.querySelector('#strip').onclick = e => { const b = e.target.closest('[data-i]'); if (!b) return; const i = +b.dataset.i; i < n ? openEditor(k, i) : create(k) };
    main.querySelector('#add').onclick = () => create(k);
    main.querySelector('#addTile') && (main.querySelector('#addTile').onclick = () => create(k));
    main.querySelector('#secSet').onclick = () => sectionSettings(k);
  }
  function itemMenu(anchor, k, i) {
    const g = G(k), it = g.items[i], others = ORDER.filter(x => x !== k);
    pop(anchor, [
      { label: 'Edit', icon: 'edit', run: () => openEditor(k, i) },
      { label: 'Duplicate', icon: 'copy', run: () => duplicate(k, i) },
      { label: 'Move earlier', icon: 'chevron-left', run: () => { if (i > 0) { move(g.items, i, i - 1); changed(k); renderAll() } } },
      { label: 'Move later', icon: 'chevron-right', run: () => { if (i < g.items.length - 1) { move(g.items, i, i + 1); changed(k); renderAll() } } },
      '-', { sub: 'Copy to section' },
      ...others.map(o => ({ label: SECTIONS[o].title, icon: 'arrow-right', run: () => { G(o).items.push(clone(it)); changed(o); renderSide(); ui.toast(`Copied to ${SECTIONS[o].title}${G(o).items.length > lim(o) ? ' (past its last slot)' : ''}`) } })),
      '-', { label: 'Delete', icon: 'trash', danger: true, run: () => remove(k, i) },
    ]);
  }
  function create(k) {
    const g = G(k); if (g.items.length >= lim(k)) return ui.toast(`All ${lim(k)} slots in ${SECTIONS[k].title} are used.`);
    g.items.push({ t: '', k: '', d: '' }); changed(k); renderSide(); renderSection(); openEditor(k, g.items.length - 1, true);
  }
  function duplicate(k, i) { const g = G(k), it = g.items[i]; g.items.splice(i + 1, 0, { ...clone(it), t: (it.t || 'Untitled') + ' (copy)' }); changed(k); renderAll(); ui.toast('Duplicated') }
  function remove(k, i) {
    const g = G(k), it = g.items.splice(i, 1)[0]; changed(k); if (S.edit?.k === k) closeEditor(); renderSide(); renderMain();
    ui.toast(`Deleted “${it.t || 'Untitled'}”`, () => { g.items.splice(i, 0, it); changed(k); renderSide(); renderMain() });
  }
  async function sectionSettings(k) {
    const g = G(k), d = await ui.ask(`${SECTIONS[k].title} settings`, `<div class="stack">
      <label class="field"><div class="label">Name on the synth <small>screen and card headers</small></div><input class="input" id="sName" value="${esc(g.name)}" maxlength="60"></label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><label class="field"><div class="label">Card accent</div><input class="input" type="color" id="sCol" value="${esc(g.col || '#d71920')}" style="padding:4px;height:42px"></label>
      <label class="field"><div class="label">Key glow</div><input class="input" type="color" id="sGlow" value="${esc(glow(k))}" style="padding:4px;height:42px"></label></div>
      <p class="hint">The accent colours the card’s subtitle and buttons; the glow lights the keys and this section’s mode button.</p></div>`, 'Save', { onOpen: () => {} });
    if (!d) return; g.name = d.querySelector('#sName').value.trim() || g.name; g.col = d.querySelector('#sCol').value; g.glow = d.querySelector('#sGlow').value; changed(k); renderAll(); ui.toast('Section updated');
  }

  /* ── the editor drawer ── */
  let drawer = null, scrim = null;
  function openEditor(k, i, isNew = false) { S.edit = { k, i, isNew }; if (S.tab === 'preview' && isNew) S.tab = 'content'; S.html = false; renderEditor(); setTimeout(() => (isNew ? drawer?.querySelector('#fT') : drawer?.querySelector('.dhead .iconbtn'))?.focus(), 30) }
  function closeEditor() {
    if (!S.edit) return; const { k, i, isNew } = S.edit, it = G(k)?.items[i];
    if (isNew && it && !it.t && !it.k && !it.d && !it.img?.length) { G(k).items.splice(i, 1); changed(k) } // an untouched new item doesn't stay
    else if (it && !it.t) { it.t = 'Untitled'; changed(k) }
    S.edit = null; drawer?.remove(); scrim?.remove(); drawer = scrim = null; renderSide(); renderMain();
  }
  addEventListener('keydown', e => { if (e.key === 'Escape' && S.edit && !document.querySelector('dialog[open]') && !document.querySelector('.pop')) closeEditor() });
  function renderEditor() {
    const { k, i } = S.edit, g = G(k), it = g.items[i]; if (!it) return closeEditor();
    if (!drawer) { scrim = h('<div class="scrim"></div>'); scrim.onclick = closeEditor; drawer = h('<aside class="drawer" role="dialog" aria-modal="true" aria-label="Edit item"></aside>'); document.body.append(scrim, drawer) }
    const nImg = it.img?.length || 0, nBtn = it.links?.length || 0;
    drawer.style.setProperty('--c', glow(k));
    drawer.innerHTML = `<div class="dhead"><div class="t"><div class="eyebrow"><i class="dot"></i>${esc(SECTIONS[k].title)} · ${esc(slotName(k, i))}${i >= lim(k) ? ' · not shown on the synth' : ''}</div><h2>${esc(it.t || 'New ' + SECTIONS[k].noun)}</h2></div>
        <button class="iconbtn" aria-label="Close editor">${icon('close', 20)}</button></div>
      <div class="tabs" role="tablist">${[['content', 'Content'], ['images', 'Images', nImg], ['buttons', 'Buttons', nBtn], ['preview', 'Preview']].map(([t, l, c]) =>
        `<button role="tab" data-tab="${t}" aria-selected="${S.tab === t}">${l}${c ? `<span class="count">${c}</span>` : ''}</button>`).join('')}</div>
      <div class="dbody" id="dbody"></div>
      <div class="dfoot"><button class="btn danger" id="del">${icon('trash', 16)}Delete</button><button class="btn" id="dup">${icon('copy', 16)}Duplicate</button><span class="sp"></span><span class="auto">Changes save automatically</span><button class="btn primary" id="done">Done</button></div>`;
    drawer.querySelector('.dhead .iconbtn').onclick = closeEditor; drawer.querySelector('#done').onclick = closeEditor;
    drawer.querySelector('.tabs').onclick = e => { const t = e.target.closest('[data-tab]')?.dataset.tab; if (t && t !== S.tab) { S.tab = t; renderEditor() } };
    drawer.querySelector('#del').onclick = async () => { if (await ui.ask('Delete this item?', `<b>${esc(it.t || 'Untitled')}</b> is removed from ${esc(SECTIONS[k].title)}. You can undo straight after.`, 'Delete', { danger: true })) { S.edit = null; drawer.remove(); scrim.remove(); drawer = scrim = null; remove(k, i) } };
    drawer.querySelector('#dup').onclick = () => { duplicate(k, i); openEditor(k, i + 1) };
    const body = drawer.querySelector('#dbody'), touch = (repaint) => { changed(k); if (repaint) { renderSide(); renderMain() } };
    ({ content: edContent, images: edImages, buttons: edButtons, preview: edPreview })[S.tab](body, it, k, touch);
  }
  const title = () => drawer?.querySelector('.dhead h2');

  function edContent(body, it, k, touch) {
    const flags = [['hero', 'Portrait block', 'Your photo, name and role at the top of the card'], ['contact', 'Contact details', 'Email, phone and your social links'], ['bars', 'Skill bars', 'Labelled bars showing skill levels']];
    body.innerHTML = `<div class="stack">
      <label class="field"><div class="label">Title</div><input class="input" id="fT" value="${esc(it.t)}" maxlength="160" placeholder="e.g. Pulse Hybrid Inverter"></label>
      <label class="field"><div class="label">Subtitle <small>the short line under the title</small></div><input class="input" id="fK" value="${esc(it.k)}" maxlength="240" placeholder="e.g. Project 09 · Gold Pack packaging"></label>
      <div class="field"><div class="label">Description</div><div class="rte"><div class="rte-bar">
          <button data-cmd="bold" title="Bold (⌘B)"><b>B</b></button><button data-cmd="italic" title="Italic (⌘I)"><i>I</i></button><span class="sep"></span>
          <button data-cmd="h3" title="Small heading">H</button><button data-cmd="p" title="Paragraph">¶</button><button data-cmd="insertUnorderedList" title="Bulleted list">${icon('menu', 16)}</button><button data-cmd="link" title="Add a link">${icon('link', 16)}</button><button data-cmd="removeFormat" title="Clear formatting">${icon('close', 14)}</button>
          <span class="sp"></span><button data-cmd="html" aria-pressed="${S.html}" title="Edit the HTML (for timelines, steps and tag blocks)">&lt;/&gt;</button></div>
        ${S.html ? `<textarea id="fDh" spellcheck="false">${esc(it.d || '')}</textarea>` : `<div class="rte-body" id="fD" contenteditable="true">${clean(it.d)}</div>`}</div>
        <p class="hint">Paste plain text and format it here. Timelines, step boxes and tag lists from the site keep their look; edit those in &lt;/&gt; mode.</p></div>
      <div class="field"><div class="label">Tags <small>press Enter or comma to add</small></div><div class="chips" id="chips"></div></div>
      <div class="field"><div class="label">Extra blocks</div><div class="stack" style="gap:8px">${flags.map(([f, l, d]) => `<label class="switch"><span><b>${l}</b><small>${d}</small></span><input type="checkbox" data-flag="${f}" ${it[f] ? 'checked' : ''}></label>`).join('')}</div></div>
      ${it.bars ? `<div class="field"><div class="label">Skill bars <small>drag to reorder</small></div><div class="rows" id="bars"></div><button class="btn ghost sm" id="addBar" style="margin-top:8px">${icon('plus', 16)}Add a bar</button></div>` : ''}</div>`;
    const fT = body.querySelector('#fT');
    fT.oninput = () => { it.t = fT.value; title().textContent = it.t || 'New ' + SECTIONS[k].noun; touch() };
    body.querySelector('#fK').oninput = e => { it.k = e.target.value; touch() };
    fT.onchange = body.querySelector('#fK').onchange = () => { renderSide(); renderMain() };
    // description
    if (S.html) body.querySelector('#fDh').oninput = e => { it.d = e.target.value; touch() };
    else { const d = body.querySelector('#fD'); d.oninput = () => { it.d = clean(d.innerHTML); touch() };
      d.onpaste = e => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')) } }
    body.querySelector('.rte-bar').onmousedown = e => { if (e.target.closest('[data-cmd]')) e.preventDefault() }; // keep the text selection
    body.querySelector('.rte-bar').onclick = async e => {
      const c = e.target.closest('[data-cmd]')?.dataset.cmd; if (!c) return;
      if (c === 'html') { if (S.html) it.d = clean(body.querySelector('#fDh').value); S.html = !S.html; touch(); return edContent(body, it, k, touch) }
      if (S.html) return; const d = body.querySelector('#fD');
      if (c === 'link') { const sel = getSelection(); if (!sel.rangeCount || sel.isCollapsed || !d.contains(sel.anchorNode)) return ui.toast('Select some text first, then add the link.');
        const r = sel.getRangeAt(0).cloneRange(), dl = await ui.ask('Add a link', '<label class="field"><div class="label">Web address</div><input class="input" id="lnk" value="https://"></label>', 'Add link', { onOpen: d => setTimeout(() => d.querySelector('#lnk').select(), 20) });
        if (!dl) return; const url = dl.querySelector('#lnk').value.trim(); if (!/^(https?:|mailto:|tel:|\/)/i.test(url)) return ui.toast('Use a full web address (https://…).');
        d.focus(); sel.removeAllRanges(); sel.addRange(r); document.execCommand('createLink', false, url) }
      else { d.focus(); c === 'h3' || c === 'p' ? document.execCommand('formatBlock', false, c) : document.execCommand(c, false, null) }
      it.d = clean(d.innerHTML); touch();
    };
    // tags
    const chips = body.querySelector('#chips'), drawChips = () => {
      chips.innerHTML = (it.tags || []).map((t, j) => `<span class="chip">${esc(t)}<button data-x="${j}" aria-label="Remove ${esc(t)}">${icon('close', 14)}</button></span>`).join('') + '<input id="tagIn" placeholder="Add a tag">';
      const inp = chips.querySelector('#tagIn');
      const addTag = () => { const v = inp.value.trim().replace(/,$/, ''); inp.value = ''; if (v && !(it.tags ||= []).includes(v)) { it.tags.push(v); touch() } };
      inp.onkeydown = e => { if ((e.key === 'Enter' || e.key === ',') && inp.value.trim()) { e.preventDefault(); addTag(); drawChips(); chips.querySelector('#tagIn').focus() }
        else if (e.key === 'Backspace' && !inp.value && it.tags?.length) { it.tags.pop(); touch(); drawChips(); chips.querySelector('#tagIn').focus() } };
      inp.onblur = () => { if (inp.value.trim()) { addTag(); drawChips() } };
    };
    drawChips(); chips.onclick = e => { const x = e.target.closest('[data-x]'); if (x) { it.tags.splice(+x.dataset.x, 1); touch(); drawChips() } else chips.querySelector('#tagIn').focus() };
    // extra blocks
    body.querySelectorAll('[data-flag]').forEach(cb => cb.onchange = () => { const f = cb.dataset.flag;
      if (f === 'bars') { if (cb.checked) it.bars = it.bars?.length ? it.bars : [['', '', .5]]; else delete it.bars } else if (cb.checked) it[f] = 1; else delete it[f];
      touch(); edContent(body, it, k, touch) });
    if (it.bars) { const box = body.querySelector('#bars'), draw = () => {
        box.innerHTML = it.bars.map((b, j) => `<div class="lrow bar"><span class="handle">${icon('drag', 16)}</span><input class="input" data-f="0" value="${esc(b[0])}" placeholder="Skill"><input class="input" data-f="1" value="${esc(b[1])}" placeholder="Level"><input type="range" min="0" max="100" data-f="2" value="${Math.round((+b[2] || 0) * 100)}" aria-label="Bar length"><button class="iconbtn danger" data-x aria-label="Remove">${icon('close', 16)}</button></div>`).join('');
        box.querySelectorAll('.lrow').forEach((r, j) => { r.oninput = e => { const f = +e.target.dataset.f; if (isNaN(f)) return; it.bars[j][f] = f === 2 ? +e.target.value / 100 : e.target.value; touch() };
          r.querySelector('[data-x]').onclick = () => { it.bars.splice(j, 1); touch(); draw() } });
        sortable(box, '.lrow', (a, b) => { move(it.bars, a, b); touch(); draw() }, { handle: '.handle' }) };
      draw(); body.querySelector('#addBar').onclick = () => { it.bars.push(['', '', .5]); touch(); draw() } }
  }

  /* images: from your computer (browse, drag in, or paste), reordered by dragging; the first leads the card */
  function edImages(body, it, k, touch) {
    const im = it.img ||= [];
    body.innerHTML = `<div class="stack"><label class="dropzone" id="drop"><input type="file" id="file" accept="image/*" multiple hidden>${icon('upload', 28)}<b>Add images from your computer</b><small>Click to browse, drag files here, or paste an image. JPG, PNG, WebP or GIF; large photos are resized for you.</small></label>
      <div class="imgs" id="imgs"></div><p class="hint" id="imgHint"></p></div>`;
    const grid = body.querySelector('#imgs'), drop = body.querySelector('#drop');
    const draw = () => {
      grid.innerHTML = im.map((m, j) => { const u = m._local || store.img(m.s);
        return `<figure class="img" style="margin:0"><div class="pv" ${u ? `style="background-image:url('${esc(u)}')"` : ''}>${u ? '' : esc(m.s.startsWith('/media/') ? 'Uploaded image' : m.s)}${j === 0 ? '<span class="badge">Cover</span>' : ''}${m._busy ? `<span class="busy"><span class="spin"></span></span>` : ''}
          <div class="tools">${j ? `<button class="iconbtn" data-cover title="Make this the cover">${icon('arrow-up', 16)}</button>` : ''}<button class="iconbtn danger" data-x title="Remove">${icon('trash', 16)}</button></div></div>
          <input class="input alt" data-alt value="${esc(m.a)}" placeholder="Describe the image (for screen readers)" ${m._busy ? 'disabled' : ''}></figure>` }).join('');
      grid.querySelectorAll('.img').forEach((f, j) => { f.querySelector('[data-alt]').oninput = e => { im[j].a = e.target.value; touch() };
        f.querySelector('[data-x]').onclick = () => { const was = im.splice(j, 1)[0]; touch(true); draw(); ui.toast('Image removed', () => { im.splice(j, 0, was); touch(true); draw() }) };
        f.querySelector('[data-cover]') && (f.querySelector('[data-cover]').onclick = () => { move(im, j, 0); touch(true); draw() }) });
      sortable(grid, '.img', (a, b) => { move(im, a, b); touch(true); draw() });
      body.querySelector('#imgHint').textContent = im.length ? 'Drag to reorder. The cover leads the card; the rest form its gallery.' : 'No images yet. Cards without images open on the title.';
      const tab = drawer?.querySelector('[data-tab="images"]'); if (tab) tab.innerHTML = `Images${im.length ? `<span class="count">${im.length}</span>` : ''}`;
    };
    const add = async files => {
      files = files.filter(f => f.type.startsWith('image/')); if (!files.length) return;
      for (const f of files) {
        const m = { s: '', a: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), _busy: 1, _local: URL.createObjectURL(f) }; im.push(m); draw();
        try { m.s = await store.upload(await shrink(f)); delete m._busy; touch(true) }
        catch (e) { im.splice(im.indexOf(m), 1); ui.toast(`${f.name}: ${e.message || 'upload failed'}`) }
        draw();
      }
    };
    body.querySelector('#file').onchange = e => { add([...e.target.files]); e.target.value = '' };
    ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { if (e.dataTransfer?.types.includes('Files')) { e.preventDefault(); drop.classList.add('over') } }));
    ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, () => drop.classList.remove('over')));
    drop.addEventListener('drop', e => { if (e.dataTransfer?.files?.length) { e.preventDefault(); add([...e.dataTransfer.files]) } });
    body.onpaste = e => { const f = [...e.clipboardData.files]; if (f.length) { e.preventDefault(); add(f) } };
    draw();
  }
  /* resize big photos to 1800 px WebP before upload (GIFs stay as they are, to keep animation) */
  async function shrink(file) {
    if (file.type === 'image/gif') return file;
    const bmp = await createImageBitmap(file), s = Math.min(1, 1800 / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const to = (t, q) => new Promise(r => c.toBlob(r, t, q)); let b = await to('image/webp', .86); if (!b || b.type !== 'image/webp') b = await to('image/jpeg', .88);
    b = b.size < file.size || !/^image\/(jpeg|png|webp)$/.test(file.type) ? b : file;
    if (b.size > 3.9 * 1024 * 1024) throw new Error('still over 4 MB after resizing'); return b;
  }

  function edButtons(body, it, k, touch) {
    const L = it.links ||= [];
    body.innerHTML = `<div class="stack"><div class="field"><div class="label">Buttons on the card <small>the first is the main (filled) one</small></div><div class="rows" id="rows"></div>
      <button class="btn ghost sm" id="addL" style="margin-top:8px">${icon('plus', 16)}Add a button</button><p class="hint">Use a full web address (https://…). Links to Behance, Instagram and the rest open in a new tab.</p></div></div>`;
    const box = body.querySelector('#rows'), draw = () => {
      box.innerHTML = L.length ? L.map((l, j) => `<div class="lrow"><span class="handle" title="Drag to reorder">${icon('drag', 16)}</span><input class="input" data-f="0" value="${esc(l[0])}" placeholder="Button text"><input class="input" data-f="1" value="${esc(l[1])}" placeholder="https://…"><button class="iconbtn danger" data-x aria-label="Remove">${icon('close', 16)}</button></div>`).join('') : '<div class="empty-row">No buttons on this card.</div>';
      box.querySelectorAll('.lrow').forEach((r, j) => { r.oninput = e => { L[j][+e.target.dataset.f] = e.target.value; touch() }; r.querySelector('[data-x]').onclick = () => { const was = L.splice(j, 1)[0]; touch(); draw(); ui.toast('Button removed', () => { L.splice(j, 0, was); touch(); draw() }) } });
      sortable(box, '.lrow', (a, b) => { move(L, a, b); touch(); draw() }, { handle: '.handle' });
      const tab = drawer?.querySelector('[data-tab="buttons"]'); if (tab) tab.innerHTML = `Buttons${L.length ? `<span class="count">${L.length}</span>` : ''}`;
    };
    body.querySelector('#addL').onclick = () => { L.push(['', 'https://']); touch(); draw(); box.querySelector('.lrow:last-child input')?.focus() };
    draw();
  }

  /* preview: the site's own card markup and stylesheet, in a frame that runs no scripts */
  function edPreview(body, it, k) {
    const out = u => icon(/\.pdf$/i.test(u) ? 'download' : 'external-link', 16);
    const pic = (g, cls = '') => { const u = store.img(g.s); return u ? `<button class="pic ok ${cls}"><img src="${esc(u)}" alt="${esc(g.a)}"></button>` : '' };
    let c = it.img?.length ? pic(it.img[0], 'lead') : '';
    c += `<header class="hd"><h2>${esc(it.t)}</h2><p class="k">${esc(it.k)}</p></header>`;
    if (it.hero) c += `<div class="hero"><img src="${esc(store.img('assets/img/vick.jpg'))}" alt=""><div class="d"><p><b>Vickhal Roopram</b><br>UX & Motion Designer<br>27 · South Africa</p></div></div>`;
    if (it.bars) c += `<div class="bars">${it.bars.map(b => `<div class="bar"><span>${esc(b[0])}</span><small>${esc(b[1])}</small><div><i style="--w:${(+b[2] || 0) * 100}%"></i></div></div>`).join('')}</div>`;
    if (it.contact) c += `<div class="d"><p>For work, collaborations or a chat about design and faith:</p></div><div class="cta-row"><a class="cta">${icon('mail', 18)}<span>Email ${EMAIL}</span></a><button class="cta ghost">${icon('copy', 18)}<span>Copy</span></button></div><p class="copy">${icon('phone', 16)}Cell <span class="num">+27 73 482 7221</span></p><div class="socials">${S.socials.filter(l => l[0]).map(([n, u]) => `<a class="soc">${brandIcon(n, 24)}<span>${esc(n)}<small>${esc(String(u).replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''))}</small></span>${out(u)}</a>`).join('')}</div>`;
    if (it.d) c += `<div class="d">${clean(it.d)}</div>`;
    if (it.links?.length) c += `<div class="cta-row">${it.links.filter(l => l[0]).map((l, j) => `<a class="cta${j ? ' ghost' : ''}"><span>${esc(l[0])}</span>${out(l[1])}</a>`).join('')}</div>`;
    if (it.img?.length > 1) c += `<div class="gal">${it.img.slice(1).map(g => pic(g)).join('')}</div>`;
    const theme = store.previewTheme?.() || 'dark';
    body.innerHTML = `<div class="preview"><iframe sandbox="allow-same-origin" title="Card preview"></iframe><small>The card as visitors see it (${theme} mode on the site). Links don’t open here.</small></div>`;
    body.querySelector('iframe').srcdoc = `<!DOCTYPE html><html data-theme="${theme}"><head><meta charset="utf-8">${store.previewHead}<style>html,body{height:auto;overflow:auto}#card{position:static;inset:auto;width:100%;height:auto;max-height:none;border:0;border-radius:0;box-shadow:none;animation:none;transform:none}.content{overflow:visible}</style></head>
      <body><div id="card" style="--accent:${esc(G(k).col || '#d71920')}"><div class="ch">${['chevron-left', 'chevron-right', 'close'].map(n => `<button>${icon(n, 20)}</button>`).join('')}</div><div class="content">${c}</div></div></body></html>`;
  }

  /* ── the menu behind the burger ── */
  function renderMenu() {
    const M = S.menu, dest = x => x.go.startsWith('mode:') ? x.go : x.go;
    const options = sel => Object.entries(GO).map(([v, l]) => `<option value="${v}" ${sel === v ? 'selected' : ''}>${l}</option>`).join('') +
      `<optgroup label="One section’s projects">${ORDER.filter(k => SECTIONS[k].slots === 'kb' && k !== 'ab').map(k => `<option value="mode:${k}" ${sel === 'mode:' + k ? 'selected' : ''}>${SECTIONS[k].title}</option>`).join('')}</optgroup>`;
    main.innerHTML = `<div class="page"><div class="phead"><div class="t"><div class="eyebrow">Site</div><h1>Menu</h1><p>The menu behind the burger, top right on the site. Rename, reorder, add or remove entries, and choose which sections appear under Projects.</p></div></div>
      <div class="cols"><div>
        <section class="panel"><h3>Top level</h3><p>What each entry opens. “Projects list” opens the sections below; a web link opens in a new tab.</p><div class="rows" id="mItems"></div>
          <button class="btn ghost sm" id="addM" style="margin-top:10px" ${M.items.length >= 12 ? 'disabled' : ''}>${icon('plus', 16)}Add a menu entry</button></section>
        <section class="panel"><h3>Under “Projects”</h3><p>The sections listed when someone opens Projects, and the name the menu uses for each.</p><div class="rows" id="mProj"></div>
          <button class="btn ghost sm" id="addP" style="margin-top:10px">${icon('plus', 16)}Add a section</button></section></div>
        <aside class="mprev" id="mprev"></aside></div></div>`;
    const items = main.querySelector('#mItems'), proj = main.querySelector('#mProj');
    const preview = () => { main.querySelector('#mprev').innerHTML = `<div class="eyebrow">Preview</div>${M.items.map(x => `<div class="mrow"><span>${esc(x.label || 'Untitled')}</span>${x.go === 'link' ? icon('external-link', 16) : x.go === 'projects' || x.go.startsWith('mode:') ? icon('chevron-right', 18) : ''}</div>`).join('') || '<p class="hint">The menu is empty.</p>'}
      ${M.items.some(x => x.go === 'projects') ? `<div class="sub"><div class="eyebrow">Projects ›</div>${M.projects.map(p => `<div class="mrow" style="--c:${glow(p.key)}"><span style="display:flex;align-items:center"><i class="dot"></i>${esc(p.label || SECTIONS[p.key]?.title)}</span><small>${G(p.key)?.items.filter(i => !/^open slot$/i.test(i.t)).length || 0}</small></div>`).join('')}</div>` : ''}` };
    const save = () => { changed('menu'); preview(); renderSide() };
    const drawItems = () => {
      items.innerHTML = M.items.map((x, j) => `<div class="lrow menu${x.go === 'link' ? ' link' : ''}"><span class="handle" title="Drag to reorder">${icon('drag', 16)}</span>
        <input class="input" data-f="label" value="${esc(x.label)}" placeholder="Label" maxlength="40"><select class="select" data-f="go">${options(dest(x))}</select>
        ${x.go === 'link' ? `<input class="input" data-f="href" value="${esc(x.href || 'https://')}" placeholder="https://…">` : ''}<button class="iconbtn danger" data-x aria-label="Remove">${icon('close', 16)}</button></div>`).join('') || '<div class="empty-row">No entries. Visitors would see an empty menu.</div>';
      items.querySelectorAll('.lrow').forEach((r, j) => {
        r.querySelector('[data-f="label"]').oninput = e => { M.items[j].label = e.target.value; save() };
        r.querySelector('[data-f="go"]').onchange = e => { const x = M.items[j], old = GO[x.go] || ''; x.go = e.target.value; if (x.go === 'link') x.href ||= 'https://'; else delete x.href;
          if (!x.label || x.label === old) x.label = GO[x.go]?.split(' ')[0] || SECTIONS[x.go.slice(5)]?.title || x.label; save(); drawItems() };
        r.querySelector('[data-f="href"]') && (r.querySelector('[data-f="href"]').oninput = e => { M.items[j].href = e.target.value; save() });
        r.querySelector('[data-x]').onclick = () => { const was = M.items.splice(j, 1)[0]; save(); drawItems(); ui.toast(`Removed “${was.label}”`, () => { M.items.splice(j, 0, was); save(); drawItems() }) };
      });
      sortable(items, '.lrow', (a, b) => { move(M.items, a, b); save(); drawItems() }, { handle: '.handle' });
      main.querySelector('#addM').disabled = M.items.length >= 12;
    };
    const drawProj = () => {
      proj.innerHTML = M.projects.map((p, j) => `<div class="lrow menu" style="--c:${glow(p.key)}"><span class="handle" title="Drag to reorder">${icon('drag', 16)}</span>
        <select class="select" data-f="key">${ORDER.filter(k => SECTIONS[k].slots === 'kb').map(k => `<option value="${k}" ${p.key === k ? 'selected' : ''}>${SECTIONS[k].title}</option>`).join('')}</select>
        <input class="input" data-f="label" value="${esc(p.label)}" placeholder="${esc(SECTIONS[p.key]?.title)}" maxlength="40"><button class="iconbtn danger" data-x aria-label="Remove">${icon('close', 16)}</button></div>`).join('') || '<div class="empty-row">No sections under Projects.</div>';
      proj.querySelectorAll('.lrow').forEach((r, j) => {
        r.querySelector('[data-f="key"]').onchange = e => { M.projects[j].key = e.target.value; save(); drawProj() };
        r.querySelector('[data-f="label"]').oninput = e => { M.projects[j].label = e.target.value; save() };
        r.querySelector('[data-x]').onclick = () => { const was = M.projects.splice(j, 1)[0]; save(); drawProj(); ui.toast('Section removed from the menu', () => { M.projects.splice(j, 0, was); save(); drawProj() }) };
      });
      sortable(proj, '.lrow', (a, b) => { move(M.projects, a, b); save(); drawProj() }, { handle: '.handle' });
    };
    main.querySelector('#addM').onclick = () => { M.items.push({ label: 'New link', go: 'link', href: 'https://' }); save(); drawItems(); items.querySelector('.lrow:last-child input')?.select() };
    main.querySelector('#addP').onclick = () => { const k = ORDER.find(k => SECTIONS[k].slots === 'kb' && !M.projects.some(p => p.key === k)) || 'gd'; M.projects.push({ key: k, label: SECTIONS[k].title }); save(); drawProj() };
    drawItems(); drawProj(); preview();
  }

  /* ── social links on the Contact card ── */
  function renderSocials() {
    const L = S.socials;
    main.innerHTML = `<div class="page" style="max-width:860px"><div class="phead"><div class="t"><div class="eyebrow">Site</div><h1>Social links</h1><p>The links on the Contact card, in this order. Name a link after its network (Behance, Instagram, LinkedIn, Threads, X, Facebook) and it gets that brand’s icon.</p></div>
      <div class="acts"><button class="btn primary" id="addS" ${L.length >= 12 ? 'disabled' : ''}>${icon('plus', 16)}Add a link</button></div></div><section class="panel"><div class="rows" id="soc"></div></section></div>`;
    const box = main.querySelector('#soc'), save = () => { changed('socials'); renderSide() };
    const draw = () => {
      box.innerHTML = L.map((l, j) => `<div class="lrow soc"><span class="handle" title="Drag to reorder">${icon('drag', 16)}</span><span class="brand-ic">${brandIcon(l[0], 22)}</span><input class="input" data-f="0" value="${esc(l[0])}" placeholder="Name (e.g. Behance)"><input class="input" data-f="1" value="${esc(l[1])}" placeholder="https://…"><button class="iconbtn danger" data-x aria-label="Remove">${icon('close', 16)}</button></div>`).join('') || '<div class="empty-row">No social links yet.</div>';
      box.querySelectorAll('.lrow').forEach((r, j) => {
        r.oninput = e => { const f = +e.target.dataset.f; L[j][f] = e.target.value; if (f === 0) r.querySelector('.brand-ic').innerHTML = brandIcon(e.target.value, 22); save() };
        r.querySelector('[data-x]').onclick = () => { const was = L.splice(j, 1)[0]; save(); draw(); ui.toast(`Removed ${was[0] || 'link'}`, () => { L.splice(j, 0, was); save(); draw() }) };
      });
      sortable(box, '.lrow', (a, b) => { move(L, a, b); save(); draw() }, { handle: '.handle' });
      main.querySelector('#addS').disabled = L.length >= 12;
    };
    main.querySelector('#addS').onclick = () => { L.push(['', 'https://']); save(); draw(); box.querySelector('.lrow:last-child input')?.focus() };
    draw();
  }

  renderAll();
  /* the store can push newer content (another tab, or Claude after a sync) */
  const handle = {
    ui,
    replace(next) { Object.assign(S, next); if (S.edit && document.activeElement && drawer?.contains(document.activeElement)) { renderSide(); return } if (S.edit && !G(S.edit.k)?.items[S.edit.i]) closeEditor(); renderAll() },
    state: S,
  };
  store.attach?.(handle);
  return handle;
}
