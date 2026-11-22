#!/usr/bin/env node
/**
 * Writes the files search engines and AI assistants read, from the site's own content (src/content.js: CH and PROFILE).
 * The synth is drawn by JavaScript and WebGL, which most crawlers and AI assistants don't run, so these give them
 * (and anyone without WebGL, or in a hurry) the same portfolio as plain, fast HTML and text.
 *
 *   index.html            the block between <!-- generated:seo --> markers: title, description, canonical,
 *                         Open Graph and X cards, and structured data (JSON-LD: Person, ProfilePage, WebSite)
 *   portfolio/index.html  the whole portfolio on one page: every project, the CV facts and contact
 *   llms.txt              a short guide for AI assistants (https://llmstxt.org)
 *   robots.txt            who may crawl what (everyone, everything but /admin and /api), and where the sitemap is
 *   sitemap.xml           the two pages
 *   library/manifest.json what /library/ shows: every token (from tokens.css), component (src/**) and asset, with sizes
 *
 *   npm run generate          write them
 *   npm run generate:check    CI: fail if the search files are out of date (warn for the library manifest)
 *
 * No dependencies. Content edited in /admin lives in Netlify Blobs, not git, so it isn't in these files until it's
 * copied into src/content.js (docs/SEO.md).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { CH, LINKS, PROFILE as P } from '../src/content.js';

const CHECK = process.argv.includes('--check');
const SITE = P.url.replace(/\/?$/, '/');
const abs = (path) => new URL(path.replace(/^\//, ''), SITE).href;

/* ── helpers ─────────────────────────────────────────────────────────────────────────────────────────────── */
const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const text = (html) =>
  String(html ?? '')
    .replace(/<br[^>]*>/g, ' ')
    .replace(/<\/(p|li|h3|h4|div|small|time|b)>|<(p|li|h3|h4|div)\b[^>]*>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, '’')
    .replace(/\s+/g, ' ')
    .trim();
const slug = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
const firstSentence = (s) => (s.match(/^.+?[.!?](\s|$)/)?.[0] || s).trim();
const summary = (it) => it.sum || firstSentence(text(it.d)); // a project's one line: its sum, else its first sentence
const real = (it) => it && it.t !== 'Open slot';

/* width and height of a local image, read from its header (JPEG, PNG, WebP, SVG), so the page doesn't jump as it loads */
const dims = new Map();
function size(path) {
  if (dims.has(path)) return dims.get(path);
  let out = null;
  try {
    const b = readFileSync(path);
    if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') out = [b.readUInt32BE(16), b.readUInt32BE(20)];
    else if (b[0] === 0xff && b[1] === 0xd8) {
      for (let i = 2; i < b.length; ) {
        const m = b[i + 1],
          len = b.readUInt16BE(i + 2);
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          out = [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
          break;
        }
        i += 2 + len;
      }
    } else if (b.toString('ascii', 8, 12) === 'WEBP') {
      const k = b.toString('ascii', 12, 16);
      if (k === 'VP8X') out = [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
      else if (k === 'VP8 ') out = [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
      else if (k === 'VP8L') {
        const n = b.readUInt32LE(21);
        out = [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)];
      }
    } else if (path.endsWith('.svg')) {
      const v = b.toString('utf8').match(/viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/);
      if (v) out = [Math.round(+v[1]), Math.round(+v[2])];
    }
  } catch {
    out = null;
  }
  dims.set(path, out);
  return out;
}
const img = (src, alt, cls = '') => {
  const d = size(src);
  return `<img src="/${esc(src)}" alt="${esc(alt)}"${d ? ` width="${d[0]}" height="${d[1]}"` : ''} loading="lazy" decoding="async"${cls ? ` class="${cls}"` : ''}>`;
};

/* remove an element and everything inside it (handles nested divs) */
function cut(html, open) {
  let i;
  while ((i = html.indexOf(open)) > -1) {
    let depth = 0,
      j = i;
    const re = /<(\/?)div\b[^>]*>/g;
    re.lastIndex = i;
    for (let m; (m = re.exec(html)); ) {
      depth += m[1] ? -1 : 1;
      if (!depth) {
        j = m.index + m[0].length;
        break;
      }
    }
    html = html.slice(0, i) + html.slice(j);
  }
  return html;
}
const unwrap = (html, open) => {
  let i;
  while ((i = html.indexOf(open)) > -1) {
    const inner = cut(html.slice(i), open); // what follows once the element is gone
    const whole = html.slice(i, html.length - inner.length);
    html = html.slice(0, i) + whole.slice(open.length, -'</div>'.length) + inner;
  }
  return html;
};

/* a card's body as plain, crawlable HTML: its pictures in place, the phone and desktop variants merged, classes dropped */
function body(it) {
  const used = new Set(),
    vids = it.vid || [];
  let h = String(it.d || '');
  // the steps written out for phones carry text; the desktop shows the same steps as one picture. Keep both, once.
  h = unwrap(h, '<div class="mob-only">');
  h = unwrap(h, '<div class="desk-only">');
  h = h
    .replace(/<div class="(fig|ill) \1-(\d+)"><\/div>/g, (_, kind, n) => {
      const im = it.img?.[+n];
      if (!im) return '';
      used.add(+n);
      return kind === 'fig' ? `<figure>${img(im.s, im.a)}</figure>` : img(im.s, im.a, 'ill');
    })
    .replace(/<div class="vid vid-(\d+)"><\/div>/g, (_, n) => {
      const v = vids[+n];
      return v ? `<figure>${img(v.p, v.a)}<figcaption>${esc(v.a)}</figcaption></figure>` : '';
    })
    .replace(/<br class="dbr">/g, ' ')
    .replace(/<span><b>[A-Z][a-z]?<\/b>([^<]+)<\/span>/g, '<span>$1</span>') // tool badges: "Ai Illustrator" → "Illustrator"
    .replace(/ class="(?!quote\b|tl\b|tags\b|steps\b|tools\b)[^"]*"/g, '')
    .replace(/<div>\s*<\/div>/g, '');
  const rest = (it.img || []).filter((_, i) => !used.has(i));
  return { html: h, rest };
}

/* ── the pages ───────────────────────────────────────────────────────────────────────────────────────────── */
const SECTIONS = [
  ['ux', 'UX/UI design', 'Case studies, the studio I design for, and how I work.'],
  ['gd', 'Graphic design', 'Identity, packaging, editorial, campaigns and type.'],
  ['mo', 'Motion & 3D', 'Animation, motion graphics and 3D.'],
  ['xp', 'Experimental', 'Things I build to find out how they work.'],
];
const info = (t) => CH.info.items.find((x) => x.k === t);
const projects = SECTIONS.flatMap(([k, name]) =>
  CH[k].items.filter(real).map((it) => ({ it, k, name, id: `${k}-${slug(it.t)}` })),
);

const sameAs = LINKS.map(([, u]) => u).filter((u) => !/facebook\.com/.test(u));
const person = {
  '@type': 'Person',
  '@id': `${SITE}#vick`,
  name: P.name,
  alternateName: P.short,
  url: SITE,
  image: abs(P.image),
  email: `mailto:${P.email}`,
  jobTitle: P.jobTitle,
  description: P.intro,
  worksFor: { '@type': 'Organization', name: P.employer },
  address: { '@type': 'PostalAddress', addressCountry: P.countryCode },
  nationality: { '@type': 'Country', name: P.country },
  knowsAbout: P.skills,
  alumniOf: [...new Set(P.education.map(([, school]) => school))].map((name) => ({
    '@type': 'EducationalOrganization',
    name,
  })),
  award: P.awards,
  sameAs,
};
const website = {
  '@type': 'WebSite',
  '@id': `${SITE}#site`,
  name: P.brand,
  url: SITE,
  inLanguage: 'en-ZA',
  publisher: { '@id': person['@id'] },
};
const jsonld = (graph) =>
  `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;

/* the <head> block of index.html */
function headBlock() {
  const t = esc(P.title),
    d = esc(P.description),
    im = abs(P.image),
    [w, h] = size(P.image) || [1200, 630];
  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}">`,
    `<meta name="author" content="${esc(P.name)}">`,
    `<link rel="canonical" href="${SITE}">`,
    `<meta property="og:type" content="profile">`,
    `<meta property="og:site_name" content="${esc(P.brand)}">`,
    `<meta property="og:locale" content="en_ZA">`,
    `<meta property="og:url" content="${SITE}">`,
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    `<meta property="og:image" content="${im}">`,
    `<meta property="og:image:width" content="${w}">`,
    `<meta property="og:image:height" content="${h}">`,
    `<meta property="og:image:alt" content="${esc(P.imageAlt)}">`,
    `<meta property="profile:first_name" content="${esc(P.name.split(' ')[0])}">`,
    `<meta property="profile:last_name" content="${esc(P.name.split(' ').slice(1).join(' '))}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<link rel="alternate" type="text/html" href="${SITE}portfolio/" title="The portfolio as one plain page">`,
    `<link rel="help" type="text/plain" href="${SITE}llms.txt" title="About this site, for AI assistants">`,
    jsonld([
      {
        '@type': 'ProfilePage',
        '@id': `${SITE}#page`,
        url: SITE,
        name: P.title,
        mainEntity: { '@id': person['@id'] },
        isPartOf: { '@id': website['@id'] },
      },
      person,
      website,
    ]),
  ].join('\n    ');
}

/* /portfolio/: everything on one fast page */
function portfolioPage() {
  const url = `${SITE}portfolio/`;
  const card = ({ it, id }) => {
    const { html, rest } = body(it);
    const links = (it.links || []).map(([l, u]) => `<a href="${esc(u)}" rel="noopener">${esc(l)}</a>`).join(' · ');
    const tags = (it.tags || []).map((t) => `<span>${esc(t)}</span>`).join('');
    return `<article id="${id}">
  <h3>${esc(it.t)}</h3>${it.k ? `\n  <p class="kicker">${esc(it.k)}</p>` : ''}${it.sum ? `\n  <p class="sum">${esc(it.sum)}</p>` : ''}
  ${html}${rest.length ? `\n  <div class="gallery">${rest.map((im) => img(im.s, im.a)).join('')}</div>` : ''}${tags ? `\n  <p class="tags">${tags}</p>` : ''}${links ? `\n  <p class="links">${links}</p>` : ''}
</article>`;
  };
  const section = ([k, name, lede]) => `<section id="${k}" aria-labelledby="${k}-h">
<h2 id="${k}-h">${esc(name)}</h2>
<p class="lede">${esc(lede)}</p>
${projects
  .filter((p) => p.k === k)
  .map(card)
  .join('\n')}
</section>`;
  const about = CH.ab.items
    .slice(1)
    .map((it) => `<h3>${esc(it.t)}</h3>${it.d}`)
    .join('\n');
  const list = (rows) => `<ul>${rows.map((r) => `<li>${r}</li>`).join('')}</ul>`;
  const tools = CH.tl.items.map((it) => `<li><b>${esc(it.t)}</b>: ${esc(text(it.d))}</li>`).join('');
  const life = CH.life.items.map((it) => `<li><b>${esc(it.t)}</b>: ${esc(text(it.d))}</li>`).join('');
  const items = projects.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'CreativeWork',
      '@id': `${url}#${p.id}`,
      name: p.it.t,
      genre: p.name,
      description: summary(p.it),
      url: `${url}#${p.id}`,
      ...(p.it.img?.[0] ? { image: abs(p.it.img[0].s) } : {}),
      creator: { '@id': person['@id'] },
    },
  }));
  const title = `Portfolio of ${P.name}: UX/UI, graphic and motion design`;
  const desc = `Every project by ${P.name} on one page: UX/UI case studies, graphic design, motion and 3D, with experience, awards, education and contact.`;
  return `<!doctype html>
<!-- Generated by scripts/generate.mjs from src/content.js. Don't edit by hand: change the content and run npm run generate. -->
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${abs(P.image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#24160f">
<link rel="icon" href="/assets/ui/logo-on-dark.svg" type="image/svg+xml">
<link rel="stylesheet" href="/src/styles/tokens.css">
<link rel="stylesheet" href="/portfolio/portfolio.css">
${jsonld([{ '@type': 'ProfilePage', '@id': `${url}#page`, url, name: title, mainEntity: { '@id': person['@id'] } }, person, { '@type': 'ItemList', '@id': `${url}#work`, name: `Projects by ${P.name}`, itemListElement: items }])}
</head>
<body>
<a class="skip" href="#work">Skip to the projects</a>
<header class="top">
  <a href="/" class="brand"><img src="/assets/ui/logo-on-dark.svg" width="145" height="50" alt="${esc(P.brand)}"></a>
  <nav aria-label="Sections"><a href="#work">Work</a><a href="#cv">CV</a><a href="#about">About</a><a href="#contact" class="cta">Contact</a></nav>
</header>
<main>
<section class="hero" aria-labelledby="name">
  <p class="eyebrow">${esc(P.role)} · ${esc(P.country)}</p>
  <h1 id="name">${esc(P.name)}</h1>
  <p class="tagline">${esc(P.tagline)}</p>
  <p>${esc(P.intro)}</p>
  <p class="actions"><a class="cta" href="mailto:${esc(P.email)}">Email me</a> <a class="ghost" href="/">Play the portfolio as a synth</a></p>
</section>
<nav class="toc" id="work" aria-label="Projects">
  <h2>Work</h2>
  <ul>${SECTIONS.map(
    ([k, name]) =>
      `<li><a href="#${k}">${esc(name)}</a><ul>${projects
        .filter((p) => p.k === k)
        .map((p) => `<li><a href="#${p.id}">${esc(p.it.t)}</a></li>`)
        .join('')}</ul></li>`,
  ).join('')}</ul>
</nav>
${SECTIONS.map(section).join('\n')}
<section id="cv" aria-labelledby="cv-h">
<h2 id="cv-h">Experience, awards and education</h2>
<h3>Experience</h3>
${list(P.work.map(([role, org, from, to]) => `<b>${esc(role)}</b>, ${esc(org)} <time>${from}–${to || 'now'}</time>`))}
<h3>Awards and recognition</h3>
${info('Awards & recognition')?.d || list(P.awards.map(esc))}
<h3>Education</h3>
${list(P.education.map(([what, where, when]) => `<b>${esc(what)}</b>, ${esc(where)} <time>${esc(when)}</time>`))}
<h3>Tools</h3>
<ul class="cols">${tools}</ul>
</section>
<section id="about" aria-labelledby="about-h">
<h2 id="about-h">About</h2>
${about}
<h3>Off the clock</h3>
<ul>${life}</ul>
</section>
<section id="contact" aria-labelledby="contact-h">
<h2 id="contact-h">Contact</h2>
<p>A job, a project or a chat about design: all welcome.</p>
<p class="actions"><a class="cta" href="mailto:${esc(P.email)}">${esc(P.email)}</a></p>
<ul class="social">${LINKS.map(([l, u]) => `<li><a href="${esc(u)}" rel="me noopener">${esc(l)}</a></li>`).join('')}</ul>
</section>
</main>
<footer><p>© ${esc(P.name)}. All rights reserved. <a href="/">Play the synth</a></p></footer>
</body>
</html>
`;
}

function llms() {
  const line = (p) => `- [${p.it.t}](${SITE}portfolio/#${p.id}): ${summary(p.it)}`;
  return `# ${P.name} (${P.brand})

> ${P.name} (${P.short}) is a ${P.role} in ${P.country}. ${P.jobTitle} at ${P.employer}. ${P.tagline}

The home page (${SITE}) is a playable 3D cardboard synthesizer that needs JavaScript and WebGL. The same portfolio as plain HTML, with every project, is at ${SITE}portfolio/.

- Contact: ${P.email} (work, projects and collaborations welcome)
- Location: ${P.country}
- Skills: ${P.skills.join(', ')}

## Portfolio

- [The whole portfolio on one page](${SITE}portfolio/): every project, experience, awards, education and contact
${SECTIONS.map(
  ([k, name]) =>
    `\n## ${name}\n\n${projects
      .filter((p) => p.k === k)
      .map(line)
      .join('\n')}`,
).join('\n')}

## Experience

${P.work.map(([role, org, from, to]) => `- ${role}, ${org} (${from}–${to || 'now'})`).join('\n')}

## Awards

${P.awards.map((a) => `- ${a}`).join('\n')}

## Education

${P.education.map(([what, where, when]) => `- ${what}, ${where} (${when})`).join('\n')}

## Elsewhere

${LINKS.map(([l, u]) => `- [${l}](${u})`).join('\n')}
`;
}

const robots =
  () => `# ${P.brand}: everyone is welcome to read the portfolio, including search engines and AI assistants.
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /library/

Sitemap: ${SITE}sitemap.xml
`;

const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}</loc></url>
  <url><loc>${SITE}portfolio/</loc></url>
</urlset>
`;

/* ── the component and asset library (/library/) ─────────────────────────────────────────────────────────── */
function manifest() {
  const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter((f) => existsSync(f));
  const head = (src) =>
    (src.match(/^\s*\/\*\*?([\s\S]*?)\*\//)?.[1] || '')
      .replace(/^\s*\*\s?/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  const brief = (s) => (s.length > 260 ? s.slice(0, 257).replace(/\s\S*$/, '') + '…' : s);
  // tokens, by tier, straight from tokens.css
  const css = readFileSync('src/styles/tokens.css', 'utf8');
  const tiers = [];
  for (const line of css.slice(css.indexOf(':root {'), css.indexOf('@supports')).split('\n')) {
    const tier = line.match(/\/\* ── (\d · [^─]+?) ─/);
    if (tier) tiers.push({ tier: tier[1].trim(), tokens: [] });
    const tok = line.match(/^\s*(--[\w-]+):\s*(.+?);\s*(?:\/\* (.*?) \*\/)?\s*$/);
    if (tok && tiers.length) tiers.at(-1).tokens.push({ name: tok[1], value: tok[2], note: tok[3] || '' });
  }
  // components: every module and stylesheet, with its header comment and what it exports
  const LAYERS = ['core', 'atoms', 'molecules', 'organisms', 'page', 'styles'];
  const components = files
    .filter((f) => /^src\/.+\.(js|css)$/.test(f))
    .map((f) => {
      const src = readFileSync(f, 'utf8'),
        layer = f.split('/')[1].replace(/\.(js|css)$/, '');
      return {
        file: f,
        layer: LAYERS.includes(layer) ? layer : 'app',
        about: brief(head(src)),
        exports: [...src.matchAll(/^export (?:async )?(?:function\*?|const|let|class) ([\w$]+)/gm)].map((m) => m[1]),
        lines: src.split('\n').length,
      };
    });
  // assets: every file under assets/, with its size, pixel size and the files that use it
  const code = files.filter(
    (f) => /\.(js|css|html)$/.test(f) && !f.startsWith('library/') && !f.startsWith('portfolio/'),
  );
  const sources = Object.fromEntries(code.map((f) => [f, readFileSync(f, 'utf8')]));
  const assets = files
    .filter((f) => f.startsWith('assets/') && !/\.(txt|md)$/.test(f))
    .map((f) => {
      const name = f.split('/').pop(),
        stem = name.replace(/\.\w+$/, '').replace(/@2x$/, ''),
        re = new RegExp(`['"\`/(]${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(@2x)?(\\.\\w+)?['"\`)]`);
      const d = size(f);
      return {
        path: f,
        kind: f.split('/')[1],
        bytes: readFileSync(f).length,
        ...(d ? { w: d[0], h: d[1] } : {}),
        usedBy: Object.keys(sources).filter((s) => re.test(sources[s])),
      };
    });
  return JSON.stringify({ tiers, components, assets }, null, 1) + '\n';
}

/* ── write or check ──────────────────────────────────────────────────────────────────────────────────────── */
if (P.title.length > 60)
  console.warn(`! PROFILE.title is ${P.title.length} characters; search results cut it after about 60.`);
if (P.description.length > 160)
  console.warn(`! PROFILE.description is ${P.description.length} characters; keep it under 160.`);

const index = readFileSync('index.html', 'utf8');
const START =
    '<!-- generated:seo (scripts/generate.mjs from src/content.js PROFILE; edit there, then npm run generate) -->',
  END = '<!-- /generated:seo -->';
if (!index.includes(START) || !index.includes(END))
  throw new Error(`index.html needs the ${START} … ${END} markers in <head>.`);
const nextIndex = index.replace(
  new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END}`),
  `${START}\n    ${headBlock()}\n    ${END}`,
);

/* HTML goes through Prettier (the same version and settings as `npm run format`), so generated files match the rest of the repo */
function pretty(file, src) {
  for (const [cmd, args] of [
    ['prettier', []],
    ['npx', ['--yes', 'prettier@3.8.1']],
  ]) {
    const r = spawnSync(cmd, [...args, '--stdin-filepath', file], {
      input: src,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
    if (r.status === 0) return r.stdout;
  }
  throw new Error('Prettier is needed to format the generated HTML (npx prettier@3.8.1). Is npm online?');
}

const out = {
  'index.html': pretty('index.html', nextIndex),
  'portfolio/index.html': pretty('portfolio/index.html', portfolioPage()),
  'llms.txt': llms(),
  'robots.txt': robots(),
  'sitemap.xml': sitemap(),
  'library/manifest.json': pretty('library/manifest.json', manifest()),
};
let stale = 0;
for (const [file, body] of Object.entries(out)) {
  const now = existsSync(file) ? readFileSync(file, 'utf8') : null;
  if (now === body) continue;
  if (CHECK) {
    // the library's manifest is a convenience: stale is a warning. What search engines read must be current: an error.
    const soft = file.startsWith('library/'),
      level = soft ? 'warning' : 'error';
    if (!soft) stale++;
    const msg = `${file} is out of date with the code. Run \`npm run generate\` and commit the result.`;
    console.log(
      process.env.GITHUB_ACTIONS
        ? `::${level} file=${file},title=Generated files::${msg}`
        : `${soft ? '!' : '✗'} ${msg}`,
    );
  } else {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
    console.log(`wrote ${file}`);
  }
}
if (CHECK && stale) process.exit(1);
console.log(CHECK ? `✓ Generated files are up to date (${Object.keys(out).length}).` : `✓ ${projects.length} projects`);
