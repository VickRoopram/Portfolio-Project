# Search engines and AI assistants

> **Who this is for:** anyone changing the content or the page's `<head>`.
> **Why:** the synth is drawn by JavaScript and WebGL. Google runs JavaScript, but most AI assistants and many crawlers don't, and a WebGL scene has no text to read. So the same portfolio is also published as plain HTML and text, generated from the content.
> Added 22 Nov 2026.

## 1. What's generated, and from what

`npm run generate` (`scripts/generate.mjs`) reads `src/content.js` (`CH`, `LINKS`, `PROFILE`) and writes:

| File                                                       | For                                                           | Holds                                                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `index.html` `<head>`, between the `generated:seo` markers | Search results, link previews                                 | Title, description, canonical URL, Open Graph and X cards, structured data (JSON-LD: `Person`, `ProfilePage`, `WebSite`) |
| `portfolio/index.html`                                     | People in a hurry, screen readers, no-WebGL devices, crawlers | Every project, CV facts, About and contact on one fast page, plus `ItemList` structured data                             |
| `llms.txt`                                                 | AI assistants ([llmstxt.org](https://llmstxt.org))            | Who Vick is, every project in one line with its link, experience, awards, education                                      |
| `robots.txt`                                               | Crawlers                                                      | Everyone may read everything except `/admin/`, `/api/` and `/library/`; where the sitemap is                             |
| `sitemap.xml`                                              | Crawlers                                                      | `/` and `/portfolio/`                                                                                                    |

Also by hand: the favicon and share image (`assets/ui/`), `lang="en-ZA"`, a skip link and a `<noscript>` note that both lead to `/portfolio/`, and `X-Robots-Tag: noindex` on `/admin` and `/library` (`netlify.toml`).

CI fails (`npm run generate:check`) if a generated file is out of date. Fix: `npm run generate`, commit.

## 2. Writing for search and AI

Same voice as the site (`docs/BRAND.md`), with these additions:

- **`PROFILE.title`**: under 60 characters. Name, role, place.
- **`PROFILE.description`**: under 160 characters, first person, says what's here.
- **`sum` on each project**: one plain line, under about 200 characters: what it is, Vick's role, and a result if there is one. No jokes; the card itself carries the personality. Only facts Vick supplied.
- **Image alt text**: say what the picture shows (`im('g5', 'Logo, business cards and creative CV')`).
- New facts about Vick go in `PROFILE` (from the CV or from Vick), never made up.

## 3. Content edited in /admin

`/admin` content lives in Netlify Blobs, not git, so the generated files only know what's in `src/content.js`. After a big change in `/admin`, copy it into `content.js` (or ask Claude to), then `npm run generate`. The admin keeps `sum` when it saves.

## 4. Things only a person can do

These need Vick's sign-in, so they're not automated:

1. **Google Search Console:** add `https://vick-does-creative.netlify.app/` as a URL-prefix property, verify it (an HTML meta tag in `index.html`'s `<head>` works; Claude can add it), then submit `sitemap.xml`. <https://search.google.com/search-console>
2. **Bing Webmaster Tools:** import the site from Search Console. <https://www.bing.com/webmasters>
3. **Link back:** put the site's URL on LinkedIn, Behance and Instagram profiles. Those links (and `sameAs` in the structured data) are how search engines tie them together.
4. **A custom domain** (optional): a domain of your own ranks and reads better than `*.netlify.app`. If one is added, change `PROFILE.url` and run `npm run generate`.

## 5. Check it

- Rich results: <https://search.google.com/test/rich-results> with the live URL (should find a Person / ProfilePage).
- Share preview: paste the URL into LinkedIn's Post Inspector, <https://www.linkedin.com/post-inspector/>.
- Plain version: open `/portfolio/` with JavaScript off. Everything should be there.
