# Vick Does Creative

The portfolio of **Vickhal Roopram**, a UX/UI, graphic and motion designer from South Africa, built as a 3D synthesizer you can play.

The synth is the interface. Each part of the instrument holds a different side of Vick's work. Hover to read titles, click to zoom in, and press keys to open projects.

![Three.js](https://img.shields.io/badge/three.js-r160-black) ![No build step](https://img.shields.io/badge/build-none-lightgrey)

## How it plays

| Synth part | What it holds |
| --- | --- |
| **Filter buttons**: Design · UI/UX · Motion · Tools · Experimental | Choose what the keyboard shows. The active button glows and the keys light up in its colour. |
| **Keyboard** (14 keys) | One project, tool or experiment per key. Click a key to open its card. |
| **Four big knobs** | Sound: Filter, Resonance, Decay, Echo. Drag up or down; click to hear a note. |
| **CV remote** (left) | Full CV (PDF), contact details and social links. Also plugs in when selected. |
| **Music side** (right): drum pads, Tone, Wave, BEATS, STOP, MUTE | Pure play. BEATS cycles five original tracks; STOP and BEATS glow while music runs. |

**The desk:** the synths sit on a desk next to a lamp (click it to switch it on or off) and a plant. The look is warm and plain: cream and warm-grey hardware, with one design system for the overlays. The camera starts almost top-down; click a part and it swoops down to a low, close view. Left drag rotates, right drag pans, scroll zooms. Project cards open with the work itself, then the story and a clear link to the full project.

**Header & section titles (from the Figma hover states):** the top bar carries the Vickhal Roopram logo (click to go home), the sun/moon theme icon, the sound icon and a hamburger menu (Home, About Me, My Projects, Contact, Download CV) that morphs into a cross. Hover a device and a subtle underlight fades in beneath it, like an LED strip under the hardware: red for Contact. The My Projects underlight takes the colour of the keyboard's current mode (green Design, blue UI/UX, orange Motion, purple Tools, pink Experimental, and the role knob colours) and stays on while you're in a keyboard mode. Click the device body to zoom in.

**Camera controls (bottom right):** a joystick and a zoom slider. Push the joystick to orbit: left and right swing round the synth, up and down raise or lower the view. The camera has weight: it eases up to speed and glides to a stop. Tap the joystick (or focus it and press Enter) to fly back to the resting view. Slide up to zoom in, down to zoom out; the camera follows on a spring. Both work with the keyboard (arrow keys, Page Up/Down, Home/End).

**Light & dark mode:** the sun/moon button in the top bar switches between a brushed-aluminium studio look and a gunmetal, graphite-key dark look. It follows the system setting until you pick one, and remembers your choice.

**Press feedback:** every control glows and traces a stroke of light around its edge when pressed. When you switch modes, the gaps around the keys that hold that mode's projects light up in its colour, in a wave from left to right. The HUD buttons and the project card use the same glow and stroke.

**Keyboard shortcuts:** `A`–`;` play notes, `W E T Y U O P` play sharps, `Z`–`.` play drums, `1`–`6` jump to modes, `←`/`→` page through open cards, `0` or `Esc` go home.

Mouse, trackpad and touch work too: drag to orbit, scroll or pinch to zoom. On phones the synth starts top-down, cards open as a bottom sheet, and the camera controls hide while a card is open.

## Project structure

```
.
├── index.html              # Page shell: HUD, detail card, lightbox, import map
├── admin/                  # Content admin (/admin): index.html, admin.css, admin.js
├── netlify/functions/      # Admin API: login, content (draft/live), publish, media
├── netlify/lib/cms.mts     # Shared: Blobs stores, login tokens, HTML cleaning
├── src/                    # Built atomically: each layer only imports the layers below it
│   ├── main.js             # Page: wires the layers together and runs the render loop
│   ├── content.js          # Built-in default content (used until something is published in /admin)
│   ├── cms.js              # Loads draft/live content from the admin over the defaults
│   ├── core/               # Engine: state, data (content + modes), audio (synth, drums, beats), scene (renderer, lights)
│   ├── atoms/              # geometry, textures, materials, labels
│   ├── molecules/          # fx (press glow + stroke), controls (keys, buttons, knobs), cable
│   ├── organisms/          # synth, remote, desk, underlights, screens, card, menu, intro
│   ├── page/               # camera (framing, swoops), theme (light/dark), input (pointer, keyboard, hover tip)
│   ├── styles.css          # Imports the layers below (keep this path: /admin's preview loads it)
│   └── styles/             # tokens.css, atoms.css, molecules.css, organisms.css
├── docs/HANDOFF.md        # Full project context for the next iteration
├── assets/
│   ├── img/                # Project images (g* = portfolio PDF page no., cv* = CV pages)
│   └── cv/                 # Downloadable CV
└── .github/workflows/
    └── pages.yml           # Deploys to GitHub Pages on push to main
```

## Run locally

There's no build step. The page uses native ES modules, so serve the folder over HTTP rather than opening the file directly:

```bash
python3 -m http.server 8080
# or: npx serve .
```

Then open <http://localhost:8080>. Three.js loads from jsDelivr, pinned to `three@0.160.0`.

## Content admin (`/admin`)

Projects, images and copy can be managed without touching code at **`/admin`** (password protected).

- Groups follow the synth: **filter buttons** and **role knobs** fill the 14 keys, the **CV remote** has 6 buttons, and the **screen** holds the About pages. A map shows which key, pad or button each item lands on. Drag to reorder.
- Edit titles, kicker lines, descriptions (bold, italic, headings, bullets, links, or raw HTML), images (shrunk to WebP on upload, with alt text), tags, links and skill bars, and see the card exactly as the site renders it.
- **Update preview** saves a draft that the `version-01` preview shows (https://version-01--vick-does-creative.netlify.app). **Publish to live** copies the draft to the live site. Every replaced live version is kept and can be restored from **Live versions**.
- Content is stored in Netlify Blobs (store `cms`: `draft`, `live`, `history/*`; store `media`: uploaded images, served at `/media/img/…`). If nothing has been published, the live site uses the defaults in `src/content.js`.
- **Password:** stored only as a salted scrypt hash in Blobs (`cms/auth`); change it from the admin menu (**Change password**). To reset it without the old one: `ADMIN_PASSWORD_NEW='…' node scripts/set-admin-password.mjs > /tmp/a.json && npx netlify-cli blobs:set cms auth --input /tmp/a.json && rm /tmp/a.json`. An `ADMIN_PASSWORD` environment variable, if set, takes priority.
- **Local preview:** put `ADMIN_PASSWORD=…` in a `.env` file (gitignored), run `npm install`, then `npm run dev` (Netlify Dev on port 8888). It uses a local sandbox store that never touches the real content.

## Editing content in code

All text, links and images live in **`src/content.js`**. Each channel looks like this:

```js
gd: { name: 'DESIGN', col: '#1fa957', items: [
  { t: 'Project title', k: 'Kicker line', d: '<p>Description</p>',
    img: [im('g5', 'Alt text')], tags: ['Figma'], links: [['Label', 'https://…']] },
]}
```

- **Add a project:** append an item to a channel. The next free key picks it up automatically, up to 14 per filter.
- **Add an image:** drop a `.jpg` into `assets/img/` and reference it with `im('file-name', 'alt text')`.
- **Fill an "Open slot":** replace that item in `ds`, `st`, `ar`, `te` (roles) or `xp` (experimental).

## Tech

- **Three.js r160** for the scene, with `RoundedBoxGeometry` and `OrbitControls` (desktop only)
- **Web Audio API** for a two-oscillator synth with sub-oscillator, low-pass filter, echo, synthesized drums and a 16-step sequencer for BEATS
- **Canvas textures** for the live screens: oscilloscope, persona pixel art and the remote display
- Fonts: Bungee, IBM Plex Mono and Noto Sans (Google Fonts)

## Deploy

Push to `main`. The included workflow publishes the site to GitHub Pages. Enable it once under **Settings → Pages → Source: GitHub Actions**.

## Credits

- Design and content: Vickhal Roopram, [Behance](https://www.behance.net/vickhalroopram) · [Instagram](https://www.instagram.com/vicsdoesmotion/) · [LinkedIn](https://www.linkedin.com/in/vickhal-roopram/)
- Synth form based on Vick's Figma synth design

© Vickhal Roopram. All rights reserved. Portfolio images, CV and written content may not be reused without permission.
