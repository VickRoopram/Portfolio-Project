# Vick Does Creative

The portfolio of **Vickhal Roopram**, a UX/UI, illustration and motion designer from South Africa, built as a cardboard synthesizer you can play.

Live: <https://vick-does-creative.netlify.app> · Staging: <https://version-01--vick-does-creative.netlify.app> · Plain version: [`/portfolio/`](https://vick-does-creative.netlify.app/portfolio/)

![Three.js](https://img.shields.io/badge/three.js-r160-black) ![No build step](https://img.shields.io/badge/build-none-lightgrey) ![Netlify](https://img.shields.io/badge/host-Netlify-00ad9f)

## How it plays

| Part                                                             | What it does                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Welcome sheet**                                                | The loader: the site is sketched in pencil while it loads. Press **Enter** or scroll.            |
| **Mode buttons**: Design · UI/UX · Motion · Tools · Experimental | Choose what the keys hold. Each key opens one project card.                                      |
| **Four big knobs**                                               | Sound: Filter, Resonance, Decay, Echo.                                                           |
| **Remote** (left)                                                | Contact, CV and social links. The header's **Contact** button flies here.                        |
| **Music side**: pads, BEATS, STOP, MUTE                          | BEATS plays Vick's tracks with his motion backgrounds.                                           |
| **Play** (header)                                                | Clears the portfolio away: loop, record and jam. **Back** returns.                               |
| **Around the desk**                                              | Polaroids, a to-do note, a plant with a life cycle, a lamp.                                      |
| **?** (bottom left)                                              | Bleep, a wooden TV, gives the tour.                                                              |
| **Menu**                                                         | A tray of boxes: Home, About, Projects, Contact.                                                 |
| **Phone**                                                        | Upright: Vick's office as one wall, with boxes as the menu. Turned sideways: the playable synth. |

Mouse, trackpad and touch: drag to turn, right-drag to pan, scroll or pinch to zoom; the joystick does the same. Keys: `A`–`;` notes, `W E T Y U O P` sharps, `Z`–`.` drums, `1`–`6` modes, `←`/`→` page cards, `Esc` back.

## Run it

No build step: native ES modules, three.js from jsDelivr (`three@0.160.0`).

```bash
npm install        # only the admin's functions need packages
npm run setup      # once per clone: git hooks that stop commits and pushes to main
npm run dev        # Netlify Dev with the admin functions: http://localhost:8888
```

## Scripts

| Command                   | What it does                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm run check`           | Repo checks: JS syntax, broken imports and links, conflict markers, file sizes, secrets, JSON               |
| `npm run format`          | Formats everything with Prettier (`.prettierrc.json`). `format:check` checks only                           |
| `npm run lint`            | ESLint, built-in rules only (`eslint.config.js`): undefined names, unused variables, common bugs            |
| `npm run generate`        | Writes the search and AI files from `src/content.js`, and the library manifest ([docs/SEO.md](docs/SEO.md)) |
| `npm run generate:check`  | Fails if those files are stale                                                                              |
| `npm run check:functions` | Loads every Netlify Function (after `npm install`)                                                          |

CI runs all of these on every pull request ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Where to change what

| To change…                         | Edit                                                                       | Then                                        |
| ---------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| Projects, copy, images             | `src/content.js`, or `/admin` (no code)                                    | `npm run generate` if you edited content.js |
| Who Vick is (search, AI, CV facts) | `PROFILE` in `src/content.js`                                              | `npm run generate`                          |
| Colours, fonts, spacing, motion    | `src/styles/tokens.css` (the only place for values)                        | Check `/library/`                           |
| A whole new skin                   | tokens.css plus `src/styles/skin.css` ([docs/LIBRARY.md](docs/LIBRARY.md)) | Check `/library/` and staging               |
| The words and voice                | [docs/BRAND.md](docs/BRAND.md) first                                       |                                             |

## Project structure

```
.
├── index.html               Page shell: header, card, menu, tour, welcome sheet. <head> SEO block is generated
├── src/                     Built atomically: each layer only imports the ones above it
│   ├── boot.js              Desk (main.js) or phone page (organisms/pocket.js)
│   ├── main.js              Wires the layers and runs the render loop (on twos: 12 pictures a second)
│   ├── content.js           Content: CH (projects by mode), LINKS, MENU, DESK, PROFILE
│   ├── cms.js               Applies /admin content over content.js
│   ├── core/                state, data, audio, scene
│   ├── atoms/               geometry, textures, materials, labels, icons, craft (card, paper, ink), sketch
│   ├── molecules/           controls, cable, fx, card markup, toast, eraser
│   ├── organisms/           synth, remote, desk, keepsakes, screens, card, menu, tour, jam, pocket, …
│   ├── page/                camera, input
│   ├── styles.css           Imports the stylesheets in order (keep this path: /admin loads it)
│   └── styles/              tokens → base → atoms → molecules → organisms → skin → tour → pocket
├── portfolio/               /portfolio/: the whole portfolio as one plain page (generated) + its CSS
├── library/                 /library/: the design library, read live from the code (noindex)
├── llms.txt · robots.txt · sitemap.xml    Generated for search engines and AI assistants
├── admin/                   Content admin (/admin)
├── netlify/                 functions/ (admin API) and lib/cms.mts (Blobs storage, auth, cleaning)
├── assets/                  img, tex (textures), ui (logo, icons, cursor), fonts, beats, vid
├── scripts/                 ci-check, ci-functions, smoke-check, generate, set-admin-password
├── tools/                   admin-artifact (Claude artifact admin), phone-synth (sprite renderer)
├── docs/                    HANDOFF, BRAND, GIT-WORKFLOW, LIBRARY, SEO
└── .github/                 CI, Dependabot, PR template
```

## Content admin (`/admin`)

Projects, images and copy can be edited at `/admin` (password protected). **Update preview** saves a draft that staging shows; **Publish to live** sends it to production and keeps the old version in **Live versions**. Content is stored in Netlify Blobs (`cms`: `draft`, `live`, `history/*`; `media`: uploaded images at `/media/img/…`); until something is published the site uses `src/content.js`. Full guide: `docs/HANDOFF.md` §0 and §10.

## Deploy

Netlify deploys from git: `main` is production, `version-01` is staging. Work on a branch from `version-01`, open a PR into it, review staging, then open a PR from `version-01` into `main`. Rules and checklists: [docs/GIT-WORKFLOW.md](docs/GIT-WORKFLOW.md).

## Credits

- Design and content: Vickhal Roopram · [Behance](https://www.behance.net/vickhalroopram) · [Instagram](https://www.instagram.com/vicsdoesmotion/) · [LinkedIn](https://www.linkedin.com/in/vickhal-roopram/)
- Fonts: Londrina Solid and Patrick Hand (SIL Open Font Licence, `assets/fonts/`) · Icons: coolicons

© Vickhal Roopram. All rights reserved. Portfolio images, CV and written content may not be reused without permission.
