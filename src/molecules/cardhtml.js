/* A project, About or Contact page as markup: the work first, a tight headline group, then the story, links and gallery.
   Shared by the desktop card (organisms/card.js) and the phone page (organisms/pocket.js). No 3D in here, so the phone page stays light. */
import { CH, LINKS } from '../core/data.js';
import { icon, socialIcon } from '../atoms/icons.js';

const out = (url) => icon(/\.pdf$/i.test(url) ? 'download' : 'external-link', 16); // where a link goes: a file to save, or another site
export const EMAIL = 'vickhal10@gmail.com';
/* images shimmer until they arrive, then fade in. A portrait image (clearly taller than wide) is marked tall, so it fits the screen's height */
const pic = (g, cls = '') =>
  `<button class="pic ${cls}" data-src="${g.s}" aria-label="Enlarge: ${g.a}"><img src="${g.s}" alt="${g.a}" loading="lazy" onload="this.parentNode.classList.add('ok');if(this.naturalHeight>this.naturalWidth*1.15)this.parentNode.classList.add('tall')" onerror="this.parentNode.classList.add('ok')"></button>`;
/* About is one page you scroll: every About item under the next, each a section you can be sent to (openCard scrolls to it) */
export const ONE = 'ab';
export function cardHTML(ch, i) {
  if (ch === ONE && i !== -1)
    return (
      cardHTML(ch, -1) +
      CH[ch].items
        .slice(1)
        .map(
          (x, n) =>
            `<section class="d sec" data-sec="${n + 1}"><h3>${x.t}</h3><p class="k">${x.k}</p>${x.d || ''}</section>`,
        )
        .join('')
    );
  const it = CH[ch].items[Math.max(0, i)],
    acc = it.acc ? ` style="--accent:${it.acc}"` : '',
    hd = `<header class="hd${it.case ? ' case' : ''}"${acc}><h2>${it.t}</h2>${it.k ? `<p class="k">${it.k}</p>` : ''}</header>`;
  /* a case study (case:1) leads with its title, then the first image whole; everything else leads with a cropped image */
  /* introFirst:1 moves the opening paragraph up, between the title and the cover image */
  let d = it.d,
    intro = '';
  if (it.case && it.introFirst && d) {
    const m = d.match(/^\s*<p>[\s\S]*?<\/p>/);
    if (m) {
      intro = `<div class="d case intro"${acc}>${m[0]}</div>`;
      d = d.slice(m[0].length);
    }
  }
  let h = it.case
    ? hd + intro + (it.img?.length ? pic(it.img[0], 'fig hero-pic') : '')
    : (it.img?.length ? pic(it.img[0], 'lead') : '') + hd;
  if (it.hero)
    h += `<div class="hero"><img src="assets/img/vick.jpg" alt="Portrait of Vickhal Roopram"><div class="d"><p><b>Vickhal Roopram</b><br>UX & Motion Designer<br>27 · South Africa</p></div></div>`;
  if (it.bars)
    h += `<div class="bars">${it.bars.map((b) => `<div class="bar"><span>${b[0]}</span><small>${b[1]}</small><div><i style="--w:${b[2] * 100}%"></i></div></div>`).join('')}</div>`;
  if (it.life) h += CH.life.items.map((x) => `<div class="d"><h3>${x.t}</h3>${x.d}</div>`).join('');
  if (it.contact)
    h +=
      `<div class="d"><p>A job, a project, or a long chat about design, faith or D&amp;D. All welcome:</p></div><div class="cta-row"><a class="cta" href="mailto:${EMAIL}">${icon('mail', 18)}<span>Email ${EMAIL}</span></a><button class="cta ghost" id="cp">${icon('copy', 18)}<span>Copy</span></button></div>` +
      `<p class="copy">${icon('phone', 16)}Cell <span class="num">+27 73 482 7221</span></p><div class="socials">${LINKS.map(([n, u]) => `<a class="soc" href="${u}" target="_blank" rel="noopener">${socialIcon(n)}<span>${n}<small>${u.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '')}</small></span>${out(u)}</a>`).join('')}</div>`;
  /* <div class="fig fig-N"></div> in a description places img[N] right there, between the sections (a class-only marker, so it survives
     the admin's clean-up); images not placed that way still go in the gallery at the end */
  const placed = new Set();
  const cs = it.case ? ' case' : '';
  /* <div class="vid vid-N"></div> places it.vid[N]: a short muted loop that plays by itself (with a poster while it loads) */
  const vid = (v) =>
    `<figure class="clip"><video src="${v.s}" poster="${v.p}" autoplay muted loop playsinline preload="auto" oncanplay="this.muted=true;this.play().catch(()=>{})" aria-label="${v.a}"></video></figure>`;
  if (d)
    h += `<div class="d${cs}"${acc}>${d.replace(/<div class="(fig|ill|vid) \1-(\d+)"><\/div>/g, (m, kind, n) => {
      if (kind === 'vid') return it.vid?.[+n] ? vid(it.vid[+n]) : '';
      const g = it.img?.[+n];
      if (!g || +n === 0) return '';
      placed.add(+n);
      return kind === 'fig' ? pic(g, 'fig') : `<img class="ill" src="${g.s}" alt="${g.a}" loading="lazy">`;
    })}</div>`;
  const rest = (it.img || []).slice(1).filter((g, k) => !placed.has(k + 1));
  const gal = rest.length ? `<div class="gal${cs}">${rest.map((g) => pic(g)).join('')}</div>` : '';
  const links = it.links
    ? `<div class="cta-row${cs}">${it.links.map((l, k) => `<a class="cta${k ? ' ghost' : ''}" href="${l[1]}" target="_blank" rel="noopener"><span>${l[0]}</span>${out(l[1])}</a>`).join('')}</div>`
    : '';
  h += it.case ? gal + links : links + gal; // a case study ends on its call to action
  return h;
}
