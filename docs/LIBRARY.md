# Design library: tokens, components, assets and re-skins

> **Who this is for:** anyone changing how the site looks or adding a piece to it.
> **See it live:** `/library/` on any deploy (e.g. <https://version-01--vick-does-creative.netlify.app/library/>). It reads the tokens and the code directly, so it can't drift.
> **Figma:** the design library file (variables, styles, components, references) is linked from the top of `/library/` once it exists (§6).
> Added 22 Nov 2026.

---

## 1. How the code is layered

Each layer only imports from the layers above it. Anything a lower layer needs from a higher one goes through `act` in `core/state.js`.

| Layer     | Folder           | What lives there                                                   | Examples                                                              |
| --------- | ---------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Core      | `src/core/`      | State, content and modes, audio, the renderer                      | `state.js`, `data.js`, `audio.js`, `scene.js`                         |
| Atoms     | `src/atoms/`     | The smallest pieces: shapes, textures, materials, icons, lettering | `craft.js` (card, paper, ink line), `icons.js`, `geometry.js`         |
| Molecules | `src/molecules/` | Pieces made of atoms                                               | `controls.js` (keys, knobs), `cable.js`, `cardhtml.js`, `toast.js`    |
| Organisms | `src/organisms/` | Whole parts of the site                                            | `synth.js`, `remote.js`, `menu.js`, `card.js`, `tour.js`, `pocket.js` |
| Page      | `src/page/`      | Camera and input                                                   | `camera.js`, `input.js`                                               |
| App       | `src/`           | Start-up and content                                               | `boot.js`, `main.js`, `content.js`, `cms.js`                          |

Every file opens with a comment that says what it is. `/library/` lists them all with their exports.

## 2. How the styles are layered

`src/styles.css` imports, in this order (later wins on a tie):

1. **`tokens.css`**: every value. Nothing else should hard-code a colour, font, size or timing that's here.
2. **`base.css`**: resets, the skip link, shared keyframes.
3. **`atoms.css` → `molecules.css` → `organisms.css`**: structure and layout of each piece.
4. **`skin.css`**: the cardboard look over the structure: paper and card faces, ink lines, cut corners, cursor, motion on twos.
5. **`tour.css`**: Bleep and the question mark. **`pocket.css`**: the phone page.

### Tokens, in seven tiers (`tokens.css`)

| Tier                   | What it holds                              | Example                                                |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------ |
| 1 · Palette            | Raw colours, named for what they are       | `--pal-kraft`, `--pal-red`                             |
| 2 · Roles              | What a colour is for. Components use these | `--ink`, `--card`, `--accent`, `--brand-red`, `--room` |
| 3 · Materials          | Photo textures from `assets/tex`           | `--paper`, `--kraft-tex`                               |
| 4 · Type               | Families and the scale                     | `--display`, `--body`, `--t-md`                        |
| 5 · Space, shape, size | Spacing, radius, hand-cut corners          | `--s4`, `--cut`, `--hdr-h`                             |
| 6 · Motion             | "On twos": stepped timing                  | `--step`, `--ease`                                     |
| 7 · Cursor             | The cardboard pointer                      | `--cur-point`                                          |

Two notes:

- `--accent` is re-tinted per project inside the card (`organisms/card.js`). For the fixed brand red use `--brand-red`.
- `--blue` is a legacy name and is red: there is one accent (Vick, Nov 2026).

## 3. Re-skin the site

1. Copy `tokens.css`. Change tier 1 (palette), tier 3 (textures), tier 4 (fonts; add `@font-face` for new fonts, self-hosted in `assets/fonts/`) and, for a different feel, tier 6 (e.g. `--step: ease` for smooth motion).
2. Keep every role name in tier 2. Point them at the new palette.
3. For a different material look, change `skin.css`. The structure files don't need to change.
4. The 3D scene has its own colours (`src/atoms/craft.js`, `src/atoms/materials.js`, `src/core/scene.js`). Change those for a full re-skin.
5. Check `/library/` (every token and UI piece), then the desk and the phone page on staging.

## 4. Add a component

1. Pick the lowest layer it fits. Start the file with a one-line comment saying what it is.
2. Use tokens, not values. Use the shared helpers: `$` and `reduceMotion` (`core/state.js`), `icon()` (`atoms/icons.js`), `toast()` (`molecules/toast.js`), `card()` and `INK` (`atoms/craft.js`).
3. Animate on twos: CSS steps automatically (skin.css); 3D redraws at `FPS` (12).
4. Run `npm run format`, `npm run lint`, `npm run check`, then `npm run generate` so `/library/` lists it.

## 5. Assets

| Folder                         | What                                                         | Rules                                                             |
| ------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| `assets/img/`                  | Project images. `g<page>` = page of the 2020 portfolio PDF   | JPEG or WebP, web-sized. Referenced with `im('name', 'alt text')` |
| `assets/tex/`                  | Card, paper, wood textures from Vick's texture library       | Used through tokens (tier 3) and `atoms/craft.js`                 |
| `assets/ui/`                   | Logo, favicon, share image, cursor, phone synth sprite       | `og-image.jpg` is 1200 × 630                                      |
| `assets/fonts/`                | Londrina Solid, Patrick Hand (SIL OFL, licences beside them) | Self-hosted                                                       |
| `assets/beats/`, `assets/vid/` | Vick's tracks, motion loops, project videos                  | Under 10 MiB each; originals in Google Drive (_Synth Elementa_)   |

Every file needs alt text where it's shown. `/library/` shows each asset's size, pixel size and which files use it, and marks any that nothing in the code references (`g11.jpg` and `g12.jpg` at the time of writing; check `/admin` content before deleting them).

## 6. Figma

The Figma design library mirrors this file: tier 1 and 2 tokens as variables, type styles, the UI pieces as components, the icon set, textures, and a references page with every visual source and where it was used. Code is the source of truth for values: when they differ, update Figma from `tokens.css`.

Visual sources (also in HANDOFF.md §6): the original synth design in Figma (`gXh33LpoadWI0B76ofjD56`), pradiplabs.dev (desk set-up), portfolio-zxc.com (playful redesign), juliamoresco.com.br (phone office), Pinterest industrial-design references (press effects), Teenage Engineering (materials), coolicons (icons).
